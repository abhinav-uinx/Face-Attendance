import React from "react";
import { LogIn, LogOut, Camera, ArrowRight, ShieldCheck } from "lucide-react";
import Styles from "./faceAttendanceMode.module.css";

const FaceAttendance = () => {
  const openNewWindow = (path) => {
    const fullUrl = `${window.location.origin}${path}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer,width=1280,height=850");
  };

  return (
    <div className={Styles.modeWrapper}>
      <div className={Styles.modeCard}>
        <div className={Styles.iconBadge}>
          <Camera className="w-7 h-7" />
        </div>

        <h2 className={Styles.title}>Select Attendance Mode</h2>
        <p className={Styles.subtitle}>
          Choose whether to launch the morning arrival check-in kiosk or evening departure check-out kiosk.
        </p>

        <div className={Styles.optionsGrid}>
          {/* Check-In Mode (IN) */}
          <button 
            type="button"
            className={`${Styles.modeOption} ${Styles.inOption}`}
            onClick={() => openNewWindow("/FaceAttendanceIN")}
          >
            <div className={Styles.inIconCircle}>
              <LogIn className="w-5 h-5" />
            </div>
            <div className={Styles.optionContent}>
              <div className={Styles.optionTitleRow}>
                <span className={Styles.optionTitle}>IN (Check-In Session)</span>
                <span className={Styles.optionBadgeIn}>Arrival</span>
              </div>
              <p className={Styles.optionDesc}>
                Real-time facial detection & period-based attendance logging
              </p>
            </div>
            <ArrowRight className={`w-5 h-5 ${Styles.arrowIcon}`} />
          </button>

          {/* Check-Out Mode (OUT) */}
          <button 
            type="button"
            className={`${Styles.modeOption} ${Styles.outOption}`}
            onClick={() => openNewWindow("/FaceAttendanceOUT")}
          >
            <div className={Styles.outIconCircle}>
              <LogOut className="w-5 h-5" />
            </div>
            <div className={Styles.optionContent}>
              <div className={Styles.optionTitleRow}>
                <span className={Styles.optionTitle}>OUT (Check-Out Session)</span>
                <span className={Styles.optionBadgeOut}>Departure</span>
              </div>
              <p className={Styles.optionDesc}>
                Real-time exit logging & dismissal verification
              </p>
            </div>
            <ArrowRight className={`w-5 h-5 ${Styles.arrowIcon}`} />
          </button>
        </div>

        <div className={Styles.footerNote}>
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Biometric neural recognition active • Opens in full kiosk window</span>
        </div>
      </div>
    </div>
  );
};

export default FaceAttendance;
