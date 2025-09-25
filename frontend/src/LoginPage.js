import React, { useState } from "react";
import axios from "axios";

const API_BASE = "https://school-operation-app.onrender.com"; // ✅ base URL backend ka

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
      const res = await axios.post(`${API_BASE}/`, { email, password });

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

  // ✅ Forgot Password flow
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

  return (
    <div className="login-container" style={styles.container}>
      {/* ✅ Company Logo */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <img
          src="/OMOTEC.png"
          alt="Company Logo"
          style={{ width: "200px", height: "60" }}
        />
      </div>

      <h2 style={styles.title}>Login</h2>
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* ✅ Forgot password button */}
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <button onClick={handleForgotPassword} style={styles.linkButton}>
          Forgot Password?
        </button>
      </div>
    </div>
  );
}

// ✅ Styles
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
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#007bff",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background 0.3s",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#007bff",
    cursor: "pointer",
    fontSize: "14px",
    textDecoration: "underline",
  },
  error: {
    color: "red",
    fontSize: "14px",
    textAlign: "center",
  },
};
