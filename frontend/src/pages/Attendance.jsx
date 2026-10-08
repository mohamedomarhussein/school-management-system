import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import api from "../services/api";

function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAttendance();
    fetchStudents();
    fetchClasses();
    fetchStreams();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.get("/attendance");

      setAttendance(
        response.data.attendance ||
          response.data.data ||
          []
      );

      setError("");
    } catch (err) {
      console.error("Attendance error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load attendance information."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get("/admin/students");

      setStudents(
        response.data.students ||
          response.data.data ||
          []
      );
    } catch (err) {
      console.error("Students error:", err);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get("/admin/classes");

      setClasses(
        response.data.classes ||
          response.data.data ||
          []
      );
    } catch (err) {
      console.error("Classes error:", err);
    }
  };

  const fetchStreams = async () => {
    try {
      const response = await api.get("/admin/streams");

      setStreams(
        response.data.streams ||
          response.data.data ||
          []
      );
    } catch (err) {
      console.error("Streams error:", err);
    }
  };

  const getStudentName = (student) => {
    if (!student) return "—";

    if (student.full_name) {
      return student.full_name;
    }

    return [
      student.first_name,
      student.middle_name,
      student.last_name,
    ]
      .filter(Boolean)
      .join(" ") || "Unknown Student";
  };

  const getStudent = (record) => {
    if (record.student) {
      return record.student;
    }

    return students.find(
      (student) => student.id === record.student_id
    );
  };

  const getClassName = (student) => {
    if (!student) return "—";

    if (student.class_name) {
      return student.class_name;
    }

    if (student.class?.name) {
      return student.class.name;
    }

    const schoolClass = classes.find(
      (item) => item.id === student.class_id
    );

    return schoolClass?.name || "—";
  };

  const getStreamName = (student) => {
    if (!student) return "—";

    if (student.stream_name) {
      return student.stream_name;
    }

    if (student.stream?.name) {
      return student.stream.name;
    }

    const stream = streams.find(
      (item) => item.id === student.stream_id
    );

    return stream?.name || "—";
  };

  const getStatusIcon = (status) => {
    if (status === "Present") {
      return <CheckCircle size={17} />;
    }

    if (status === "Absent") {
      return <XCircle size={17} />;
    }

    return <Clock size={17} />;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Attendance</h2>
          <p>Monitor and manage student attendance.</p>
        </div>

        <div className="student-count">
          <CalendarCheck size={18} />
          <span>{attendance.length} Records</span>
        </div>
      </div>

      {loading && (
        <div className="empty-state">
          Loading attendance...
        </div>
      )}

      {error && (
        <div className="error-state">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="students-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission No.</th>
                  <th>Class</th>
                  <th>Stream</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>

              <tbody>
                {attendance.length > 0 ? (
                  attendance.map((record) => {
                    const student = getStudent(record);
                    const studentName = getStudentName(student);

                    return (
                      <tr key={record.id}>
                        <td>
                          <div className="student-name">
                            <div className="student-avatar">
                              {studentName
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <strong>
                              {studentName}
                            </strong>
                          </div>
                        </td>

                        <td>
                          {student?.admission_number || "—"}
                        </td>

                        <td>
                          {getClassName(student)}
                        </td>

                        <td>
                          {getStreamName(student)}
                        </td>

                        <td>
                          {formatDate(
                            record.date ||
                              record.attendance_date
                          )}
                        </td>

                        <td>
                          <span className="badge">
                            {getStatusIcon(record.status)}
                            {record.status || "—"}
                          </span>
                        </td>

                        <td>
                          {record.remarks || "—"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        No attendance records found.
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

export default Attendance;
