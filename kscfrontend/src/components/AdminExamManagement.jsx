import React, { useEffect, useState } from "react";
import { get } from "../utils/api";
import Loader from "./Loader";

export default function AdminExamManagement({ user }) {
  const [summary, setSummary] = useState({ exams: [], sessions: [], results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) fetchExamDashboard();
  }, [user]);

  const fetchExamDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const examsRes = await get("/api/exams");
      const sessionsRes = await get("/api/exams/sessions/active").catch(() => ({ sessions: [] }));
      const resultsRes = await get("/api/exams/results").catch(() => ({ results: [] }));

      setSummary({
        exams: Array.isArray(examsRes.exams) ? examsRes.exams : [],
        sessions: Array.isArray(sessionsRes.sessions) ? sessionsRes.sessions : [],
        results: Array.isArray(resultsRes.results) ? resultsRes.results : [],
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load exam dashboard.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "30px", maxWidth: 1200, margin: "0 auto" }}>
      <h1>🎓 Admin Exam Management</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>Review exams, active sessions, and student results from the centralized exam dashboard.</p>

      {error && (
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 10, background: "#fee", color: "#a00" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "white", border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
          <h2 style={{ margin: 0 }}>Exams</h2>
          <p style={{ fontSize: 36, margin: "16px 0 0" }}>{summary.exams.length}</p>
          <p style={{ color: "#555" }}>Total assessments available in the system.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
          <h2 style={{ margin: 0 }}>Active Sessions</h2>
          <p style={{ fontSize: 36, margin: "16px 0 0" }}>{summary.sessions.length}</p>
          <p style={{ color: "#555" }}>Ongoing exam sessions by enrolled students.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
          <h2 style={{ margin: 0 }}>Recent Results</h2>
          <p style={{ fontSize: 36, margin: "16px 0 0" }}>{summary.results.length}</p>
          <p style={{ color: "#555" }}>Recent exam results available for review.</p>
        </div>
      </div>

      <section style={{ background: "white", border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
        <h2>Recent Exams</h2>
        {summary.exams.length === 0 ? (
          <p style={{ color: "#555" }}>No exams are currently available.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {summary.exams.slice(0, 5).map((exam) => (
              <div key={exam._id} style={{ border: "1px solid #f3f4f6", borderRadius: 10, padding: 16, background: "#fafafa" }}>
                <h3 style={{ margin: 0 }}>{exam.title}</h3>
                <p style={{ margin: "8px 0", color: "#555" }}>{exam.subject || "No subject"}</p>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Duration: {exam.duration} min · Marks: {exam.totalMarks} · Enrolled: {exam.enrolledStudents?.length || 0}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ background: "white", border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
        <h2>Active Exam Sessions</h2>
        {summary.sessions.length === 0 ? (
          <p style={{ color: "#555" }}>No active exam sessions right now.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {summary.sessions.slice(0, 5).map((session) => (
              <div key={session._id} style={{ border: "1px solid #f3f4f6", borderRadius: 10, padding: 16, background: "#fafafa" }}>
                <h3 style={{ margin: 0 }}>{session.studentId?.name}</h3>
                <p style={{ margin: "8px 0", color: "#555" }}>{session.examId?.title}</p>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Status: {session.status} · Trust Score: {session.trustScore || 100}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ background: "white", border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
        <h2>Recent Results</h2>
        {summary.results.length === 0 ? (
          <p style={{ color: "#555" }}>No results available yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {summary.results.slice(0, 5).map((result) => (
              <div key={result._id} style={{ border: "1px solid #f3f4f6", borderRadius: 10, padding: 16, background: "#fafafa" }}>
                <h3 style={{ margin: 0 }}>{result.studentId?.name}</h3>
                <p style={{ margin: "8px 0", color: "#555" }}>{result.examId?.title}</p>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Score: {result.score}/{result.totalMarks} ({result.percentage?.toFixed(1)}%) · Grade: {result.grade}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
