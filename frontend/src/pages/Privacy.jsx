import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import "./Legal.css";

export default function Privacy() {
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
        <p className="legal-eyebrow">YOUR PRIVACY MATTERS</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: October 12, 2026</p>

        <p>
          EduManage is a school management system designed to help authorized
          school personnel organize academic and administrative activities.
          This Privacy Policy explains how information may be handled when
          using the system.
        </p>

        <section>
          <h2>1. Information We Handle</h2>
          <p>
            Depending on the features used, the system may handle information
            such as:
          </p>
          <ul>
            <li>Student names, admission numbers, and class information.</li>
            <li>Teacher names and relevant professional information.</li>
            <li>Attendance records, examination results, and grades.</li>
            <li>Fee structures, payment records, and account balances.</li>
            <li>Account details required for authentication and access control.</li>
          </ul>
        </section>

        <section>
          <h2>2. How Information Is Used</h2>
          <p>
            Information is used to support school administration, maintain
            academic records, manage attendance and examinations, coordinate
            teaching activities, and assist with authorized financial
            administration.
          </p>
        </section>

        <section>
          <h2>3. Access to Information</h2>
          <p>
            Access to school information should be limited to authorized users
            according to their assigned permissions and legitimate school
            responsibilities. Users must not access, copy, or disclose records
            without appropriate authorization.
          </p>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>
            Appropriate technical and organizational safeguards should be used
            to protect information against unauthorized access, alteration,
            disclosure, or loss. Users also have a responsibility to keep
            their credentials secure and sign out when using shared devices.
          </p>
          <p>
            No electronic system can guarantee absolute security. Suspected
            security incidents should be reported to the school administrator
            promptly.
          </p>
        </section>

        <section>
          <h2>5. Data Sharing</h2>
          <p>
            Personal and school information should only be shared with
            authorized individuals or organizations for legitimate purposes
            and in accordance with applicable policies and laws.
          </p>
        </section>

        <section>
          <h2>6. Data Retention and Correction</h2>
          <p>
            School records should be retained only as necessary for legitimate
            educational, administrative, and legal requirements. If a record
            appears incorrect, contact an authorized school administrator to
            request a review or correction.
          </p>
        </section>

        <section>
          <h2>7. Children and Student Information</h2>
          <p>
            Student information must be treated with particular care. Access
            and use should be limited to authorized educational and
            administrative purposes, with appropriate safeguards for minors.
          </p>
        </section>

        <section>
          <h2>8. Your Responsibilities</h2>
          <p>
            Anyone using EduManage must respect the confidentiality of school
            records, use information only for authorized purposes, and report
            suspected unauthorized access or disclosure.
          </p>
        </section>

        <section>
          <h2>9. Policy Updates</h2>
          <p>
            This policy may be updated as the system develops or as applicable
            requirements change. The latest revision date will be displayed on
            this page.
          </p>
        </section>

        <section>
          <h2>10. Contact</h2>
          <p>
            For questions about privacy, personal information, or data
            correction, contact your school administrator.
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
