import React, { useEffect, useMemo, useState } from "react";
import style from "./viewStudents.module.css";
import { Link } from "react-router-dom";
import supabase from "../../../utils/supabase";
import EditIcon from "@mui/icons-material/Edit";

const sortByName = (items, key) =>
  [...items].sort((first, second) => String(first[key] || "").localeCompare(String(second[key] || "")));

const ViewStudents = () => {
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [years, setYears] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [editingStudent, setEditingStudent] = useState(null);
  const [editedStudentData, setEditedStudentData] = useState({});

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
    setStudents([]);
  }, [selectedProgramme]);

  useEffect(() => {
    if (!selectedDepartment || !selectedProgramme || !selectedYear) return;

    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("tbl_student")
        .select("student_id, student_name, stud_email, stud_contact, stud_photo")
        .eq("department_id", selectedDepartment)
        .eq("programme_id", selectedProgramme)
        .eq("year_id", selectedYear)
        .order("student_name", { ascending: true });
      if (!error) setStudents(data || []);
    };

    fetchStudents();
  }, [selectedDepartment, selectedProgramme, selectedYear]);

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

  const handleEditClick = (student) => {
    setEditingStudent(student.student_id);
    setEditedStudentData({ ...student });
  };

  const handleInputChange = (event, field) => {
    setEditedStudentData({ ...editedStudentData, [field]: event.target.value });
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("tbl_student")
      .update({
        student_name: editedStudentData.student_name,
        stud_email: editedStudentData.stud_email,
        stud_contact: editedStudentData.stud_contact,
      })
      .eq("student_id", editingStudent);

    if (!error) {
      setEditingStudent(null);
      setStudents((previousStudents) =>
        previousStudents.map((student) =>
          student.student_id === editingStudent ? editedStudentData : student
        )
      );
    } else {
      console.error("Error updating student:", error.message);
    }
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
          <span className={style.eyebrow}>Student Directory</span>
          <h2>Students</h2>
        </div>
        <Link to="/adminhome/AddStudents" className={style.addButton}>
          Add Student
        </Link>
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
          <span>{selectedYear ? `${students.length} records` : "Complete the selection above"}</span>
        </div>

        {selectedYear && students.length > 0 ? (
          <div className={style.studentGrid}>
            {students.map((student) => (
              <article key={student.student_id} className={style.studentCard}>
                <img
                  src={student.stud_photo || "/default-profile.jpg"}
                  alt={`Photo of ${student.student_name}`}
                  className={style.studentPhoto}
                  onError={(event) => {
                    event.currentTarget.src = "/default-profile.jpg";
                  }}
                />

                {editingStudent === student.student_id ? (
                  <div className={style.editForm}>
                    <label>Name</label>
                    <input
                      type="text"
                      value={editedStudentData.student_name || ""}
                      onChange={(event) => handleInputChange(event, "student_name")}
                      className={style.inputField}
                    />

                    <label>Email</label>
                    <input
                      type="email"
                      value={editedStudentData.stud_email || ""}
                      onChange={(event) => handleInputChange(event, "stud_email")}
                      className={style.inputField}
                    />

                    <label>Phone</label>
                    <input
                      type="text"
                      value={editedStudentData.stud_contact || ""}
                      onChange={(event) => handleInputChange(event, "stud_contact")}
                      className={style.inputField}
                    />

                    <div className={style.actionRow}>
                      <button type="button" onClick={handleSave} className={style.saveButton}>
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingStudent(null)} className={style.cancelButton}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={style.studentInfo}>
                    <button type="button" className={style.editIconContainer} onClick={() => handleEditClick(student)}>
                      <EditIcon className={style.editIcon} />
                    </button>
                    <h4>{student.student_name}</h4>
                    <p>{student.student_id}</p>
                    <dl>
                      <div>
                        <dt>Email</dt>
                        <dd>{student.stud_email || "N/A"}</dd>
                      </div>
                      <div>
                        <dt>Phone</dt>
                        <dd>{student.stud_contact || "N/A"}</dd>
                      </div>
                    </dl>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className={style.emptyState}>
            {selectedYear ? "No students found for this selection." : "Select department, programme, and year to view students."}
          </div>
        )}
      </section>
    </div>
  );
};

export default ViewStudents;
