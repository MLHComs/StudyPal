import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import StickyHeader from "./StickyHeader";
// import { useNavigate } from "react-router-dom";
import styles from "./css/Dashboard.module.css";
import quizIcon from '../public/quiz_icon.svg';



import "./App.css";

function ContentsPage() {
  const navigate = useNavigate();
  const logout = () => navigate("/");
  const { courseId, userId } = useParams();             
  const API_BASE = "http://127.0.0.1:8000";

  const [activeSection, setActiveSection] = useState("SUMMARY");
  // const [selectedSummary, setSelectedSummary] = useState(null);
  const [summary, setSummary] = useState({
    length: "short",     
    text: "",
    loading: false,
    error: "",
  });

  const [flippedCards, setFlippedCards] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [quizView, setQuizView] = useState("new");
  const [selectedQuiz, setSelectedQuiz] = useState(null);

const [generating, setGenerating] = useState(false);


const [fc, setFc] = useState({
  items: [],        // [{flashcard_id, card_index, front_text, back_text}, ...]
  loading: false,
  error: "",
  generating: false,
});

// below existing summary/fc state
const [past, setPast] = useState({
  items: [],            // [{quiz_id, quiz_title, created_at, correct_count}]
  loading: false,
  error: ""
});

const [quizDetail, setQuizDetail] = useState({
  data: null,           // {quiz_id, quiz_title, created_at, is_submitted, questions:[...] }
  loading: false,
  error: ""
});


const [newQuiz, setNewQuiz] = useState({
  data: null,      // shape: { quiz_id, quiz_title, created_at, questions:[...] }
  loading: false,
  error: ""
});



const [answers, setAnswers] = useState({});        
const [submitting, setSubmitting] = useState(false);
const [submitError, setSubmitError] = useState("");
const [scoreBanner, setScoreBanner] = useState(""); 


// course header meta
const [courseMeta, setCourseMeta] = useState({
  name: "",
  loading: false,
  error: ""
});


async function fetchCourseMeta() {
  if (!courseId) return;
  setCourseMeta(s => ({ ...s, loading: true, error: "" }));
  try {
    const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(courseId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = parseMaybeJson(json.data) || json.data || {};
    setCourseMeta({ name: data.course_name || "", loading: false, error: "" });
  } catch (e) {
    setCourseMeta({ name: "", loading: false, error: "Could not load course." });
  }
}



function onPickAnswer(qIndex, optionIndex) {
  setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  if (submitError) setSubmitError("");
}


function sanitizeSummary(markdown) {
  return String(markdown || "")
    .replace(/^#{1,6}\s*/gm, "")   
    .replace(/\*\*/g, "")          
    .replace(/^\s*[-*]\s+/gm, "• ")
}

function parseDataArray(maybeString) {
  if (Array.isArray(maybeString)) return maybeString;
  if (typeof maybeString === "string") {
    try { return JSON.parse(maybeString); } catch {}
  }
  return [];
}


function parseMaybeJson(v) {
  if (Array.isArray(v) || (v && typeof v === "object")) return v;
  if (typeof v === "string") { try { return JSON.parse(v); } catch {} }
  return null;
}

function formatNiceDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);

  const day = d.getDate();
  const ord = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const month = d.toLocaleString("en-US", { month: "short" }); 
  const year = d.getFullYear();

  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12; // 0 -> 12

  return `${day}${ord(day)} ${month} ${year}, ${h}:${m} ${ampm}`;
}



  const quizQuestions = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    question: `Question ${i + 1}: What does EMR stand for?`,
    options: [
      "Elastic MapReduce",
      "Elastic Multi Resource",
      "Efficient MapReduce",
      "Elastic Managed Resource",
    ],
  }));

  const pastQuizzes = [
    { id: 1, title: "AWS Basics", date: "Oct 25, 2025", score: "8/10" },
    { id: 2, title: "Machine Learning Intro", date: "Oct 27, 2025", score: "7/10" },
    { id: 3, title: "Networking Fundamentals", date: "Oct 30, 2025", score: "9/10" },
  ];

  const quizResults = {
    1: [
      { q: "What does EMR stand for?", correct: "Elastic MapReduce", chosen: "Elastic MapReduce" },
      { q: "What is Amazon S3 used for?", correct: "Object storage service", chosen: "Object storage service" },
      { q: "What is IAM?", correct: "Identity and Access Management", chosen: "Access Management" },
      { q: "What is EC2?", correct: "Elastic Compute Cloud", chosen: "Elastic Cloud" },
      { q: "What is Lambda?", correct: "Serverless computing", chosen: "Serverless computing" },
      { q: "What is CloudWatch?", correct: "Monitoring AWS resources", chosen: "Logging AWS activity" },
    ],
  };

  // ---------- Handlers ----------
  const handleFlip = (index) =>
    setFlippedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  // const handleSummarySelect = (type) => setSelectedSummary(type);
  const handleSectionChange = (section) => setActiveSection(section);
  const openQuiz = (quiz) => setSelectedQuiz(quiz);
  // const closeModal = () => setSelectedQuiz(null);


  // Calls GET /courses/:courseId/summary?summary_length=<short|medium|long>
  async function fetchSummary(nextLength) {
  if (!courseId) return;
  const length = nextLength || summary.length;

  setSummary((s) => ({ ...s, loading: true, error: "", length, text: "" }));
  try {
    const url = `${API_BASE}/courses/${encodeURIComponent(courseId)}/summary?summary_length=${encodeURIComponent(length)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    let data = json.data ?? {};
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch { /* keep as string */ }
    }
    const raw = (data && (data.summary_content || data.summary || data.content)) || "";
    const cleaned = sanitizeSummary(raw);

    setSummary((s) => ({ ...s, text: cleaned, loading: false }));
  } catch (e) {
    setSummary((s) => ({
      ...s,
      loading: false,
      error: "Could not fetch summary. Please try again.",
    }));
  }
}


async function generateSummary() {
  if (!courseId) return;
  setSummary((s) => ({ ...s, error: "" }));
  setGenerating(true);
  try {
    const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(courseId)}/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary_length: summary.length }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Immediately fetch to display the new content
    await fetchSummary(summary.length);
  } catch (e) {
    setSummary((s) => ({ ...s, error: "Could not generate summary. Please try again." }));
  } finally {
    setGenerating(false);
  }
}


async function fetchFlashcards() {
  if (!courseId) return;
  setFc((s) => ({ ...s, loading: true, error: "" }));
  try {
    const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(courseId)}/flashcards`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const items = parseDataArray(json.data).map((r) => ({
      id: r.flashcard_id ?? `${r.card_index}`,
      index: r.card_index,
      front: r.front_text ?? "",
      back: r.back_text ?? "",
    }));

    setFc({ items, loading: false, error: "", generating: false });
  } catch (e) {
    setFc((s) => ({ ...s, loading: false, error: "Could not fetch flashcards. Please try again." }));
  }
}


