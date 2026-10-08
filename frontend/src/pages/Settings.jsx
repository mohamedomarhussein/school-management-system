import {
  Lock,
  Settings as SettingsIcon,
  User,
} from "lucide-react";

function Settings() {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Manage your administration account.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <User size={22} />
            <div>
              <h3>Administrator Profile</h3>
              <p>Account information</p>
            </div>
          </div>

          <div className="system-status">
            <div>
              <span>Name</span>
              <strong>
                {user.name ||
                  user.full_name ||
                  "System Administrator"}
              </strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {user.email || "—"}
              </strong>
            </div>

            <div>
              <span>Role</span>
              <strong>
                {user.role || "Administrator"}
              </strong>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <Lock size={22} />
            <div>
              <h3>Security</h3>
              <p>Account security settings</p>
            </div>
          </div>

          <div className="system-status">
            <div>
              <span>Authentication</span>
              <strong className="status-online">
                JWT Protected
              </strong>
            </div>

            <div>
              <span>Access Level</span>
              <strong>
                Administrator
              </strong>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <SettingsIcon size={22} />
            <div>
              <h3>System</h3>
              <p>School Management System</p>
            </div>
          </div>

          <div className="system-status">
            <div>
              <span>Frontend</span>
              <strong className="status-online">
                React
              </strong>
            </div>

            <div>
              <span>Backend</span>
              <strong className="status-online">
                Flask
              </strong>
            </div>

            <div>
              <span>Database</span>
              <strong className="status-online">
                SQLite
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
