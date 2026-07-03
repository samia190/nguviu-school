// components/ExamList.jsx
import React, { useState, useEffect } from "react";
import { AlertCircle, BookOpen, Users, Clock, Trophy } from "lucide-react";

export default function ExamList({ user, setRoute }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ subject: "", isEnrolled: false });

  useEffect(() => {
    fetchExams();
  }, [filters]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const params = new URLSearchParams();
      if (filters.subject) params.append("subject", filters.subject);

      const response = await fetch(`/api/exams?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch exams");
      const data = await response.json();
      setExams(data.exams || []);
    } catch (err) {
      console.error("Error fetching exams:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isExamEnrolled = (exam) => {
    if (!user || !exam.enrolledStudents) return false;
    return exam.enrolledStudents.some((student) => {
      const id = typeof student === "string" ? student : student?._id || student?.id;
      return id === user.id || id === user._id;
    });
  };

  const handleStartExam = async (exam) => {
    if (!user) return;
    if (user.role !== "student") {
      if (user.role === "teacher") return setRoute("exam-room/teacher");
      if (user.role === "admin" || user.role === "superadmin") return setRoute("exam-room/admin");
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!isExamEnrolled(exam)) {
        const response = await fetch(`/api/exams/${exam._id}/enroll`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Failed to enroll in exam");
      }
      setRoute(`exams/take?id=${exam._id}`);
    } catch (err) {
      console.error("Error starting exam:", err);
      setError(err.message || "Failed to enroll and start exam");
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 20px" }}>Loading exams...</div>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>📝 Exams</h1>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Access and take available exams. Monitor your progress and view results.
        </p>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Filter by subject..."
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            style={{
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              flex: 1,
              maxWidth: "300px",
            }}
          />
        </div>
      </div>

      {error && (
        <div style={{
          background: "#fee",
          border: "1px solid #fcc",
          borderRadius: "6px",
          padding: "12px",
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
        }}>
          <AlertCircle size={20} style={{ color: "#c00" }} />
          <span>{error}</span>
        </div>
      )}

      {exams.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
          <BookOpen size={48} style={{ margin: "0 auto 20px", opacity: 0.5 }} />
          <p>No exams available. Check back later!</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}>
          {exams.map((exam) => (
            <div
              key={exam._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "20px",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
                {exam.title}
              </h3>
              <p style={{ color: "#666", marginBottom: "15px", fontSize: "14px" }}>
                {exam.description}
              </p>

              <div style={{ display: "grid", gap: "8px", marginBottom: "15px", fontSize: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={16} />
                  <span>Duration: {exam.duration} minutes</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Trophy size={16} />
                  <span>Marks: {exam.totalMarks}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Users size={16} />
                  <span>Enrolled: {exam.enrolledStudents?.length || 0}</span>
                </div>
              </div>

              <button
                onClick={() => handleStartExam(exam)}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {user?.role === "student"
                  ? isExamEnrolled(exam)
                    ? "Start Exam"
                    : "Enroll & Start"
                  : user?.role === "teacher"
                    ? "Open Teacher Portal"
                    : "Open Admin Portal"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
