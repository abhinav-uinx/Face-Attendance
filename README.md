# 🛡️ Face-Attendance System

[![Live Demo](https://img.shields.io/badge/demo-live%20view-blue?style=for-the-badge&logo=vercel)](https://face-attendance-dusky.vercel.app/)

An advanced Face Recognition based Attendance Management System built with React, Vite, and Supabase. This system provides a seamless way for Administrators, HODs, and Tutors to manage student attendance using AI-powered face detection.

## 🚀 Live Demo Credentials

You can use the following credentials to access the Administrative Dashboard:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@gmail.com` | `Admin@123` |

> **Note:** For the best experience, please use the login bypass if the Supabase Auth server is experiencing high latency. Simply type `admin` in the email field.

## ✨ Key Features

- **AI Face Detection**: High-precision recognition using `face-api.js` and TensorFlow.
- **Dynamic Dashboards**: Real-time attendance graphs and statistics for Administrators.
- **Role-Based Access**: Dedicated portals for Admin, HOD, and Tutors.
- **Attendance History**: View and manage historical records for every student.
- **Responsive UI**: Modern, glassmorphic design built with vanilla CSS and Material UI.

## 🛠️ Comprehensive Technology Stack

This project leverages a modern, high-performance stack to deliver a robust and secure face-attendance solution:

### **Frontend & UI/UX**
*   **React 18**: Core framework for a component-based, high-performance UI.
*   **Vite**: Next-generation frontend tooling for ultra-fast build and development.
*   **Material UI (MUI)**: Professional component library for sleek, accessible dashboards.
*   **Framer Motion**: Advanced animations for smooth transitions and an interactive UX.
*   **CSS Modules**: Scoped styling for clean, maintainable, and conflict-free vanilla CSS.
*   **Lucide React**: Clean and consistent iconography.

### **Artificial Intelligence & Machine Learning**
*   **face-api.js**: Browser-based face detection, landmark detection, and recognition.
*   **TensorFlow.js**: High-performance backend (WebGL/CPU) for running ML models in the browser.

### **Backend & Infrastructure**
*   **Supabase**: All-in-one backend-as-a-service (BaaS) providing:
    *   **PostgreSQL**: Secure and scalable relational database.
    *   **Supabase Auth**: Robust JWT-based authentication.
    *   **Supabase Storage**: Object storage for hosting student and profile photos.
*   **Vercel**: Professional deployment platform with integrated CI/CD and SPA routing.

### **Development Tools**
*   **Git**: Version control for collaborative and organized development.
*   **ESLint**: Enforcing high-quality code standards and best practices.

## ⚙️ Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/abhinav-uinx/Face-Attendance.git
   cd Face-Attendance
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
   ```

4. **Run the application**:
   ```bash
   npm run dev
   ```

## 📄 License

Distributed under the MIT License.

---
Built with ❤️ by Abhinav
