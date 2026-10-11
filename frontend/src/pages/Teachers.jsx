import { useCallback, useEffect, useState } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Pencil,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import api from "../services/api";

const emptyForm = {
  full_name: "",
  email: "",
  password: "",
  employee_number: "",
  phone: "",
  qualification: "",
};

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadTeachers = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get("/admin/teachers");
      setTeachers(response.data.teachers || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Could not load teachers. Check your login and backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const openCreateModal = () => {
    setEditingTeacher(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setModalOpen(true);
  };

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setForm({
      full_name: teacher.full_name || "",
      email: teacher.email || "",
      password: "",
      employee_number: teacher.employee_number || "",
      phone: teacher.phone || "",
      qualification: teacher.qualification || "",
    });
    setError("");
    setMessage("");
    setModalOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingTeacher) {
        await api.put(`/admin/teachers/${editingTeacher.id}`, {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          employee_number: form.employee_number.trim(),
          phone: form.phone.trim(),
          qualification: form.qualification.trim(),
        });

        setMessage("Teacher details updated successfully.");
      } else {
        await api.post("/admin/users", {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          employee_number: form.employee_number.trim(),
          phone: form.phone.trim(),
          qualification: form.qualification.trim(),
          role: "teacher",
        });

        setMessage("Teacher registered successfully.");
      }

      setModalOpen(false);
      setEditingTeacher(null);
      setForm(emptyForm);
      await loadTeachers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Unable to save teacher details."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (teacher) => {
    const action = teacher.is_active ? "deactivate" : "activate";

    if (
      !window.confirm(
        `Do you want to ${action} ${teacher.full_name}'s account?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.patch(`/admin/users/${teacher.user_id}/status`, {
        is_active: !teacher.is_active,
      });

      setMessage(`Teacher account ${action}d successfully.`);
      await loadTeachers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Could not update account status."
      );
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const query = search.toLowerCase();

    const matchesSearch = [
      teacher.full_name,
      teacher.email,
      teacher.employee_number,
      teacher.phone,
      teacher.qualification,
    ].some((value) => String(value || "").toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && teacher.is_active) ||
      (statusFilter === "inactive" && !teacher.is_active);

    return matchesSearch && matchesStatus;
  });

  const activeCount = teachers.filter((teacher) => teacher.is_active).length;

  return (
    <section className="students-page">
      <div className="students-heading">
        <div>
          <h1>Teacher Management</h1>
          <p>Register teachers and manage staff accounts.</p>
        </div>

        <button className="primary-button" onClick={openCreateModal}>
          <Plus size={18} /> Add Teacher
        </button>
      </div>

      {message && (
        <div className="teacher-notice success" role="status">
          <CheckCircle size={18} />
          <span>{message}</span>
          <button onClick={() => setMessage("")} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="teacher-notice failure" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="teacher-stats">
        <div className="teacher-stat">
          <GraduationCap size={26} />
          <div>
            <span>Total Teachers</span>
            <strong>{teachers.length}</strong>
          </div>
        </div>

        <div className="teacher-stat">
          <UserCheck size={26} />
          <div>
            <span>Active Accounts</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="teacher-stat">
          <UserX size={26} />
          <div>
            <span>Inactive Accounts</span>
            <strong>{teachers.length - activeCount}</strong>
          </div>
        </div>
      </div>

      <div className="students-card">
        <div className="students-toolbar">
          <div className="teacher-search">
            <Search size={18} />
            <input
              placeholder="Search teachers..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by account status"
          >
            <option value="all">All Accounts</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button className="secondary-button" onClick={loadTeachers}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="student-count">
          Showing {filteredTeachers.length} of {teachers.length} teachers
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Employee No.</th>
                <th>Phone</th>
                <th>Qualification</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6">Loading teachers...</td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    {teachers.length === 0
                      ? "No teachers registered yet."
                      : "No matching teachers found."}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>
                      <strong>{teacher.full_name}</strong>
                      <br />
                      <small>{teacher.email}</small>
                    </td>
                    <td>{teacher.employee_number}</td>
                    <td>{teacher.phone || "—"}</td>
                    <td>{teacher.qualification || "—"}</td>
                    <td>
                      <span
                        className={`teacher-status ${
                          teacher.is_active ? "active" : "inactive"
                        }`}
                      >
                        {teacher.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="teacher-actions">
                        <button
                          className="teacher-action-button"
                          title="Edit teacher"
                          onClick={() => openEditModal(teacher)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          className="teacher-action-button"
                          title={
                            teacher.is_active
                              ? "Deactivate account"
                              : "Activate account"
                          }
                          onClick={() => toggleStatus(teacher)}
                        >
                          {teacher.is_active ? (
                            <UserX size={17} />
                          ) : (
                            <UserCheck size={17} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="teacher-modal-overlay">
          <div className="teacher-modal">
            <div className="teacher-modal-title">
              <div>
                <h2>
                  {editingTeacher ? "Edit Teacher" : "Register New Teacher"}
                </h2>
                <p>
                  {editingTeacher
                    ? "Update the teacher's details."
                    : "Create a teacher login and staff profile."}
                </p>
              </div>

              <button
                type="button"
                className="teacher-close"
                onClick={() => !saving && setModalOpen(false)}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="teacher-form-grid">
                <label>
                  Full Name *
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Email Address *
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </label>

                {!editingTeacher && (
                  <label>
                    Initial Password *
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      minLength="8"
                      autoComplete="new-password"
                      required
                    />
                  </label>
                )}

                <label>
                  Employee Number *
                  <input
                    name="employee_number"
                    value={form.employee_number}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Qualification
                  <input
                    name="qualification"
                    value={form.qualification}
                    onChange={handleChange}
                    placeholder="e.g. Bachelor of Education"
                  />
                </label>
              </div>

              {error && (
                <div className="teacher-form-error" role="alert">
                  {error}
                </div>
              )}

              <div className="teacher-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => !saving && setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingTeacher
                      ? "Save Changes"
                      : "Register Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .teacher-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin: 20px 0;
        }
        .teacher-stat {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          color: #334155;
        }
        .teacher-stat span, .teacher-stat strong { display: block; }
        .teacher-stat span { color: #64748b; font-size: 13px; margin-bottom: 5px; }
        .teacher-stat strong { font-size: 25px; color: #0f172a; }
        .teacher-search {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 200px;
          padding: 0 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .teacher-search input {
          width: 100%;
          border: 0;
          outline: none;
          padding: 11px 0;
          background: transparent;
        }
        .students-toolbar select {
          padding: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .teacher-status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .teacher-status.active { background: #dcfce7; color: #166534; }
        .teacher-status.inactive { background: #fee2e2; color: #991b1b; }
        .teacher-actions { display: flex; gap: 8px; }
        .teacher-action-button, .teacher-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 7px;
          background: white;
          cursor: pointer;
        }
        .teacher-notice {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 8px;
          margin: 12px 0;
        }
        .teacher-notice span { flex: 1; }
        .teacher-notice button {
          display: inline-flex;
          border: 0;
          background: transparent;
          cursor: pointer;
        }
        .teacher-notice.success { background: #dcfce7; color: #166534; }
        .teacher-notice.failure, .teacher-form-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 12px;
          border-radius: 8px;
        }
        .teacher-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow: auto;
          background: rgba(15, 23, 42, .6);
        }
        .teacher-modal {
          width: 100%;
          max-width: 680px;
          padding: 24px;
          border-radius: 14px;
          background: white;
          color: #0f172a;
          box-shadow: 0 20px 60px rgba(0,0,0,.2);
        }
        .teacher-modal-title {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 22px;
        }
        .teacher-modal-title h2 { margin: 0 0 6px; }
        .teacher-modal-title p { margin: 0; color: #64748b; font-size: 14px; }
        .teacher-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .teacher-form-grid label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          font-size: 13px;
          font-weight: 600;
        }
        .teacher-form-grid input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font: inherit;
          font-weight: 400;
        }
        .teacher-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 24px;
        }
        @media (max-width: 760px) {
          .teacher-stats { grid-template-columns: 1fr; }
          .teacher-form-grid { grid-template-columns: 1fr; }
          .students-toolbar { flex-wrap: wrap; }
        }
      `}</style>
    </section>
  );
}

export default Teachers;
