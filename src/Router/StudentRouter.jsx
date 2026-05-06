import React from "react";
import { Route, Routes } from "react-router-dom";
import ComplaintPage from "../Students/pages/complaintPage";
import StudentProfileEdit from "../Students/StudentProfileEdit";



const StudentRouter = () => {
  return (
    <Routes>  
      <Route path="complaint" element={<ComplaintPage />} />   
      <Route path="StudentProfileEdit" element={<StudentProfileEdit />} />   
    </Routes>
  );
};

export default StudentRouter;
