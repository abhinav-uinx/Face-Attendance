import React, { useState, useEffect } from "react";
import style from './addStudents.module.css';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import supabase from '../../../utils/supabase';

// Helper to convert and compress image to base64 Data URL
const compressImage = (file, maxWidth = 800, quality = 0.85) => {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

const AddStudents = () => {
  const [formData, setFormData] = useState({
    photo: "",
    name: "",
    department: "",
    programme: "",
    year: "",
    phone: "",
    email: "",
    password: "",
    registerNumber: "",
    gender: "",
  });

  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [years, setYears] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    getDepartments();
    getYears();
  }, []);

  async function getDepartments() {
    const { data, error } = await supabase.from("tbl_department").select();
    if (error) console.error("Error fetching departments:", error);
    else setDepartments(data);
  }

  async function getYears() {
    const { data, error } = await supabase.from("tbl_year").select();
    if (error) console.error("Error fetching years:", error);
    else setYears(data);
  }

  async function getProgrammes(departmentId) {
    const { data, error } = await supabase.from("tbl_programme").select().eq("department_id", departmentId);
    if (error) console.error("Error fetching programmes:", error);
    else setProgrammes(data);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDepartmentChange = (e) => {
    const departmentId = e.target.value;
    setFormData({ ...formData, department: departmentId, programme: "" });
    getProgrammes(departmentId);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, photo: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      let photoUrl = null;

      if (formData.photo) {
        const fileExt = formData.photo.name ? formData.photo.name.split('.').pop() : 'jpg';
        const fileName = `${formData.registerNumber}.${fileExt}`;
        const filePath = `students/${fileName}`;

        // Attempt upload to Supabase Storage
        try {
          const { error: uploadError } = await supabase.storage
            .from("attendance")
            .upload(filePath, formData.photo, { upsert: true });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("attendance")
              .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
              photoUrl = publicUrlData.publicUrl;
            }
          } else {
            console.warn("Storage upload skipped (RLS restriction), falling back to optimized Base64:", uploadError.message);
          }
        } catch (storageErr) {
          console.warn("Storage upload exception, falling back to Base64:", storageErr);
        }

        // If storage upload was blocked by RLS or returned no URL, use compressed Base64 Data URL
        if (!photoUrl) {
          photoUrl = await compressImage(formData.photo);
        }
      }

      // Upsert student details into tbl_student (handles retry or conflict seamlessly)
      const { data, error } = await supabase.from("tbl_student").upsert([{
        student_name: formData.name.trim(),
        stud_contact: formData.phone.trim(),
        stud_password: formData.password,
        stud_email: formData.email.trim().toLowerCase(),
        student_id: formData.registerNumber.trim(),
        year_id: formData.year,
        department_id: formData.department,
        programme_id: formData.programme,
        stud_gender: formData.gender,
        stud_photo: photoUrl,
      }], { onConflict: "student_id" });

      if (error) {
        if (error.code === "23505" || error.message?.includes("duplicate")) {
          if (error.message?.includes("stud_email")) {
            throw new Error(`A student with email "${formData.email}" already exists.`);
          }
          throw new Error(`A student with Register Number "${formData.registerNumber}" already exists.`);
        }
        throw error;
      }

      console.log("Student Data Submitted successfully:", data);
      setFeedback({ type: "success", message: `Student "${formData.name}" added successfully!` });
      alert(`Student "${formData.name}" added successfully!`);

      // Reset form after submission
      setFormData({
        photo: "",
        name: "",
        department: "",
        programme: "",
        year: "",
        phone: "",
        email: "",
        password: "",
        registerNumber: "",
        gender: "",
      });

      const fileInput = document.getElementById("photo-upload");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error inserting data:", error);
      const msg = error.message || "Failed to add student. Please try again.";
      setFeedback({ type: "error", message: msg });
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={style.color}>
      <div className={style.container}>
        <h2 className={style.title}>Add Student</h2>
        <form onSubmit={handleSubmit} className={style.form}>
          <div className={style.photoContainer}>
            <input type="file" accept="image/*" onChange={handleFileChange} className={style.fileInput} id="photo-upload" />
            <label htmlFor="photo-upload" className={style.photoLabel}>
              {formData.photo ? (
                <img src={URL.createObjectURL(formData.photo)} alt="Student" className={style.photoPreview} />
              ) : (
                <span className={style.uploadText}><PhotoCameraIcon /></span>
              )}
            </label>
          </div>

          <TextField label="Name" variant="standard" name="name" value={formData.name} onChange={handleChange} fullWidth required />

          <FormControl component="fieldset">
            <h6 className={style.gender}>Gender *</h6>
            <RadioGroup sx={{ color: "black" }} name="gender" value={formData.gender} onChange={handleChange} row>
              <FormControlLabel value="Male" control={<Radio />} label="Male" />
              <FormControlLabel value="Female" control={<Radio />} label="Female" />
            </RadioGroup>
          </FormControl>

          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="department-label">Department</InputLabel>
            <Select labelId="department-label" value={formData.department} onChange={handleDepartmentChange} name="department">
              {departments.map((dept) => (
                <MenuItem key={dept.department_id} value={dept.department_id}>{dept.department_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="programme-label">Programme</InputLabel>
            <Select labelId="programme-label" value={formData.programme} onChange={handleChange} name="programme">
              {programmes.map((prog) => (
                <MenuItem key={prog.programme_id} value={prog.programme_id}>{prog.programme_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="year-label">Year</InputLabel>
            <Select labelId="year-label" value={formData.year} onChange={handleChange} name="year">
              {years.map((year) => (
                <MenuItem key={year.year_id} value={year.year_id}>{year.year_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField label="Phone Number" variant="standard" name="phone" value={formData.phone} onChange={handleChange} fullWidth required />
          <TextField label="Email" variant="standard" name="email" value={formData.email} onChange={handleChange} fullWidth required />
          <TextField label="Password" variant="standard" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth required />
          <TextField label="Register Number" variant="standard" name="registerNumber" value={formData.registerNumber} onChange={handleChange} fullWidth required />

          {feedback.message && (
            <div className={feedback.type === "success" ? style.alertSuccess : style.alertError}>
              {feedback.message}
            </div>
          )}

          <button type="submit" className={style.submitButton} disabled={isSubmitting}>
            {isSubmitting ? "Adding Student..." : "Add Student"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddStudents;
