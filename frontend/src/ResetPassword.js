import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false); // 🔹 Track success state

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://school-operation-app.onrender.com/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      setMessage(data.message);
      setIsSuccess(data.success); // 🔹 Set success state

      if (data.success) {
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000); // 🔹 Increased to 2 seconds for better user experience
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      setIsSuccess(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={headingStyle}>Reset Password 🔑 </h2>
        <p style={subheadingStyle}>
          Enter your new password below.
        </p>
        <form onSubmit={handleSubmit} style={formStyle}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <button type="submit" style={buttonStyle}>
            Reset Password
          </button>
        </form>
        {message && (
          <div style={messageContainerStyle(isSuccess)}>
            <p style={messageTextStyle(isSuccess)}>
              {isSuccess ? "✅ " : "❌ "}
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Styles ---
const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  fontFamily: "sans-serif",
  background: "#f0f2f5",
};

const cardStyle = {
  maxWidth: "400px",
  width: "100%",
  padding: "40px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
  textAlign: "center",
};

const headingStyle = {
  fontSize: "2rem",
  color: "#333",
  marginBottom: "10px",
};

const subheadingStyle = {
  fontSize: "1rem",
  color: "#666",
  marginBottom: "20px",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontSize: "1rem",
  boxSizing: "border-box", // Prevents padding from adding to width
};

const buttonStyle = {
  padding: "12px",
  border: "none",
  borderRadius: "8px",
  background: "#007bff",
  color: "#fff",
  fontSize: "1rem",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "background 0.3s ease",
};

const messageContainerStyle = (isSuccess) => ({
  marginTop: "20px",
  padding: "12px",
  borderRadius: "8px",
  backgroundColor: isSuccess ? "#e6f7e9" : "#fbebeb",
  border: `1px solid ${isSuccess ? "#63c76a" : "#e05353"}`,
});

const messageTextStyle = (isSuccess) => ({
  margin: 0,
  color: isSuccess ? "#2d6a36" : "#c43c3c",
});