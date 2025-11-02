import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./css/SignupLogin.module.css";

const API_BASE = "http://127.0.0.1:8000";

export default function SignupLogin() {
  const navigate = useNavigate();

  const [flipped, setFlipped] = useState(true);
  const [errors, setErrors] = useState({});

  // signup state
  const [signingUp, setSigningUp] = useState(false);
  const [signupErr, setSignupErr] = useState("");
  const [signupOkMsg, setSignupOkMsg] = useState("");

  // login state
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginErr, setLoginErr] = useState("");

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

  // helper to parse "user_id=2" or {user_id:2}
  function extractUserId(data) {
    if (typeof data === "number") return data;
    if (data && typeof data === "object" && "user_id" in data) return Number(data.user_id);
    if (typeof data === "string") {
      const m = data.match(/user_id\s*=?\s*(\d+)/i);
      if (m) return Number(m[1]);
    }
    return null;
  }

  // ---------------- SIGN UP ----------------
  const submitSignup = async (e) => {
    e.preventDefault();
    setSignupErr("");
    setSignupOkMsg("");

    const errs = {};
    if (signup.user_password !== signup.confirm_password) {
      errs.confirm_password = "Passwords don't match.";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      setSigningUp(true);

      const payload = {
        user_email: signup.user_email.trim(),
        user_password: signup.user_password,
        user_firstname: signup.user_firstname.trim(),
        user_lastname: signup.user_lastname.trim(),
        user_university: signup.user_university.trim(),
        user_currentsem: signup.user_currentsem.trim(),
      };

      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
      const json = await res.json();

      // success UX: flip to login
      setSignupOkMsg("Account created! Please log in.");
      // optionally prefill email on the login side
      setLogin((l) => ({ ...l, email: payload.user_email }));
      setFlipped(true);
    } catch (err) {
      setSignupErr(err?.message?.slice(0, 200) || "Sign up failed. Please try again.");
    } finally {
      setSigningUp(false);
    }
  };

  // ---------------- LOG IN ----------------
  const submitLogin = async (e) => {
    e.preventDefault();
    setLoginErr("");
    try {
      setLoggingIn(true);
      const payload = {
        user_email: login.email.trim(),
        user_password: login.password,
      };

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
      const json = await res.json();

      const uid = extractUserId(json?.data);
      if (!uid) throw new Error("Could not read user_id from response.");

      // store a couple bits if you want
      localStorage.setItem("user_id", String(uid));

      // go to dashboard
      navigate(`/dashboard/${uid}`);
    } catch (err) {
      setLoginErr(err?.message?.slice(0, 200) || "Login failed. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const cardClasses = useMemo(
    () => `${styles.card} ${flipped ? styles.flipped : ""}`,
    [flipped]
  );

  return (
    <div className={styles.pageWrapper}>
      <video autoPlay loop muted className={styles.bgVideo}>
        <source src="/bg.mp4" type="video/mp4" />
      </video>
      <div className={styles.overlay} />

      <main className={styles.main}>
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

        <section className={styles.right}>
          <div className={cardClasses} aria-live="polite">
            {/* FRONT — SIGN UP */}
            <div className={`${styles.face} ${styles.front}`}>
              <h2 className={styles.panelTitle}>Sign Up</h2>

              <div className={styles.socialRow}>
                <a href="/auth/google/start" className={`${styles.socialBtn} ${styles.googleLink}`}>
                  <img src="/Google.png" alt="" aria-hidden="true" />
                  Continue with Google
                </a>
                <a href="/auth/microsoft/start" className={`${styles.socialBtn} ${styles.microsoft}`}>
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

                <button type="submit" className={styles.submitBtn} disabled={signingUp}>
                  {signingUp ? "Creating account…" : "Create account"}
                </button>

                {/* tiny inline status / messages */}
                {signingUp && (
                  <p className={styles.smallStatus}>
                    <span className={styles.tinySpinner} aria-hidden /> Sending your details…
                  </p>
                )}
                {signupErr && <p className={styles.errorText}>{signupErr}</p>}
                {signupOkMsg && <p className={styles.successText}>{signupOkMsg}</p>}

                <p className={styles.toggleText}>
                  Already have an account? <span onClick={handleFlip}>Log in</span>
                </p>
              </form>
            </div>

            {/* BACK — LOGIN */}
            <div className={`${styles.face} ${styles.back}`}>
              <h2 className={styles.panelTitle}>Welcome Back</h2>

              <div className={styles.socialRow}>
                <a href="/auth/google/start" className={`${styles.socialBtn} ${styles.googleLink}`}>
                  <img src="/Google.png" alt="" aria-hidden="true" />
                  Continue with Google
                </a>
                <a href="/auth/microsoft/start" className={`${styles.socialBtn} ${styles.microsoft}`}>
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

                <button type="submit" className={styles.submitBtn} disabled={loggingIn}>
                  {loggingIn ? "Logging in…" : "Log in"}
                </button>

                {/* tiny inline status / error */}
                {loggingIn && (
                  <p className={styles.smallStatus}>
                    <span className={styles.tinySpinner} aria-hidden /> Checking your credentials…
                  </p>
                )}
                {loginErr && <p className={styles.errorText}>{loginErr}</p>}

                <p className={styles.toggleText}>
                  New here? <span onClick={handleFlip}>Create an account</span>
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <div className={styles.footerSpacer} aria-hidden="true" />

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>© {new Date().getFullYear()} StudyPal</span>
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
