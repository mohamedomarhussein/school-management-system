import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Global components
import ScrollToTop from "./components/ScrollToTop";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

// Dashboard pages
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import Subjects from "./pages/Subjects";
import Teachers from "./pages/Teachers";
import TeacherAssignments from "./pages/TeacherAssignments";
import Timetable from "./pages/Timetable";
import Attendance from "./pages/Attendance";
import Exams from "./pages/Exams";
import Finance from "./pages/Finance";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

// Protect administration routes
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
      {/* Automatically scroll to the top when the URL changes */}
      <ScrollToTop />

      <Routes>
        {/* ================= PUBLIC WEBSITE ================= */}

        <Route path="/" element={<Home />} />

        {/* ================= AUTHENTICATION ================= */}

        <Route path="/login" element={<Login />} />

        {/* ================= LEGAL PAGES ================= */}

        <Route path="/terms" element={<Terms />} />

        <Route path="/privacy" element={<Privacy />} />

        {/* ================= ADMINISTRATION DASHBOARD ================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Students */}
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <Dashboard>
                <Students />
              </Dashboard>
            </ProtectedRoute>
          }
        />

        {/* Classes */}
        <Route
          path="/classes"
          element={
            <ProtectedRoute>
              <Dashboard>
                <Classes />
              </Dashboard>
            </ProtectedRoute>
          }
        />

        {/* Subjects */}
        <Route
          path="/subjects"
          element={
            <ProtectedRoute>
              <Dashboard>
                <Subjects />
              </Dashboard>
            </ProtectedRoute>
          }
        />

        {/* Teachers */}
        <Route
          path="/teachers"
          element={
            <ProtectedRoute>
              <Dashboard>
                <Teachers />
              </Dashboard>
            </ProtectedRoute>
          }
        />

        {/* Teacher assignments */}
        <Route
          path="/teacher-assignments"
          element={
            <ProtectedRoute>
              <Dashboard>
                <TeacherAssignments />
              </Dashboard>
            </ProtectedRoute>
          }
        />

        {/* Timetable */}
        <Route
          path="/timetable"
          element={
            <ProtectedRoute>
              <Dashboard>
                <Timetable />
              </Dashboard>
            </ProtectedRoute>
          }
        />

        {/* Attendance */}
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <Dashboard>
                <Attendance />
              </Dashboard>
            </ProtectedRoute>
          }
        />

        {/* Examinations */}
        <Route
          path="/exams"
          element={
            <ProtectedRoute>
              <Dashboard>
                <Exams />
              </Dashboard>
            </ProtectedRoute>
          }
        />

        {/* Finance */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute>
              <Dashboard>
                <Finance />
              </Dashboard>
            </ProtectedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Dashboard>
                <Reports />
              </Dashboard>
            </ProtectedRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Dashboard>
                <Notifications />
              </Dashboard>
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Dashboard>
                <Settings />
              </Dashboard>
            </ProtectedRoute>
          }
        />

        {/* ================= UNKNOWN ROUTES ================= */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
