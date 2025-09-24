import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import FormPage from "./FormPage";
import AdminDashboard from "./AdminDashboard";
import ResetPassword from "./ResetPassword"; // new component

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState("");

  const handleLogin = () => {
    setIsLoggedIn(true);
    setRole(localStorage.getItem("userRole")); // fetch role from login
  };

  return (
    <Routes>
      {/* Default: login */}
      {!isLoggedIn && <Route path="/" element={<LoginPage onLogin={handleLogin} />} />}

      {/* After login */}
      {isLoggedIn && role === "admin" && <Route path="/" element={<AdminDashboard />} />}
      {isLoggedIn && role !== "admin" && <Route path="/" element={<FormPage />} />}

      {/* Reset password (public) */}
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;
