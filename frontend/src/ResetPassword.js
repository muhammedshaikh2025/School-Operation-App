import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate(); // 🔹 add this

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("https://school-operation-app.onrender.com/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setMessage(data.message);

    if (data.success) {
      // 🔹 redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
          required
        />
        <button type="submit" style={buttonStyle("green")}>
          Reset Password
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}


 const buttonStyle = (color) => ({
    padding: "6px 10px",
    borderRadius: "4px",
    margin: "0 2px",
    border: "none",
    cursor: "pointer",
    background: color,
    color: "#fff",
  });