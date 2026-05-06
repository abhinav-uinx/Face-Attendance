import React, { useState, useEffect } from "react";
import { 
  TextField, 
  Button, 
  Alert,
  CircularProgress,
  Avatar
} from "@mui/material";
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import supabase from "../utils/supabase";
import style from "./adminProfileEdit.module.css";

const AdminProfileEdit = () => {
  const [admin, setAdmin] = useState({
    admin_name: "",
    admin_email: "",
    admin_password: "",
    confirm_password: "",
    admin_photo: ""
  });
  const [loading, setLoading] = useState({
    form: false,
    photo: false
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [userId, setUserId] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    fetchAdminDetails();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdmin(prev => ({ ...prev, [name]: value }));
  };

  const fetchAdminDetails = async () => {
    setLoading(prev => ({ ...prev, form: true }));
    try {
      let currentId = null;
      let currentEmail = null;

      // 1. Check for official user
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      
      if (user) {
        currentId = user.id;
        currentEmail = user.email;
      } else {
        // 2. Fallback to Emergency Bypass
        const storedAid = sessionStorage.getItem("aid");
        if (storedAid) {
          currentId = storedAid;
          currentEmail = "admin@gmail.com";
        }
      }

      if (!currentId) throw new Error("Please log in first.");

      setUserId(currentId);

      // 3. Fetch Profile
      let query = supabase.from("tbl_admin").select("admin_name, admin_email, admin_photo");
      
      if (currentId.includes("-") && currentId.length > 20) {
        query = query.eq("admin_id", currentId);
      } else {
        query = query.eq("admin_email", currentEmail);
      }

      const { data, error, status } = await query.maybeSingle();
      
      if (error || status === 406) {
        const errorMsg = error?.message || "Status 406: Access Denied (RLS is likely ON)";
        console.error("DB Error:", errorMsg);
        throw new Error(`DATABASE LOCKED: Please disable RLS on tbl_admin in Supabase. (${errorMsg})`);
      }

      if (!data) {
        throw new Error("No admin profile found. Please ensure your email 'admin@gmail.com' exists in tbl_admin.");
      }

      setAdmin({
        admin_name: data.admin_name,
        admin_email: data.admin_email,
        admin_password: "",
        confirm_password: "",
        admin_photo: data.admin_photo || ""
      });

      if (data.admin_photo) setPhotoPreview(data.admin_photo);

    } catch (error) {
      console.error("Profile Load Error:", error.message);
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, form: true }));
    setMessage({ type: "", text: "" });

    try {
      const { error: dbError } = await supabase
        .from("tbl_admin")
        .update({ admin_name: admin.admin_name })
        .eq("admin_email", admin.admin_email);

      if (dbError) throw dbError;
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(prev => ({ ...prev, photo: true }));
    try {
      setPhotoPreview(URL.createObjectURL(file));
      const filePath = `profile_photos/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('admin')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('admin').getPublicUrl(filePath);

      await supabase.from('tbl_admin').update({ admin_photo: publicUrl }).eq('admin_email', admin.admin_email);
      setAdmin(prev => ({ ...prev, admin_photo: publicUrl }));
      setMessage({ type: "success", text: "Photo updated!" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(prev => ({ ...prev, photo: false }));
    }
  };

  return (
    <div className={style.page}>
      <div className={style.header}>
        <span>Account Settings</span>
        <h2>Edit Profile</h2>
      </div>
      
      {message.text && (
        <Alert severity={message.type} className={style.alert}>{message.text}</Alert>
      )}

      <div className={style.contentGrid}>
        <section className={style.photoCard}>
          <Avatar src={photoPreview} className={style.avatar} sx={{ width: 100, height: 100 }}>
            {!photoPreview && admin.admin_name && admin.admin_name.charAt(0).toUpperCase()}
          </Avatar>
          <div className={style.photoText}>
            <h3>{admin.admin_name || "Admin"}</h3>
            <p>{admin.admin_email || "System Administrator"}</p>
          </div>
          <input accept="image/*" id="photo-upload" type="file" style={{ display: 'none' }} onChange={handlePhotoChange} />
          <label htmlFor="photo-upload">
            <Button component="span" variant="outlined" startIcon={<PhotoCamera />} disabled={loading.photo}>
              {loading.photo ? <CircularProgress size={20} /> : "Update Photo"}
            </Button>
          </label>
        </section>

        <form onSubmit={handleUpdate} className={style.formCard}>
          <TextField fullWidth label="Full Name" name="admin_name" value={admin.admin_name} onChange={handleChange} required margin="normal" />
          <TextField fullWidth label="Email" name="admin_email" value={admin.admin_email} disabled margin="normal" />
          <Button type="submit" variant="contained" fullWidth disabled={loading.form} className={style.primaryButton} sx={{ mt: 3 }}>
            {loading.form ? <CircularProgress size={22} /> : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminProfileEdit;
