import React, { useState } from "react";
import axios from "axios";

const API_BASE = "https://school-operation-app.vercel.app";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/login`, { email, password });

      if (res.data.success) {
        localStorage.setItem("userRole", res.data.role);
        localStorage.setItem("userEmail", res.data.email);
        onLogin();
      } else {
        setError("Invalid email or password");
      }
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password flow
  const handleForgotPassword = async () => {
    const userEmail =
      email || window.prompt("Enter your company email (example@onmyowntechnology.com)");

    if (!userEmail) return;

    if (!userEmail.endsWith("@onmyowntechnology.com")) {
      return alert("Please enter a @onmyowntechnology.com email");
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/forgot-password`, { email: userEmail });
      if (res.data.success) {
        alert(res.data.message || "Check your email for instructions");
      } else {
        alert(res.data.message || "Could not process request");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting server. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Reusable styles with hover effects
  const buttonStyle = {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#007bff",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  };

  const loginButtonHoverStyle = {
    backgroundColor: "#0056b3",
  };

  const linkButtonStyle = {
    background: "none",
    border: "none",
    color: "#007bff",
    cursor: "pointer",
    fontSize: "14px",
    textDecoration: "underline",
    transition: "color 0.3s ease",
  };

  const linkButtonHoverStyle = {
    color: "#004085",
  };

  const inputStyle = {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  };

  const inputFocusStyle = {
    borderColor: "#007bff",
    boxShadow: "0 0 0 2px rgba(0, 123, 255, 0.25)",
    outline: "none",
  };

  return (
    <div className="login-container" style={styles.container}>
      {/* Company Logo */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <img
          src="/OMOTEC.png"
          alt="Company Logo"
          style={styles.logo}
        />
      </div>

      <h2 style={styles.title}>Login</h2>
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={(e) => Object.assign(e.target.style, inputStyle)}
          onMouseEnter={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onMouseLeave={(e) => Object.assign(e.target.style, inputStyle)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={(e) => Object.assign(e.target.style, inputStyle)}
          onMouseEnter={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onMouseLeave={(e) => Object.assign(e.target.style, inputStyle)}
          required
        />
        {error && <p style={styles.error}>{error}</p>}
        <button
          type="submit"
          style={buttonStyle}
          disabled={loading}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, loginButtonHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyle)}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Forgot password button */}
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <button
          onClick={handleForgotPassword}
          style={linkButtonStyle}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, linkButtonHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, linkButtonStyle)}
        >
          Forgot Password?
        </button>
      </div>
    </div>
  );
}

// Main style object
const styles = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  logo: {
    width: "200px",
    height: "auto",
    marginBottom: "10px",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  error: {
    color: "red",
    fontSize: "14px",
    textAlign: "center",
    margin: "0",
  },
};