import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import DataTable from "react-data-table-component";
import styled from "styled-components";
// Import icons for a better UI experience
import { FaSchool, FaUsers, FaClipboardList, FaBookOpen, FaSearch, FaTimes, FaSignOutAlt, FaPlus, FaSave, FaTrash, FaEdit, FaCheck, FaTimesCircle, FaCalendarAlt, FaDownload, FaMinus } from 'react-icons/fa';

const API_BASE = "https://school-operation-app.onrender.com";

// --- Styled Components for UI Consistency and Responsiveness (IMPROVED) ---

const Container = styled.div`
  padding: 30px;
  font-family: 'Inter', sans-serif; /* Modern font */
  margin: 0 auto;
  background-color: #f4f7f9; /* Light, soft background */
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e7ff; /* Lighter, blue-tinted separator */
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border-radius: 8px;
  margin: 2px;
  border: none;
  cursor: pointer;
  background: ${(props) => props.bgColor || "#4F46E5"}; /* Default to a vibrant blue/indigo */
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.3s ease-in-out;
  min-width: 100px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    box-shadow: 0 6px 10px -2px rgba(0, 0, 0, 0.15);
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  & > svg {
      margin-right: 8px; /* Spacing for icon */
  }

  @media (max-width: 480px) {
    min-width: unset;
    padding: 8px 12px;
    font-size: 0.9rem;
    & > svg {
      margin-right: 5px;
    }
  }
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  min-width: 150px;
  flex-grow: 1;
  box-sizing: border-box;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: white;

  &:focus {
    border-color: #4F46E5;
    outline: none;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
  }
  @media (max-width: 768px) {
    min-width: 100%;
    margin-bottom: 8px;
  }
`;

const ControlGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px; /* Increased gap for better spacing */
  margin-bottom: 15px;
  align-items: center;
  width: 100%;
`;

const TabBar = styled(ControlGroup)`
  justify-content: center;
  margin-bottom: 30px;
  padding: 10px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  ${Button} {
    background-color: #ccc;
    color: #4b5563;
    font-weight: 500;
    &:hover {
        background-color: #bdbdbd;
    }
  }

  ${Button}[data-active="true"] {
    background-color: #4F46E5;
    color: #fff;
    &:hover {
      background-color: #3f39cf;
    }
  }

  @media (max-width: 600px) {
    gap: 8px;
    padding: 8px;
    ${Button} {
      min-width: unset;
      flex-grow: 1;
      padding: 10px 5px;
    }
  }
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 12px; /* Softer corners */
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
  padding: 25px;
  margin-top: 30px;
  overflow-x: auto;
  border: 1px solid #e5e7eb; /* Subtle border */
`;

const Title = styled.h2`
  color: #111827;
  margin-bottom: 20px;
  border-left: 5px solid #4F46E5; /* Stronger color accent */
  padding-left: 12px;
  font-size: 1.75rem;
  font-weight: 700;
`;

// IMPROVED DataTable Styling for better visual separation and clarity
const StyledDataTable = styled(DataTable)`
  .rdt_Table {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }
  .rdt_TableHeadRow {
    background-color: #eff6ff;
    color: #1f2937;
    font-weight: 700; /* Bolder header text */
    font-size: 15px; /* Slightly larger header font */
    border-bottom: 2px solid #bfdbfe; /* Stronger separation line */
    min-height: 56px; /* Taller header row */
  }
  .rdt_TableCol, .rdt_TableCell {
    padding: 12px 15px; /* Increased cell padding */
    border-right: 1px solid #f3f4f6;
  }
  .rdt_TableCol:last-child, .rdt_TableCell:last-child {
    border-right: none;
  }
  .rdt_TableRow {
    border-bottom: 1px solid #f3f4f6;
    min-height: 55px; /* Taller row height */
    transition: background-color 0.2s;
  }
  .rdt_TableRow:hover {
    background-color: #f9fafb; /* Subtle hover effect */
  }
  .rdt_Pagination {
    border-top: 1px solid #e5e7eb;
    padding: 15px;
    background-color: #ffffff;
    border-radius: 0 0 8px 8px;
  }
