import React from "react";
import { Routes, Route } from "react-router-dom";
import TutorProfileEdit from "../Tutors/TutorProfileEdit";


const TutorRouter = () => {
  return (
    <Routes>
      <Route path="/TutorProfileEdit" element={<TutorProfileEdit />} />
    </Routes>
  );
};

export default TutorRouter;
