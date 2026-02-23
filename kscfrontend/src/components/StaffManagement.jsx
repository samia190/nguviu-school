import React, { useEffect, useState } from "react";
import { get, post, put, del, upload } from "../utils/api";
import Loader from "./Loader";

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [photoFile, setPhotoFile] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    title: "",
    type: "teacher",
    department: "",
    remarks: "",
    email: "",
    phone: "",
    qualifications: "",
    experience: "",
    displayOrder: 0
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    setError("");
    try {
      const data = await get("/api/staff");
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError("Failed to load staff members");
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handlePhotoChange(e) {
    setPhotoFile(e.target.files[0] || null);
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
      const data = {
        fullName: form.fullName,
        title: form.title,
        type: form.type,
        department: form.department,
        remarks: form.remarks,
        email: form.email,
        phone: form.phone,
        qualifications: form.qualifications,
        experience: form.experience,
        displayOrder: form.displayOrder
      };

      if (photoUrl) {
        data.photoUrl = photoUrl;
      }

      if (editingId) {
        await put(`/api/staff/${editingId}`, data);
        setSuccess("Staff member updated successfully!");
      } else {
        await post("/api/staff", data);
        setSuccess("Staff member added successfully!");
      }

      // Reset form
      setForm({
        fullName: "",
        title: "",
        type: "teacher",
        department: "",
        remarks: "",
        email: "",
        phone: "",
        qualifications: "",
        experience: "",
        displayOrder: 0
      });
      setPhotoFile(null);
      setShowForm(false);
      setEditingId(null);
      fetchStaff();
    } catch (err) {
      console.error("Error saving staff:", err);
      setError(err.message || "Failed to save staff member");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(staffMember) {
    setEditingId(staffMember._id);
    setForm({
      fullName: staffMember.fullName,
      title: staffMember.title,
      type: staffMember.type,
      department: staffMember.department || "",
      remarks: staffMember.remarks || "",
      email: staffMember.email || "",
      phone: staffMember.phone || "",
      qualifications: staffMember.qualifications || "",
      experience: staffMember.experience || "",
      displayOrder: staffMember.displayOrder || 0
    });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    try {
      await del(`/api/staff/${id}`);
      setSuccess("Staff member deleted successfully!");
      fetchStaff();
    } catch (err) {
      console.error("Error deleting staff:", err);
      setError("Failed to delete staff member");
    }
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setPhotoFile(null);
    setForm({
      fullName: "",
      title: "",
      type: "teacher",
      department: "",
      remarks: "",
      email: "",
      phone: "",
      qualifications: "",
      experience: "",
      displayOrder: 0
    });
  }

  const filteredStaff = filterType === "all" 
    ? staff 
    : staff.filter(s => s.type === filterType);

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <h1 style={{ margin: 0 }}>👨‍💼 Staff Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "12px 24px",
            background: showForm ? "#dc3545" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          {showForm ? "✖ Cancel" : "➕ Add Staff Member"}
        </button>
      </div>

      {error && (
        <div style={{
          background: "#fee",
          border: "1px solid #fcc",
          borderRadius: "6px",
          padding: "15px",
          marginBottom: "20px",
          color: "#c33"
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: "#efe",
          border: "1px solid #cfc",
          borderRadius: "6px",
          padding: "15px",
          marginBottom: "20px",
          color: "#3c3"
        }}>
          {success}
        </div>
      )}

      {showForm && (
        <div style={{
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3>
            {editingId ? "Edit Staff Member" : "Add New Staff Member"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleFormChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g., Principal, Deputy Principal, Head of Mathematics"
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label>Type *</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="principal">Principal</option>
                  <option value="deputy_principal">Deputy Principal</option>
                  <option value="head_of_department">Head of Department</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              <div>
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={form.department}
                  onChange={handleFormChange}
                  placeholder="e.g., Mathematics, English"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label>Qualifications</label>
                <input
                  type="text"
                  name="qualifications"
                  value={form.qualifications}
                  onChange={handleFormChange}
                  placeholder="e.g., B.Sc. Mathematics, M.Ed."
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label>Experience</label>
                <input
                  type="text"
                  name="experience"
                  value={form.experience}
                  onChange={handleFormChange}
                  placeholder="e.g., 10 years in education"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label>Display Order</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={form.displayOrder}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label>Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{
                    width: "100%",
                    padding: "10px"
                  }}
                />
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label>Remarks</label>
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleFormChange}
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "12px 24px",
                  background: saving ? "#ccc" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: saving ? "not-allowed" : "pointer"
                }}
              >
                {saving ? "Saving..." : editingId ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "12px 24px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div style={{ marginBottom: "20px" }}>
        <label>Filter by Type: </label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px"
          }}
        >
          <option value="all">All Staff</option>
          <option value="principal">Principal</option>
          <option value="deputy_principal">Deputy Principal</option>
          <option value="head_of_department">Head of Department</option>
          <option value="teacher">Teacher</option>
        </select>
      </div>

      {/* Staff List */}
      <div style={{ display: "grid", gap: "20px" }}>
        {filteredStaff.length === 0 ? (
          <p>No staff members found.</p>
        ) : (
          filteredStaff.map(member => (
            <div
              key={member._id}
              style={{
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "20px",
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "20px",
                alignItems: "start"
              }}
            >
              {/* Photo */}
              <div style={{ width: "100px" }}>
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.fullName}
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "8px",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      background: "#e0e0e0",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    No photo
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                <h4 style={{ margin: 0, marginBottom: "5px" }}>{member.fullName}</h4>
                <p style={{ margin: "3px 0", color: "#666" }}>
                  <strong>{member.title}</strong> • {member.type.replace("_", " ").toUpperCase()}
                </p>
                {member.department && (
                  <p style={{ margin: "3px 0", color: "#666" }}>Department: {member.department}</p>
                )}
                {member.email && (
                  <p style={{ margin: "3px 0", color: "#666" }}>{member.email}</p>
                )}
                {member.remarks && (
                  <p style={{ margin: "8px 0", fontStyle: "italic", color: "#555" }}>
                    Remarks: {member.remarks}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
                <button
                  onClick={() => handleEdit(member)}
                  style={{
                    padding: "8px 16px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(member._id)}
                  style={{
                    padding: "8px 16px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                   Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}