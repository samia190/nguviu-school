import React, { useEffect, useState } from "react";
import { get, post, put, del, upload } from "../utils/api";
import Loader from "./Loader";

export default function TeacherHomework({ user }) {
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
    if (user?._id) {
      fetchMyHomework();
    }
  }, [user]);

  async function fetchMyHomework() {
    setLoading(true);
    try {
      const data = await get(`/api/homework?teacher=${user._id}`);
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
      // Validate attachments
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const validDocTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip', 'application/x-zip-compressed'];
      const allowedTypes = [...validImageTypes, ...validDocTypes];
      const maxFileSize = 50 * 1024 * 1024; // 50MB per file
      
      const failedFiles = [];
      for (const file of attachmentFiles) {
        if (!allowedTypes.includes(file.type)) {
          failedFiles.push(`${file.name} (invalid type)`);
        }
        if (file.size > maxFileSize) {
          failedFiles.push(`${file.name} (exceeds 50MB)`);
        }
      }
      
      if (failedFiles.length > 0) {
        setError(`File validation failed: ${failedFiles.join(', ')}`);
        setSaving(false);
        return;
      }

      // Build FormData with files
      const formData = new FormData();
      attachmentFiles.forEach(file => {
        formData.append("attachments", file);
      });

      // Build JSON body with metadata
      const bodyData = {
        title: form.title,
        description: form.description,
        subject: form.subject,
        class: form.class,
        contentType: form.contentType,
        dueDate: form.dueDate,
        status: form.status
      };

      if (editingId) {
        // Update: first update metadata with PUT, then upload files with upload()
        await put(`/api/homework/${editingId}`, bodyData);
        if (attachmentFiles.length > 0) {
          await upload(`/api/homework/${editingId}/attachments`, formData);
        }
        setSuccess("Homework updated!");
      } else {
        // Create: first upload files, then get return data
        let uploadResult = { _id: null };
        if (attachmentFiles.length > 0) {
          formData.append("title", bodyData.title);
          formData.append("description", bodyData.description);
          formData.append("subject", bodyData.subject);
          formData.append("class", bodyData.class);
          formData.append("contentType", bodyData.contentType);
          formData.append("dueDate", bodyData.dueDate);
          formData.append("status", bodyData.status);
          uploadResult = await upload("/api/homework", formData);
        } else {
          // No files, just POST metadata
          uploadResult = await post("/api/homework", bodyData);
        }
        setSuccess("Homework uploaded successfully!");
      }

      setForm({ title: "", description: "", subject: "", class: "Form 1", contentType: "assignment", dueDate: "", status: "published" });
      setAttachmentFiles([]);
      setShowForm(false);
      setEditingId(null);
      fetchMyHomework();
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
      setSuccess("Homework deleted!");
      fetchMyHomework();
    } catch (err) {
      setError("Failed to delete");
    }
  }

  async function handleDeleteAttachment(homeworkId, attachmentId) {
    if (!confirm("Delete this attachment?")) return;
    try {
      await del(`/api/homework/${homeworkId}/attachments/${attachmentId}`);
      setSuccess("Attachment deleted!");
      fetchMyHomework();
    } catch (err) {
      setError("Failed to delete attachment");
    }
  }

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>📚 My Homework & Notes</h1>
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
          {showForm ? "✖ Cancel" : "➕ Upload Homework"}
        </button>
      </div>

      {error && <div style={{ background: "#fee", padding: "15px", borderRadius: "6px", marginBottom: "20px", color: "#c33" }}>{error}</div>}
      {success && <div style={{ background: "#efe", padding: "15px", borderRadius: "6px", marginBottom: "20px", color: "#3c3" }}>{success}</div>}

      {showForm && (
        <div style={{ background: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "20px", marginBottom: "30px" }}>
          <h3>{editingId ? "Edit Homework" : "Upload New Homework/Notes"}</h3>
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
                  placeholder="e.g., Chapter 5 Homework"
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
                <label>Content Type *</label>
                <select
                  name="contentType"
                  value={form.contentType}
                  onChange={handleFormChange}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  {contentTypes.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
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
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", minHeight: "100px" }}
                placeholder="Assignment instructions and details"
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label>Upload Files (PDF, DOC, Images, ZIP) *</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                required
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
              {attachmentFiles.length > 0 && (
                <div style={{ marginTop: "10px", padding: "10px", background: "#f0f0f0", borderRadius: "4px" }}>
                  <small><strong>Selected files:</strong></small>
                  <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                    {attachmentFiles.map((f, i) => (
                      <li key={i}>{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving || !form.title || !form.subject || attachmentFiles.length === 0}
              style={{
                padding: "10px 20px",
                background: saving ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              {saving ? "Uploading..." : "Upload Homework"}
            </button>
          </form>
        </div>
      )}

      {/* My Homework List */}
      <div style={{ background: "white", borderRadius: "8px", overflow: "hidden" }}>
        {homework.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#666" }}>
            <p>No homework uploaded yet. Click "Upload Homework" to get started!</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Title</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Subject</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Class</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Due Date</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Files</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {homework.map(hw => (
                  <tr key={hw._id} style={{ borderBottom: "1px solid #dee2e6" }}>
                    <td style={{ padding: "12px" }}>{hw.title}</td>
                    <td style={{ padding: "12px" }}>{hw.subject}</td>
                    <td style={{ padding: "12px" }}>{hw.class}</td>
                    <td style={{ padding: "12px" }}>
                      {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {hw.attachments?.length || 0}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        padding: "4px 8px",
                        background: hw.status === "published" ? "#d4edda" : "#fff3cd",
                        color: hw.status === "published" ? "#155724" : "#856404",
                        borderRadius: "4px",
                        fontSize: "12px"
                      }}>
                        {hw.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button
                        onClick={() => handleEdit(hw)}
                        style={{ padding: "6px 12px", marginRight: "6px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(hw._id)}
                        style={{ padding: "6px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Show attached files when editing */}
      {editingId && homework.find(hw => hw._id === editingId)?.attachments?.length > 0 && (
        <div style={{ marginTop: "30px", background: "white", borderRadius: "8px", padding: "20px" }}>
          <h3>Current Attachments</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
            {homework.find(hw => hw._id === editingId).attachments.map(att => (
              <div key={att._id} style={{ border: "1px solid #ddd", padding: "10px", borderRadius: "4px" }}>
                <p style={{ margin: "0 0 10px 0", fontWeight: "bold", fontSize: "14px" }}>{att.originalName}</p>
                <small style={{ color: "#666" }}>{(att.size / 1024 / 1024).toFixed(2)} MB</small>
                <div style={{ marginTop: "10px", display: "flex", gap: "6px" }}>
                  <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", background: "#28a745", color: "white", textDecoration: "none", borderRadius: "4px", fontSize: "12px", flex: 1, textAlign: "center" }}>
                    Download
                  </a>
                  <button
                    onClick={() => handleDeleteAttachment(editingId, att._id)}
                    style={{ padding: "6px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
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
