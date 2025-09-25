import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const API_BASE = "https://school-operation-app.onrender.com";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("submissions");
  const [adminName, setAdminName] = useState("Admin");
  const adminEmail = localStorage.getItem("userEmail") || "";

  // Fetch admin name
  useEffect(() => {
    if (adminEmail) {
      fetch(`${API_BASE}/user-info?email=${adminEmail}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setAdminName(data.name);
        })
        .catch(() => setAdminName("Admin"));
    }
  }, [adminEmail]);

  // ------------------ SCHOOL DATA ------------------
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [newSchool, setNewSchool] = useState({
    school_name: "",
    location: "",
    reporting_branch: "",
    num_students: "",
  });

  useEffect(() => {
    if (activeTab === "schools") {
      setLoading(true);
      fetch(`${API_BASE}/admin/entries`)
        .then((res) => res.json())
        .then((data) => {
          setEntries(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [activeTab]);

  const handleEditClick = (row, index) => {
    setEditingRow(index);
    setEditedRow({ ...row });
  };
  const handleCancelClick = () => {
    setEditingRow(null);
    setEditedRow({});
  };
  const handleSaveClick = (index) => {
    fetch(`${API_BASE}/admin/update/${editedRow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editedRow),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const updated = [...entries];
          updated[index] = editedRow;
          setEntries(updated);
          setEditingRow(null);
        } else alert("Update failed");
      });
  };
  const handleDeleteClick = (id) => {
    if (!window.confirm("Are you sure you want to remove this school? ❌")) return;
    fetch(`${API_BASE}/admin/delete/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEntries(entries.filter((entry) => entry.id !== id));
          alert("School removed successfully ✅");
        } else alert("Failed to remove school");
      });
  };
  const handleAddSchool = () => {
    if (!newSchool.school_name || !newSchool.location)
      return alert("Enter school name & location");

    fetch(`${API_BASE}/admin/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSchool),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEntries([...entries, { ...newSchool, id: data.id }]);
          alert("School added successfully ✅");
          setNewSchool({ school_name: "", location: "", reporting_branch: "", num_students: "" });
        } else alert("Failed to add school");
      });
  };

  // ------------------ USER MANAGEMENT ------------------
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [editedUser, setEditedUser] = useState({});

  useEffect(() => {
    if (activeTab === "users") {
      fetch(`${API_BASE}/admin/users`)
        .then((res) => res.json())
        .then((data) => setUsers(data));
    }
  }, [activeTab]);

  const handleAddUser = () => {
    if (!newUser.email || !newUser.password || !newUser.name)
      return alert("Enter name, email & password");

    fetch(`${API_BASE}/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers([...users, { ...newUser, id: data.id }]);
          alert(`User (${newUser.email}) added successfully ✅`);
          setNewUser({ name: "", email: "", password: "" });
        } else {
          alert(data.message || "Failed to add user");
        }
      })
      .catch(() => {
        alert("Something went wrong. Please try again.");
      });
  };

  const handleDeleteUser = (id) => {
    const userToDelete = users.find((u) => u.id === id);
    if (!window.confirm(`Are you sure to remove ${userToDelete?.email}?`)) return;
    fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(users.filter((u) => u.id !== id));
          alert("User removed");
        }
      });
  };
  const handleEditUser = (u) => {
    setEditingUser(u.id);
    setEditedUser({ ...u });
  };

  const handleCancelUser = () => {
    setEditingUser(null);
    setEditedUser({});
  };

  const handleSaveUser = (id) => {
    fetch(`${API_BASE}/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editedUser),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(users.map((u) => (u.id === id ? editedUser : u)));
          setEditingUser(null);
        }
      });
  };

  // ------------------ USER SUBMISSIONS ------------------
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (activeTab === "submissions") {
      fetch(`${API_BASE}/admin/form-submissions`)
        .then((res) => res.json())
        .then((data) => setSubmissions(data));
    }
  }, [activeTab]);

  const handleDeleteSubmission = (ids) => {
    if (!ids || ids.length === 0) {
      alert("No entries selected");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete selected entries?");
    if (!confirmed) return;

    ids.forEach((id) => {
      fetch(`${API_BASE}/admin/form-submissions/${id}`, { method: "DELETE" })
        .then(() => setSubmissions((prev) => prev.filter((s) => s.id !== id)));
    });

    setSelectedSubs([]);
  };

  const updateDeliveredStatus = (markDelivered) => {
    if (selectedSubs.length === 0) return alert("Select at least one entry");

    fetch(`${API_BASE}/admin/mark-delivered`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: selectedSubs,
        delivered: markDelivered ? "Yes" : "No",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSubmissions((prev) =>
            prev.map((s) =>
              selectedSubs.includes(s.id) ? { ...s, delivered: markDelivered ? "Yes" : "No" } : s
            )
          );
          alert(markDelivered ? "Marked as Delivered ✅" : "Marked as Undelivered ✅");
          setSelectedSubs([]);
        } else alert("Failed to update delivered status");
      });
  };

  const toggleSelect = (id) => {
    setSelectedSubs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredSubs = submissions.filter((s) => {
    if (!s.submitted_at) return false;
    const submitted = new Date(s.submitted_at);
    let from = fromDate ? new Date(fromDate) : null;
    let to = toDate ? new Date(toDate) : null;
    if (from && submitted < from) return false;
    if (to) {
      to.setHours(23, 59, 59, 999);
      if (submitted > to) return false;
    }
    return true;
  });

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredSubs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(wb, "submissions.xlsx");
  };

  // ------------------ WORKBOOK STATUS ------------------
  const [workbooks, setWorkbooks] = useState([]);
  const [adjustValues, setAdjustValues] = useState({});
  const [newWorkbook, setNewWorkbook] = useState({
    grade: "",
    workbook_name: "",
    quantity: "",
  });

  useEffect(() => {
    if (activeTab === "workbooks") {
      fetch(`${API_BASE}/admin/workbooks`)
        .then((res) => res.json())
        .then((data) => setWorkbooks(data));
    }
  }, [activeTab]);

  const handleDeleteWorkbook = (id) => {
    if (!window.confirm("Are you sure you want to delete this workbook?")) return;
    fetch(`${API_BASE}/admin/workbooks/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setWorkbooks(workbooks.filter((w) => w.id !== id));
          alert("Workbook deleted successfully ❌");
        } else alert("Failed to delete workbook");
      });
  };

  const updateQuantity = (id, newQty) => {
    fetch(`${API_BASE}/admin/workbooks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty }),
    }).then(() =>
      setWorkbooks(workbooks.map((w) => (w.id === id ? { ...w, quantity: newQty } : w)))
    );
  };

  const handleAdjustChange = (id, value) => {
    setAdjustValues((prev) => ({ ...prev, [id]: value }));
  };
  const handleAdjustQuantity = (id, type) => {
    const adjust = parseInt(adjustValues[id] || 0, 10);
    if (isNaN(adjust) || adjust === 0) return alert("Enter a valid number");
    const workbook = workbooks.find((w) => w.id === id);
    let newQty = workbook.quantity;
    if (type === "add") newQty += adjust;
    if (type === "sub") newQty -= adjust;
    if (newQty < 0) newQty = 0;
    updateQuantity(id, newQty);
    setAdjustValues((prev) => ({ ...prev, [id]: "" }));
  };

  const handleAddWorkbook = () => {
    const { grade, workbook_name, quantity } = newWorkbook;
    if (!grade || !workbook_name || !quantity) return alert("Enter grade, workbook name & quantity");
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) return alert("Enter valid quantity");
    fetch(`${API_BASE}/admin/workbooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade, workbook_name, quantity: qtyNum }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setWorkbooks([...workbooks, { ...newWorkbook, id: data.id, quantity: qtyNum }]);
          alert("Workbook added successfully ✅");
          setNewWorkbook({ grade: "", workbook_name: "", quantity: "" });
        } else alert("Failed to add workbook");
      });
  };

  // ------------------ COMMON ------------------
  const renderTable = (columns, data, renderRow) => (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: "600px",
        }}
      >
        <thead style={{ background: "#f0f0f0" }}>
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "center",
                  fontWeight: "bold",
                  background: "#e5e7eb",
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              style={{
                borderBottom: "1px solid #ddd",
                transition: "background 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {renderRow(row, idx).props.children}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const buttonStyle = (color) => ({
    padding: "6px 12px",
    borderRadius: "6px",
    margin: "2px",
    border: "none",
    cursor: "pointer",
    background: color,
    color: "#fff",
    transition: "all 0.3s",
  });

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <img src="/OMOTEC.png" alt="Logo" style={{ height: 50, width: 200 }} />

        <button
          onClick={logout}
          style={{ ...buttonStyle("red"), padding: "8px 14px" }}
          onMouseEnter={(e) => (e.target.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.target.style.opacity = "1")}
        >
          Logout
        </button>
      </div>
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <h1>Welcome {adminName}</h1>
      </div>

      {/* Tabs */}
      <div
        style={{
          marginTop: "20px",
          marginBottom: "20px",
          textAlign: "center",
          flexWrap: "wrap",
        }}
      >
        {["schools", "users", "submissions", "workbooks"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...buttonStyle(activeTab === tab ? "#1D4ED8" : "#9CA3AF"),
              minWidth: "120px",
              minHeight:"40px"
            }}
            onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.target.style.opacity = "1")}
          >
            {tab === "schools"
              ? "School Data"
              : tab === "users"
              ? "User Management"
              : tab === "submissions"
              ? "User Submissions"
              : "Workbook Status"}
          </button>
        ))}
      </div>

      {/* ------ Existing UI Blocks (Schools / Users / Submissions / Workbooks) remain same ------ */}
      {/* Sirf table aur button style ka UI improve ho gaya with hover + separation + responsive */}
      {/* Place your existing blocks (as in your provided code) here without removing any functionality */}

      {/* Example: */}

      {/* Schools */}
      {activeTab === "schools" && (
        loading ? <h3>Loading...</h3> : (
          <>
            <div style={{ margin: "10px 0", display: "flex", gap: "8px" }}>
              <input placeholder="School Name" value={newSchool.school_name} onChange={(e) => setNewSchool({ ...newSchool, school_name: e.target.value })} />
              <input placeholder="Location" value={newSchool.location} onChange={(e) => setNewSchool({ ...newSchool, location: e.target.value })} />
              <input placeholder="Books Reporting Branch" value={newSchool.reporting_branch} onChange={(e) => setNewSchool({ ...newSchool, reporting_branch: e.target.value })} />
              <input placeholder="No. of Students" value={newSchool.num_students} onChange={(e) => setNewSchool({ ...newSchool, num_students: e.target.value })} />
              <button onClick={handleAddSchool} style={buttonStyle("green")}>Add School</button>
            </div>
            {renderTable(
              ["ID","School", "Location", "Books Reporting Branch", "No. of Students", "Actions"],
              entries,
              (row, index) => (
                <tr key={row.id}>
                  {editingRow === index ? (
                    <>
                      <td>{row.id}</td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}><input value={editedRow.school_name || ""} onChange={(e) => setEditedRow({ ...editedRow, school_name: e.target.value })} /></td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}><input value={editedRow.location || ""} onChange={(e) => setEditedRow({ ...editedRow, location: e.target.value })} /></td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}><input value={editedRow.reporting_branch || ""} onChange={(e) => setEditedRow({ ...editedRow, reporting_branch: e.target.value })} /></td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}><input value={editedRow.num_students || ""} onChange={(e) => setEditedRow({ ...editedRow, num_students: e.target.value })} /></td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                        <button onClick={() => handleSaveClick(index)} style={buttonStyle("green")}>Save</button>
                        <button onClick={handleCancelClick} style={buttonStyle("grey")}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}>{row.id}</td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}>{row.school_name}</td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}>{row.location}</td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}>{row.reporting_branch}</td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}>{row.num_students}</td>
                      <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                        <button onClick={() => handleEditClick(row, index)} style={buttonStyle("#1864c7ff")}>Edit</button>
                        <button onClick={() => handleDeleteClick(row.id)} style={buttonStyle("red")}>Remove</button>
                      </td>
                    </>
                  )}
                </tr>
              )
            )}
          </>
        )
      )}



      {/* Users */}
      {activeTab === "users" && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input placeholder="Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            <input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            <input placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
            <button onClick={handleAddUser} style={buttonStyle("green")}>Add</button>
          </div>
          {renderTable(["ID", "Name", "Email", "Password", "Actions"], users, (u) => (
            <tr key={u.id}>
              {editingUser === u.id ? (
                <>
                  <td style={{ border: "1px solid #ccc", padding: "6px" }}>{u.id}</td>
                  <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                    <input value={editedUser.name} onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })} />
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                    <input value={editedUser.email} onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })} />
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                    <input value={editedUser.password} onChange={(e) => setEditedUser({ ...editedUser, password: e.target.value })} />
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                    <button onClick={() => handleSaveUser(u.id)} style={buttonStyle("green")}>Save</button>
                    <button onClick={handleCancelUser} style={buttonStyle("grey")}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ border: "1px solid #ccc", padding: "6px" }}>{u.id}</td>
                  <td style={{ border: "1px solid #ccc", padding: "6px" }}>{u.name}</td>
                  <td style={{ border: "1px solid #ccc", padding: "6px" }}>{u.email}</td>
                  <td style={{ border: "1px solid #ccc", padding: "6px" }}>{u.password}</td>
                  <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                    <button onClick={() => handleEditUser(u)} style={buttonStyle("#1864c7ff")}>Edit</button>
                    <button onClick={() => handleDeleteUser(u.id)} style={buttonStyle("red")}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </div>
      )}

      {/* Submissions */}
      {activeTab === "submissions" && (
        <div>
          <div style={{ marginTop: "10px", marginBottom: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
            <label>From: </label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <label>To: </label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

            <button onClick={() => handleDeleteSubmission(selectedSubs)} style={buttonStyle("red")}>Delete Selected</button>
            <button onClick={() => updateDeliveredStatus(true)} style={buttonStyle("green")}>Mark Delivered</button>
            <button onClick={() => updateDeliveredStatus(false)} style={buttonStyle("grey")}>Mark Undelivered</button>
            <button onClick={downloadExcel} style={buttonStyle("green")}>Download Excel</button>
          </div>

          {renderTable(
            ["Select", "ID", "School", "Grade", "Term", "Workbook", "Count", "Remark", "Submitted_By", "Submitted_At", "Delivered"],
            filteredSubs,
            (s) => (
              <tr key={s.id}>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                  <input type="checkbox" checked={selectedSubs.includes(s.id)} onChange={() => toggleSelect(s.id)} />
                </td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{s.id}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{s.school_name}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{s.grade}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{s.term}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{s.workbook}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{s.count}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{s.remark}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{s.submitted_by}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{s.submitted_at}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{s.delivered}</td>
              </tr>
            )
          )}
        </div>
      )}

      {/* Workbooks */}
      {activeTab === "workbooks" && (
        <>
          {/* Add Workbook Section */}
          <div style={{ margin: "10px 0", display: "flex", gap: "8px" }}>
            <input
              placeholder="Grade"
              min="1"
              value={newWorkbook.grade}
              onChange={(e) => setNewWorkbook({ ...newWorkbook, grade: e.target.value })}
              style={{ width: "70px" }}
            />
            <input
              placeholder="Workbook Name"
              value={newWorkbook.workbook_name}
              onChange={(e) => setNewWorkbook({ ...newWorkbook, workbook_name: e.target.value })}
            />
            <input
              placeholder="Quantity"
              type="number"
              min="0"
              value={newWorkbook.quantity}
              onChange={(e) => setNewWorkbook({ ...newWorkbook, quantity: e.target.value })}
              style={{ width: "70px" }}
            />
            <button
              onClick={handleAddWorkbook}
              style={{ background: "green", color: "#fff", border: "none", borderRadius: "4px", padding: "6px 12px" }}
            >
              Add Workbook
            </button>
          </div>

          {/* Existing Workbooks Table */}
          {renderTable(
            ["ID", "Grade", "Workbook", "Quantity", "Action"],
            workbooks,
            (w) => (
              <tr key={w.id}>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{w.id}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{w.grade}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{w.workbook_name}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{w.quantity}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                  <input
                    type="number"
                    min="0"
                    value={adjustValues[w.id] || ""}
                    onChange={(e) => handleAdjustChange(w.id, e.target.value)}
                    style={{ width: "70px", marginRight: "5px" }}
                  />
                  <button onClick={() => handleAdjustQuantity(w.id, "add")} style={buttonStyle("green")}>New Stock</button>
                  <button onClick={() => handleAdjustQuantity(w.id, "sub")} style={buttonStyle("grey")}>Books Delivered</button>
                  <button
                    onClick={() => handleDeleteWorkbook(w.id)}
                    style={{ marginLeft: "5px", background: "red", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )
          )}
        </>
      )}


    </div>
  );
};

export default AdminDashboard;