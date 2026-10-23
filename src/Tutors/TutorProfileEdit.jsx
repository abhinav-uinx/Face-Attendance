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
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabase";

const TutorProfileEdit = () => {
  const [tutor, setTutor] = useState({
    tutor_id: "",
    tutor_name: "",
    tutor_email: "",
    tutor_password: "",
    confirm_password: "",
    tutor_photo: "",
  });
  const [originalTutor, setOriginalTutor] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchTutorData();
  }, []);

  const fetchTutorData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;

    const { data, error } = await supabase
      .from("tbl_tutor")
      .select("*")
      .eq("tutor_email", email)
      .single();

    if (data) {
      setTutor({
        ...data,
        tutor_password: "",
        confirm_password: "",
      });
      setOriginalTutor(data); // Store original data to compare later
      if (data.tutor_photo) {
        const { data: urlData } = supabase.storage
          .from("tutor")
          .getPublicUrl(data.tutor_photo);
        setPhotoUrl(urlData.publicUrl);
      }
    }
    if (error) console.error("Fetch error:", error);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTutor((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setNewPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  };

  const isChanged = () => {
    if (!originalTutor) return false;
    return (
      tutor.tutor_name !== originalTutor.tutor_name ||
      tutor.tutor_email !== originalTutor.tutor_email ||
      tutor.tutor_password ||
      newPhotoFile
    );
  };

  const handleUpdate = async () => {
    setLoading(true);

    if (!isChanged()) {
      setSnack({ open: true, message: "No changes made", severity: "info" });
      setLoading(false);
      return;
    }

    if (tutor.tutor_password && tutor.tutor_password !== tutor.confirm_password) {
      setSnack({
        open: true,
        message: "Passwords do not match",
        severity: "error",
      });
      setLoading(false);
      return;
    }

    let photoPath = tutor.tutor_photo;

    if (newPhotoFile) {
      const fileExt = newPhotoFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `tutor_photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("tutor")
        .upload(filePath, newPhotoFile);

      if (uploadError) {
        console.error("Photo upload error:", uploadError.message);
        setSnack({ open: true, message: "Photo upload failed", severity: "error" });
        setLoading(false);
        return;
      }

      photoPath = filePath;
    }

    const authUpdate = {};
    if (tutor.tutor_password) {
      authUpdate.password = tutor.tutor_password;
    }
    if (tutor.tutor_email !== originalTutor.tutor_email) {
      authUpdate.email = tutor.tutor_email;
    }

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await supabase.auth.updateUser(authUpdate);
      if (authError) {
        setSnack({ open: true, message: "Auth update failed", severity: "error" });
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase
      .from("tbl_tutor")
      .update({
        tutor_name: tutor.tutor_name,
        tutor_email: tutor.tutor_email,
        tutor_photo: photoPath,
      })
      .eq("tutor_id", tutor.tutor_id);

    if (error) {
      console.error("Update error:", error.message);
      setSnack({ open: true, message: "Profile update failed", severity: "error" });
    } else {
      setSnack({
        open: true,
        message: "Profile updated successfully",
        severity: "success",
      });
      setTimeout(() => navigate(-1), 1000); // Navigate back after success
    }

    setLoading(false);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Edit Tutor Profile</Typography>

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
        <Avatar
          src={photoUrl || "/default-profile.jpg"}
          sx={{ width: 100, height: 100, mb: 2 }}
        />
        <input
          accept="image/*"
          style={{ display: "none" }}
          id="photo-upload"
          type="file"
          onChange={handlePhotoChange}
        />
        <label htmlFor="photo-upload">
          <Button component="span" variant="outlined" startIcon={<PhotoCamera />}>
            Upload Photo
          </Button>
        </label>
      </Box>

      <TextField
        fullWidth
        margin="normal"
        name="tutor_name"
        label="Name"
        value={tutor.tutor_name}
        onChange={handleInputChange}
      />

      <TextField
        fullWidth
        margin="normal"
        name="tutor_email"
        label="Email"
        type="email"
        value={tutor.tutor_email}
        onChange={handleInputChange}
      />

      <TextField
        fullWidth
        margin="normal"
        name="tutor_password"
        label="New Password"
        type="password"
        value={tutor.tutor_password}
        onChange={handleInputChange}
        placeholder="Leave blank to keep current password"
      />

      <TextField
        fullWidth
        margin="normal"
        name="confirm_password"
        label="Confirm Password"
        type="password"
        value={tutor.confirm_password}
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

export default TutorProfileEdit;
