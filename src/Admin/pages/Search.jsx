import React, { useState } from "react";
import { Button, TextField } from "@mui/material";
import supabase from "../../utils/supabase";
import style from "./search.module.css";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const numericQuery = Number(query);
      const filters = [`student_name.ilike.%${query}%`, `stud_email.ilike.%${query}%`];

      if (!Number.isNaN(numericQuery)) {
        filters.push(`student_id.eq.${numericQuery}`);
      }

      const { data, error } = await supabase
        .from("tbl_student")
        .select("*")
        .or(filters.join(","));

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error("Search error:", err.message);
    }
  };

  return (
    <div className={style.page}>
      <div className={style.header}>
        <span>Student Lookup</span>
        <h2>Search Student</h2>
      </div>

      <div className={style.searchPanel}>
        <TextField
          label="Search by name, email or ID"
          variant="outlined"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSearch();
          }}
          fullWidth
        />
        <Button className={style.searchButton} variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {results.length > 0 && (
        <div className={style.resultsPanel}>
          <h3>Results</h3>
          <table className={style.resultsTable}>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Email</th>
                <th>Student ID</th>
              </tr>
            </thead>
            <tbody>
              {results.map((student) => (
                <tr key={student.student_id}>
                  <td>
                    <img
                      src={student.stud_photo || "/default-profile.jpg"}
                      alt={student.student_name}
                      className={style.photo}
                    />
                  </td>
                  <td>{student.student_name}</td>
                  <td>{student.stud_email}</td>
                  <td>{student.student_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Search;
