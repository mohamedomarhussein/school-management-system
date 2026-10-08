import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import Subjects from "./pages/Subjects";
import TeacherAssignments from "./pages/TeacherAssignments";
import Attendance from "./pages/Attendance";
import Finance from "./pages/Finance";
import Exams from "./pages/Exams";

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
        <Route path="/login" element={<Login />} />

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
              <Dashboard>
                <Students />
              </Dashboard>
            </ProtectedRoute>
          }
        />

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

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
