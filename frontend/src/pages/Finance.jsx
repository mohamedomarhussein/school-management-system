import { useEffect, useState } from "react";
import { CreditCard, DollarSign, Plus, Wallet } from "lucide-react";
import api from "../services/api";

function Finance() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const [
        feeStructuresResponse,
        paymentsResponse,
        studentsResponse,
        classesResponse,
        streamsResponse,
      ] = await Promise.all([
        api.get("/admin/finance/fee-structures"),
        api.get("/admin/finance/payments"),
        api.get("/admin/students"),
        api.get("/admin/classes"),
        api.get("/admin/streams"),
      ]);

      setFeeStructures(
        feeStructuresResponse.data.fee_structures ||
          feeStructuresResponse.data.data ||
          []
      );

      setPayments(
        paymentsResponse.data.payments ||
          paymentsResponse.data.data ||
          []
      );

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
          "Failed to load finance information."
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

  const getStudent = (payment) => {
    return students.find(
      (student) => student.id === payment.student_id
    );
  };

  const getStudentClass = (student) => {
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

  const getStudentStream = (student) => {
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

  const totalFees = feeStructures.reduce(
    (total, fee) => total + Number(fee.amount || 0),
    0
  );

  const totalPayments = payments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  const formatCurrency = (amount) => {
    return `KES ${Number(amount || 0).toLocaleString()}`;
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
          <h2>Finance</h2>
          <p>
            Manage school fees, payments and financial records.
          </p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Record Payment
        </button>
      </div>

      {loading && (
        <div className="empty-state">
          Loading finance information...
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
                <span>Total Fee Structures</span>
                <strong>{feeStructures.length}</strong>
              </div>
              <Wallet size={28} />
            </div>

            <div className="stat-card">
              <div>
                <span>Total Fees</span>
                <strong>{formatCurrency(totalFees)}</strong>
              </div>
              <DollarSign size={28} />
            </div>

            <div className="stat-card">
              <div>
                <span>Total Payments</span>
                <strong>{formatCurrency(totalPayments)}</strong>
              </div>
              <CreditCard size={28} />
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h3>Fee Structures</h3>
                <p>Configured school fees</p>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Class</th>
                    <th>Academic Year</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {feeStructures.length > 0 ? (
                    feeStructures.map((fee) => {
                      const schoolClass = classes.find(
                        (item) => item.id === fee.class_id
                      );

                      return (
                        <tr key={fee.id}>
                          <td>
                            {fee.description || "—"}
                          </td>

                          <td>
                            {schoolClass?.name ||
                              fee.class_name ||
                              fee.class_id ||
                              "—"}
                          </td>

                          <td>
                            {fee.academic_year || "—"}
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(fee.amount)}
                            </strong>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4">
                        <div className="empty-state">
                          No fee structures found.
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
              <div>
                <h3>Payments</h3>
                <p>Recent student fee payments</p>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Admission No.</th>
                    <th>Class</th>
                    <th>Stream</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Method</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.length > 0 ? (
                    payments.map((payment) => {
                      const student = getStudent(payment);

                      return (
                        <tr key={payment.id}>
                          <td>
                            <div className="student-name">
                              <div className="student-avatar">
                                {getStudentName(student)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <strong>
                                {getStudentName(student)}
                              </strong>
                            </div>
                          </td>

                          <td>
                            {student?.admission_number || "—"}
                          </td>

                          <td>
                            {getStudentClass(student)}
                          </td>

                          <td>
                            {getStudentStream(student)}
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(payment.amount)}
                            </strong>
                          </td>

                          <td>
                            {formatDate(
                              payment.payment_date ||
                                payment.date ||
                                payment.created_at
                            )}
                          </td>

                          <td>
                            <span className="badge">
                              {payment.payment_method ||
                                payment.method ||
                                "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7">
                        <div className="empty-state">
                          No payments found.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Finance;
