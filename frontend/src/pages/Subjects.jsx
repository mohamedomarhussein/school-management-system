import { useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import api from "../services/api";

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get("/admin/subjects");

      setSubjects(
        response.data.subjects ||
        response.data.data ||
        []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load subjects."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Subjects</h2>
          <p>Manage subjects taught in the school.</p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Add Subject
        </button>
      </div>

      {loading && (
        <div className="empty-state">
          Loading subjects...
        </div>
      )}

      {error && (
        <div className="error-state">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="dashboard-grid">
          {subjects.map((subject) => (
            <div
              className="dashboard-card"
              key={subject.id}
            >
              <div className="card-header">
                <div className="card-icon">
                  <BookOpen size={22} />
                </div>

                <div>
                  <h3>{subject.name}</h3>
                  <p>
                    {subject.code || "No code"}
                  </p>
                </div>
              </div>

              <p>
                {subject.description ||
                  "No description available."}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="empty-state">
          No subjects found.
        </div>
      )}
    </div>
  );
}

export default Subjects;
