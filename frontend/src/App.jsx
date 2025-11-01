import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';

import Login from './Login';
import Chatbot from './Chatbot';
// import Dashboard from './Dashboard';

function App() {

  return (
      <div className="App">
        <Router>
          <br />
          <Routes>
            <Route path="/" element={<Login />} />
            {/* <Route path="/Dashboard" element={<Dashboard />} /> */}
            <Route path="/chatbot" element={<Chatbot />} />
          </Routes>
        </Router>
      </div>
  );
}

export default App;
