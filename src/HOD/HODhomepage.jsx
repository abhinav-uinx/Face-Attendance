import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import style from "./hodhomepage.module.css";
import supabase from "../utils/supabase";
import HODNavbar from "./components/navbar/HODNavbar";
import HODRouter from "../Router/HODRouter";

const HODhomepage = () => {
  const [tutor, setTutor] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [years, setYears] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({});
  const [activeStudentId, setActiveStudentId] = useState(null);

  const navigate = useNavigate();
  const tutorEmail = sessionStorage.getItem("hod_email");

  useEffect(() => {
    if (!tutorEmail) {
      console.warn("No HOD email found. Redirecting to login.");
      navigate("/login");
      return;
    }
    fetchTutorAndPrograms();
  }, []);

  const fetchTutorAndPrograms = async () => {
    try {
      const { data: tutorData, error: tutorError } = await supabase
        .from("tbl_tutor")
        .select("tutor_id, department_id, designation_id")
        .eq("tutor_email", tutorEmail)
        .single();

      if (tutorError || !tutorData) {
        console.error("Error fetching HOD data:", tutorError?.message);
        navigate("/login");
        return;
      }

      if (tutorData.designation_id !== 100) {
        console.warn("Access denied. You are not an HOD.");
        navigate("/login");
        return;
      }

      setTutor(tutorData);

      const { data: programData, error: programError } = await supabase
        .from("tbl_programme")
        .select("programme_id, programme_name")
        .eq("department_id", tutorData.department_id);

      if (programError) throw new Error(programError.message);

      setPrograms(programData);
    } catch (error) {
      console.error("Error fetching data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchYears = async () => {
    try {
      const { data: yearData, error: yearError } = await supabase
        .from("tbl_year")
        .select("year_id, year_name");

      if (yearError) throw new Error(yearError.message);

      setYears(yearData);
    } catch (error) {
      console.error("Error fetching years:", error.message);
    }
  };

  const fetchStudents = async (programmeId, yearId) => {
    try {
      const { data: studentData, error: studentError } = await supabase
        .from("tbl_student")
        .select("student_id, student_name, stud_email, stud_contact, stud_gender, stud_photo")
        .eq("programme_id", programmeId)
        .eq("year_id", yearId);

      if (studentError) throw new Error(studentError.message);

      setStudents(studentData);
    } catch (error) {
      console.error("Error fetching students:", error.message);
    }
  };

  const handleProgramClick = (program) => {
    setSelectedProgram(program);
    setSelectedYearId(null);
    setStudents([]);
    setAttendanceData({});
    fetchYears();
  };

  const handleYearClick = (yearId) => {
    setSelectedYearId(yearId);
    fetchStudents(selectedProgram.programme_id, yearId);
  };

  const handleBackClick = () => {
    setSelectedProgram(null);
    setSelectedYearId(null);
    setStudents([]);
    setAttendanceData({});
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
        if (period === "Period 1") transformed[attendance_date]["Period 1"] = status;
        if (period === "Period 2") transformed[attendance_date]["Period 2"] = status;
        if (period === "Period 3") transformed[attendance_date]["Period 3"] = status;
        if (period === "Period 4") transformed[attendance_date]["Period 4"] = status;
        if (period === "Period 5") transformed[attendance_date]["Period 5"] = status;
      });

      setAttendanceData(transformed);
    } catch (err) {
      console.error("Error fetching attendance:", err.message);
    }
  };

  return (
    <>
      <HODNavbar />
      <HODRouter />
      <div className={style.container}>
        <h1 className={style.title}>HOD Homepage</h1>

        {loading ? (
          <p>Loading...</p>
        ) : tutor ? (
          <>
            {!selectedProgram ? (
              <>
                <h2>Programs in Your Department</h2>
                <div className={style.programContainer}>
                  {programs.map((program) => (
                    <button
                      key={program.programme_id}
                      className={style.programButton}
                      onClick={() => handleProgramClick(program)}
                    >
                      {program.programme_name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button className={style.backButton} onClick={handleBackClick}>
                  ⬅ Back
                </button>
                <h2>{selectedProgram.programme_name}</h2>

                <h2>Select Year</h2>
                <div className={style.yearContainer}>
                  {years.map((year) => (
                    <button
                      key={year.year_id}
                      className={`${style.yearButton} ${selectedYearId === year.year_id ? style.active : ""}`}
                      onClick={() => handleYearClick(year.year_id)}
                    >
                      {year.year_name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {selectedYearId && students.length > 0 && (
              <>
                <h2>Students</h2>
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
                          <img src={student.stud_photo} alt={student.student_name} className={style.studentPhoto} />
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
              </>
            )}

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
        ) : (
          <p>Access denied. You are not an HOD.</p>
        )}
      </div>
    </>
  );
};

export default HODhomepage;
