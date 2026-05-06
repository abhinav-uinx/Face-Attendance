import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import style from "./AddYear.module.css";
import supabase from "../../../utils/supabase"; // Ensure correct Supabase setup

const AddYear = () => {
  const [formData, setFormData] = useState({ year: "" });
  const [years, setYears] = useState([]); // Store fetched years

  useEffect(() => {
    fetchYears(); // Fetch years on component mount
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("tbl_year")
        .insert([{ year_name: formData.year }]);

      if (error) throw error;

      alert("Year added successfully!");
      setFormData({ year: "" });
      fetchYears(); // Refresh list after adding
    } catch (error) {
      alert("Failed to add year. Please try again.");
      console.error("Error inserting data:", error.message);
    }
  };

  // Fetch years from Supabase
  const fetchYears = async () => {
    try {
      const { data, error } = await supabase.from("tbl_year").select("year_name");
      if (error) throw error;
      setYears(data);
    } catch (error) {
      console.error("Error fetching years:", error.message);
    }
  };

  return (
    <div className={style.color}>
      <div className={style.container}>
        <h2 className={style.title}>Add Year</h2>
        <form onSubmit={handleSubmit} className={style.form}>
          <TextField
            label="Year"
            variant="standard"
            name="year"
            value={formData.year}
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
            Add Year
          </Button>
        </form>
      </div>

      {/* Display fetched years */}
      <div className={style.yearList}>
        <h3>Year List</h3>
        <ul>
          {years.map((year, index) => (
            <li key={index}>
              <strong>{year.year_name}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AddYear;
