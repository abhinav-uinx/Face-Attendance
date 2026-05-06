import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import style from "./sidebar.module.css";
import VideocamIcon from "@mui/icons-material/Videocam";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import GroupIcon from "@mui/icons-material/Group";
import { PiStudentFill } from "react-icons/pi"; // Corrected import
import ClassIcon from "@mui/icons-material/Class";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { FaCalendarAlt } from "react-icons/fa";
import SubjectIcon from "@mui/icons-material/Subject";
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      console.log("Logging out...");
      navigate("/login");
    }
  };

  return (
    <div className={style.sidebar}>
      <div className={style.top}>
        <Link to="/adminhome" className={style.logo}>
          FACE INN
        </Link>
      </div>

      <hr className={style.divider} />

      <div className={style.center}>
        <ul>
          {[
            { path: "/adminhome/FaceAttendance", icon: <VideocamIcon />, label: "Start Attendance" },
            { path: "/adminhome/ViewHOD", icon: <FolderSharedIcon />, label: "HOD" },
            { path: "/adminhome/ViewTutor", icon: <GroupIcon />, label: "Tutor" },
            { path: "/adminhome/ViewStudents", icon: <PiStudentFill />, label: "Students" },
            { path: "/adminhome/Department", icon: <ClassIcon />, label: "Department" },
            { path: "/adminhome/Programme", icon: <SubjectIcon />, label: "Programme" },
            { path: "/adminhome/Year", icon: <FaCalendarAlt />, label: "Year" },
            { path: "/adminhome/Complaint", icon: <SettingsOutlinedIcon />, label: "Complaints" },
            { path: "/adminhome/Attendance", icon: <FeaturedPlayListIcon />, label: "Attendance" },
          ].map((item, index) => (
            <li
              key={index}
              className={`${style.card} ${location.pathname === item.path ? style.active : ""}`}
            >
              <Link to={item.path} className={style.link}>
                <div className={style.icon}>{item.icon}</div>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}

          <li className={`${style.card} ${style.logout}`} onClick={handleLogout}>
            <div className={style.icon}>
              <LogoutOutlinedIcon />
            </div>
            <span>Logout</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
