// components/ExamResults.jsx
import React, { useState, useEffect } from "react";
import { BarChart, Activity } from "lucide-react";

export default function ExamResults({ user }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`/api/exams/results/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch results");
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Error fetching results:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A": return "#28a745";
      case "B": return "#17a2b8";
      case "C": return "#ffc107";
      case "F": return "#dc3545";
      default: return "#6c757d";
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 20px" }}>Loading results...</div>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>📊 Exam Results</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>View your exam performance and scores.</p>

      {error && (
        <div style={{ background: "#fee", padding: "15px", borderRadius: "6px", marginBottom: "20px", color: "#c00" }}>
          {error}
        </div>
      )}

      {results.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
          <BarChart size={48} style={{ margin: "0 auto 20px", opacity: 0.5 }} />
          <p>No exam results yet</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {results.map((result) => (
            <div
              key={result._id}
              style={{
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
                  {result.examId?.title}
                </h3>
                <p style={{ color: "#666", fontSize: "14px" }}>
                  {new Date(result.gradedAt).toLocaleDateString()}
                </p>
              </div>

              <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    {result.score}/{result.totalMarks}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    {result.percentage.toFixed(1)}%
                  </div>
                </div>

                <div style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "white",
                  background: getGradeColor(result.grade),
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {result.grade}
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "14px", color: "#666" }}>Status</div>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: result.passed ? "#28a745" : "#dc3545",
                  }}>
                    {result.passed ? "✓ Passed" : "✗ Failed"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
