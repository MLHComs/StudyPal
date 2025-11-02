import React, { useEffect, useState } from "react";
import styles from "./css/StickyHeader.module.css";
import { useNavigate, useParams } from "react-router-dom";

function normalizeUser(json) {
  if (!json) return null;
  let data = json.data ?? json;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { /* noop */ }
  }

  const u = data.user ?? data;
  if (!u) return null;
  return {
    user_id: u.user_id ?? u.id,
    first: u.user_firstname ?? u.first_name ?? u.firstname ?? "",
    last:  u.user_lastname  ?? u.last_name  ?? u.lastname  ?? "",
    email: u.user_email ?? u.email ?? "",
  };
}


export default function CommunityHeader({ userId, onLogout, fetchUrl }) {
  const [user, setUser] = useState(null);
  const [state, setState] = useState({ loading: true, error: "" });
  const navigate = useNavigate();
  const logout = () => navigate("/");

  useEffect(() => {
    let alive = true;
    async function load() {
      setState({ loading: true, error: "" });
      try {
        let res;
        if (fetchUrl) {
          res = await fetch(fetchUrl);
        } else {
          // Attempt REST style first
          res = await fetch(`http://localhost:8000/users/${encodeURIComponent(userId)}`);
          if (!res.ok) {
            // Fallback: query param style
            res = await fetch(`http://localhost:8000/user?user_id=${encodeURIComponent(userId)}`);
          }
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const u = normalizeUser(json);
        if (!u) throw new Error("Bad user payload");
        if (alive) setUser(u);
        if (alive) setState({ loading: false, error: "" });
      } catch (e) {
        if (alive) setState({ loading: false, error: "Failed to load user." });
      }
    }
    load();
    return () => { alive = false; };
  }, [userId, fetchUrl]);

  return (
    <header className={styles.header} role="banner">
      <div className={styles.left}>
        <span className={styles.logoDot} aria-hidden />
        <div className={styles.textBlock}>
          <div className={styles.appName}>Study Buddy</div>
          <div className={styles.welcomeLine}>
            {state.loading && <span className={styles.skeletonName} />}
            {!state.loading && state.error && <span>Welcome</span>}
            {!state.loading && !state.error && (
              <span>
                Welcome, <strong>{user?.first} {user?.last}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.right}>
        
        <button className={styles.logoutBtn} 
            onClick={() =>  navigate(`/dashboard/${userId}`) }
        >
          Dashboard
        </button>

        <button className={styles.logoutBtn} onClick={onLogout}>
          Logout
        </button>

      </div>
    </header>
  );
}
