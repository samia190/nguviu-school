import React, { useEffect, useState } from "react";
import { get, post, put, del } from "../../utils/api";
import Loader from "../Loader";

export default function HomeworkManagement({ user }) {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    class: "Form 1",
    contentType: "assignment",
    dueDate: "",
    status: "published"
  });

  const classes = ["Form 1", "Form 2", "Form 3", "Form 4"];
  const subjects = ["Mathematics", "English", "Science", "History", "Geography", "Kiswahili", "Arts", "Physical Education"];
  const contentTypes = [
    { value: "assignment", label: "📋 Assignment" },
    { value: "exam", label: "📝 Exam" },
    { value: "notes", label: "📖 Notes" },
    { value: "classwork", label: "✏️ Classwork" }
  ];

  useEffect(() => {
    fetchHomework();
  }, []);

  async function fetchHomework() {
    setLoading(true);
    try {
      const data = await get("/api/homework?status=published&status=draft");
      setHomework(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching homework:", err);
      setError("Failed to load homework");
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e) {
    setAttachmentFiles(Array.from(e.target.files || []));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("subject", form.subject);
      formData.append("class", form.class);
      formData.append("contentType", form.contentType);
      formData.append("dueDate", form.dueDate);
      formData.append("status", form.status);

      attachmentFiles.forEach(file => {
        formData.append("attachments", file);
      });

      if (editingId) {
        await put(`/api/homework/${editingId}`, formData);
        setSuccess("Homework updated!");
      } else {
        await post("/api/homework", formData);
        setSuccess("Homework added!");
      }

      setForm({ title: "", description: "", subject: "", class: "Form 1", contentType: "assignment", dueDate: "", status: "published" });
      setAttachmentFiles([]);
      setShowForm(false);
      setEditingId(null);
      fetchHomework();
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item) {
    setEditingId(item._id);
    setForm({
      title: item.title,
      description: item.description || "",
      subject: item.subject,
      class: item.class,
      contentType: item.contentType || "assignment",
      dueDate: item.dueDate ? item.dueDate.split("T")[0] : "",
      status: item.status
    });
    setAttachmentFiles([]);
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this homework?")) return;
    try {
      await del(`/api/homework/${id}`);
      setSuccess("Deleted!");
      fetchHomework();
    } catch (err) {
      setError("Failed to delete");
    }
  }

  async function handleDeleteAttachment(homeworkId, attachmentId) {
    if (!confirm("Delete this attachment?")) return;
    try {
      await del(`/api/homework/${homeworkId}/attachments/${attachmentId}`);
      setSuccess("Attachment deleted!");
      fetchHomework();
    } catch (err) {
      setError("Failed to delete attachment");
    }
  }

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>📚 Homework & Notes Management</h1>
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
          {showForm ? "✖ Cancel" : "➕ Add Homework"}
        </button>
      </div>

      {error && <div style={{ background: "#fee", padding: "15px", borderRadius: "6px", marginBottom: "20px", color: "#c33" }}>{error}</div>}
      {success && <div style={{ background: "#efe", padding: "15px", borderRadius: "6px", marginBottom: "20px", color: "#3c3" }}>{success}</div>}

      {showForm && (
        <div style={{ background: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "20px", marginBottom: "30px" }}>
          <h3>{editingId ? "Edit Homework" : "Add Homework"}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                  placeholder="Homework title"
                />
              </div>
              <div>
                <label>Subject *</label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleFormChange}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <option value="">Select subject</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label>Class *</label>
                <select
                  name="class"
                  value={form.class}
                  onChange={handleFormChange}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label>Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleFormChange}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", minHeight: "100px" }}
                placeholder="Assignment details"
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label>Attachments (PDF, DOC, Images)</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
              {attachmentFiles.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <small>Selected files: {attachmentFiles.map(f => f.name).join(", ")}</small>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving || !form.title || !form.subject}
              style={{
                padding: "10px 20px",
                background: saving ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              {saving ? "Saving..." : "Save Homework"}
            </button>
          </form>
        </div>
      )}

      {/* Homework List */}
      <div style={{ background: "white", borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>Title</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Subject</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Class</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Teacher</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Due Date</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Files</th>
                <th style={{ padding: "12px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {homework.map(hw => (
                <tr key={hw._id} style={{ borderBottom: "1px solid #dee2e6" }}>
                  <td style={{ padding: "12px" }}>{hw.title}</td>
                  <td style={{ padding: "12px" }}>{hw.subject}</td>
                  <td style={{ padding: "12px" }}>{hw.class}</td>
                  <td style={{ padding: "12px" }}>{hw.teacher?.name || "N/A"}</td>
                  <td style={{ padding: "12px" }}>
                    {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "-"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {hw.attachments?.length || 0} files
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <button
                      onClick={() => handleEdit(hw)}
                      style={{ padding: "6px 12px", marginRight: "6px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(hw._id)}
                      style={{ padding: "6px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Show attached files when editing */}
      {editingId && homework.find(hw => hw._id === editingId)?.attachments?.length > 0 && (
        <div style={{ marginTop: "30px", background: "white", borderRadius: "8px", padding: "20px" }}>
          <h3>Current Attachments</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
            {homework.find(hw => hw._id === editingId).attachments.map(att => (
              <div key={att._id} style={{ border: "1px solid #ddd", padding: "10px", borderRadius: "4px" }}>
                <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>{att.originalName}</p>
                <small style={{ color: "#666" }}>{(att.size / 1024 / 1024).toFixed(2)} MB</small>
                <div style={{ marginTop: "10px" }}>
                  <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", background: "#28a745", color: "white", textDecoration: "none", borderRadius: "4px", marginRight: "6px" }}>
                    Download
                  </a>
                  <button
                    onClick={() => handleDeleteAttachment(editingId, att._id)}
                    style={{ padding: "6px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
