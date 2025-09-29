import React, { useState, useEffect } from "react";
import axios from "axios";
// Importing the required icons
import { FaSave, FaSignOutAlt } from 'react-icons/fa'; 

const API_BASE = "http://127.0.0.1:5001";

const FormPage = () => {
  // State initialization (UNCHANGED)
  const [schools, setSchools] = useState([]);
  const [locations, setLocations] = useState([]);
  const [school, setSchool] = useState("");
  const [location, setLocation] = useState("");
  const [grade, setGrade] = useState("");
  const [term, setTerm] = useState("");
  const [workbook, setWorkbook] = useState("");
  const [workbookOptions, setWorkbookOptions] = useState([]);
  const [reportingBranch, setReportingBranch] = useState("");
  const [count, setCount] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState([]);
  const [userName, setUserName] = useState("User");
  const userEmail = localStorage.getItem("userEmail") || "";
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Responsive logic (UNCHANGED)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch Grades (UNCHANGED)
  useEffect(() => {
    axios.get(`${API_BASE}/grades`)
      .then(res => setGrades(res.data || []))
      .catch(() => setGrades([]));
  }, []);

  // Fetch Workbook Options
  const fetchWorkbookOptions = async (g, s, loc) => {
    if (!g) {
      setWorkbookOptions([]);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/workbook_name`, {
        params: { grade: g, school: s, location: loc },
      });
      setWorkbookOptions(res.data.workbooks || []);
    } catch {
      setWorkbookOptions([]);
    }
  };

  // Fetch User Info (UNCHANGED)
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

  // Fetch Schools (UNCHANGED)
  useEffect(() => {
    axios
      .get(`${API_BASE}/schools`)
      .then((res) => setSchools(res.data))
      .catch(() => setSchools([]));
  }, []);

  // Fetch Locations (UNCHANGED logic, but used in handler)
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

  // Fetch Reporting Branch (UNCHANGED)
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

  // 1. School Change Handler (Fixed cascading reset)
  const handleSchoolChange = (s) => {
    setSchool(s);
    // Reset all dependent fields
    setLocation("");
    setReportingBranch("");
    setGrade("");
    setTerm("");
    setWorkbook("");
    setWorkbookOptions([]);
    fetchLocations(s);
  };

  // 2. Location Change Handler (Fixed cascading reset)
  const handleLocationChange = (loc) => {
    setLocation(loc);
    // Reset grade/workbook as they may depend on location
    setGrade("");
    setTerm("");
    setWorkbook("");
    setWorkbookOptions([]);
    
    if (school && loc) {
        fetchReportingBranch(school, loc);
    } else {
        setReportingBranch("");
    }
  };

  // 3. Grade Change Handler (Fixed cascading reset)
  const handleGradeChange = (g) => {
    setGrade(g);
    setWorkbook("");
    setWorkbookOptions([]);
    // Pass school and location for robust workbook fetching
    fetchWorkbookOptions(g, school, location); 
  };
  
  // Submission Logic (UNCHANGED)
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

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // --- Reusable Style Objects with hover effects ---
  const sharedInputStyle = {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 16,
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
    backgroundColor: "white",
  };
  const hoverInputStyle = {
    borderColor: "#4F46E5", 
    boxShadow: "0 0 5px rgba(79, 70, 229, 0.5)",
    outline: "none",
  };
  const buttonStyle = {
    padding: "12px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#10B981", 
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.1s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8, // Added gap for icon
  };

  // Function to apply hover styles
  const applyHover = (e) => Object.assign(e.target.style, hoverInputStyle);
  const removeHover = (e) => Object.assign(e.target.style, sharedInputStyle);

  const applySubmitHover = (e) => e.target.style.backgroundColor = "#047857";
  const removeSubmitHover = (e) => e.target.style.backgroundColor = "#10B981";

  const applyLogoutHover = (e) => e.target.style.backgroundColor = "#B91C1C";
  const removeLogoutHover = (e) => e.target.style.backgroundColor = "#EF4444";

  const readOnlyInputStyle = {
    backgroundColor: '#eef2ff',
    color: '#4b5563',
    cursor: 'not-allowed',
  };


  return (
    <div style={styles.container}>
      {/* Header with logo, greeting, and logout button */}
      <div style={{...styles.header, flexDirection: isMobile ? "column" : "row"}}>
        <img
          src="/OMOTEC.png"
          alt="Company Logo"
          style={styles.logo}
        />
        
        <button
          onClick={handleLogout}
          style={{...styles.logoutBtn, backgroundColor: "#EF4444"}}
          onMouseEnter={applyLogoutHover}
          onMouseLeave={removeLogoutHover}
        >
            {/* LOGOUT ICON ADDED */}
            <FaSignOutAlt style={{ marginRight: '5px' }} /> 
            Logout
        </button>
      </div>

      <h1 style={{...styles.greeting, marginTop: isMobile ? "10px" : "0"}}>
        Welcome <span style={{color: "#4F46E5", fontWeight: 700}}>{userName}</span>
      </h1>
      <h2 style={styles.title}>Workbook Entry</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* 1. School */}
        <div style={styles.field}>
          <label style={styles.label}>School</label>
          <select
            value={school}
            onChange={(e) => handleSchoolChange(e.target.value)}
            style={sharedInputStyle}
            onMouseEnter={applyHover}
            onMouseLeave={removeHover}
          >
            <option value="">Select School</option>
            {schools.map((s, i) => (
              <option key={i} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Location */}
        <div style={styles.field}>
          <label style={styles.label}>Location</label>
          {locations.length > 1 ? (
            <select
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              style={{...sharedInputStyle, ...(!school ? readOnlyInputStyle : {})}}
              disabled={!school}
              onMouseEnter={applyHover}
              onMouseLeave={removeHover}
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
              readOnly={locations.length === 1 && location !== ""}
              disabled={!school}
              style={{
                ...sharedInputStyle,
                ...((locations.length === 1 && location !== "") || !school ? readOnlyInputStyle : {}),
              }}
              onMouseEnter={applyHover}
              onMouseLeave={removeHover}
            />
          )}
        </div>

        <div style={{...styles.row, flexDirection: isMobile ? "column" : "row"}}>
          {/* 3. Grade */}
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Grade</label>
            <select
              value={grade}
              onChange={(e) => handleGradeChange(e.target.value)}
              style={sharedInputStyle}
              onMouseEnter={applyHover}
              onMouseLeave={removeHover}
            >
              <option value="">Select Grade</option>
              {grades.map((g, i) => (
                <option key={i} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Term */}
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              style={sharedInputStyle}
              onMouseEnter={applyHover}
              onMouseLeave={removeHover}
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

        {/* 5. Workbook */}
        <div style={styles.field}>
          <label style={styles.label}>Workbook</label>
          <select
            value={workbook}
            onChange={(e) => setWorkbook(e.target.value)}
            style={{...sharedInputStyle, ...((!grade || workbookOptions.length === 0) ? readOnlyInputStyle : {})}}
            disabled={!grade || workbookOptions.length === 0}
            onMouseEnter={applyHover}
            onMouseLeave={removeHover}
          >
            <option value="">Select Workbook</option>
            {workbookOptions.map((wb, i) => (
              <option key={i} value={wb}>
                {wb}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Books Reporting Branch (Read-Only) */}
        <div style={styles.field}>
          <label style={styles.label}>Books Reporting Branch</label>
          <input
            value={reportingBranch}
            readOnly
            placeholder="Auto-filled"
            style={{...sharedInputStyle, ...readOnlyInputStyle}}
          />
        </div>

        {/* 7. Count */}
        <div style={styles.field}>
          <label style={styles.label}>Count</label>
          <input
            type="number"
            min="0"
            value={count}
            onChange={(e) => setCount(Math.max(0, e.target.value))}
            placeholder="Count"
            style={sharedInputStyle}
            onMouseEnter={applyHover}
            onMouseLeave={removeHover}
          />
        </div>

        {/* 8. Remark */}
        <div style={styles.field}>
          <label style={styles.label}>Remark</label>
          <input
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Remark"
            style={sharedInputStyle}
            onMouseEnter={applyHover}
            onMouseLeave={removeHover}
          />
        </div>

        <button
          type="submit"
          style={buttonStyle}
          disabled={loading}
          onMouseEnter={applySubmitHover}
          onMouseLeave={removeSubmitHover}
        >
            {/* SUBMIT ICON ADDED */}
            <FaSave style={{ marginRight: '5px' }} /> 
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 700,
    margin: "40px auto",
    padding: 30,
    borderRadius: 12,
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
    backgroundColor: "#ffffff",
    fontFamily: "'Inter', sans-serif",
    border: '1px solid #e5e7eb',
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottom: '2px solid #e0e7ff',
    flexWrap: "wrap",
    gap: 15,
  },
  logo: { width: 250, height: 70 },
  greeting: { fontSize: '2rem', textAlign: "center", color: "#111827" },
  logoutBtn: {
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#EF4444",
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.1s",
    display: 'flex', // Added for icon alignment
    alignItems: 'center', // Added for icon alignment
  },
  title: { 
    fontSize: '1.75rem', 
    fontWeight: 700,
    marginBottom: 25, 
    color: "#111827",
    borderLeft: '5px solid #4F46E5',
    paddingLeft: 12,
    textAlign: 'left',
  },
  form: { 
    display: "flex", 
    flexDirection: "column", 
    gap: 20,
    paddingBottom: 10,
  },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 14, fontWeight: "bold", color: "#374151" },
  row: { display: "flex", gap: 20 },
};

export default FormPage;