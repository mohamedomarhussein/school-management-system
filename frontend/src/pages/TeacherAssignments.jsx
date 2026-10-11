import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  UserCheck,
  Search,
  RefreshCw,
  X,
  BookOpen,
  GraduationCap,
  Users,
  Layers,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";

const initialForm = {
  teacher_id: "",
  subject_id: "",
  class_id: "",
  stream_id: "",
};

function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        assignmentsResponse,
        teachersResponse,
        subjectsResponse,
        classesResponse,
        streamsResponse,
      ] = await Promise.all([
        api.get("/admin/teacher-assignments"),
        api.get("/admin/teachers"),
        api.get("/admin/subjects"),
        api.get("/admin/classes"),
        api.get("/admin/streams"),
      ]);

      setAssignments(
        assignmentsResponse.data.assignments || []
      );

      setTeachers(
        (teachersResponse.data.teachers || []).filter(
          (teacher) => teacher.is_active !== false
        )
      );

      setSubjects(
        (subjectsResponse.data.subjects || []).filter(
          (subject) => subject.is_active !== false
        )
      );

      setClasses(classesResponse.data.classes || []);
      setStreams(streamsResponse.data.streams || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load teacher assignment data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const availableStreams = useMemo(() => {
    if (!form.class_id) {
      return [];
    }

    return streams.filter(
      (stream) =>
        String(stream.class_id) === String(form.class_id)
    );
  }, [streams, form.class_id]);

  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const teacherName = assignment.teacher_name || "";
      const employeeNumber = assignment.employee_number || "";
      const subjectName = assignment.subject_name || "";
      const subjectCode = assignment.subject_code || "";
      const className = assignment.class_name || "";
      const streamName = assignment.stream_name || "";

      const matchesSearch =
        !term ||
        [
          teacherName,
          employeeNumber,
          subjectName,
          subjectCode,
          className,
          streamName,
        ].some((value) =>
          String(value).toLowerCase().includes(term)
        );

      const matchesTeacher =
        !teacherFilter ||
        String(assignment.teacher_id) === teacherFilter;

      const matchesSubject =
        !subjectFilter ||
        String(assignment.subject_id) === subjectFilter;

      const matchesClass =
        !classFilter ||
        String(assignment.class_id) === classFilter;

      return (
        matchesSearch &&
        matchesTeacher &&
        matchesSubject &&
        matchesClass
      );
    });
  }, [
    assignments,
    search,
    teacherFilter,
    subjectFilter,
    classFilter,
  ]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => {
      const next = {
        ...previous,
        [name]: value,
      };

      if (name === "class_id") {
        next.stream_id = "";
      }

      return next;
    });
  };

  const openForm = () => {
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (!submitting) {
      setShowForm(false);
      setForm(initialForm);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.teacher_id ||
      !form.subject_id ||
      !form.class_id
    ) {
      setError(
        "Please select a teacher, subject, and class."
      );
      return;
    }

    const payload = {
      teacher_id: Number(form.teacher_id),
      subject_id: Number(form.subject_id),
      class_id: Number(form.class_id),
      stream_id: form.stream_id
        ? Number(form.stream_id)
        : null,
    };

    setSubmitting(true);

    try {
      const response = await api.post(
        "/admin/teacher-assignments",
        payload
      );

      const createdAssignment =
        response.data.assignment;

      setAssignments((previous) => [
        createdAssignment,
        ...previous,
      ]);

      setSuccess(
        response.data.message ||
          "Teacher assigned successfully."
      );

      setShowForm(false);
      setForm(initialForm);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create the teacher assignment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setTeacherFilter("");
    setSubjectFilter("");
    setClassFilter("");
  };

  const selectClassName = (schoolClass) =>
    schoolClass.name || `Class ${schoolClass.id}`;

  return (
    <div className="page-content space-y-6">
      <div className="page-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2>Teacher Assignments</h2>
          <p>
            Assign teachers to subjects, classes, and streams.
          </p>
        </div>

        <button
          type="button"
          className="primary-button inline-flex items-center gap-2"
          onClick={openForm}
        >
          <Plus size={18} />
          Assign Teacher
        </button>
      </div>

      {error && !showForm && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && !showForm && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
          />
          <span>{success}</span>
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Assign a Teacher
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose the teacher, subject, class, and optional stream.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={submitting}
              aria-label="Close assignment form"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />
              <span>{error}</span>
            </div>
          )}

          {loadingOptions ? (
            <p className="text-sm text-gray-500">
              Loading assignment options...
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="teacher_id"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Teacher <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="teacher_id"
                    name="teacher_id"
                    value={form.teacher_id}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select a teacher</option>

                    {teachers.map((teacher) => (
                      <option
                        key={teacher.id}
                        value={teacher.id}
                      >
                        {teacher.full_name || "Unnamed teacher"}
                        {teacher.employee_number
                          ? ` (${teacher.employee_number})`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {teachers.length === 0 && (
                    <p className="mt-1 text-xs text-amber-700">
                      No active teachers are available.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="subject_id"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Subject <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="subject_id"
                    name="subject_id"
                    value={form.subject_id}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select a subject</option>

                    {subjects.map((subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                      >
                        {subject.name}
                        {subject.code ? ` (${subject.code})` : ""}
                      </option>
                    ))}
                  </select>

                  {subjects.length === 0 && (
                    <p className="mt-1 text-xs text-amber-700">
                      No active subjects are available.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="class_id"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Class <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="class_id"
                    name="class_id"
                    value={form.class_id}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select a class</option>

                    {classes.map((schoolClass) => (
                      <option
                        key={schoolClass.id}
                        value={schoolClass.id}
                      >
                        {selectClassName(schoolClass)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="stream_id"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Stream
                    <span className="ml-1 font-normal text-gray-400">
                      (Optional)
                    </span>
                  </label>

                  <select
                    id="stream_id"
                    name="stream_id"
                    value={form.stream_id}
                    onChange={handleFormChange}
                    disabled={!form.class_id}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    <option value="">
                      {form.class_id
                        ? "All streams / no specific stream"
                        : "Select a class first"}
                    </option>

                    {availableStreams.map((stream) => (
                      <option
                        key={stream.id}
                        value={stream.id}
                      >
                        {stream.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    teachers.length === 0 ||
                    subjects.length === 0 ||
                    classes.length === 0
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Save Assignment
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Total Assignments
            </span>
            <UserCheck size={21} className="text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {assignments.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Teachers
            </span>
            <Users size={21} className="text-indigo-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {new Set(
              assignments.map((item) => item.teacher_id)
            ).size}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Subjects Assigned
            </span>
            <BookOpen size={21} className="text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {new Set(
              assignments.map((item) => item.subject_id)
            ).size}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Classes Covered
            </span>
            <GraduationCap
              size={21}
              className="text-amber-600"
            />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {new Set(
              assignments.map((item) => item.class_id)
            ).size}
          </p>
        </div>
      </div>

      <div className="students-card">
        <div className="students-toolbar flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="student-count flex items-center gap-2">
              <UserCheck size={19} />
              <span className="font-semibold">
                Assignment Records
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {filteredAssignments.length}
              </span>
            </div>

            <button
              type="button"
              onClick={loadPageData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search assignments..."
                aria-label="Search assignments"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={teacherFilter}
              onChange={(event) =>
                setTeacherFilter(event.target.value)
              }
              aria-label="Filter by teacher"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All teachers</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name || "Unnamed teacher"}
                </option>
              ))}
            </select>

            <select
              value={subjectFilter}
              onChange={(event) =>
                setSubjectFilter(event.target.value)
              }
              aria-label="Filter by subject"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>

            <select
              value={classFilter}
              onChange={(event) =>
                setClassFilter(event.target.value)
              }
              aria-label="Filter by class"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All classes</option>
              {classes.map((schoolClass) => (
                <option
                  key={schoolClass.id}
                  value={schoolClass.id}
                >
                  {selectClassName(schoolClass)}
                </option>
              ))}
            </select>
          </div>

          {(search ||
            teacherFilter ||
            subjectFilter ||
            classFilter) && (
            <div>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="empty-state flex items-center justify-center gap-3 p-10">
            <RefreshCw
              size={20}
              className="animate-spin"
            />
            Loading teacher assignments...
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Stream</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>
                        <div className="student-name">
                          <div className="student-avatar">
                            {(assignment.teacher_name || "T")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <strong className="block">
                              {assignment.teacher_name ||
                                "Unknown teacher"}
                            </strong>
                            <span className="text-xs text-gray-500">
                              {assignment.employee_number ||
                                "No employee number"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="font-medium text-gray-800">
                          {assignment.subject_name ||
                            "Unknown subject"}
                        </div>
                        {assignment.subject_code && (
                          <span className="text-xs text-gray-500">
                            {assignment.subject_code}
                          </span>
                        )}
                      </td>

                      <td>
                        {assignment.class_name ||
                          "Unknown class"}
                      </td>

                      <td>
                        {assignment.stream_name ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            <Layers size={13} />
                            {assignment.stream_name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            All streams
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state py-10 text-center">
                        {assignments.length === 0
                          ? "No teacher assignments yet. Select Assign Teacher to create one."
                          : "No assignments match your search or filters."}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherAssignments;
