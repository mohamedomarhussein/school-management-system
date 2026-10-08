import { useEffect, useState } from "react";
import {
  DollarSign,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";
import api from "../services/api";

function Finance() {
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFinance();
  }, []);

  const fetchFinance = async () => {
    try {
      const [feesResponse, paymentsResponse] =
        await Promise.all([
          api.get("/admin/finance/fee-structures"),
          api.get("/admin/finance/payments"),
        ]);

      setFees(
        feesResponse.data.data ||
        feesResponse.data.fee_structures ||
        []
      );

      setPayments(
        paymentsResponse.data.data ||
        paymentsResponse.data.payments ||
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

  const totalFees = fees.reduce(
    (total, fee) => total + Number(fee.amount || 0),
    0
  );

  const totalPayments = payments.reduce(
    (total, payment) =>
      total + Number(payment.amount || 0),
    0
  );

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
                <strong>{fees.length}</strong>
              </div>

              <Receipt size={28} />
            </div>

            <div className="stat-card">
              <div>
                <span>Total Fees</span>
                <strong>
                  KES {totalFees.toLocaleString()}
                </strong>
              </div>

              <Wallet size={28} />
            </div>

            <div className="stat-card">
              <div>
                <span>Total Payments</span>
                <strong>
                  KES {totalPayments.toLocaleString()}
                </strong>
              </div>

              <DollarSign size={28} />
            </div>
          </div>

          <div className="students-card">
            <div className="card-header">
              <h3>Fee Structures</h3>
              <p>Configured school fees</p>
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
                  {fees.length > 0 ? (
                    fees.map((fee) => (
                      <tr key={fee.id}>
                        <td>
                          {fee.description || "School Fees"}
                        </td>

                        <td>
                          {fee.class_name ||
                            fee.class?.name ||
                            fee.class_id ||
                            "—"}
                        </td>

                        <td>
                          {fee.academic_year || "—"}
                        </td>

                        <td>
                          <strong>
                            KES{" "}
                            {Number(
                              fee.amount || 0
                            ).toLocaleString()}
                          </strong>
                        </td>
                      </tr>
                    ))
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

          <div className="students-card">
            <div className="card-header">
              <h3>Payments</h3>
              <p>Recent student fee payments</p>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Method</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.length > 0 ? (
                    payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          {payment.student_name ||
                            payment.student?.full_name ||
                            payment.student_id ||
                            "—"}
                        </td>

                        <td>
                          <strong>
                            KES{" "}
                            {Number(
                              payment.amount || 0
                            ).toLocaleString()}
                          </strong>
                        </td>

                        <td>
                          {payment.payment_date ||
                            payment.date ||
                            "—"}
                        </td>

                        <td>
                          {payment.payment_method ||
                            payment.method ||
                            "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">
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
