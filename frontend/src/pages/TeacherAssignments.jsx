import { useEffect, useState } from "react";
import { Plus, UserCheck } from "lucide-react";
import api from "../services/api";

function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get(
        "/admin/teacher-assignments"
      );

      setAssignments(
        response.data.assignments ||
        response.data.data ||
        []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load teacher assignments."
      );
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = (assignment) => {
    if (assignment.teacher_name) {
      return assignment.teacher_name;
    }

    if (assignment.teacher?.name) {
      return assignment.teacher.name;
    }

    if (assignment.teacher?.full_name) {
      return assignment.teacher.full_name;
    }

    return "—";
  };

  const getSubjectName = (assignment) => {
    if (assignment.subject_name) {
      return assignment.subject_name;
    }

    if (assignment.subject?.name) {
      return assignment.subject.name;
    }

    return "—";
  };

  const getClassName = (assignment) => {
    if (assignment.class_name) {
      return assignment.class_name;
    }

    if (assignment.class?.name) {
      return assignment.class.name;
    }

    return "—";
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Teacher Assignments</h2>
          <p>
            Manage teachers assigned to subjects and classes.
          </p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Assign Teacher
        </button>
      </div>

      {loading && (
        <div className="empty-state">
          Loading teacher assignments...
        </div>
      )}

      {error && (
        <div className="error-state">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="students-card">
          <div className="students-toolbar">
            <div className="student-count">
              <UserCheck size={18} />
              <span>
                {assignments.length} Assignments
              </span>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Academic Year</th>
                </tr>
              </thead>

              <tbody>
                {assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>
                        <div className="student-name">
                          <div className="student-avatar">
                            {getTeacherName(assignment)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <strong>
                            {getTeacherName(assignment)}
                          </strong>
                        </div>
                      </td>

                      <td>
                        {getSubjectName(assignment)}
                      </td>

                      <td>
                        {getClassName(assignment)}
                      </td>

                      <td>
                        {assignment.academic_year || "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      <div className="empty-state">
                        No teacher assignments found.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherAssignments;