async function generateFlashcards() {
  if (!courseId) return;
  setFc((s) => ({ ...s, generating: true, error: "" }));
  try {
    const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(courseId)}/flashcards`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // After generation, fetch the new set
    await fetchFlashcards();
  } catch (e) {
    setFc((s) => ({ ...s, generating: false, error: "Could not generate flashcards. Please try again." }));
  }
}


async function fetchPastQuizzes() {
  if (!courseId) return;
  setPast((s) => ({ ...s, loading: true, error: "" }));
  try {
    const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(courseId)}/quizzes`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const payload = parseMaybeJson(json.data) || {};
    const items = (payload.quizzes || []).map(q => ({
      quiz_id: q.quiz_id,
      quiz_title: q.quiz_title,
      created_at: q.created_at,          
      correct_count: q.correct_count ?? null
    }));
    setPast({ items, loading: false, error: "" });
  } catch (e) {
    setPast((s) => ({ ...s, loading: false, error: "Could not fetch past quizzes." }));
  }
}


async function fetchQuizDetail(quizId) {
  setQuizDetail({ data: null, loading: true, error: "" });
  try {
    const res = await fetch(`${API_BASE}/quizzes/${encodeURIComponent(quizId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = parseMaybeJson(json.data);
    setQuizDetail({ data, loading: false, error: "" });
  } catch (e) {
    setQuizDetail({ data: null, loading: false, error: "Could not load quiz." });
  }
}


function openPastQuiz(quiz) {
  setSelectedQuiz(quiz);          
  fetchQuizDetail(quiz.quiz_id);
}
function closeModal() {
  setSelectedQuiz(null);
  setQuizDetail({ data: null, loading: false, error: "" });
}


// POST /courses/:courseId/quiz  ->  GET /quizzes/:quiz_id
async function createQuizAndLoad() {
  if (!courseId) return;
  setNewQuiz({ data: null, loading: true, error: "" });
  setAnswers({});
  setSubmitError("");
  setScoreBanner("");

  try {
  
    const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(courseId)}/quiz`, {
      method: "POST"
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const created = parseMaybeJson(json.data) || {};

  
    const quizId =
      created.quiz_id ??
      created.id ??
      (created.quiz && created.quiz.quiz_id);

    if (!quizId) throw new Error("quiz_id missing in create response");

 
    const res2 = await fetch(`${API_BASE}/quizzes/${encodeURIComponent(quizId)}`);
    if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
    const json2 = await res2.json();
    const data = parseMaybeJson(json2.data);

    setNewQuiz({ data, loading: false, error: "" });
  } catch (e) {
    setNewQuiz({ data: null, loading: false, error: "Could not generate quiz. Please try again." });
  }
}



async function submitNewQuiz() {
  if (!newQuiz?.data?.quiz_id) return;
  const quizId = newQuiz.data.quiz_id;
  const questions = newQuiz.data.questions || [];

  // Validate: all questions must be answered
  if (Object.keys(answers).length !== questions.length) {
    setSubmitError("Please answer all questions before submitting.");
    return;
  }

  // Build payload [{ quiz_id, question_index: 1-based, student_selected_index }]
  const payload = questions.map((_, idx) => ({
    quiz_id: quizId,
    question_index: idx + 1,
    student_selected_index: answers[idx],
  }));

  setSubmitting(true);
  setSubmitError("");
  try {
    const res = await fetch(`${API_BASE}/quizzes/${encodeURIComponent(quizId)}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const data = parseMaybeJson(json.data) || {};
    const cc = typeof data.correct_count === "number" ? data.correct_count : null;

    setScoreBanner(
      typeof cc === "number" ? `You scored ${cc}/10` : "Submitted! Score recorded."
    );


    // Optional: clear current quiz selections
    setAnswers({});
  } catch (e) {
    setSubmitError("Could not submit quiz. Please try again.");
  } finally {
    setSubmitting(false);
  }
}






useEffect(() => {
  if (activeSection === "SUMMARY") {
    fetchSummary("short"); 
  }

   if (activeSection === "FLASHCARD") {
    fetchFlashcards();
  }

  if (activeSection === "QUIZ" && quizView === "past") {
    fetchPastQuizzes();
  }

// eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeSection, quizView, courseId]);

useEffect(() => {
  fetchCourseMeta();
}, [courseId]);


  return (
    <div className={styles.page}>
      <StickyHeader userId={userId} onLogout={logout} />

      <div
        style={{
          minHeight: "calc(100vh - 80px)",
          background: "linear-gradient(to bottom right,#f9fafb,#e0e7ff)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px",
        }}
      >
        {/* <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: 20 }}>
          📘 Study Content Page
        </h1> */}
     <h1
      className="cursiveTitle"
      style={{ fontSize: "2rem", fontWeight: 700, color: "#1f2937", marginBottom: 20 }}
    >
      📘 {courseMeta.name || "Study Content"}
    </h1>



        {/* --- Section Tabs --- */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
          {["SUMMARY", "FLASHCARD", "QUIZ"].map((section) => (
            <button
              key={section}
              onClick={() => handleSectionChange(section)}
              style={{
                backgroundColor: activeSection === section ? "#2563eb" : "#e5e7eb",
                color: activeSection === section ? "white" : "black",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
                border: "none",
              }}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
        </div>

        {/* ---------- SUMMARY SECTION ---------- */}
        {activeSection === "SUMMARY" && (
          <div
            style={{
              width: "100%",
              maxWidth: "700px",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ marginBottom: "10px" }}>Choose Summary Length:</h2>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
             {["short", "medium", "long"].map((type) => (
               <button
                 key={type}
                 onClick={() => fetchSummary(type)}
                  style={{
                   backgroundColor: summary.length === type ? "#2563eb" : "#f3f4f6",
                   color: summary.length === type ? "white" : "black",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* {selectedSummary && ( */}
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >

                {/* Language + Audio */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      backgroundColor: "white",
                      fontWeight: "500",
                    }}
                  >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Marathi</option>
                  </select>
                  <button
                    style={{
                      backgroundColor: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "18px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                    title="Listen"
                  >
                    🔊
                  </button>
                </div>


                {summary.loading && (
                  <div style={{ color: "#374151" }}>
                    Fetching {summary.length} summary…
                  </div>
                )}

                {!summary.loading && summary.error && (
                  <div style={{ color: "#b91c1c", fontWeight: 600 }}>
                    {summary.error}
                  </div>
                )}

                {!summary.loading && !summary.error && !summary.text && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ color: "#374151" }}>
                      No summary available for <strong>{summary.length}</strong>.
                    </span>
                    <button
                      onClick={generateSummary}
                      disabled={generating}
                      style={{
                        backgroundColor: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 14px",
                        cursor: "pointer",
                        fontWeight: 600,
                        opacity: generating ? 0.8 : 1,
                      }}
                    >
                      {generating ? "Generating…" : "Generate"}
                    </button>
                  </div>
                )}

                {!summary.loading && !summary.error && !!summary.text && (
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                    {summary.text}
                  </div>
                )}



               </div>

              
          </div>
        )}

        {/* ---------- FLASHCARD SECTION ---------- */}
        {activeSection === "FLASHCARD" && (
            <div
              style={{
                width: "100%",
                maxWidth: "900px",
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ margin: 0 }}>🗂️ Flashcards</h2>
                {!!fc.items.length && (
                  <button
                    onClick={generateFlashcards}
                    disabled={fc.generating}
                    style={{
                      backgroundColor: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontWeight: 600,
                      opacity: fc.generating ? 0.85 : 1
                    }}
                    title="Re-generate (will replace existing cards)"
                  >
                    {fc.generating ? "Generating…" : "Regenerate"}
                  </button>
                )}
              </div>

              {fc.loading && <div style={{ color: "#374151" }}>Fetching flashcards…</div>}

              {!fc.loading && fc.error && (
                <div style={{ color: "#b91c1c", fontWeight: 600 }}>{fc.error}</div>
              )}

              {!fc.loading && !fc.error && fc.items.length === 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    padding: 16,
                    borderRadius: 8,
                  }}
                >
                  <span>No flashcards found for this course.</span>
                  <button
                    onClick={generateFlashcards}
                    disabled={fc.generating}
                    style={{
                      backgroundColor: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 14px",
                      cursor: "pointer",
                      fontWeight: 600,
                      opacity: fc.generating ? 0.85 : 1
                    }}
                  >
                    {fc.generating ? "Generating…" : "Generate"}
                  </button>
                </div>
              )}

              {!fc.loading && !fc.error && fc.items.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
                    gap: 20,
                    marginTop: 10,
                  }}
                >
                  {fc.items.map((card, idx) => (
                    <div key={card.id ?? idx} onClick={() => handleFlip(idx)} style={{ perspective: "1000px" }}>
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: 180,
                          textAlign: "center",
                          transition: "transform 0.8s",
                          transformStyle: "preserve-3d",
                          transform: flippedCards[idx] ? "rotateY(180deg)" : "rotateY(0deg)",
                        }}
                      >
                        {/* Front */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            backfaceVisibility: "hidden",
                            backgroundColor: "#2563eb",
                            color: "white",
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 20,
                            fontSize: "1rem",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                          }}
                          title={`Card #${card.index}`}
                        >
                          {card.front}
                        </div>

                        {/* Back */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            backfaceVisibility: "hidden",
                            backgroundColor: "#f3f4f6",
                            color: "#111827",
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 20,
                            fontSize: "1rem",
                            transform: "rotateY(180deg)",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                          }}
                        >
                          {card.back}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}



    

        {/* ---------- QUIZ SECTION ---------- */}
        {activeSection === "QUIZ" && (
          <div
            style={{
              width: "100%",
              maxWidth: "800px",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {/* Quiz Tabs */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "10px",
              }}
            >
              <button
                onClick={() => setQuizView("new")}
                style={{
                  backgroundColor: quizView === "new" ? "#2563eb" : "#f3f4f6",
                  color: quizView === "new" ? "white" : "black",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Take New Quiz
              </button>
              <button
                onClick={() => setQuizView("past")}
                style={{
                  backgroundColor: quizView === "past" ? "#2563eb" : "#f3f4f6",
                  color: quizView === "past" ? "white" : "black",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Past Quizzes
              </button>
            </div>

            {/* New Quiz View */}
            {quizView === "new" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                {/* <h2 style={{ margin: 0 }}> <img src={quizIcon} alt="Quiz Icon" width={25} height={25} /> New Quiz</h2> */}
                {newQuiz.data && (
                  <h2
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      margin: 0
                    }}
                  >
                    <img src={quizIcon} alt="Quiz Icon" width={25} height={25} />
                    New Quiz
                  </h2>
                )}

                <button
                  onClick={createQuizAndLoad}
                  disabled={newQuiz.loading}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "white",
                    padding: "8px 14px",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                    opacity: newQuiz.loading ? 0.85 : 1
                  }}
                >
                  {newQuiz.loading ? "Generating…" : "Generate Quiz"}
                </button>
              </div>

              {newQuiz.error && (
                <div style={{ color: "#b91c1c", fontWeight: 600, marginBottom: 12 }}>{newQuiz.error}</div>
              )}

              {!newQuiz.loading && newQuiz.data && (
                <>
                  <p style={{ color: "#6b7280", marginTop: 2, marginBottom: 4 }}>
                    {newQuiz.data.quiz_title ? newQuiz.data.quiz_title + " · " : ""}
                    {newQuiz.data.created_at ? formatNiceDate(newQuiz.data.created_at) : "—"}
                  </p>

                  {scoreBanner && (
                    <div style={{
                      margin: "6px 0 10px",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#ecfdf5",
                      border: "1px solid #10b981",
                      color: "#065f46",
                      fontWeight: 700
                    }}>
                      {scoreBanner}
                    </div>
                  )}


                  {(newQuiz.data.questions || []).map((q, i) => (
                    <div key={i} style={{ marginBottom: 16, borderBottom: "1px solid #e5e7eb", paddingBottom: 12 }}>
                      <p style={{ fontWeight: 600 }}>
                        Q{i + 1}. {q.question}
                      </p>
                      <ul className="quizOptions">
                        {(q.options || []).map((opt, idx) => (
                          <li key={idx} className="quizOptionItem">
                            <label className="quizOptionLabel">
                              <input
                                type="radio"
                                name={`q-${i}`}
                                value={idx}
                                className="quizOptionRadio"
                                checked={answers[i] === idx}
                                onChange={() => onPickAnswer(i, idx)}
                              />
                              {opt}
                            </label>
                          </li>
                        ))}
                      </ul>
                     
                    </div>
                  ))}

                  {/* (Optional) keep your submit hook here later */}

                  {submitError && (
                    <div style={{
                      marginTop: 6,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#b91c1c",
                      fontWeight: 700
                    }}>
                      {submitError}
                    </div>
                  )}


                  <button
                    onClick={submitNewQuiz}
                    disabled={
                      submitting ||
                      (newQuiz?.data?.questions?.length ?? 0) === 0 ||
                      Object.keys(answers).length !== (newQuiz?.data?.questions?.length ?? 0)
                    }
                    style={{
                      backgroundColor: "#2563eb",
                      color: "white",
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "600",
                      marginTop: "6px",
                      cursor: "pointer",
                      opacity: submitting ? 0.85 : 1
                    }}
                  >
                    {submitting ? "Submitting…" : "Submit Quiz"}
                  </button>

                
                </>
              )}
            </>
          )}


            {/* Past Quizzes */}
            {quizView === "past" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 420, overflowY: "auto" }}>
              {past.loading && <div style={{ color: "#374151" }}>Loading past quizzes…</div>}
              {!past.loading && past.error && <div style={{ color: "#b91c1c", fontWeight: 600 }}>{past.error}</div>}
              {!past.loading && !past.error && past.items.length === 0 && (
                <div style={{ color: "#374151" }}>No submitted quizzes yet.</div>
              )}

              {!past.loading && !past.error && past.items.map((q) => (
                <div key={q.quiz_id}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      backgroundColor: "#f9fafb", padding: 14, borderRadius: 8, border: "1px solid #e5e7eb"
                    }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0" }}>{q.quiz_title}</h3>
                    <p style={{ color: "#6b7280", margin: 0, fontSize: ".9rem" }}>
                      {/* {q.created_at ? new Date(q.created_at).toLocaleString() : "—"} */}
                      {q.created_at ? formatNiceDate(q.created_at) : "—"}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {typeof q.correct_count === "number" && (
                      <span style={{ fontWeight: 600, color: "#2563eb" }}>{q.correct_count}/10</span>
                    )}
                    <button
                      onClick={() => openPastQuiz(q)}
                      style={{ backgroundColor: "#2563eb", color: "white", border: "none",
                              borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}


      
          </div>
        )}

        {/* ---------- MODAL FOR PAST QUIZ ---------- */}
        
        {selectedQuiz && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                width: "90%",
                maxWidth: "700px",
                borderRadius: "12px",
                padding: "25px",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {/* <h2>{selectedQuiz.title} — Results</h2> */}
                <h2 style={{ margin: 0 }}>
                  {'Result - ' + selectedQuiz.correct_count + '/10' || `Quizzz #${selectedQuiz.quiz_title.correct_count}`}
                </h2>
                <button
                  onClick={closeModal}
                  style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
                >
                  ✖
                </button>
              </div>

              {quizDetail.loading && <p style={{ color: "#374151" }}>Loading…</p>}
                    {!quizDetail.loading && quizDetail.error && <p style={{ color: "#b91c1c", fontWeight: 600 }}>{quizDetail.error}</p>}

                    {!quizDetail.loading && quizDetail.data && (
                      <>
                        <p style={{ color: "#6b7280", marginTop: 6 }}>
                          {/* {quizDetail.data.created_at ? new Date(quizDetail.data.created_at).toLocaleString() : "—"} */}
                          {quizDetail.data.created_at ? formatNiceDate(quizDetail.data.created_at) : "—"}
                          {quizDetail.data.is_submitted ? " · Submitted" : ""}
                        </p>
                        {quizDetail.data.questions.map((item, i) => {
                          const isCorrect = item.student_selected_index === item.correct_index;
                          return (
                            <div key={i}
                                style={{
                                  marginBottom: 12, borderRadius: 8, padding: 12,
                                  backgroundColor: isCorrect ? "#ecfdf5" : "#fef2f2",
                                  border: `1px solid ${isCorrect ? "#10b981" : "#ef4444"}`
                                }}>
                              <p style={{ fontWeight: 600 }}>{item.question}</p>
                              <p>⭐ Correct: <strong style={{ color: "#059669" }}>{item.options[item.correct_index]}</strong></p>
                              <p>✏️ Your Answer:{" "}
                                <strong style={{ color: isCorrect ? "#059669" : "#dc2626" }}>
                                  {typeof item.student_selected_index === "number"
                                    ? item.options[item.student_selected_index]
                                    : "—"}
                                </strong>
                              </p>
                            </div>
                          );
                        })}
                      </>
                  )}
              </div>
            </div>
          )}


      </div>
    </div>
  );
}

export default ContentsPage;
