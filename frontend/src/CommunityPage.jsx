import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CommunityHeader from "./CommunityHeader";
import styles from "./css/Dashboard.module.css";


export default function CommunityPage() {
  const { courseId, userId } = useParams();
  const navigate = useNavigate();
  const logout = () => navigate("/");

  const quizzes = [
    { id: 101, title: "AWS IAM Basics", topic: "Cloud Security", date: "2025-11-01", score: 4 },
    { id: 102, title: "VPC & Subnets", topic: "Networking", date: "2025-11-01", score: 7 },
    { id: 103, title: "RDBMS Joins", topic: "Databases", date: "2025-11-02", score: 5 },
    { id: 104, title: "K-Means & PCA", topic: "Machine Learning", date: "2025-11-02", score: 3 },
    { id: 105, title: "OSI vs TCP/IP", topic: "Networking", date: "2025-11-01", score: 6 },
    { id: 106, title: "REST vs gRPC", topic: "APIs", date: "2025-11-02", score: 8 },
    { id: 107, title: "S3 & Glacier", topic: "Cloud Storage", date: "2025-11-01", score: 2 },
    { id: 108, title: "CNN vs RNN", topic: "Machine Learning", date: "2025-11-02", score: 9 },
    { id: 109, title: "ACID & CAP", topic: "Databases", date: "2025-11-01", score: 5 },
    { id: 110, title: "JWT & OAuth2", topic: "Auth", date: "2025-11-02", score: 4 },
  ];

  const mentors = [
    {
      id: "m1",
      name: "Aisha Verma",
      college: "RIT",
      expertise: ["Cloud Security", "Auth", "APIs"],
      points: 1240,
      bio: "Cloud & AppSec TA · loves simplifying IAM.",
      slots: "Today 7-9 PM",
    },
    {
      id: "m2",
      name: "Daniel Kim",
      college: "MIT",
      expertise: ["Machine Learning", "Databases"],
      points: 990,
      bio: "ML study group lead · notebooks & math help.",
      slots: "Tomorrow 5-7 PM",
    },
    {
      id: "m3",
      name: "Priya Nair",
      college: "Stanford",
      expertise: ["Networking", "Cloud Storage"],
      points: 860,
      bio: "VPC/VPN wizard · diagrams for the win.",
      slots: "Sat 2-4 PM",
    },
    {
      id: "m4",
      name: "Leo Garcia",
      college: "UWash",
      expertise: ["Databases", "Auth"],
      points: 670,
      bio: "SQL surgeon · ERDs & query tuning.",
      slots: "Sun 11-1 PM",
    },
  ];


  const resources = [
  { 
    id: "r1", 
    topic: "Cloud Security", 
    title: "AWS IAM Zero-to-Hero", 
    kind: "Guide", 
    href: "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html" 
  },
  { 
    id: "r2", 
    topic: "Networking", 
    title: "VPC Cheatsheet", 
    kind: "Cheatsheet", 
    href: "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html" 
  },
  { 
    id: "r3", 
    topic: "Machine Learning", 
    title: "Clustering vs Dimensionality Reduction", 
    kind: "Article", 
    href: "https://www3.cs.stonybrook.edu/~has/CSE545/Slides-2016/8.11_6.pdf" 
  },
  { 
    id: "r4", 
    topic: "Databases", 
    title: "SQL Join Visualizer", 
    kind: "Tool", 
    href: "https://sql-joins.leopard.in.ua/" 
  },
  { 
    id: "r5", 
    topic: "Auth", 
    title: "JWT vs OAuth2 Primer", 
    kind: "Video", 
    href: "https://www.youtube.com/watch?v=996OiexHze0" 
  },
  { 
    id: "r6", 
    topic: "Cloud Storage", 
    title: "S3 Tiers Demystified", 
    kind: "Guide", 
    href: "https://aws.amazon.com/s3/storage-classes/" 
  },
];


  // const resources = [
  //   { id: "r1", topic: "Cloud Security", title: "AWS IAM Zero-to-Hero", kind: "Guide", href: "#" },
  //   { id: "r2", topic: "Networking", title: "VPC Cheatsheet", kind: "Cheatsheet", href: "#" },
  //   { id: "r3", topic: "Machine Learning", title: "Clustering vs Dimensionality Reduction", kind: "Article", href: "#" },
  //   { id: "r4", topic: "Databases", title: "SQL Join Visualizer", kind: "Tool", href: "#" },
  //   { id: "r5", topic: "Auth", title: "JWT vs OAuth2 Primer", kind: "Video", href: "#" },
  //   { id: "r6", topic: "Cloud Storage", title: "S3 Tiers Demystified", kind: "Guide", href: "#" },
  // ];

  // --- Derivations -----------------------------------------------------------
  const lowScoreQuizzes = useMemo(() => quizzes.filter(q => q.score < 6), [quizzes]);
  const topics = useMemo(() => Array.from(new Set(quizzes.map(q => q.topic))), [quizzes]);

  // --- UI state --------------------------------------------------------------
  const [activeTopic, setActiveTopic] = useState("All");
  const [sortBy, setSortBy] = useState("scoreAsc"); // scoreAsc | scoreDesc | dateDesc
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");

  // Filter/sort list
  const filtered = useMemo(() => {
    let list = lowScoreQuizzes;
    if (activeTopic !== "All") {
      list = list.filter(q => q.topic === activeTopic);
    }
    switch (sortBy) {
      case "scoreDesc":
        list = [...list].sort((a, b) => b.score - a.score);
        break;
      case "dateDesc":
        list = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      default: // scoreAsc
        list = [...list].sort((a, b) => a.score - b.score);
    }
    return list;
  }, [lowScoreQuizzes, activeTopic, sortBy]);

  const mentorSuggestions = useMemo(() => {
    if (!selectedQuiz) return [];
    return mentors
      .filter(m => m.expertise.includes(selectedQuiz.topic))
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);
  }, [selectedQuiz]);

  const topicResources = useMemo(() => {
    if (!selectedQuiz) return [];
    return resources.filter(r => r.topic === selectedQuiz.topic).slice(0, 4);
  }, [selectedQuiz]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2600);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // --- Actions ---------------------------------------------------------------
  function openHelp(quiz) {
    setSelectedQuiz(quiz);
    setSelectedMentor(null);
    setMessage("");
    setDrawerOpen(true);
  }

  function submitHelpRequest() {
    if (!selectedQuiz || !selectedMentor) return;
    // In real app: POST to /community/help-requests
    setDrawerOpen(false);
    setToast(`Help request sent to ${selectedMentor.name} for “${selectedQuiz.title}”.`);
  }

  // --- Render ----------------------------------------------------------------
  return (
    <div style={sx.page}>
      <CommunityHeader userId={userId} onLogout={logout} />
      <header style={sx.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={sx.logo}>🤝</span>
          <div>
            <div style={sx.h1}>Community</div>
            <div style={sx.sub}>Get guidance on tough quizzes, join study groups, and share wins.</div>
          </div>
        </div>

        <div style={sx.headerActions}>
          <div style={sx.filterPill}>
            <label style={sx.label}>Topic</label>
            <select style={sx.select} value={activeTopic} onChange={e => setActiveTopic(e.target.value)}>
              <option>All</option>
              {topics.map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={sx.filterPill}>
            <label style={sx.label}>Sort</label>
            <select style={sx.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="scoreAsc">Lowest score first</option>
              <option value="scoreDesc">Highest score first</option>
              <option value="dateDesc">Newest first</option>
            </select>
          </div>
        </div>
      </header>

      <div style={sx.grid}>
        {/* Left: Quizzes to Review */}
        <section style={sx.card}>
          <div style={sx.cardHead}>
            <h2 style={sx.cardTitle}>Quizzes to Review</h2>
            <span style={sx.cardHint}>Showing scores &lt; 6/10</span>
          </div>

          {filtered.length === 0 ? (
            <div style={sx.emptyBox}>🎉 Nothing here! You're all caught up.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filtered.map(q => (
                <div key={q.id} style={sx.quizRow}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={pillFor(q.topic)}>{q.topic}</span>
                      <strong style={{ fontSize: 16 }}>{q.title}</strong>
                    </div>
                    <div style={sx.dim}>{formatNiceDate(q.date)}</div>
                  </div>

                  <div style={sx.rowRight}>
                    <span style={sx.scoreBadge(q.score)}>{q.score}/10</span>
                    <button style={sx.primaryBtn} onClick={() => openHelp(q)}>
                      Ask for help
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Highlights & Leaderboard */}
        <aside style={{ ...sx.card, minHeight: 320 }}>
          <div style={sx.cardHead}>
            <h2 style={sx.cardTitle}>Community Highlights</h2>
          </div>

          <ul style={sx.bullets}>
            <li>💬 24h Response: most mentors reply within a day.</li>
            <li>🗓️ Study Rooms: Networking · Sat 5PM · Rm 2B (8 joined)</li>
            <li>🏆 Top Helper: Aisha (+120 pts this week)</li>
            <li>📚 New resource packs for Cloud Security & Databases.</li>
          </ul>

          <div style={{ marginTop: 16 }}>
            <h3 style={sx.h3}>Leaderboard</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {mentors
                .slice()
                .sort((a, b) => b.points - a.points)
                .slice(0, 4)
                .map((m, i) => (
                  <div key={m.id} style={sx.leaderRow}>
                    <span style={sx.rank}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{m.name}</div>
                      <div style={sx.dim}>{m.college} · {m.expertise.slice(0,2).join(", ")}</div>
                    </div>
                    <span style={sx.points}>{m.points} pts</span>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Help Drawer */}
      {drawerOpen && (
        <div style={sx.drawerBackdrop}>
          <div style={sx.drawer} role="dialog" aria-modal="true">
            <div style={sx.drawerHeader}>
              <div>
                <div style={sx.h3}>Ask for Help</div>
                {selectedQuiz && (
                  <div style={sx.dim}>
                    For <strong>{selectedQuiz.title}</strong> · <span style={{ fontWeight: 600 }}>{selectedQuiz.topic}</span>
                  </div>
                )}
              </div>
              <button style={sx.iconBtn} onClick={() => setDrawerOpen(false)} title="Close">✖</button>
            </div>

            {/* Suggestions */}
            {selectedQuiz && (
              <div style={{ display: "grid", gap: 10, marginTop: 8, color: "black" }}>
                <div style={sx.groupTitle}>Suggested mentors</div>
                {mentorSuggestions.map(m => (
                  <label key={m.id} style={sx.mentorRow}>
                    <input
                      type="radio"
                      name="mentor"
                      checked={selectedMentor?.id === m.id}
                      onChange={() => setSelectedMentor(m)}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color:"black" }}>{m.name} · <span style={sx.dim}>{m.college}</span></div>
                      <div style={sx.dim}>{m.bio}</div>
                      <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {m.expertise.slice(0,3).map(tag => (
                          <span key={tag} style={sx.tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={sx.points}>{m.points} pts</div>
                      <div style={sx.dim}>{m.slots}</div>
                    </div>
                  </label>
                ))}

                <div style={sx.groupTitle}>Quick resources</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {topicResources.map(r => (
                    <a key={r.id} href={r.href} target="_blank" style={sx.resourceRow}>
                      <span style={sx.resourceKind}>{r.kind}</span>
                      <span style={{ flex: 1 }}>{r.title}</span>
                      <span aria-hidden>↗</span>
                    </a>
                  ))}
                </div>

                <div style={sx.groupTitle}>Your question</div>
                <textarea
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Briefly describe what was confusing, or paste the question you missed."
                  style={sx.textarea}
                />

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button style={sx.ghostBtn} onClick={() => setDrawerOpen(false)}>Cancel</button>
                  <button
                    style={sx.primaryBtn}
                    onClick={submitHelpRequest}
                    disabled={!selectedMentor || message.trim().length === 0}
                  >
                    Send request
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={sx.toast} role="status">{toast}</div>
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

// --- Helpers -----------------------------------------------------------------
function formatNiceDate(iso) {
  const d = new Date(`${iso}T00:00:00`); // Local midnight
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}


// function formatNiceDate(iso) {
//   const d = new Date(iso);
//   const month = d.toLocaleString("en-US", { month: "short" });
//   const day = d.getDate();
//   const year = d.getFullYear();
//   return `${month} ${day}, ${year}`;
// }

function pillFor(topic) {
  const base = {
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.3,
    color: "#0f172a",
    background: "#e2e8f0",
  };
  const map = {
    "Cloud Security": { background: "#DBEAFE", color: "#1E3A8A" },
    "Networking": { background: "#E0E7FF", color: "#3730A3" },
    "Machine Learning": { background: "#DCFCE7", color: "#166534" },
    "Databases": { background: "#FFE4E6", color: "#9F1239" },
    "Auth": { background: "#FDE68A", color: "#7C2D12" },
    "Cloud Storage": { background: "#F5D0FE", color: "#6B21A8" },
  };
  return { ...base, ...(map[topic] || {}) };
}

// --- Styles ------------------------------------------------------------------
const sx = {
  page: {
    minHeight: "100vh",
    // padding: 24,
    // background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
     background:
    "radial-gradient(1100px 700px at 12% 8%, #ffffff 0%, #eef2ff 35%, #e7edff 65%, #dee7ff 100%)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    margin: "0 auto 20px",
    maxWidth: 1100,
  },
  logo: { fontSize: 28, lineHeight: 1 },
  h1: { fontWeight: 800, fontSize: 24, color: "#111827" },
  sub: { color: "#4b5563", marginTop: 4 },
  headerActions: { display: "flex", gap: 12, alignItems: "center" },
  filterPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "white",
    border: "1px solid #e5e7eb",
    padding: "8px 10px",
    borderRadius: 10,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  label: { fontSize: 12, color: "#6b7280", fontWeight: 700 },
  select: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontWeight: 700,
    color: "#111827",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: 16,
    maxWidth: 1100,
    margin: "0 auto",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 10px 24px rgba(2,6,23,0.05)",
  },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" },
  cardHint: { fontSize: 12, color: "#6b7280" },
  emptyBox: {
    padding: 18,
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    color: "#065F46",
    borderRadius: 10,
    fontWeight: 700,
    textAlign: "center",
  },
  quizRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fafafa",
  },
  rowRight: { display: "flex", alignItems: "center", gap: 10 },
  scoreBadge: (score) => ({
    fontWeight: 900,
    fontVariantNumeric: "tabular-nums",
    padding: "6px 10px",
    borderRadius: 10,
    color: score < 6 ? "#991B1B" : "#065F46",
    background: score < 6 ? "#FEE2E2" : "#DCFCE7",
    border: `1px solid ${score < 6 ? "#FCA5A5" : "#BBF7D0"}`,
    minWidth: 64,
    textAlign: "center",
  }),
  primaryBtn: {
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(37,99,235,0.35)",
  },
  ghostBtn: {
    background: "transparent",
    color: "#1f2937",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  h3: { margin: 0, fontWeight: 800, fontSize: 16 },
  bullets: { margin: 0, paddingLeft: 18, color: "#374151" },
  leaderRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: "1px solid #e5e7eb",
    padding: 10,
    borderRadius: 10,
    background: "#fafafa",
  },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 999,
    background: "#E0E7FF",
    color: "#312E81",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
  },
  points: { fontWeight: 900, color: "#111827" },
  dim: { color: "#6b7280" },
  drawerBackdrop: {
    position: "fixed",
    // inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "flex-end",
    top: 0,
    left: 0,
    right: 0,
    // bottom: 0,
    // width: "100%",
    // maxHeight: "100vh",
    zIndex: 5000,
  },
  drawer: {
    width: "50%",
    // minWidth: 900,
    // margin: "0 auto",
    marginLeft: "25%",
    marginTop: "5%",
    // marginBottom : "5%",
    background: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    boxShadow: "0 -12px 24px rgba(0,0,0,0.25)",
    padding: 16,
    minHeight: "100vh",
    overflow: "auto",
    // padding: "50px",
  },
  drawerHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  iconBtn: {
    background: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
  },
  mentorRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#fafafa",
    color: "black"
  },
  tag: {
    background: "#eef2ff",
    color: "#3730a3",
    padding: "4px 8px",
    fontSize: 12,
    borderRadius: 999,
    fontWeight: 800,
  },
  groupTitle: { fontWeight: 900, color: "#111827", marginTop: 12 },
  resourceRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    textDecoration: "none",
    color: "#111827",
    background: "#fff",
  },
  resourceKind: {
    background: "#FDE68A",
    color: "#7C2D12",
    fontWeight: 900,
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
  },
  textarea: {
    width: "100%",
    resize: "vertical",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    padding: 12,
    outline: "none",
    fontSize: 14,
  },
  toast: {
    position: "fixed",
    left: "50%",
    bottom: 20,
    transform: "translateX(-50%)",
    background: "#111827",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 999,
    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
    zIndex: 60,
    fontWeight: 700,
  },
};
