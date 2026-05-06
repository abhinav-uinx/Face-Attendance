import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import style from "./LoginPage.module.css";
import supabase from "../utils/supabase";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import faceLogo from "../assets/face.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

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
          navigate("/HODhomepage");
        } else {
          navigate("/TutorsHomepage");
        }
        return;
      }

      setError("User profile not found in database.");
    } catch (err) {
      setError("Login failed. Please check your connection.");
    }
  };

  return (
    <div className={style.container}>
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
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
