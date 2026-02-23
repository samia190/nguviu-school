import React, { useEffect, useState } from "react";
import { get, post, put, del, upload } from "../utils/api";
import Loader from "./Loader";

export default function StudentAdminManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [photoFile, setPhotoFile] = useState(null);

  const [form, setForm] = useState({
    admissionNumber: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "Female",
    class: "",
    stream: "",
    email: "",
    phoneNumber: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianRelationship: "",
    county: "",
    status: "Active"
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const params = searchTerm ? `?searchTerm=${searchTerm}` : "";
      const data = await get(`/api/admin/students${params}`);
      setStudents(data.students || []);
    } catch (err) {
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let photoUrl = null;

      // Upload photo separately if provided
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        try {
          const uploadedFile = await upload("/api/files/upload", fd);
          photoUrl = uploadedFile.url || uploadedFile.downloadUrl;
        } catch (uploadErr) {
          setError("Failed to upload photo: " + (uploadErr.message || "Unknown error"));
          setSaving(false);
          return;
        }
      }

      // Prepare JSON data
      const data = { ...form };
      if (photoUrl) {
        data.photoUrl = photoUrl;
      }

      if (editingId) {
        await put(`/api/admin/students/${editingId}`, data);
        setSuccess("Student updated!");
      } else {
        await post("/api/admin/students", data);
        setSuccess("Student added!");
      }

      setForm({
        admissionNumber: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "Female",
        class: "",
        stream: "",
        email: "",
        phoneNumber: "",
        guardianName: "",
        guardianPhone: "",
        guardianEmail: "",
        guardianRelationship: "",
        county: "",
        status: "Active"
      });
      setPhotoFile(null);
      setShowForm(false);
      setEditingId(null);
      fetchStudents();
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(student) {
    setEditingId(student._id);
    setForm({
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
      gender: student.gender,
      class: student.class,
      stream: student.stream || "",
      email: student.email || "",
      phoneNumber: student.phoneNumber || "",
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      guardianEmail: student.guardianEmail || "",
      guardianRelationship: student.guardianRelationship || "",
      county: student.county || "",
      status: student.status
    });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this student?")) return;
    try {
      await del(`/api/admin/students/${id}`);
      setSuccess("Deleted!");
      fetchStudents();
    } catch (err) {
      setError("Failed");
    }
  }

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <h1>👨‍🎓 Student Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "12px 24px",
            background: showForm ? "#dc3545" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          {showForm ? "Cancel" : "Add Student"}
        </button>
      </div>

      {error && <div style={{ background: "#fee", padding: "12px", marginBottom: "15px", color: "#c33", borderRadius: "4px" }}>{error}</div>}
      {success && <div style={{ background: "#efe", padding: "12px", marginBottom: "15px", color: "#3c3", borderRadius: "4px" }}>{success}</div>}

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search by admission number, name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
        />
      </div>

      {showForm && (
        <div style={{ background: "white", border: "1px solid #ddd", padding: "20px", marginBottom: "30px", borderRadius: "8px" }}>
          <h3>{editingId ? "Edit Student" : "Add New Student"}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <input type="text" name="admissionNumber" placeholder="Admission #*" value={form.admissionNumber} onChange={handleFormChange} required disabled={!!editingId} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <input type="text" name="firstName" placeholder="First Name*" value={form.firstName} onChange={handleFormChange} required style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <input type="text" name="lastName" placeholder="Last Name*" value={form.lastName} onChange={handleFormChange} required style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleFormChange} required style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <select name="gender" value={form.gender} onChange={handleFormChange} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
              <input type="text" name="class" placeholder="Class*" value={form.class} onChange={handleFormChange} required style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <input type="text" name="stream" placeholder="Stream" value={form.stream} onChange={handleFormChange} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleFormChange} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <input type="text" name="guardianName" placeholder="Guardian Name*" value={form.guardianName} onChange={handleFormChange} required style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <input type="tel" name="guardianPhone" placeholder="Guardian Phone*" value={form.guardianPhone} onChange={handleFormChange} required style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <input type="email" name="guardianEmail" placeholder="Guardian Email" value={form.guardianEmail} onChange={handleFormChange} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <input type="text" name="county" placeholder="County" value={form.county} onChange={handleFormChange} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <select name="status" value={form.status} onChange={handleFormChange} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Graduated">Graduated</option>
                <option value="Transferred">Transferred</option>
              </select>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} style={{ padding: "8px" }} />
            </div>
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button type="submit" disabled={saving} style={{ padding: "10px 20px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Admission #</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Class</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Email</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Guardian</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student._id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px" }}>{student.admissionNumber}</td>
                <td style={{ padding: "10px" }}>{student.firstName} {student.lastName}</td>
                <td style={{ padding: "10px" }}>{student.class}</td>
                <td style={{ padding: "10px", fontSize: "12px" }}>{student.email || "-"}</td>
                <td style={{ padding: "10px", fontSize: "12px" }}>{student.guardianName}</td>
                <td style={{ padding: "10px" }}><span style={{ padding: "4px 8px", background: student.status === "Active" ? "#d4edda" : "#f8d7da", borderRadius: "4px", fontSize: "11px" }}>{student.status}</span></td>
                <td style={{ padding: "10px", textAlign: "center" }}>
                  <button onClick={() => handleEdit(student)} style={{ padding: "4px 8px", background: "#0069d9", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "5px", fontSize: "11px" }}>Edit</button>
                  <button onClick={() => handleDelete(student._id)} style={{ padding: "4px 8px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: "15px", color: "#666", fontSize: "12px" }}>Total: {students.length} student{students.length !== 1 ? "s" : ""}</p>
    </div>
  );
}
