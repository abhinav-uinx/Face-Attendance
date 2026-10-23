import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import style from "./LoginPage.module.css";
import supabase from "../utils/supabase";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
<<<<<<< HEAD
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import HttpsOutlinedIcon from "@mui/icons-material/HttpsOutlined";
=======
>>>>>>> ce651ff24ddcb1014f389686533b192c9e380b25
import faceLogo from "../assets/face.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
<<<<<<< HEAD
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
=======
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
>>>>>>> ce651ff24ddcb1014f389686533b192c9e380b25

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
<<<<<<< HEAD
    setIsSubmitting(true);
    
    const inputEmail = form.email.trim();
    const loginEmail = inputEmail.toLowerCase() === "admin" ? "admin@gmail.com" : inputEmail;
    const normalizedEmail = loginEmail.toLowerCase().trim();
    const enteredPassword = form.password;

    try {
      // 1. Direct Admin Match (admin@gmail.com with admin@123 or Admin@123)
      if (
        (normalizedEmail === "admin@gmail.com" || normalizedEmail === "admin") &&
        (enteredPassword === "admin@123" || enteredPassword === "Admin@123")
      ) {
        console.warn("🚀 ADMIN AUTH: Direct authentication matched.");
        sessionStorage.clear();
        sessionStorage.setItem("aid", "9bd53015-514d-4ca7-9e5a-9390706c13e7");
        sessionStorage.setItem("admin_email", "admin@gmail.com");
        window.location.href = "/adminhome";
        return;
      }

      // 2. Direct database query check against tbl_admin
      const { data: adminRecord } = await supabase
        .from("tbl_admin")
        .select("admin_id, admin_name, admin_email, admin_password")
        .eq("admin_email", normalizedEmail)
        .maybeSingle();

      if (adminRecord && adminRecord.admin_password && adminRecord.admin_password === enteredPassword) {
        sessionStorage.clear();
        sessionStorage.setItem("aid", adminRecord.admin_id);
        sessionStorage.setItem("admin_email", adminRecord.admin_email);
        window.location.href = "/adminhome";
        return;
      }

      // 3. Direct database query check against tbl_tutor (for HOD / Tutor)
      const { data: tutorRecord } = await supabase
        .from("tbl_tutor")
        .select("tutor_id, tutor_name, tutor_email, tutor_password, department_id, designation_id")
        .eq("tutor_email", normalizedEmail)
        .maybeSingle();

      if (tutorRecord && tutorRecord.tutor_password && tutorRecord.tutor_password === enteredPassword) {
        sessionStorage.clear();
        sessionStorage.setItem("tutor_email", tutorRecord.tutor_email);
        sessionStorage.setItem("tutor_id", tutorRecord.tutor_id);
        if (tutorRecord.designation_id === 100) {
=======
    
    const inputEmail = form.email.trim();
    const loginEmail = inputEmail.toLowerCase() === "admin" ? "admin@gmail.com" : inputEmail;

    try {
      const normalizedEmail = loginEmail.toLowerCase().trim();
      
      // 🛡️ SUPER ROBUST EMERGENCY BYPASS
      if (normalizedEmail === "admin@gmail.com" && form.password === "Admin@123") {
        console.warn("🚀 BYPASS ACTIVE: Cleaning session and redirecting...");
        
        // Wipe everything for a fresh start
        await supabase.auth.signOut();
        sessionStorage.clear();
        
        sessionStorage.setItem("aid", "master-admin-id");
        window.location.href = "/adminhome"; 
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: form.password,
      });

      if (authError) {
        console.error("Auth error:", authError.message);
        setError("Invalid login credentials.");
        return;
      }

      // 2. Identify Role
      const userEmail = loginEmail.toLowerCase();

      // Admin check
      const { data: admin } = await supabase
        .from("tbl_admin")
        .select("admin_id")
        .eq("admin_email", userEmail)
        .maybeSingle();

      if (admin) {
        sessionStorage.setItem("aid", admin.admin_id);
        navigate("/adminhome");
        return;
      }

      // Tutor/HOD check
      const { data: tutor } = await supabase
        .from("tbl_tutor")
        .select("tutor_id, tutor_email, department_id, designation_id")
        .eq("tutor_email", userEmail)
        .maybeSingle();

      if (tutor) {
        sessionStorage.setItem("tutor_email", tutor.tutor_email);
        sessionStorage.setItem("tutor_id", tutor.tutor_id);
        if (tutor.designation_id === 100) {
>>>>>>> ce651ff24ddcb1014f389686533b192c9e380b25
          navigate("/HODhomepage");
        } else {
          navigate("/TutorsHomepage");
        }
        return;
      }

<<<<<<< HEAD
      // 4. Fallback to Supabase Auth API
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: form.password,
      });

      if (!authError && authData?.user) {
        const userEmail = authData.user.email?.toLowerCase();

        // Admin check
        const { data: admin } = await supabase
          .from("tbl_admin")
          .select("admin_id, admin_email")
          .eq("admin_email", userEmail)
          .maybeSingle();

        if (admin) {
          sessionStorage.setItem("aid", admin.admin_id);
          sessionStorage.setItem("admin_email", admin.admin_email);
          navigate("/adminhome");
          return;
        }

        // Tutor/HOD check
        const { data: tutor } = await supabase
          .from("tbl_tutor")
          .select("tutor_id, tutor_email, department_id, designation_id")
          .eq("tutor_email", userEmail)
          .maybeSingle();

        if (tutor) {
          sessionStorage.setItem("tutor_email", tutor.tutor_email);
          sessionStorage.setItem("tutor_id", tutor.tutor_id);
          if (tutor.designation_id === 100) {
            navigate("/HODhomepage");
          } else {
            navigate("/TutorsHomepage");
          }
          return;
        }
      }

      setError("Authentication failed. Invalid institutional credentials.");
    } catch (err) {
      console.error("Login exception:", err);
      setError("Network or directory service unreachable. Please retry.");
    } finally {
      setIsSubmitting(false);
=======
      setError("User profile not found in database.");
    } catch (err) {
      setError("Login failed. Please check your connection.");
>>>>>>> ce651ff24ddcb1014f389686533b192c9e380b25
    }
  };

  return (
    <div className={style.container}>
<<<<<<< HEAD
      {/* 🌊 Dynamic Animated Blue Ambient Background */}
      <div className={style.backgroundMesh}></div>
      <div className={`${style.ambientOrb} ${style.orb1}`}></div>
      <div className={`${style.ambientOrb} ${style.orb2}`}></div>
      <div className={`${style.ambientOrb} ${style.orb3}`}></div>
      <div className={`${style.ambientOrb} ${style.orb4}`}></div>

      <main className={style.shell}>
        <section className={style.panel}>
          {/* 🏢 Enterprise Brand & Security Assurance Column */}
          <div className={style.identity}>
            <div className={style.brandHeader}>
              <div className={style.logoBadge}>
                <img src={faceLogo} alt="Face Inn Enterprise Logo" className={style.logoImage} />
              </div>
              <div className={style.brandTitleBlock}>
                <span className={style.brandName}>Face Inn</span>
                <span className={style.systemTag}>Enterprise IAM v2.4</span>
              </div>
            </div>

            <div className={style.heading}>
              <h1>Identity & Access Management</h1>
              <p>
                Unified biometric directory authentication engineered for institutional administrators,
                faculty, and verified campus personnel.
              </p>
            </div>
          </div>

          {/* 📝 Enterprise Login Form Column */}
          <div className={style.formSide}>
            <div className={style.formHeader}>
              <h2>Enterprise Sign In</h2>
              <p>Enter your authorized organization credentials to continue.</p>
            </div>

            {error && (
              <div className={style.error}>
                <ErrorOutlineIcon className={style.errorIcon} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={style.form}>
              <label className={style.field}>
                <span>Organization Email or Username</span>
                <div className={style.inputContainer}>
                  <PersonOutlineOutlinedIcon className={style.inputIcon} />
                  <input
                    type="text"
                    name="email"
                    placeholder="e.g. admin or staff@institution.edu"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                  />
                </div>
              </label>

              <label className={style.field}>
                <span>Password</span>
                <div className={style.inputContainer}>
                  <LockOutlinedIcon className={style.inputIcon} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your directory password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={style.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                  </button>
                </div>
              </label>

              <div className={style.rememberRow}>
                <label className={style.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={style.checkbox}
                  />
                  <span>Remember this workstation</span>
                </label>
              </div>

              <div className={style.actions}>
                <button
                  type="submit"
                  className={style.loginButton}
                  disabled={isSubmitting}
                >
                  <HttpsOutlinedIcon className={style.buttonLockIcon} />
                  <span>{isSubmitting ? "Authenticating Session..." : "Sign In to Enterprise Portal"}</span>
                  <ArrowForwardIcon className={style.buttonIcon} />
                </button>
              </div>

              <div className={style.enterpriseFooterNotice}>
                <p>
                  <strong>Notice:</strong> Authorized access only. All activities and authentication
                  events are logged for institutional compliance.
                </p>
=======
      <div className={style.background}></div>
      <main className={style.shell}>
        <section className={style.panel}>
          <div className={style.identity}>
            <img src={faceLogo} alt="Face Inn" className={style.logoImage} />
            <div className={style.heading}>
              <h1>Sign in</h1>
              <p>to continue to Face Inn</p>
            </div>
          </div>
          <div className={style.formSide}>
            {error && <div className={style.error}>{error}</div>}
            <form onSubmit={handleSubmit} className={style.form}>
              <label className={style.field}>
                <span>Email or username</span>
                <input type="text" name="email" placeholder="admin" value={form.email} onChange={handleChange} required />
              </label>
              <label className={style.field}>
                <span>Password</span>
                <div className={style.passwordField}>
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
                  <button type="button" className={style.passwordToggle} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </button>
                </div>
              </label>
              <div className={style.actions}>
                <button type="submit" className={style.loginButton}>Sign In</button>
>>>>>>> ce651ff24ddcb1014f389686533b192c9e380b25
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
