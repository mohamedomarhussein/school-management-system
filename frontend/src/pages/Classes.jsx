import { useEffect, useState } from "react";
import { Plus, School, Users } from "lucide-react";
import api from "../services/api";

function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get("/admin/classes");

      setClasses(
        response.data.classes ||
        response.data.data ||
        []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load classes."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Classes & Streams</h2>
          <p>Manage school classes and their streams.</p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Add Class
        </button>
      </div>

      {loading && (
        <div className="empty-state">
          Loading classes...
        </div>
      )}

      {error && (
        <div className="error-state">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="dashboard-grid">
          {classes.map((schoolClass) => (
            <div className="dashboard-card" key={schoolClass.id}>
              <div className="card-header">
                <div className="card-icon">
                  <School size={22} />
                </div>

                <div>
                  <h3>{schoolClass.name}</h3>
                  <p>
                    {schoolClass.description ||
                      "School class"}
                  </p>
                </div>
              </div>

              <div className="class-info">
                <Users size={18} />
                <span>
                  Class ID: {schoolClass.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && classes.length === 0 && (
        <div className="empty-state">
          No classes found.
        </div>
      )}
    </div>
  );
}

export default Classes;
