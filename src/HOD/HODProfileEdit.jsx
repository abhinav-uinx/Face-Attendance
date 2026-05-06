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

const HODProfileEdit = () => {
  const [hod, setHod] = useState({
    tutor_id: "",
    tutor_name: "",
    tutor_email: "",
    tutor_password: "",
    confirm_password: "",
    tutor_photo: "",
  });
  const [originalHod, setOriginalHod] = useState(null);
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
    fetchHodData();
  }, []);

  const fetchHodData = async () => {
    const hodEmail = sessionStorage.getItem("hod_email");

    const { data, error } = await supabase
      .from("tbl_tutor")
      .select("*")
      .eq("tutor_email", hodEmail)
      .single();

    if (data) {
      setHod({
        ...data,
        tutor_password: "",
        confirm_password: "",
      });
      setOriginalHod(data);
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
    setHod((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setNewPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  };

  const isChanged = () => {
    if (!originalHod) return false;
    return (
      hod.tutor_name !== originalHod.tutor_name ||
      hod.tutor_email !== originalHod.tutor_email ||
      hod.tutor_password ||
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

    if (hod.tutor_password && hod.tutor_password !== hod.confirm_password) {
      setSnack({
        open: true,
        message: "Passwords do not match",
        severity: "error",
      });
      setLoading(false);
      return;
    }

    let photoPath = hod.tutor_photo;

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
    if (hod.tutor_password) {
      authUpdate.password = hod.tutor_password;
    }
    if (hod.tutor_email !== originalHod.tutor_email) {
      authUpdate.email = hod.tutor_email;
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
        tutor_name: hod.tutor_name,
        tutor_email: hod.tutor_email,
        tutor_photo: photoPath,
      })
      .eq("tutor_id", hod.tutor_id);

    if (error) {
      console.error("Update error:", error.message);
      setSnack({ open: true, message: "Profile update failed", severity: "error" });
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
      <Typography variant="h4" gutterBottom>Edit HOD Profile</Typography>

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
        value={hod.tutor_name}
        onChange={handleInputChange}
      />

      <TextField
        fullWidth
        margin="normal"
        name="tutor_email"
        label="Email"
        type="email"
        value={hod.tutor_email}
        onChange={handleInputChange}
      />

      <TextField
        fullWidth
        margin="normal"
        name="tutor_password"
        label="New Password"
        type="password"
        value={hod.tutor_password}
        onChange={handleInputChange}
        placeholder="Leave blank to keep current password"
      />

      <TextField
        fullWidth
        margin="normal"
        name="confirm_password"
        label="Confirm Password"
        type="password"
        value={hod.confirm_password}
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

export default HODProfileEdit;
