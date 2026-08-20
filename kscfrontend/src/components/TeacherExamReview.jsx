import React, { useEffect, useState } from "react";
import { X, FileText, Download, Pencil, CheckCircle2, XCircle } from "lucide-react";
import { get, put } from "../utils/api";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function TeacherExamReview({ exam, onClose }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingFileId, setEditingFileId] = useState(null);
  const [editState, setEditState] = useState({ originalName: "", reviewerNotes: "", status: "pending", notes: "" });
  const [reviewPackage, setReviewPackage] = useState(null);

  const loadFiles = async () => {
    if (!exam?._id) return;
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/exams/${exam._id}/working-files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load student work");
      const data = await res.json();
      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch (err) {
      console.error("Error loading working files:", err);
      setError(err.message || "Unable to load student work");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [exam]);

  const groupedByStudent = files.reduce((acc, file) => {
    const studentKey = file.sessionId || file.studentEmail || file.studentName || "unknown";
    const studentName = file.studentName || file.studentEmail || "Unknown student";
    const studentEmail = file.studentEmail || "";
    const questionText = file.questionText || "General attachment";

    if (!acc[studentKey]) {
      acc[studentKey] = { studentName, studentEmail, items: [] };
    }
    acc[studentKey].items.push({ ...file, questionText });
    return acc;
  }, {});

  const startEdit = (file) => {
    setEditingFileId(file._id);
    setEditState({
      originalName: file.originalName || file.filename || "",
      reviewerNotes: file.reviewerNotes || "",
      status: file.status || "pending",
      notes: file.notes || "",
    });
  };

  const cancelEdit = () => {
    setEditingFileId(null);
    setEditState({ originalName: "", reviewerNotes: "", status: "pending", notes: "" });
  };

  const saveFileReview = async (fileId) => {
    try {
      await put(`/api/submissions/${fileId}`, {
        status: editState.status,
        reviewerNotes: editState.reviewerNotes,
        originalName: editState.originalName,
        notes: editState.notes,
      });
      cancelEdit();
      const refreshed = await fetch(`/api/exams/${exam._id}/working-files`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` },
      });
      const data = await refreshed.json();
      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch (err) {
      console.error("Failed to save review changes:", err);
      setError(err.message || "Could not save review changes");
    }
  };

  const updateFileStatus = async (fileId, status) => {
    try {
      await put(`/api/submissions/${fileId}`, { status });
      const refreshed = await fetch(`/api/exams/${exam._id}/working-files`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` },
      });
      const data = await refreshed.json();
      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(err.message || "Could not update status");
    }
  };

  const loadReviewPackage = async (sessionId) => {
    if (!sessionId) return;
    try { setError(null); setReviewPackage(await get(`/api/exam-papers/sessions/${sessionId}/review`)); }
    catch (err) { setError(err?.body?.error || "Unable to load the exact paper and answers."); }
  };

  return (
    <div style={{ marginTop: 36, padding: 24, border: "1px solid #d1d5db", borderRadius: 14, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Review Student Working for “{exam.title}”</h2>
          <p style={{ margin: "8px 0 0", color: "#4b5563" }}>Review uploaded working files grouped by student and question.</p>
        </div>
        <button onClick={onClose} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#ef4444", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
          <X size={16} /> Close
        </button>
      </div>

      {loading && <p>Loading student work...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loading && !error && files.length === 0 && (
        <p style={{ color: "#475569" }}>No student working files have been uploaded for this exam yet.</p>
      )}

      {!loading && files.length > 0 && (
        <div style={{ display: "grid", gap: 20 }}>
          {Object.entries(groupedByStudent).map(([studentKey, studentGroup]) => (
            <div key={studentKey} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", marginBottom: 18 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20 }}>{studentGroup.studentName}</h3>
                  {studentGroup.studentEmail && <p style={{ margin: "6px 0 0", color: "#475569" }}>{studentGroup.studentEmail}</p>}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" onClick={loadFiles} style={{ padding: "10px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                    Refresh
                  </button>
                  {studentKey !== "unknown" && <button type="button" onClick={() => loadReviewPackage(studentKey)} style={{ padding: "10px 16px", background: "#0f766e", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Open exact paper & answers</button>}
                </div>
              </div>

              {reviewPackage?.session?._id === studentKey && <div style={{ marginBottom: 18, padding: 16, border: "1px solid #99f6e4", borderRadius: 10, background: "#f0fdfa" }}><h4 style={{ marginTop: 0 }}>Paper version {reviewPackage.paper?.version || "legacy"} and saved answers</h4>{reviewPackage.paper?.renderedHtml ? <div dangerouslySetInnerHTML={{ __html: reviewPackage.paper.renderedHtml }} /> : <p>There is no Word-paper snapshot for this legacy session.</p>}<h5>Student answers</h5><ol>{(reviewPackage.session.answers || []).map((answer) => <li key={answer.questionId}>{typeof answer.answer === "string" ? answer.answer : "[Submitted answer]"}</li>)}</ol></div>}

              <div style={{ display: "grid", gap: 16 }}>
                {studentGroup.items.map((file) => {
                  const isEditing = editingFileId === file._id;
                  return (
                    <div key={file._id} style={{ padding: 18, border: "1px solid #cbd5e1", borderRadius: 12, background: "white" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}><strong>Question:</strong> {file.questionText}</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 8 }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "#111" }}>
                              <FileText size={16} />
                              <strong>{file.originalName || file.filename}</strong>
                            </div>
                            <span style={{ padding: "4px 10px", borderRadius: 999, background: file.status === "approved" ? "#dcfce7" : file.status === "rejected" ? "#fee2e2" : "#e2e8f0", color: file.status === "approved" ? "#166534" : file.status === "rejected" ? "#991b1b" : "#475569", fontSize: 12, fontWeight: 600 }}>
                              {file.status || "pending"}
                            </span>
                          </div>
                          <p style={{ margin: "10px 0 0", color: "#475569" }}><strong>Uploaded:</strong> {new Date(file.uploadedAt || Date.now()).toLocaleString()}</p>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <a href={file.downloadUrl || file.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#2563eb", color: "white", borderRadius: 8, textDecoration: "none" }}>
                            <Download size={16} /> Download
                          </a>
                          <button type="button" onClick={() => startEdit(file)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                            <Pencil size={16} /> Edit
                          </button>
                          <button type="button" onClick={() => updateFileStatus(file._id, "approved")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                            <CheckCircle2 size={16} /> Approve
                          </button>
                          <button type="button" onClick={() => updateFileStatus(file._id, "rejected")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#dc2626", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                            <XCircle size={16} /> Reject
                          </button>
                        </div>
                      </div>

                      {isEditing && (
                        <div style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12, background: "#f8fafc" }}>
                          <div style={{ display: "grid", gap: 12 }}>
                            <label style={{ display: "grid", gap: 6 }}>
                              File label
                              <input
                                type="text"
                                value={editState.originalName}
                                onChange={(e) => setEditState({ ...editState, originalName: e.target.value })}
                                style={{ width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }}
                              />
                            </label>
                            <label style={{ display: "grid", gap: 6 }}>
                              Reviewer notes
                              <textarea
                                value={editState.reviewerNotes}
                                onChange={(e) => setEditState({ ...editState, reviewerNotes: e.target.value })}
                                rows={4}
                                style={{ width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }}
                              />
                            </label>
                            <label style={{ display: "grid", gap: 6 }}>
                              Public notes
                              <textarea
                                value={editState.notes}
                                onChange={(e) => setEditState({ ...editState, notes: e.target.value })}
                                rows={2}
                                style={{ width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }}
                              />
                            </label>
                            <label style={{ display: "grid", gap: 6 }}>
                              Review status
                              <select
                                value={editState.status}
                                onChange={(e) => setEditState({ ...editState, status: e.target.value })}
                                style={{ width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }}
                              >
                                {STATUS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
                            <button type="button" onClick={() => saveFileReview(file._id)} style={{ padding: "10px 18px", background: "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                              Save Review
                            </button>
                            <button type="button" onClick={cancelEdit} style={{ padding: "10px 18px", background: "#6b7280", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
