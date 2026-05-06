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
import style from "./hodNavbar.module.css";
import supabase from "../../../utils/supabase";

const HODNavbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [tutor, setTutor] = useState({
    tutor_id: "",
    tutor_name: "",
    tutor_email: "",
    tutor_photo: "",
    department_id: "",
  });

  const [departmentName, setDepartmentName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchHODDetails();
  }, []);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const fetchHODDetails = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const hodEmail = userData?.user?.email;

    const { data, error } = await supabase
      .from("tbl_tutor")
      .select("*")
      .eq("tutor_email", hodEmail)
      .single();

    if (data) {
      setTutor(data);

      // Profile picture logic
      const filePath = data.tutor_photo?.startsWith("http")
        ? null
        : data.tutor_photo;

      if (filePath) {
        const { data: urlData } = supabase.storage
          .from("tutor")
          .getPublicUrl(filePath);
        setProfilePic(urlData?.publicUrl);
      } else {
        setProfilePic(data.tutor_photo);
      }

      // Department name
      if (data.department_id) {
        const { data: dept } = await supabase
          .from("tbl_department")
          .select("department_name")
          .eq("department_id", data.department_id)
          .single();
        setDepartmentName(dept?.department_name || "");
      }
    }

    if (error) {
      console.error("Error fetching HOD:", error.message);
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

          <Button
            className={style.profileButton}
            onClick={() => {
              handleClose();
              navigate("/HODHomepage/HODProfileEdit");
            }}
          >
            Manage your Account
          </Button>

          {/* 👉 How it Works button */}
          <Button
            className={style.profileButton}
            variant="outlined"
            style={{ marginTop: "10px" }}
            onClick={() => {
              handleClose();
              navigate("/HODHomepage/HowItWorks");
            }}
          >
            How it works
          </Button>
        </div>
      </Popover>
    </div>
  );
};

export default HODNavbar;
