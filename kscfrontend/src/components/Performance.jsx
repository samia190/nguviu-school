import { useEffect, useState, useMemo } from "react";
import { get } from "../utils/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// ========== CATEGORY COLORS ==========
const categoryColors = {
  "Academic Excellence": { bg: "#e3f2fd", text: "#1976d2" },
  "KCSE Results": { bg: "#f3e5f5", text: "#7b1fa2" },
  "National Rankings": { bg: "#fff3e0", text: "#e65100" },
  "Co-curricular": { bg: "#e8f5e9", text: "#2e7d32" },
  "Competitions": { bg: "#fce4ec", text: "#c2185b" },
  "University Admissions": { bg: "#e0f2f1", text: "#00695c" },
  Other: { bg: "#f5f5f5", text: "#616161" },
};

const rankingColors = {
  National: { bg: "#ffd700", text: "#8b6914" },
  International: { bg: "#ff6b6b", text: "#ffffff" },
  Regional: { bg: "#4ecdc4", text: "#ffffff" },
  County: { bg: "#95e1d3", text: "#1a5653" },
  "Sub-County": { bg: "#dfe6e9", text: "#2d3436" },
};

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "10px 14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: 13 }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(4) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function Performance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    get("/api/performance-page")
      .then((result) => {
        setData(result);
        setError("");
      })
      .catch(() => setError("Failed to load performance data."))
      .finally(() => setLoading(false));
  }, []);

  // Sort KCSE results by year ascending for charts
  const sortedResults = useMemo(() => {
    if (!data?.kcseResults) return [];
    return [...data.kcseResults].sort((a, b) => a.year - b.year);
  }, [data?.kcseResults]);

  // Analytics computed from real numeric data
  const analytics = useMemo(() => {
    if (!sortedResults.length) return null;

    const scores = sortedResults.map((r) => r.meanScore);
    const bestIdx = scores.indexOf(Math.max(...scores));
    const worstIdx = scores.indexOf(Math.min(...scores));
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Trend: linear regression slope
    const n = scores.length;
    const sumX = scores.reduce((s, _, i) => s + i, 0);
    const sumY = scores.reduce((s, v) => s + v, 0);
    const sumXY = scores.reduce((s, v, i) => s + i * v, 0);
    const sumX2 = scores.reduce((s, _, i) => s + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Year-over-year changes
    const yoyChanges = sortedResults.slice(1).map((curr, i) => {
      const prev = sortedResults[i];
      const change = curr.meanScore - prev.meanScore;
      return {
        period: `${prev.year} → ${curr.year}`,
        change,
        improved: change > 0,
      };
    });

    return {
      best: sortedResults[bestIdx],
      worst: sortedResults[worstIdx],
      avg,
      slope,
      latest: sortedResults[sortedResults.length - 1],
      totalYears: sortedResults.length,
      yoyChanges,
      improvementYears: yoyChanges.filter((c) => c.improved).length,
    };
  }, [sortedResults]);

  // Filter achievements by category
  const filteredAchievements = useMemo(() => {
    if (!data?.achievements) return [];
    if (selectedCategory === "All") return data.achievements;
    return data.achievements.filter((a) => a.category === selectedCategory);
  }, [data?.achievements, selectedCategory]);

  const achievementCategories = useMemo(() => {
    if (!data?.achievements) return ["All"];
    const cats = [...new Set(data.achievements.map((a) => a.category))];
    return ["All", ...cats];
  }, [data?.achievements]);

  // Chart data for the bar chart (color coded by grade)
  const barChartData = useMemo(() => {
    return sortedResults.map((r) => ({
      ...r,
      fill: r.meanScore >= 8 ? "#10b981" : r.meanScore >= 7 ? "#667eea" : "#f59e0b",
    }));
  }, [sortedResults]);

  if (loading) {
    return (
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "#6b7280", fontSize: 16 }}>Loading performance data…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "#dc2626" }}>{error}</p>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px", background: "#fff" }}>
      {/* ===== Header ===== */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 50,
          paddingBottom: 30,
          borderBottom: "3px solid #667eea",
        }}
      >
        <h2
          style={{
            fontSize: "2.2rem",
            fontWeight: 800,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: 0,
          }}
        >
          {data.title || "School Performance"}
        </h2>
        <p
          style={{
            maxWidth: 800,
            margin: "20px auto 0",
            fontSize: "1.1rem",
            lineHeight: 1.8,
            color: "#4b5563",
          }}
        >
          {data.intro}
        </p>
      </div>

      {/* ===== Quick Stats Cards ===== */}
      {analytics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
            marginBottom: 40,
          }}
        >
          {/* Overall Trend */}
          <div
            style={{
              background: analytics.slope > 0.01 ? "#d1fae5" : analytics.slope < -0.01 ? "#fee2e2" : "#e0e7ff",
              borderRadius: 12,
              padding: 20,
              border: `2px solid ${analytics.slope > 0.01 ? "#10b981" : analytics.slope < -0.01 ? "#ef4444" : "#6366f1"}`,
            }}
          >
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Overall Trend</div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: analytics.slope > 0.01 ? "#065f46" : analytics.slope < -0.01 ? "#991b1b" : "#3730a3",
              }}
            >
              {analytics.slope > 0.01 ? "↗" : analytics.slope < -0.01 ? "↘" : "→"}
            </div>
            <div style={{ fontSize: 13, color: "#4b5563" }}>
              {analytics.slope > 0.01 ? "Improving" : analytics.slope < -0.01 ? "Declining" : "Stable"} over{" "}
              {analytics.totalYears} years
            </div>
          </div>

          {/* Best Year */}
          <div
            style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              borderRadius: 12,
              padding: 20,
              color: "#fff",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Best Year</div>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{analytics.best.year}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              {analytics.best.meanScore.toFixed(4)} ({analytics.best.meanGrade})
            </div>
          </div>

          {/* Average */}
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 12,
              padding: 20,
              color: "#fff",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Average Mean Score</div>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{analytics.avg.toFixed(2)}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Across {analytics.totalYears} years</div>
          </div>

          {/* Latest */}
          <div
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              borderRadius: 12,
              padding: 20,
              color: "#fff",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Latest ({analytics.latest.year})</div>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{analytics.latest.meanScore.toFixed(4)}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Mean Grade: {analytics.latest.meanGrade}</div>
          </div>
        </div>
      )}

      {/* ===== KCSE Results Table ===== */}
      {sortedResults.length > 0 && (
        <div
          style={{
            background: "#f9fafb",
            borderRadius: 12,
            padding: 30,
            marginBottom: 40,
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#1f2937",
            }}
          >
            📊 {data.resultsHeading || "KCSE Performance Over the Years"}
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden" }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  <th style={{ padding: 14, textAlign: "left", color: "#fff", fontWeight: 700, fontSize: 13 }}>Year</th>
                  <th style={{ padding: 14, textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>Mean Score</th>
                  <th style={{ padding: 14, textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>Mean Grade</th>
                  <th style={{ padding: 14, textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {[...sortedResults].reverse().map((r, idx) => {
                  // Find YoY change (compare to previous year in time order)
                  const sortedIdx = sortedResults.findIndex((s) => s.year === r.year);
                  const prevResult = sortedIdx > 0 ? sortedResults[sortedIdx - 1] : null;
                  const change = prevResult ? r.meanScore - prevResult.meanScore : null;

                  return (
                    <tr
                      key={r.year}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        background: idx % 2 === 0 ? "#fff" : "#f9fafb",
                      }}
                    >
                      <td style={{ padding: 14, fontWeight: 700, fontSize: 15, color: "#1f2937" }}>{r.year}</td>
                      <td style={{ padding: 14, textAlign: "center", fontSize: 15, fontWeight: 600, color: "#374151" }}>
                        {r.meanScore.toFixed(4)}
                      </td>
                      <td style={{ padding: 14, textAlign: "center" }}>
                        <span
                          style={{
                            padding: "4px 14px",
                            borderRadius: 16,
                            fontWeight: 700,
                            fontSize: 13,
                            background: r.meanScore >= 8 ? "#d1fae5" : r.meanScore >= 7 ? "#dbeafe" : "#fef3c7",
                            color: r.meanScore >= 8 ? "#065f46" : r.meanScore >= 7 ? "#1e40af" : "#92400e",
                          }}
                        >
                          {r.meanGrade}
                        </span>
                      </td>
                      <td style={{ padding: 14, textAlign: "center" }}>
                        {change !== null ? (
                          <span
                            style={{
                              padding: "4px 12px",
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 600,
                              background: change > 0 ? "#d1fae5" : change < 0 ? "#fee2e2" : "#f3f4f6",
                              color: change > 0 ? "#065f46" : change < 0 ? "#991b1b" : "#6b7280",
                            }}
                          >
                            {change > 0 ? "+" : ""}
                            {change.toFixed(4)}
                          </span>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Mean Score Trend Chart (AreaChart) ===== */}
      {sortedResults.length >= 2 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 30,
            marginBottom: 40,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: "0 0 25px 0",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#1f2937",
            }}
          >
            📈 Mean Score Trend
          </h3>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={sortedResults} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="meanScoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" stroke="#6b7280" fontSize={13} fontWeight={600} />
              <YAxis
                domain={["auto", "auto"]}
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="meanScore"
                name="Mean Score"
                stroke="#667eea"
                strokeWidth={3}
                fill="url(#meanScoreGrad)"
                dot={{ r: 5, fill: "#667eea", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 7, fill: "#764ba2" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ===== Year Comparison Bar Chart ===== */}
      {barChartData.length >= 2 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 30,
            marginBottom: 40,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ margin: "0 0 25px 0", fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
            📊 Year-by-Year Comparison
          </h3>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: -15, marginBottom: 20 }}>
            Green ≥ 8.0 (B-) · Blue ≥ 7.0 (C+) · Amber &lt; 7.0
          </p>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" stroke="#6b7280" fontSize={13} fontWeight={600} />
              <YAxis
                domain={["auto", "auto"]}
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="meanScore" name="Mean Score" radius={[6, 6, 0, 0]}>
                {barChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ===== Year-over-Year Analysis Table ===== */}
      {analytics && analytics.yoyChanges.length > 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 30,
            marginBottom: 40,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ margin: "0 0 20px 0", fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
            📅 Year-over-Year Analysis
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 700, color: "#374151" }}>
                    Period
                  </th>
                  <th style={{ padding: 12, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#374151" }}>
                    Change in Mean Score
                  </th>
                  <th style={{ padding: 12, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#374151" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.yoyChanges.map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: 12, fontSize: 14, color: "#1f2937", fontWeight: 500 }}>{c.period}</td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 14px",
                          borderRadius: 12,
                          fontSize: 13,
                          fontWeight: 600,
                          background: c.improved ? "#d1fae5" : "#fee2e2",
                          color: c.improved ? "#065f46" : "#991b1b",
                        }}
                      >
                        {c.improved ? "+" : ""}
                        {c.change.toFixed(4)}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: "center", fontSize: 20 }}>
                      {c.improved ? "📈" : "📉"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Key Insights ===== */}
      {analytics && (
        <div
          style={{
            background: "linear-gradient(135deg, #e0e7ff 0%, #fce7f3 100%)",
            borderRadius: 12,
            padding: 25,
            marginBottom: 40,
            border: "2px solid #c7d2fe",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", fontSize: "1.3rem", fontWeight: 700, color: "#1f2937" }}>
            💡 Key Insights
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2, color: "#374151" }}>
            <li>
              Average mean score: <strong>{analytics.avg.toFixed(4)}</strong> across {analytics.totalYears} years.
            </li>
            <li>
              Best performance in <strong>{analytics.best.year}</strong> with{" "}
              <strong>
                {analytics.best.meanScore.toFixed(4)} ({analytics.best.meanGrade})
              </strong>
              .
            </li>
            <li>
              Latest result ({analytics.latest.year}):{" "}
              <strong>
                {analytics.latest.meanScore.toFixed(4)} ({analytics.latest.meanGrade})
              </strong>
              .
            </li>
            <li>
              Overall trend:{" "}
              <strong>
                {analytics.slope > 0.01 ? "Improving 📈" : analytics.slope < -0.01 ? "Declining 📉" : "Stable →"}
              </strong>
            </li>
            <li>
              <strong>{analytics.improvementYears}</strong> out of {analytics.yoyChanges.length} transitions showed
              improvement.
            </li>
          </ul>
        </div>
      )}

      {/* ===== Achievements Section ===== */}
      {data.achievements && data.achievements.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 12,
            padding: 30,
            marginBottom: 40,
            boxShadow: "0 10px 30px rgba(102, 126, 234, 0.2)",
          }}
        >
          <h3 style={{ color: "#fff", marginTop: 0, marginBottom: 20, fontSize: "1.5rem", fontWeight: 700 }}>
            🏆 {data.achievementsHeading || "School Achievements"}
          </h3>

          {/* Category Filter */}
          {achievementCategories.length > 2 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {achievementCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 20,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: selectedCategory === cat ? "#fff" : "rgba(255,255,255,0.2)",
                    color: selectedCategory === cat ? "#667eea" : "#fff",
                    transition: "all 0.2s",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Achievements list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredAchievements.map((a, i) => (
              <div
                key={a._id || i}
                style={{
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: 10,
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1f2937" }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                    {a.year} · {a.term}
                    <span
                      style={{
                        marginLeft: 8,
                        padding: "2px 10px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        background: (categoryColors[a.category] || categoryColors.Other).bg,
                        color: (categoryColors[a.category] || categoryColors.Other).text,
                      }}
                    >
                      {a.category}
                    </span>
                    {a.ranking && (
                      <span
                        style={{
                          marginLeft: 6,
                          padding: "2px 10px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                          background: (rankingColors[a.ranking] || { bg: "#e0e0e0" }).bg,
                          color: (rankingColors[a.ranking] || { text: "#666" }).text,
                        }}
                      >
                        {a.ranking}
                      </span>
                    )}
                  </div>
                  {a.description && (
                    <div style={{ fontSize: 13, color: "#4b5563", marginTop: 6, lineHeight: 1.6 }}>
                      {a.description}
                    </div>
                  )}
                </div>
                {a.metric && (
                  <div
                    style={{
                      flexShrink: 0,
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#667eea",
                      textAlign: "center",
                      minWidth: 80,
                    }}
                  >
                    {a.metric}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Highlights ===== */}
      {data.highlights && (
        <div
          style={{
            background: "#fff7ed",
            borderRadius: 12,
            padding: 30,
            marginBottom: 40,
            borderLeft: "5px solid #f59e0b",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", fontSize: "1.3rem", fontWeight: 700, color: "#1f2937" }}>
            🌟 {data.highlightsHeading || "Progress Highlights"}
          </h3>
          <div
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.9,
              color: "#374151",
              whiteSpace: "pre-line",
            }}
          >
            {data.highlights}
          </div>
        </div>
      )}

      {/* ===== Reports ===== */}
      {data.reports && data.reports.length > 0 && (
        <div
          style={{
            background: "#ecfdf5",
            borderRadius: 12,
            padding: 30,
            borderLeft: "5px solid #10b981",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", fontSize: "1.3rem", fontWeight: 700, color: "#1f2937" }}>
            📄 {data.reportsHeading || "Downloadable Reports"}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.reports.map((r, i) => (
              <a
                key={r._id || i}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  background: "#fff",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: "#1f2937",
                  border: "1px solid #d1fae5",
                  transition: "all 0.2s",
                  fontWeight: 500,
                }}
              >
                <span style={{ fontSize: 20 }}>📥</span>
                {r.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
