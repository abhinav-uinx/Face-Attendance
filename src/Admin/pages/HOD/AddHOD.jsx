import React, { useState } from "react";
import style from './addHOD.module.css';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

const AddHOD = () => {
  const [formData, setFormData] = useState({
    photo: "",
    name: "",
    department: "",
    phone: "",
    email: "",
    password: "",
    registerNumber: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, photo: file });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("HOD Data Submitted:", formData);
    // Here, you would handle form submission, like sending data to Supabase
  };

  return (
    <div className={style.color}>
      <div className={style.container}>
        <h2 className={style.title}>Add HOD</h2>
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
                <img src={URL.createObjectURL(formData.photo)} alt="HOD" className={style.photoPreview} />
              ) : (
                <span className={style.uploadText}><PhotoCameraIcon/></span>
              )}
            </label>
          </div>

          <TextField label="Name" variant="standard" name="name" value={formData.name} onChange={handleChange} fullWidth required />
          
          <TextField
            label="Department"
            variant="standard"
            name="department"
            value={formData.department}
            onChange={handleChange}
            fullWidth
            required
            select
          >
            <MenuItem value="Computer Science">Computer Science</MenuItem>
            <MenuItem value="Information Technology">Information Technology</MenuItem>
            <MenuItem value="Electronics">Electronics</MenuItem>
            <MenuItem value="Mechanical">Mechanical</MenuItem>
          </TextField>

          <TextField label="Phone Number" variant="standard" name="phone" type="tel" value={formData.phone} onChange={handleChange} fullWidth required />
          <TextField label="Email" variant="standard" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth required />
          <TextField label="Password" variant="standard" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth required />
          <TextField label="Register Number" variant="standard" name="registerNumber" value={formData.registerNumber} onChange={handleChange} fullWidth required />
          
          <button type="submit" className={style.submitButton}>Add HOD</button>
        </form>
      </div>
    </div>
  );
};

export default AddHOD;
