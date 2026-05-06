import React, { useState, useEffect } from "react";
import style from "./addDepartment.module.css";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import supabase from "../../../utils/supabase";

const AddDepartment = () => {
  const [formData, setFormData] = useState({
    departmentName: "",
    departmentCode: "",
  });

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    getDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.from("tbl_department").insert([
        {
          department_name: formData.departmentName,
          department_id: formData.departmentCode,
        },
      ]);

      if (error) {
        throw error;
      }

      console.log("Department Data Submitted:", data);
      alert("Department added successfully!");

      setFormData({
        departmentName: "",
        departmentCode: "",
      });

      // Refresh the department list after adding a new department
      getDepartments();
    } catch (error) {
      console.error("Error inserting data:", error.message);
      alert("Failed to add department. Please try again.");
    }
  };

  async function getDepartments() {
    const { data, error } = await supabase.from("tbl_department").select();
    
    if (error) {
      console.error("Error fetching data:", error.message);
    } else {
      setDepartments(data);
    }
  }

  return (
    <div className={style.color}>
      <div className={style.container}>
        <h2 className={style.title}>Add Department</h2>
        <form onSubmit={handleSubmit} className={style.form}>
          <TextField
            label="Department Name"
            variant="standard"
            name="departmentName"
            value={formData.departmentName}
            onChange={handleChange}
            fullWidth
            required
          />

          <TextField
            label="Department Code"
            variant="standard"
            name="departmentCode"
            value={formData.departmentCode}
            onChange={handleChange}
            fullWidth
            required
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            className={style.submitButton}
          >
            Add Department
          </Button>
        </form>
      </div>

      <div className={style.departmentList}>
          <h3>Department List</h3>
          <ul>
            {departments.map((department) => (
              <li key={department.department_id}>
                <strong>{department.department_name}</strong> (ID: {department.department_id})
              </li>
            ))}
          </ul>
        </div>

    </div>
  );
};

export default AddDepartment;
