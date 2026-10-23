import React, { useState, useEffect } from "react";
import style from "./addProgramme.module.css";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import supabase from "../../../utils/supabase";

const AddProgramme = () => {
  const [formData, setFormData] = useState({
    programmeName: "",
    programmeCode: "",
    departmentId: "",
  });

  const [programmes, setProgrammes] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    getProgrammes();
    getDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (event) => {
    setFormData({ ...formData, departmentId: event.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log(formData);
      
      const { data, error } = await supabase.from("tbl_programme").insert([
        {
          programme_name: formData.programmeName,
          programme_id: formData.programmeCode,
          department_id: formData.departmentId, // Save department selection
        },
      ]);

      if (error) {
        throw error;
      }

      console.log("Programme Data Submitted:", data);
      alert("Programme added successfully!");

      setFormData({
        programmeName: "",
        programmeCode: "",
        departmentId: "",
      });

      getProgrammes();
    } catch (error) {
      console.error("Error inserting data:", error.message);
      alert("Failed to add programme. Please try again.");
    }
  };

  async function getProgrammes() {
    const { data, error } = await supabase.from("tbl_programme").select();
    if (error) {
      console.error("Error fetching data:", error.message);
    } else {
      setProgrammes(data);
    }
  }

  async function getDepartments() {
    const { data, error } = await supabase.from("tbl_department").select();
    console.log(data);
    
    if (error) {
      console.error("Error fetching data:", error.message);
    } else {
      setDepartments(data);
    }
  }

  return (
    <div className={style.color}>
      <div className={style.container}>
        <h2 className={style.title}>Add Programme</h2>
        <form onSubmit={handleSubmit} className={style.form}>
          {/* Department Dropdown */}
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }} fullWidth>
            <InputLabel id="department-label">Department *</InputLabel>
            <Select
              labelId="department-label"
              id="department-select"
              value={formData.departmentId}
              onChange={handleSelectChange}
              name="departmentId"
              required
            >
              {departments.map((department) => (
                <MenuItem key={department.department_id} value={department.department_id}>
                  {department.department_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Programme Name"
            variant="standard"
            name="programmeName"
            value={formData.programmeName}
            onChange={handleChange}
            fullWidth
            required
          />

          <TextField
            label="Programme Code"
            variant="standard"
            name="programmeCode"
            value={formData.programmeCode}
            onChange={handleChange}
            fullWidth
            required
          />

          <Button type="submit" variant="contained" color="primary" className={style.submitButton}>
            Add Programme
          </Button>
        </form>
      </div>

      <div className={style.departmentList}>
        <h3>Programme List</h3>
        <ul>
          {programmes.map((programme) => (
            <li key={programme.programme_id}>
              <strong>{programme.programme_name}</strong> (ID: {programme.programme_id})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AddProgramme;
