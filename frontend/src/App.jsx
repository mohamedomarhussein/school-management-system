import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import Subjects from "./pages/Subjects";
import TeacherAssignments from "./pages/TeacherAssignments";
import Timetable from "./pages/Timetable";
import Teachers from "./pages/Teachers";
import Attendance from "./pages/Attendance";
import Finance from "./pages/Finance";
import Exams from "./pages/Exams";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public website */}
        <Route path="/" element={<Home />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />

        {/* Protected administration dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <Dashboard><Students /></Dashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/classes"
          element={
            <ProtectedRoute>
              <Dashboard><Classes /></Dashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/subjects"
          element={
            <ProtectedRoute>
              <Dashboard><Subjects /></Dashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teachers"
          element={
            <ProtectedRoute>
              <Dashboard><Teachers /></Dashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-assignments"
          element={
            <ProtectedRoute>
              <Dashboard><TeacherAssignments /></Dashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/timetable"
          element={
            <ProtectedRoute>
              <Dashboard><Timetable /></Dashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <Dashboard><Attendance /></Dashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/exams"
          element={
            <ProtectedRoute>
              <Dashboard><Exams /></Dashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/finance"
          element={
            <ProtectedRoute>
              <Dashboard><Finance /></Dashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Dashboard><Reports /></Dashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Dashboard><Notifications /></Dashboard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Dashboard><Settings /></Dashboard>
            </ProtectedRoute>
          }
        />

        {/* Legal pages will be added separately */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
