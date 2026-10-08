import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
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

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

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

  const stats = [
    {
      title: "Total Students",
      value: "2",
      icon: Users,
    },
    {
      title: "Classes",
      value: "3",
      icon: GraduationCap,
    },
    {
      title: "Subjects",
      value: "5",
      icon: BookOpen,
    },
    {
      title: "Attendance",
      value: "—",
      icon: CalendarCheck,
    },
  ];

  const isDashboard = location.pathname === "/dashboard";

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-icon">
            <GraduationCap size={24} />
          </div>

          <div>
            <h2>SchoolMS</h2>
            <span>Administration</span>
          </div>

          <button
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`nav-item ${
                  location.pathname === item.path ? "active" : ""
                }`}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <button className="nav-item logout-button" onClick={handleLogout}>
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="dashboard-main">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div>
            <h1>{isDashboard ? "Dashboard" : "School Management"}</h1>
            <p>Administration panel</p>
          </div>

          <div className="admin-profile">
            <div className="avatar">
              {(user.full_name || "A").charAt(0).toUpperCase()}
            </div>

            <div className="admin-info">
              <strong>{user.full_name || "Administrator"}</strong>
              <span>{user.role || "admin"}</span>
            </div>
          </div>
        </header>

        {isDashboard ? (
          <section className="dashboard-content">
            <div className="welcome-section">
              <div>
                <h2>
                  Welcome back, {user.full_name || "Administrator"} 👋
                </h2>
                <p>
                  Here's what's happening in your school today.
                </p>
              </div>
            </div>

            <div className="stats-grid">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div className="stat-card" key={stat.title}>
                    <div className="stat-icon">
                      <Icon size={22} />
                    </div>

                    <div>
                      <p>{stat.title}</p>
                      <h3>{stat.value}</h3>
                    </div>
                  </div>
                );
              })}
            </div>

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

                <div className="status-list">
                  <div className="status-item">
                    <span>Backend API</span>
                    <strong className="status-online">Online</strong>
                  </div>

                  <div className="status-item">
                    <span>Authentication</span>
                    <strong className="status-online">Active</strong>
                  </div>

                  <div className="status-item">
                    <span>Database</span>
                    <strong className="status-online">Connected</strong>
                  </div>
                </div>
              </section>
            </div>
          </section>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

export default Dashboard;
