import React, { useState, useEffect } from "react";
import supabase from "../utils/supabase";
import TutorNavbar from "./components/navbar/TutorNavbar";
import style from "./tutorHomaepage.module.css";
import TutorRouter from "../Router/TutorRouter";

const TutorsHomepage = () => {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [loading, setLoading] = useState(true);

  const tutorEmail = sessionStorage.getItem("tutor_email");

  useEffect(() => {
    if (!tutorEmail) {
      console.warn("No tutor email found. Redirecting...");
      return;
    }
    fetchTutorAndStudents();
  }, []);

  const fetchTutorAndStudents = async () => {
    try {
      const { data: tutorData, error: tutorError } = await supabase
        .from("tbl_tutor")
        .select("tutor_id, department_id, programme_id, year_id")
        .eq("tutor_email", tutorEmail)
        .single();

      if (tutorError) throw new Error(tutorError.message);

      const { data: studentData, error: studentError } = await supabase
        .from("tbl_student")
        .select(
          "student_id, student_name, stud_email, stud_contact, stud_gender, stud_photo"
        )
        .eq("department_id", tutorData.department_id)
        .eq("programme_id", tutorData.programme_id)
        .eq("year_id", tutorData.year_id);

      if (studentError) throw new Error(studentError.message);

      setStudents(studentData);
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendance = async (studentId) => {
    setActiveStudentId(studentId);
    try {
      const { data, error } = await supabase
        .from("tbl_attendance")
        .select("student_id, attendance_date, period, status")
        .eq("student_id", studentId);

      if (error) throw new Error(error.message);

      const transformed = {};
      data.forEach(({ attendance_date, period, status }) => {
        if (!transformed[attendance_date]) {
          transformed[attendance_date] = {
            date: attendance_date,
            "Period 1": "",
            "Period 2": "",
            "Period 3": "",
            "Period 4": "",
            "Period 5": "",
          };
        }
        transformed[attendance_date][period] = status;
      });

      setAttendanceData(transformed);
    } catch (err) {
      console.error("Attendance fetch error:", err.message);
    }
  };

  return (
    <>
      <TutorNavbar />
      <TutorRouter />
      <div className={style.container}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <h2>Students in Your Department, Programme, and Year</h2>
            <table className={style.studentTable}>
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Gender</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.student_id}>
                    <td>
                      <img
                        src={student.stud_photo}
                        alt={student.student_name}
                        className={style.studentPhoto}
                      />
                    </td>
                    <td>{student.student_name}</td>
                    <td>{student.stud_email}</td>
                    <td>{student.stud_contact}</td>
                    <td>{student.stud_gender}</td>
                    <td>
                      <button
                        className={style.viewButton}
                        onClick={() => handleViewAttendance(student.student_id)}
                      >
                        View Attendance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {activeStudentId && Object.keys(attendanceData).length > 0 && (
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
            )}
          </>
        )}
      </div>
    </>
  );
};

export default TutorsHomepage;
