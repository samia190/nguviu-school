import React, { useEffect, useState } from "react";
import { Activity, AlertTriangle, Clock3, Eye, BarChart3, Settings } from "lucide-react";
import { get, post, put, del, upload, getToken } from "../utils/api";
import Loader from "./Loader";
import TeacherExamReview from "./TeacherExamReview";
import LiveInvigilation from "./LiveInvigilation";
import TeacherWordPaperPanel from "./TeacherWordPaperPanel";

const initialExamForm = {
  title: "",
  subject: "",
  description: "",
  duration: 60,
  totalMarks: 100,
  passThreshold: 50,
  proctoringLevel: "moderate",
  trustScoreThreshold: 50,
  allowedMaterials: "",
  scheduledStart: "",
  scheduledEnd: "",
  instructions: "",
  pdfUrl: "",
  attachments: [],
};

export default function TeacherExamManagement({ user }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialExamForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ message: "", error: false });
  const [reviewExam, setReviewExam] = useState(null);
  const [paperExam, setPaperExam] = useState(null);
  const [monitoringSessions, setMonitoringSessions] = useState([]);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("exams"); // "exams" or "invigilation"
  const [teacherTimetables, setTeacherTimetables] = useState([]);

  useEffect(() => {
    if (user && (user._id || user.id) && getToken()) {
      fetchMyExams();
      fetchMonitoringSessions();
      get("/api/timetables/mine").then((data) => setTeacherTimetables(data.timetables || [])).catch(() => setTeacherTimetables([]));
    }
  }, [user]);

  useEffect(() => {
    if (!user || !(user._id || user.id) || !getToken()) return;
    const interval = setInterval(() => {
      fetchMonitoringSessions();
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (monitoringSessions.length > 0 && (!selectedSessionId || !monitoringSessions.some((session) => session._id === selectedSessionId))) {
      setSelectedSessionId(monitoringSessions[0]._id);
    }
  }, [monitoringSessions, selectedSessionId]);

  const fetchMyExams = async () => {
    setLoading(true);
    try {
      const data = await get("/api/exams/mine");
      setExams(Array.isArray(data.exams) ? data.exams : []);
      setStatus({ message: "", error: false });
    } catch (err) {
      console.error(err);
      setStatus({ message: "Failed to load exams.", error: true });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonitoringSessions = async () => {
    try {
      setMonitoringLoading(true);
      const data = await get("/api/exams/sessions/monitoring");
      setMonitoringSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (err) {
      console.error(err);
    } finally {
      setMonitoringLoading(false);
    }
  };

  const selectedSession = monitoringSessions.find((session) => session._id === selectedSessionId) || null;
  const suspiciousSummary = monitoringSessions.reduce(
    (acc, session) => {
      const events = session.recentEvents || [];
      acc.warning += events.filter((event) => event.severity === "warning").length;
      acc.critical += events.filter((event) => event.severity === "critical").length;
      return acc;
    },
    { warning: 0, critical: 0 }
  );
  const filteredSessions = monitoringSessions.filter((session) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    const haystack = [
      session.studentId?.name || "",
      session.studentId?.admissionNumber || "",
      session.examId?.title || "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
  const summaryCounts = monitoringSessions.reduce(
    (acc, session) => {
      acc.total += 1;
      if (session.monitoringStatus === "Submitted") acc.submitted += 1;
      else if (session.monitoringStatus === "Disconnected") acc.disconnected += 1;
      else acc.active += 1;
      if (session.cameraEnabled) acc.cameraReady += 1;
      return acc;
    },
    { total: 0, active: 0, submitted: 0, disconnected: 0, cameraReady: 0 }
  );
  const alertInbox = monitoringSessions
    .flatMap((session) =>
      (session.recentEvents || []).map((event) => ({
        ...event,
        studentName: session.studentId?.name || "Student",
        examTitle: session.examId?.title || "Exam",
        sessionId: session._id,
      }))
    )
    .sort((left, right) => new Date(right.timestamp || right.createdAt || 0) - new Date(left.timestamp || left.createdAt || 0));

  const formatRemainingTime = (seconds) => {
    const safeSeconds = Number(seconds) || 0;
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ message: "", error: false });

    try {
      const payload = {
        ...form,
        allowedMaterials: form.allowedMaterials.split(",").map((item) => item.trim()).filter(Boolean),
        attachments: form.attachments || [],
      };

      if (editingId) {
        await put(`/api/exams/${editingId}`, payload);
        setStatus({ message: "Exam updated successfully.", error: false });
      } else {
        await post("/api/exams", payload);
        setStatus({ message: "Exam created successfully.", error: false });
      }

      setForm(initialExamForm);
      setEditingId(null);
      fetchMyExams();
    } catch (err) {
      console.error(err);
      setStatus({ message: err.message || "Failed to save exam.", error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exam) => {
    setEditingId(exam._id);
    setForm({
      title: exam.title || "",
      subject: exam.subject || "",
      description: exam.description || "",
      duration: exam.duration || 60,
      totalMarks: exam.totalMarks || 100,
      passThreshold: exam.passThreshold || 50,
      proctoringLevel: exam.proctoringLevel || "moderate",
      trustScoreThreshold: exam.trustScoreThreshold || 50,
      allowedMaterials: (exam.allowedMaterials || []).join(", "),
      scheduledStart: exam.scheduledStart ? exam.scheduledStart.slice(0, 16) : "",
      scheduledEnd: exam.scheduledEnd ? exam.scheduledEnd.slice(0, 16) : "",
      instructions: exam.instructions || "",
      pdfUrl: exam.pdfUrl || "",
      attachments: Array.isArray(exam.attachments) ? exam.attachments : [],
    });
  };

  const handleDelete = async (examId) => {
    if (!confirm("Delete this exam permanently?")) return;
    setLoading(true);
    try {
      await del(`/api/exams/${examId}`);
      setStatus({ message: "Exam deleted.", error: false });
      fetchMyExams();
    } catch (err) {
      console.error(err);
      setStatus({ message: "Failed to delete exam.", error: true });
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(initialExamForm);
    setStatus({ message: "", error: false });
  };

  const handleResourceUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setStatus({ message: "Uploading document...", error: false });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await upload(`/api/files/upload`, formData, {}, { setLoading });
      const uploadedItem = data?.items?.[0] || data;
      if (uploadedItem && (uploadedItem.url || uploadedItem.downloadUrl)) {
        const attachment = {
          originalName: uploadedItem.originalName || file.name,
          filename: uploadedItem.filename || uploadedItem.originalName || file.name,
          url: uploadedItem.url || uploadedItem.downloadUrl || "",
          downloadUrl: uploadedItem.downloadUrl || uploadedItem.url || "",
          mimeType: uploadedItem.mimeType || file.type || "",
          size: uploadedItem.size || file.size || 0,
          type: uploadedItem.type || "exam_resource",
          uploadedAt: uploadedItem.uploadedAt || new Date().toISOString(),
        };

        setForm((p) => ({
          ...p,
          pdfUrl: attachment.url,
          attachments: [...(p.attachments || []), attachment],
        }));
        setStatus({ message: "Document uploaded and attached to the exam.", error: false });
      } else {
        throw new Error((data && (data.error || JSON.stringify(data))) || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      setStatus({ message: err.message || "Document upload failed.", error: true });
    } finally {
      setLoading(false);
    }
  };

  const [showQuestionForm, setShowQuestionForm] = React.useState(false);
  const [selectedExamForQuestion, setSelectedExamForQuestion] = React.useState(null);
  const [questionForm, setQuestionForm] = React.useState({
    questionText: "",
    type: "mcq",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    marks: 1,
    difficulty: "medium",
    requireWorking: false,
  });
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExamForQuestion) return;
    setLoading(true);

    try {
      await post(`/api/exams/${selectedExamForQuestion}/questions`, questionForm);
      setStatus({ message: "Question added successfully.", error: false });
      setShowQuestionForm(false);
      setQuestionForm({
        questionText: "",
        type: "mcq",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        marks: 1,
        difficulty: "medium",
        requireWorking: false,
      });
      setSelectedExamForQuestion(null);
    } catch (err) {
      console.error(err);
      setStatus({ message: err.message || "Failed to add question.", error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (idx, field, value) => {
    const newOptions = [...questionForm.options];
    newOptions[idx] = { ...newOptions[idx], [field]: value };
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const previewExam = {
    title: form.title || "Untitled exam",
    subject: form.subject || "Subject",
    duration: form.duration || 60,
    totalMarks: form.totalMarks || 100,
    passThreshold: form.passThreshold || 50,
    instructions: form.instructions || "Instructions will appear here for students before they begin.",
    pdfUrl: form.pdfUrl || "",
    attachments: form.attachments || [],
    questions: [{ _id: "preview-1", questionText: "Preview question appears here when the exam is published." }],
  };

  const renderPreviewResource = () => {
    if (!previewExam.pdfUrl && (!previewExam.attachments || previewExam.attachments.length === 0)) {
      return (
        <div style={{ padding: 12, border: "1px dashed #cbd5e1", borderRadius: 8, background: "#f8fafc" }}>
          <strong>Resources</strong>
          <p style={{ margin: "8px 0 0", color: "#475569" }}>No exam resource has been attached yet.</p>
        </div>
      );
    }

    const resources = previewExam.attachments?.length ? previewExam.attachments : [{ originalName: "Attached resource", url: previewExam.pdfUrl }];

    return (
      <div style={{ display: "grid", gap: 8 }}>
        {resources.map((resource, index) => (
          <div key={`${resource.url || resource.originalName}-${index}`} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}>
            <strong>{resource.originalName || "Attached resource"}</strong>
            <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13 }}>
              Students will be able to open this document from the resource panel in the student exam workspace.
            </p>
            <a href={resource.url} target="_blank" rel="noreferrer" style={{ color: "#2563eb", display: "inline-block", marginTop: 6 }}>
              Open resource
            </a>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "30px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1>✏️ Teacher Exam Management</h1>
          <p style={{ color: "#555" }}>Create exams and manage your question bank for student assessments.</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ color: "#475569", fontSize: 14 }}>
          Live monitoring is available here once students open an exam and enable their camera.
        </div>
        <button
          type="button"
          onClick={() => setActiveTab("invigilation")}
          style={{ padding: "10px 16px", background: "#111827", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
        >
          Open Live Streaming
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid #e5e7eb", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("exams")}
          style={{
            padding: "12px 20px",
            background: activeTab === "exams" ? "#2563eb" : "transparent",
            color: activeTab === "exams" ? "white" : "#666",
            border: "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: activeTab === "exams" ? 600 : 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Settings size={18} />
          Exam Management
        </button>
        <button
          onClick={() => setActiveTab("invigilation")}
          style={{
            padding: "12px 20px",
            background: activeTab === "invigilation" ? "#2563eb" : "transparent",
            color: activeTab === "invigilation" ? "white" : "#666",
            border: "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: activeTab === "invigilation" ? 600 : 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <BarChart3 size={18} />
          Live Streaming
        </button>
      </div>

      {status.message && (
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 10, background: status.error ? "#fee" : "#eef7ff", color: status.error ? "#a00" : "#084" }}>
          {status.message}
        </div>
      )}

      {/* Exam Management Tab */}
      {activeTab === "exams" && (
        <div>
          <div style={{ padding: 14, border: "1px solid #dbeafe", borderRadius: 10, background: "#c68722", marginBottom: 14, color: "#1d4ed8" }}>
            <strong>Live stream preview:</strong> use the Live Streaming tab to see student camera feeds as soon as a student joins the exam and turns on their camera.
          </div>

          <section style={{ background: "blue", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0 }}>Student exam room preview</h2>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>This mirrors the same readiness and workspace experience students will see when they open the exam.</p>
              </div>
              <span style={{ padding: "6px 10px", borderRadius: 999, background: "#ecfdf5", color: "#047857", fontWeight: 700, fontSize: 12 }}>
                Connected to student workspace
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)", gap: 16 }}>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, background: "#f3ef06" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", fontSize: 12 }}>Exam Readiness</p>
                    <h3 style={{ margin: "8px 0", fontSize: 20 }}>{previewExam.title}</h3>
                    <p style={{ margin: 0, color: "#475569" }}>{previewExam.subject}</p>
                  </div>
                  <div style={{ padding: "8px 12px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontWeight: 700 }}>
                    {previewExam.duration} mins • {previewExam.questions.length} questions
                  </div>
                </div>

                <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: "#fff", border: "1px solid #e2e8f0" }}>
                  <strong>Instructions</strong>
                  <p style={{ margin: "8px 0 0", color: "#334155" }}>{previewExam.instructions}</p>
                </div>
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, background: "#427575" }}>
                <h3 style={{ marginTop: 0, marginBottom: 10 }}>Student Workspace Shell</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "#889e75" }}>
                    <strong>Resources</strong>
                    {renderPreviewResource()}
                  </div>
                  <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "#7ec5f1" }}>
                    <strong>Question area</strong>
                    <p style={{ margin: "8px 0 0", color: "#475569" }}>{previewExam.questions[0]?.questionText}</p>
                  </div>
                  <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc" }}>
                    <strong>Tools</strong>
                    <p style={{ margin: "8px 0 0", color: "#475569" }}>Uploads, camera controls, and submission actions appear here for the student.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}><Eye size={18} /> Live student monitoring</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#475569", background: "#03060b", padding: "4px 8px", borderRadius: 999 }}>
              {summaryCounts.total} monitored students
            </span>
            <button
              type="button"
              onClick={fetchMonitoringSessions}
              style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 999, background: "#0d01015e", cursor: "pointer", fontSize: 12 }}
            >
              Refresh
            </button>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, admission number, or exam"
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
          />
        </div>
        {monitoringLoading ? (
          <div>Loading monitoring data...</div>
        ) : monitoringSessions.length === 0 ? (
          <div style={{ color: "#64748b" }}>No students are currently taking your exams.</div>
        ) : (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1.3fr) minmax(300px, 0.8fr)" }}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#8dda20" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Monitored</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{summaryCounts.total}</div>
                </div>
                <div style={{ border: "1px solid #dcfce7", borderRadius: 10, padding: 10, background: "#d9e311" }}>
                  <div style={{ fontSize: 12, color: "#166534" }}>Active</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{summaryCounts.active}</div>
                </div>
                <div style={{ border: "1px solid #fef3c7", borderRadius: 10, padding: 10, background: "#65e5f1" }}>
                  <div style={{ fontSize: 12, color: "#92400e" }}>Disconnected</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{summaryCounts.disconnected}</div>
                </div>
                <div style={{ border: "1px solid #e0f2fe", borderRadius: 10, padding: 10, background: "#e123b4" }}>
                  <div style={{ fontSize: 12, color: "#0c4a6e" }}>Submitted</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{summaryCounts.submitted}</div>
                </div>
                <div style={{ border: "1px solid #ede9fe", borderRadius: 10, padding: 10, background: "#ee788f" }}>
                  <div style={{ fontSize: 12, color: "#5b21b6" }}>Camera ready</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{summaryCounts.cameraReady}</div>
                </div>
              </div>
              {filteredSessions.map((session) => (
                <div key={session._id} style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: 12, background: selectedSessionId === session._id ? "#eff6ff" : "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{session.studentId?.name || "Student"}</div>
                      <div style={{ fontSize: 13, color: "#475569" }}>{session.studentId?.admissionNumber ? `ADM ${session.studentId.admissionNumber}` : "Admission pending"}</div>
                      <div style={{ fontSize: 13, color: "#475569" }}>{session.examId?.title || "Exam"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: session.monitoringStatus === "Disconnected" ? "#fee2e2" : session.monitoringStatus === "Submitted" ? "#e0f2fe" : "#dcfce7", color: session.monitoringStatus === "Disconnected" ? "#991b1b" : session.monitoringStatus === "Submitted" ? "#0c4a6e" : "#166534", padding: "4px 8px", borderRadius: 999, fontSize: 12 }}>
                        <Activity size={14} /> {session.monitoringStatus || "Active"}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: session.cameraEnabled ? "#ede9fe" : "#f1f5f9", color: session.cameraEnabled ? "#5b21b6" : "#475569", padding: "4px 8px", borderRadius: 999, fontSize: 12 }}>
                        <Eye size={14} /> {session.cameraEnabled ? "Camera ready" : "Camera off"}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#fef3c7", color: "#92400e", padding: "4px 8px", borderRadius: 999, fontSize: 12 }}>
                        <Clock3 size={14} /> Q{(session.currentQuestionIndex || 0) + 1}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "#334155" }}>
                    Last activity: {session.lastActivityAt ? new Date(session.lastActivityAt).toLocaleTimeString() : "Just started"}
                  </div>
                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                    <div style={{ fontSize: 13, color: "#475569" }}>
                      Connection: <strong>{session.connectionStatus || "Connected"}</strong> · Remaining time: <strong>{formatRemainingTime(session.remainingSeconds)}</strong>
                    </div>
                    <div style={{ fontSize: 13, color: "#475569" }}>
                      Status: <strong>{session.currentAnswerPreview ? "Writing" : "Viewing"}</strong> · Question {Math.max(1, (session.currentQuestionIndex || 0) + 1)}
                    </div>
                    {session.currentAnswerPreview ? (
                      <div style={{ fontSize: 13, color: "#334155", background: "#fff", padding: 8, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                        Recent answer preview: {session.currentAnswerPreview.slice(0, 120)}{session.currentAnswerPreview.length > 120 ? "..." : ""}
                      </div>
                    ) : null}
                  </div>
                  {session.recentEvents?.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {session.recentEvents.map((event, index) => (
                        <span key={`${session._id}-${index}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: event.severity === "critical" ? "#fee2e2" : event.severity === "warning" ? "#fef3c7" : "#e0f2fe", color: event.severity === "critical" ? "#991b1b" : event.severity === "warning" ? "#92400e" : "#0c4a6e", padding: "4px 8px", borderRadius: 999, fontSize: 12 }}>
                          <AlertTriangle size={12} /> {event.eventType || "activity"}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                    <button type="button" onClick={() => setSelectedSessionId(session._id)} style={{ padding: "7px 12px", border: "1px solid #2563eb", borderRadius: 8, background: "#fff", color: "#2563eb", cursor: "pointer" }}>
                      View student details
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Student details</h3>
                {selectedSession ? (
                  <div style={{ display: "grid", gap: 8, fontSize: 13, color: "#334155" }}>
                    <div><strong>Name:</strong> {selectedSession.studentId?.name || "Student"}</div>
                    <div><strong>Exam:</strong> {selectedSession.examId?.title || "Exam"}</div>
                    <div><strong>Current question:</strong> {Math.max(1, (selectedSession.currentQuestionIndex || 0) + 1)}</div>
                    <div><strong>Last activity:</strong> {selectedSession.lastActivityAt ? new Date(selectedSession.lastActivityAt).toLocaleString() : "Just started"}</div>
                    <div><strong>Status:</strong> {selectedSession.currentAnswerPreview ? "Writing" : "Viewing"}</div>
                    <div><strong>Camera:</strong> {selectedSession.cameraEnabled ? "Enabled" : "Off"}</div>
                    {selectedSession.currentAnswerPreview ? (
                      <div style={{ padding: 8, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <strong>Preview:</strong> {selectedSession.currentAnswerPreview.slice(0, 180)}{selectedSession.currentAnswerPreview.length > 180 ? "..." : ""}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div style={{ color: "#64748b" }}>Choose a student to inspect their live exam progress.</div>
                )}
              </div>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Alert inbox</h3>
                {alertInbox.length === 0 ? (
                  <div style={{ color: "#64748b" }}>No alerts yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {alertInbox.slice(0, 8).map((alert, index) => (
                      <div key={`${alert.sessionId}-${index}`} style={{ border: "1px solid #f1f5f9", borderRadius: 8, padding: 8, background: alert.severity === "critical" ? "#fef2f2" : alert.severity === "warning" ? "#fff7ed" : "#f8fafc" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: alert.severity === "critical" ? "#991b1b" : alert.severity === "warning" ? "#92400e" : "#0c4a6e" }}>{alert.severity}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{alert.studentName}</div>
                        <div style={{ fontSize: 12, color: "#475569" }}>{alert.examTitle}</div>
                        <div style={{ fontSize: 12, color: "#334155", marginTop: 4 }}>{alert.eventType || alert.description || "Activity alert"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Exam Form and List - Part of Exams Tab */}
      <div style={{ display: "grid", gap: 24 }}>
        <section style={{ background: "pink", border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
          <h2 style={{ marginBottom: 16 }}>{editingId ? "Edit Exam" : "Create New Exam"}</h2>
          <form onSubmit={handleCreateOrUpdate}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              <label style={{ display: "grid", gap: 8 }}>
                Title
                <input type="text" name="title" value={form.title} onChange={handleChange} required style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                Subject
                <input type="text" name="subject" value={form.subject} onChange={handleChange} required style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                Duration (minutes)
                <input type="number" name="duration" value={form.duration} onChange={handleChange} min={10} required style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                Total Marks
                <input type="number" name="totalMarks" value={form.totalMarks} onChange={handleChange} min={10} required style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                Pass Threshold (%)
                <input type="number" name="passThreshold" value={form.passThreshold} onChange={handleChange} min={0} max={100} required style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                Proctoring Level
                <select name="proctoringLevel" value={form.proctoringLevel} onChange={handleChange} style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}> 
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="strict">Strict</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                Trust Score Threshold
                <input type="number" name="trustScoreThreshold" value={form.trustScoreThreshold} onChange={handleChange} min={0} max={100} style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                Scheduled Start
                <input type="datetime-local" name="scheduledStart" value={form.scheduledStart} onChange={handleChange} style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                Scheduled End
                <input type="datetime-local" name="scheduledEnd" value={form.scheduledEnd} onChange={handleChange} style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} />
              </label>
            </div>

            <label style={{ display: "grid", gap: 8, marginTop: 16 }}>
              Description
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} />
            </label>
            <label style={{ display: "grid", gap: 8, marginTop: 16 }}>
              Instructions
              <textarea name="instructions" value={form.instructions} onChange={handleChange} rows={4} style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} />
            </label>
            <label style={{ display: "grid", gap: 8, marginTop: 16 }}>
              PDF URL
              <input type="text" name="pdfUrl" value={form.pdfUrl} onChange={handleChange} style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} placeholder="Enter link to exam PDF" />
            </label>
            <label style={{ display: "grid", gap: 8, marginTop: 8 }}>
              Or upload a document resource
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg" onChange={(e) => handleResourceUpload(e.target.files && e.target.files[0])} />
            </label>
            {form.attachments?.length > 0 && (
              <div style={{ marginTop: 10, padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc" }}>
                <strong>Attached resources</strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#334155" }}>
                  {form.attachments.map((resource, idx) => (
                    <li key={`${resource.url}-${idx}`}>
                      <a href={resource.url} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                        {resource.originalName || resource.filename || "Attached resource"}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <label style={{ display: "grid", gap: 8, marginTop: 16 }}>
              Allowed Materials
              <input type="text" name="allowedMaterials" value={form.allowedMaterials} onChange={handleChange} placeholder="e.g. calculator, reference sheet" style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} />
            </label>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
              <button type="submit" style={{ padding: "12px 28px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                {editingId ? "Update Exam" : "Create Exam"}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} style={{ padding: "12px 28px", background: "#6b7280", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section style={{ background: "skyblue", border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
          <h2 style={{ marginBottom: 16 }}>My Exams</h2>
          {teacherTimetables.length > 0 && <div style={{ marginBottom: 16, padding: 14, borderRadius: 8, background: "#f5f3ff" }}><strong>My Teaching Timetable</strong>{teacherTimetables.map((timetable) => <div key={timetable._id} style={{ marginTop: 8 }}><span>{timetable.term} {timetable.year} · {timetable.class} {timetable.stream}</span><ul style={{ margin: "6px 0", paddingLeft: 18 }}>{timetable.entries.filter((entry) => entry.teacherIdentity || entry.teacherStaffId).map((entry, index) => <li key={`${entry.day}-${entry.startTime}-${index}`}>{entry.day} {entry.startTime}–{entry.endTime}: {entry.subject} ({entry.class || timetable.class} {timetable.stream})</li>)}</ul></div>)}</div>}
          {exams.length === 0 ? (
            <p style={{ color: "#555" }}>No exams created yet. Use the form above to add a new exam.</p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {exams.map((exam) => (
                <div key={exam._id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, background: "#0915f2" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{exam.title}</h3>
                      <p style={{ margin: "8px 0", color: "#555" }}>{exam.subject || "No subject"}</p>
                      <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
                        Duration: {exam.duration} min · Marks: {exam.totalMarks} · Enrolled: {exam.enrolledStudents?.length || 0}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => { setSelectedExamForQuestion(exam._id); setShowQuestionForm(true); }} style={{ padding: "10px 18px", background: "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                        + Add Question
                      </button>
                      <button type="button" onClick={() => setReviewExam(exam)} style={{ padding: "10px 18px", background: "#6366f1", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                        Review Working
                      </button>
                      <button type="button" onClick={() => setPaperExam(exam)} style={{ padding: "10px 18px", background: "#0f766e", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                        Word Paper
                      </button>
                      <button type="button" onClick={() => handleEdit(exam)} style={{ padding: "10px 18px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(exam._id)} style={{ padding: "10px 18px", background: "#dc2626", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                  {exam.instructions && <p style={{ marginTop: 16, color: "#4b5563" }}>{exam.instructions}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
        </div>
      )}

      {/* Live Invigilation Tab */}
      {activeTab === "invigilation" && (
        <div>
          {exams.length === 0 ? (
            <div style={{ padding: 20, background: "skyblue", borderRadius: 12, border: "1px solid #ddd", textAlign: "center", color: "#666" }}>
              <p>No exams available for monitoring. Please create an exam first.</p>
            </div>
          ) : (
            <LiveInvigilation examId={exams[0]?._id} />
          )}
        </div>
      )}

      {reviewExam && (
        <TeacherExamReview exam={reviewExam} onClose={() => setReviewExam(null)} />
      )}
      {paperExam && <TeacherWordPaperPanel exam={paperExam} onClose={() => setPaperExam(null)} onUpdated={fetchMyExams} />}

        {showQuestionForm && (
          <section style={{ background: "skygreen", border: "2px solid #16a34a", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Add Question to Exam</h2>
              <button type="button" onClick={() => { setShowQuestionForm(false); setSelectedExamForQuestion(null); }} style={{ padding: "8px 16px", background: "#6b7280", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
                Close
              </button>
            </div>

            <form onSubmit={handleAddQuestion}>
              <div style={{ display: "grid", gap: 16 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  Question Text
                  <textarea value={questionForm.questionText} onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })} required rows={3} style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  Question Type
                  <select value={questionForm.type} onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })} style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
                    <option value="mcq">Multiple Choice</option>
                    <option value="short">Short Answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </label>

                {questionForm.type === "mcq" && (
                  <div style={{ display: "grid", gap: 12 }}>
                    <label style={{ fontWeight: "bold", color: "#333" }}>Options</label>
                    {questionForm.options.map((opt, idx) => (
                      <div key={idx} style={{ display: "grid", gap: 8, padding: 12, border: "1px solid #e5e7eb", borderRadius: 8, background: "#dfd008" }}>
                        <input
                          type="text"
                          placeholder={`Option ${idx + 1}`}
                          value={opt.text}
                          onChange={(e) => handleOptionChange(idx, "text", e.target.value)}
                          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
                          required
                        />
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="checkbox" checked={opt.isCorrect} onChange={(e) => handleOptionChange(idx, "isCorrect", e.target.checked)} />
                          Mark as correct answer
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                  <label style={{ display: "grid", gap: 8 }}>
                    Marks
                    <input type="number" value={questionForm.marks} onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) })} min={1} required style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }} />
                  </label>
                  <label style={{ display: "grid", gap: 8 }}>
                    Difficulty
                    <select value={questionForm.difficulty} onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })} style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>
                </div>
                <label style={{ display: "grid", gap: 8 }}>
                  Require Working Upload
                  <input type="checkbox" checked={questionForm.requireWorking} onChange={(e) => setQuestionForm({ ...questionForm, requireWorking: e.target.checked })} />
                </label>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button type="submit" style={{ padding: "12px 28px", background: "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                  Save Question
                </button>
                <button type="button" onClick={() => { setShowQuestionForm(false); setSelectedExamForQuestion(null); }} style={{ padding: "12px 28px", background: "#6b7280", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
    </div>
  );
}
