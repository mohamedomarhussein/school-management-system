import { useEffect, useState } from "react";
import {
  Edit,
  GraduationCap,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import api from "../services/api";

function Classes() {
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showClassModal, setShowClassModal] =
    useState(false);
  const [showStreamModal, setShowStreamModal] =
    useState(false);

  const [editingClass, setEditingClass] =
    useState(null);
  const [editingStream, setEditingStream] =
    useState(null);

  const [classForm, setClassForm] = useState({
    name: "",
    description: "",
  });

  const [streamForm, setStreamForm] = useState({
    name: "",
    class_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const [
        classesResponse,
        streamsResponse,
        studentsResponse,
      ] = await Promise.all([
        api.get("/admin/classes"),
        api.get("/admin/streams"),
        api.get("/admin/students"),
      ]);

      setClasses(
        classesResponse.data.classes ||
          classesResponse.data.data ||
          []
      );

      setStreams(
        streamsResponse.data.streams ||
          streamsResponse.data.data ||
          []
      );

      setStudents(
        studentsResponse.data.students ||
          studentsResponse.data.data ||
          []
      );

      setError("");
    } catch (err) {
      console.error("Classes loading error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to load classes and streams."
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddClass = () => {
    setEditingClass(null);

    setClassForm({
      name: "",
      description: "",
    });

    setError("");
    setShowClassModal(true);
  };

  const openEditClass = (schoolClass) => {
    setEditingClass(schoolClass);

    setClassForm({
      name: schoolClass.name || "",
      description:
        schoolClass.description || "",
    });

    setError("");
    setShowClassModal(true);
  };

  const openAddStream = (classId = "") => {
    setEditingStream(null);

    setStreamForm({
      name: "",
      class_id: classId
        ? String(classId)
        : "",
    });

    setError("");
    setShowStreamModal(true);
  };

  const openEditStream = (stream) => {
    setEditingStream(stream);

    setStreamForm({
      name: stream.name || "",
      class_id: stream.class_id
        ? String(stream.class_id)
        : "",
    });

    setError("");
    setShowStreamModal(true);
  };

  const closeModals = () => {
    if (saving) return;

    setShowClassModal(false);
    setShowStreamModal(false);
    setEditingClass(null);
    setEditingStream(null);
    setError("");
  };

  const handleClassChange = (event) => {
    const { name, value } = event.target;

    setClassForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleStreamChange = (event) => {
    const { name, value } = event.target;

    setStreamForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const saveClass = async (event) => {
    event.preventDefault();

    if (!classForm.name) {
      setError("Please select a class.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingClass) {
        await api.put(
          `/admin/classes/${editingClass.id}`,
          classForm
        );
      } else {
        await api.post(
          "/admin/classes",
          classForm
        );
      }

      await loadData();
      closeModals();
    } catch (err) {
      console.error("Class save error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to save class."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveStream = async (event) => {
    event.preventDefault();

    if (
      !streamForm.name.trim() ||
      !streamForm.class_id
    ) {
      setError(
        "Stream name and class are required."
      );
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name: streamForm.name.trim(),
      class_id: Number(streamForm.class_id),
    };

    try {
      if (editingStream) {
        await api.put(
          `/admin/streams/${editingStream.id}`,
          payload
        );
      } else {
        await api.post(
          "/admin/streams",
          payload
        );
      }

      await loadData();
      closeModals();
    } catch (err) {
      console.error("Stream save error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to save stream."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteClass = async (schoolClass) => {
    const confirmed = window.confirm(
      `Delete ${schoolClass.name}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/admin/classes/${schoolClass.id}`
      );

      await loadData();
    } catch (err) {
      console.error("Class delete error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to delete class."
      );
    }
  };

  const deleteStream = async (stream) => {
    const confirmed = window.confirm(
      `Delete stream ${stream.name}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/admin/streams/${stream.id}`
      );

      await loadData();
    } catch (err) {
      console.error("Stream delete error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to delete stream."
      );
    }
  };

  const getStreamsForClass = (classId) => {
    return streams.filter(
      (stream) => stream.class_id === classId
    );
  };

  const getStudentCount = (classId) => {
    return students.filter(
      (student) => student.class_id === classId
    ).length;
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Classes & Streams</h2>
          <p>
            Manage school classes and their streams.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddClass}
        >
          <Plus size={18} />
          Add Class
        </button>
      </div>

      {error &&
        !showClassModal &&
        !showStreamModal && (
          <div className="error-state">
            {error}
          </div>
        )}

      {loading ? (
        <div className="empty-state">
          Loading classes...
        </div>
      ) : (
        <div className="classes-management-grid">
          {classes.map((schoolClass) => {
            const classStreams =
              getStreamsForClass(
                schoolClass.id
              );

            const studentCount =
              getStudentCount(
                schoolClass.id
              );

            return (
              <div
                className="class-management-card"
                key={schoolClass.id}
              >
                <div className="class-card-header">
                  <div className="class-icon">
                    <GraduationCap
                      size={24}
                    />
                  </div>

                  <div className="class-card-actions">
                    <button
                      className="icon-button"
                      title="Edit class"
                      onClick={() =>
                        openEditClass(
                          schoolClass
                        )
                      }
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      className="icon-button danger"
                      title="Delete class"
                      onClick={() =>
                        deleteClass(
                          schoolClass
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3>{schoolClass.name}</h3>

                <p className="class-description">
                  {schoolClass.description ||
                    `${schoolClass.name} students`}
                </p>

                <div className="class-meta">
                  <span>
                    <Users size={15} />
                    {studentCount} Students
                  </span>

                  <span>
                    {classStreams.length} Streams
                  </span>
                </div>

                <div className="streams-section">
                  <div className="streams-header">
                    <strong>Streams</strong>

                    <button
                      className="small-button"
                      onClick={() =>
                        openAddStream(
                          schoolClass.id
                        )
                      }
                    >
                      <Plus size={15} />
                      Add
                    </button>
                  </div>

                  {classStreams.length > 0 ? (
                    <div className="stream-list">
                      {classStreams.map(
                        (stream) => (
                          <div
                            className="stream-item"
                            key={stream.id}
                          >
                            <span>
                              {stream.name}
                            </span>

                            <div className="stream-actions">
                              <button
                                className="icon-button small"
                                title="Edit stream"
                                onClick={() =>
                                  openEditStream(
                                    stream
                                  )
                                }
                              >
                                <Edit size={14} />
                              </button>

                              <button
                                className="icon-button danger small"
                                title="Delete stream"
                                onClick={() =>
                                  deleteStream(
                                    stream
                                  )
                                }
                              >
                                <Trash2
                                  size={14}
                                />
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="no-streams">
                      No streams yet.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showClassModal && (
        <div className="modal-overlay">
          <div className="modal small-modal">
            <div className="modal-header">
              <div>
                <h3>
                  {editingClass
                    ? "Edit Class"
                    : "Add Class"}
                </h3>

                <p>
                  Select a class level and add a
                  description.
                </p>
              </div>

              <button
                className="close-button"
                onClick={closeModals}
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
              onSubmit={saveClass}
            >
              <div className="form-group">
                <label>Class *</label>

                <select
                  name="name"
                  value={classForm.name}
                  onChange={handleClassChange}
                >
                  <option value="">
                    Select class
                  </option>

                  <option value="PP1">
                    PP1
                  </option>

                  <option value="PP2">
                    PP2
                  </option>

                  {Array.from(
                    { length: 12 },
                    (_, index) => (
                      <option
                        key={index + 1}
                        value={`Grade ${
                          index + 1
                        }`}
                      >
                        Grade {index + 1}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>

                <input
                  name="description"
                  value={
                    classForm.description
                  }
                  onChange={handleClassChange}
                  placeholder="Class description"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModals}
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
                    : editingClass
                    ? "Update Class"
                    : "Add Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStreamModal && (
        <div className="modal-overlay">
          <div className="modal small-modal">
            <div className="modal-header">
              <div>
                <h3>
                  {editingStream
                    ? "Edit Stream"
                    : "Add Stream"}
                </h3>

                <p>
                  Assign the stream to a class.
                </p>
              </div>

              <button
                className="close-button"
                onClick={closeModals}
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
              onSubmit={saveStream}
            >
              <div className="form-group">
                <label>Stream Name *</label>

                <input
                  name="name"
                  value={streamForm.name}
                  onChange={handleStreamChange}
                  placeholder="A, B, C"
                />
              </div>

              <div className="form-group">
                <label>Class *</label>

                <select
                  name="class_id"
                  value={
                    streamForm.class_id
                  }
                  onChange={handleStreamChange}
                >
                  <option value="">
                    Select class
                  </option>

                  {classes.map(
                    (schoolClass) => (
                      <option
                        key={schoolClass.id}
                        value={
                          schoolClass.id
                        }
                      >
                        {schoolClass.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModals}
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
                    : editingStream
                    ? "Update Stream"
                    : "Add Stream"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Classes;
