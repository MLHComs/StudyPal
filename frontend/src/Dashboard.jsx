import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./css/Dashboard.module.css";
import StickyHeader from "./StickyHeader";

function normalizeCourses(json) {
  if (!json) return [];
  let data = json.data ?? json;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { data = []; }
  }
  return Array.isArray(data) ? data : [];
}

export default function Dashboard() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });

  // New course modal state
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", content: "" });
  const [createErr, setCreateErr] = useState("");

  const API_BASE = "http://127.0.0.1:8000";

  async function fetchCourses() {
    setState({ loading: true, error: "" });
    try {
      const res = await fetch(`${API_BASE}/courses?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setCourses(normalizeCourses(json));
      setState({ loading: false, error: "" });
    } catch (e) {
      setState({ loading: false, error: "Failed to load courses. Please try again." });
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      await fetchCourses();
      if (!alive) return;
    })();
    return () => { alive = false; };
  }, [userId]);

  const headline = useMemo(() => {
    const n = courses.length;
    if (n === 0) return "No courses yet";
    if (n === 1) return "1 course";
    return `${n} courses`;
  }, [courses]);

  const logout = () => navigate("/");

  const openNew = () => {
    setForm({ name: "", content: "" });
    setCreateErr("");
    setShowNew(true);
  };
  const closeNew = () => {
    if (creating) return;
    setShowNew(false);
  };
  const onFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  async function createCourse(e) {
    e?.preventDefault?.();
    setCreateErr("");
    if (!form.name.trim()) {
      setCreateErr("Course name is required.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          course_name: form.name.trim(),
          course_content: form.content ?? "",
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      // Refresh list
      await fetchCourses();
      setShowNew(false);
    } catch (err) {
      setCreateErr("Could not create course. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={styles.page}>
      <StickyHeader userId={userId} onLogout={logout} />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroRow}>
          <div>
            <h1 className={styles.title}>Your Courses</h1>
            <p className={styles.subtitle}>{headline} enrolled for your account.</p>
          </div>
          <button className={styles.addBtn} onClick={openNew} title="Add a new course">
            <span className={styles.addIcon} aria-hidden>＋</span>
            <span>New Course</span>
          </button>
        </div>
      </section>

      <main className={styles.content}>
        {state.loading && (
          <div className={styles.loaderBackdrop} aria-busy="true" aria-label="Loading">
            <div className={styles.loader}>
              <span></span><span></span><span></span><span></span>
            </div>
            <div className={styles.loadingText}>Fetching your courses…</div>
          </div>
        )}

        {!state.loading && state.error && (
          <div className={styles.errorBox}>
            {state.error}
            <button className={styles.retryBtn} onClick={() => fetchCourses()}>
              Retry
            </button>
          </div>
        )}

        {!state.loading && !state.error && courses.length === 0 && (
          <div className={styles.emptyBox}>
            <h3>No courses found</h3>
            <p>When you enroll in a course, it will appear here.</p>
          </div>
        )}

        {!state.loading && !state.error && courses.length > 0 && (
          <div className={styles.grid}>
            {courses.map((c, i) => (
              <article
                key={c.course_id ?? `${c.course_name}-${i}`}
                className={styles.card}
                style={{ animationDelay: `${i * 60}ms` }}
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty("--mouse-x", `${((e.clientX - r.left)/r.width)*100}%`);
                  e.currentTarget.style.setProperty("--mouse-y", `${((e.clientY - r.top)/r.height)*100}%`);
                }}
              >
                <div className={styles.cardGlow} aria-hidden />

                <div className={styles.cardHead}>
                  <span className={styles.pill}>Course</span>
                </div>

                <h3 className={styles.cardTitle} title={c.course_name}>
                  {c.course_name}
                </h3>

                <p className={styles.cardMeta}>
                  <strong>Content size:</strong> {c.content_len ?? 0} chars
                </p>

                <div className={styles.cardFooter}>
                  <div className={styles.tagRow}>
                    <span className={styles.tag}>Active</span>
                    <span className={styles.tag}>Study</span>
                  </div>

                  <button
                    className={styles.openBtn}
                    title="Open course"
                    onClick={() => alert(`Open: ${c.course_name}`)}
                  >
                    Open
                  </button>
                </div>
              </article>
            ))}
         
            
          </div>
        )}
      </main>

      {/* New Course Modal */}
      {showNew && (
        <div className={styles.modalBackdrop} onClick={closeNew}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="newCourseTitle"
          >
            <div className={styles.modalHead}>
              <h3 id="newCourseTitle">Create a new course</h3>
              <button className={styles.closeBtn} onClick={closeNew} aria-label="Close">×</button>
            </div>

            <form className={styles.modalForm} onSubmit={createCourse}>
              <label className={styles.label} htmlFor="name">Course name</label>
              <input
                id="name"
                name="name"
                className={styles.input}
                type="text"
                placeholder="e.g., Software Architecture"
                value={form.name}
                onChange={onFormChange}
                required
              />

              <label className={styles.label} htmlFor="content">Course content (optional)</label>
              <textarea
                id="content"
                name="content"
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Short description, notes, or paste content…"
                value={form.content}
                onChange={onFormChange}
                rows={5}
              />

              {createErr && <div className={styles.error}>{createErr}</div>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryBtn} onClick={closeNew} disabled={creating}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={creating}>
                  {creating ? "Creating…" : "Create course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Floating Chatbot button */}
        <button
        className={styles.fab}
        aria-label="Open Chatbot"
        title="Open Chatbot"
        onClick={() => {
            // Wire this to your route when ready:
            // navigate(`/chatbot?user=${encodeURIComponent(userId)}`);
            navigate("/chatbot");
        }}
        >
        {/* chat bubble svg */}
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
            fill="currentColor"
            d="M20 2H4a2 2 0 0 0-2 2v12c0 1.103.897 2 2 2h3v3a1 1 0 0 0 1.707.707L13.414 18H20a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm0 14h-6.586L9 19.414V16H4V4h16v12Z"
            />
        </svg>
        <span className={styles.fabPulse} aria-hidden="true" />
        </button>



    </div>
  );
}
