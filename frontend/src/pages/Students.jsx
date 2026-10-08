import { useEffect, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import api from "../services/api";

function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsResponse, classesResponse, streamsResponse] =
        await Promise.all([
          api.get("/admin/students"),
          api.get("/admin/classes"),
          api.get("/admin/streams"),
        ]);

      setStudents(
        studentsResponse.data.students ||
          studentsResponse.data.data ||
          []
      );

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
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load student information."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (student) => {
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

  const getClassName = (student) => {
    if (student.class_name) return student.class_name;
    if (student.class?.name) return student.class.name;

    const schoolClass = classes.find(
      (item) => item.id === student.class_id
    );

    return schoolClass?.name || "—";
  };

  const getStreamName = (student) => {
    if (student.stream_name) return student.stream_name;
    if (student.stream?.name) return student.stream.name;

    const stream = streams.find(
      (item) => item.id === student.stream_id
    );

    return stream?.name || "—";
  };

  const filteredStudents = students.filter((student) => {
    const searchValue = search.toLowerCase();
    const name = getStudentName(student).toLowerCase();

    return (
      name.includes(searchValue) ||
      String(student.admission_number || "")
        .toLowerCase()
        .includes(searchValue)
    );
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Students</h2>
          <p>Manage students registered in the school.</p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Add Student
        </button>
      </div>

      <div className="students-card">
        <div className="students-toolbar">
          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search by name or admission number..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="student-count">
            <Users size={18} />
            <span>{filteredStudents.length} Students</span>
          </div>
        </div>

        {loading && (
          <div className="empty-state">
            Loading students...
          </div>
        )}

        {error && (
          <div className="error-state">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission No.</th>
                  <th>Gender</th>
                  <th>Date of Birth</th>
                  <th>Class</th>
                  <th>Stream</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const name = getStudentName(student);

                    return (
                      <tr key={student.id}>
                        <td>
                          <div className="student-name">
                            <div className="student-avatar">
                              {name.charAt(0).toUpperCase()}
                            </div>

                            <strong>{name}</strong>
                          </div>
                        </td>

                        <td>
                          {student.admission_number || "—"}
                        </td>

                        <td>
                          <span className="badge">
                            {student.gender || "—"}
                          </span>
                        </td>

                        <td>
                          {student.date_of_birth || "—"}
                        </td>

                        <td>
                          {getClassName(student)}
                        </td>

                        <td>
                          {getStreamName(student)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6">
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
    </div>
  );
}

export default Students;
