import "./Timetable.css";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Users,
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  MapPin,
} from "lucide-react";
import api from "../services/api";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const EMPTY_FORM = {
  class_id: "",
  stream_id: "",
  subject_id: "",
  teacher_id: "",
  day_of_week: "Monday",
  start_time: "08:00",
  end_time: "08:40",
  room: "",
};

function getList(response, key) {
  const body = response?.data;

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.[key])) return body[key];
  if (Array.isArray(body?.data)) return body.data;

  return [];
}

function formatTime(value) {
  if (!value) return "—";

  const time = String(value).slice(0, 5);
  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function Timetable() {
  const [entries, setEntries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [streamFilter, setStreamFilter] = useState("");

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        timetableResponse,
        classesResponse,
        streamsResponse,
        subjectsResponse,
        teachersResponse,
      ] = await Promise.all([
        api.get("/timetable"),
        api.get("/admin/classes"),
        api.get("/admin/streams"),
        api.get("/admin/subjects"),
        api.get("/admin/teachers"),
      ]);

      const timetableBody = timetableResponse.data;

      setEntries(
        Array.isArray(timetableBody?.data)
          ? timetableBody.data
          : Array.isArray(timetableBody?.timetable)
            ? timetableBody.timetable
            : Array.isArray(timetableBody?.entries)
              ? timetableBody.entries
              : []
      );

      setClasses(getList(classesResponse, "classes"));
      setStreams(getList(streamsResponse, "streams"));
      setSubjects(
        getList(subjectsResponse, "subjects").filter(
          (subject) => subject.is_active !== false
        )
      );
      setTeachers(
        getList(teachersResponse, "teachers").filter(
          (teacher) => teacher.is_active !== false
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load timetable data. Check that the backend is running and you are signed in."
      );
    } finally {
      setLoading(false);
    }
  };

  const availableStreams = useMemo(() => {
    if (!form.class_id) return [];

    return streams.filter(
      (stream) => String(stream.class_id) === String(form.class_id)
    );
  }, [streams, form.class_id]);

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();

    return entries
      .filter((entry) => {
        const searchableValues = [
          entry.class_name,
          entry.stream_name,
          entry.subject_name,
          entry.teacher_name,
          entry.room,
          entry.day_of_week,
        ];

        const matchesSearch =
          !term ||
          searchableValues.some((value) =>
            String(value || "").toLowerCase().includes(term)
          );

        const matchesDay =
          !dayFilter || entry.day_of_week === dayFilter;

        const matchesClass =
          !classFilter ||
          String(entry.class_id) === String(classFilter);

        const matchesStream =
          !streamFilter ||
          String(entry.stream_id || "") === String(streamFilter);

        return (
          matchesSearch &&
          matchesDay &&
          matchesClass &&
          matchesStream
        );
      })
      .sort((a, b) => {
        const dayDifference =
          DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week);

        if (dayDifference !== 0) return dayDifference;

        return String(a.start_time || "").localeCompare(
          String(b.start_time || "")
        );
      });
  }, [entries, search, dayFilter, classFilter, streamFilter]);

  const activeDays = useMemo(
    () =>
      DAYS.filter((day) =>
        filteredEntries.some((entry) => entry.day_of_week === day)
      ).length,
    [filteredEntries]
  );

  const openCreateForm = () => {
    setEditingEntry(null);
    setForm({
      ...EMPTY_FORM,
      class_id: classes[0] ? String(classes[0].id) : "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (entry) => {
    setEditingEntry(entry);
    setForm({
      class_id: String(entry.class_id || ""),
      stream_id: entry.stream_id ? String(entry.stream_id) : "",
      subject_id: String(entry.subject_id || ""),
      teacher_id: String(entry.teacher_id || ""),
      day_of_week: entry.day_of_week || "Monday",
      start_time: String(entry.start_time || "08:00").slice(0, 5),
      end_time: String(entry.end_time || "08:40").slice(0, 5),
      room: entry.room || "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEntry(null);
    setForm(EMPTY_FORM);
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === "class_id") {
        return {
          ...current,
          class_id: value,
          stream_id: "",
        };
      }

      return { ...current, [name]: value };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.class_id ||
      !form.subject_id ||
      !form.teacher_id ||
      !form.day_of_week ||
      !form.start_time ||
      !form.end_time
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.end_time <= form.start_time) {
      setError("The lesson end time must be later than its start time.");
      return;
    }

    const payload = {
      ...form,
      class_id: Number(form.class_id),
      stream_id: form.stream_id ? Number(form.stream_id) : null,
      subject_id: Number(form.subject_id),
      teacher_id: Number(form.teacher_id),
      room: form.room.trim() || null,
    };

    setSaving(true);

    try {
      if (editingEntry) {
        await api.put(`/timetable/${editingEntry.id}`, payload);
        setSuccess("Timetable entry updated successfully.");
      } else {
        await api.post("/timetable", payload);
        setSuccess("Timetable entry created successfully.");
      }

      closeForm();
      await loadPageData();
      setSuccess(
        editingEntry
          ? "Timetable entry updated successfully."
          : "Timetable entry created successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to save the timetable entry. Please check the details and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry) => {
    const lesson = `${entry.subject_name || "this lesson"} — ${entry.class_name || "class"}`;

    if (!window.confirm(`Delete ${lesson} from the timetable?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.delete(`/timetable/${entry.id}`);
      setEntries((current) =>
        current.filter((item) => item.id !== entry.id)
      );
      setSuccess("Timetable entry deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete this timetable entry."
      );
    }
  };

  const resetFilters = () => {
    setSearch("");
    setDayFilter("");
    setClassFilter("");
    setStreamFilter("");
  };

  const groupedEntries = useMemo(
    () =>
      DAYS.map((day) => ({
        day,
        lessons: filteredEntries.filter(
          (entry) => entry.day_of_week === day
        ),
      })).filter((group) => group.lessons.length > 0),
    [filteredEntries]
  );

  return (
    <div className="page-content timetable-page">
      <header className="timetable-heading">
        <div>
          <span className="timetable-eyebrow">
            <CalendarClock size={15} />
            ACADEMIC MANAGEMENT
          </span>
          <h1>Timetable Management</h1>
          <p>Organise lessons, assign teachers, and manage the school week.</p>
        </div>

        <div className="timetable-heading-actions">
          <button
            type="button"
            className="timetable-button timetable-button-light"
            onClick={loadPageData}
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? "is-spinning" : ""} />
            Refresh
          </button>
          <button
            type="button"
            className="timetable-button timetable-button-primary"
            onClick={openCreateForm}
          >
            <Plus size={18} />
            Add lesson
          </button>
        </div>
      </header>

      {success && (
        <div className="timetable-alert timetable-alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")} aria-label="Dismiss message">
            <X size={17} />
          </button>
        </div>
      )}

      {error && !showForm && (
        <div className="timetable-alert timetable-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      <section className="timetable-stat-grid">
        <article className="timetable-stat-card">
          <div className="timetable-stat-icon timetable-icon-blue">
            <CalendarDays size={21} />
          </div>
          <div>
            <span>Total lessons</span>
            <strong>{entries.length}</strong>
            <small>Scheduled timetable entries</small>
          </div>
        </article>

        <article className="timetable-stat-card">
          <div className="timetable-stat-icon timetable-icon-purple">
            <BookOpen size={21} />
          </div>
          <div>
            <span>Classes covered</span>
            <strong>{new Set(entries.map((entry) => entry.class_id)).size}</strong>
            <small>Classes with scheduled lessons</small>
          </div>
        </article>

        <article className="timetable-stat-card">
          <div className="timetable-stat-icon timetable-icon-green">
            <Users size={21} />
          </div>
          <div>
            <span>Teachers assigned</span>
            <strong>{new Set(entries.map((entry) => entry.teacher_id)).size}</strong>
            <small>Teachers on the timetable</small>
          </div>
        </article>

        <article className="timetable-stat-card">
          <div className="timetable-stat-icon timetable-icon-amber">
            <Clock3 size={21} />
          </div>
          <div>
            <span>Active school days</span>
            <strong>{activeDays}</strong>
            <small>Days with scheduled lessons</small>
          </div>
        </article>
      </section>

      <section className="timetable-filter-panel">
        <div className="timetable-search">
          <Search size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search subject, teacher, class, or room..."
            aria-label="Search timetable"
          />
        </div>

        <select
          value={dayFilter}
          onChange={(event) => setDayFilter(event.target.value)}
          aria-label="Filter by day"
        >
          <option value="">All days</option>
          {DAYS.map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>

        <select
          value={classFilter}
          onChange={(event) => {
            setClassFilter(event.target.value);
            setStreamFilter("");
          }}
          aria-label="Filter by class"
        >
          <option value="">All classes</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name || item.class_name || `Class ${item.id}`}
            </option>
          ))}
        </select>

        <select
          value={streamFilter}
          onChange={(event) => setStreamFilter(event.target.value)}
          aria-label="Filter by stream"
        >
          <option value="">All streams</option>
          {streams
            .filter((stream) =>
              !classFilter ||
              String(stream.class_id) === String(classFilter)
            )
            .map((stream) => (
              <option key={stream.id} value={stream.id}>
                {stream.name || stream.stream_name || `Stream ${stream.id}`}
              </option>
            ))}
        </select>

        <button
          type="button"
          className="timetable-reset-button"
          onClick={resetFilters}
        >
          Clear filters
        </button>
      </section>

      <section className="timetable-schedule-panel">
        <div className="timetable-section-heading">
          <div>
            <h2>Weekly schedule</h2>
            <p>
              Showing {filteredEntries.length} of {entries.length} lessons
            </p>
          </div>
          <span className="timetable-week-label">
            <CalendarDays size={16} />
            Monday – Saturday
          </span>
        </div>

        {loading ? (
          <div className="timetable-empty-state">
            <RefreshCw size={26} className="is-spinning" />
            <h3>Loading timetable</h3>
            <p>Retrieving your scheduled lessons...</p>
          </div>
        ) : groupedEntries.length === 0 ? (
          <div className="timetable-empty-state">
            <div className="timetable-empty-icon">
              <CalendarClock size={28} />
            </div>
            <h3>No lessons found</h3>
            <p>
              {entries.length === 0
                ? "Start by adding the first lesson to your school timetable."
                : "Try changing your search or filters to find a lesson."}
            </p>
            {entries.length === 0 && (
              <button
                type="button"
                className="timetable-button timetable-button-primary"
                onClick={openCreateForm}
              >
                <Plus size={17} />
                Add first lesson
              </button>
            )}
          </div>
        ) : (
          <div className="timetable-day-list">
            {groupedEntries.map(({ day, lessons }) => (
              <section className="timetable-day-section" key={day}>
                <div className="timetable-day-heading">
                  <div className="timetable-day-marker">
                    {day.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <h3>{day}</h3>
                    <span>
                      {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
                    </span>
                  </div>
                </div>

                <div className="timetable-lesson-list">
                  {lessons.map((entry) => (
                    <article className="timetable-lesson-card" key={entry.id}>
                      <div className="timetable-lesson-time">
                        <strong>{formatTime(entry.start_time)}</strong>
                        <span>{formatTime(entry.end_time)}</span>
                      </div>

                      <div className="timetable-lesson-main">
                        <div className="timetable-lesson-title-row">
                          <h4>{entry.subject_name || "Subject"}</h4>
                          <span className="timetable-class-chip">
                            {entry.class_name || "Class"}
                            {entry.stream_name ? ` · ${entry.stream_name}` : ""}
                          </span>
                        </div>

                        <div className="timetable-lesson-details">
                          <span>
                            <Users size={14} />
                            {entry.teacher_name || "Teacher not specified"}
                          </span>
                          {entry.room && (
                            <span>
                              <MapPin size={14} />
                              {entry.room}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="timetable-lesson-actions">
                        <button
                          type="button"
                          onClick={() => openEditForm(entry)}
                          aria-label={`Edit ${entry.subject_name || "lesson"}`}
                          title="Edit lesson"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="timetable-delete-action"
                          onClick={() => handleDelete(entry)}
                          aria-label={`Delete ${entry.subject_name || "lesson"}`}
                          title="Delete lesson"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="timetable-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="timetable-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="timetable-modal-title"
          >
            <header className="timetable-modal-header">
              <div>
                <span className="timetable-eyebrow">LESSON DETAILS</span>
                <h2 id="timetable-modal-title">
                  {editingEntry ? "Edit timetable entry" : "Add a lesson"}
                </h2>
                <p>Enter the class, teacher, subject, and lesson time.</p>
              </div>
              <button
                type="button"
                className="timetable-modal-close"
                onClick={closeForm}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </header>

            {error && (
              <div className="timetable-alert timetable-alert-error" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form className="timetable-form" onSubmit={handleSubmit}>
              <div className="timetable-form-grid">
                <label>
                  Class <span>*</span>
                  <select
                    name="class_id"
                    value={form.class_id}
                    onChange={updateField}
                    required
                  >
                    <option value="">Select class</option>
                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name || item.class_name || `Class ${item.id}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Stream
                  <select
                    name="stream_id"
                    value={form.stream_id}
                    onChange={updateField}
                    disabled={!form.class_id}
                  >
                    <option value="">No stream / whole class</option>
                    {availableStreams.map((stream) => (
                      <option key={stream.id} value={stream.id}>
                        {stream.name || stream.stream_name || `Stream ${stream.id}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Subject <span>*</span>
                  <select
                    name="subject_id"
                    value={form.subject_id}
                    onChange={updateField}
                    required
                  >
                    <option value="">Select subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name || subject.subject_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Teacher <span>*</span>
                  <select
                    name="teacher_id"
                    value={form.teacher_id}
                    onChange={updateField}
                    required
                  >
                    <option value="">Select teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name ||
                          teacher.name ||
                          [teacher.first_name, teacher.last_name].filter(Boolean).join(" ") ||
                          teacher.employee_number ||
                          `Teacher ${teacher.id}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Day <span>*</span>
                  <select
                    name="day_of_week"
                    value={form.day_of_week}
                    onChange={updateField}
                    required
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Classroom / Room
                  <input
                    type="text"
                    name="room"
                    value={form.room}
                    onChange={updateField}
                    placeholder="e.g. Room 4"
                    maxLength={80}
                  />
                </label>

                <label>
                  Start time <span>*</span>
                  <input
                    type="time"
                    name="start_time"
                    value={form.start_time}
                    onChange={updateField}
                    required
                  />
                </label>

                <label>
                  End time <span>*</span>
                  <input
                    type="time"
                    name="end_time"
                    value={form.end_time}
                    onChange={updateField}
                    required
                  />
                </label>
              </div>

              <footer className="timetable-form-footer">
                <button
                  type="button"
                  className="timetable-button timetable-button-light"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="timetable-button timetable-button-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="is-spinning" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      {editingEntry ? "Save changes" : "Create lesson"}
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Timetable;
