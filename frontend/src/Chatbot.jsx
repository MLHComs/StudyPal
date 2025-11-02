import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FiPlus } from "react-icons/fi"; 
import styles from "./css/StickyHeader.module.css";

function Chatbot() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const chatEndRef = useRef(null);

   const { userId } = useParams();
   const navigate = useNavigate();

  // Convert chat to Gemini API format
  const toGeminiHistory = () =>
    chat.map((m) => ({
      role: m.role === "You" ? "user" : "model",
      parts: [m.text],
    }));

  // Send chat message
  const handleAsk = async () => {
    const message = input.trim();
    if (!message) return;

    const newChat = [...chat, { role: "You", text: message }];
    setChat(newChat);
    setInput("");
    setLoading(true);

    try {
      // const baseURL = import.meta.env.VITE_API_BASE_URL;
      const res = await axios.post(`http://localhost:8000/chat`, {
        message,
        history: toGeminiHistory(),
      });
      setChat([...newChat, { role: "Bot", text: res.data.answer }]);
    } catch (error) {
      console.error(error);
      setChat([...newChat, { role: "Bot", text: "⚠️ Error getting response" }]);
    } finally {
      setLoading(false);
    }
  };

  // Send on Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  // Scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Handle PDF Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploadMessage("📄 Uploading file...");

    try {
      const res = await axios.post(`http://localhost:8000/upload_pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadMessage(`✅ ${res.data.message}`);
    } catch (err) {
      console.error(err);
      setUploadMessage("⚠️ Failed to upload file.");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(to bottom right, #eef2ff, #e0e7ff)",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky", // stays at top while scrolling
          top: 0,
          background: "linear-gradient(to right, #2563eb, #3b82f6, #60a5fa)",
          padding: "16px 32px",
          color: "white",
          fontWeight: "600",
          fontSize: "1.3rem",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <span>💬 Ask me anything</span>
        <div>
            <button className={styles.logoutBtn} 
                onClick={() =>  navigate(`/dashboard/${userId}`) }
            >
              Dashboard
            </button>
        </div>
      </header>

      {/* Upload Message */}
      {uploadMessage && (
        <div
          style={{
            textAlign: "center",
            padding: "8px",
            backgroundColor: "#f9fafb",
            color: "#374151",
            fontSize: "0.95rem",
          }}
        >
          {uploadMessage}
        </div>
      )}

      {/* Chat Container */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          padding: "20px",
          overflowY: "auto",
        }}
      >
        {/* Chat Window */}
        <div
          style={{
            width: "100%",
            maxWidth: "750px",
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "16px 10px",
            borderRadius: 12,
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "80px", // space for sticky input bar
          }}
        >
          {chat.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "#9ca3af",
                marginTop: "20%",
              }}
            >
              <p>Start chatting with Gemini 🤖</p>
              <p style={{ fontSize: "0.9rem" }}>
                (Upload a PDF to ask questions about it)
              </p>
            </div>
          )}

          {chat.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "You" ? "flex-end" : "flex-start",
                background: m.role === "You" ? "#2563eb" : "#e5e7eb",
                color: m.role === "You" ? "white" : "black",
                padding: "10px 14px",
                borderRadius: 12,
                maxWidth: "85%",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              <strong>{m.role}: </strong> {m.text}
            </div>
          ))}

          {loading && (
            <div
              style={{
                alignSelf: "flex-start",
                fontStyle: "italic",
                color: "#6b7280",
              }}
            >
              Bot is thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Fixed Input Bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "white",
          display: "flex",
          justifyContent: "center",
          padding: "12px 0",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.08)",
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            maxWidth: "750px",
            padding: 12,
            backgroundColor: "white",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* Hidden file input */}
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            style={{ display: "none" }}
            id="fileUpload"
          />

          {/* Upload (+) button */}
          <label
            htmlFor="fileUpload"
            style={{
              backgroundColor: "#f3f4f6",
              borderRadius: "50%",
              width: 38,
              height: 38,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              border: "1px solid #d1d5db",
              transition: "background 0.3s ease",
            }}
            title="Upload PDF"
          >
            <FiPlus size={20} color="#2563eb" />
          </label>

          {/* Input box */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask something..."
            style={{
              flex: 1,
              resize: "none",
              borderRadius: 8,
              border: "1px solid #ddd",
              padding: 12,
              fontSize: 15,
              outline: "none",
              fontFamily: "system-ui, sans-serif",
            }}
          />

          {/* Send button */}
          <button
            onClick={handleAsk}
            disabled={loading}
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "12px 20px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "background 0.3s ease",
            }}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;


