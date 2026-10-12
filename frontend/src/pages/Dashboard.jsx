import "./Dashboard.css";
import {
  BookOpen,
  Bell,
  CalendarCheck,
  ChartNoAxesCombined,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

function Dashboard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [statistics, setStatistics] = useState({
    students: null,
    classes: null,
    subjects: null,
  });

  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [statisticsError, setStatisticsError] = useState(false);
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    let mounted = true;

    const fetchUnreadCount = async () => {
      try {
        const response = await api.get("/notifications/unread-count");

        if (mounted) {
          const count = Number(response.data?.count ?? 0);
          setUnreadCount(Number.isFinite(count) ? count : 0);
        }
      } catch (error) {
        if (mounted) {
          console.error("Could not load unread notifications:", error);
        }
      }
    };

    fetchUnreadCount();

    const intervalId = window.setInterval(fetchUnreadCount, 30000);

    const handleWindowFocus = () => {
      fetchUnreadCount();
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    const fetchStatistics = async () => {
      setStatisticsLoading(true);
      setStatisticsError(false);

      try {
        const [studentsResponse, classesResponse, subjectsResponse] =
          await Promise.all([
            api.get("/admin/students"),
            api.get("/admin/classes"),
            api.get("/admin/subjects"),
          ]);

        const students = studentsResponse.data?.students;
        const classes = classesResponse.data?.classes;
        const subjects = subjectsResponse.data?.subjects;

        if (
          !Array.isArray(students) ||
          !Array.isArray(classes) ||
          !Array.isArray(subjects)
        ) {
          throw new Error("Unexpected dashboard statistics response.");
        }

        if (mounted) {
          setStatistics({
            students: students.length,
            classes: classes.length,
            subjects: subjects.length,
          });
        }
      } catch (error) {
        console.error("Could not load dashboard statistics:", error);

        if (mounted) {
          setStatisticsError(true);
        }
      } finally {
        if (mounted) {
          setStatisticsLoading(false);
        }
      }
    };

    const fetchBackendStatus = async () => {
      try {
        await api.get("/health");

        if (mounted) {
          setBackendStatus("Online");
        }
      } catch (error) {
        if (mounted) {
          setBackendStatus("Unavailable");
        }
      }
    };

    fetchStatistics();
    fetchBackendStatus();

    return () => {
      mounted = false;
    };
  }, []);

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const navigation = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Students", icon: Users, path: "/students" },
    { label: "Classes & Streams", icon: GraduationCap, path: "/classes" },
    { label: "Subjects", icon: BookOpen, path: "/subjects" },
    { label: "Teachers", icon: GraduationCap, path: "/teachers" },
    {
      label: "Teacher Assignments",
      icon: UserCheck,
      path: "/teacher-assignments",
    },
    { label: "Timetable", icon: CalendarClock, path: "/timetable" },
    { label: "Attendance", icon: CalendarCheck, path: "/attendance" },
    {
      label: "Reports & Analytics",
      icon: ChartNoAxesCombined,
      path: "/reports",
    },
    { label: "Exams & Results", icon: ClipboardList, path: "/exams" },
    { label: "Finance", icon: Wallet, path: "/finance" },
    { label: "Notifications", icon: Bell, path: "/notifications" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const displayStatistic = (value) => {
    if (statisticsLoading) return "…";
    if (statisticsError) return "—";
    return value ?? 0;
  };

  const statusClass = (status) =>
    status === "Online" ? "status-online" : "status-unavailable";

  return (
    <div className="dashboard-layout">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="school-logo">
            <GraduationCap size={24} />
          </div>

          <div>
            <h2>SchoolMS</h2>
            <p>Administration</p>
          </div>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <button
                key={item.path}
                className={`nav-item ${active ? "active" : ""}`}
                onClick={() => handleNavigation(item.path)}
              >
                <Icon size={19} />
                <span>{item.label}</span>

                {item.path === "/notifications" && unreadCount > 0 && (
                  <span
                    aria-label={`${unreadCount} unread notifications`}
                    title={`${unreadCount} unread notifications`}
                    style={{
                      marginLeft: "auto",
                      minWidth: "22px",
                      height: "22px",
                      padding: "0 6px",
                      borderRadius: "999px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${
              location.pathname === "/settings" ? "active" : ""
            }`}
            onClick={() => handleNavigation("/settings")}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <button className="nav-item logout-button" onClick={handleLogout}>
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>

          <div>
            <h1>
              {location.pathname === "/dashboard"
                ? "School Management"
                : navigation.find((item) => item.path === location.pathname)
                    ?.label || "School Management"}
            </h1>
            <p>Administration panel</p>
          </div>

          <div className="admin-profile">
            <div className="avatar">
              {(user.name || user.full_name || "S")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user.name || user.full_name || "System Administrator"}
              </strong>
              <span>{user.role || "admin"}</span>
            </div>
          </div>
        </header>

        {children || (
          <div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div>
                  <span>Total Students</span>
                  <strong>{displayStatistic(statistics.students)}</strong>
                </div>
                <Users size={28} />
              </div>

              <div className="stat-card">
                <div>
                  <span>Classes</span>
                  <strong>{displayStatistic(statistics.classes)}</strong>
                </div>
                <GraduationCap size={28} />
              </div>

              <div className="stat-card">
                <div>
                  <span>Subjects</span>
                  <strong>{displayStatistic(statistics.subjects)}</strong>
                </div>
                <BookOpen size={28} />
              </div>

              <div className="stat-card">
                <div>
                  <span>Attendance</span>
                  <strong>View records</strong>
                </div>
                <CalendarCheck size={28} />
              </div>
            </div>

            {statisticsError && (
              <p role="alert" className="dashboard-error">
                Could not load school statistics. Please refresh the page or
                sign in again.
              </p>
            )}

            <div className="dashboard-grid">
              <section className="dashboard-card">
                <div className="card-header">
                  <h3>Quick Actions</h3>
                  <p>Common administration tasks</p>
                </div>

                <div className="quick-actions">
                  <button onClick={() => navigate("/students")}>
                    <Users size={20} />
                    <span>Students</span>
                  </button>

                  <button onClick={() => navigate("/classes")}>
                    <GraduationCap size={20} />
                    <span>Classes</span>
                  </button>

                  <button onClick={() => navigate("/subjects")}>
                    <BookOpen size={20} />
                    <span>Subjects</span>
                  </button>

                  <button onClick={() => navigate("/exams")}>
                    <ClipboardList size={20} />
                    <span>Exams & Results</span>
                  </button>

                  <button onClick={() => navigate("/finance")}>
                    <Wallet size={20} />
                    <span>Finance</span>
                  </button>
                </div>
              </section>

              <section className="dashboard-card">
                <div className="card-header">
                  <h3>System Status</h3>
                  <p>Current system information</p>
                </div>

                <div className="system-status">
                  <div>
                    <span>Backend API</span>
                    <strong className={statusClass(backendStatus)}>
                      {backendStatus}
                    </strong>
                  </div>

                  <div>
                    <span>School statistics</span>
                    <strong
                      className={
                        statisticsError
                          ? "status-unavailable"
                          : statisticsLoading
                            ? "status-checking"
                            : "status-online"
                      }
                    >
                      {statisticsLoading
                        ? "Loading..."
                        : statisticsError
                          ? "Unavailable"
                          : "Loaded"}
                    </strong>
                  </div>

                  <div>
                    <span>Authentication</span>
                    <strong className="status-online">
                      Session active
                    </strong>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
