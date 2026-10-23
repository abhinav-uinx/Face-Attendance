import React, { useEffect, useMemo, useState } from "react";
import style from "./complaint.module.css";
import supabase from "../../../utils/supabase";

const ComplaintCard = ({ complaint, onComplete, completed = false }) => (
  <div className={completed ? style.completedItem : style.complaintItem}>
    <div className={style.cardTop}>
      <strong>{complaint.tbl_student?.student_name || "N/A"}</strong>
      <span className={completed ? style.completedBadge : style.pendingBadge}>{complaint.status}</span>
    </div>
    <p className={style.complaintText}>{complaint.complaint_text}</p>
    <dl>
      <div>
        <dt>Register No</dt>
        <dd>{complaint.tbl_student?.student_id || "N/A"}</dd>
      </div>
      <div>
        <dt>Department</dt>
        <dd>{complaint.tbl_student?.tbl_department?.department_name || "N/A"}</dd>
      </div>
      <div>
        <dt>Programme</dt>
        <dd>{complaint.tbl_student?.tbl_programme?.programme_name || "N/A"}</dd>
      </div>
      <div>
        <dt>Year</dt>
        <dd>{complaint.tbl_student?.tbl_year?.year_name || "N/A"}</dd>
      </div>
      <div>
        <dt>Date</dt>
        <dd>{new Date(complaint.created_at).toLocaleDateString()}</dd>
      </div>
    </dl>
    {!completed && (
      <button className={style.updateButton} onClick={() => onComplete(complaint.id)}>
        Mark as Completed
      </button>
    )}
  </div>
);

const Complaint = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const { data, error } = await supabase
          .from("tbl_complaints")
          .select(`
            id,
            complaint_text,
            status,
            created_at,
            tbl_student(student_name, student_id,
              tbl_year(year_name),
              tbl_department(department_name),
              tbl_programme(programme_name)
            )
          `)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching complaints:", error);
        } else {
          setComplaints(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const groupedComplaints = useMemo(
    () => ({
      pending: complaints.filter((complaint) => complaint.status === "pending"),
      completed: complaints.filter((complaint) => complaint.status === "completed"),
    }),
    [complaints]
  );

  const handleStatusUpdate = async (id) => {
    try {
      const { error } = await supabase
        .from("tbl_complaints")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) {
        console.error("Error updating status:", error);
      } else {
        setComplaints((prev) =>
          prev.map((complaint) =>
            complaint.id === id ? { ...complaint, status: "completed" } : complaint
          )
        );
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  if (loading) return <div className={style.loading}>Loading complaints...</div>;

  return (
    <div className={style.container}>
      <div className={style.header}>
        <span>Student Support</span>
        <h2>Complaints</h2>
      </div>

      <section className={style.section}>
        <div className={style.sectionTitle}>
          <h3>Pending Complaints</h3>
          <span>{groupedComplaints.pending.length} open</span>
        </div>
        <div className={style.cardGrid}>
          {groupedComplaints.pending.length > 0 ? (
            groupedComplaints.pending.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} onComplete={handleStatusUpdate} />
            ))
          ) : (
            <div className={style.emptyState}>No pending complaints.</div>
          )}
        </div>
      </section>

      <section className={style.section}>
        <div className={style.sectionTitle}>
          <h3>Completed Complaints</h3>
          <span>{groupedComplaints.completed.length} resolved</span>
        </div>
        <div className={style.cardGrid}>
          {groupedComplaints.completed.length > 0 ? (
            groupedComplaints.completed.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} completed />
            ))
          ) : (
            <div className={style.emptyState}>No completed complaints.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Complaint;
