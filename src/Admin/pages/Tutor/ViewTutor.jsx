import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import supabase from "../../../utils/supabase";
import style from "./viewTutor.module.css";
import AddIcon from "@mui/icons-material/Add";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";

const ViewTutor = () => {
  const [tutors, setTutors] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [years, setYears] = useState([]);
  const [editingTutor, setEditingTutor] = useState(null);
  const [selectedValues, setSelectedValues] = useState({});

  useEffect(() => {
    getTutors();
    getDesignations();
    getProgrammes();
    getYears();
  }, []);

  async function getTutors() {
    const { data, error } = await supabase
      .from("tbl_tutor")
      .select(`
        tutor_id,
        tutor_name,
        tutor_email,
        tutor_contact,
        tutor_photo,
        designation_id,
        programme_id,
        year_id,
        department_id,
        tbl_designation (designation_name),
        tbl_programme (programme_name),
        tbl_year (year_name),
        tbl_department (department_name)
      `);

    if (error) {
      console.error("Error fetching tutors:", error.message);
    } else {
      setTutors(data);
    }
  }

  async function getDesignations() {
    const { data, error } = await supabase.from("tbl_designation").select("*");
    if (error) console.error("Error fetching designations:", error.message);
    else setDesignations(data);
  }

  async function getProgrammes() {
    const { data, error } = await supabase.from("tbl_programme").select("*");
    if (error) console.error("Error fetching programmes:", error.message);
    else setProgrammes(data);
  }

  async function getYears() {
    const { data, error } = await supabase.from("tbl_year").select("*");
    if (error) console.error("Error fetching years:", error.message);
    else setYears(data);
  }

  async function updateTutor(tutorId, values) {
    try {
      const { error } = await supabase
        .from("tbl_tutor")
        .update(values)
        .eq("tutor_id", tutorId);

      if (error) throw new Error("Error updating tutor: " + error.message);

      setEditingTutor(null);
      getTutors();
    } catch (error) {
      console.error(error.message);
    }
  }

  return (
    <div className={style.color}>
      <div className={style.header}>
        <div>
          <span className={style.eyebrow}>Faculty Directory</span>
          <h2 className={style.title}>Tutor List</h2>
        </div>

        <div className={style.buttonContainer}>
          <Link to="/adminhome/AddTutor" className={style.addButton}>
            <AddIcon className={style.buttonIcon} />
            <span>Add Tutor</span>
          </Link>
          <Link to="/adminhome/Designation" className={style.addButton}>
            <BadgeOutlinedIcon className={style.buttonIcon} />
            <span>Add Designation</span>
          </Link>
        </div>
      </div>

      <div className={style.tableContainer}>
        <table className={style.table}>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Register Number</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Programme</th>
              <th>Year</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tutors.length > 0 ? (
              tutors.map((tutor) => (
                <tr key={tutor.tutor_id}>
                  <td>
                    {tutor.tutor_photo ? (
                      <img
                        src={tutor.tutor_photo}
                        alt={tutor.tutor_name}
                        className={style.tutorImage}
                      />
                    ) : (
                      <span>No Photo</span>
                    )}
                  </td>
                  <td>{tutor.tutor_name}</td>
                  <td>{tutor.tutor_id}</td>
                  <td>{tutor.tutor_email}</td>
                  <td>{tutor.tutor_contact}</td>
                  <td>
                    {editingTutor === tutor.tutor_id ? (
                      <select
                        value={
                          selectedValues[tutor.tutor_id]?.designation_id ?? tutor.designation_id ?? ""
                        }
                        onChange={(e) =>
                          setSelectedValues({
                            ...selectedValues,
                            [tutor.tutor_id]: {
                              ...selectedValues[tutor.tutor_id],
                              designation_id: e.target.value,
                            },
                          })
                        }
                      >
                        {designations.map((d) => (
                          <option key={d.designation_id} value={d.designation_id}>
                            {d.designation_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{tutor.tbl_designation?.designation_name || "N/A"}</span>
                    )}
                  </td>
                  <td>{tutor.tbl_department?.department_name || "N/A"}</td>
                  <td>
                    {editingTutor === tutor.tutor_id ? (
                      <select
                        value={
                          selectedValues[tutor.tutor_id]?.programme_id ?? tutor.programme_id ?? ""
                        }
                        onChange={(e) =>
                          setSelectedValues({
                            ...selectedValues,
                            [tutor.tutor_id]: {
                              ...selectedValues[tutor.tutor_id],
                              programme_id: e.target.value,
                            },
                          })
                        }
                      >
                        {programmes
                          .filter((p) => p.department_id === tutor.department_id)
                          .map((p) => (
                            <option key={p.programme_id} value={p.programme_id}>
                              {p.programme_name}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <span>{tutor.tbl_programme?.programme_name || "N/A"}</span>
                    )}
                  </td>
                  <td>
                    {editingTutor === tutor.tutor_id ? (
                      <select
                        value={selectedValues[tutor.tutor_id]?.year_id ?? tutor.year_id ?? ""}
                        onChange={(e) =>
                          setSelectedValues({
                            ...selectedValues,
                            [tutor.tutor_id]: {
                              ...selectedValues[tutor.tutor_id],
                              year_id: e.target.value,
                            },
                          })
                        }
                      >
                        {years.map((y) => (
                          <option key={y.year_id} value={y.year_id}>
                            {y.year_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{tutor.tbl_year?.year_name || "N/A"}</span>
                    )}
                  </td>
                  <td>
                    {editingTutor === tutor.tutor_id ? (
                      <button
                        className={style.saveButton}
                        onClick={() =>
                          updateTutor(tutor.tutor_id, selectedValues[tutor.tutor_id])
                        }
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        className={style.editButton}
                        onClick={() => {
                          setEditingTutor(tutor.tutor_id);
                          setSelectedValues({
                            ...selectedValues,
                            [tutor.tutor_id]: {
                              designation_id: tutor.designation_id,
                              programme_id: tutor.programme_id,
                              year_id: tutor.year_id,
                            },
                          });
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className={style.noData}>
                  No tutors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewTutor;
