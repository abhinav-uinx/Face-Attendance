import React, { useState, useEffect } from "react";
import style from "./designation.module.css";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import supabase from "../../../utils/supabase";

const Designation = () => {
  const [formData, setFormData] = useState({
    designationName: "",
    designationCode: "",
  });

  const [designations, setDesignations] = useState([]);

  useEffect(() => {
    getDesignations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.from("tbl_designation").insert([
        {
          designation_name: formData.designationName,
          designation_id: formData.designationCode,
        },
      ]);

      if (error) {
        throw error;
      }

      console.log("Designation Data Submitted:", data);
      alert("Designation added successfully!");

      setFormData({
        designationName: "",
        designationCode: "",
      });

      // Refresh the designation list after adding a new designation
      getDesignations();
    } catch (error) {
      console.error("Error inserting data:", error.message);
      alert("Failed to add designation. Please try again.");
    }
  };

  async function getDesignations() {
    const { data, error } = await supabase.from("tbl_designation").select();
    
    if (error) {
      console.error("Error fetching data:", error.message);
    } else {
      setDesignations(data);
    }
  }

  return (
    <div className={style.color}>
      <div className={style.container}>
        <h2 className={style.title}>Add Designation</h2>
        <form onSubmit={handleSubmit} className={style.form}>
          <TextField
            label="Designation Name"
            variant="standard"
            name="designationName"
            value={formData.designationName}
            onChange={handleChange}
            fullWidth
            required
          />

          <TextField
            label="Designation Code"
            variant="standard"
            name="designationCode"
            value={formData.designationCode}
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
            Add Designation
          </Button>
        </form>
      </div>

      <div className={style.departmentList}>
        <h3>Designation List</h3>
        <ul>
          {designations.map((designation) => (
            <li key={designation.designation_id}>
              <strong>{designation.designation_name}</strong> (ID: {designation.designation_id})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Designation;
