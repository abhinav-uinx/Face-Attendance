import React, { useState, useEffect } from "react";
import { Popover, Button } from "@mui/material";
import {
  DarkModeOutlined as DarkModeOutlinedIcon,
  LanguageOutlined as LanguageOutlinedIcon,
  FullscreenExitOutlined as FullscreenExitOutlinedIcon,
  NotificationsNoneOutlined as NotificationsNoneOutlinedIcon,
  ChatBubbleOutlineOutlined as ChatBubbleOutlineOutlinedIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import style from "./navbar.module.css";
import supabase from "../../../utils/supabase";

const TutorNavbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [tutor, setTutor] = useState({
    tutor_id: "",
    tutor_name: "",
    tutor_email: "",
    tutor_photo: "",
    department_id: "",
    programme_id: "",
    year_id: "",
  });

  const [departmentName, setDepartmentName] = useState("");
  const [programmeName, setProgrammeName] = useState("");
  const [yearName, setYearName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchTutorDetails();
  }, []);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const fetchTutorDetails = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const tutorEmail = userData?.user?.email;

    const { data, error } = await supabase
      .from("tbl_tutor")
      .select("*")
      .eq("tutor_email", tutorEmail)
      .single();

    if (data) {
      setTutor(data);

      // ✅ Fix for photo URL
      const filePath = data.tutor_photo?.startsWith("http")
        ? null
        : data.tutor_photo;

      if (filePath) {
        const { data: urlData } = supabase.storage
          .from("tutor")
          .getPublicUrl(filePath);
        const publicUrl = urlData?.publicUrl;
        console.log("Tutor profile photo URL:", publicUrl);
        setProfilePic(publicUrl);
      } else {
        console.log("Tutor profile photo URL (direct):", data.tutor_photo);
        setProfilePic(data.tutor_photo);
      }

      // Fetch department
      if (data.department_id) {
        const { data: dept, error: deptError } = await supabase
          .from("tbl_department")
          .select("department_name")
          .eq("department_id", data.department_id)
          .single();
        if (deptError) console.error("Department fetch error:", deptError.message);
        setDepartmentName(dept?.department_name || "");
      }

      // Fetch programme
      if (data.programme_id) {
        const { data: prog, error: progError } = await supabase
          .from("tbl_programme")
          .select("programme_name")
          .eq("programme_id", data.programme_id)
          .single();
        if (progError) console.error("Programme fetch error:", progError.message);
        setProgrammeName(prog?.programme_name || "");
      }

      // Fetch year
      if (data.year_id) {
        const { data: year, error: yearError } = await supabase
          .from("tbl_year")
          .select("year_name")
          .eq("year_id", data.year_id)
          .single();
        if (yearError) {
          console.error("Error fetching year:", yearError.message);
        } else {
          setYearName(year?.year_name || "");
        }
      }
    }

    if (error) {
      console.error("Error fetching tutor:", error.message);
    }
  };

  return (
    <div className={style.navbar}>
      <div className={style.wrapper}>
        <div className={style.spacer}></div>
        <div className={style.items}>
          <div className={style.item}>
            <LanguageOutlinedIcon className={style.icon} />
            <span>English</span>
          </div>
          <div className={style.item}>
            <DarkModeOutlinedIcon className={style.icon} />
          </div>
          <div className={style.item}>
            <FullscreenExitOutlinedIcon className={style.icon} />
          </div>
          <div className={style.item}>
            <NotificationsNoneOutlinedIcon className={style.icon} />
          </div>
          <div className={style.item}>
            <ChatBubbleOutlineOutlinedIcon className={style.icon} />
          </div>
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
            textAlign: "center",
            width: "280px",
          },
        }}
      >
        <div className={style.profileContent}>
          <div className={style.avatarContainer}>
            <img
              src={profilePic || "/default-profile.jpg"}
              alt="Profile"
              className={style.avatarImg}
            />
          </div>
          <div className={style.userName}>{tutor.tutor_name}</div>
          <div className={style.userEmail}>{tutor.tutor_email}</div>
          <div className={style.userDetail}>
            <strong>Department:</strong> {departmentName}
          </div>
          <div className={style.userDetail}>
            <strong>Programme:</strong> {programmeName}
          </div>
          <div className={style.userDetail}>
            <strong>Year:</strong> {yearName}
          </div>

          <Button
            className={style.profileButton}
            onClick={() => {
              handleClose();
              navigate("/TutorsHomepage/TutorProfileEdit");
            }}
          >
            Manage your Account
          </Button>
        </div>
      </Popover>
    </div>
  );
};

export default TutorNavbar;
