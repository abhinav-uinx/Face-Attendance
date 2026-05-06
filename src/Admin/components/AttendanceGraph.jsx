import React, { useEffect, useMemo, useState } from "react";
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

const formatDate = (date) => date.toISOString().slice(0, 10);

const AttendanceGraph = () => {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      const [attendanceResult, studentsResult, departmentsResult] = await Promise.all([
        supabase
          .from("tbl_attendance")
          .select("attendance_date, student_id")
          .limit(1000), // Remove ordering to avoid 400 errors if column naming is strict
        supabase
          .from("tbl_student")
          .select("student_id, student_name, department_id"),
        supabase
          .from("tbl_department")
          .select("department_id, department_name")
      ]);

      if (attendanceResult.error) console.error("Attendance Sync Error:", attendanceResult.error.message);
      if (studentsResult.error) console.error("Student Sync Error:", studentsResult.error.message);
      if (departmentsResult.error) console.error("Dept Sync Error:", departmentsResult.error.message);

      // Consistently sort and clean data in memory
      const cleanAttendance = (attendanceResult.data || []).sort((a, b) => 
        new Date(a.attendance_date) - new Date(b.attendance_date)
      );

      setAttendance(cleanAttendance);
      setStudents(studentsResult.data || []);
      setDepartments(departmentsResult.data || []);
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

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
      .slice(-8)
      .reverse()
      .map((record) => {
        const student = studentById.get(String(record.student_id));
        return {
          ...record,
          studentName: student?.student_name || record.student_id,
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

  const attendanceRate =
    dashboard.totalStudents > 0
      ? Math.round((dashboard.todayPresent / dashboard.totalStudents) * 100)
      : 0;

  return (
    <div className={style.dashboard}>
      <section className={style.hero}>
        <div>
          <span className={style.eyebrow}>Live Attendance</span>
          <h2>Today&apos;s campus presence at a glance</h2>
        </div>
        <div className={style.rateBadge}>{attendanceRate}% present today</div>
      </section>

      <section className={style.statsGrid}>
        <div className={style.statCard}>
          <span>Present Today</span>
          <strong>{loading ? "--" : dashboard.todayPresent}</strong>
        </div>
        <div className={style.statCard}>
          <span>Total Students</span>
          <strong>{loading ? "--" : dashboard.totalStudents}</strong>
        </div>
        <div className={style.statCard}>
          <span>Avg Daily Present</span>
          <strong>{loading ? "--" : dashboard.averageDaily}</strong>
        </div>
        <div className={style.statCard}>
          <span>Departments</span>
          <strong>{loading ? "--" : dashboard.activeDepartments}</strong>
        </div>
      </section>

      <section className={style.chartGrid}>
        <div className={style.panel}>
          <div className={style.panelHeader}>
            <h3>14 Day Trend</h3>
            <span>Unique students marked present</span>
          </div>
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={dashboard.dailyTrend}>
              <defs>
                <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#68d391" stopOpacity={0.38} />
                  <stop offset="95%" stopColor="#68d391" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(245,245,247,0.56)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(245,245,247,0.56)" tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#111214", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="present" stroke="#68d391" strokeWidth={3} fill="url(#attendanceFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={style.panel}>
          <div className={style.panelHeader}>
            <h3>Department Today</h3>
            <span>Present students by department</span>
          </div>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={dashboard.departmentToday}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="department" stroke="rgba(245,245,247,0.56)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(245,245,247,0.56)" tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#111214", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
              <Bar dataKey="present" fill="#7dd3fc" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={style.panel}>
        <div className={style.panelHeader}>
          <h3>Recent Attendance</h3>
          <span>Latest check-ins from the system</span>
        </div>
        <div className={style.recentList}>
          {dashboard.recentRecords.length > 0 ? (
            dashboard.recentRecords.map((record, index) => (
              <div className={style.recentItem} key={`${record.student_id}-${record.attendance_date}-${index}`}>
                <strong>{record.studentName}</strong>
                <span>{record.attendance_date}</span>
                <small>{record.period || "Attendance marked"}</small>
              </div>
            ))
          ) : (
            <div className={style.emptyState}>No attendance records yet.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AttendanceGraph;
