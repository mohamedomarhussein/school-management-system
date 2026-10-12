import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import "./Legal.css";

export default function Terms() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link to="/" className="legal-brand">
          <ShieldCheck size={28} />
          <span>EduManage</span>
        </Link>
        <Link to="/" className="legal-home-link">
          <ArrowLeft size={17} />
          Back to Home
        </Link>
      </header>

      <article className="legal-content">
        <p className="legal-eyebrow">LEGAL INFORMATION</p>
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: October 12, 2026</p>

        <p>
          Welcome to EduManage, a school management system designed to support
          the administration and organization of school activities. By accessing
          or using this system, you agree to these Terms of Service.
        </p>

        <section>
          <h2>1. Purpose of the System</h2>
          <p>
            EduManage supports authorized school personnel in managing academic
            records, students, classes, teachers, attendance, examinations,
            timetables, and financial information.
          </p>
        </section>

        <section>
          <h2>2. Authorized Access</h2>
          <p>
            Access is limited to users who have been authorized by the school.
            Users must provide accurate login information and must not attempt
            to access accounts, records, or features beyond their permissions.
          </p>
        </section>

        <section>
          <h2>3. Account Security</h2>
          <p>
            Users are responsible for protecting their login credentials.
            Do not share passwords or leave an authenticated account accessible
            to unauthorized people. Report suspected unauthorized access to the
            school administrator promptly.
          </p>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p>Users must not:</p>
          <ul>
            <li>Access or modify records without authorization.</li>
            <li>Share confidential school information without permission.</li>
            <li>Attempt to disrupt, damage, or bypass system security.</li>
            <li>Enter information they know to be false or misleading.</li>
          </ul>
        </section>

        <section>
          <h2>5. Accuracy of Information</h2>
          <p>
            Authorized users should ensure that information entered into the
            system is accurate and up to date. Any identified errors should be
            reported to an authorized administrator for correction.
          </p>
        </section>

        <section>
          <h2>6. Privacy and Confidentiality</h2>
          <p>
            School records must be handled responsibly and accessed only for
            legitimate school-related purposes. Please read our{" "}
            <Link to="/privacy">Privacy Policy</Link> for information about
            personal data and its handling.
          </p>
        </section>

        <section>
          <h2>7. Availability and Changes</h2>
          <p>
            The system may occasionally be unavailable for maintenance,
            troubleshooting, or updates. Features and procedures may change as
            the system develops.
          </p>
        </section>

        <section>
          <h2>8. Suspension of Access</h2>
          <p>
            The school may restrict or suspend access when necessary to protect
            school records, maintain security, or address misuse, subject to
            applicable policies and laws.
          </p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>
            For questions about these terms or access to the system, contact
            your school administrator.
          </p>
        </section>

        <Link to="/" className="legal-back-button">
          <ArrowLeft size={17} />
          Return to Home
        </Link>
      </article>

      <footer className="legal-footer">
        <p>© {new Date().getFullYear()} EduManage. All rights reserved.</p>
      </footer>
    </main>
  );
}
