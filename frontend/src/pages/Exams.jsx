import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Edit,
  Filter,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  Trophy,
  Users,
  X,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";
import "./Exams.css";

const emptyExamForm = {
  name: "",
  term: "Term 1",
  academic_year: String(new Date().getFullYear()),
  exam_date: "",
  class_id: "",
};

const emptyResultForm = {
  student_id: "",
  subject_id: "",
  exam_id: "",
  marks: "",
  remarks: "",
};

function Exams() {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [termFilter, setTermFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const [activeTab, setActiveTab] = useState("exams");
  const [showExamModal, setShowExamModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  const [editingExam, setEditingExam] = useState(null);
  const [editingResult, setEditingResult] = useState(null);

  const [examForm, setExamForm] = useState(emptyExamForm);
  const [resultForm, setResultForm] = useState(emptyResultForm);
  const [formError, setFormError] = useState("");

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const isAdmin = String(currentUser.role || "").toLowerCase() === "admin";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setPageError("");

    try {
      const [
        examsResponse,
        resultsResponse,
        studentsResponse,
        subjectsResponse,
        classesResponse,
      ] = await Promise.all([
        api.get("/exams"),
        api.get("/exams/results"),
        api.get("/admin/students"),
        api.get("/admin/subjects"),
        api.get("/admin/classes"),
      ]);

      setExams(examsResponse.data.exams || []);
      setResults(resultsResponse.data.results || []);
      setStudents(studentsResponse.data.students || studentsResponse.data.data || []);
      setSubjects(subjectsResponse.data.subjects || subjectsResponse.data.data || []);
      setClasses(classesResponse.data.classes || classesResponse.data.data || []);
    } catch (error) {
      console.error("Exams page loading error:", error);
      setPageError(
        error.response?.data?.message ||
          error.response?.data?.msg ||
          "Unable to load exams data. Check that the backend is running and you are signed in."
      );
    } finally {
      setLoading(false);
    }
  };

  const getClassName = (classId) =>
    classes.find((item) => Number(item.id) === Number(classId))?.name || "Unknown class";

  const getStudentName = (studentId) => {
    const student = students.find(
      (item) => Number(item.id) === Number(studentId)
    );

    if (!student) return `Student #${studentId}`;

    return `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
      student.admission_number ||
      `Student #${studentId}`;
  };

  const getStudentAdmission = (studentId) =>
    students.find((item) => Number(item.id) === Number(studentId))
      ?.admission_number || "—";

  const getSubjectName = (subjectId) =>
    subjects.find((item) => Number(item.id) === Number(subjectId))?.name ||
    `Subject #${subjectId}`;

  const getExamName = (examId) =>
    exams.find((item) => Number(item.id) === Number(examId))?.name ||
    `Exam #${examId}`;

  const getExamClassId = (examId) =>
    exams.find((item) => Number(item.id) === Number(examId))?.class_id;

  const formatDate = (date) => {
    if (!date) return "Not scheduled";

    const parsed = new Date(`${date}T00:00:00`);

    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  };

  const filteredExams = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exams.filter((exam) => {
      const matchesSearch =
        !query ||
        `${exam.name || ""} ${exam.term || ""} ${exam.academic_year || ""} ${getClassName(exam.class_id)}`
          .toLowerCase()
          .includes(query);

      const matchesClass =
        !classFilter || String(exam.class_id) === classFilter;
      const matchesTerm = !termFilter || exam.term === termFilter;
      const matchesYear =
        !yearFilter || String(exam.academic_year) === yearFilter;

      return matchesSearch && matchesClass && matchesTerm && matchesYear;
    });
  }, [exams, search, classFilter, termFilter, yearFilter, classes]);

  const filteredResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    return results.filter((result) => {
      const resultExam = exams.find(
        (item) => Number(item.id) === Number(result.exam_id)
      );

      const studentName = getStudentName(result.student_id);
      const subjectName = getSubjectName(result.subject_id);
      const examName = getExamName(result.exam_id);

      const matchesSearch =
        !query ||
        `${studentName} ${subjectName} ${examName} ${result.grade || ""} ${result.remarks || ""}`
          .toLowerCase()
          .includes(query);

      const matchesClass =
        !classFilter ||
        String(resultExam?.class_id || "") === classFilter;
      const matchesTerm = !termFilter || resultExam?.term === termFilter;
      const matchesYear =
        !yearFilter ||
        String(resultExam?.academic_year || "") === yearFilter;

      return matchesSearch && matchesClass && matchesTerm && matchesYear;
    });
  }, [
    results,
    exams,
    students,
    subjects,
    search,
    classFilter,
    termFilter,
    yearFilter,
  ]);

  const totalStudentsAssessed = new Set(
    results.map((result) => result.student_id)
  ).size;

  const averageMark = results.length
    ? (
        results.reduce((total, result) => total + Number(result.marks || 0), 0) /
        results.length
      ).toFixed(1)
    : "—";

  const resetFilters = () => {
    setSearch("");
    setClassFilter("");
    setTermFilter("");
    setYearFilter("");
  };

  const openAddExam = () => {
    setEditingExam(null);
    setExamForm({
      ...emptyExamForm,
      academic_year: String(new Date().getFullYear()),
    });
    setFormError("");
    setShowExamModal(true);
  };

  const openEditExam = (exam) => {
    setEditingExam(exam);
    setExamForm({
      name: exam.name || "",
      term: exam.term || "Term 1",
      academic_year: String(exam.academic_year || ""),
      exam_date: exam.exam_date || "",
      class_id: String(exam.class_id || ""),
    });
    setFormError("");
    setShowExamModal(true);
  };

  const closeExamModal = () => {
    if (saving) return;
    setShowExamModal(false);
    setEditingExam(null);
    setFormError("");
  };

  const handleExamSubmit = async (event) => {
    event.preventDefault();

    if (
      !examForm.name.trim() ||
      !examForm.term ||
      !examForm.academic_year ||
      !examForm.class_id
    ) {
      setFormError("Please complete the exam name, term, year, and class.");
      return;
    }

    const year = Number(examForm.academic_year);

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setFormError("Enter a valid academic year.");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      name: examForm.name.trim(),
      term: examForm.term,
      academic_year: year,
      exam_date: examForm.exam_date || null,
      class_id: Number(examForm.class_id),
    };

    try {
      if (editingExam) {
        await api.put(`/exams/${editingExam.id}`, payload);
        showNotice("Exam updated successfully.");
      } else {
        await api.post("/exams", payload);
        showNotice("Exam created successfully.");
      }

      setShowExamModal(false);
      setEditingExam(null);
      await loadData();
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          error.response?.data?.msg ||
          "Unable to save this exam."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExam = async (exam) => {
    const confirmed = window.confirm(
      `Delete "${exam.name}" for ${getClassName(exam.class_id)}? Associated results may also be deleted.`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/exams/${exam.id}`);
      showNotice("Exam deleted successfully.");
      await loadData();
    } catch (error) {
      setPageError(
        error.response?.data?.message ||
          error.response?.data?.msg ||
          "Unable to delete this exam."
      );
    }
  };

  const openAddResult = () => {
    setEditingResult(null);
    setResultForm({
      ...emptyResultForm,
      exam_id: exams[0] ? String(exams[0].id) : "",
    });
    setFormError("");
    setActiveTab("results");
    setShowResultModal(true);
  };

  const openEditResult = (result) => {
    setEditingResult(result);
    setResultForm({
      student_id: String(result.student_id),
      subject_id: String(result.subject_id),
      exam_id: String(result.exam_id),
      marks: String(result.marks ?? ""),
      remarks: result.remarks || "",
    });
    setFormError("");
    setShowResultModal(true);
  };

  const closeResultModal = () => {
    if (saving) return;
    setShowResultModal(false);
    setEditingResult(null);
    setFormError("");
  };

  const selectedExam = exams.find(
    (exam) => String(exam.id) === resultForm.exam_id
  );

  const eligibleStudents = students.filter(
    (student) =>
      !selectedExam ||
      Number(student.class_id) === Number(selectedExam.class_id)
  );

  const handleResultSubmit = async (event) => {
    event.preventDefault();

    if (
      !resultForm.student_id ||
      !resultForm.subject_id ||
      !resultForm.exam_id ||
      resultForm.marks === ""
    ) {
      setFormError("Please select a student, subject, exam, and enter marks.");
      return;
    }

    const marks = Number(resultForm.marks);

    if (!Number.isFinite(marks) || marks < 0 || marks > 100) {
      setFormError("Marks must be a number between 0 and 100.");
      return;
    }

    if (!editingResult) {
      const student = students.find(
        (item) => Number(item.id) === Number(resultForm.student_id)
      );
      const exam = exams.find(
        (item) => Number(item.id) === Number(resultForm.exam_id)
      );

      if (student && exam && Number(student.class_id) !== Number(exam.class_id)) {
        setFormError("The selected student must belong to the exam's class.");
        return;
      }

      const duplicate = results.some(
        (result) =>
          Number(result.student_id) === Number(resultForm.student_id) &&
          Number(result.subject_id) === Number(resultForm.subject_id) &&
          Number(result.exam_id) === Number(resultForm.exam_id)
      );

      if (duplicate) {
        setFormError(
          "A result already exists for this student, subject, and exam. Edit the existing result instead."
        );
        return;
      }
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingResult) {
        await api.put(`/exams/results/${editingResult.id}`, {
          marks,
          remarks: resultForm.remarks.trim(),
        });
        showNotice("Result updated successfully.");
      } else {
        await api.post("/exams/results", {
          student_id: Number(resultForm.student_id),
          subject_id: Number(resultForm.subject_id),
          exam_id: Number(resultForm.exam_id),
          marks,
          remarks: resultForm.remarks.trim(),
        });
        showNotice("Result recorded successfully.");
      }

      setShowResultModal(false);
      setEditingResult(null);
      await loadData();
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          error.response?.data?.msg ||
          "Unable to save this result."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResult = async (result) => {
    const confirmed = window.confirm(
      `Delete the result for ${getStudentName(result.student_id)} in ${getSubjectName(result.subject_id)}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/exams/results/${result.id}`);
      showNotice("Result deleted successfully.");
      await loadData();
    } catch (error) {
      setPageError(
        error.response?.data?.message ||
          error.response?.data?.msg ||
          "Unable to delete this result."
      );
    }
  };

  const gradeClass = (grade) => {
    const normalized = String(grade || "").toUpperCase();
    if (normalized === "A") return "grade-a";
    if (normalized === "B") return "grade-b";
    if (normalized === "C") return "grade-c";
    if (normalized === "D") return "grade-d";
    return "grade-e";
  };

  if (loading) {
    return (
      <div className="page-content exams-page">
        <div className="exams-loading">
          <RefreshCw size={24} className="spin" />
          <p>Loading exams and results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content exams-page">
      <div className="exams-heading">
        <div>
          <span className="exams-eyebrow">
            ACADEMIC MANAGEMENT
          </span>
          <h2>Exams & Results</h2>
          <p>Schedule examinations, record marks, and monitor academic performance.</p>
        </div>

        <div className="exams-heading-actions">
          <button className="exams-secondary-button" onClick={loadData}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="exams-primary-button" onClick={openAddExam}>
            <Plus size={18} />
            Add Exam
          </button>
          <button
            className="exams-primary-button exams-primary-light"
            onClick={openAddResult}
            disabled={exams.length === 0 || students.length === 0 || subjects.length === 0}
          >
            <Plus size={18} />
            Record Marks
          </button>
        </div>
      </div>

      {notice && (
        <div className="exams-notice" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss notification">
            <X size={16} />
          </button>
        </div>
      )}

      {pageError && (
        <div className="exams-alert" role="alert">
          <span>{pageError}</span>
          <button onClick={() => setPageError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      <section className="exams-stat-grid">
        <article className="exams-stat-card">
          <div className="exams-stat-icon icon-blue"><CalendarDays size={22} /></div>
          <div>
            <span>Total Examinations</span>
            <strong>{exams.length}</strong>
            <small>Across all classes and terms</small>
          </div>
        </article>

        <article className="exams-stat-card">
          <div className="exams-stat-icon icon-purple"><ClipboardList size={22} /></div>
          <div>
            <span>Results Recorded</span>
            <strong>{results.length}</strong>
            <small>Individual subject results</small>
          </div>
        </article>

        <article className="exams-stat-card">
          <div className="exams-stat-icon icon-green"><Users size={22} /></div>
          <div>
            <span>Students Assessed</span>
            <strong>{totalStudentsAssessed}</strong>
            <small>Students with at least one result</small>
          </div>
        </article>

        <article className="exams-stat-card">
          <div className="exams-stat-icon icon-amber"><Trophy size={22} /></div>
          <div>
            <span>Average Mark</span>
            <strong>{averageMark}{averageMark !== "—" ? "%" : ""}</strong>
            <small>Across recorded results</small>
          </div>
        </article>
      </section>

      <section className="exams-filter-panel">
        <div className="exams-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={activeTab === "exams" ? "Search exam, class, term..." : "Search student, subject, exam..."}
            aria-label="Search exams or results"
          />
        </div>

        <div className="exams-filter-select">
          <Filter size={16} />
          <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} aria-label="Filter by class">
            <option value="">All classes</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>
            ))}
          </select>
        </div>

        <select value={termFilter} onChange={(event) => setTermFilter(event.target.value)} aria-label="Filter by term">
          <option value="">All terms</option>
          <option value="Term 1">Term 1</option>
          <option value="Term 2">Term 2</option>
          <option value="Term 3">Term 3</option>
        </select>

        <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} aria-label="Filter by academic year">
          <option value="">All years</option>
          {[...new Set(exams.map((exam) => String(exam.academic_year)))].sort((a, b) => Number(b) - Number(a)).map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <button className="exams-reset-button" onClick={resetFilters}>Reset</button>
      </section>

      <div className="exams-tabs" role="tablist" aria-label="Academic records">
        <button
          className={activeTab === "exams" ? "active" : ""}
          onClick={() => setActiveTab("exams")}
          role="tab"
          aria-selected={activeTab === "exams"}
        >
          <CalendarDays size={17} />
          Examinations
          <span>{filteredExams.length}</span>
        </button>
        <button
          className={activeTab === "results" ? "active" : ""}
          onClick={() => setActiveTab("results")}
          role="tab"
          aria-selected={activeTab === "results"}
        >
          <GraduationCap size={18} />
          Student Results
          <span>{filteredResults.length}</span>
        </button>
      </div>

      {activeTab === "exams" ? (
        <section className="exams-table-card">
          <div className="exams-table-heading">
            <div>
              <h3>Examination Schedule</h3>
              <p>Manage exam dates, terms, academic years, and classes.</p>
            </div>
            <span className="exams-record-count">{filteredExams.length} records</span>
          </div>

          <div className="exams-table-scroll">
            <table className="exams-table">
              <thead>
                <tr>
                  <th>Examination</th>
                  <th>Class</th>
                  <th>Term</th>
                  <th>Academic Year</th>
                  <th>Exam Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.length ? filteredExams.map((exam) => (
                  <tr key={exam.id}>
                    <td>
                      <div className="exams-main-cell">
                        <div className="exams-row-icon"><BookOpen size={18} /></div>
                        <div>
                          <strong>{exam.name}</strong>
                          <small>Exam ID: #{exam.id}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className="exams-class-chip">{getClassName(exam.class_id)}</span></td>
                    <td>{exam.term || "—"}</td>
                    <td>{exam.academic_year || "—"}</td>
                    <td>{formatDate(exam.exam_date)}</td>
                    <td>
                      <div className="exams-row-actions">
                        <button className="exams-icon-button" onClick={() => openEditExam(exam)} title="Edit exam" aria-label={`Edit ${exam.name}`}>
                          <Edit size={16} />
                        </button>
                        {isAdmin && (
                          <button className="exams-icon-button danger" onClick={() => handleDeleteExam(exam)} title="Delete exam" aria-label={`Delete ${exam.name}`}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6"><div className="exams-empty"><CalendarDays size={28} /><strong>No examinations found</strong><span>Add an exam or adjust your filters.</span></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="exams-table-card">
          <div className="exams-table-heading">
            <div>
              <h3>Student Results</h3>
              <p>Review marks and grades. Grades are calculated by the backend.</p>
            </div>
            <span className="exams-record-count">{filteredResults.length} records</span>
          </div>

          <div className="exams-table-scroll">
            <table className="exams-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Examination</th>
                  <th>Subject</th>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.length ? filteredResults.map((result) => (
                  <tr key={result.id}>
                    <td>
                      <div className="exams-main-cell">
                        <div className="exams-student-avatar">{getStudentName(result.student_id).charAt(0).toUpperCase()}</div>
                        <div>
                          <strong>{getStudentName(result.student_id)}</strong>
                          <small>{getStudentAdmission(result.student_id)}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="exams-result-exam">{getExamName(result.exam_id)}</strong>
                      <small className="exams-cell-subtitle">{getClassName(getExamClassId(result.exam_id))}</small>
                    </td>
                    <td>{getSubjectName(result.subject_id)}</td>
                    <td><strong className="exams-mark">{Number(result.marks).toFixed(1)}<small>/100</small></strong></td>
                    <td><span className={`exams-grade ${gradeClass(result.grade)}`}>{result.grade || "—"}</span></td>
                    <td>{result.remarks || "—"}</td>
                    <td>
                      <div className="exams-row-actions">
                        <button className="exams-icon-button" onClick={() => openEditResult(result)} title="Edit result" aria-label={`Edit result for ${getStudentName(result.student_id)}`}>
                          <Edit size={16} />
                        </button>
                        {isAdmin && (
                          <button className="exams-icon-button danger" onClick={() => handleDeleteResult(result)} title="Delete result" aria-label={`Delete result for ${getStudentName(result.student_id)}`}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7"><div className="exams-empty"><Award size={28} /><strong>No results found</strong><span>Record marks or adjust your filters.</span></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="exams-grading-note">
        <div className="exams-grading-icon"><Award size={21} /></div>
        <div>
          <strong>Automatic grading</strong>
          <p>Grades are calculated by the backend: A (80–100), B (70–79), C (60–69), D (50–59), E (below 50).</p>
        </div>
      </section>

      {showExamModal && (
        <div className="exams-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeExamModal()}>
          <div className="exams-modal" role="dialog" aria-modal="true" aria-labelledby="exam-modal-title">
            <div className="exams-modal-header">
              <div className="exams-modal-heading-icon"><CalendarDays size={21} /></div>
              <div>
                <h3 id="exam-modal-title">{editingExam ? "Edit Examination" : "Create Examination"}</h3>
                <p>Enter the details for this school examination.</p>
              </div>
              <button className="exams-modal-close" onClick={closeExamModal} disabled={saving} aria-label="Close modal"><X size={20} /></button>
            </div>

            {formError && <div className="exams-alert">{formError}</div>}

            <form onSubmit={handleExamSubmit}>
              <div className="exams-form-grid">
                <label className="exams-form-field full">
                  <span>Examination name *</span>
                  <input value={examForm.name} onChange={(event) => setExamForm({ ...examForm, name: event.target.value })} placeholder="e.g. Mid Term Examination" required />
                </label>

                <label className="exams-form-field">
                  <span>Term *</span>
                  <select value={examForm.term} onChange={(event) => setExamForm({ ...examForm, term: event.target.value })} required>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </label>

                <label className="exams-form-field">
                  <span>Academic year *</span>
                  <input type="number" min="2000" max="2100" value={examForm.academic_year} onChange={(event) => setExamForm({ ...examForm, academic_year: event.target.value })} required />
                </label>

                <label className="exams-form-field">
                  <span>Class *</span>
                  <select value={examForm.class_id} onChange={(event) => setExamForm({ ...examForm, class_id: event.target.value })} required>
                    <option value="">Select class</option>
                    {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
                  </select>
                </label>

                <label className="exams-form-field">
                  <span>Examination date</span>
                  <input type="date" value={examForm.exam_date} onChange={(event) => setExamForm({ ...examForm, exam_date: event.target.value })} />
                </label>
              </div>

              <div className="exams-modal-actions">
                <button type="button" className="exams-secondary-button" onClick={closeExamModal} disabled={saving}>Cancel</button>
                <button type="submit" className="exams-primary-button" disabled={saving}>{saving ? "Saving..." : editingExam ? "Save Changes" : "Create Exam"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResultModal && (
        <div className="exams-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeResultModal()}>
          <div className="exams-modal" role="dialog" aria-modal="true" aria-labelledby="result-modal-title">
            <div className="exams-modal-header">
              <div className="exams-modal-heading-icon result"><GraduationCap size={22} /></div>
              <div>
                <h3 id="result-modal-title">{editingResult ? "Edit Student Result" : "Record Student Marks"}</h3>
                <p>{editingResult ? "Update marks or remarks for this result." : "Choose the examination, student, and subject."}</p>
              </div>
              <button className="exams-modal-close" onClick={closeResultModal} disabled={saving} aria-label="Close modal"><X size={20} /></button>
            </div>

            {formError && <div className="exams-alert">{formError}</div>}

            <form onSubmit={handleResultSubmit}>
              <div className="exams-form-grid">
                <label className="exams-form-field full">
                  <span>Examination *</span>
                  <select
                    value={resultForm.exam_id}
                    onChange={(event) => setResultForm({ ...resultForm, exam_id: event.target.value, student_id: "" })}
                    required
                    disabled={Boolean(editingResult)}
                  >
                    <option value="">Select examination</option>
                    {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name} — {getClassName(exam.class_id)} ({exam.academic_year})</option>)}
                  </select>
                </label>

                <label className="exams-form-field full">
                  <span>Student *</span>
                  <select
                    value={resultForm.student_id}
                    onChange={(event) => setResultForm({ ...resultForm, student_id: event.target.value })}
                    required
                    disabled={Boolean(editingResult)}
                  >
                    <option value="">Select student</option>
                    {eligibleStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} — {student.admission_number}
                      </option>
                    ))}
                  </select>
                  {selectedExam && <small>Showing students assigned to {getClassName(selectedExam.class_id)}.</small>}
                </label>

                <label className="exams-form-field full">
                  <span>Subject *</span>
                  <select
                    value={resultForm.subject_id}
                    onChange={(event) => setResultForm({ ...resultForm, subject_id: event.target.value })}
                    required
                    disabled={Boolean(editingResult)}
                  >
                    <option value="">Select subject</option>
                    {subjects.filter((subject) => subject.is_active !== false).map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
                    ))}
                  </select>
                </label>

                <label className="exams-form-field">
                  <span>Marks (0–100) *</span>
                  <input type="number" min="0" max="100" step="0.1" value={resultForm.marks} onChange={(event) => setResultForm({ ...resultForm, marks: event.target.value })} placeholder="e.g. 78" required />
                </label>

                <label className="exams-form-field">
                  <span>Remarks</span>
                  <input value={resultForm.remarks} onChange={(event) => setResultForm({ ...resultForm, remarks: event.target.value })} placeholder="e.g. Good progress" maxLength="255" />
                </label>
              </div>

              <div className="exams-grade-preview">
                <Award size={18} />
                <span>Grade preview</span>
                <strong>
                  {resultForm.marks === "" || !Number.isFinite(Number(resultForm.marks)) || Number(resultForm.marks) < 0 || Number(resultForm.marks) > 100
                    ? "—"
                    : Number(resultForm.marks) >= 80
                    ? "A"
                    : Number(resultForm.marks) >= 70
                    ? "B"
                    : Number(resultForm.marks) >= 60
                    ? "C"
                    : Number(resultForm.marks) >= 50
                    ? "D"
                    : "E"}
                </strong>
                <small>Final grade is calculated by the backend.</small>
              </div>

              <div className="exams-modal-actions">
                <button type="button" className="exams-secondary-button" onClick={closeResultModal} disabled={saving}>Cancel</button>
                <button type="submit" className="exams-primary-button" disabled={saving}>{saving ? "Saving..." : editingResult ? "Save Changes" : "Record Result"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Exams;
