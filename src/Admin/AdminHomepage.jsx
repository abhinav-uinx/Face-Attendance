import React from 'react';
import AdminRouter from '../Router/AdminRouter.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import Navbar from './components/Navbar/Navbar.jsx';
import style from './adminhomepage.module.css';

const AdminHomepage = () => {
  const AdminEmail = sessionStorage.getItem("admin_email");
  console.log(AdminEmail);

  return (
    <div className={style.home}>
      <Sidebar />
      <div className={style.homeContainer}>
        <Navbar />
        <AdminRouter />
  
      </div>
    </div>
  );
};

export default AdminHomepage;
