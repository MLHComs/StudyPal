import React, { useMemo, useState } from "react";
import styles from "./css/SignupLogin.module.css";

export default function SignupLogin() {
  const [flipped, setFlipped] = useState(false);
  const [errors, setErrors] = useState({});

  // Use empty values; show suggestions via placeholders instead of prefilled text
  const [signup, setSignup] = useState({
    user_firstname: "",
    user_lastname: "",
    user_email: "",
    user_university: "",
    user_currentsem: "",
    user_password: "",
    confirm_password: "",
  });

  const [login, setLogin] = useState({ email: "", password: "" });

  const handleFlip = () => setFlipped((p) => !p);

  const handleSignupChange = (e) =>
    setSignup((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleLoginChange = (e) =>
    setLogin((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submitSignup = (e) => {
    e.preventDefault();
    const errs = {};
    if (signup.user_password !== signup.confirm_password) {
      errs.confirm_password = "Passwords don’t match.";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    console.log("SIGNUP PAYLOAD:", signup);
  };

  const submitLogin = (e) => {
    e.preventDefault();
    console.log("LOGIN PAYLOAD:", login);
  };

  const cardClasses = useMemo(
    () => `${styles.card} ${flipped ? styles.flipped : ""}`,
    [flipped]
  );

  return (
    <div className={styles.pageWrapper}>
      {/* Background video */}
      <video autoPlay loop muted className={styles.bgVideo}>
        <source src="/bg.mp4" type="video/mp4" />
      </video>
      <div className={styles.overlay} />

      {/* Two-column layout */}
      <main className={styles.main}>
        {/* Left section */}
        <section className={styles.left}>
          <h1 className={styles.title}>
            Study <span className={styles.highlight}>Smarter</span>.<br />
            Remember <span className={styles.highlight}>More</span>.<br />
            Stress <span className={styles.highlight}>Less</span>.
          </h1>
          <p className={styles.subtitle}>
            Turn your messy notes into clear summaries, flashcards, and quizzes — all personalized for you.
          </p>
        </section>

        {/* Right section */}
        <section className={styles.right}>
          <div className={cardClasses} aria-live="polite">
            {/* FRONT — SIGN UP */}
            <div className={`${styles.face} ${styles.front}`}>
              <h2 className={styles.panelTitle}>Sign Up</h2>

              {/* Social sign-in (redirect flow) */}
              <div className={styles.socialRow}>
                <a
                  href="/auth/google/start"
                  className={`${styles.socialBtn} ${styles.googleLink}`}
                  aria-label="Continue with Google"
                >
                  <img src="/Google.png" alt="" aria-hidden="true" />
                  Continue with Google
                </a>

                <a
                  href="/auth/microsoft/start"
                  className={`${styles.socialBtn} ${styles.microsoft}`}
                  aria-label="Continue with Microsoft"
                >
                  <img src="/Microsoft_logo.svg.png" alt="" aria-hidden="true" />
                  Continue with Microsoft
                </a>
              </div>

              <div className={styles.separator}><span>or</span></div>

              <form onSubmit={submitSignup} noValidate>
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label htmlFor="user_firstname">First name</label>
                    <input
                      id="user_firstname"
                      name="user_firstname"
                      type="text"
                      placeholder="Manasi"
                      value={signup.user_firstname}
                      onChange={handleSignupChange}
                      autoComplete="given-name"
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="user_lastname">Last name</label>
                    <input
                      id="user_lastname"
                      name="user_lastname"
                      type="text"
                      placeholder="Patil"
                      value={signup.user_lastname}
                      onChange={handleSignupChange}
                      autoComplete="family-name"
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="user_email">Email</label>
                  <input
                    id="user_email"
                    name="user_email"
                    type="email"
                    placeholder="you@school.edu"
                    value={signup.user_email}
                    onChange={handleSignupChange}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label htmlFor="user_university">University</label>
                    <input
                      id="user_university"
                      name="user_university"
                      type="text"
                      placeholder="RIT"
                      value={signup.user_university}
                      onChange={handleSignupChange}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="user_currentsem">Current semester</label>
                    <input
                      id="user_currentsem"
                      name="user_currentsem"
                      type="text"
                      placeholder="Spring 2025"
                      value={signup.user_currentsem}
                      onChange={handleSignupChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="user_password">Password</label>
                  <input
                    id="user_password"
                    name="user_password"
                    type="password"
                    placeholder="Create a strong password"
                    value={signup.user_password}
                    onChange={handleSignupChange}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="confirm_password">Confirm password</label>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={signup.confirm_password}
                    onChange={handleSignupChange}
                    aria-invalid={!!errors.confirm_password}
                    autoComplete="new-password"
                    required
                  />
                  {errors.confirm_password && (
                    <small className={styles.errorText}>{errors.confirm_password}</small>
                  )}
                </div>

                <button type="submit" className={styles.submitBtn}>Create account</button>

                <p className={styles.toggleText}>
                  Already have an account? <span onClick={handleFlip}>Log in</span>
                </p>
              </form>
            </div>

            {/* BACK — LOGIN */}
            <div className={`${styles.face} ${styles.back}`}>
              <h2 className={styles.panelTitle}>Welcome Back</h2>

              <div className={styles.socialRow}>
                <a
                  href="/auth/google/start"
                  className={`${styles.socialBtn} ${styles.googleLink}`}
                  aria-label="Continue with Google"
                >
                  <img src="/Google.png" alt="" aria-hidden="true" />
                  Continue with Google
                </a>

                <a
                  href="/auth/microsoft/start"
                  className={`${styles.socialBtn} ${styles.microsoft}`}
                  aria-label="Continue with Microsoft"
                >
                  <img src="/Microsoft_logo.svg.png" alt="" aria-hidden="true" />
                  Continue with Microsoft
                </a>
              </div>

              <div className={styles.separator}><span>or</span></div>

              <form onSubmit={submitLogin}>
                <div className={styles.field}>
                  <label htmlFor="login_email">Email</label>
                  <input
                    id="login_email"
                    name="email"
                    type="email"
                    placeholder="you@school.edu"
                    value={login.email}
                    onChange={handleLoginChange}
                    autoComplete="username"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="login_password">Password</label>
                  <input
                    id="login_password"
                    name="password"
                    type="password"
                    placeholder="Your password"
                    value={login.password}
                    onChange={handleLoginChange}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div className={styles.rowBetween}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" /> Remember me
                  </label>
                  <a className={styles.link} href="/forgot-password">Forgot password?</a>
                </div>

                <button type="submit" className={styles.submitBtn}>Log in</button>

                <p className={styles.toggleText}>
                  New here? <span onClick={handleFlip}>Create an account</span>
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>
      <div className={styles.footerSpacer} aria-hidden="true" />

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>© {new Date().getFullYear()} StudyBuddy</span>
          <nav className={styles.footerNav}>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/help">Help</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
