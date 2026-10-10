import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Power,
  X,
  BookMarked,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";

const emptyForm = {
  name: "",
  code: "",
  description: "",
};

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setError("");

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
          "Failed to load subjects. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return subjects;

    return subjects.filter((subject) =>
      [
        subject.name,
        subject.code,
        subject.description,
      ].some((value) =>
        String(value || "").toLowerCase().includes(term)
      )
    );
  }, [subjects, search]);

  const activeCount = subjects.filter(
    (subject) => subject.is_active !== false
  ).length;

  const inactiveCount = subjects.length - activeCount;

  const openAddModal = () => {
    setEditingSubject(null);
    setForm(emptyForm);
    setNotice("");
    setShowModal(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setForm({
      name: subject.name || "",
      code: subject.code || "",
      description: subject.description || "",
    });
    setNotice("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingSubject(null);
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice("");

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();

    if (!name || !code) {
      setNotice("Subject name and code are required.");
      return;
    }

    setSaving(true);

    try {
      if (editingSubject) {
        await api.put(
          `/admin/subjects/${editingSubject.id}`,
          {
            name,
            code,
            description: form.description.trim(),
          }
        );

        setNotice("Subject updated successfully.");
      } else {
        await api.post("/admin/subjects", {
          name,
          code,
          description: form.description.trim(),
        });

        setNotice("Subject added successfully.");
      }

      await fetchSubjects();

      setShowModal(false);
      setEditingSubject(null);
      setForm(emptyForm);
      setError("");
    } catch (err) {
      setNotice(
        err.response?.data?.message ||
          "Could not save the subject. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleSubjectStatus = async (subject) => {
    const isActive = subject.is_active !== false;

    const action = isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${subject.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.put(`/admin/subjects/${subject.id}`, {
        is_active: !isActive,
      });

      setSubjects((previous) =>
        previous.map((item) =>
          item.id === subject.id
            ? { ...item, is_active: !isActive }
            : item
        )
      );

      setNotice(
        `${subject.name} ${action}d successfully.`
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${action} subject.`
      );
    }
  };

  return (
    <div className="page-content subjects-page">
      <div className="page-header">
        <div>
          <h2>Subjects Management</h2>
          <p>
            Add subjects, update their details, and manage
            their availability.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Subject
        </button>
      </div>

      {notice && (
        <div className="subject-notice">
          <CheckCircle size={18} />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="subject-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchSubjects}
            title="Try again"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      <div className="subject-stat-grid">
        <div className="subject-stat-card">
          <div className="subject-stat-icon">
            <BookOpen size={22} />
          </div>
          <div>
            <span>Total Subjects</span>
            <strong>{subjects.length}</strong>
          </div>
        </div>

        <div className="subject-stat-card">
          <div className="subject-stat-icon subject-stat-active">
            <CheckCircle size={22} />
          </div>
          <div>
            <span>Active Subjects</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="subject-stat-card">
          <div className="subject-stat-icon subject-stat-inactive">
            <Power size={22} />
          </div>
          <div>
            <span>Inactive Subjects</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>
      </div>

      <div className="subject-toolbar">
        <div className="subject-search">
          <Search size={19} />
          <input
            type="search"
            placeholder="Search by subject name, code, or description..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search subjects"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <span className="subject-result-count">
          {filteredSubjects.length}{" "}
          {filteredSubjects.length === 1 ? "subject" : "subjects"}
        </span>
      </div>

      {loading ? (
        <div className="empty-state">
          <RefreshCw
            size={22}
            className="subject-loading-icon"
          />
          <p>Loading subjects...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="subject-empty">
          <div className="subject-empty-icon">
            <BookMarked size={30} />
          </div>
          <h3>
            {search ? "No matching subjects" : "No subjects yet"}
          </h3>
          <p>
            {search
              ? "Try another search term."
              : "Add your first subject to get started."}
          </p>

          {!search && (
            <button
              type="button"
              className="primary-button"
              onClick={openAddModal}
            >
              <Plus size={18} />
              Add Subject
            </button>
          )}
        </div>
      ) : (
        <div className="subject-card-grid">
          {filteredSubjects.map((subject) => {
            const isActive = subject.is_active !== false;

            return (
              <article
                className="subject-card"
                key={subject.id}
              >
                <div className="subject-card-top">
                  <div className="subject-book-icon">
                    <BookOpen size={23} />
                  </div>

                  <span
                    className={`subject-status ${
                      isActive
                        ? "subject-status-active"
                        : "subject-status-inactive"
                    }`}
                  >
                    <span className="subject-status-dot" />
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="subject-card-info">
                  <h3>{subject.name}</h3>
                  <span className="subject-code">
                    Code: {subject.code || "Not assigned"}
                  </span>
                </div>

                <p className="subject-description">
                  {subject.description ||
                    "No description has been added."}
                </p>

                <div className="subject-card-footer">
                  <button
                    type="button"
                    className="subject-action-edit"
                    onClick={() => openEditModal(subject)}
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className={
                      isActive
                        ? "subject-action-deactivate"
                        : "subject-action-activate"
                    }
                    onClick={() => toggleSubjectStatus(subject)}
                  >
                    <Power size={15} />
                    {isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showModal && (
        <div
          className="subject-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="subject-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subject-modal-title"
          >
            <div className="subject-modal-header">
              <div>
                <h3 id="subject-modal-title">
                  {editingSubject ? "Edit Subject" : "Add Subject"}
                </h3>
                <p>
                  {editingSubject
                    ? "Update the subject information below."
                    : "Enter the details for the new subject."}
                </p>
              </div>

              <button
                type="button"
                className="subject-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {notice && (
                <div className="subject-form-error">
                  <AlertCircle size={17} />
                  {notice}
                </div>
              )}

              <div className="subject-form-group">
                <label htmlFor="subject-name">
                  Subject Name <span>*</span>
                </label>
                <input
                  id="subject-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Mathematics"
                  required
                  autoFocus
                />
              </div>

              <div className="subject-form-group">
                <label htmlFor="subject-code">
                  Subject Code <span>*</span>
                </label>
                <input
                  id="subject-code"
                  name="code"
                  type="text"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="e.g. MAT"
                  required
                />
                <small>
                  Codes are automatically converted to uppercase.
                </small>
              </div>

              <div className="subject-form-group">
                <label htmlFor="subject-description">
                  Description
                </label>
                <textarea
                  id="subject-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Briefly describe this subject..."
                  rows={4}
                />
              </div>

              <div className="subject-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="subject-loading-icon"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={17} />
                      {editingSubject
                        ? "Save Changes"
                        : "Add Subject"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subjects;
