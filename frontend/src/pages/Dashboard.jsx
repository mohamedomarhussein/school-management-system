import {
  BookOpen,
  CalendarCheck,
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
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Dashboard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const navigation = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      label: "Students",
      icon: Users,
      path: "/students",
    },
    {
      label: "Classes & Streams",
      icon: GraduationCap,
      path: "/classes",
    },
    {
      label: "Subjects",
      icon: BookOpen,
      path: "/subjects",
    },
    {
      label: "Teacher Assignments",
      icon: UserCheck,
      path: "/teacher-assignments",
    },
    {
      label: "Attendance",
      icon: CalendarCheck,
      path: "/attendance",
    },
    {
      label: "Finance",
      icon: Wallet,
      path: "/finance",
    },
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

  return (
    <div className="dashboard-layout">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
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
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              location.pathname === item.path;

            return (
              <button
                key={item.path}
                className={`nav-item ${
                  active ? "active" : ""
                }`}
                onClick={() =>
                  handleNavigation(item.path)
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="nav-item"
            onClick={() => handleNavigation("/settings")}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <button
            className="nav-item logout-button"
            onClick={handleLogout}
          >
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
          >
            <Menu size={22} />
          </button>

          <div>
            <h1>
              {location.pathname === "/dashboard"
                ? "School Management"
                : navigation.find(
                    (item) =>
                      item.path === location.pathname
                  )?.label || "School Management"}
            </h1>

            <p>Administration panel</p>
          </div>

          <div className="admin-profile">
            <div className="avatar">
              {(user.name ||
                user.full_name ||
                "S"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user.name ||
                  user.full_name ||
                  "System Administrator"}
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
                  <strong>3</strong>
                </div>
                <Users size={28} />
              </div>

              <div className="stat-card">
                <div>
                  <span>Classes</span>
                  <strong>3</strong>
                </div>
                <GraduationCap size={28} />
              </div>

              <div className="stat-card">
                <div>
                  <span>Subjects</span>
                  <strong>5</strong>
                </div>
                <BookOpen size={28} />
              </div>

              <div className="stat-card">
                <div>
                  <span>Attendance</span>
                  <strong>Active</strong>
                </div>
                <CalendarCheck size={28} />
              </div>
            </div>

            <div className="dashboard-grid">
              <section className="dashboard-card">
                <div className="card-header">
                  <h3>Quick Actions</h3>
                  <p>Common administration tasks</p>
                </div>

                <div className="quick-actions">
                  <button
                    onClick={() =>
                      navigate("/students")
                    }
                  >
                    <Users size={20} />
                    <span>Students</span>
                  </button>

                  <button
                    onClick={() =>
                      navigate("/classes")
                    }
                  >
                    <GraduationCap size={20} />
                    <span>Classes</span>
                  </button>

                  <button
                    onClick={() =>
                      navigate("/subjects")
                    }
                  >
                    <BookOpen size={20} />
                    <span>Subjects</span>
                  </button>

                  <button
                    onClick={() =>
                      navigate("/finance")
                    }
                  >
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
                    <span>Backend</span>
                    <strong className="status-online">
                      Online
                    </strong>
                  </div>

                  <div>
                    <span>Database</span>
                    <strong className="status-online">
                      Connected
                    </strong>
                  </div>

                  <div>
                    <span>Authentication</span>
                    <strong className="status-online">
                      Secure
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
