import React, { useState, useEffect } from "react";
import style from "./complaint.module.css"; // Import the CSS module
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import supabase from "../../utils/supabase";

export default function ComplaintPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [complaint, setComplaint] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pendingComplaints, setPendingComplaints] = useState([]);
  const [completedComplaints, setCompletedComplaints] = useState([]);

  const studentId = sessionStorage.getItem("student_id");

  useEffect(() => {
    if (!studentId) return;

    const fetchComplaints = async () => {
      try {
        let { data, error } = await supabase
          .from("tbl_complaints")
          .select("complaint_text, status, created_at")
          .eq("student_id", studentId);

        if (error) throw error;

        const pending = data.filter((item) => item.status === "pending");
        const completed = data.filter((item) => item.status === "completed");

        setPendingComplaints(pending);
        setCompletedComplaints(completed);
      } catch (err) {
        console.error("Error fetching complaints:", err.message);
      }
    };

    fetchComplaints();
  }, [studentId, submitted]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentId) {
      alert("Please log in again to submit a complaint.");
      return;
    }

    try {
      const { error } = await supabase
        .from("tbl_complaints")
        .insert([{ student_id: studentId, complaint_text: complaint, status: "pending" }]);

      if (error) throw error;

      setSubmitted(true);
      setComplaint("");
      setActiveTab("pending");
    } catch (err) {
      console.error("Error submitting complaint:", err.message);
      alert("Failed to submit complaint. Please try again.");
    }
  };

  return (
    <Container maxWidth="md" className={style.container}>
      {/* Sidebar Navigation */}
      <div className={style.sidebar}>
        <Typography variant="h6" gutterBottom>
          Complaint Menu
        </Typography>
        <List>
          <ListItem
            component="div"
            selected={activeTab === "pending"}
            onClick={() => setActiveTab("pending")}
            className={`${style.listItem} ${activeTab === "pending" ? style.selected : ""}`}
            sx={{ cursor: "pointer" }}
          >
            <ListItemText primary="Pending Complaints" />
          </ListItem>

          <ListItem
            component="div"
            selected={activeTab === "completed"}
            onClick={() => setActiveTab("completed")}
            className={`${style.listItem} ${activeTab === "completed" ? style.selected : ""}`}
            sx={{ cursor: "pointer" }}
          >
            <ListItemText primary="Completed Complaints" />
          </ListItem>

          <ListItem
            component="div"
            selected={activeTab === "write"}
            onClick={() => setActiveTab("write")}
            className={`${style.listItem} ${activeTab === "write" ? style.selected : ""}`}
            sx={{ cursor: "pointer" }}
          >
            <ListItemText primary="Write a Complaint" />
          </ListItem>
        </List>
      </div>

      {/* Main Content Area */}
      <div className={style.mainContent}>
        <Card elevation={5} className={style.card}>
          <CardContent>
            {activeTab === "pending" && (
              <>
                <Typography variant="h4" gutterBottom className={style.heading}>
                  Pending Complaints
                </Typography>
                {pendingComplaints.length > 0 ? (
                  pendingComplaints.map((complaint, index) => (
                    <div key={index} className={style.complaintItem}>
                      <Typography variant="body1" className={style.complaintText}>
                        {complaint.complaint_text}
                      </Typography>
                      <Typography variant="caption" className={style.complaintDate}>
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </Typography>
                      <Divider className={style.divider} />
                    </div>
                  ))
                ) : (
                  <Typography className={style.noComplaints}>No pending complaints.</Typography>
                )}
              </>
            )}

            {activeTab === "completed" && (
              <>
                <Typography variant="h4" gutterBottom className={style.heading}>
                  Completed Complaints
                </Typography>
                {completedComplaints.length > 0 ? (
                  completedComplaints.map((complaint, index) => (
                    <div key={index} className={style.complaintItem}>
                      <Typography variant="body1" className={style.complaintText}>
                        {complaint.complaint_text}
                      </Typography>
                      <Typography variant="caption" className={style.complaintDate}>
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </Typography>
                      <Divider className={style.divider} />
                    </div>
                  ))
                ) : (
                  <Typography className={style.noComplaints}>No completed complaints.</Typography>
                )}
              </>
            )}

            {activeTab === "write" && (
              <>
                <Typography variant="h4" gutterBottom align="center" className={style.heading}>
                  Submit a Complaint
                </Typography>
                {submitted ? (
                  <Typography variant="body1" align="center" className={style.successMessage}>
                    Your complaint has been submitted successfully!
                  </Typography>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      variant="outlined"
                      label="Your Complaint"
                      value={complaint}
                      onChange={(e) => setComplaint(e.target.value)}
                      placeholder="Describe your issue here..."
                      required
                      style={{ marginBottom: "1rem" }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      className={style.submitButton}
                    >
                      Submit
                    </Button>
                  </form>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
