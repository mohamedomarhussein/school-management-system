import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  Plus,
  Trophy,
} from "lucide-react";
import api from "../services/api";

function Exams() {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const [examsResponse, resultsResponse] =
        await Promise.all([
          api.get("/exams"),
          api.get("/exams/results"),
        ]);

      setExams(
        examsResponse.data.exams ||
        examsResponse.data.data ||
        []
      );

      setResults(
        resultsResponse.data.results ||
        resultsResponse.data.data ||
        []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load exams and results."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (result) => {
    if (result.student_name) {
      return result.student_name;
    }

    if (result.student?.full_name) {
      return result.student.full_name;
    }

    return "—";
  };

  const getSubjectName = (result) => {
    if (result.subject_name) {
      return result.subject_name;
    }

    if (result.subject?.name) {
      return result.subject.name;
    }

    return "—";
  };

  const getExamName = (result) => {
    if (result.exam_name) {
      return result.exam_name;
    }

    if (result.exam?.name) {
      return result.exam.name;
    }

    return "—";
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Exams & Results</h2>
          <p>
            Manage examinations and student academic results.
          </p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Add Exam
        </button>
      </div>

      {loading && (
        <div className="empty-state">
          Loading exams and results...
        </div>
      )}

      {error && (
        <div className="error-state">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div>
                <span>Total Exams</span>
                <strong>{exams.length}</strong>
              </div>

              <Calendar size={28} />
            </div>

            <div className="stat-card">
              <div>
                <span>Total Results</span>
                <strong>{results.length}</strong>
              </div>

              <Award size={28} />
            </div>

            <div className="stat-card">
              <div>
                <span>Subjects Assessed</span>
                <strong>
                  {new Set(
                    results.map(
                      (result) => result.subject_id
                    )
                  ).size}
                </strong>
              </div>

              <BookOpen size={28} />
            </div>
          </div>

          <div className="students-card">
            <div className="card-header">
              <h3>Examinations</h3>
              <p>Scheduled school examinations</p>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Term</th>
                    <th>Academic Year</th>
                    <th>Date</th>
                    <th>Class</th>
                  </tr>
                </thead>

                <tbody>
                  {exams.length > 0 ? (
                    exams.map((exam) => (
                      <tr key={exam.id}>
                        <td>
                          <strong>
                            {exam.name || "—"}
                          </strong>
                        </td>

                        <td>
                          {exam.term || "—"}
                        </td>

                        <td>
                          {exam.academic_year || "—"}
                        </td>

                        <td>
                          {exam.exam_date ||
                            exam.date ||
                            "—"}
                        </td>

                        <td>
                          {exam.class_name ||
                            exam.class?.name ||
                            exam.class_id ||
                            "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">
                        <div className="empty-state">
                          No examinations found.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="students-card">
            <div className="card-header">
              <h3>Exam Results</h3>
              <p>Student academic performance</p>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Exam</th>
                    <th>Subject</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                  </tr>
                </thead>

                <tbody>
                  {results.length > 0 ? (
                    results.map((result) => (
                      <tr key={result.id}>
                        <td>
                          <div className="student-name">
                            <div className="student-avatar">
                              {getStudentName(result)
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <strong>
                              {getStudentName(result)}
                            </strong>
                          </div>
                        </td>

                        <td>
                          {getExamName(result)}
                        </td>

                        <td>
                          {getSubjectName(result)}
                        </td>

                        <td>
                          <strong>
                            {result.marks ?? "—"}
                          </strong>
                        </td>

                        <td>
                          <span className="badge">
                            {result.grade || "—"}
                          </span>
                        </td>

                        <td>
                          {result.remarks || "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">
                        <div className="empty-state">
                          No exam results found.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <Trophy size={22} />
              <div>
                <h3>Academic Performance</h3>
                <p>
                  Results are automatically graded by the
                  backend based on marks.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Exams;
