import { useState } from 'react'
import StickyHeader from "./StickyHeader";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./css/Dashboard.module.css";

import './App.css'



function ContentsPage() {
const navigate = useNavigate();
const logout = () => navigate("/");

  return (
        <div className={styles.page}>
          <StickyHeader userId={1} onLogout={logout} />
        </div>
  )
}

export default ContentsPage