import React, { useEffect, useState } from "react";
import { get } from "../utils/api";
import Loader from "./Loader";

export default function HomeworkPortal({ user }) {
  const [homework, setHomework] = useState([]);
  const [filteredHomework, setFilteredHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitForms, setSubmitForms] = useState({});
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedContentType, setSelectedContentType] = useState("all");
  const [selectedVisibility, setSelectedVisibility] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const classes = ["Grade 10", "Grade 11", "Grade 12", "Form 3", "Form 4"];
  const subjects = [
    "Mathematics", "English", "Kiswahili",
    "Biology", "Physics", "Chemistry",
    "History & Citizenship", "Geography",
    "Computer Science", "Business Studies",
    "Agriculture", "Home Science",
    "Art & Design", "Music", "French", "German",
    "CRE", "IRE", "Health Education",
    "Physical Education & Sports", "Life Skills"
  ];
  const contentTypes = [
    { value: "assignment", label: "📋 Assignment", color: "#FF6B6B" },
    { value: "exam", label: "📝 Exam", color: "#4ECDC4" },
    { value: "notes", label: "📖 Notes", color: "#45B7D1" },
    { value: "classwork", label: "✏️ Classwork", color: "#F4A261" },
    { value: "revision", label: "📚 Revision", color: "#9B59B6" }
  ];
  const visibilityOptions = [
    { value: "whole-school", label: "Whole school" },
    { value: "my-class", label: "My class" },
    { value: "selected-classes", label: "Selected classes" },
    { value: "selected-stream", label: "Selected stream" },
    { value: "revision-library", label: "Revision library" }
  ];

  function getAttachmentPreviewType(attachment) {
    const name = (attachment?.originalName || attachment?.name || "").toLowerCase();
    if (/\.pdf$/i.test(name)) return "pdf";
    if (/\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return "image";
    if (/\.(mp4|webm|ogg)$/i.test(name)) return "video";
    if (/\.(mp3|wav|m4a|aac)$/i.test(name)) return "audio";
    return "download";
  }

  function getAttachmentViewUrl(attachment) {
    const rawUrl = attachment?.url || "";
    if (!rawUrl) return "";

    if (rawUrl.includes("cloudinary")) {
      return rawUrl;
    }

    if (rawUrl.includes("drive.google.com")) {
      return rawUrl.replace(/\/view\?usp=sharing$/, "/preview");
    }

    return rawUrl;
  }

  useEffect(() => {
    fetchHomework();
  }, []);

  async function fetchHomework() {
    setLoading(true);
    try {
      const data = await get("/api/homework");
      const sortedData = (Array.isArray(data) ? data : []).sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setHomework(sortedData);
      setFilteredHomework(sortedData);
    } catch (err) {
      console.error("Error fetching homework:", err);
      setError("Failed to load homework");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitHomework(e, homeworkId) {
    e.preventDefault();
    if (!homeworkId) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      const form = submitForms[homeworkId] || { notes: "", files: [] };
      Array.from(form.files || []).forEach((file) => formData.append("attachments", file));
      formData.append("notes", form.notes || "");

      const response = await fetch(`/api/homework/${homeworkId}/submissions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token") || ""}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to submit homework");

      setSuccess("Your submission was sent to the teacher.");
      setSubmitForms((prev) => ({ ...prev, [homeworkId]: { notes: "", files: [] } }));
    } catch (err) {
      setError(err.message || "Failed to submit homework");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    let filtered = homework;

    if (selectedClass !== "all") {
      filtered = filtered.filter(hw => hw.class === selectedClass);
    }

    if (selectedSubject !== "all") {
      filtered = filtered.filter(hw => hw.subject === selectedSubject);
    }

    if (selectedContentType !== "all") {
      filtered = filtered.filter(hw => hw.contentType === selectedContentType);
    }

    if (selectedVisibility !== "all") {
      filtered = filtered.filter(hw => hw.visibility === selectedVisibility);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(hw =>
        `${hw.title} ${hw.description || ""} ${hw.subject} ${hw.topic || ""} ${hw.department || ""}`.toLowerCase().includes(query)
      );
    }

    setFilteredHomework(filtered);
  }, [selectedClass, selectedSubject, selectedContentType, selectedVisibility, searchTerm, homework]);

  if (loading) return <Loader />;

  return (
    <div className="homework-portal" style={{ padding: "20px" }}>
      {/* Hero Section */}
      <div style={{
        position: "relative",
        width: "100vw",
        marginLeft: "50%",
        transform: "translateX(-50%)",
        minHeight: 300,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 40,
        color: "white",
        textAlign: "center",
        padding: "40px 20px"
      }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "10px" }}>📚 Homework & Notes Portal</h1>
          <p style={{ fontSize: "1.2rem", opacity: 0.9 }}>Access all your homework, notes, and study materials</p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        {/* Filters */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginTop: 0 }}>Filter Homework</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="all">All Classes</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="all">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Content Type</label>
              <select
                value={selectedContentType}
                onChange={(e) => setSelectedContentType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="all">All Types</option>
                {contentTypes.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Visibility</label>
              <select
                value={selectedVisibility}
                onChange={(e) => setSelectedVisibility(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="all">All Visibility</option>
                {visibilityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: "15px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, topic, description, department"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ background: "#fee", padding: "15px", borderRadius: "6px", marginBottom: "20px", color: "#c33" }}>
            {error}
          </div>
        )}

        {/* Homework List */}
        {filteredHomework.length === 0 ? (
          <div style={{
            background: "white",
            borderRadius: "8px",
            padding: "40px",
            textAlign: "center",
            color: "#666"
          }}>
            <p style={{ fontSize: "1.1rem" }}>No homework found matching your filters.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {filteredHomework.map(hw => (
              <div
                key={hw._id}
                style={{
                  background: "white",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
              >
                {/* Header */}
                <div style={{ background: "#f8f9fa", padding: "15px", borderBottom: "1px solid #dee2e6" }}>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: "1.1rem" }}>{hw.title}</h3>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "4px 8px",
                      background: contentTypes.find(ct => ct.value === hw.contentType)?.color || "#999",
                      color: "white",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {contentTypes.find(ct => ct.value === hw.contentType)?.label || hw.contentType}
                    </span>
                    <span style={{
                      padding: "4px 8px",
                      background: "#e7f3ff",
                      color: "#0066cc",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {hw.subject}
                    </span>
                    <span style={{
                      padding: "4px 8px",
                      background: "#f0f0f0",
                      color: "#333",
                      borderRadius: "4px",
                      fontSize: "12px"
                    }}>
                      {hw.class}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "15px" }}>
                  <div style={{ marginBottom: "12px" }}>
                    <small style={{ color: "#666" }}>
                      <strong>By:</strong> {hw.teacher?.name || "Unknown"}
                    </small>
                  </div>

                  {hw.description && (
                    <p style={{
                      color: "#555",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      marginBottom: "12px"
                    }}>
                      {hw.description.substring(0, 150)}
                      {hw.description.length > 150 ? "..." : ""}
                    </p>
                  )}

                  {hw.dueDate && (
                    <div style={{ marginBottom: "12px" }}>
                      <small style={{ color: "#d9534f" }}>
                        <strong>Due:</strong> {new Date(hw.dueDate).toLocaleDateString()}
                      </small>
                    </div>
                  )}

                  {/* Files */}
                  {user?.role === "student" && (
                    <form onSubmit={(e) => handleSubmitHomework(e, hw._id)} style={{ marginBottom: "12px", borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Submit your work</div>
                      <textarea
                        value={submitForms[hw._id]?.notes || ""}
                        onChange={(e) => setSubmitForms((prev) => ({ ...prev, [hw._id]: { ...(prev[hw._id] || { files: [] }), notes: e.target.value } }))}
                        placeholder="Add notes for your teacher"
                        style={{ width: "100%", minHeight: "70px", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", marginBottom: "8px" }}
                      />
                      <input
                        type="file"
                        multiple
                        onChange={(e) => setSubmitForms((prev) => ({ ...prev, [hw._id]: { ...(prev[hw._id] || { notes: "" }), files: Array.from(e.target.files || []) } }))}
                        style={{ width: "100%", marginBottom: "8px" }}
                      />
                      <button
                        type="submit"
                        disabled={submitting || !(submitForms[hw._id]?.files || []).length}
                        style={{ width: "100%", padding: "8px 10px", background: submitting || !(submitForms[hw._id]?.files || []).length ? "#9ca3af" : "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: submitting || !(submitForms[hw._id]?.files || []).length ? "not-allowed" : "pointer" }}
                      >
                        {submitting ? "Submitting..." : "Submit to teacher"}
                      </button>
                    </form>
                  )}

                  {hw.attachments && hw.attachments.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <small style={{ color: "#666", display: "block", marginBottom: "8px" }}>
                        <strong>📎 {hw.attachments.length} file{hw.attachments.length !== 1 ? "s" : ""}</strong>
                      </small>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {hw.attachments.map((att, idx) => {
                          const previewType = getAttachmentPreviewType(att);
                          const fileName = att.originalName || att.name || "Attachment";
                          const viewUrl = getAttachmentViewUrl(att);

                          return (
                            <div key={att._id || idx} style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
                              {previewType === "pdf" && (
                                <iframe
                                  title={fileName}
                                  src={viewUrl || att.url}
                                  style={{ width: "100%", height: "220px", border: 0 }}
                                />
                              )}
                              {previewType === "image" && (
                                <img
                                  src={viewUrl || att.url}
                                  alt={fileName}
                                  style={{ width: "100%", maxHeight: "220px", objectFit: "contain", background: "#f8fafc" }}
                                />
                              )}
                              {previewType === "video" && (
                                <video controls style={{ width: "100%", maxHeight: "220px", background: "#000" }}>
                                  <source src={viewUrl || att.url} type={att.mimetype || "video/mp4"} />
                                  Your browser does not support the video tag.
                                </video>
                              )}
                              {previewType === "audio" && (
                                <div style={{ padding: "12px", background: "#f8fafc" }}>
                                  <audio controls style={{ width: "100%" }}>
                                    <source src={viewUrl || att.url} type={att.mimetype || "audio/mpeg"} />
                                    Your browser does not support the audio tag.
                                  </audio>
                                </div>
                              )}
                              <div style={{ display: "flex", gap: "8px", padding: "8px", background: "#f8fafc" }}>
                                <a
                                  href={viewUrl || att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    flex: 1,
                                    padding: "8px 10px",
                                    background: previewType === "download" ? "#007bff" : "#2563eb",
                                    color: "white",
                                    textDecoration: "none",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    textAlign: "center"
                                  }}
                                >
                                  {previewType === "pdf" ? "Open PDF" : previewType === "image" ? "Open image" : previewType === "video" ? "Play video" : previewType === "audio" ? "Play audio" : "Open file"}
                                </a>
                                <a
                                  href={att.url}
                                  download={fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: "8px 10px",
                                    background: "#e5e7eb",
                                    color: "#111827",
                                    textDecoration: "none",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    textAlign: "center"
                                  }}
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{
                  padding: "10px 15px",
                  background: "#f8f9fa",
                  borderTop: "1px solid #dee2e6",
                  fontSize: "12px",
                  color: "#666"
                }}>
                  Uploaded {new Date(hw.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
