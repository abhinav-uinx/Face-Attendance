import React, { useState, useEffect } from "react";
import supabase from "../../../utils/supabase";
import style from "./viewHOD.module.css";

const ViewHOD = () => {
  const [tutors, setTutors] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [editingTutor, setEditingTutor] = useState(null);

  useEffect(() => {
    getTutors();
    getDesignations();
  }, []);

  async function getTutors() {
    const { data, error } = await supabase
      .from("tbl_tutor")
      .select(`
        tutor_id,
        tutor_name,
        tutor_email,
        tutor_contact,
        designation_id,
        department_id,
        tbl_department (department_id, department_name)
      `)
      .eq("designation_id", 100);

    if (error) {
      console.error("Error fetching tutors:", error.message);
    } else {
      setTutors(data);
    }
  }

  async function getDesignations() {
    const { data, error } = await supabase.from("tbl_designation").select("*");

    if (error) {
      console.error("Error fetching designations:", error.message);
    } else {
      setDesignations(data);
    }
  }

  async function updateDesignation(tutorId, newDesignationId) {
    const { error } = await supabase
      .from("tbl_tutor")
      .update({ designation_id: newDesignationId })
      .eq("tutor_id", tutorId);

    if (error) {
      console.error("Error updating designation:", error.message);
    } else {
      setEditingTutor(null);
      getTutors();
    }
  }

  return (
    <div className={style.color}>
      <h2 className={style.title}>Tutors with Designation ID: 100</h2>

      <div className={style.tableContainer}>
        <table className={style.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Register Number</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Department</th>
              <th> Designation</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tutors.length > 0 ? (
              tutors.map((tutor) => (
                <tr key={tutor.tutor_id}>
                  <td>{tutor.tutor_name}</td>
                  <td>{tutor.tutor_id}</td>
                  <td>{tutor.tutor_email}</td>
                  <td>{tutor.tutor_contact}</td>
                  <td>{tutor.tbl_department?.department_name || "N/A"}</td>
                  <td>
                    {editingTutor === tutor.tutor_id ? (
                      <select
                        value={tutor.designation_id}
                        onChange={(e) =>
                          updateDesignation(tutor.tutor_id, e.target.value)
                        }
                      >
                        {designations.map((designation) => (
                          <option
                            key={designation.designation_id}
                            value={designation.designation_id}
                          >
                            {designation.designation_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>
                        {designations.find((d) => d.designation_id === tutor.designation_id)?.designation_name || "N/A"}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className={style.editButton}
                      onClick={() =>
                        setEditingTutor(editingTutor === tutor.tutor_id ? null : tutor.tutor_id)
                      }
                    >
                      {editingTutor === tutor.tutor_id ? "Save" : "Edit"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className={style.noData}>
                <td colSpan="7">No tutors found with designation ID 100.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewHOD;
