import React, { useState, useEffect } from "react";
import { get } from "../utils/api";

export default function StudentDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [latestResult, setLatestResult] = useState(null);
  const [trend, setTrend] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchStudentResults();
  }, [user]);

  const fetchStudentResults = async () => {
    try {
      setLoading(true);
      setError("");

      // Get student results from verification endpoint
      const results = await get(`/api/results/student/${user?._id}`);
      setStudentResults(results || []);

      if (results && results.length > 0) {
        // Latest result
        const latest = results[0];
        setLatestResult(latest);

        // Calculate trend if multiple results
        if (results.length >= 2) {
          const current = results[0].grades?.average || 0;
          const previous = results[1].grades?.average || 0;
          const change = current - previous;
          setTrend({
            change: change.toFixed(2),
            status: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable',
            percentage: previous !== 0 ? ((change / previous) * 100).toFixed(1) : '0.0'
          });
        }

        // Calculate statistics
        const grades = results.map(r => r.grades?.average || 0);
        setStats({
          bestGrade: Math.max(...grades).toFixed(1),
          worstGrade: Math.min(...grades).toFixed(1),
          averageGrade: (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1),
          resultsCount: results.length
        });
      }
    } catch (err) {
      setError(err.message || "Failed to load results");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Not authenticated</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "30px",
        borderRadius: "12px",
        marginBottom: "30px"
      }}>
        <h1 style={{ margin: 0, marginBottom: "10px" }}>
          📚 My Academic Dashboard
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Welcome, {user.name}! Track your progress and performance
        </p>
      </div>

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

      {loading && (
        <div style={{
          textAlign: "center",
          padding: "40px",
          color: "#666"
        }}>
          ⏳ Loading your dashboard...
        </div>
      )}

      {!loading && studentResults.length === 0 ? (
        <div style={{
          background: "#f0f4ff",
          border: "1px solid #b3d4ff",
          borderRadius: "8px",
          padding: "30px",
          textAlign: "center",
          color: "#0066cc"
        }}>
          <p style={{ margin: 0, fontSize: "16px" }}>
            No results published yet. Check back soon!
          </p>
        </div>
      ) : !loading && (
        <div>
          {/* Key Metrics */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "15px",
            marginBottom: "30px"
          }}>
            {latestResult && (
              <>
                <div style={{
                  background: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Latest Grade</div>
                  <div style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: latestResult.grades?.grade === 'A' || latestResult.grades?.grade === 'B'
                      ? "#28a745"
                      : latestResult.grades?.grade === 'C' ? "#ffc107"
                      : "#dc3545"
                  }}>
                    {latestResult.grades?.grade || "N/A"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>
                    {latestResult.term} {latestResult.year}
                  </div>
                </div>

                <div style={{
                  background: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Average Score</div>
                  <div style={{ fontSize: "32px", fontWeight: "bold", color: "#667eea" }}>
                    {latestResult.grades?.average?.toFixed(1) || "N/A"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>out of 10</div>
                </div>

                <div style={{
                  background: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Class Position</div>
                  <div style={{ fontSize: "32px", fontWeight: "bold", color: "#0066cc" }}>
                    {latestResult.position}/{latestResult.outOf}
                  </div>
                  <div style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>in class</div>
                </div>

                {latestResult.attendance && (
                  <div style={{
                    background: "white",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    padding: "20px",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Attendance</div>
                    <div style={{
                      fontSize: "32px",
                      fontWeight: "bold",
                      color: (latestResult.attendance.daysPresent / latestResult.attendance.totalDays) * 100 >= 80
                        ? "#28a745" : "#ffc107"
                    }}>
                      {Math.round((latestResult.attendance.daysPresent / latestResult.attendance.totalDays) * 100)}%
                    </div>
                    <div style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>
                      {latestResult.attendance.daysPresent}/{latestResult.attendance.totalDays} days
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Trend */}
          {trend && (
            <div style={{
              background: trend.status === 'improving' ? "#d4edda"
                : trend.status === 'declining' ? "#f8d7da"
                : "#e7e8ea",
              border: trend.status === 'improving' ? "1px solid #c3e6cb"
                : trend.status === 'declining' ? "1px solid #f5c6cb"
                : "1px solid #d0d1d5",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "30px"
            }}>
              <div style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "10px",
                color: trend.status === 'improving' ? "#155724"
                  : trend.status === 'declining' ? "#721c24"
                  : "#383d41"
              }}>
                {trend.status === 'improving' ? "📈 Great Progress!" 
                  : trend.status === 'declining' ? "📉 Slight Decline"
                  : "➡️ Performance Stable"}
              </div>
              <p style={{ margin: 0, fontSize: "14px" }}>
                Your average changed by {trend.change > 0 ? '+' : ''}{trend.change} points ({trend.percentage}%)
              </p>
            </div>
          )}

          {/* Performance Summary */}
          {Object.keys(stats).length > 0 && (
            <div style={{
              background: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "30px"
            }}>
              <h3 style={{ margin: "0 0 15px 0", fontSize: "16px" }}>📊 Performance Summary</h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "15px"
              }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>Best Grade</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#28a745" }}>
                    {stats.bestGrade}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>Worst Grade</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#dc3545" }}>
                    {stats.worstGrade}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>Overall Average</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#667eea" }}>
                    {stats.averageGrade}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>Results Count</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#0066cc" }}>
                    {stats.resultsCount}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Results */}
          <div style={{
            background: "white",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "20px"
          }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "16px" }}>📋 All Results</h3>
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
                    <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Subjects</th>
                  </tr>
                </thead>
                <tbody>
                  {studentResults.map((result, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #dee2e6" }}>
                      <td style={{ padding: "12px" }}>{result.term} {result.year}</td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: "bold" }}>
                        {result.grades?.grade}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {result.grades?.average?.toFixed(1)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {result.position}/{result.outOf}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {result.subjects?.length || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tips */}
          <div style={{
            background: "#f0f4ff",
            border: "1px solid #b3d4ff",
            borderRadius: "8px",
            padding: "20px",
            marginTop: "30px"
          }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#0066cc" }}>💡 Tips for Success:</h4>
            <ul style={{ margin: 0, paddingLeft: "20px", color: "#333", fontSize: "13px" }}>
              <li>Maintain consistent attendance</li>
              <li>Focus on weak subjects with extra study</li>
              <li>Work on assignments regularly</li>
              <li>Seek help from teachers when needed</li>
              <li>Balance study with other activities</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
