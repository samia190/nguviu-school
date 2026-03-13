import React, { useState, useEffect } from "react";
import { get } from "../utils/api";

export default function ParentDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState("results");

  useEffect(() => {
    if (user?.linkedStudents?.length > 0) {
      setStudents(user.linkedStudents);
      setSelectedStudent(user.linkedStudents[0]);
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentData();
    }
  }, [selectedStudent, activeTab]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError("");

      const studentId = selectedStudent._id || selectedStudent;

      if (activeTab === "results") {
        const resultData = await get(`/api/parent/student/${studentId}/results`);
        setResults(resultData.results || []);
      } else if (activeTab === "comparison") {
        const compData = await get(`/api/parent/student/${studentId}/comparison`);
        setComparison(compData);
      } else if (activeTab === "recommendations") {
        const recData = await get(`/api/parent/student/${studentId}/recommendations`);
        setRecommendations(recData.recommendations || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = () => {
    if (!selectedStudent) return "";
    return selectedStudent.name || selectedStudent.admissionNumber || "Student";
  };

  const renderResults = () => {
    if (results.length === 0) {
      return <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
        No results published yet
      </div>;
    }

    return (
      <div>
        {results.map((result, idx) => (
          <div key={idx} style={{
            background: "white",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "15px",
              marginBottom: "15px"
            }}>
              <div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>Term</div>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {result.term}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>Grade</div>
                <div style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: result.grade === 'A' || result.grade === 'B' ? "#28a745"
                    : result.grade === 'C' ? "#ffc107"
                    : "#dc3545"
                }}>
                  {result.grade}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>Average</div>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {result.average?.toFixed(1)}/10
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>Position</div>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {result.position}/{result.outOf}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>Subjects</div>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {result.subjectCount}
                </div>
              </div>
            </div>

            {result.subjects && result.subjects.length > 0 && (
              <div style={{
                marginTop: "15px",
                paddingTop: "15px",
                borderTop: "1px solid #f0f0f0"
              }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Subjects:</h4>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "10px"
                }}>
                  {result.subjects.map((subject, sidx) => (
                    <div key={sidx} style={{
                      background: "#f9f9f9",
                      padding: "10px",
                      borderRadius: "6px",
                      fontSize: "13px"
                    }}>
                      <div style={{ fontWeight: "600", marginBottom: "3px" }}>
                        {subject.name}
                      </div>
                      <div style={{ color: "#666" }}>
                        {subject.score} - Grade {subject.grade}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.remarks && (
              <div style={{
                marginTop: "15px",
                background: "#f0f4ff",
                padding: "12px",
                borderRadius: "6px",
                borderLeft: "4px solid #667eea",
                fontSize: "13px",
                color: "#333"
              }}>
                <strong>Teacher's Remarks:</strong> {result.remarks}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderComparison = () => {
    if (!comparison || comparison.comparison.length === 0) {
      return <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
        Need at least 2 results for comparison
      </div>;
    }

    return (
      <div>
        {comparison.trend && (
          <div style={{
            background: comparison.trend.status === 'improving' ? "#d4edda" : "#f8d7da",
            border: `1px solid ${comparison.trend.status === 'improving' ? "#c3e6cb" : "#f5c6cb"}`,
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "30px"
          }}>
            <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
              📈 Performance Trend: {comparison.trend.status === 'improving' ? "📈 Improving!" : "📉 Needs Attention"}
            </div>
            <p style={{ margin: 0, fontSize: "14px" }}>
              {comparison.trend.summary}
            </p>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px"
          }}>
            <thead style={{ background: "#f8f9fa" }}>
              <tr>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Term</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Grade</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Average</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Position</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Attendance</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Highlights</th>
              </tr>
            </thead>
            <tbody>
              {comparison.comparison.map((comp, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #dee2e6" }}>
                  <td style={{ padding: "12px" }}>{comp.term}</td>
                  <td style={{ padding: "12px", textAlign: "center", fontWeight: "bold" }}>
                    {comp.grade}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    {comp.average?.toFixed(1)}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "12px" }}>
                    {comp.position}/{comp.classSize}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    {comp.attendance?.rate}%
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px" }}>
                    {comp.strongSubjects.length > 0 && (
                      <div style={{ color: "#28a745" }}>
                        ✓ Strong: {comp.strongSubjects.join(", ")}
                      </div>
                    )}
                    {comp.weakSubjects.length > 0 && (
                      <div style={{ color: "#dc3545", marginTop: "5px" }}>
                        ⚠ Weak: {comp.weakSubjects.join(", ")}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (recommendations.length === 0) {
      return <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
        No recommendations available yet
      </div>;
    }

    return (
      <div style={{ display: "grid", gap: "15px" }}>
        {recommendations.map((rec, idx) => (
          <div key={idx} style={{
            background: "white",
            border: `2px solid ${
              rec.priority === 'HIGH' ? '#f5576c'
              : rec.priority === 'MEDIUM' ? '#ffc107'
              : '#28a745'
            }`,
            borderRadius: "8px",
            padding: "20px",
            borderLeft: `6px solid ${
              rec.priority === 'HIGH' ? '#f5576c'
              : rec.priority === 'MEDIUM' ? '#ffc107'
              : '#28a745'
            }`
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              marginBottom: "10px"
            }}>
              <div>
                <h3 style={{ margin: "0 0 5px 0", fontSize: "16px", fontWeight: "600" }}>
                  {rec.title}
                </h3>
                <div style={{
                  display: "inline-block",
                  background: rec.priority === 'HIGH' ? '#f5576c'
                    : rec.priority === 'MEDIUM' ? '#ffc107'
                    : '#28a745',
                  color: rec.priority === 'MEDIUM' ? '#333' : 'white',
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  marginTop: "5px"
                }}>
                  {rec.priority} PRIORITY
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "#999" }}>
                {rec.category}
              </div>
            </div>

            <p style={{ margin: "15px 0", fontSize: "14px", color: "#333" }}>
              {rec.message}
            </p>

            <div style={{
              background: "#f9f9f9",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "13px",
              color: "#666"
            }}>
              <strong>Suggested Action:</strong> {rec.action}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!user) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Not authenticated</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "30px",
        borderRadius: "12px",
        marginBottom: "30px"
      }}>
        <h1 style={{ margin: 0, marginBottom: "10px" }}>
          👨‍👩‍👧 Parent Portal
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Welcome! Monitor your child's academic progress and performance
        </p>
      </div>

      {/* Student Selector */}
      <div style={{
        background: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "30px"
      }}>
        <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>
          Select Student:
        </label>
        <select
          value={selectedStudent?._id || selectedStudent}
          onChange={(e) => {
            const selected = students.find(s => s._id === e.target.value || s === e.target.value);
            setSelectedStudent(selected);
          }}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            fontSize: "14px"
          }}
        >
          {students.map((student, idx) => (
            <option key={idx} value={student._id || student}>
              {student.name || student.admissionNumber || `Student ${idx + 1}`}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
        borderBottom: "2px solid #e0e0e0"
      }}>
        {[
          { id: "results", label: "📄 Results", emoji: "📊" },
          { id: "comparison", label: "📊 Comparison", emoji: "📈" },
          { id: "recommendations", label: "💡 Recommendations", emoji: "🎯" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 20px",
              background: activeTab === tab.id ? "#667eea" : "transparent",
              color: activeTab === tab.id ? "white" : "#666",
              border: "none",
              borderBottom: activeTab === tab.id ? "3px solid #667eea" : "none",
              cursor: "pointer",
              fontWeight: activeTab === tab.id ? "600" : "500",
              fontSize: "14px"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "#fee",
          border: "1px solid #fcc",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "20px",
          color: "#c33"
        }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          textAlign: "center",
          padding: "40px",
          color: "#666"
        }}>
          ⏳ Loading {activeTab === "results" ? "results" : activeTab === "comparison" ? "comparison" : "recommendations"}...
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div>
          {activeTab === "results" && renderResults()}
          {activeTab === "comparison" && renderComparison()}
          {activeTab === "recommendations" && renderRecommendations()}
        </div>
      )}
    </div>
  );
}
