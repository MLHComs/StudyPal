import { useState } from "react";
import StickyHeader from "./StickyHeader";
import { useNavigate } from "react-router-dom";
import styles from "./css/Dashboard.module.css";
import "./App.css";

function ContentsPage() {
  const navigate = useNavigate();
  const logout = () => navigate("/");

  const [activeSection, setActiveSection] = useState("summary");
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [flippedCards, setFlippedCards] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [quizView, setQuizView] = useState("new");
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // ---------- Dummy Data ----------
  const summaries = {
    short: "Short summary: AWS EMR is a cloud service for big data processing.",
    medium:
      "Medium summary: Amazon EMR simplifies processing large datasets using Hadoop and Spark frameworks on AWS.",
    long: "Long summary: Amazon EMR (Elastic MapReduce) is a managed cluster platform for processing massive datasets using frameworks like Apache Hadoop and Apache Spark.",
  };

  const flashcards = [
    { q: "What does EMR stand for?", a: "Elastic MapReduce" },
    { q: "What is Amazon S3 used for?", a: "Object storage service" },
    { q: "Define EC2.", a: "Elastic Compute Cloud for virtual servers" },
    { q: "Purpose of AWS Lambda?", a: "Serverless computing" },
    { q: "What is VPC?", a: "Virtual Private Cloud" },
    { q: "What is IAM?", a: "Identity and Access Management" },
    { q: "Use of CloudFront?", a: "Content Delivery Network (CDN)" },
    { q: "What is DynamoDB?", a: "NoSQL managed database" },
    { q: "Use of CloudWatch?", a: "Monitoring AWS resources" },
    { q: "Purpose of Route 53?", a: "DNS and domain management" },
  ];

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
  const handleSummarySelect = (type) => setSelectedSummary(type);
  const handleSectionChange = (section) => setActiveSection(section);
  const openQuiz = (quiz) => setSelectedQuiz(quiz);
  const closeModal = () => setSelectedQuiz(null);

  // ---------- UI ----------
  return (
    <div className={styles.page}>
      <StickyHeader userId={1} onLogout={logout} />

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
        <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: 20 }}>
          📘 Study Content Page
        </h1>

        {/* --- Section Tabs --- */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
          {["summary", "flashcard", "quiz"].map((section) => (
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
        {activeSection === "summary" && (
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
                  onClick={() => handleSummarySelect(type)}
                  style={{
                    backgroundColor: selectedSummary === type ? "#2563eb" : "#f3f4f6",
                    color: selectedSummary === type ? "white" : "black",
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

            {selectedSummary && (
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
                <div>{summaries[selectedSummary]}</div>
              </div>
            )}
          </div>
        )}

        {/* ---------- FLASHCARD SECTION ---------- */}
        {activeSection === "flashcard" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
              gap: "20px",
              width: "100%",
              maxWidth: "900px",
              marginTop: "10px",
            }}
          >
            {flashcards.map((card, index) => (
              <div key={index} onClick={() => handleFlip(index)} style={{ perspective: "1000px" }}>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "180px",
                    textAlign: "center",
                    transition: "transform 0.8s",
                    transformStyle: "preserve-3d",
                    transform: flippedCards[index] ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* Front */}
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      backgroundColor: "#2563eb",
                      color: "white",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "20px",
                      fontSize: "1rem",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    }}
                  >
                    {card.q}
                  </div>
                  {/* Back */}
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      backgroundColor: "#f3f4f6",
                      color: "#111827",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "20px",
                      fontSize: "1rem",
                      transform: "rotateY(180deg)",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    }}
                  >
                    {card.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------- QUIZ SECTION ---------- */}
        {activeSection === "quiz" && (
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
                <h2 style={{ marginBottom: "10px" }}>🧠 Quiz (10 Questions)</h2>
                {quizQuestions.map((q) => (
                  <div key={q.id} style={{ marginBottom: "15px", borderBottom: "1px solid #e5e7eb" }}>
                    <p style={{ fontWeight: "600" }}>{q.question}</p>
                    <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                      {q.options.map((opt, idx) => (
                        <li key={idx}>
                          <label>
                            <input type="radio" name={`q${q.id}`} value={opt} style={{ marginRight: "6px" }} />
                            {opt}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <button
                  style={{
                    backgroundColor: "#2563eb",
                    color: "white",
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    marginTop: "10px",
                    cursor: "pointer",
                  }}
                >
                  Submit Quiz
                </button>
              </>
            )}

            {/* Past Quizzes */}
            {quizView === "past" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", maxHeight: "400px", overflowY: "auto" }}>
                {pastQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "#f9fafb",
                      padding: "15px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 4px 0" }}>{quiz.title}</h3>
                      <p style={{ color: "#6b7280", margin: 0, fontSize: "0.9rem" }}>{quiz.date}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                      <span style={{ fontWeight: "600", color: "#2563eb" }}>{quiz.score}</span>
                      <button
                        onClick={() => openQuiz(quiz)}
                        style={{
                          backgroundColor: "#2563eb",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          cursor: "pointer",
                        }}
                      >
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
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>{selectedQuiz.title} — Results</h2>
                <button
                  onClick={closeModal}
                  style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
                >
                  ✖
                </button>
              </div>

              {quizResults[selectedQuiz.id] ? (
                quizResults[selectedQuiz.id].map((item, i) => {
                  const isCorrect = item.chosen === item.correct;
                  return (
                    <div
                      key={i}
                      style={{
                        marginBottom: "15px",
                        borderRadius: "8px",
                        padding: "12px",
                        backgroundColor: isCorrect ? "#ecfdf5" : "#fef2f2",
                        border: `1px solid ${isCorrect ? "#10b981" : "#ef4444"}`,
                      }}
                    >
                      <p style={{ fontWeight: "600" }}>{item.q}</p>
                      <p>
                        ✅ Correct:{" "}
                        <strong style={{ color: "#059669" }}>{item.correct}</strong>
                      </p>
                      <p>
                        🧠 Your Answer:{" "}
                        <strong style={{ color: isCorrect ? "#059669" : "#dc2626" }}>
                          {item.chosen}
                        </strong>
                      </p>
                    </div>
                  );
                })
              ) : (
                <p>No data found for this quiz.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentsPage;
