import React from "react";

export default function ExamRoomLanding({ user, setRoute }) {
  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", minHeight: "70vh" }}>
        <h1>🔒 Exam Room</h1>
        <p>Please log in to access the exam portal.</p>
        <button
          onClick={() => setRoute("login")}
          style={{ padding: "12px 28px", background: "#667eea", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px" }}
        >
          Log In
        </button>
      </div>
    );
  }

  if (user.role === "student") {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", minHeight: "70vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "20px" }}>📖 Online Exam Room</h1>
        <p style={{ fontSize: "1.1rem", marginBottom: "30px", color: "#666", maxWidth: "560px" }}>
          Access available exams, enroll in approved assessments, and submit your answers securely from within the school portal.
        </p>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => setRoute("exams")}
            style={{ padding: "14px 32px", background: "#4f46e5", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", minWidth: 200, fontSize: "16px", fontWeight: "600" }}
          >
            Browse Exams
          </button>
          <button
            onClick={() => setRoute("exams/results")}
            style={{ padding: "14px 32px", background: "#10b981", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", minWidth: 200, fontSize: "16px", fontWeight: "600" }}
          >
            View My Results
          </button>
        </div>
      </div>
    );
  }

  if (user.role === "teacher") {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", minHeight: "70vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "20px" }}>📊 Teacher Exam Portal</h1>
        <p style={{ fontSize: "1.1rem", marginBottom: "30px", color: "#666", maxWidth: "560px" }}>
          Create and manage your exams in one place. Schedule assessments, review exam metadata, and track student engagement.
        </p>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => setRoute("exam-room/teacher")}
            style={{ padding: "14px 32px", background: "#9333ea", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", minWidth: 200, fontSize: "16px", fontWeight: "600" }}
          >
            Manage My Exams
          </button>
          <button
            onClick={() => setRoute("exams")}
            style={{ padding: "14px 32px", background: "#047857", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", minWidth: 200, fontSize: "16px", fontWeight: "600" }}
          >
            Preview Student View
          </button>
        </div>
      </div>
    );
  }

  if (user.role === "admin" || user.role === "superadmin") {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", minHeight: "70vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "20px" }}>🎓 Exam Management Console</h1>
        <p style={{ fontSize: "1.1rem", marginBottom: "30px", color: "#666", maxWidth: "560px" }}>
          Oversee the exam program, review active assessments, and access exam data for students and teachers across the school.
        </p>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => setRoute("exam-room/admin")}
            style={{ padding: "14px 32px", background: "#2563eb", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", minWidth: 200, fontSize: "16px", fontWeight: "600" }}
          >
            Open Exam Dashboard
          </button>
          <button
            onClick={() => setRoute("exams")}
            style={{ padding: "14px 32px", background: "#f59e0b", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", minWidth: 200, fontSize: "16px", fontWeight: "600" }}
          >
            View Exam Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <h1>Access Restricted</h1>
      <p>Your role does not currently have access to the exam portal.</p>
    </div>
  );
}
