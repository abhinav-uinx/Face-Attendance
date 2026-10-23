import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import supabase from "../../utils/supabase";
import style from "./attendanceGraph.module.css";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

const formatDate = (date) => date.toISOString().slice(0, 10);

const AttendanceGraph = () => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    const [attendanceResult, studentsResult, departmentsResult] = await Promise.all([
      supabase
        .from("tbl_attendance")
        .select("attendance_date, student_id, period, status, entry_time, exit_time")
        .limit(1000),
      supabase
        .from("tbl_student")
        .select("student_id, student_name, stud_email, stud_contact, stud_photo, department_id"),
      supabase
        .from("tbl_department")
        .select("department_id, department_name")
    ]);

    if (attendanceResult.error) console.error("Attendance Sync Error:", attendanceResult.error.message);
    if (studentsResult.error) console.error("Student Sync Error:", studentsResult.error.message);
    if (departmentsResult.error) console.error("Dept Sync Error:", departmentsResult.error.message);

    const cleanAttendance = (attendanceResult.data || []).sort((a, b) => 
      new Date(a.attendance_date) - new Date(b.attendance_date)
    );

    setAttendance(cleanAttendance);
    setStudents(studentsResult.data || []);
    setDepartments(departmentsResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleExportCSV = () => {
    if (!attendance || attendance.length === 0) {
      alert("No attendance records to export yet.");
      return;
    }

    const studentById = new Map(students.map((s) => [String(s.student_id), s]));
    const departmentById = new Map(departments.map((d) => [String(d.department_id), d.department_name]));

    const headers = ["Student ID", "Student Name", "Department", "Date", "Status", "Period", "Entry Time", "Exit Time"];
    const rows = attendance.map((rec) => {
      const student = studentById.get(String(rec.student_id));
      const deptName = student ? departmentById.get(String(student.department_id)) || "General" : "N/A";
      return [
        rec.student_id || "",
        `"${(student?.student_name || "Unknown").replace(/"/g, '""')}"`,
        `"${deptName.replace(/"/g, '""')}"`,
        rec.attendance_date || "",
        `"${rec.status || "Present"}"`,
        `"${rec.period || "Regular"}"`,
        rec.entry_time || "--",
        rec.exit_time || "--"
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_records_${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dashboard = useMemo(() => {
    const today = formatDate(new Date());
    const studentById = new Map(students.map((student) => [String(student.student_id), student]));
    const departmentById = new Map(
      departments.map((department) => [String(department.department_id), department.department_name])
    );

    const todayStudents = new Set(
      attendance
        .filter((record) => record.attendance_date === today)
        .map((record) => String(record.student_id))
    );

    const dailyMap = new Map();
    for (let index = 13; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      dailyMap.set(formatDate(date), new Set());
    }

    attendance.forEach((record) => {
      if (dailyMap.has(record.attendance_date)) {
        dailyMap.get(record.attendance_date).add(String(record.student_id));
      }
    });

    const dailyTrend = Array.from(dailyMap.entries()).map(([date, presentSet]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      present: presentSet.size,
    }));

    const departmentToday = departments.map((department) => ({
      department: department.department_name,
      present: 0,
    }));

    todayStudents.forEach((studentId) => {
      const student = studentById.get(studentId);
      const departmentName = departmentById.get(String(student?.department_id));
      const row = departmentToday.find((item) => item.department === departmentName);
      if (row) row.present += 1;
    });

    const averageDaily =
      dailyTrend.length > 0
        ? Math.round(dailyTrend.reduce((total, item) => total + item.present, 0) / dailyTrend.length)
        : 0;

    const recentRecords = attendance
      .slice(-6)
      .reverse()
      .map((record) => {
        const student = studentById.get(String(record.student_id));
        return {
          ...record,
          studentName: student?.student_name || "Unknown Student",
        };
      });

    return {
      todayPresent: todayStudents.size,
      totalStudents: students.length,
      activeDepartments: departments.length,
      averageDaily,
      dailyTrend,
      departmentToday,
      recentRecords,
    };
  }, [attendance, students, departments]);

  const filteredRecentRecords = useMemo(() => {
    if (!searchQuery.trim()) return dashboard.recentRecords || [];
    const q = searchQuery.toLowerCase().trim();
    return (dashboard.recentRecords || []).filter((record) =>
      String(record.studentName || "").toLowerCase().includes(q) ||
      String(record.student_id || "").toLowerCase().includes(q)
    );
  }, [dashboard.recentRecords, searchQuery]);

  const attendanceRate =
    dashboard.totalStudents > 0
      ? Math.round((dashboard.todayPresent / dashboard.totalStudents) * 100)
      : 0;

  return (
    <div className={style.dashboard}>
      {/* 🏛️ Dashboard Overview Header & Quick Actions */}
      <section className={style.hero}>
        <div className={style.heroContent}>
          <span className={style.eyebrow}>
            <EventAvailableOutlinedIcon className={style.eyebrowIcon} />
            Real-time Verification
          </span>
          <h2>Campus Attendance Overview</h2>
          <p className={style.heroSubtitle}>Live biometric check-ins and departmental analytics</p>
        </div>

        <div className={style.heroRight}>
          <div className={style.rateBadge}>
            <CheckCircleOutlineOutlinedIcon className={style.badgeIcon} />
            <span>{attendanceRate}% Present Today</span>
          </div>

          <button className={style.actionBtn} onClick={handleExportCSV} title="Export CSV Report">
            <FileDownloadOutlinedIcon fontSize="small" />
            <span>Export CSV</span>
          </button>

          <button className={style.actionBtn} onClick={fetchDashboardData} disabled={loading} title="Refresh Live Data">
            <RefreshOutlinedIcon fontSize="small" />
            <span>{loading ? "Syncing..." : "Refresh"}</span>
          </button>

          <button className={style.primaryActionBtn} onClick={() => navigate("/adminhome/FaceAttendance")}>
            <VideocamOutlinedIcon fontSize="small" />
            <span>Start Attendance</span>
          </button>
        </div>
      </section>

      {/* 📊 Stat Metric Highlights */}
      <section className={style.statsGrid}>
        <div className={style.statCard}>
          <div className={style.statHeader}>
            <span>Present Today</span>
            <div className={`${style.statIconWrapper} ${style.emerald}`}>
              <CheckCircleOutlineOutlinedIcon fontSize="small" />
            </div>
          </div>
          <strong>{loading ? "--" : dashboard.todayPresent}</strong>
        </div>

        <div className={style.statCard}>
          <div className={style.statHeader}>
            <span>Total Students</span>
            <div className={`${style.statIconWrapper} ${style.blue}`}>
              <PeopleOutlineOutlinedIcon fontSize="small" />
            </div>
          </div>
          <strong>{loading ? "--" : dashboard.totalStudents}</strong>
        </div>

        <div className={style.statCard}>
          <div className={style.statHeader}>
            <span>Avg Daily Present</span>
            <div className={`${style.statIconWrapper} ${style.indigo}`}>
              <TrendingUpOutlinedIcon fontSize="small" />
            </div>
          </div>
          <strong>{loading ? "--" : dashboard.averageDaily}</strong>
        </div>

        <div className={style.statCard}>
          <div className={style.statHeader}>
            <span>Departments</span>
            <div className={`${style.statIconWrapper} ${style.amber}`}>
              <AccountBalanceOutlinedIcon fontSize="small" />
            </div>
          </div>
          <strong>{loading ? "--" : dashboard.activeDepartments}</strong>
        </div>
      </section>

      {/* 📈 14-Day Attendance Trend & Department Charts */}
      <section className={style.chartGrid}>
        <div className={style.panel}>
          <div className={style.panelHeader}>
            <div className={style.panelTitleGroup}>
              <TrendingUpOutlinedIcon className={style.panelHeaderIcon} />
              <div>
                <h3>14-Day Attendance Trend</h3>
                <span>Unique student verifications</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dashboard.dailyTrend}>
              <defs>
                <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
                  color: "#0b132b",
                  fontWeight: 600,
                }}
              />
              <Area type="monotone" dataKey="present" stroke="#2563eb" strokeWidth={2.5} fill="url(#attendanceFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={style.panel}>
          <div className={style.panelHeader}>
            <div className={style.panelTitleGroup}>
              <BarChartOutlinedIcon className={style.panelHeaderIcon} />
              <div>
                <h3>Department Today</h3>
                <span>Students marked present by dept</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dashboard.departmentToday}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="department" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
                  color: "#0b132b",
                  fontWeight: 600,
                }}
              />
              <Bar dataKey="present" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 🕒 Recent Verified Check-Ins */}
      <section className={style.panel}>
        <div className={style.panelHeader}>
          <div className={style.panelTitleGroup}>
            <AccessTimeOutlinedIcon className={style.panelHeaderIcon} />
            <div>
              <h3>Recent Check-Ins</h3>
              <span>Latest verified student records</span>
            </div>
          </div>
          <div className={style.searchBox}>
            <SearchOutlinedIcon className={style.searchIcon} />
            <input
              type="text"
              placeholder="Search check-ins by student name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className={style.recentList}>
          {filteredRecentRecords.length > 0 ? (
            filteredRecentRecords.map((record, index) => (
              <div className={style.recentItem} key={`${record.student_id}-${record.attendance_date}-${index}`}>
                <div className={style.recentStudent}>
                  <div className={style.studentDot}></div>
                  <strong>{record.studentName}</strong>
                </div>
                <span className={style.recentDate}>{record.attendance_date}</span>
                <span className={style.periodBadge}>{record.period || "Present"}</span>
              </div>
            ))
          ) : (
            <div className={style.emptyState}>
              {searchQuery ? `No records matching "${searchQuery}".` : "No attendance records recorded yet today."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AttendanceGraph;
