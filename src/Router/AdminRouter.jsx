import React from "react";
import { Route, Routes } from "react-router-dom";
import AddHOD from "../Admin/pages/HOD/AddHOD";
import AddStudents from "../Admin/pages/Students/AddStudents";
import AddTutor from "../Admin/pages/Tutor/AddTutor";
import AddYear from "../Admin/pages/Year/AddYear";
import AddDepartment from "../Admin/pages/Department/AddDepartment";
import ViewHOD from "../Admin/pages/HOD/ViewHOD";
import ViewTutor from "../Admin/pages/Tutor/ViewTutor";
import ViewStudents from "../Admin/pages/Students/ViewStudents";
import AddProgramme from "../Admin/pages/Programme/AddProgramme";
import FaceAttendance from "../components/FaceAttendance";
import Complaint from "../Admin/pages/complaint/Complaint";
import ViewAttendance from "../Admin/pages/Students/ViewAttendance";
import AdminProfileEdit from "../Admin/AdminProfileEdit";
import AttendanceGraph from "../Admin/components/AttendanceGraph";
import Designation from "../Admin/pages/Designation/Designation";
import Search from "../Admin/pages/Search";
import EditPeriods from "../Admin/pages/EditPeriods";

const AdminRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<AttendanceGraph />} />
      <Route path="ViewHOD" element={<ViewHOD />} />
      <Route path="AddHOD" element={<AddHOD />} />
      <Route path="FaceAttendance" element={<FaceAttendance />} />
      <Route path="AddStudents" element={<AddStudents />} />
      <Route path="Tutor" element={<AddTutor />} />
      <Route path="Year" element={<AddYear />} />
      <Route path="Department" element={<AddDepartment />} />
      <Route path="ViewTutor" element={<ViewTutor />} />
      <Route path="AddTutor" element={<AddTutor />} />
      <Route path="ViewStudents" element={<ViewStudents />} />
      <Route path="Programme" element={<AddProgramme />} />
      <Route path="Designation" element={<Designation />} />
      <Route path="Complaint" element={<Complaint />} />
      <Route path="Attendance" element={<ViewAttendance />} />
      <Route path="AdminProfileEdit" element={<AdminProfileEdit />} />
      <Route path="Search" element={<Search />} />
      <Route path="EditPeriods" element={<EditPeriods />} />
    </Routes>
  );
};

export default AdminRouter;
