import React, { useState, useEffect } from "react";
import StudentNavbar from "./components/StudentNavbar";
import StudentRouter from "../Router/StudentRouter";
import supabase from "../utils/supabase";
import "./studentHomepage.module.css"; // Optional for custom styling

const StudentsHomepage = () => {
  const [student, setStudent] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentAndAttendance();
  }, []);

  const fetchStudentAndAttendance = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("User not authenticated");
        return;
      }

      const { data: studentData, error: studentError } = await supabase
        .from("tbl_student")
        .select("student_id")
        .eq("stud_email", user.email)
        .maybeSingle();

      if (studentError) {
        console.error("Error fetching student details:", studentError.message);
        return;
      }

      setStudent(studentData);
      fetchAttendance(studentData.student_id);
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (studentId) => {
    try {
      const { data, error } = await supabase
        .from("tbl_attendance")
        .select("attendance_date, period, status")
        .eq("student_id", studentId)
        .order("attendance_date", { ascending: false });

      if (error) throw new Error(error.message);

      const grouped = {};
      data.forEach(({ attendance_date, period, status }) => {
        if (!grouped[attendance_date]) {
          grouped[attendance_date] = {
            date: attendance_date,
            "Period 1": "",
            "Period 2": "",
            "Period 3": "",
            "Period 4": "",
            "Period 5": "",
          };
        }
        grouped[attendance_date][period] = status;
      });

      setAttendanceData(grouped);
    } catch (error) {
      console.error("Error fetching attendance:", error.message);
    }
  };

  return (
    <div>
      <StudentNavbar />

      <div style={{ padding: "20px" }}>
        <h2>Student Dashboard</h2>

        {loading ? (
          <p>Loading...</p>
        ) : student ? (
          <>
            <h3>Your Attendance</h3>
            {Object.keys(attendanceData).length > 0 ? (
              <table border="1" cellPadding="10" cellSpacing="0">
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
            ) : (
              <p>No attendance records found.</p>
            )}
          </>
        ) : (
          <p>No student data found.</p>
        )}
      </div>

      <StudentRouter />
    </div>
  );
};

export default StudentsHomepage;
