import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';

import SignupLogin from './SignupLogin';
import Chatbot from './Chatbot';
import Dashboard from './Dashboard';
import ContentsPage from './ContentsPage';
import CommunityPage from "./CommunityPage";

function App() {

  return (
      <div className="App">
        <Router>
          <br />
          <Routes>
            <Route path="/" element={<SignupLogin />} />
            {/* <Route path="/Dashboard" element={<Dashboard />} /> */}
            <Route path="/chatbot/:userId" element={<Chatbot />} />
            <Route path="/dashboard/:userId" element={<Dashboard />} />
            <Route path="/contentspage/:courseId/:userId" element={<ContentsPage />} />
           
            <Route path="/community/:courseId/:userId" element={<CommunityPage />} />
          </Routes>
        </Router>
      </div>
  );
}

export default App;