`;

const FilterComponent = ({ filterText, onFilter, onClear }) => (
  <ControlGroup style={{ justifyContent: 'flex-end', margin: '0 0 15px 0' }}>
    <div style={{ position: 'relative', flexGrow: 0, minWidth: '200px', maxWidth: '300px' }}>
        <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <Input
          id="search"
          type="text"
          placeholder="Filter table data"
          value={filterText}
          onChange={onFilter}
          style={{ paddingLeft: '40px', minWidth: '200px', maxWidth: '300px' }}
        />
    </div>
    <Button type="button" onClick={onClear} bgColor="#6B7280" style={{ minWidth: 'unset', padding: '10px 12px' }}>
      <FaTimes /> Clear Filter
    </Button>
  </ControlGroup>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("submissions");
  const [adminName, setAdminName] = useState("Admin");
  const adminEmail = localStorage.getItem("userEmail") || "";

  const [filterText, setFilterText] = useState("");
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  // Memoized style for cleaner button rendering in cells
  const getButtonStyle = useMemo(() => (color) => ({
    padding: "6px 10px",
    borderRadius: "6px",
    margin: "2px",
    border: "none",
    cursor: "pointer",
    background: color,
    color: "#fff",
    transition: "all 0.3s",
    minWidth: 'unset',
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.9rem',
    boxShadow: 'none',
  }), []);

  // --- Initial Admin Name Fetch (Functionality unchanged) ---
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

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // ------------------ SCHOOL DATA ------------------
  const [entries, setEntries] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
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
      setLoadingSchools(true);
      fetch(`${API_BASE}/admin/entries`)
        .then((res) => res.json())
        .then((data) => {
          setEntries(data);
          setLoadingSchools(false);
        })
        .catch(() => setLoadingSchools(false));
    }
  }, [activeTab]);

  const handleEditClick = (row) => { setEditingRow(row.id); setEditedRow({ ...row }); };
  const handleCancelClick = () => { setEditingRow(null); setEditedRow({}); };
  const handleSaveClick = () => {
    fetch(`${API_BASE}/admin/update/${editedRow.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editedRow),
    }).then((res) => res.json()).then((data) => {
      if (data.success) {
        setEntries(entries.map(e => e.id === editedRow.id ? editedRow : e));
        setEditingRow(null);
        alert("School updated successfully ✅");
      } else alert("Update failed");
    });
  };
  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to remove this school?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/delete/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({})); // safe json parse

      if (data.success) {
        setEntries((prev) => prev.filter((entry) => entry.id !== id));
        alert("✅ School removed successfully");
      } else {
        alert("⚠️ Failed to remove school");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Server error while removing school");
    }
  };

  const handleAddSchool = () => {
    if (!newSchool.school_name || !newSchool.location || !newSchool.reporting_branch || !newSchool.num_students) return alert("Enter all required data");
    fetch(`${API_BASE}/admin/entries`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSchool),
    }).then((res) => res.json()).then((data) => {
      if (data.success) {
        setEntries([...entries, { ...newSchool, id: data.id }]);
        alert("School added successfully ✅");
        setNewSchool({ school_name: "", location: "", reporting_branch: "", num_students: "" });
      } else alert("Failed to add school");
    });
  };

  const schoolColumns = useMemo(() => [
    { name: "ID", selector: (row) => row.id, sortable: true, width: '100px' },
    {
      name: "School Name", selector: (row) => row.school_name, sortable: true, wrap: true,
      cell: (row) => editingRow === row.id ?
          <Input value={editedRow.school_name || ""} onChange={(e) => setEditedRow({ ...editedRow, school_name: e.target.value })} /> : row.school_name
    },
    {
      name: "Location", selector: (row) => row.location, sortable: true,
      cell: (row) => editingRow === row.id ?
          <Input value={editedRow.location || ""} onChange={(e) => setEditedRow({ ...editedRow, location: e.target.value })} /> : row.location
    },
    {
      name: "Books Reporting Branch", selector: (row) => row.reporting_branch, sortable: true,
      cell: (row) => editingRow === row.id ?
          <Input value={editedRow.reporting_branch || ""} onChange={(e) => setEditedRow({ ...editedRow, reporting_branch: e.target.value })} /> : row.reporting_branch
    },
    {
      name: "No. of Students", selector: (row) => row.num_students, sortable: true, width: '180px',
      cell: (row) => editingRow === row.id ?
          <Input type="number" value={editedRow.num_students || ""} onChange={(e) => setEditedRow({ ...editedRow, num_students: e.target.value })} /> : row.num_students
    },
    {
      name: "Actions",
      cell: (row) => (
        <ControlGroup style={{ flexWrap: 'nowrap', margin: 0, gap: '5px' }}>
          {editingRow === row.id ? (
            <>
              <Button onClick={handleSaveClick} bgColor="#10B981" style={getButtonStyle("#10B981")}><FaSave /> Save</Button>
              <Button onClick={handleCancelClick} bgColor="#EF4444" style={getButtonStyle("#EF4444")}><FaTimesCircle /> Cancel</Button>
            </>
          ) : (
            <>
              <Button onClick={() => handleEditClick(row)} bgColor="#3B82F6" style={getButtonStyle("#3B82F6")}><FaEdit /> Edit</Button>
              <Button onClick={() => handleDeleteClick(row.id)} bgColor="#EF4444" style={getButtonStyle("#EF4444")}><FaTrash /></Button>
            </>
          )}
        </ControlGroup>
      ),
      ignoreRowClick: true,
      button: true,
      minWidth: '220px',
    },
  ], [editingRow, editedRow, getButtonStyle]);

  const schoolFilteredItems = entries.filter(
    (item) => Object.values(item).some(value => String(value).toLowerCase().includes(filterText.toLowerCase()))
  );

  // ------------------ USER MANAGEMENT ------------------
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [editedUser, setEditedUser] = useState({});

  useEffect(() => {
    if (activeTab === "users") {
      setLoadingUsers(true);
      fetch(`${API_BASE}/admin/users`)
        .then((res) => res.json())
        .then((data) => {
          setUsers(data);
          setLoadingUsers(false);
        })
        .catch(() => setLoadingUsers(false));
    }
  }, [activeTab]);

  const handleAddUser = () => {
    if (!newUser.email || !newUser.password || !newUser.name) return alert("Enter name, email & password");
    fetch(`${API_BASE}/admin/users`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser) })
      .then((res) => res.json()).then((data) => {
        if (data.success) {
          setUsers([...users, { ...newUser, id: data.id }]);
          alert(`User (${newUser.email}) added successfully ✅`);
          setNewUser({ name: "", email: "", password: "" });
        } else alert(data.message || "Failed to add user");
      }).catch(() => alert("Something went wrong. Please try again."));
  };
  const handleDeleteUser = async (id) => {
    const userToDelete = users.find((u) => u.id === id);
    if (!window.confirm(`Are you sure to remove ${userToDelete?.email}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({})); // safe json parse

      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        alert("✅ User removed successfully");
      } else {
        alert("⚠️ Failed to remove user");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Server error while removing user");
    }
  };

  const handleEditUser = (u) => { setEditingUser(u.id); setEditedUser({ ...u }); };
  const handleCancelUser = () => { setEditingUser(null); setEditedUser({}); };
  const handleSaveUser = (id) => {
    fetch(`${API_BASE}/admin/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editedUser) })
      .then((res) => res.json()).then((data) => {
        if (data.success) {
          setUsers(users.map((u) => (u.id === id ? editedUser : u)));
          setEditingUser(null);
          alert("User updated successfully ✅");
        } else alert("Failed to update user");
      });
  };

  const userColumns = useMemo(() => [
    { name: "ID", selector: (row) => row.id, sortable: true, width: '100px' },
    {
      name: "Name", selector: (row) => row.name, sortable: true, wrap: true,
      cell: (row) => editingUser === row.id ?
        <Input placeholder="Enter Name" value={editedUser.name} onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })} /> : row.name
    },
    {
      name: "Email (Login)", selector: (row) => row.email, sortable: true, wrap: true,
      cell: (row) => editingUser === row.id ?
        <Input placeholder="Enter Email" value={editedUser.email} onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })} /> : row.email
    },
    {
      name: "Password", selector: (row) => row.password, sortable: true,
      cell: (row) => editingUser === row.id ?
        <Input placeholder="Enter Password" value={editedUser.password} onChange={(e) => setEditedUser({ ...editedUser, password: e.target.value })} /> : row.password
    },
    {
      name: "Actions",
      cell: (row) => (
        <ControlGroup style={{ flexWrap: 'nowrap', margin: 0, gap: '5px' }}>
          {editingUser === row.id ? (
            <>
              <Button onClick={() => handleSaveUser(row.id)} bgColor="#10B981" style={getButtonStyle("#10B981")}><FaSave /> Save</Button>
              <Button onClick={handleCancelUser} bgColor="#EF4444" style={getButtonStyle("#EF4444")}><FaTimesCircle /> Cancel</Button>
            </>
          ) : (
            <>
              <Button onClick={() => handleEditUser(row)} bgColor="#3B82F6" style={getButtonStyle("#3B82F6")}><FaEdit /> Edit</Button>
              <Button onClick={() => handleDeleteUser(row.id)} bgColor="#EF4444" style={getButtonStyle("#EF4444")}><FaTrash /></Button>
            </>
          )}
        </ControlGroup>
      ),
      ignoreRowClick: true,
      button: true,
      minWidth: '220px',
    },
  ], [editingUser, editedUser, getButtonStyle]);

  const userFilteredItems = users.filter(
    (item) => Object.values(item).some(value => String(value).toLowerCase().includes(filterText.toLowerCase()))
  );

  // ------------------ USER SUBMISSIONS ------------------
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (activeTab === "submissions") {
      setLoadingSubmissions(true);
      fetch(`${API_BASE}/admin/form-submissions`)
        .then((res) => res.json())
        .then((data) => {
          setSubmissions(data);
          setLoadingSubmissions(false);
        })
        .catch(() => setLoadingSubmissions(false));
    }
  }, [activeTab]);

  const handleDeleteSubmission = async (ids) => {
    if (!ids || ids.length === 0) {
      alert("No entries selected");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${ids.length} entr${ids.length > 1 ? "ies" : "y"}?`
    );
    if (!confirmed) return;

    try {
      // 🔹 Multiple delete requests in parallel
      const responses = await Promise.allSettled(
        ids.map((id) =>
          fetch(`${API_BASE}/admin/form-submissions/${id}`, { method: "DELETE" })
        )
      );

      // 🔹 Successful deletions filter karo
      const deletedIds = [];
      responses.forEach((res, index) => {
        if (res.status === "fulfilled" && res.value.ok) {
          deletedIds.push(ids[index]);
        }
      });

      // 🔹 Update state
      if (deletedIds.length > 0) {
        setSubmissions((prev) => prev.filter((s) => !deletedIds.includes(s.id)));
        setSelectedSubs([]);
        alert(`Deleted ${deletedIds.length} submission(s) successfully ✅`);
      }

      // 🔹 Agar kuch fail hua
      if (deletedIds.length !== ids.length) {
        alert("⚠️ Some submissions could not be deleted.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("❌ Failed to delete submissions.");
    }
  };

  const updateDeliveredStatus = (markDelivered) => {
    if (selectedSubs.length === 0) return alert("Select at least one entry");
    fetch(`${API_BASE}/admin/mark-delivered`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: selectedSubs, delivered: markDelivered ? "Yes" : "No" }),
    }).then((res) => res.json()).then((data) => {
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
  const toggleSelect = (row) => {
    setSelectedSubs((prev) =>
      prev.includes(row.id) ? prev.filter((x) => x !== row.id) : [...prev, row.id]
    );
  };
  const submissionsFilteredItems = useMemo(() => {
    return submissions.filter((s) => {
      // Date Filtering Logic (Unchanged)
      if (s.submitted_at) {
        const submitted = new Date(s.submitted_at);
        let from = fromDate ? new Date(fromDate) : null;
        let to = toDate ? new Date(toDate) : null;
        if (from && submitted < from) return false;
        if (to) {
          to.setHours(23, 59, 59, 999);
          if (submitted > to) return false;
        }
      }
      // Text Filtering Logic (Unchanged)
      const lowerCaseFilter = filterText.toLowerCase();
      return Object.values(s).some(value => String(value).toLowerCase().includes(lowerCaseFilter));
    });
  }, [submissions, fromDate, toDate, filterText]);
  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(submissionsFilteredItems);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(wb, "submissions.xlsx");
  };

  const submissionColumns = useMemo(() => [
    {
      name: "Select",
      cell: (row) => (
        <input type="checkbox" checked={selectedSubs.includes(row.id)} onChange={() => toggleSelect(row)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} />
      ),
      ignoreRowClick: true,
      button: true,
      width: '80px',
    },
    { name: "ID", selector: (row) => row.id, sortable: true, width: '80px' },
    { name: "School Name", selector: (row) => row.school_name, sortable: true, wrap: true, minWidth: '200px', cell: (row) => <div style={{ lineHeight: "1.6" }}>{row.school_name}</div> },
    { name: "Grade", selector: (row) => row.grade, sortable: true, width: '100px' },
    { name: "Term", selector: (row) => row.term, sortable: true, width: '100px' },
    { name: "Workbook Title", selector: (row) => row.workbook, sortable: true, wrap: true, minWidth: '250px', cell: (row) => <div style={{ lineHeight: "1.6" }}>{row.workbook}</div> },
    { name: "Quantity", selector: (row) => row.count, sortable: true, width: '120px' },
    { name: "Remark", selector: (row) => row.remark, sortable: true, wrap: true, minWidth: '150px' },
    { name: "Submitted By", selector: (row) => row.submitted_by, sortable: true, minWidth: '150px' },
    { name: "Submitted At", selector: (row) => row.submitted_at, sortable: true, minWidth: '150px' },
    { name: "Delivered Status", selector: (row) => row.delivered, sortable: true, width: '170px',
      cell: (row) => (
          <span style={{ fontWeight: 600, color: row.delivered === 'Yes' ? '#10B981' : '#EF4444' }}>
              {row.delivered}
          </span>
      )
    },
  ], [selectedSubs]);

  // ------------------ WORKBOOK STATUS ------------------
  const [workbooks, setWorkbooks] = useState([]);
  const [loadingWorkbooks, setLoadingWorkbooks] = useState(false);
  const [adjustValues, setAdjustValues] = useState({});
  const [newWorkbook, setNewWorkbook] = useState({
    grade: "",
    workbook_name: "",
    quantity: "",
  });

  useEffect(() => {
    if (activeTab === "workbooks") {
      setLoadingWorkbooks(true);
      fetch(`${API_BASE}/admin/workbooks`)
        .then((res) => res.json())
        .then((data) => {
          setWorkbooks(data);
          setLoadingWorkbooks(false);
        })
        .catch(() => setLoadingWorkbooks(false));
    }
  }, [activeTab]);

  const handleDeleteWorkbook = async (id) => {
    if (!window.confirm("Are you sure you want to delete this workbook?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/workbooks/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({})); // safe json parse

      if (data.success) {
        setWorkbooks((prev) => prev.filter((w) => w.id !== id));
        alert("Workbook deleted successfully ✅");
      } else {
        alert("Failed to delete workbook ⚠️");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Server error while deleting workbook ❌");
    }
  };

  const updateQuantity = (id, newQty) => {
    fetch(`${API_BASE}/admin/workbooks/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: newQty }), })
      .then(() => {
        setWorkbooks(workbooks.map((w) => (w.id === id ? { ...w, quantity: newQty } : w)));
        setAdjustValues((prev) => ({ ...prev, [id]: "" }));
        alert("Quantity updated successfully ✅");
      })
      .catch(() => alert("Failed to update quantity."));
  };
  const handleAdjustChange = (id, value) => { setAdjustValues((prev) => ({ ...prev, [id]: value })); };
  const handleAdjustQuantity = (id, type) => {
    const adjust = parseInt(adjustValues[id] || 0, 10);
    if (isNaN(adjust) || adjust <= 0) return alert("Enter a valid positive number");
    const workbook = workbooks.find((w) => w.id === id);
    let newQty = parseInt(workbook.quantity, 10);
    if (type === "add") newQty += adjust;
    if (type === "sub") newQty -= adjust;
    if (newQty < 0) return alert("Quantity cannot be negative.");
    updateQuantity(id, newQty);
  };
  const handleAddWorkbook = () => {
    const { grade, workbook_name, quantity } = newWorkbook;
    if (!grade || !workbook_name || !quantity) return alert("Enter grade, workbook name & quantity");
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) return alert("Enter valid quantity (non-negative number)");
    fetch(`${API_BASE}/admin/workbooks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ grade, workbook_name, quantity: qtyNum }), })
      .then((res) => res.json()).then((data) => {
        if (data.success) {
          setWorkbooks([...workbooks, { ...newWorkbook, id: data.id, quantity: qtyNum }]);
          alert("Workbook added successfully ✅");
          setNewWorkbook({ grade: "", workbook_name: "", quantity: "" });
        } else alert("Failed to add workbook");
      });
  };

  const workbookColumns = useMemo(() => [
    { name: "ID", selector: (row) => row.id, sortable: true, width: '100px' },
    { name: "Grade", selector: (row) => row.grade, sortable: true, width: '100px' },
    { name: "Workbook Name", selector: (row) => row.workbook_name, sortable: true, wrap: true, minWidth: '150px' },
    { name: "Current Stock Qty", selector: (row) => row.quantity, sortable: true, width: '200px' },
    {
      name: "Adjust Stock (New / Delivered)",
      cell: (row) => (
        <ControlGroup style={{ flexWrap: 'nowrap', margin: 0, gap: '5px' }}>
          <Input
            type="number" min="0" placeholder="Qty" value={adjustValues[row.id] || ""} onChange={(e) => handleAdjustChange(row.id, e.target.value)}
            style={{ width: "70px", minWidth: '70px', flexGrow: 0, padding: '8px' }}
          />
          <Button onClick={() => handleAdjustQuantity(row.id, "add")} bgColor="#10B981" style={getButtonStyle("#10B981")} title="Add new stock"><FaPlus style={{marginRight: '0'}} /></Button>
          <Button onClick={() => handleAdjustQuantity(row.id, "sub")} bgColor="#4F46E5" style={getButtonStyle("#4F46E5")} title="Mark as delivered/subtracted"><FaMinus style={{marginRight: '0'}} /></Button>
          <Button onClick={() => handleDeleteWorkbook(row.id)} bgColor="#EF4444" style={{ ...getButtonStyle("#EF4444"), marginLeft: "10px" }}><FaTrash style={{marginRight: '0'}} /></Button>
        </ControlGroup>
      ),
      ignoreRowClick: true,
      button: true,
      minWidth: '350px',
    },
  ], [adjustValues, getButtonStyle]);

  const workbookFilteredItems = workbooks.filter(
    (item) => Object.values(item).some(value => String(value).toLowerCase().includes(filterText.toLowerCase()))
  );


  // --- DataTable Rendering Logic (Memoized) ---
  const dataTable = useMemo(() => {
    let columns = [];
    let data = [];
    let title = "";
    let loading = false;

    if (activeTab === "schools") {
      columns = schoolColumns; data = schoolFilteredItems; title = "School Data Management"; loading = loadingSchools;
    } else if (activeTab === "users") {
      columns = userColumns; data = userFilteredItems; title = "User Account Management"; loading = loadingUsers;
    } else if (activeTab === "submissions") {
      columns = submissionColumns; data = submissionsFilteredItems; title = "Workbook Submission Records"; loading = loadingSubmissions;
    } else if (activeTab === "workbooks") {
      columns = workbookColumns; data = workbookFilteredItems; title = "Workbook Inventory Status"; loading = loadingWorkbooks;
    }

    const handleFilter = (e) => {
      setFilterText(e.target.value);
      setResetPaginationToggle(!resetPaginationToggle);
    };

    const handleClear = () => {
      if (filterText) {
        setResetPaginationToggle(!resetPaginationToggle);
        setFilterText('');
      }
    };

    const SubHeaderComponent = (
      <FilterComponent onFilter={handleFilter} onClear={handleClear} filterText={filterText} />
    );

    return (
      <Card>
        <Title>{title}</Title>
        <StyledDataTable
          columns={columns}
          data={data}
          pagination
          paginationResetDefaultPage={resetPaginationToggle}
          subHeader
          subHeaderComponent={SubHeaderComponent}
          progressPending={loading}
          noDataComponent="No records to display"
          highlightOnHover
          pointerOnHover
          responsive
          dense
        />
      </Card>
    );
  }, [activeTab, loadingSchools, loadingUsers, loadingSubmissions, loadingWorkbooks, schoolColumns, schoolFilteredItems, userColumns, userFilteredItems, submissionColumns, submissionsFilteredItems, workbookColumns, workbookFilteredItems, filterText, resetPaginationToggle]);


  return (
    <Container>
      {/* Header */}
      <Header>
        <LogoContainer>
             {/* Assuming OMOTEC.png exists, otherwise a text fallback is good */}
             {/* <img src="/OMOTEC.png" alt="Logo" style={{ height: 40, width: 160 }} /> */}
             <img src="/OMOTEC.png" alt="Logo" style={{ height: 70, width: 250 }} />
        </LogoContainer>
        <Button onClick={logout} bgColor="#EF4444" style={{ minWidth: '120px' }}>
          <FaSignOutAlt /> Logout
        </Button>
      </Header>

      <div style={{ textAlign: "center", marginBottom: "10px", padding: '10px 0' }}>
        <h1 style={{ color: '#111827', fontSize: '2rem' }}>Welcome <span style={{ color: '#4F46E5', fontWeight: 700 }}>{adminName}</span> </h1>
      </div>

      {/* Tabs */}
      <TabBar>
        {[
          { key: "submissions", label: "User Submissions", icon: <FaClipboardList /> },
          { key: "schools", label: "School Data", icon: <FaSchool /> },
          { key: "users", label: "User Management", icon: <FaUsers /> },
          { key: "workbooks", label: "Workbook Inventory", icon: <FaBookOpen /> }
        ].map((tab) => (
          <Button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setFilterText("");
              setResetPaginationToggle(!resetPaginationToggle);
            }}
            data-active={activeTab === tab.key}
            style={{ minWidth: "160px", minHeight: "50px" }}
          >
            {tab.icon} {tab.label}
          </Button>
        ))}
      </TabBar>

      {/* Conditional Controls Section */}

      {/* Schools Controls */}
      {activeTab === "schools" && (
        <Card style={{ marginTop: '0', padding: '20px' }}>
          <Title style={{ fontSize: '1.4rem' }}>New School Details</Title>
          <ControlGroup style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
            <Input placeholder="School Name " value={newSchool.school_name} onChange={(e) => setNewSchool({ ...newSchool, school_name: e.target.value })} />
            <Input placeholder="Location " value={newSchool.location} onChange={(e) => setNewSchool({ ...newSchool, location: e.target.value })} />
            <Input placeholder="Books Reporting Branch " value={newSchool.reporting_branch} onChange={(e) => setNewSchool({ ...newSchool, reporting_branch: e.target.value })} />
            <Input placeholder="No. of Students " type="number" value={newSchool.num_students} onChange={(e) => setNewSchool({ ...newSchool, num_students: e.target.value })} />
            <Button onClick={handleAddSchool} bgColor="#10B981" style={{ minWidth: '150px' }}><FaPlus /> Add School</Button>
          </ControlGroup>
        </Card>
      )}

      {/* Users Controls */}
      {activeTab === "users" && (
        <Card style={{ marginTop: '0', padding: '20px' }}>
          <Title style={{ fontSize: '1.4rem' }}>Add New User Account</Title>
          <ControlGroup style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
            <Input placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            <Input placeholder="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            <Input placeholder="Password" type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
            <Button onClick={handleAddUser} bgColor="#10B981" style={{ minWidth: '150px' }}><FaPlus /> Add User</Button>
          </ControlGroup>
        </Card>
      )}

      {/* Submissions Controls */}
      {activeTab === "submissions" && (
        <Card style={{ marginTop: '0', padding: '20px' }}>
          <Title style={{ fontSize: '1.4rem' }}>Date Filters & Bulk Actions</Title>
          <ControlGroup style={{ marginBottom: '20px', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ whiteSpace: 'nowrap', fontWeight: 'bold', color: '#4F46E5' }}><FaCalendarAlt /> From Date: </label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ flexGrow: 0, minWidth: '160px', maxWidth: '200px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ whiteSpace: 'nowrap', fontWeight: 'bold', color: '#4F46E5' }}><FaCalendarAlt /> To Date: </label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ flexGrow: 0, minWidth: '160px', maxWidth: '200px' }} />
            </div>
            <Button onClick={() => handleDeleteSubmission(selectedSubs)} bgColor="#EF4444" disabled={selectedSubs.length === 0}>
              <FaTrash /> Delete Selected ({selectedSubs.length})
            </Button>
            <Button onClick={() => updateDeliveredStatus(true)} bgColor="#10B981" disabled={selectedSubs.length === 0}>
              <FaCheck /> Mark Delivered
            </Button>
            <Button onClick={() => updateDeliveredStatus(false)} bgColor="#6B7280" disabled={selectedSubs.length === 0}>
              <FaTimes /> Mark Undelivered
            </Button>
            <Button onClick={downloadExcel} bgColor="#4F46E5">
              <FaDownload /> Download Excel ({submissionsFilteredItems.length} records)
            </Button>
          </ControlGroup>
          
        </Card>
      )}

      {/* Workbooks Controls */}
      {activeTab === "workbooks" && (
        <Card style={{ marginTop: '0', padding: '20px' }}>
          <Title style={{ fontSize: '1.4rem' }}>Add New Workbook Type to Inventory</Title>
          <ControlGroup style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
            <Input
              placeholder="Grade" value={newWorkbook.grade} onChange={(e) => setNewWorkbook({ ...newWorkbook, grade: e.target.value })}
              style={{ flexGrow: 0, minWidth: '100px', maxWidth: '150px' }}
            />
            <Input
              placeholder="Workbook Name" value={newWorkbook.workbook_name} onChange={(e) => setNewWorkbook({ ...newWorkbook, workbook_name: e.target.value })}
            />
            <Input
              placeholder="Initial Stock Qty" type="number" min="0" value={newWorkbook.quantity} onChange={(e) => setNewWorkbook({ ...newWorkbook, quantity: e.target.value })}
              style={{ flexGrow: 0, minWidth: '120px', maxWidth: '180px' }}
            />
            <Button onClick={handleAddWorkbook} bgColor="#10B981" style={{ minWidth: '150px' }}><FaPlus /> Add Workbook</Button>
          </ControlGroup>
        </Card>
      )}

      {/* Data Table */}
      {dataTable}
    </Container>
  );
};

export default AdminDashboard;