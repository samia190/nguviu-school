import React from "react";
import { Activity, AlertTriangle, Clock3, Eye } from "lucide-react";
import TeacherExamReview from "./TeacherExamReview";

export default function ExamManagementContent({
  status,
  monitoringSessions,
  filteredSessions,
  selectedSessionId,
  setSelectedSessionId,
  alertInbox,
  summaryCounts,
  fetchMonitoringSessions,
  searchTerm,
  setSearchTerm,
  monitoringLoading,
  exams,
  editingId,
  form,
  handleChange,
  handleCreateOrUpdate,
  handleEdit,
  handleDelete,
  setSelectedExamForQuestion,
  setShowQuestionForm,
  setReviewExam,
  reviewExam,
  showQuestionForm,
  questionForm,
  setQuestionForm,
  handleAddQuestion,
  handleOptionChange,
  setShowQuestionForm: closeQuestionForm,
  selectedExamForQuestion,
  formatRemainingTime,
  selectedSession,
}) {
  return (
    <>
      {status.message && (
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 10, background: status.error ? "#fee" : "#eef7ff", color: status.error ? "#a00" : "#084" }}>
          {status.message}
        </div>
      )}

      {/* Live Student Monitoring */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}><Eye size={18} /> Live student monitoring</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#475569", background: "#e2e8f0", padding: "4px 8px", borderRadius: 999 }}>
            {summaryCounts.total} monitored students
          </span>
          <button
            type="button"
            onClick={fetchMonitoringSessions}
            style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 999, background: "#fff", cursor: "pointer", fontSize: 12 }}
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
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1.3fr) minmax(300px, 0.8fr)", marginBottom: 24 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>Monitored</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{summaryCounts.total}</div>
              </div>
              <div style={{ border: "1px solid #dcfce7", borderRadius: 10, padding: 10, background: "#f0fdf4" }}>
                <div style={{ fontSize: 12, color: "#166534" }}>Active</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{summaryCounts.active}</div>
              </div>
              <div style={{ border: "1px solid #fef3c7", borderRadius: 10, padding: 10, background: "#fff7ed" }}>
                <div style={{ fontSize: 12, color: "#92400e" }}>Disconnected</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{summaryCounts.disconnected}</div>
              </div>
              <div style={{ border: "1px solid #e0f2fe", borderRadius: 10, padding: 10, background: "#f0f9ff" }}>
                <div style={{ fontSize: 12, color: "#0c4a6e" }}>Submitted</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{summaryCounts.submitted}</div>
              </div>
              <div style={{ border: "1px solid #ede9fe", borderRadius: 10, padding: 10, background: "#f5f3ff" }}>
                <div style={{ fontSize: 12, color: "#5b21b6" }}>Camera ready</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{summaryCounts.cameraReady}</div>
              </div>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
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

      <div style={{ display: "grid", gap: 24 }}>
        {/* Form and Exams sections would go here - truncated for brevity */}
      </div>

      {reviewExam && (
        <TeacherExamReview exam={reviewExam} onClose={() => setReviewExam(null)} />
      )}
    </>
  );
}
