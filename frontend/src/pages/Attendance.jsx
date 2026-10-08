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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.get("/attendance");

      setAttendance(
        response.data.attendance ||
        response.data.data ||
        []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load attendance."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (record) => {
    if (record.student_name) {
      return record.student_name;
    }

    if (record.student?.full_name) {
      return record.student.full_name;
    }

    if (record.student?.name) {
      return record.student.name;
    }

    return "—";
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
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>

              <tbody>
                {attendance.length > 0 ? (
                  attendance.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="student-name">
                          <div className="student-avatar">
                            {getStudentName(record)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <strong>
                            {getStudentName(record)}
                          </strong>
                        </div>
                      </td>

                      <td>
                        {record.date ||
                          record.attendance_date ||
                          "—"}
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
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
