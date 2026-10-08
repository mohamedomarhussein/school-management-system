import { useEffect, useState } from "react";
import {
  Edit,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import api from "../services/api";

function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    admission_number: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    address: "",
    class_id: "",
    stream_id: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const [studentsRes, classesRes, streamsRes] =
        await Promise.all([
          api.get("/admin/students"),
          api.get("/admin/classes"),
          api.get("/admin/streams"),
        ]);

      setStudents(
        studentsRes.data.students ||
          studentsRes.data.data ||
          []
      );

      setClasses(
        classesRes.data.classes ||
          classesRes.data.data ||
          []
      );

      setStreams(
        streamsRes.data.streams ||
          streamsRes.data.data ||
          []
      );

      setError("");
    } catch (err) {
      console.error("Students loading error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to load student information."
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);

    setForm({
      first_name: "",
      last_name: "",
      admission_number: "",
      date_of_birth: "",
      gender: "",
      phone: "",
      address: "",
      class_id: "",
      stream_id: "",
    });

    setError("");
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);

    setForm({
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      admission_number:
        student.admission_number || "",
      date_of_birth:
        student.date_of_birth || "",
      gender: student.gender || "",
      phone: student.phone || "",
      address: student.address || "",
      class_id: student.class_id
        ? String(student.class_id)
        : "",
      stream_id: student.stream_id
        ? String(student.stream_id)
        : "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingStudent(null);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.admission_number.trim() ||
      !form.date_of_birth ||
      !form.gender ||
      !form.class_id
    ) {
      setError(
        "Please fill in all required fields."
      );
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      admission_number:
        form.admission_number.trim(),
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      phone: form.phone.trim(),
      address: form.address.trim(),
      class_id: Number(form.class_id),
      stream_id: form.stream_id
        ? Number(form.stream_id)
        : null,
    };

    try {
      if (editingStudent) {
        await api.put(
          `/admin/students/${editingStudent.id}`,
          payload
        );
      } else {
        await api.post(
          "/admin/students",
          payload
        );
      }

      await loadData();
      closeModal();
    } catch (err) {
      console.error("Student save error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to save student."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (student) => {
    const confirmed = window.confirm(
      `Delete ${student.first_name} ${student.last_name}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/admin/students/${student.id}`
      );

      await loadData();
    } catch (err) {
      console.error("Student delete error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to delete student."
      );
    }
  };

  const getClassName = (student) => {
    const schoolClass = classes.find(
      (item) => item.id === student.class_id
    );

    return (
      student.class_name ||
      schoolClass?.name ||
      "—"
    );
  };

  const getStreamName = (student) => {
    const stream = streams.find(
      (item) => item.id === student.stream_id
    );

    return (
      student.stream_name ||
      stream?.name ||
      "—"
    );
  };

  const filteredStudents = students.filter(
    (student) => {
      const searchText =
        `${student.first_name || ""} ${
          student.last_name || ""
        } ${
          student.admission_number || ""
        }`.toLowerCase();

      return searchText.includes(
        search.toLowerCase()
      );
    }
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Students</h2>
          <p>
            Manage student records and enrollment
            information.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>

      {error && !showModal && (
        <div className="error-state">
          {error}
        </div>
      )}

      <div className="students-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search by name or admission number..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="student-count">
          <Users size={18} />
          <span>
            {filteredStudents.length} Students
          </span>
        </div>
      </div>

      <div className="students-card">
        {loading ? (
          <div className="empty-state">
            Loading students...
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission No.</th>
                  <th>Class</th>
                  <th>Stream</th>
                  <th>Gender</th>
                  <th>Date of Birth</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(
                    (student) => {
                      const fullName =
                        `${student.first_name || ""} ${
                          student.last_name || ""
                        }`.trim();

                      return (
                        <tr key={student.id}>
                          <td>
                            <div className="student-name">
                              <div className="student-avatar">
                                {(
                                  student.first_name ||
                                  "S"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <strong>
                                {fullName ||
                                  "Unknown Student"}
                              </strong>
                            </div>
                          </td>

                          <td>
                            {student.admission_number ||
                              "—"}
                          </td>

                          <td>
                            {getClassName(student)}
                          </td>

                          <td>
                            {getStreamName(student)}
                          </td>

                          <td>
                            {student.gender || "—"}
                          </td>

                          <td>
                            {student.date_of_birth ||
                              "—"}
                          </td>

                          <td>
                            {student.phone || "—"}
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                className="icon-button"
                                title="Edit student"
                                onClick={() =>
                                  openEditModal(
                                    student
                                  )
                                }
                              >
                                <Edit size={16} />
                              </button>

                              <button
                                className="icon-button danger"
                                title="Delete student"
                                onClick={() =>
                                  handleDelete(
                                    student
                                  )
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                ) : (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        No students found.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3>
                  {editingStudent
                    ? "Edit Student"
                    : "Add Student"}
                </h3>

                <p>
                  {editingStudent
                    ? "Update student information."
                    : "Enter the student's information."}
                </p>
              </div>

              <button
                className="close-button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="error-state">
                {error}
              </div>
            )}

            <form
              className="student-form"
              onSubmit={handleSubmit}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    First Name *
                  </label>

                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="First name"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Last Name *
                  </label>

                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="Last name"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Admission Number *
                  </label>

                  <input
                    name="admission_number"
                    value={form.admission_number}
                    onChange={handleChange}
                    placeholder="ADM004"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Date of Birth *
                  </label>

                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Gender *</label>

                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select gender
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Phone</label>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="07XXXXXXXX"
                  />
                </div>

                <div className="form-group">
                  <label>Class *</label>

                  <select
                    name="class_id"
                    value={form.class_id}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map((schoolClass) => (
                      <option
                        key={schoolClass.id}
                        value={schoolClass.id}
                      >
                        {schoolClass.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Stream</label>

                  <select
                    name="stream_id"
                    value={form.stream_id}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select stream
                    </option>

                    {streams.map((stream) => (
                      <option
                        key={stream.id}
                        value={stream.id}
                      >
                        {stream.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Address</label>

                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Student address"
                  />
                </div>
              </div>

              <div className="modal-actions">
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
                  {saving
                    ? "Saving..."
                    : editingStudent
                    ? "Update Student"
                    : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
