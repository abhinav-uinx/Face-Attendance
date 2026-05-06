import React, { useCallback, useEffect, useState } from "react";
import { Popover, Button } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { useLocation, useNavigate } from "react-router-dom";
import style from "./navbar.module.css";
import supabase from "../../../utils/supabase";

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [admin, setAdmin] = useState({
    admin_id: "",
    admin_name: "",
    admin_email: "",
    admin_photo: "",
  });

  const navigate = useNavigate();
  const location = useLocation();

  const pageTitles = {
    "/adminhome": "Dashboard",
    "/adminhome/FaceAttendance": "Start Attendance",
    "/adminhome/ViewHOD": "HOD",
    "/adminhome/ViewTutor": "Tutor",
    "/adminhome/ViewStudents": "Students",
    "/adminhome/Department": "Department",
    "/adminhome/Programme": "Programme",
    "/adminhome/Year": "Year",
    "/adminhome/Complaint": "Complaints",
    "/adminhome/Attendance": "Attendance",
    "/adminhome/AdminProfileEdit": "Admin Profile",
    "/adminhome/Search": "Search",
  };

  const currentTitle = pageTitles[location.pathname] || "Admin";

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const fetchProfilePic = useCallback(async (photoPath) => {
    if (!photoPath) return;

    const isFullUrl = photoPath.startsWith("http");
    if (isFullUrl) {
      console.log("Admin Profile Photo URL (direct):", photoPath);
      setProfilePic(photoPath);
      return;
    }

    const { data, error } = await supabase.storage
      .from("admin")
      .getPublicUrl(photoPath);

    if (error) {
      console.error("Error fetching profile picture:", error);
      return;
    }

    if (data?.publicUrl) {
      console.log("Admin Profile Photo URL:", data.publicUrl);
      setProfilePic(data.publicUrl);
    }
  }, []);

  const fetchAdminDetails = useCallback(async () => {
    try {
      let adminEmail = null;

      // 1. Try official auth
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        adminEmail = userData.user.email;
      } else {
        // 2. Fallback to emergency session
        const storedAid = sessionStorage.getItem("aid");
        if (storedAid) {
          adminEmail = "admin@gmail.com";
        }
      }

      if (!adminEmail) return;

      const { data, error } = await supabase
        .from("tbl_admin")
        .select("admin_id, admin_name, admin_email, admin_photo")
        .eq("admin_email", adminEmail)
        .single();

      if (error || !data) return;

      setAdmin(data);

      if (data.admin_photo) {
        fetchProfilePic(data.admin_photo);
      }
    } catch (error) {
      console.error("Error fetching admin details:", error);
    }
  }, [fetchProfilePic]);

  useEffect(() => {
    fetchAdminDetails();
  }, [fetchAdminDetails]);

  return (
    <div className={style.navbar}>
      <div className={style.wrapper}>
        <div className={style.pageInfo}>
          <span>Admin Console</span>
          <h1>{currentTitle}</h1>
        </div>
        <div className={style.spacer}></div>

        <div className={style.items}>
          <div className={style.searchButton} onClick={() => navigate("/adminhome/EditPeriods")}>
            <AccessTimeIcon className={style.icon} />
            <span>Periods</span>
          </div>

          <div className={style.searchButton} onClick={() => navigate("/adminhome/Search")}>
            <SearchOutlinedIcon className={style.icon} />
            <span>Search</span>
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
          className: style.profilePopover,
        }}
      >
        <div className={style.profileContent}>
          <div className={style.profileHeader}>
            <div className={style.profilePicContainer}>
              <img
                src={profilePic || "/default-profile.jpg"}
                alt="Profile"
                className={style.profilePic}
              />
            </div>

            <div className={style.profileText}>
              <div className={style.userName}>
                {admin.admin_name || "Admin"}
              </div>
              <div className={style.userEmail}>
                {admin.admin_email || "Loading..."}
              </div>
            </div>
          </div>

          <Button
            className={style.profileButton}
            onClick={() => navigate("/adminhome/AdminProfileEdit")}
            variant="outlined"
            fullWidth
          >
            Manage Account
          </Button>
        </div>
      </Popover>

    </div>
  );
};

export default Navbar;
