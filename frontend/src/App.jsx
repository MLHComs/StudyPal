import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';

// import Login from './Login';
import SignupLogin from './SignupLogin';
import Chatbot from './Chatbot';
import Dashboard from './Dashboard';
import ContentsPage from './ContentsPage';
// import Dashboard from './Dashboard';

function App() {

  return (
      <div className="App">
        <Router>
          <br />
          <Routes>
            <Route path="/" element={<SignupLogin />} />
            {/* <Route path="/Dashboard" element={<Dashboard />} /> */}
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/dashboard/:userId" element={<Dashboard />} />
            <Route path="/contentspage/:courseId/:userId" element={<ContentsPage />} />
          </Routes>
        </Router>
      </div>
  );
}

export default App;
