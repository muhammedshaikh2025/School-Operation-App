import React, { useState } from "react";
import LoginPage from "./LoginPage";
import FormPage from "./FormPage";
import AdminDashboard from "./AdminDashboard";



function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState("");

  const handleLogin = () => {
    setIsLoggedIn(true);
    setRole(localStorage.getItem("userRole")); // fetch role from login
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (role === "admin") {
    return <AdminDashboard />;
  }

  return <FormPage />;
}

export default App;
