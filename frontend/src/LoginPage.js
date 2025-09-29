import React, { useState } from "react";
import axios from "axios";
// Inline SVG icons are used instead of react-icons/fa to resolve compilation error.

// NOTE: In a real environment, replace window.alert with a custom modal for better UX.
const API_BASE = "http://127.0.0.1:5001";

// Inline SVG Components
const SignInIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16" fill="currentColor">
    <path d="M416 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l32 0c17.7 0 32-14.3 32-32l0-224c0-17.7-14.3-32-32-32l-32 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l32 0c53 0 96 43 96 96l0 224c0 53-43 96-96 96l-32 0zm-73.4-96.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L342.7 272 176 272c-17.7 0-32-14.3-32-32s14.3-32 32-32l166.7 0-25.4-25.4c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l64 64c12.5 12.5 12.5 32.8 0 45.3l-64 64z"/>
  </svg>
);

const QuestionIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14" fill="currentColor">
    <path d="M256 0c-141.4 0-256 114.6-256 256s114.6 256 256 256s256-114.6 256-256s-114.6-256-256-256zm0 128c17.7 0 32 14.3 32 32v16c0 17.7-14.3 32-32 32s-32-14.3-32-32v-16c0-17.7 14.3-32 32-32zm0 288c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32zm80-160c-26.5 0-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48s-21.5-48-48-48z"/>
  </svg>
);

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // States for Forgot Password flow
  const [showForgotEmailInput, setShowForgotEmailInput] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");


  // --- Event Handlers ---

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

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotMessage("");

    const userEmail = forgotEmail.trim();

    if (!userEmail) {
      setForgotMessage("Please enter your email address.");
      return;
    }

    if (!userEmail.endsWith("@onmyowntechnology.com")) {
      setForgotMessage("Please use an official @onmyowntechnology.com email.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/reset-password`, { email: userEmail });
      if (res.data.success) {
        setForgotMessage(res.data.message || "Check your email for password reset instructions.");
        // Optional: Hide the input after success
        // setTimeout(() => setShowForgotEmailInput(false), 3000); 
      } else {
        setForgotMessage(res.data.message || "Could not process request. Please check the email.");
      }
    } catch (err) {
      console.error(err);
      setForgotMessage("Error contacting server. Try again later.");
    } finally {
      setLoading(false);
    }
  };


  // --- Reusable Style Objects with hover/focus effects ---

  const PRIMARY_COLOR = "#4F46E5"; // Deep Purple/Blue
  const SECONDARY_COLOR = "#6366F1"; // Lighter Purple/Blue
  const RED_COLOR = "#EF4444"; // Error Red

  const inputStyle = {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    width: '100%',
    boxSizing: 'border-box',
  };

  const inputFocusHoverStyle = {
    borderColor: PRIMARY_COLOR,
    boxShadow: `0 0 0 2px rgba(79, 70, 229, 0.25)`,
    outline: "none",
  };

  const buttonStyle = {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: PRIMARY_COLOR,
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.1s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  };

  const buttonHoverStyle = {
    backgroundColor: SECONDARY_COLOR,
  };

  const linkButtonStyle = {
    background: "none",
    border: "none",
    color: PRIMARY_COLOR,
    cursor: "pointer",
    fontSize: "14px",
    textDecoration: "underline",
    padding: 0,
    transition: "color 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
  };

  const linkButtonHoverStyle = {
    color: "#3730A3",
  };

  // Helper functions for applying styles
  const applyInputHoverFocus = (e) => Object.assign(e.target.style, inputFocusHoverStyle);
  const removeInputHoverFocus = (e) => Object.assign(e.target.style, inputStyle);
  const applyButtonHover = (e) => Object.assign(e.currentTarget.style, buttonHoverStyle);
  const removeButtonHover = (e) => Object.assign(e.currentTarget.style, buttonStyle);
  const applyLinkHover = (e) => Object.assign(e.currentTarget.style, linkButtonHoverStyle);
  const removeLinkHover = (e) => Object.assign(e.currentTarget.style, linkButtonStyle);


  return (
    <div style={styles.container}>
      {/* Company Logo */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <img
          src="/OMOTEC.png"
          alt="Company Logo"
          style={styles.logo}
        />
      </div>

      <h2 style={styles.title}>Welcome Back</h2>

      {/* Login Form */}
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Company Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          onFocus={applyInputHoverFocus}
          onBlur={removeInputHoverFocus}
          onMouseEnter={applyInputHoverFocus}
          onMouseLeave={removeInputHoverFocus}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          onFocus={applyInputHoverFocus}
          onBlur={removeInputHoverFocus}
          onMouseEnter={applyInputHoverFocus}
          onMouseLeave={removeInputHoverFocus}
          required
        />
        {error && <p style={{ ...styles.error, color: RED_COLOR }}>{error}</p>}
        <button
          type="submit"
          style={buttonStyle}
          disabled={loading}
          onMouseEnter={applyButtonHover}
          onMouseLeave={removeButtonHover}
        >
          <SignInIcon style={{ color: 'white' }} /> {/* ICON UPDATED */}
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Forgot password link */}
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <button
          onClick={() => {
            setShowForgotEmailInput(true);
            setError("");
            setForgotMessage("");
          }}
          style={linkButtonStyle}
          onMouseEnter={applyLinkHover}
          onMouseLeave={removeLinkHover}
        >
            <QuestionIcon /> {/* ICON UPDATED */}
            Forgot Password?
        </button>
      </div>

      {/* Forgot Password Input Field (Conditional Display) */}
      {showForgotEmailInput && (
        <div style={styles.forgotBox}>
          <p style={styles.forgotHeader}>Reset Password</p>
          <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="email"
              placeholder="Enter official email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              style={inputStyle}
              onFocus={applyInputHoverFocus}
              onBlur={removeInputHoverFocus}
              required
            />
            <button
              type="submit"
              style={{ ...buttonStyle, backgroundColor: '#F59E0B' }}
              disabled={loading}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#D97706')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#F59E0B')}
            >
              <SignInIcon style={{ color: 'white' }} /> {/* ICON ADDED */}
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          {forgotMessage && (
            <p style={{ marginTop: '10px', fontSize: '14px', color: forgotMessage.includes('Check your email') ? '#10B981' : RED_COLOR }}>
              {forgotMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Main style object
const styles = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "30px",
    borderRadius: "16px", // Increased border radius
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)", // Enhanced shadow
    backgroundColor: "#fff",
    fontFamily: "'Inter', sans-serif",
    border: '1px solid #e5e7eb',
  },
  logo: {
    width: "250px", // Increased logo size
    height: "auto",
    marginBottom: "10px",
  },
  title: {
    textAlign: "center",
    marginBottom: "30px",
    color: "#1F2937",
    fontWeight: 700,
    borderBottom: '2px solid #EEE',
    paddingBottom: '10px',
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  error: {
    fontSize: "14px",
    textAlign: "center",
    margin: "0",
    padding: '5px 0',
  },
  forgotBox: {
    marginTop: '20px',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #e0e7ff',
    backgroundColor: '#f9fafb',
  },
  forgotHeader: {
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#4F46E5',
    fontSize: '16px',
    textAlign: 'center',
  }
};
