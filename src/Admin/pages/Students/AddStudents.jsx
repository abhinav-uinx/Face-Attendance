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
    try {
      let photoUrl = null;

      if (formData.photo) {
        const fileExt = formData.photo.name.split('.').pop();
        const fileName = `${formData.registerNumber}.${fileExt}`;
        const filePath = `students/${fileName}`;

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("attendance")
          .upload(filePath, formData.photo, { upsert: true });

        if (uploadError) throw uploadError;

        // Fetch the correct public URL after upload
        photoUrl = supabase.storage.from("attendance").getPublicUrl(filePath).data.publicUrl;
      }

      console.log("Uploaded Photo URL:", photoUrl);

      // Insert student details into tbl_student
      const { data, error } = await supabase.from("tbl_student").insert([{
        student_name: formData.name,
        stud_contact: formData.phone,
        stud_password: formData.password,
        stud_email: formData.email,
        student_id: formData.registerNumber,
        year_id: formData.year,
        department_id: formData.department,
        programme_id: formData.programme,
        stud_gender: formData.gender,
        stud_photo: photoUrl,  // ✅ Insert photo URL here
      }]);

      if (error) throw error;

      console.log("Student Data Submitted:", data);
      alert("Student added successfully!");

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
    } catch (error) {
      console.error("Error inserting data:", error);
      alert("Failed to add student. Please try again.");
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

          <button type="submit" className={style.submitButton}>Add Student</button>
        </form>
      </div>
    </div>
  );
};

export default AddStudents;
