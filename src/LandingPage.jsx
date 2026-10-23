<<<<<<< HEAD
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Zap, Target, ArrowRight, CheckCircle2 } from "lucide-react";
import style from "./landing.module.css";
import faceLogo from "./assets/face.png";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className={style.landing}>
      {/* 🌊 Animated Ambient Blue Background */}
      <div className={style.backgroundMesh}></div>
      <div className={`${style.ambientOrb} ${style.orb1}`}></div>
      <div className={`${style.ambientOrb} ${style.orb2}`}></div>
      <div className={`${style.ambientOrb} ${style.orb3}`}></div>

      {/* 🌟 Neat Navigation Bar */}
      <header className={style.navbar}>
        <div className={style.brand}>
          <div className={style.logoBadge}>
            <img src={faceLogo} alt="Face Inn Logo" className={style.logoImg} />
          </div>
          <div className={style.brandText}>
            <span className={style.brandTitle}>Face Inn</span>
            <span className={style.brandTag}>Biometric Attendance</span>
          </div>
        </div>

        <div className={style.navActions}>
          <button className={style.navLoginBtn} onClick={() => navigate("/Login")}>
            Sign In
          </button>
        </div>
      </header>

      {/* 🎯 Fit-to-Page Center Content */}
      <main className={style.heroContainer}>
        <motion.h1
          className={style.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          Smart Attendance Through <span className={style.highlight}>Face Recognition</span>
        </motion.h1>

        <motion.p
          className={style.subtitle}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Contactless, instant biometric verification powered by in-browser neural networks.
          Engineered for high-accuracy and secure verification.
        </motion.p>

        {/* 🔘 Neat Action Button */}
        <motion.div
          className={style.ctaGroup}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <button className={style.primaryBtn} onClick={() => navigate("/Login")}>
            <span>Launch Portal</span>
            <ArrowRight className={style.btnIcon} />
          </button>
        </motion.div>

        {/* 🗂️ Clean Compact Feature Cards Grid */}
        <motion.div
          className={style.featuresGrid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {[
            {
              icon: <Zap className={style.featureIconZap} />,
              title: "Instant Verification",
              desc: "Millisecond face matching with zero hardware latency.",
            },
            {
              icon: <Shield className={style.featureIconShield} />,
              title: "Encrypted & Secure",
              desc: "Client-side tensor inference with anti-spoofing security.",
            },
            {
              icon: <Target className={style.featureIconTarget} />,
              title: "99.9% Accuracy",
              desc: "68-point facial landmark analysis in diverse lighting.",
            },
          ].map((feature, i) => (
            <div key={i} className={style.featureCard}>
              <div className={style.featureIconWrapper}>{feature.icon}</div>
              <div className={style.featureText}>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </main>

      {/* ⚓ Bottom Status Footer */}
      <footer className={style.footer}>
        <div className={style.footerLeft}>
          <CheckCircle2 className={style.checkIcon} />
          <span>Real-time verification powered by TensorFlow.js & Supabase</span>
        </div>
        <div className={style.footerRight}>
          <span>Face Inn &copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
=======
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Zap, Target, ArrowRight } from "lucide-react";
import style from "./landing.module.css";
import abstractBg from "./assets/abstract_bg.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      setMousePosition({ x, y });
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={style.landing} ref={containerRef}>
      <img src={abstractBg} alt="Background" className={style.bgImage} />
      <div className={style.gradientOverlay}></div>
      
      <motion.div 
        className={style.hero}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px)`
        }}
      >
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Intelligence in <span>Recognition</span>
        </motion.h1>
        <div className={style.glowLine}></div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          The next generation of attendance tracking. Powered by advanced neural networks 
          for seamless, real-time facial verification and secure management.
        </motion.p>
        <motion.button 
          className={style.btn} 
          onClick={() => navigate("/login")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Launch Portal <ArrowRight className="inline-block ml-2 w-5 h-5" />
        </motion.button>
      </motion.div>

      <motion.div 
        className={style.featuresGrid}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 1 }}
      >
        {[
          { icon: <Zap />, title: "Instant Recognition", desc: "Validate identity in milliseconds with our high-performance AI engine." },
          { icon: <Shield />, title: "Enterprise Security", desc: "End-to-end encrypted data with spoofing detection to prevent fraud." },
          { icon: <Target />, title: "99.9% Accuracy", desc: "Precise recognition even in low light or with accessories like glasses." }
        ].map((feature, i) => (
          <div key={i} className={style.featureCard}>
            <div className={style.featureIcon}>{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.desc}</p>
          </div>
        ))}
      </motion.div>
>>>>>>> ce651ff24ddcb1014f389686533b192c9e380b25
    </div>
  );
};

export default LandingPage;