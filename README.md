# 🛡️ Face-Attendance System

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

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Material UI, Framer Motion
- **Backend**: Supabase (Auth, Database, Storage)
- **AI/ML**: face-api.js, TensorFlow.js
- **Icons**: Lucide-React, Material Icons

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
