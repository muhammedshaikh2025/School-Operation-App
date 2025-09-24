import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "https://school-operation-app.onrender.com";

export default function FormPage() {
  const [schools, setSchools] = useState([]);
  const [locations, setLocations] = useState([]);
  const [school, setSchool] = useState("");
  const [location, setLocation] = useState("");
  const [grade, setGrade] = useState("");
  const [term, setTerm] = useState("");
  const [workbook, setWorkbook] = useState("");
  const [workbookOptions, setWorkbookOptions] = useState([]); // ✅ dropdown list
  const [reportingBranch, setReportingBranch] = useState("");
  const [count, setCount] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState([]); // new state

  useEffect(() => {
    axios.get(`${API_BASE}/grades`)
      .then(res => setGrades(res.data || []))
      .catch(() => setGrades([]));
  }, []);

  const handleGradeChange = (g) => {
    setGrade(g);
    setWorkbook("");
    setWorkbookOptions([]);
    fetchWorkbookOptions(g);
  };

  const fetchWorkbookOptions = async (g) => {
    if (!g) return;
    try {
      const res = await axios.get(`${API_BASE}/workbook_name`, {
        params: { grade: g },
      });
      setWorkbookOptions(res.data.workbooks || []);
    } catch {
      setWorkbookOptions([]);
    }
  };
  // ✅ User info
  const [userName, setUserName] = useState("User"); // default
  const userEmail = localStorage.getItem("userEmail") || "";


  useEffect(() => {
    if (userEmail) {
      axios
        .get(`${API_BASE}/user-info`, { params: { email: userEmail } })
        .then((res) => {
          if (res.data.success) setUserName(res.data.name);
        })
        .catch(() => setUserName("User"));
    }
  }, [userEmail]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/schools`)
      .then((res) => setSchools(res.data))
      .catch(() => setSchools([]));
  }, []);

  const fetchLocations = async (s) => {
    try {
      const res = await axios.get(`${API_BASE}/locations`, {
        params: { school: s },
      });
      setLocations(res.data || []);
      if (res.data?.length === 1) {
        const onlyLoc = res.data[0];
        setLocation(onlyLoc);
        fetchReportingBranch(s, onlyLoc);
      }
    } catch {
      setLocations([]);
    }
  };

  const fetchReportingBranch = async (s, loc) => {
    try {
      const res = await axios.get(`${API_BASE}/reporting_branch`, {
        params: { school: s, location: loc },
      });
      setReportingBranch(res.data.reporting_branch || "");
    } catch {
      setReportingBranch("");
    }
  };

  

  const handleSchoolChange = (s) => {
    setSchool(s);
    setLocation("");
    setReportingBranch("");
    setWorkbook("");
    setWorkbookOptions([]);
    fetchLocations(s);
  };

  const handleLocationChange = (loc) => {
    setLocation(loc);
    setWorkbook("");
    setWorkbookOptions([]);
    if (school) fetchReportingBranch(school, loc);
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!school) return alert("School must be filled!");
    if (!location) return alert("Location must be filled!");
    if (!grade) return alert("Grade must be filled!");
    if (!term) return alert("Term must be filled!");
    if (!workbook) return alert("Workbook must be selected!");
    if (!count) return alert("Count must be filled!");
    if (!remark) return alert("Remark must be filled!");

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/submit`, {
        school,
        location,
        grade,
        term,
        workbook,
        count,
        remark,
        submitted_by: userEmail,
      });
      window.alert("Submitted successfully!");
      setSchool("");
      setLocation("");
      setGrade("");
      setTerm("");
      setWorkbook("");
      setWorkbookOptions([]);
      setReportingBranch("");
      setCount("");
      setRemark("");
    } catch {
      window.alert("Error submitting");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div style={styles.container}>
      {/* Header with logo + greeting + logout */}
      <div style={styles.header}>
        <img
          src="/OMOTEC.png"
          alt="Company Logo"
          style={styles.logo}
        />
        
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>
      <h1 style={styles.greeting}>Welcome {userName}</h1>

      <h2 style={styles.title}>Workbook Entry</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>School</label>
          <select
            value={school}
            onChange={(e) => handleSchoolChange(e.target.value)}
            style={styles.select}
          >
            <option value="">Select School</option>
            {schools.map((s, i) => (
              <option key={i} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Location</label>
          {locations.length > 1 ? (
            <select
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              style={styles.select}
            >
              <option value="">Select Location</option>
              {locations.map((l, i) => (
                <option key={i} value={l}>
                  {l}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              placeholder="Location"
              readOnly={locations.length === 1}
              style={styles.input}
            />
          )}
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Grade</label>
            <select
              value={grade}
              onChange={(e) => handleGradeChange(e.target.value)}
              style={styles.select}
            >
              <option value="">Select Grade</option>
              {grades.map((g, i) => (
                <option key={i} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>


          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              style={styles.select}
            >
              <option value="">Select Term</option>
              {[1, 2, 3].map((t) => (
                <option key={t} value={t}>
                  Term {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ✅ Workbook dropdown */}
        <div style={styles.field}>
          <label style={styles.label}>Workbook</label>
          <select
            value={workbook}
            onChange={(e) => setWorkbook(e.target.value)}
            style={styles.select}
          >
            <option value="">Select Workbook</option>
            {workbookOptions.map((wb, i) => (
              <option key={i} value={wb}>
                {wb}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Books Reporting Branch</label>
          <input
            value={reportingBranch}
            readOnly
            placeholder="Auto-filled"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Count</label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Math.max(0, e.target.value))}
            placeholder="Count"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Remark</label>
          <input
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Remark"
            style={styles.input}
          />
        </div>

        <button
          type="submit"
          style={styles.button}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "40px auto",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  logo: { width: 200, height: 60 },
  greeting: { flex: 1, textAlign: "center", color: "#444" },
  logoutBtn: {
    padding: "8px 16px",
    borderRadius: 6,
    border: "none",
    backgroundColor: "#dc3545",
    color: "#fff",
    cursor: "pointer",
  },
  title: { textAlign: "center", marginBottom: 20, color: "#333" },
  form: { display: "flex", flexDirection: "column", gap: 15 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 14, fontWeight: "bold", color: "#444" },
  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 16,
  },
  select: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    border: "none",
    backgroundColor: "#007bff",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
    transition: "background 0.3s",
  },
  row: { display: "flex", gap: 10 },
};
