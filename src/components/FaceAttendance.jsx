import React from "react";
import Styles from "./faceAttendance.module.css"; // Import styles

const FaceAttendance = () => {
  const openNewWindow = (path) => {
    const fullUrl = `${window.location.origin}${path}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer,width=800,height=600");
  };

  return (
    <div className={Styles.popupContainer}>
      <div className={Styles.popup}>
        <h2>Select Attendance Mode</h2>
        <button className={Styles.inButton} onClick={() => openNewWindow("/FaceAttendanceIN")}>
          IN
        </button>
        <button className={Styles.outButton} onClick={() => openNewWindow("/FaceAttendanceOUT")}>
          OUT
        </button>
      </div>
    </div>
  );
};

export default FaceAttendance;
