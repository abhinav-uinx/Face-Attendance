// src/pages/ViewStudentAttendance.jsx

import React from "react";
import style from "../tutorHomaepage.module.css"; // Reuse existing styles

const ViewStudentsAttendance = ({ activeStudentId, attendanceData }) => {
  if (!activeStudentId || Object.keys(attendanceData).length === 0) return null;

  return (
    <div className={style.attendanceTableWrapper}>
      <h2>Attendance Records</h2>
      <table className={style.studentTable}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Period 1</th>
            <th>Period 2</th>
            <th>Period 3</th>
            <th>Period 4</th>
            <th>Period 5</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(attendanceData).map((row, idx) => (
            <tr key={idx}>
              <td>{row.date}</td>
              <td>{row["Period 1"]}</td>
              <td>{row["Period 2"]}</td>
              <td>{row["Period 3"]}</td>
              <td>{row["Period 4"]}</td>
              <td>{row["Period 5"]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewStudentsAttendance;
