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
  const [reportingBranch, setReportingBranch] = useState("");
  const [count, setCount] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/schools`)
      .then(res => setSchools(res.data))
      .catch(() => setSchools([]));
  }, []);

  const fetchLocations = async (s) => {
    try {
      const res = await axios.get(`${API_BASE}/locations`, { params: { school: s } });
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
      const res = await axios.get(`${API_BASE}/reporting_branch`, { params: { school: s, location: loc } });
      setReportingBranch(res.data.reporting_branch || "");
    } catch {
      setReportingBranch("");
    }
  };

  const fetchWorkbook = async (s, loc, g, t) => {
    if (s && loc && g && t) {
      try {
        const res = await axios.get(`${API_BASE}/workbook`, { params: { school: s, location: loc, grade: g, term: t } });
        setWorkbook(res.data.workbook || "");
      } catch {
        setWorkbook("");
      }
    }
  };

  const handleSchoolChange = (s) => {
    setSchool(s);
    setLocation("");
    setReportingBranch("");
    setWorkbook("");
    fetchLocations(s);
  };

  const handleLocationChange = (loc) => {
    setLocation(loc);
    setWorkbook("");
    if (school) fetchReportingBranch(school, loc);
  };

  const handleGradeTermChange = (g, t) => {
    setGrade(g);
    setTerm(t);
    setWorkbook("");
    fetchWorkbook(school, location, g, t);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!school) return alert("School must be filled!");
    if (!location) return alert("Location must be filled!");
    if (!grade) return alert("Grade must be filled!");
    if (!term) return alert("Term must be filled!");
    if (!count) return alert("Count must be filled!");
    if (!remark) return alert("Remark must be filled!");

    // ✅ New check for workbook
    if (!workbook) {
      return alert(
        `We are not teaching Grade ${grade} in ${school} (${location}) for Term ${term}.`
      );
    }

    setLoading(true);
    const submitted_by = localStorage.getItem("userEmail") || "";
    try {
      await axios.post(`${API_BASE}/submit`, {
        school,
        location,
        grade,
        term,
        workbook,
        count,
        remark,
        submitted_by,
      });
      window.alert("Submitted successfully!");
      setSchool("");
      setLocation("");
      setGrade("");
      setTerm("");
      setWorkbook("");
      setReportingBranch("");
      setCount("");
      setRemark("");
    } catch {
      window.alert("Error submitting");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Workbook Entry</h2>
      <form onSubmit={handleSubmit} style={styles.form}>

        <div style={styles.field}>
          <label style={styles.label}>School</label>
          <select value={school} onChange={e => handleSchoolChange(e.target.value)} style={styles.select}>
            <option value="">Select School</option>
            {schools.map((s, i) => <option key={i} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Location</label>
          {locations.length > 1 ? (
            <select value={location} onChange={e => handleLocationChange(e.target.value)} style={styles.select}>
              <option value="">Select Location</option>
              {locations.map((l, i) => <option key={i} value={l}>{l}</option>)}
            </select>
          ) : (
            <input
              value={location}
              onChange={e => handleLocationChange(e.target.value)}
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
              onChange={e => handleGradeTermChange(e.target.value, term)} 
              style={styles.select}
            >
              <option value="">Grade</option>
              {[...Array(10)].map((_, i) => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Term</label>
            <select 
              value={term} 
              onChange={e => handleGradeTermChange(grade, e.target.value)} 
              style={styles.select}
            >
              <option value="">Term</option>
              {[1,2,3].map(t => (
                <option key={t} value={t}>Term {t}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Workbook</label>
          <input value={workbook} readOnly placeholder="Auto-filled" style={styles.input} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Books Reporting Branch</label>
          <input value={reportingBranch} readOnly placeholder="Auto-filled" style={styles.input} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Count</label>
          <input 
            type="number" 
            value={count} 
            onChange={e=>setCount(Math.max(0, e.target.value))} 
            placeholder="Count" 
            style={styles.input} 
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Remark</label>
          <input value={remark} onChange={e=>setRemark(e.target.value)} placeholder="Remark" style={styles.input} />
        </div>

        <button type="submit" style={styles.button} disabled={loading}>{loading ? "Submitting..." : "Submit"}</button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: 500, margin: "40px auto", padding: 20, borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", backgroundColor: "#fff", fontFamily: "Arial, sans-serif" },
  title: { textAlign: "center", marginBottom: 20, color: "#333" },
  form: { display: "flex", flexDirection: "column", gap: 15 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 14, fontWeight: "bold", color: "#444" },
  input: { padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 16 },
  select: { padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 16 },
  button: { padding: 12, borderRadius: 8, border: "none", backgroundColor: "#007bff", color: "#fff", fontSize: 16, cursor: "pointer", transition: "background 0.3s" },
  row: { display: "flex", gap: 10 }
};
