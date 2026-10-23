import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import supabase from "../../../utils/supabase";
import style from "./viewAttendance.module.css";

const sortByName = (items, key) =>
  [...items].sort((first, second) => String(first[key] || "").localeCompare(String(second[key] || "")));

const ViewAttendance = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [programmes, setProgrammes] = useState([]);
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [periods, setPeriods] = useState([]);

  // Fetch dynamic periods for headers
  useEffect(() => {
    const fetchPeriods = async () => {
      const { data } = await supabase.from('tbl_period').select('*').order('id', { ascending: true });
      if (data) setPeriods(data);
    };
    fetchPeriods();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from("tbl_department")
        .select("department_id, department_name")
        .order("department_name", { ascending: true });
      if (!error) setDepartments(data || []);
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (!selectedDepartment) {
      setProgrammes([]);
      return;
    }

    const fetchProgrammes = async () => {
      const { data, error } = await supabase
        .from("tbl_programme")
        .select("programme_id, programme_name, department_id")
        .eq("department_id", selectedDepartment)
        .order("programme_name", { ascending: true });
      if (!error) setProgrammes(data || []);
    };

    fetchProgrammes();
    setSelectedProgramme("");
    setSelectedYear("");
    setSelectedStudent(null);
    setStudents([]);
  }, [selectedDepartment]);

  useEffect(() => {
    if (!selectedProgramme) {
      setYears([]);
      return;
    }

    const fetchYears = async () => {
      const { data, error } = await supabase
        .from("tbl_year")
        .select("year_id, year_name")
        .order("year_name", { ascending: true });
      if (!error) setYears(data || []);
    };

    fetchYears();
    setSelectedYear("");
    setSelectedStudent(null);
    setStudents([]);
  }, [selectedProgramme]);

  useEffect(() => {
    if (!selectedDepartment || !selectedProgramme || !selectedYear) return;

    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("tbl_student")
        .select("student_id, student_name")
        .eq("department_id", selectedDepartment)
        .eq("programme_id", selectedProgramme)
        .eq("year_id", selectedYear)
        .order("student_name", { ascending: true });
      if (!error) setStudents(data || []);
    };

    fetchStudents();
    setSelectedStudent(null);
  }, [selectedDepartment, selectedProgramme, selectedYear]);

  useEffect(() => {
    if (!selectedStudent) return;

    const fetchAttendance = async () => {
      // Fetching from the new horizontal tbl_attendance
      const { data, error } = await supabase
        .from("tbl_attendance")
        .select("*")
        .eq("student_id", selectedStudent.student_id)
        .order("attendance_date", { ascending: false });

      if (!error) {
        setAttendanceData(data || []);
      }
    };

    fetchAttendance();
  }, [selectedStudent]);

  const selectedLabels = useMemo(() => {
    const department = departments.find((item) => String(item.department_id) === String(selectedDepartment));
    const programme = programmes.find((item) => String(item.programme_id) === String(selectedProgramme));
    const year = years.find((item) => String(item.year_id) === String(selectedYear));
    return {
      department: department?.department_name || "Select Department",
      programme: programme?.programme_name || "Select Programme",
      year: year?.year_name || "Select Year",
    };
  }, [departments, programmes, years, selectedDepartment, selectedProgramme, selectedYear]);

  const handleBack = () => {
    if (selectedStudent) setSelectedStudent(null);
    else if (selectedYear) setSelectedYear("");
    else if (selectedProgramme) setSelectedProgramme("");
    else if (selectedDepartment) setSelectedDepartment("");
  };

  const selectorGroups = [
    {
      title: "Select Department",
      value: selectedLabels.department,
      items: sortByName(departments, "department_name"),
      activeId: selectedDepartment,
      idKey: "department_id",
      labelKey: "department_name",
      disabled: false,
      onSelect: setSelectedDepartment,
    },
    {
      title: "Select Programme",
      value: selectedLabels.programme,
      items: sortByName(programmes, "programme_name"),
      activeId: selectedProgramme,
      idKey: "programme_id",
      labelKey: "programme_name",
      disabled: !selectedDepartment,
      onSelect: setSelectedProgramme,
    },
    {
      title: "Select Year",
      value: selectedLabels.year,
      items: sortByName(years, "year_name"),
      activeId: selectedYear,
      idKey: "year_id",
      labelKey: "year_name",
      disabled: !selectedProgramme,
      onSelect: setSelectedYear,
    },
  ];

  return (
    <div className={style.page}>
      <div className={style.header}>
        <div>
          <span className={style.eyebrow}>Attendance Register</span>
          <h2>Attendance Records</h2>
        </div>
        {selectedDepartment && (
          <button type="button" className={style.backButton} onClick={handleBack}>
            <ArrowBack /> Back
          </button>
        )}
      </div>

      <div className={style.selectorPanel}>
        {selectorGroups.map((group, index) => (
          <section className={`${style.selectorGroup} ${group.disabled ? style.disabledGroup : ""}`} key={group.title}>
            <div className={style.groupHeader}>
              <span>{index + 1}</span>
              <div>
                <h3>{group.title}</h3>
                <p>{group.value}</p>
              </div>
            </div>
            <div className={style.chipGrid}>
              {group.items.length > 0 ? (
                group.items.map((item) => (
                  <button
                    type="button"
                    key={item[group.idKey]}
                    onClick={() => group.onSelect(item[group.idKey])}
                    className={`${style.selectButton} ${
                      String(group.activeId) === String(item[group.idKey]) ? style.activeButton : ""
                    }`}
                    disabled={group.disabled}
                  >
                    {item[group.labelKey]}
                  </button>
                ))
              ) : (
                <span className={style.emptyHint}>
                  {group.disabled ? "Choose the previous option first" : "No records found"}
                </span>
              )}
            </div>
          </section>
        ))}
      </div>

      <section className={style.studentsPanel}>
        <div className={style.sectionTitle}>
          <h3>Students</h3>
          <span>{selectedYear ? `${students.length} available` : "Complete the selection above"}</span>
        </div>

        {selectedYear && students.length > 0 ? (
          <div className={style.studentGrid}>
            {students.map((student) => (
              <button
                type="button"
                key={student.student_id}
                className={style.studentButton}
                onClick={() => setSelectedStudent(student)}
              >
                <strong>{student.student_name}</strong>
                <span>ID: {student.student_id}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className={style.emptyState}>
            {selectedYear ? "No students found for this selection." : "Select department, programme, and year to view history."}
          </div>
        )}
      </section>

      <Dialog
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ className: style.dialogPaper }}
      >
        <DialogTitle className={style.dialogTitle}>
            Detailed Attendance History: {selectedStudent?.student_name}
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <div className={style.dialogContent}>
              <div className={style.tableWrap}>
                <table className={style.attendanceTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      {periods.map(p => (
                          <th key={p.id}>{p.period_name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.length > 0 ? (
                      attendanceData.map((rec) => (
                        <tr key={rec.attendance_date}>
                          <td className="font-bold">{rec.attendance_date}</td>
                          {periods.map(p => (
                            <td key={p.id}>
                                <span className={rec[p.column_name] === 'Present' ? style.presentBadge : style.absentBadge}>
                                    {rec[p.column_name] || 'Absent'}
                                </span>
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={periods.length + 1}>No attendance records found for this student.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewAttendance;
