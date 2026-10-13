import { useEffect, useState } from "react";
import {
  CreditCard,
  DollarSign,
  Plus,
  Wallet,
  X,
  Receipt,
  Pencil,
  Settings,
  Save,
} from "lucide-react";
import api from "../services/api";
import "./Finance.css";

const initialPayment = {
  student_id: "",
  fee_structure_id: "",
  amount: "",
  payment_method: "M-Pesa",
  reference_number: "",
  remarks: "",
};

function Finance() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState(initialPayment);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showFeeForm, setShowFeeForm] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [feeForm, setFeeForm] = useState({
    amount: "",
    description: "",
    academic_year: "",
    term: "",
  });
  const [savingFee, setSavingFee] = useState(false);
  const [feeError, setFeeError] = useState("");
  const [configuringFees, setConfiguringFees] = useState(false);
  const [paymentType, setPaymentType] = useState("monthly");

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

      setError("");
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
    if (!student) return "Unknown Student";

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

  const getStudent = (payment) =>
    students.find(
      (student) => Number(student.id) === Number(payment.student_id)
    );

  const getStudentClass = (student) => {
    if (!student) return "—";

    if (student.class_name) return student.class_name;
    if (student.class?.name) return student.class.name;

    const schoolClass = classes.find(
      (item) => Number(item.id) === Number(student.class_id)
    );

    return schoolClass?.name || "—";
  };

  const getStudentStream = (student) => {
    if (!student) return "—";

    if (student.stream_name) return student.stream_name;
    if (student.stream?.name) return student.stream.name;

    const stream = streams.find(
      (item) => Number(item.id) === Number(student.stream_id)
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

  const formatCurrency = (amount) =>
    `KES ${Number(amount || 0).toLocaleString("en-KE")}`;

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const selectedStudent = students.find(
    (student) =>
      Number(student.id) === Number(paymentForm.student_id)
  );

  const availableFeeStructures = selectedStudent
    ? feeStructures.filter(
        (fee) =>
          Number(fee.class_id) === Number(selectedStudent.class_id)
      )
    : feeStructures;

  const getPaymentAmountForType = (fee, type) => {
    if (!fee || type === "custom") return "";

    const amount = Number(fee.amount || 0);

    return type === "monthly"
      ? (amount / 3).toFixed(2)
      : amount.toFixed(2);
  };

  const selectedPaymentFee = feeStructures.find(
    (fee) => Number(fee.id) === Number(paymentForm.fee_structure_id)
  );

  const handlePaymentFieldChange = (event) => {
    const { name, value } = event.target;

    setPaymentError("");
    setSuccessMessage("");

    if (name === "student_id") {
      setPaymentForm((current) => ({
        ...current,
        student_id: value,
        fee_structure_id: "",
        amount: "",
      }));
      return;
    }

    if (name === "fee_structure_id") {
      const fee = feeStructures.find(
        (item) => Number(item.id) === Number(value)
      );

      setPaymentForm((current) => ({
        ...current,
        fee_structure_id: value,
        amount: getPaymentAmountForType(fee, paymentType),
      }));
      return;
    }

    setPaymentForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const closePaymentForm = () => {
    if (savingPayment) return;

    setShowPaymentForm(false);
    setPaymentForm(initialPayment);
    setPaymentError("");
  };

  const getDefaultTermFee = (className) => {
    const name = String(className || "").trim().toUpperCase();

    if (name === "PP1" || name === "PP2") return 12000;

    const gradeMatch = name.match(/^GRADE\s*(\d+)$/);
    if (!gradeMatch) return null;

    const grade = Number(gradeMatch[1]);

    if (grade >= 1 && grade <= 3) return 12000;
    if (grade >= 4 && grade <= 6) return 15000;
    if (grade >= 7 && grade <= 9) return 30000;
    if (grade >= 10 && grade <= 12) return 36000;

    return null;
  };

  const configureDefaultFees = async () => {
    const academicYear = new Date().getFullYear();
    const terms = ["Term 1", "Term 2", "Term 3"];

    const existingKeys = new Set(
      feeStructures.map(
        (fee) => `${fee.class_id}-${fee.academic_year}-${fee.term}`
      )
    );

    const missingFees = [];

    for (const schoolClass of classes) {
      const amount = getDefaultTermFee(schoolClass.name);
      if (!amount) continue;

      for (const term of terms) {
        const key = `${schoolClass.id}-${academicYear}-${term}`;

        if (!existingKeys.has(key)) {
          missingFees.push({
            class_id: schoolClass.id,
            academic_year: academicYear,
            term,
            amount,
            description: `${schoolClass.name} ${term} school fees`,
          });
        }
      }
    }

    if (!missingFees.length) {
      setSuccessMessage(
        `Default fees are already configured for ${academicYear}.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Create ${missingFees.length} missing fee structures for ${academicYear}? ` +
      "Existing fee structures will not be overwritten."
    );

    if (!confirmed) return;

    setConfiguringFees(true);
    setError("");
    setSuccessMessage("");

    try {
      let created = 0;
      const failures = [];

      for (const fee of missingFees) {
        try {
          await api.post("/admin/finance/fee-structures", fee);
          created += 1;
        } catch (err) {
          failures.push(
            `${fee.description}: ${
              err.response?.data?.message || "Could not create fee"
            }`
          );
        }
      }

      await fetchFinanceData();

      if (failures.length) {
        setError(
          `Created ${created} fee structures. ${failures.length} could not be created. ` +
          failures.slice(0, 3).join(" ")
        );
      } else {
        setSuccessMessage(
          `Successfully configured ${created} missing fee structures for ${academicYear}.`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to configure the default fee structures."
      );
    } finally {
      setConfiguringFees(false);
    }
  };

  const openFeeEditor = (fee) => {
    setEditingFee(fee);
    setFeeForm({
      amount: String(fee.amount ?? ""),
      description: fee.description || "",
      academic_year: String(fee.academic_year || ""),
      term: fee.term || "",
    });
    setFeeError("");
    setShowFeeForm(true);
  };

  const saveFeeChanges = async (event) => {
    event.preventDefault();
    setFeeError("");

    const amount = Number(feeForm.amount);
    const academicYear = Number(feeForm.academic_year);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFeeError("Enter a fee greater than zero.");
      return;
    }

    if (!Number.isInteger(academicYear) || academicYear < 2000) {
      setFeeError("Enter a valid academic year.");
      return;
    }

    if (!feeForm.term.trim()) {
      setFeeError("Select a term.");
      return;
    }

    setSavingFee(true);

    try {
      await api.put(
        `/admin/finance/fee-structures/${editingFee.id}`,
        {
          amount,
          description: feeForm.description.trim() || null,
          academic_year: academicYear,
          term: feeForm.term.trim(),
        }
      );

      setShowFeeForm(false);
      setEditingFee(null);
      setSuccessMessage(
        "Fee structure updated. Existing payment records have been preserved."
      );

      await fetchFinanceData();
    } catch (err) {
      setFeeError(
        err.response?.data?.message ||
        "Failed to update the fee structure."
      );
    } finally {
      setSavingFee(false);
    }
  };

  const handleRecordPayment = async (event) => {
    event.preventDefault();

    setPaymentError("");
    setSuccessMessage("");

    if (
      !paymentForm.student_id ||
      !paymentForm.fee_structure_id ||
      !paymentForm.amount ||
      !paymentForm.payment_method
    ) {
      setPaymentError("Please complete all required fields.");
      return;
    }

    const amount = Number(paymentForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Enter a valid amount greater than zero.");
      return;
    }

    setSavingPayment(true);

    try {
      await api.post("/admin/finance/payments", {
        student_id: Number(paymentForm.student_id),
        fee_structure_id: Number(paymentForm.fee_structure_id),
        amount,
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number.trim() || null,
        remarks: paymentForm.remarks.trim() || null,
      });

      setShowPaymentForm(false);
      setPaymentForm(initialPayment);
      setSuccessMessage("Payment recorded successfully.");

      await fetchFinanceData();
    } catch (err) {
      setPaymentError(
        err.response?.data?.message ||
          "Failed to record payment. Please try again."
      );
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div className="page-content finance-page">
      <div className="page-header">
        <div>
          <h2>Finance</h2>
          <p>Manage school fees, payments and financial records.</p>
        </div>

        <div className="finance-header-actions">
          <button
            type="button"
            className="finance-secondary-button"
            onClick={configureDefaultFees}
            disabled={configuringFees || loading}
          >
            <Settings size={17} />
            {configuringFees ? "Configuring Fees..." : "Configure Default Fees"}
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setPaymentError("");
              setSuccessMessage("");
              setPaymentType("monthly");
              setPaymentForm(initialPayment);
              setShowPaymentForm(true);
            }}
          >
            <Plus size={18} />
            Record Payment
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="finance-success-message" role="status">
          {successMessage}
        </div>
      )}

      {loading && (
        <div className="empty-state">
          Loading finance information...
        </div>
      )}

      {error && (
        <div className="error-state">{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="finance-stats-grid">
            <div className="finance-stat-card">
              <div>
                <span>Total Fee Structures</span>
                <strong>{feeStructures.length}</strong>
              </div>
              <div className="finance-stat-icon">
                <Wallet size={24} />
              </div>
            </div>

            <div className="finance-stat-card">
              <div>
                <span>Total Fees</span>
                <strong>{formatCurrency(totalFees)}</strong>
              </div>
              <div className="finance-stat-icon">
                <DollarSign size={24} />
              </div>
            </div>

            <div className="finance-stat-card">
              <div>
                <span>Total Payments</span>
                <strong>{formatCurrency(totalPayments)}</strong>
              </div>
              <div className="finance-stat-icon">
                <CreditCard size={24} />
              </div>
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
                    <th>Term</th>
                    <th>Term Fee</th>
                    <th>Monthly Instalment</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {feeStructures.length > 0 ? (
                    feeStructures.map((fee) => {
                      const schoolClass = classes.find(
                        (item) =>
                          Number(item.id) === Number(fee.class_id)
                      );

                      return (
                        <tr key={fee.id}>
                          <td>{fee.description || "—"}</td>
                          <td>
                            {schoolClass?.name ||
                              fee.class_name ||
                              fee.class_id ||
                              "—"}
                          </td>
                          <td>{fee.academic_year || "—"}</td>
                          <td>{fee.term || "—"}</td>
                          <td>
                            <strong>{formatCurrency(fee.amount)}</strong>
                          </td>
                          <td>
                            {formatCurrency(Number(fee.amount || 0) / 3)}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="finance-edit-button"
                              onClick={() => openFeeEditor(fee)}
                              aria-label={`Edit ${fee.description || "fee structure"}`}
                            >
                              <Pencil size={15} />
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7">
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
                          <td>{getStudentClass(student)}</td>
                          <td>{getStudentStream(student)}</td>
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

      {showPaymentForm && (
        <div
          className="finance-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePaymentForm();
            }
          }}
        >
          <section
            className="finance-payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-payment-title"
          >
            <div className="finance-modal-header">
              <div className="finance-modal-title">
                <div className="finance-modal-icon">
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 id="record-payment-title">Record Payment</h3>
                  <p>Enter the student's fee payment details.</p>
                </div>
              </div>

              <button
                type="button"
                className="finance-modal-close"
                onClick={closePaymentForm}
                disabled={savingPayment}
                aria-label="Close payment form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="finance-form-grid">
                <label className="finance-form-field finance-form-full">
                  Student <span>*</span>
                  <select
                    name="student_id"
                    value={paymentForm.student_id}
                    onChange={handlePaymentFieldChange}
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {getStudentName(student)}
                        {student.admission_number
                          ? ` — ${student.admission_number}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="finance-form-field finance-form-full">
                  Fee Structure <span>*</span>
                  <select
                    name="fee_structure_id"
                    value={paymentForm.fee_structure_id}
                    onChange={handlePaymentFieldChange}
                    required
                    disabled={!paymentForm.student_id}
                  >
                    <option value="">
                      {!paymentForm.student_id
                        ? "Select a student first"
                        : availableFeeStructures.length
                          ? "Select a fee structure"
                          : "No fee structure for this student's class"}
                    </option>
                    {availableFeeStructures.map((fee) => {
                      const schoolClass = classes.find(
                        (item) =>
                          Number(item.id) === Number(fee.class_id)
                      );

                      return (
                        <option key={fee.id} value={fee.id}>
                          {fee.description ||
                            schoolClass?.name ||
                            "School fees"}
                          {" — "}
                          {formatCurrency(fee.amount)}
                          {fee.academic_year
                            ? ` (${fee.academic_year})`
                            : ""}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="finance-form-field">
                  Payment Type <span>*</span>
                  <select
                    value={paymentType}
                    onChange={(event) => {
                      const type = event.target.value;
                      setPaymentType(type);
                      setPaymentError("");

                      setPaymentForm((current) => ({
                        ...current,
                        amount: getPaymentAmountForType(
                          feeStructures.find(
                            (fee) =>
                              Number(fee.id) ===
                              Number(current.fee_structure_id)
                          ),
                          type
                        ),
                      }));
                    }}
                    disabled={!paymentForm.fee_structure_id}
                    required
                  >
                    <option value="monthly">
                      Monthly instalment (one-third of term fee)
                    </option>
                    <option value="term">Full term fee</option>
                    <option value="custom">Custom amount</option>
                  </select>
                </label>

                <label className="finance-form-field">
                  {paymentType === "monthly"
                    ? "Monthly Instalment (KES)"
                    : paymentType === "term"
                      ? "Full Term Fee (KES)"
                      : "Custom Amount (KES)"} <span>*</span>

                  <input
                    type="number"
                    name="amount"
                    value={paymentForm.amount}
                    onChange={handlePaymentFieldChange}
                    placeholder={
                      paymentType === "custom"
                        ? "Enter the actual amount received"
                        : "Select a fee structure first"
                    }
                    min="0.01"
                    step="0.01"
                    readOnly={paymentType !== "custom"}
                    required
                  />

                  {selectedPaymentFee && (
                    <small className="finance-field-hint">
                      Term fee: {formatCurrency(selectedPaymentFee.amount)}
                      {" · "}
                      Monthly suggestion: {
                        formatCurrency(Number(selectedPaymentFee.amount || 0) / 3)
                      }
                      {paymentType === "custom"
                        ? " · Enter the actual amount received."
                        : ""}
                    </small>
                  )}
                </label>

                <label className="finance-form-field">
                  Payment Method <span>*</span>
                  <select
                    name="payment_method"
                    value={paymentForm.payment_method}
                    onChange={handlePaymentFieldChange}
                    required
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="finance-form-field finance-form-full">
                  Reference Number
                  <input
                    type="text"
                    name="reference_number"
                    value={paymentForm.reference_number}
                    onChange={handlePaymentFieldChange}
                    placeholder="M-Pesa transaction code or receipt number"
                  />
                </label>

                <label className="finance-form-field finance-form-full">
                  Remarks
                  <textarea
                    name="remarks"
                    value={paymentForm.remarks}
                    onChange={handlePaymentFieldChange}
                    placeholder="Optional payment notes"
                    rows="3"
                  />
                </label>
              </div>

              {paymentError && (
                <div className="finance-form-error" role="alert">
                  {paymentError}
                </div>
              )}

              <div className="finance-form-actions">
                <button
                  type="button"
                  className="finance-cancel-button"
                  onClick={closePaymentForm}
                  disabled={savingPayment}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingPayment}
                >
                  <CreditCard size={17} />
                  {savingPayment ? "Saving Payment..." : "Save Payment"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showFeeForm && editingFee && (
        <div
          className="finance-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingFee) {
              setShowFeeForm(false);
              setEditingFee(null);
              setFeeError("");
            }
          }}
        >
          <section
            className="finance-payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-fee-title"
          >
            <div className="finance-modal-header">
              <div className="finance-modal-title">
                <div className="finance-modal-icon">
                  <Pencil size={21} />
                </div>
                <div>
                  <h3 id="edit-fee-title">Edit Fee Structure</h3>
                  <p>
                    Update this class fee without changing past payments.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="finance-modal-close"
                onClick={() => {
                  setShowFeeForm(false);
                  setEditingFee(null);
                  setFeeError("");
                }}
                disabled={savingFee}
                aria-label="Close fee editor"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveFeeChanges}>
              <div className="finance-form-grid">
                <label className="finance-form-field">
                  Term Fee (KES) <span>*</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={feeForm.amount}
                    onChange={(event) =>
                      setFeeForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    required
                  />
                  <small className="finance-field-hint">
                    Monthly instalment: {
                      formatCurrency(Number(feeForm.amount || 0) / 3)
                    }
                  </small>
                </label>

                <label className="finance-form-field">
                  Academic Year <span>*</span>
                  <input
                    type="number"
                    min="2000"
                    step="1"
                    value={feeForm.academic_year}
                    onChange={(event) =>
                      setFeeForm((current) => ({
                        ...current,
                        academic_year: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="finance-form-field">
                  Term <span>*</span>
                  <select
                    value={feeForm.term}
                    onChange={(event) =>
                      setFeeForm((current) => ({
                        ...current,
                        term: event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select a term</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </label>

                <label className="finance-form-field finance-form-full">
                  Description
                  <input
                    type="text"
                    value={feeForm.description}
                    onChange={(event) =>
                      setFeeForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="e.g. Grade 7 Term 1 school fees"
                  />
                </label>
              </div>

              {feeError && (
                <div className="finance-form-error" role="alert">
                  {feeError}
                </div>
              )}

              <div className="finance-form-actions">
                <button
                  type="button"
                  className="finance-cancel-button"
                  onClick={() => {
                    setShowFeeForm(false);
                    setEditingFee(null);
                    setFeeError("");
                  }}
                  disabled={savingFee}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingFee}
                >
                  <Save size={17} />
                  {savingFee ? "Saving Changes..." : "Save Fee Changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Finance;
