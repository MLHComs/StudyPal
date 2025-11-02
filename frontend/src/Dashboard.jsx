import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./css/Dashboard.module.css";
import StickyHeader from "./StickyHeader";
import { API_BASE_URL } from "./config";

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
  const [files, setFiles] = useState([]); // <-- NEW

  // const API_BASE = "http://127.0.0.1:8000";

  async function fetchCourses() {
    setState({ loading: true, error: "" });
    try {
      const res = await fetch(`${API_BASE_URL}/courses?user_id=${encodeURIComponent(userId)}`);
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
    setFiles([]);
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

  // ---- File selection (picker + DnD) ----
  const inputRef = useRef(null);

  const onPickFiles = (e) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    setFiles((prev) => dedupeFiles([...prev, ...list]));
    // reset input so the same file can be picked again if needed
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files || []);
    if (!list.length) return;
    setFiles((prev) => dedupeFiles([...prev, ...list]));
    e.currentTarget.classList.remove(styles.dzActive);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles.dzActive);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dzActive);
  };

  function dedupeFiles(arr) {
    const seen = new Set();
    const out = [];
    for (const f of arr) {
      const key = `${f.name}-${f.size}-${f.lastModified}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(f);
      }
    }
    return out;
  }

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ---- Create course via multipart/form-data ----
  async function createCourse(e) {
    e?.preventDefault?.();
    setCreateErr("");

    if (!form.name.trim()) {
      setCreateErr("Course name is required.");
      return;
    }
    if (files.length === 0) {
      // optional rule; remove this if backend allows no files
      setCreateErr("Please add at least one file.");
      return;
    }

    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("course_name", form.name.trim());
      fd.append("user_id", String(userId));
      // If your backend also accepts a text "course_content":
      // if ((form.content ?? "").trim().length) {
      //   fd.append("course_content", form.content.trim());
      // }
      // IMPORTANT: append each file with the SAME key "files"
      for (const f of files) {
        fd.append("files", f, f.name);
      }

      console.log("Printing and testing");
      console.log(fd);
      const res = await fetch(`${API_BASE}/addcourse`, {
        method: "POST",
        body: fd, // do NOT set Content-Type; browser will add boundary
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      await fetchCourses();
      setShowNew(false);
    } catch (err) {
      setCreateErr("Could not create course. Please try again.");
    } finally {
      setCreating(false);
    }
  }


  const openCourse = (course) => {
    const id = course?.course_id ?? course?.id;
    if (!id) return;

    navigate(`/contentspage/${encodeURIComponent(id)}/${encodeURIComponent(userId)}`, {
      state: { courseName: course.course_name }
    });
  };


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
                <h3 className={styles.cardTitle} title={c.course_name}>{c.course_name}</h3>
                <p className={styles.cardMeta}><strong>Content size:</strong> {c.content_len ?? 0} chars</p>
                <div className={styles.cardFooter}>
                  <div className={styles.tagRow}>
                    <span className={styles.tag}>Active</span>
                    <span className={styles.tag}>Study</span>
                  </div>
                  <button
                    className={styles.openBtn}
                    title="Open course"
                     onClick={() => openCourse(c)}
                    //onClick={() => alert(`Open: ${c.course_name}`)}
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
         
              <label className={styles.label} htmlFor="content">Course Name</label>
              <input
                id="name"
                name="name"
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Short description, notes, or paste content…"
                value={form.name}
                onChange={onFormChange}
                // rows={4}
              />

              {/* Drag & drop + multi-file picker */}
              <div
                className={styles.dropZone}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className={styles.fileInputHidden}
                  onChange={onPickFiles}
                />
                <div className={styles.dzIcon} aria-hidden>📄</div>
                <p className={styles.dzTitle}>Drop files here, or click to browse</p>
                <p className={styles.dzHint}>You can add one or many files; they will be uploaded under repeated <code>files</code> keys.</p>
              </div>

              {files.length > 0 && (
                <div className={styles.fileList}>
                  {files.map((f, i) => (
                    <span key={`${f.name}-${i}`} className={styles.fileChip} title={`${f.name} (${f.type || "file"}, ${f.size} bytes)`}>
                      {f.name}
                      <button type="button" className={styles.chipRemove} onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`}>×</button>
                    </span>
                  ))}
                </div>
              )}

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
        onClick={() => navigate(`/chatbot/${userId}`)}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v12c0 1.103.897 2 2 2h3v3a1 1 0 0 0 1.707.707L13.414 18H20a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm0 14h-6.586L9 19.414V16H4V4h16v12Z"/>
        </svg>
        <span className={styles.fabPulse} aria-hidden="true" />
      </button>
    </div>
  );
}
