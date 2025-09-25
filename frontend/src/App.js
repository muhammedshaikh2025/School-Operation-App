import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import FormPage from "./FormPage";
import AdminDashboard from "./AdminDashboard";
import ResetPassword from "./ResetPassword";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState("");

  // ✅ Check localStorage on mount for auto-login
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedEmail = localStorage.getItem("userEmail");
    if (storedRole && storedEmail) {
      setIsLoggedIn(true);
      setRole(storedRole);
    }
  }, []);

  const handleLogin = () => {
    const storedRole = localStorage.getItem("userRole");
    setIsLoggedIn(true);
    setRole(storedRole || "");
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    setRole("");
  };

  return (
    <Routes>
      {/* Default: login */}
      {!isLoggedIn && <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />}

      {/* After login */}
      {isLoggedIn && role === "admin" && (
        <Route path="/" element={<AdminDashboard onLogout={handleLogout} />} />
      )}
      {isLoggedIn && role !== "admin" && (
        <Route path="/" element={<FormPage onLogout={handleLogout} />} />
      )}

      {/* Reset password (public) */}
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;
