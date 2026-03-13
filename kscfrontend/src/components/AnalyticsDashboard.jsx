import React, { useState, useEffect } from "react";
import { get } from "../utils/api";

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("class-statistics");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ year: new Date().getFullYear(), term: "", class: "" });
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    // Generate years (current year and 5 previous)
    const currentYear = new Date().getFullYear();
    const yearList = Array.from({ length: 6 }, (_, i) => currentYear - i).sort((a, b) => a - b);
    setYears(yearList);
    setClasses(["Form 1", "Form 2", "Form 3", "Form 4"]);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [filters, activeTab]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      
      let url = `/api/results/admin/analytics/${activeTab}`;
      const queryParams = [];
      
      if (filters.year) queryParams.push(`year=${filters.year}`);
      if (filters.term && activeTab !== "year-over-year") queryParams.push(`term=${filters.term}`);
      if (filters.class && (activeTab === "subject-analytics" || activeTab === "year-over-year")) {
        queryParams.push(`class=${encodeURIComponent(filters.class)}`);
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      const result = await get(url);
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
      console.error("Analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderClassStatistics = () => {
    if (!data?.classStatistics || data.classStatistics.length === 0) {
      return <div style={{ padding: "20px", textAlign: "center" }}>No data available</div>;
    }

    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
          fontSize: "14px"
        }}>
          <thead style={{ background: "#f8f9fa" }}>
            <tr>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Class</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Students</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Mean Grade</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Min-Max</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>A-B-C</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {data.classStatistics.map((cls, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #dee2e6" }}>
                <td style={{ padding: "12px" }}><strong>{cls.className}</strong></td>
                <td style={{ padding: "12px", textAlign: "center" }}>{cls.studentCount}</td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <span style={{ background: "#e8f4f8", padding: "4px 8px", borderRadius: "4px" }}>
                    {cls.meanGrade}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "center", fontSize: "12px" }}>
                  {cls.minGrade.toFixed(1)} - {cls.maxGrade.toFixed(1)}
                </td>
                <td style={{ padding: "12px", textAlign: "center", fontSize: "12px" }}>
                  {cls.gradeDistribution.A} - {cls.gradeDistribution.B} - {cls.gradeDistribution.C}
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <span style={{ 
                    background: cls.averageAttendance >= 80 ? "#d4edda" : "#fff3cd",
                    padding: "4px 8px",
                    borderRadius: "4px"
                  }}>
                    {cls.averageAttendance}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSubjectAnalytics = () => {
    if (!data?.subjectAnalytics || data.subjectAnalytics.length === 0) {
      return <div style={{ padding: "20px", textAlign: "center" }}>No data available</div>;
    }

    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
          fontSize: "14px"
        }}>
          <thead style={{ background: "#f8f9fa" }}>
            <tr>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Subject</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Students</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Mean</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Median</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Std Dev</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Pass Rate</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>A-B-C-D-E</th>
            </tr>
          </thead>
          <tbody>
            {data.subjectAnalytics.map((subject, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #dee2e6" }}>
                <td style={{ padding: "12px" }}><strong>{subject.name}</strong></td>
                <td style={{ padding: "12px", textAlign: "center" }}>{subject.studentCount}</td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <span style={{ background: "#e8f4f8", padding: "4px 8px", borderRadius: "4px" }}>
                    {subject.meanScore}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>{subject.medianScore.toFixed(1)}</td>
                <td style={{ padding: "12px", textAlign: "center", fontSize: "12px" }}>{subject.standardDeviation}</td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <span style={{ background: "#d4edda", padding: "4px 8px", borderRadius: "4px" }}>
                    {subject.passRate}%
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "center", fontSize: "12px" }}>
                  {subject.gradeDistribution.A}-{subject.gradeDistribution.B}-{subject.gradeDistribution.C}-
                  {subject.gradeDistribution.D}-{subject.gradeDistribution.E}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRiskRegister = () => {
    if (!data?.atRiskStudents || data.atRiskStudents.length === 0) {
      return <div style={{ padding: "40px", textAlign: "center", color: "#28a745", fontSize: "16px" }}>
        ✓ No at-risk students identified for {filters.year}
      </div>;
    }

    return (
      <div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginBottom: "30px"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{data.atRiskCount}</div>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>Total At-Risk</div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{data.highRisk}</div>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>HIGH Risk</div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
            color: "white",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{data.mediumRisk}</div>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>MEDIUM Risk</div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
            fontSize: "13px"
          }}>
            <thead style={{ background: "#f8f9fa" }}>
              <tr>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Student</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Class</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Grade</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Attendance</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Risk Level</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Factors</th>
              </tr>
            </thead>
            <tbody>
              {data.atRiskStudents.map((student, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #dee2e6" }}>
                  <td style={{ padding: "12px" }}>
                    <div><strong>{student.name}</strong></div>
                    <div style={{ fontSize: "11px", color: "#666" }}>{student.admissionNumber}</div>
                  </td>
                  <td style={{ padding: "12px" }}>{student.class}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span style={{ background: "#e8f4f8", padding: "4px 8px", borderRadius: "4px" }}>
                      {student.overallGrade.toFixed(1)}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "12px" }}>
                    {student.attendance ? `${student.attendance.rate}%` : "N/A"}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span style={{
                      background: student.riskLevel === 'HIGH' ? '#f5576c' 
                        : student.riskLevel === 'MEDIUM' ? '#fee140' : '#d4edda',
                      color: student.riskLevel === 'HIGH' ? 'white'
                        : student.riskLevel === 'MEDIUM' ? '#333' : '#155724',
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontWeight: "600",
                      fontSize: "12px"
                    }}>
                      {student.riskLevel}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "#666" }}>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {student.riskFactors.map((factor, fidx) => (
                        <li key={fidx}>{factor}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderYearOverYear = () => {
    if (!data?.yearTrends || data.yearTrends.length === 0) {
      return <div style={{ padding: "20px", textAlign: "center" }}>No data available</div>;
    }

    return (
      <div>
        {data.overallImprovement && (
          <div style={{
            background: data.overallImprovement.change >= 0 ? "#d4edda" : "#f8d7da",
            border: `1px solid ${data.overallImprovement.change >= 0 ? "#c3e6cb" : "#f5c6cb"}`,
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "30px"
          }}>
            <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
              📈 Overall Trend: {data.overallImprovement.from} → {data.overallImprovement.to}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#666" }}>Starting Average</div>
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>{data.overallImprovement.fromAverage}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#666" }}>Ending Average</div>
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>{data.overallImprovement.toAverage}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#666" }}>Change</div>
                <div style={{ 
                  fontSize: "20px", 
                  fontWeight: "bold",
                  color: data.overallImprovement.change >= 0 ? "#28a745" : "#dc3545"
                }}>
                  {data.overallImprovement.change >= 0 ? "+" : ""}{data.overallImprovement.change}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#666" }}>Percent Change</div>
                <div style={{ 
                  fontSize: "20px", 
                  fontWeight: "bold",
                  color: data.overallImprovement.percentChange >= 0 ? "#28a745" : "#dc3545"
                }}>
                  {data.overallImprovement.percentChange >= 0 ? "+" : ""}{data.overallImprovement.percentChange}%
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
            fontSize: "14px"
          }}>
            <thead style={{ background: "#f8f9fa" }}>
              <tr>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Year</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Term</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Students</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Mean Grade</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Grade A</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Grade E</th>
              </tr>
            </thead>
            <tbody>
              {data.yearTrends.map((yearData, yidx) => (
                yearData.terms.map((term, tidx) => (
                  <tr key={`${yidx}-${tidx}`} style={{ borderBottom: "1px solid #dee2e6" }}>
                    <td style={{ padding: "12px" }}><strong>{yearData.year}</strong></td>
                    <td style={{ padding: "12px" }}>{term.term}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{term.studentCount}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span style={{ background: "#e8f4f8", padding: "4px 8px", borderRadius: "4px" }}>
                        {term.meanGrade}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span style={{ background: "#d4edda", padding: "4px 8px", borderRadius: "4px" }}>
                        {term.gradeACount}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span style={{ background: "#f8d7da", padding: "4px 8px", borderRadius: "4px" }}>
                        {term.gradeECount}
                      </span>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "class-statistics":
        return renderClassStatistics();
      case "subject-analytics":
        return renderSubjectAnalytics();
      case "risk-register":
        return renderRiskRegister();
      case "year-over-year":
        return renderYearOverYear();
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto" }}>
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "30px",
        borderRadius: "12px",
        marginBottom: "30px"
      }}>
        <h1 style={{ margin: 0, marginBottom: "10px" }}>📊 Analytics Dashboard</h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: "14px" }}>Phase 3: Comprehensive performance insights and analytics</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "30px",
        borderBottom: "2px solid #e0e0e0",
        overflowX: "auto"
      }}>
        {[
          { id: "class-statistics", label: "📚 Class Statistics", emoji: "📊" },
          { id: "subject-analytics", label: "📖 Subject Analytics", emoji: "📈" },
          { id: "risk-register", label: "⚠️ Risk Register", emoji: "🚨" },
          { id: "year-over-year", label: "📉 Year-over-Year", emoji: "📅" }
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
              fontSize: "14px",
              whiteSpace: "nowrap"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "15px",
        marginBottom: "30px",
        background: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px"
      }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", color: "#666", marginBottom: "5px", fontWeight: "600" }}>
            Year
          </label>
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {activeTab !== "year-over-year" && (
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#666", marginBottom: "5px", fontWeight: "600" }}>
              Term
            </label>
            <select
              value={filters.term}
              onChange={(e) => setFilters({ ...filters, term: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            >
              <option value="">All Terms</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
        )}

        {(activeTab === "subject-analytics" || activeTab === "year-over-year") && (
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#666", marginBottom: "5px", fontWeight: "600" }}>
              Class
            </label>
            <select
              value={filters.class}
              onChange={(e) => setFilters({ ...filters, class: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error Message */}
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

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: "center",
          padding: "40px",
          fontSize: "16px",
          color: "#666"
        }}>
          ⏳ Loading analytics data...
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "15px",
            marginBottom: "30px"
          }}>
            {data.totalClasses && (
              <div style={{
                background: "#e8f4f8",
                padding: "15px",
                borderRadius: "8px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#0066cc" }}>
                  {data.totalClasses || data.totalSubjects || data.totalYears}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {data.totalClasses ? "Classes" : data.totalSubjects ? "Subjects" : "Years"}
                </div>
              </div>
            )}
            {data.totalStudents && (
              <div style={{
                background: "#e8f5e9",
                padding: "15px",
                borderRadius: "8px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#28a745" }}>
                  {data.totalStudents}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>Total Students</div>
              </div>
            )}
          </div>

          {renderContent()}
        </div>
      )}
    </div>
  );
}
