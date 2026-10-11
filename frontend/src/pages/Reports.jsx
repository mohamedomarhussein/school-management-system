import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Download,
  GraduationCap,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";
import api from "../services/api";
import "./Reports.css";

const EMPTY_REPORT = {
  students: {
    total: 0,
    by_gender: {},
    by_class: [],
  },
  attendance: {
    total_records: 0,
    by_status: {},
    present_percentage: 0,
  },
  exams: {
    total_exams: 0,
    total_results: 0,
    average_marks: 0,
    grade_distribution: {},
  },
  finance: {
    total_collected: 0,
    configured_fees: 0,
    payment_count: 0,
    fee_structure_count: 0,
  },
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE").format(Number(value) || 0);

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function BarList({ items, emptyMessage = "No data available" }) {
  const entries = Object.entries(items || {});
  const maximum = Math.max(
    1,
    ...entries.map(([, value]) => Number(value) || 0),
  );

  if (!entries.length) {
    return <p className="reports-empty">{emptyMessage}</p>;
  }

  return (
    <div className="reports-bar-list">
      {entries.map(([label, value]) => {
        const amount = Number(value) || 0;
        const percentage = Math.min((amount / maximum) * 100, 100);

        return (
          <div className="reports-bar-item" key={label}>
            <div className="reports-bar-label">
              <span>{label}</span>
              <strong>{formatNumber(amount)}</strong>
            </div>

            <div
              className="reports-bar-track"
              role="progressbar"
              aria-label={label}
              aria-valuenow={amount}
              aria-valuemin={0}
              aria-valuemax={maximum}
            >
              <div
                className="reports-bar-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Reports() {
  const [report, setReport] = useState(EMPTY_REPORT);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [academicYear, setAcademicYear] = useState(
    String(new Date().getFullYear()),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadReports = async (event) => {
    event?.preventDefault();

    if (startDate && endDate && startDate > endDate) {
      setError("The start date cannot be after the end date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = {};

      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (academicYear.trim()) {
        params.academic_year = academicYear.trim();
      }

      const response = await api.get("/admin/reports/overview", {
        params,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load reports.",
        );
      }

      setReport({
        ...EMPTY_REPORT,
        ...response.data,
        students: {
          ...EMPTY_REPORT.students,
          ...response.data.students,
        },
        attendance: {
          ...EMPTY_REPORT.attendance,
          ...response.data.attendance,
        },
        exams: {
          ...EMPTY_REPORT.exams,
          ...response.data.exams,
        },
        finance: {
          ...EMPTY_REPORT.finance,
          ...response.data.finance,
        },
      });

      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load reports. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // Initial report load only. Filters are applied through the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attendanceTotal = Number(
    report.attendance.total_records || 0,
  );

  const attendanceStatusEntries = useMemo(
    () => Object.entries(report.attendance.by_status || {}),
    [report.attendance.by_status],
  );

  const exportCsv = () => {
    const rows = [
      ["School Management System - Reports & Analytics"],
      ["Generated at", new Date().toLocaleString()],
      ["Academic year", academicYear || "All years"],
      ["Start date", startDate || "All dates"],
      ["End date", endDate || "All dates"],
      [],
      ["STUDENT SUMMARY"],
      ["Total students", report.students.total],
      ...Object.entries(report.students.by_gender || {}).map(
        ([gender, total]) => [`Students - ${gender}`, total],
      ),
      [],
      ["STUDENTS BY CLASS"],
      ["Class", "Total students"],
      ...(report.students.by_class || []).map((item) => [
        item.class_name,
        item.total_students,
      ]),
      [],
      ["ATTENDANCE SUMMARY"],
      ["Total attendance records", attendanceTotal],
      ["Present percentage", `${report.attendance.present_percentage}%`],
      ...attendanceStatusEntries.map(([status, total]) => [
        `Attendance - ${status}`,
        total,
      ]),
      [],
      ["EXAM SUMMARY"],
      ["Total exams", report.exams.total_exams],
      ["Results recorded", report.exams.total_results],
      ["Average marks", report.exams.average_marks],
      ...Object.entries(report.exams.grade_distribution || {}).map(
        ([grade, total]) => [`Grade ${grade}`, total],
      ),
      [],
      ["FINANCIAL SUMMARY"],
      ["Payments received", report.finance.payment_count],
      ["Total collected (KES)", report.finance.total_collected],
      ["Configured fees (KES)", report.finance.configured_fees],
      ["Fee structures", report.finance.fee_structure_count],
    ];

    const escapeCell = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = rows
      .map((row) => row.map(escapeCell).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "school-reports.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div>
          <span className="reports-eyebrow">SCHOOL OVERVIEW</span>
          <h1>Reports &amp; Analytics</h1>
          <p>
            Monitor enrollment, attendance, academic performance, and
            school finances from one place.
          </p>
        </div>

        <button
          type="button"
          className="reports-export-button"
          onClick={exportCsv}
          disabled={loading || Boolean(error)}
        >
          <Download size={17} />
          Export CSV
        </button>
      </header>

      <form className="reports-filters" onSubmit={loadReports}>
        <div className="reports-filter-heading">
          <CalendarDays size={19} />
          <div>
            <h2>Report filters</h2>
            <p>Choose a period and academic year.</p>
          </div>
        </div>

        <label className="reports-filter-field">
          <span>Start date</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>

        <label className="reports-filter-field">
          <span>End date</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>

        <label className="reports-filter-field">
          <span>Academic year</span>
          <input
            type="number"
            min="2000"
            max="2100"
            placeholder="All years"
            value={academicYear}
            onChange={(event) => setAcademicYear(event.target.value)}
          />
        </label>

        <button
          type="submit"
          className="reports-apply-button"
          disabled={loading}
        >
          {loading ? (
            <RefreshCw size={17} className="reports-spin" />
          ) : (
            <Activity size={17} />
          )}
          {loading ? "Loading..." : "Apply filters"}
        </button>
      </form>

      {error && (
        <div className="reports-error" role="alert">
          <AlertCircle size={20} />
          <div>
            <strong>Unable to load reports</strong>
            <p>{error}</p>
          </div>
          <button type="button" onClick={() => loadReports()}>
            Try again
          </button>
        </div>
      )}

      {lastUpdated && !error && (
        <p className="reports-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <span className="reports-section-kicker">AT A GLANCE</span>
            <h2>School performance overview</h2>
          </div>
        </div>

        <div className="reports-stat-grid">
          <article className="reports-stat-card">
            <div className="reports-stat-top">
              <span>Total students</span>
              <div className="reports-stat-icon students">
                <Users size={21} />
              </div>
            </div>
            <strong className="reports-stat-value">
              {formatNumber(report.students.total)}
            </strong>
            <span className="reports-stat-note">
              Students registered in the system
            </span>
          </article>

          <article className="reports-stat-card">
            <div className="reports-stat-top">
              <span>Attendance</span>
              <div className="reports-stat-icon attendance">
                <CalendarCheck size={21} />
              </div>
            </div>
            <strong className="reports-stat-value">
              {Number(report.attendance.present_percentage || 0).toFixed(1)}%
            </strong>
            <span className="reports-stat-note">
              Present records out of {formatNumber(attendanceTotal)} records
            </span>
          </article>

          <article className="reports-stat-card">
            <div className="reports-stat-top">
              <span>Average marks</span>
              <div className="reports-stat-icon exams">
                <GraduationCap size={21} />
              </div>
            </div>
            <strong className="reports-stat-value">
              {Number(report.exams.average_marks || 0).toFixed(1)}%
            </strong>
            <span className="reports-stat-note">
              Across {formatNumber(report.exams.total_results)} recorded results
            </span>
          </article>

          <article className="reports-stat-card">
            <div className="reports-stat-top">
              <span>Fees collected</span>
              <div className="reports-stat-icon finance">
                <Wallet size={21} />
              </div>
            </div>
            <strong className="reports-stat-value reports-currency-value">
              {formatCurrency(report.finance.total_collected)}
            </strong>
            <span className="reports-stat-note">
              {formatNumber(report.finance.payment_count)} recorded payments
            </span>
          </article>
        </div>
      </section>

      <section className="reports-chart-grid">
        <article className="reports-panel">
          <div className="reports-panel-heading">
            <div className="reports-panel-icon">
              <Users size={20} />
            </div>
            <div>
              <h2>Students by class</h2>
              <p>Enrollment across school classes</p>
            </div>
          </div>

          {(report.students.by_class || []).length ? (
            <div className="reports-class-list">
              {report.students.by_class.map((item) => {
                const maximum = Math.max(
                  1,
                  ...report.students.by_class.map(
                    (entry) => Number(entry.total_students) || 0,
                  ),
                );
                const total = Number(item.total_students) || 0;

                return (
                  <div className="reports-class-item" key={item.class_id}>
                    <div className="reports-class-label">
                      <span>{item.class_name}</span>
                      <strong>{formatNumber(total)}</strong>
                    </div>
                    <div className="reports-bar-track">
                      <div
                        className="reports-bar-fill reports-class-fill"
                        style={{ width: `${(total / maximum) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="reports-empty">
              No class enrollment data is available yet.
            </p>
          )}
        </article>

        <article className="reports-panel">
          <div className="reports-panel-heading">
            <div className="reports-panel-icon attendance-panel-icon">
              <CalendarCheck size={20} />
            </div>
            <div>
              <h2>Attendance breakdown</h2>
              <p>Recorded attendance by status</p>
            </div>
          </div>

          <div className="reports-panel-summary">
            <strong>
              {Number(report.attendance.present_percentage || 0).toFixed(1)}%
            </strong>
            <span>Present rate</span>
          </div>

          <BarList
            items={report.attendance.by_status}
            emptyMessage="No attendance records match these filters."
          />
        </article>

        <article className="reports-panel">
          <div className="reports-panel-heading">
            <div className="reports-panel-icon exams-panel-icon">
              <BookOpen size={20} />
            </div>
            <div>
              <h2>Exam performance</h2>
              <p>Grade distribution from recorded results</p>
            </div>
          </div>

          <div className="reports-exam-summary">
            <div>
              <span>Exams</span>
              <strong>{formatNumber(report.exams.total_exams)}</strong>
            </div>
            <div>
              <span>Results</span>
              <strong>{formatNumber(report.exams.total_results)}</strong>
            </div>
            <div>
              <span>Average</span>
              <strong>
                {Number(report.exams.average_marks || 0).toFixed(1)}%
              </strong>
            </div>
          </div>

          <h3 className="reports-subheading">Grade distribution</h3>
          <BarList
            items={report.exams.grade_distribution}
            emptyMessage="No exam results are available for this year."
          />
        </article>

        <article className="reports-panel">
          <div className="reports-panel-heading">
            <div className="reports-panel-icon finance-panel-icon">
              <Wallet size={20} />
            </div>
            <div>
              <h2>Financial overview</h2>
              <p>Payments received and configured fees</p>
            </div>
          </div>

          <div className="reports-finance-row">
            <span>Total collected</span>
            <strong>
              {formatCurrency(report.finance.total_collected)}
            </strong>
          </div>

          <div className="reports-finance-row">
            <span>Configured fees</span>
            <strong>
              {formatCurrency(report.finance.configured_fees)}
            </strong>
          </div>

          <div className="reports-finance-row">
            <span>Payments recorded</span>
            <strong>{formatNumber(report.finance.payment_count)}</strong>
          </div>

          <div className="reports-finance-row">
            <span>Fee structures</span>
            <strong>{formatNumber(report.finance.fee_structure_count)}</strong>
          </div>

          <p className="reports-finance-note">
            Configured fees represent the sum of fee structure amounts, not
            the total outstanding balance of individual students.
          </p>
        </article>
      </section>

      <section className="reports-panel reports-gender-panel">
        <div className="reports-panel-heading">
          <div className="reports-panel-icon">
            <GraduationCap size={20} />
          </div>
          <div>
            <h2>Student demographics</h2>
            <p>Registered students grouped by gender</p>
          </div>
        </div>

        <BarList
          items={report.students.by_gender}
          emptyMessage="No student records are available."
        />
      </section>

      {loading && (
        <div className="reports-loading-overlay" aria-live="polite">
          <RefreshCw size={18} className="reports-spin" />
          Refreshing report data...
        </div>
      )}
    </div>
  );
}

export default Reports;
