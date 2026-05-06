import React, { useState, useEffect } from "react";
import { Popover, Button } from "@mui/material";
import {
  DarkModeOutlined,
  LanguageOutlined,
  FullscreenExitOutlined,
  NotificationsNoneOutlined,
  ChatBubbleOutlineOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import style from "./studentNavbar.module.css";
import supabase from "../../utils/supabase";

const StudentNavbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [student, setStudent] = useState(null);
  const [tutorNames, setTutorNames] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentDetails();
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const fetchStudentDetails = async () => {
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user) {
        console.error("Auth error or no user found.");
        return;
      }

      const studentEmail = userData.user.email;

      const { data, error } = await supabase
        .from("tbl_student")
        .select(`
          student_id, student_name, stud_email, stud_photo,
          department_id, programme_id, year_id,
          tbl_department(department_name),
          tbl_programme(programme_name),
          tbl_year(year_name)
        `)
        .ilike("stud_email", studentEmail)
        .maybeSingle();

      if (error) {
        console.error("Error fetching student data:", error);
        return;
      }

      if (!data) {
        console.warn("No student found with email:", studentEmail);
        return;
      }

      setStudent(data);
      if (data.stud_photo) fetchProfilePic(data.stud_photo);
      fetchTutorNames(data.department_id, data.programme_id, data.year_id);
    } catch (err) {
      console.error("Error fetching student details:", err.message);
    }
  };

  const fetchProfilePic = async (photoUrl) => {
    try {
      // Remove full URL prefix if accidentally stored
      const photoPath = photoUrl.replace(
        "https://dtnvxnvoanntvveldndi.supabase.co/storage/v1/object/public/attendance/",
        ""
      );

      const { data, error } = await supabase.storage
        .from("attendance")
        .getPublicUrl(photoPath);

      if (error) {
        console.error("Error loading profile picture:", error);
        return;
      }

      if (data?.publicUrl) {
        console.log("Resolved profile picture URL:", data.publicUrl);
        setProfilePic(data.publicUrl);
      }
    } catch (err) {
      console.error("Exception in fetchProfilePic:", err.message);
    }
  };

  const fetchTutorNames = async (departmentId, programmeId, yearId) => {
    const { data, error } = await supabase
      .from("tbl_tutor")
      .select("tutor_name")
      .eq("department_id", departmentId)
      .eq("programme_id", programmeId)
      .eq("year_id", yearId);

    if (error) {
      console.error("Error fetching tutors:", error);
      return;
    }

    const names = data?.map((t) => t.tutor_name).join(", ");
    setTutorNames(names || "No tutors found");
  };

  return (
    <div className={style.navbar}>
      <div className={style.wrapper}>
        <div className={style.spacer}></div>

        <div className={style.items}>
          <div className={style.item}><LanguageOutlined className={style.icon} /><span>English</span></div>
          <div className={style.item}><DarkModeOutlined className={style.icon} /></div>
          <div className={style.item}><FullscreenExitOutlined className={style.icon} /></div>
          <div className={style.item}><NotificationsNoneOutlined className={style.icon} /></div>
          <div className={style.item}><ChatBubbleOutlineOutlined className={style.icon} /></div>
          <div className={style.item} onClick={handleClick}>
            <div className={style.avatarContainer}>
              <img
                src={profilePic || "/default-profile.jpg"}
                alt="Profile"
                className={style.avatarImg}
              />
            </div>
          </div>
        </div>
      </div>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          style: {
            borderRadius: "12px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
            padding: "16px",
            width: "320px",
            color: "#000",
          },
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={profilePic || "/default-profile.jpg"}
              alt="Profile"
              className={style.avatarImg}
              style={{ width: "60px", height: "60px", borderRadius: "50%" }}
            />
            <div>
              <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                {student?.student_name || "Loading..."}
              </div>
              <div style={{ fontSize: "14px", color: "#555" }}>
                {student?.stud_email || "Loading..."}
              </div>
            </div>
          </div>

          <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div><strong>Department:</strong> {student?.tbl_department?.department_name || "-"}</div>
            <div><strong>Programme:</strong> {student?.tbl_programme?.programme_name || "-"}</div>
            <div><strong>Year:</strong> {student?.tbl_year?.year_name || "-"}</div>
            <div><strong>Tutors:</strong> {tutorNames}</div>
          </div>

          <Button
            variant="contained"
            color="primary"
            style={{ alignSelf: "flex-start", marginTop: "10px" }}
            onClick={() => {
              handleClose();
              navigate("/StudentsHomePage/StudentProfileEdit");
            }}
          >
            Manage your Account
          </Button>
        </div>
      </Popover>
    </div>
  );
};

export default StudentNavbar;
