import React, { useState, useEffect } from "react";
import style from './addTutor.module.css';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
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

const AddTutor = () => {
  const [formData, setFormData] = useState({
    photo: "",
    name: "",
    department: "",
    programme: "",
    designation: "",
    phone: "",
    email: "",
    password: "",
    registerNumber: "",
    year: "", // 🆕 Added year field
  });

  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [years, setYears] = useState([]); // 🆕 Added years state
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getDepartments();
    getDesignations();
    getYears(); // 🆕 Fetch years
  }, []);

  async function getDepartments() {
    const { data, error } = await supabase.from("tbl_department").select();
    if (error) console.error("Error fetching departments:", error);
    else setDepartments(data);
  }

  async function getProgrammes(departmentId) {
    const { data, error } = await supabase
      .from("tbl_programme")
      .select()
      .eq("department_id", departmentId);

    if (error) console.error("Error fetching programmes:", error);
    else setProgrammes(data);
  }

  async function getDesignations() {
    const { data, error } = await supabase.from("tbl_designation").select("designation_name, designation_id");
    if (error) console.error("Error fetching designations:", error);
    else setDesignations(data);
  }

  async function getYears() {
    const { data, error } = await supabase.from("tbl_year").select("year_id, year_name");
    if (error) console.error("Error fetching years:", error);
    else setYears(data);
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

  const handleDesignationChange = (e) => {
    const designationId = e.target.value;
    setFormData({ ...formData, designation: designationId });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, photo: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = "";

      if (formData.photo) {
        const fileExt = formData.photo.name ? formData.photo.name.split(".").pop() : "jpg";
        const fileName = `${formData.registerNumber}.${fileExt}`;
        const filePath = fileName;

        try {
          const { error: uploadError } = await supabase.storage
            .from("tutor")
            .upload(filePath, formData.photo, {
              cacheControl: "3600",
              upsert: true,
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("tutor")
              .getPublicUrl(filePath);
            imageUrl = publicUrlData?.publicUrl || "";
          } else {
            console.warn("Tutor storage upload skipped (RLS restriction), falling back to Base64:", uploadError.message);
          }
        } catch (storageErr) {
          console.warn("Storage upload exception for tutor, falling back to Base64:", storageErr);
        }

        if (!imageUrl) {
          imageUrl = await compressImage(formData.photo);
        }
      }

      const { data, error } = await supabase.from("tbl_tutor").upsert([{
        tutor_id: formData.registerNumber,
        tutor_name: formData.name.trim(),
        tutor_contact: formData.phone.trim(),
        tutor_email: formData.email.trim().toLowerCase(),
        tutor_password: formData.password,
        department_id: formData.department,
        programme_id: formData.programme,
        designation_id: formData.designation,
        tutor_photo: imageUrl || null,
        year_id: formData.year, // 🆕 Assign selected year_id
      }], { onConflict: "tutor_id" });

      if (error) {
        if (error.code === "23505" || error.message?.includes("duplicate")) {
          if (error.message?.includes("tutor_email")) {
            throw new Error(`A tutor with email "${formData.email}" already exists.`);
          }
          throw new Error(`A tutor with Register Number "${formData.registerNumber}" already exists.`);
        }
        throw error;
      }

      console.log("Tutor Data Submitted successfully:", data);
      alert(`Tutor "${formData.name}" added successfully!`);

      setFormData({
        photo: "",
        name: "",
        department: "",
        programme: "",
        designation: "",
        phone: "",
        email: "",
        password: "",
        registerNumber: "",
        year: "", // 🆕 Reset year field
      });

      const fileInput = document.getElementById("photo-upload");
      if (fileInput) fileInput.value = "";

    } catch (error) {
      console.error("Error inserting tutor data:", error);
      alert(error.message || "Failed to add tutor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={style.color}>
      <div className={style.container}>
        <h2 className={style.title}>Add Tutor</h2>
        <form onSubmit={handleSubmit} className={style.form}>
          <div className={style.photoContainer}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={style.fileInput}
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className={style.photoLabel}>
              {formData.photo ? (
                <img src={URL.createObjectURL(formData.photo)} alt="Tutor" className={style.photoPreview} />
              ) : (
                <span className={style.uploadText}><PhotoCameraIcon /></span>
              )}
            </label>
          </div>

          <TextField label="Name" variant="standard" name="name" value={formData.name} onChange={handleChange} fullWidth required />

          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="department-label">Department</InputLabel>
            <Select
              labelId="department-label"
              id="department-select"
              value={formData.department}
              onChange={handleDepartmentChange}
              name="department"
              label="Department"
              required
            >
              {departments.map((dept) => (
                <MenuItem key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="programme-label">Programme</InputLabel>
            <Select
              labelId="programme-label"
              id="programme-select"
              value={formData.programme}
              onChange={handleChange}
              name="programme"
              label="Programme"
              required
            >
              {programmes.map((prog) => (
                <MenuItem key={prog.programme_id} value={prog.programme_id}>
                  {prog.programme_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 🆕 Year Dropdown */}
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="year-label">Year</InputLabel>
            <Select
              labelId="year-label"
              id="year-select"
              value={formData.year}
              onChange={handleChange}
              name="year"
              label="Year"
              required
            >
              {years.map((year) => (
                <MenuItem key={year.year_id} value={year.year_id}>
                  {year.year_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="designation-label">Designation</InputLabel>
            <Select
              labelId="designation-label"
              id="designation-select"
              value={formData.designation}
              onChange={handleDesignationChange}
              name="designation"
              label="Designation"
              required
            >
              {designations.map((desig) => (
                <MenuItem key={desig.designation_id} value={desig.designation_id}>
                  {desig.designation_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField label="Phone Number" variant="standard" name="phone" type="tel" value={formData.phone} onChange={handleChange} fullWidth required />
          <TextField label="Email" variant="standard" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth required />
          <TextField label="Password" variant="standard" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth required />
          <TextField label="Register Number" variant="standard" name="registerNumber" value={formData.registerNumber} onChange={handleChange} fullWidth required />

          <button type="submit" className={style.submitButton} disabled={isSubmitting}>
            {isSubmitting ? "Adding Tutor..." : "Add Tutor"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTutor;
