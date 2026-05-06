import React from 'react'
import AdminHomepage from '../Admin/AdminHomepage'
import { Route, Routes } from 'react-router-dom'
import LandingPage from '../LandingPage'
import HODhomepage from '../HOD/HODhomepage'
import LoginPage from '../Login/LoginPage'
import TutorsHomepage from '../Tutors/TutorsHomepage'
import StudentsHomepage from '../Students/StudentsHomepage'
import Dashboard from '../Admin/Dashborad'
import FaceAttendanceOUT from '../components/FaceAttendanceOUT'
import FaceAttendanceIN from '../components/FaceAttendanceIN'
import AdminSeeder from '../Login/AdminSeeder'

const Mainroutes = () => {
  return (
    <div>
<Routes>
   
  <Route path="adminhome/*" element={<AdminHomepage />} />
  <Route path="/*" element={<LandingPage />} />
  <Route path="Login/*" element={<LoginPage />} />
  <Route path="HODhomepage/*" element={<HODhomepage />} />
  <Route path="TutorsHomepage/*" element={<TutorsHomepage />} />
  <Route path="StudentsHomepage/*" element={<StudentsHomepage />} />
  <Route path="Dashboard/*" element={<Dashboard />} />
  <Route path="FaceAttendanceIN" element={<FaceAttendanceIN />} />
  <Route path="FaceAttendanceOUT" element={<FaceAttendanceOUT />} />
  <Route path="seed-admin" element={<AdminSeeder />} />
  </Routes>

    </div>
  )
}

export default Mainroutes