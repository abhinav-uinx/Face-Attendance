import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Container,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabase";

const StudentProfileEdit = () => {
  const [student, setStudent] = useState({
    student_id: "",
    student_name: "",
    student_email: "",
    student_password: "",
    confirm_password: "",
    student_photo: "",
  });

  const [originalStudent, setOriginalStudent] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;

    if (!email) {
      console.error("No user email found.");
      return;
    }

    const { data, error } = await supabase
      .from("tbl_student")
      .select("*")
      .eq("stud_email", email)
      .maybeSingle();

    if (error) {
      console.error("Fetch error:", error);
      return;
    }

    if (!data) {
      console.warn("No student found for email:", email);
      return;
    }

    setStudent({
      student_id: data.student_id,
      student_name: data.student_name,
      student_email: data.stud_email,
      student_password: "",
      confirm_password: "",
      student_photo: data.stud_photo,
    });

    setOriginalStudent(data);

    // ✅ Handle both relative and full URLs
    if (data.stud_photo) {
      if (data.stud_photo.startsWith("http")) {
        setPhotoUrl(data.stud_photo);
      } else {
        const { data: urlData } = supabase.storage
          .from("attendance")
          .getPublicUrl(data.stud_photo);
        setPhotoUrl(urlData.publicUrl);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStudent((prev) => ({ ...prev, [name]: value }));
  };

  const isChanged = () => {
    if (!originalStudent) return false;
    return (
      student.student_name !== originalStudent.student_name ||
      student.student_email !== originalStudent.stud_email ||
      student.student_password
    );
  };

  const handleUpdate = async () => {
    setLoading(true);

    if (!isChanged()) {
      setSnack({ open: true, message: "No changes made", severity: "info" });
      setLoading(false);
      return;
    }

    if (
      student.student_password &&
      student.student_password !== student.confirm_password
    ) {
      setSnack({
        open: true,
        message: "Passwords do not match",
        severity: "error",
      });
      setLoading(false);
      return;
    }

    const authUpdate = {};
    if (student.student_password)
      authUpdate.password = student.student_password;
    if (student.student_email !== originalStudent.stud_email)
      authUpdate.email = student.student_email;

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await supabase.auth.updateUser(authUpdate);
      if (authError) {
        setSnack({
          open: true,
          message: "Auth update failed",
          severity: "error",
        });
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase
      .from("tbl_student")
      .update({
        student_name: student.student_name,
        stud_email: student.student_email,
      })
      .eq("student_id", student.student_id);

    if (error) {
      console.error("Update error:", error.message);
      setSnack({
        open: true,
        message: "Profile update failed",
        severity: "error",
      });
    } else {
      setSnack({
        open: true,
        message: "Profile updated successfully",
        severity: "success",
      });
      setTimeout(() => navigate(-1), 1000);
    }

    setLoading(false);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Edit Student Profile
      </Typography>

      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}
      >
        <Avatar
          src={photoUrl}
          onError={(e) => (e.target.src = "/default-profile.jpg")}
          sx={{ width: 100, height: 100, mb: 2 }}
        />
      </Box>

      <TextField
        fullWidth
        margin="normal"
        name="student_name"
        label="Name"
        value={student.student_name}
        onChange={handleInputChange}
      />

      <TextField
        fullWidth
        margin="normal"
        name="student_email"
        label="Email"
        type="email"
        value={student.student_email}
        onChange={handleInputChange}
      />

      <TextField
        fullWidth
        margin="normal"
        name="student_password"
        label="New Password"
        type="password"
        value={student.student_password}
        onChange={handleInputChange}
        placeholder="Leave blank to keep current password"
      />

      <TextField
        fullWidth
        margin="normal"
        name="confirm_password"
        label="Confirm Password"
        type="password"
        value={student.confirm_password}
        onChange={handleInputChange}
      />

      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpdate}
          disabled={loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : "Save Changes"}
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={handleCancel}
          fullWidth
          disabled={loading}
        >
          Cancel
        </Button>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default StudentProfileEdit;
