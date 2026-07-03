// components/LinkAnalytics.jsx
import React, { useState, useEffect } from "react";
import { BarChart, TrendingUp, Globe, AlertCircle } from "lucide-react";

export default function LinkAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkId = params.get("id");
    if (linkId) {
      fetchAnalytics(linkId);
    }
  }, []);

  const fetchAnalytics = async (linkId) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`/api/links/${linkId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalytics(data.analytics);
      setSummary(data.summary);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 20px" }}>Loading analytics...</div>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>📊 Link Analytics</h1>

      {error && (
        <div style={{ background: "#fee", padding: "15px", borderRadius: "6px", marginBottom: "20px", display: "flex", gap: "10px" }}>
          <AlertCircle size={20} style={{ color: "#c00" }} />
          {error}
        </div>
      )}

      {summary && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #ddd" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>Total Clicks</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{summary.totalClicks}</div>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #ddd" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>Unique Visitors</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{summary.uniqueVisitors?.length || 0}</div>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #ddd" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>Avg Clicks/Day</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{summary.avgClicksPerDay}</div>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #ddd" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>Last Accessed</div>
            <div style={{ fontSize: "14px", fontWeight: "bold" }}>
              {summary.lastAccessed ? new Date(summary.lastAccessed).toLocaleString() : "Never"}
            </div>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>Recent Clicks</h2>
      {analytics && analytics.length > 0 ? (
        <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "bold" }}>IP Address</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "bold" }}>Device</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "bold" }}>Country</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "bold" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {analytics.slice(0, 10).map((click, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px" }}>{click.visitorIp}</td>
                  <td style={{ padding: "12px" }}>{click.deviceType || "Unknown"}</td>
                  <td style={{ padding: "12px" }}>{click.country || "Unknown"}</td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "#666" }}>
                    {new Date(click.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
          No analytics data yet
        </div>
      )}
    </div>
  );
}
