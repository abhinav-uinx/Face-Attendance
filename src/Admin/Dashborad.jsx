import React from "react";
import { FaHome, FaChartBar, FaTasks, FaUser, FaPlus } from "react-icons/fa";
import styles from "./dashboard.module.css"; // Import CSS module

const Dashboard = () => {
  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>📊</div>
        <nav>
          <a href="#" className={styles.active}><FaHome /> Home</a>
          <a href="#"><FaChartBar /> Stats</a>
          <a href="#"><FaTasks /> Tasks</a>
          <a href="#"><FaUser /> Profile</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header>
          <h1>Stats</h1>
          <p>Monthly Updates</p>
        </header>

        {/* Charts Section */}
        <section className={styles.chartsSection}>
          <div className={styles.chartCard}>Daily Time Log Activity</div>
          <div className={styles.chartCard}>Weekly Invoices</div>
        </section>

        {/* Stats Overview */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>Tasks Completed: <span>27</span></div>
          <div className={styles.statCard}>New Tasks Assigned: <span>45</span></div>
          <div className={styles.statCard}>Objectives Completed: <span>24</span></div>
          <div className={styles.statCard}>Project Completed: <span>61%</span></div>
        </section>
      </main>

      {/* Right Panel - Schedule */}
      <aside className={styles.rightPanel}>
        <h2>Today, 12 Dec</h2>
        <ul className={styles.scheduleList}>
          <li>📅 Dental Cleaning - 8:00 AM</li>
          <li>📌 Status Update - 8:30 AM</li>
          <li>📅 Calendar Updates - 9:30 AM</li>
          <li>📩 Send Status Report - 11:00 AM</li>
          <li>🤝 Meeting with AR Shakir - 12:00 PM</li>
          <li>📞 Call New Leads - 1:00 PM</li>
        </ul>
        <button className={styles.addBtn}><FaPlus /></button>
      </aside>
    </div>
  );
};

export default Dashboard;
