import React, { useState, useEffect } from "react";
import { post, get } from "../utils/api";

export default function EngagementCampaigns({ user }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [campaignStats, setCampaignStats] = useState({
    totalStudents: 0,
    atRiskStudents: 0,
    publishedResults: 0,
    recentImprovements: 0
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTerm, setSelectedTerm] = useState("");
  const [campaignType, setCampaignType] = useState("risk-alerts");

  useEffect(() => {
    fetchCampaignStats();
  }, []);

  const fetchCampaignStats = async () => {
    try {
      const data = await get("/api/engagement/admin/stats");
      setCampaignStats({
        totalStudents: data.totalStudents || 0,
        atRiskStudents: data.atRiskStudents || 0,
        publishedResults: data.publishedResults || 0,
        recentImprovements: data.recentImprovements || 0
      });
    } catch (err) {
      console.error("Failed to fetch campaign stats:", err);
    }
  };

  const handleSendRiskAlerts = async () => {
    if (!window.confirm(`Send at-risk alerts to parents? This will email ${campaignStats.atRiskStudents} parents.`)) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await post("/api/engagement/admin/send-risk-alerts", {
        year: selectedYear,
        term: selectedTerm
      });

      setSuccess(`✅ ${response.sent || 0} risk alert emails sent to parents`);
    } catch (err) {
      setError(err?.message || "Failed to send risk alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyResultPublished = async () => {
    if (!window.confirm(`Notify parents of published results? This will email ${campaignStats.publishedResults} parents.`)) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await post("/api/engagement/admin/notify-result-published", {
        year: selectedYear,
        term: selectedTerm
      });

      setSuccess(`✅ ${response.sent || 0} result publication emails sent`);
    } catch (err) {
      setError(err?.message || "Failed to send notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleSendImprovementAlerts = async () => {
    if (!window.confirm(`Send improvement celebration emails? This will email ${campaignStats.recentImprovements} parents.`)) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await post("/api/engagement/admin/send-improvement-alerts", {
        year: selectedYear,
        threshold: 0.5 // Students improved by 0.5+ points
      });

      setSuccess(`✅ ${response.sent || 0} celebration emails sent to parents`);
    } catch (err) {
      setError(err?.message || "Failed to send improvement alerts");
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📧 Engagement Campaigns</h2>
        <p style={styles.subtitle}>Send automated notifications to parents about student performance</p>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Campaign Statistics */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div style={styles.statInfo}>
            <div style={styles.statNumber}>{campaignStats.totalStudents}</div>
            <div style={styles.statLabel}>Total Students</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⚠️</div>
          <div style={styles.statInfo}>
            <div style={styles.statNumber}>{campaignStats.atRiskStudents}</div>
            <div style={styles.statLabel}>At-Risk (This Term)</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statInfo}>
            <div style={styles.statNumber}>{campaignStats.publishedResults}</div>
            <div style={styles.statLabel}>Published Results</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📈</div>
          <div style={styles.statInfo}>
            <div style={styles.statNumber}>{campaignStats.recentImprovements}</div>
            <div style={styles.statLabel}>Recent Improvements</div>
          </div>
        </div>
      </div>

      {/* Campaign Selection */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🎯 Filters</h3>
        
        <div style={styles.filterGrid}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={styles.input}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.label}>Term (Optional)</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              style={styles.input}
            >
              <option value="">All Terms</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaign Options */}
      <div style={styles.campaignsContainer}>
        {/* Risk Alerts Campaign */}
        <div style={styles.campaignCard}>
          <div style={styles.campaignHeader}>
            <div>
              <h3 style={styles.campaignTitle}>⚠️ At-Risk Student Alerts</h3>
              <p style={styles.campaignDescription}>
                Alert parents of students performing below expectations with actionable recommendations
              </p>
            </div>
          </div>

          <div style={styles.campaignDetails}>
            <div style={styles.detailRow}>
              <span>📧 Recipients:</span>
              <strong>{campaignStats.atRiskStudents} parents</strong>
            </div>
            <div style={styles.detailRow}>
              <span>📋 Content:</span>
              <span>Performance summary, risk factors, recommendations</span>
            </div>
            <div style={styles.detailRow}>
              <span>🎯 Purpose:</span>
              <span>Early intervention and support for struggling students</span>
            </div>
          </div>

          <div style={styles.campaignFooter}>
            <button
              onClick={handleSendRiskAlerts}
              disabled={loading || campaignStats.atRiskStudents === 0}
              style={{
                ...styles.actionButton,
                background: "#ef4444",
                opacity: loading || campaignStats.atRiskStudents === 0 ? 0.6 : 1
              }}
            >
              {loading ? "Sending..." : "📧 Send Risk Alerts"}
            </button>
          </div>
        </div>

        {/* Result Published Campaign */}
        <div style={styles.campaignCard}>
          <div style={styles.campaignHeader}>
            <div>
              <h3 style={styles.campaignTitle}>📊 Result Publication Notification</h3>
              <p style={styles.campaignDescription}>
                Notify parents when new results are published with summary statistics
              </p>
            </div>
          </div>

          <div style={styles.campaignDetails}>
            <div style={styles.detailRow}>
              <span>📧 Recipients:</span>
              <strong>{campaignStats.publishedResults} parents</strong>
            </div>
            <div style={styles.detailRow}>
              <span>📋 Content:</span>
              <span>Grade, position, subject breakdown, term average</span>
            </div>
            <div style={styles.detailRow}>
              <span>🎯 Purpose:</span>
              <span>Immediate notification of result availability</span>
            </div>
          </div>

          <div style={styles.campaignFooter}>
            <button
              onClick={handleNotifyResultPublished}
              disabled={loading || campaignStats.publishedResults === 0}
              style={{
                ...styles.actionButton,
                background: "#3b82f6",
                opacity: loading || campaignStats.publishedResults === 0 ? 0.6 : 1
              }}
            >
              {loading ? "Sending..." : "📧 Notify Results Published"}
            </button>
          </div>
        </div>

        {/* Improvement Celebration Campaign */}
        <div style={styles.campaignCard}>
          <div style={styles.campaignHeader}>
            <div>
              <h3 style={styles.campaignTitle}>🎉 Improvement Celebration</h3>
              <p style={styles.campaignDescription}>
                Celebrate student progress with parents when significant improvement is detected
              </p>
            </div>
          </div>

          <div style={styles.campaignDetails}>
            <div style={styles.detailRow}>
              <span>📧 Recipients:</span>
              <strong>{campaignStats.recentImprovements} parents</strong>
            </div>
            <div style={styles.detailRow}>
              <span>📋 Content:</span>
              <span>Improvement details, strength areas, encouragement message</span>
            </div>
            <div style={styles.detailRow}>
              <span>🎯 Purpose:</span>
              <span>Positive reinforcement and celebration of academic progress</span>
            </div>
            <div style={styles.detailRow}>
              <span>📈 Threshold:</span>
              <span>Students improved by 0.5+ points</span>
            </div>
          </div>

          <div style={styles.campaignFooter}>
            <button
              onClick={handleSendImprovementAlerts}
              disabled={loading || campaignStats.recentImprovements === 0}
              style={{
                ...styles.actionButton,
                background: "#10b981",
                opacity: loading || campaignStats.recentImprovements === 0 ? 0.6 : 1
              }}
            >
              {loading ? "Sending..." : "🎉 Send Celebrations"}
            </button>
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div style={styles.infoBox}>
        <h4 style={styles.infoTitle}>💡 How Engagement Works</h4>
        <ul style={styles.infoList}>
          <li><strong>At-Risk Alerts:</strong> Automatically identifies students with grades below 4.0 or attendance issues</li>
          <li><strong>Publication Notices:</strong> Sends whenever you publish new results from the Results Management section</li>
          <li><strong>Improvement Celebrations:</strong> Detects when students gain 0.5+ points from previous term</li>
          <li><strong>Email Delivery:</strong> All campaigns send beautiful HTML emails with action links</li>
          <li><strong>Parent Portal Access:</strong> Links in emails allow parents to view full details and recommendations</li>
        </ul>
      </div>

      {/* Campaign History */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📜 Recent Campaigns</h3>
        <div style={styles.historyPlaceholder}>
          <p>Campaign history will be logged here. First campaign sent will appear below.</p>
          <p style={styles.historyHint}>Tip: Use the campaigns above to start engaging with parents today!</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif"
  },
  header: {
    marginBottom: "30px",
    borderBottom: "2px solid #667eea",
    paddingBottom: "15px"
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0 0 10px 0"
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0
  },
  error: {
    background: "#fee2e2",
    border: "1px solid #fca5a5",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px"
  },
  success: {
    background: "#dcfce7",
    border: "1px solid #86efac",
    color: "#166534",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px"
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "12px",
    padding: "20px",
    color: "white"
  },
  statIcon: {
    fontSize: "32px"
  },
  statInfo: {
    display: "flex",
    flexDirection: "column"
  },
  statNumber: {
    fontSize: "24px",
    fontWeight: "bold"
  },
  statLabel: {
    fontSize: "12px",
    opacity: 0.9
  },
  section: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#0f172a",
    margin: "0 0 16px 0"
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px"
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a"
  },
  input: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontFamily: "Arial, sans-serif"
  },
  campaignsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "24px"
  },
  campaignCard: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    flexDirection: "column"
  },
  campaignHeader: {
    marginBottom: "16px"
  },
  campaignTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0 0 8px 0"
  },
  campaignDescription: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0
  },
  campaignDetails: {
    flex: 1,
    background: "#f8fafc",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "16px"
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
    color: "#475569",
    marginBottom: "8px",
    paddingBottom: "8px",
    borderBottom: "1px solid #e2e8f0"
  },
  campaignFooter: {
    display: "flex",
    gap: "8px"
  },
  actionButton: {
    flex: 1,
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "transform 0.2s ease"
  },
  infoBox: {
    background: "#f0f4ff",
    border: "1px solid #c7d2fe",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px"
  },
  infoTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#312e81",
    margin: "0 0 12px 0"
  },
  infoList: {
    margin: 0,
    paddingLeft: "20px",
    color: "#312e81",
    fontSize: "13px"
  },
  historyPlaceholder: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#94a3b8",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "2px dashed #cbd5e1"
  },
  historyHint: {
    fontSize: "12px",
    marginTop: "8px"
  }
};
