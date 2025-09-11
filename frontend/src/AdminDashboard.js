import React, { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("schools");

  // ------------------ SCHOOL DATA ------------------
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [editedRow, setEditedRow] = useState({});

  useEffect(() => {
    if (activeTab === "schools") {
      setLoading(true);
      fetch("http://127.0.0.1:5000/admin/entries")
        .then((res) => res.json())
        .then((data) => {
          setEntries(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching admin entries:", err);
          setLoading(false);
        });
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
    fetch(`http://127.0.0.1:5000/admin/update/${editedRow.id}`, {
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
        } else alert(data.message || "Update failed");
      })
      .catch((err) => console.error("Error updating row:", err));
  };

  // ------------------ USER MANAGEMENT ------------------
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ email: "", password: "" });

  useEffect(() => {
    if (activeTab === "users") {
      fetch("http://127.0.0.1:5000/admin/users")
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch((err) => console.error("Error fetching users:", err));
    }
  }, [activeTab]);

  const handleAddUser = () => {
    if (!newUser.email || !newUser.password) return alert("Enter email & password");
    fetch("http://127.0.0.1:5000/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers([...users, { ...newUser, id: data.id }]);
          alert(`User (${newUser.email}) added successfully ✅`);
          setNewUser({ email: "", password: "" });
        } else alert(data.message || "User creation failed");
      })
      .catch((err) => console.error("Error adding user:", err));
  };

  const handleDeleteUser = (id) => {
    const userToDelete = users.find((u) => u.id === id);
    if (!window.confirm(`Are you sure you want to remove user (${userToDelete?.email})?`)) return;

    fetch(`http://127.0.0.1:5000/admin/users/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(users.filter((u) => u.id !== id));
          alert(`User (${userToDelete?.email}) removed successfully ❌`);
        } else alert(data.message || "Delete failed");
      })
      .catch((err) => console.error("Error deleting user:", err));
  };

  // ------------------ USER SUBMISSIONS ------------------
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (activeTab === "submissions") {
      fetch("http://127.0.0.1:5000/admin/form-submissions")
        .then((res) => res.json())
        .then((data) => setSubmissions(data))
        .catch((err) => console.error("Error fetching submissions:", err));
    }
  }, [activeTab]);

  const handleDeleteSubmission = (id) => {
    if (!window.confirm("Are you sure you want to delete this submission?")) return;

    fetch(`http://127.0.0.1:5000/admin/form-submissions/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSubmissions(submissions.filter((s) => s.id !== id));
          alert("Submission deleted successfully");
        } else {
          alert(data.message || "Delete failed");
        }
      })
      .catch((err) => console.error("Error deleting submission:", err));
  };

  const renderTable = (columns, data, renderRow) => (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead style={{ backgroundColor: "#f0f0f0", position: "sticky", top: 0 }}>
          <tr>
            {columns.map((col) => (
              <th key={col} style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>{data.map(renderRow)}</tbody>
      </table>
    </div>
  );

  const btnStyle = (active) => ({
    padding: "8px 16px",
    borderRadius: "4px",
    margin: "0 4px",
    cursor: "pointer",
    border: "none",
    backgroundColor: active ? "#1D4ED8" : "#E5E7EB",
    color: active ? "#fff" : "#000"
  });

  return (
    <div style={{ padding: "24px", maxWidth: "95%", margin: "0 auto" }}>
      <h1 style={{ fontSize: "48px", fontWeight: "bold", color: "red", textAlign: "center", marginBottom: "24px" }}>
        Admin Dashboard
      </h1>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
        {["schools", "users", "submissions"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={btnStyle(activeTab === tab)}>
            {tab === "schools" ? "School Data" : tab === "users" ? "User Management" : "User Submissions"}
          </button>
        ))}
      </div>

      {/* School Data */}
      {activeTab === "schools" &&
        (loading ? (
          <h2 style={{ textAlign: "center", marginTop: "40px" }}>Loading...</h2>
        ) : renderTable(
          ["School", "Location", "Grade", "Term 1", "Term 2", "Term 3", "Reporting Branch", "Actions"],
          entries,
          (row, index) => (
            <tr key={row.id} style={{ backgroundColor: "#fff", transition: "background-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}>
              {editingRow === index ? (
                <>
                  {["school_name","location","grade","term1","term2","term3","reporting_branch"].map((key) => (
                    <td key={key} style={{ border: "1px solid #ccc", padding: "4px" }}>
                      <input
                        type={key==="grade"?"number":"text"}
                        value={editedRow[key] || ""}
                        onChange={(e) => setEditedRow({ ...editedRow, [key]: e.target.value })}
                        style={{ width: "100%", padding: "4px", borderRadius: "4px", border: "1px solid #ccc" }}
                      />
                    </td>
                  ))}
                  <td style={{ border: "1px solid #ccc", padding: "4px", display: "flex", gap: "4px" }}>
                    <button onClick={() => handleSaveClick(index)} style={{ backgroundColor: "green", color: "#fff", padding: "4px 8px", borderRadius: "4px", border: "none" }}>Save</button>
                    <button onClick={handleCancelClick} style={{ backgroundColor: "#888", color: "#fff", padding: "4px 8px", borderRadius: "4px", border: "none" }}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{row.school_name}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{row.location}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{row.grade}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{row.term1||"-"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{row.term2||"-"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{row.term3||"-"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{row.reporting_branch}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>
                    <button onClick={() => handleEditClick(row,index)} style={{ backgroundColor: "#1D4ED8", color: "#fff", padding: "4px 8px", borderRadius: "4px", border: "none" }}>Edit</button>
                  </td>
                </>
              )}
            </tr>
          )
        ))}

      {/* User Management */}
      {activeTab === "users" && (
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>Manage Users</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({...newUser,email:e.target.value})} style={{ padding: "4px", borderRadius: "4px", border: "1px solid #ccc", minWidth: "150px", flex: "1" }} />
            <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({...newUser,password:e.target.value})} style={{ padding: "4px", borderRadius: "4px", border: "1px solid #ccc", minWidth: "150px", flex: "1" }} />
            <button onClick={handleAddUser} style={{ backgroundColor: "green", color: "#fff", padding: "4px 12px", borderRadius: "4px", border: "none" }}>Add User</button>
          </div>
          {renderTable(["ID","Email","Actions"], users, (user) => (
            <tr key={user.id} style={{ backgroundColor: "#fff", transition: "background-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}>
              <td style={{ border: "1px solid #ccc", padding: "4px" }}>{user.id}</td>
              <td style={{ border: "1px solid #ccc", padding: "4px" }}>{user.email}</td>
              <td style={{ border: "1px solid #ccc", padding: "4px" }}>
                <button onClick={()=>handleDeleteUser(user.id)} style={{ backgroundColor: "red", color: "#fff", padding: "4px 8px", borderRadius: "4px", border: "none" }}>Remove</button>
              </td>
            </tr>
          ))}
        </div>
      )}

      {/* User Submissions */}
      {activeTab === "submissions" && renderTable(
        ["ID","School","Location","Grade","Term","Workbook","Count","Remark","Submitted By","Submitted At","Actions"],
        submissions,
        (s)=>(
          <tr key={s.id} style={{ backgroundColor: "#fff", transition: "background-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}>
            {["id","school_name","location","grade","term","workbook","count","remark","submitted_by","submitted_at"].map((key)=>(
              <td key={key} style={{ border: "1px solid #ccc", padding: "4px" }}>{s[key]}</td>
            ))}
            <td style={{ border: "1px solid #ccc", padding: "4px" }}>
              <button onClick={() => handleDeleteSubmission(s.id)} style={{ backgroundColor: "red", color: "#fff", padding: "4px 8px", borderRadius: "4px", border: "none" }}>Delete</button>
            </td>
          </tr>
        )
      )}
    </div>
  );
};

export default AdminDashboard;
