import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Mail,
  Menu,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import "./Home.css";

const services = [
  {
    icon: Users,
    title: "Student Management",
    description:
      "Organize student records, admissions, class placement, and essential student information in one place.",
  },
  {
    icon: GraduationCap,
    title: "Teacher Management",
    description:
      "Manage teacher information, subject assignments, and academic responsibilities efficiently.",
  },
  {
    icon: CalendarCheck,
    title: "Attendance Tracking",
    description:
      "Record and review attendance to help your school maintain accurate, accessible attendance records.",
  },
  {
    icon: BookOpen,
    title: "Exams & Results",
    description:
      "Organize examinations, record marks, and review academic performance with clear reporting.",
  },
  {
    icon: Wallet,
    title: "School Finance",
    description:
      "Manage fee structures, record payments, and monitor student fee balances.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Reports & Insights",
    description:
      "Access useful school reports that support better planning and informed administration.",
  },
];

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const closeMenus = () => {
    setMenuOpen(false);
    setLoginOpen(false);
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <nav className="home-nav home-container" aria-label="Main navigation">
          <Link to="/" className="home-brand" onClick={closeMenus}>
            <span className="home-brand-icon">
              <GraduationCap size={27} />
            </span>
            <span className="home-brand-text">
              <strong>EduManage</strong>
              <small>School Management System</small>
            </span>
          </Link>

          <button
            className="home-mobile-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={`home-nav-links ${menuOpen ? "is-open" : ""}`}>
            <a href="#home" onClick={closeMenus}>Home</a>
            <a href="#about" onClick={closeMenus}>About</a>
            <a href="#services" onClick={closeMenus}>Services</a>
            <a href="#developer" onClick={closeMenus}>Contact</a>

            <div className="home-login-dropdown">
              <button
                type="button"
                className="home-login-button"
                aria-expanded={loginOpen}
                onClick={() => setLoginOpen(!loginOpen)}
              >
                Login <ChevronDown size={16} />
              </button>

              {loginOpen && (
                <div className="home-dropdown-menu">
                  <Link to="/login" onClick={closeMenus}>
                    Administration
                  </Link>
                  <span className="home-dropdown-disabled">
                    Teachers <small>Coming soon</small>
                  </span>
                  <span className="home-dropdown-disabled">
                    Parents <small>Coming soon</small>
                  </span>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section className="home-hero" id="home">
          <div className="home-hero-overlay" />
          <div className="home-container home-hero-content">
            <span className="home-eyebrow">
              <span className="home-eyebrow-dot" />
              SMARTER SCHOOL MANAGEMENT
            </span>

            <h1>
              Building a brighter future,
              <span> one student at a time.</span>
            </h1>

            <p>
              Simplify school administration, support teachers, and keep
              essential academic information organized with one modern
              management platform.
            </p>

            <div className="home-hero-actions">
              <Link to="/login" className="home-primary-button">
                Access Administration <ArrowRight size={18} />
              </Link>
              <a href="#about" className="home-secondary-button">
                Discover Our Platform
              </a>
            </div>

            <div className="home-hero-trust">
              <span><CheckCircle2 size={17} /> Organized records</span>
              <span><CheckCircle2 size={17} /> Secure access</span>
              <span><CheckCircle2 size={17} /> Easier administration</span>
            </div>
          </div>
        </section>

        <section className="home-benefits">
          <div className="home-container home-benefits-grid">
            <div className="home-benefit">
              <span className="home-benefit-icon"><Users size={23} /></span>
              <div>
                <h3>Student Records</h3>
                <p>Keep school information organized.</p>
              </div>
            </div>

            <div className="home-benefit">
              <span className="home-benefit-icon"><BookOpen size={23} /></span>
              <div>
                <h3>Academic Planning</h3>
                <p>Manage classes, subjects, and exams.</p>
              </div>
            </div>

            <div className="home-benefit">
              <span className="home-benefit-icon"><ShieldCheck size={23} /></span>
              <div>
                <h3>Controlled Access</h3>
                <p>Protect administration features.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section home-about" id="about">
          <div className="home-container home-about-grid">
            <div className="home-about-image">
              <img
                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1100&q=85"
                alt="Students learning together in a classroom"
                loading="lazy"
              />
              <div className="home-image-caption">
                <GraduationCap size={27} />
                <div>
                  <strong>Education first</strong>
                  <span>Better organization. Better opportunities.</span>
                </div>
              </div>
            </div>

            <div className="home-about-copy">
              <span className="home-section-label">ABOUT OUR PLATFORM</span>
              <h2>Designed to make school administration simpler.</h2>
              <p>
                Running a school involves more than teaching. Student records,
                attendance, examinations, staff responsibilities, and finances
                all need careful coordination.
              </p>
              <p>
                Our School Management System brings these essential activities
                together in a centralized platform, helping administrators
                spend less time managing paperwork and more time supporting
                education.
              </p>

              <ul className="home-check-list">
                <li><CheckCircle2 size={19} /> Centralized academic records</li>
                <li><CheckCircle2 size={19} /> Easier attendance and exam management</li>
                <li><CheckCircle2 size={19} /> Clearer financial record keeping</li>
              </ul>

              <Link to="/login" className="home-text-link">
                Explore administration <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        <section className="home-section home-services" id="services">
          <div className="home-container">
            <div className="home-section-heading">
              <span className="home-section-label">WHAT WE OFFER</span>
              <h2>Everything essential, in one place.</h2>
              <p>
                Purposeful tools to support the daily responsibilities of
                school administration.
              </p>
            </div>

            <div className="home-service-grid">
              {services.map((service) => {
                const Icon = service.icon;

                return (
                  <article className="home-service-card" key={service.title}>
                    <span className="home-service-icon">
                      <Icon size={25} />
                    </span>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <Link to="/login" aria-label={`Access ${service.title}`}>
                      Explore feature <ArrowRight size={16} />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="home-section home-commitment" id="commitment">
          <div className="home-container home-commitment-grid">
            <div>
              <span className="home-section-label">OUR COMMITMENT</span>
              <h2>Technology that supports better education.</h2>
              <p>
                A well-organized school creates more room for learning. Our
                goal is to make everyday administrative work clearer, more
                consistent, and easier to manage.
              </p>
              <Link to="/login" className="home-primary-button">
                Go to Administration <ArrowRight size={18} />
              </Link>
            </div>

            <div className="home-commitment-points">
              <div>
                <ShieldCheck size={24} />
                <section>
                  <h3>Responsible access</h3>
                  <p>Protected administrative pages require authentication.</p>
                </section>
              </div>
              <div>
                <ChartNoAxesCombined size={24} />
                <section>
                  <h3>Clearer information</h3>
                  <p>Keep important school records organized for review.</p>
                </section>
              </div>
              <div>
                <GraduationCap size={24} />
                <section>
                  <h3>Education-focused</h3>
                  <p>Support the people and processes that keep schools running.</p>
                </section>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section home-developer" id="developer">
          <div className="home-container home-developer-card">
            <div className="home-developer-avatar">
              <GraduationCap size={38} />
            </div>
            <div className="home-developer-info">
              <span className="home-section-label">DEVELOPED BY</span>
              <h2>Mohamed Omar Hussein</h2>
              <p>
                Software engineering graduate passionate about building
                practical digital solutions that improve everyday work.
              </p>
              <div className="home-contact-links">
                <a href="tel:+254729667133">
                  <span>Phone</span> +254 729 667 133
                </a>
                <a href="mailto:maslah.husseyn@gmail.com">
                  <Mail size={17} /> maslah.husseyn@gmail.com
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-container home-footer-main">
          <Link to="/" className="home-brand home-footer-brand" onClick={closeMenus}>
            <span className="home-brand-icon">
              <GraduationCap size={26} />
            </span>
            <span className="home-brand-text">
              <strong>EduManage</strong>
              <small>School Management System</small>
            </span>
          </Link>

          <p>
            Helping schools organize information and focus on what matters
            most: education.
          </p>

          <div className="home-footer-links">
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/login">Administration Login</Link>
          </div>
        </div>

        <div className="home-footer-bottom">
          <div className="home-container">
            <span>© {new Date().getFullYear()} EduManage School Management System.</span>
            <span>Designed for better school administration.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
