import { useEffect, useState } from "react";
import { get, put } from "../utils/api";

const CATEGORIES = [
  "Academic Excellence",
  "KCSE Results",
  "National Rankings",
  "Co-curricular",
  "Competitions",
  "University Admissions",
  "Other",
];

const TERMS = ["Term 1", "Term 2", "Term 3", "Annual"];

const tabStyle = (active) => ({
  padding: "10px 20px",
  border: "none",
  borderBottom: active ? "3px solid #667eea" : "3px solid transparent",
  background: active ? "#f0f4ff" : "transparent",
  color: active ? "#667eea" : "#6b7280",
  fontWeight: active ? "700" : "500",
  cursor: "pointer",
  fontSize: "14px",
  transition: "all 0.2s",
});

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 20,
  marginBottom: 20,
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  marginTop: 4,
};

const btnPrimary = {
  padding: "8px 18px",
  background: "#667eea",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
};

const btnDanger = {
  padding: "6px 14px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
};

const btnSuccess = {
  padding: "8px 18px",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
};

export default function PerformanceManagement() {
  const [tab, setTab] = useState("settings");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // KCSE form
  const [newKcse, setNewKcse] = useState({ year: "", meanScore: "", meanGrade: "" });
  // Achievement form
  const [newAchievement, setNewAchievement] = useState({
    year: new Date().getFullYear(),
    term: "Annual",
    category: "Other",
    title: "",
    description: "",
    metric: "",
    ranking: "",
    published: true,
  });
  // Report form
  const [newReport, setNewReport] = useState({ name: "", url: "" });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const result = await get("/api/performance-page/admin");
      setData(result);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Failed to load performance page data.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAll(updates) {
    setSaving(true);
    setSuccess("");
    try {
      const result = await put("/api/performance-page", updates);
      setData(result);
      setSuccess("Saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to save: " + (e.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  function updateField(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  // ===== KCSE CRUD =====
  function addKcseResult() {
    const year = parseInt(newKcse.year);
    const meanScore = parseFloat(newKcse.meanScore);
    if (!year || year < 2000 || year > new Date().getFullYear() + 1) {
      alert("Enter a valid year (2000 - next year)");
      return;
    }
    if (isNaN(meanScore) || meanScore < 0 || meanScore > 12) {
      alert("Enter a valid mean score (0 - 12)");
      return;
    }
    if (!newKcse.meanGrade.trim()) {
      alert("Enter the mean grade (e.g. C+, B-)");
      return;
    }
    // Check duplicate year
    if ((data.kcseResults || []).some((r) => r.year === year)) {
      alert("A record for year " + year + " already exists. Edit or delete it first.");
      return;
    }
    const updated = [...(data.kcseResults || []), { year, meanScore, meanGrade: newKcse.meanGrade.trim() }];
    updated.sort((a, b) => a.year - b.year);
    saveAll({ kcseResults: updated });
    setNewKcse({ year: "", meanScore: "", meanGrade: "" });
  }

  function deleteKcseResult(year) {
    if (!confirm(`Delete KCSE record for ${year}?`)) return;
    const updated = (data.kcseResults || []).filter((r) => r.year !== year);
    saveAll({ kcseResults: updated });
  }

  function updateKcseResult(year, field, value) {
    const updated = (data.kcseResults || []).map((r) =>
      r.year === year ? { ...r, [field]: field === "meanScore" ? parseFloat(value) || 0 : value } : r
    );
    setData((prev) => ({ ...prev, kcseResults: updated }));
  }

  // ===== Achievements CRUD =====
  function addAchievement() {
    if (!newAchievement.title.trim()) {
      alert("Title is required");
      return;
    }
    const updated = [...(data.achievements || []), { ...newAchievement }];
    saveAll({ achievements: updated });
    setNewAchievement({
      year: new Date().getFullYear(),
      term: "Annual",
      category: "Other",
      title: "",
      description: "",
      metric: "",
      ranking: "",
      published: true,
    });
  }

  function deleteAchievement(index) {
    if (!confirm("Delete this achievement?")) return;
    const updated = (data.achievements || []).filter((_, i) => i !== index);
    saveAll({ achievements: updated });
  }

  function updateAchievement(index, field, value) {
    const updated = (data.achievements || []).map((a, i) =>
      i === index ? { ...a, [field]: value } : a
    );
    setData((prev) => ({ ...prev, achievements: updated }));
  }

  // ===== Reports CRUD =====
  function addReport() {
    if (!newReport.name.trim() || !newReport.url.trim()) {
      alert("Both name and URL are required");
      return;
    }
    const updated = [...(data.reports || []), { ...newReport }];
    saveAll({ reports: updated });
    setNewReport({ name: "", url: "" });
  }

  function deleteReport(index) {
    if (!confirm("Delete this report?")) return;
    const updated = (data.reports || []).filter((_, i) => i !== index);
    saveAll({ reports: updated });
  }

  if (loading) return <p style={{ padding: 20, color: "#666" }}>Loading performance data…</p>;
  if (!data) return <p style={{ padding: 20, color: "red" }}>{error || "No data available"}</p>;

  return (
    <section style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>📊 Performance Management</h2>
      <p style={{ color: "#6b7280" }}>Manage public school performance page content.</p>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && (
        <p style={{ color: "#10b981", fontWeight: 600, background: "#ecfdf5", padding: "8px 14px", borderRadius: 6 }}>
          ✅ {success}
        </p>
      )}
      {saving && <p style={{ color: "#667eea" }}>Saving…</p>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e5e7eb", marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "settings", label: "Page Settings" },
          { key: "kcse", label: "KCSE Records" },
          { key: "achievements", label: "Achievements" },
          { key: "highlights", label: "Highlights" },
          { key: "reports", label: "Reports" },
        ].map((t) => (
          <button key={t.key} style={tabStyle(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== TAB: Page Settings ===== */}
      {tab === "settings" && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Page Settings</h3>

          <label style={{ display: "block", marginBottom: 12 }}>
            <strong>Page Title</strong>
            <input
              value={data.title || ""}
              onChange={(e) => updateField("title", e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block", marginBottom: 12 }}>
            <strong>Introduction</strong>
            <textarea
              value={data.intro || ""}
              onChange={(e) => updateField("intro", e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 12 }}>
            <strong>Results Section Heading</strong>
            <input
              value={data.resultsHeading || ""}
              onChange={(e) => updateField("resultsHeading", e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block", marginBottom: 12 }}>
            <strong>Achievements Section Heading</strong>
            <input
              value={data.achievementsHeading || ""}
              onChange={(e) => updateField("achievementsHeading", e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block", marginBottom: 12 }}>
            <strong>Highlights Section Heading</strong>
            <input
              value={data.highlightsHeading || ""}
              onChange={(e) => updateField("highlightsHeading", e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block", marginBottom: 16 }}>
            <strong>Reports Section Heading</strong>
            <input
              value={data.reportsHeading || ""}
              onChange={(e) => updateField("reportsHeading", e.target.value)}
              style={inputStyle}
            />
          </label>

          <button
            style={btnPrimary}
            onClick={() =>
              saveAll({
                title: data.title,
                intro: data.intro,
                resultsHeading: data.resultsHeading,
                achievementsHeading: data.achievementsHeading,
                highlightsHeading: data.highlightsHeading,
                reportsHeading: data.reportsHeading,
              })
            }
          >
            Save Settings
          </button>
        </div>
      )}

      {/* ===== TAB: KCSE Records ===== */}
      {tab === "kcse" && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>KCSE Performance Records</h3>
          <p style={{ color: "#6b7280", fontSize: 13 }}>
            Enter the actual KCSE mean scores (decimal) and letter grades for each year.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: 10, textAlign: "left" }}>Year</th>
                  <th style={{ padding: 10, textAlign: "left" }}>Mean Score</th>
                  <th style={{ padding: 10, textAlign: "left" }}>Mean Grade</th>
                  <th style={{ padding: 10, width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.kcseResults || [])
                  .sort((a, b) => b.year - a.year)
                  .map((r) => (
                    <tr key={r.year} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: 10, fontWeight: 600 }}>{r.year}</td>
                      <td style={{ padding: 10 }}>
                        <input
                          type="number"
                          step="0.0001"
                          value={r.meanScore}
                          onChange={(e) => updateKcseResult(r.year, "meanScore", e.target.value)}
                          onBlur={() => saveAll({ kcseResults: data.kcseResults })}
                          style={{ ...inputStyle, width: 140 }}
                        />
                      </td>
                      <td style={{ padding: 10 }}>
                        <input
                          value={r.meanGrade}
                          onChange={(e) => updateKcseResult(r.year, "meanGrade", e.target.value)}
                          onBlur={() => saveAll({ kcseResults: data.kcseResults })}
                          style={{ ...inputStyle, width: 100 }}
                        />
                      </td>
                      <td style={{ padding: 10, textAlign: "center" }}>
                        <button style={btnDanger} onClick={() => deleteKcseResult(r.year)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                {/* Add new row */}
                <tr style={{ background: "#f0f9ff", borderTop: "2px solid #667eea" }}>
                  <td style={{ padding: 10 }}>
                    <input
                      type="number"
                      placeholder="Year"
                      value={newKcse.year}
                      onChange={(e) => setNewKcse((p) => ({ ...p, year: e.target.value }))}
                      style={{ ...inputStyle, width: 100 }}
                    />
                  </td>
                  <td style={{ padding: 10 }}>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="e.g. 7.2993"
                      value={newKcse.meanScore}
                      onChange={(e) => setNewKcse((p) => ({ ...p, meanScore: e.target.value }))}
                      style={{ ...inputStyle, width: 140 }}
                    />
                  </td>
                  <td style={{ padding: 10 }}>
                    <input
                      placeholder="e.g. C+"
                      value={newKcse.meanGrade}
                      onChange={(e) => setNewKcse((p) => ({ ...p, meanGrade: e.target.value }))}
                      style={{ ...inputStyle, width: 100 }}
                    />
                  </td>
                  <td style={{ padding: 10, textAlign: "center" }}>
                    <button style={btnSuccess} onClick={addKcseResult}>
                      + Add
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
            Total records: <strong>{(data.kcseResults || []).length}</strong>
          </p>
        </div>
      )}

      {/* ===== TAB: Achievements ===== */}
      {tab === "achievements" && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>School Achievements</h3>
          <p style={{ color: "#6b7280", fontSize: 13 }}>
            Competitions, rankings, awards, co-curricular achievements.
          </p>

          {/* Add new achievement form */}
          <div
            style={{
              background: "#f0f9ff",
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
              border: "1px solid #bfdbfe",
            }}
          >
            <h4 style={{ marginTop: 0 }}>Add Achievement</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <label>
                <strong>Year</strong>
                <input
                  type="number"
                  value={newAchievement.year}
                  onChange={(e) => setNewAchievement((p) => ({ ...p, year: parseInt(e.target.value) || "" }))}
                  style={inputStyle}
                />
              </label>
              <label>
                <strong>Term</strong>
                <select
                  value={newAchievement.term}
                  onChange={(e) => setNewAchievement((p) => ({ ...p, term: e.target.value }))}
                  style={inputStyle}
                >
                  {TERMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <strong>Category</strong>
                <select
                  value={newAchievement.category}
                  onChange={(e) => setNewAchievement((p) => ({ ...p, category: e.target.value }))}
                  style={inputStyle}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label style={{ display: "block", marginTop: 10 }}>
              <strong>Title *</strong>
              <input
                value={newAchievement.title}
                onChange={(e) => setNewAchievement((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. National Science Congress 1st Place"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "block", marginTop: 10 }}>
              <strong>Description</strong>
              <textarea
                value={newAchievement.description}
                onChange={(e) => setNewAchievement((p) => ({ ...p, description: e.target.value }))}
                placeholder="Details about the achievement"
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 10 }}>
              <label>
                <strong>Metric</strong>
                <input
                  value={newAchievement.metric}
                  onChange={(e) => setNewAchievement((p) => ({ ...p, metric: e.target.value }))}
                  placeholder="e.g. 95%, 1st Place"
                  style={inputStyle}
                />
              </label>
              <label>
                <strong>Level</strong>
                <input
                  value={newAchievement.ranking}
                  onChange={(e) => setNewAchievement((p) => ({ ...p, ranking: e.target.value }))}
                  placeholder="e.g. National, County"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
                <input
                  type="checkbox"
                  checked={newAchievement.published}
                  onChange={(e) => setNewAchievement((p) => ({ ...p, published: e.target.checked }))}
                />
                <strong>Published</strong>
              </label>
            </div>

            <button style={{ ...btnSuccess, marginTop: 14 }} onClick={addAchievement}>
              + Add Achievement
            </button>
          </div>

          {/* Existing achievements */}
          {(data.achievements || []).length === 0 ? (
            <p style={{ color: "#9ca3af", fontStyle: "italic" }}>No achievements added yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(data.achievements || []).map((a, i) => (
                <div
                  key={a._id || i}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: 14,
                    background: a.published ? "#fff" : "#fef2f2",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                      {a.year} · {a.term} · {a.category}
                      {a.metric && ` · ${a.metric}`}
                      {a.ranking && ` · ${a.ranking}`}
                      {!a.published && " · 🔒 Draft"}
                    </div>
                    {a.description && (
                      <div style={{ fontSize: 13, color: "#4b5563", marginTop: 4 }}>{a.description}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      style={{
                        padding: "4px 10px",
                        background: a.published ? "#fef2f2" : "#ecfdf5",
                        color: a.published ? "#991b1b" : "#065f46",
                        border: "1px solid " + (a.published ? "#fecaca" : "#a7f3d0"),
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      onClick={() => {
                        const updated = (data.achievements || []).map((item, idx) =>
                          idx === i ? { ...item, published: !item.published } : item
                        );
                        saveAll({ achievements: updated });
                      }}
                    >
                      {a.published ? "Unpublish" : "Publish"}
                    </button>
                    <button style={btnDanger} onClick={() => deleteAchievement(i)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>
            Total: <strong>{(data.achievements || []).length}</strong> (
            {(data.achievements || []).filter((a) => a.published).length} published)
          </p>
        </div>
      )}

      {/* ===== TAB: Highlights ===== */}
      {tab === "highlights" && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Progress Highlights</h3>
          <p style={{ color: "#6b7280", fontSize: 13 }}>
            Editable text shown on the public page. Use bullet points (•) for a list.
          </p>

          <textarea
            value={data.highlights || ""}
            onChange={(e) => updateField("highlights", e.target.value)}
            rows={8}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.7 }}
          />

          <button
            style={{ ...btnPrimary, marginTop: 12 }}
            onClick={() => saveAll({ highlights: data.highlights })}
          >
            Save Highlights
          </button>
        </div>
      )}

      {/* ===== TAB: Reports ===== */}
      {tab === "reports" && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Downloadable Reports</h3>
          <p style={{ color: "#6b7280", fontSize: 13 }}>
            Add links to downloadable performance reports (PDFs, documents).
          </p>

          <div style={{ overflowX: "auto", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: 10, textAlign: "left" }}>Report Name</th>
                  <th style={{ padding: 10, textAlign: "left" }}>URL</th>
                  <th style={{ padding: 10, width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.reports || []).map((r, i) => (
                  <tr key={r._id || i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: 10 }}>
                      <a href={r.url} target="_blank" rel="noreferrer" style={{ color: "#667eea", fontSize: 13 }}>
                        {r.url.length > 50 ? r.url.substring(0, 50) + "…" : r.url}
                      </a>
                    </td>
                    <td style={{ padding: 10, textAlign: "center" }}>
                      <button style={btnDanger} onClick={() => deleteReport(i)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                <tr style={{ background: "#f0f9ff", borderTop: "2px solid #667eea" }}>
                  <td style={{ padding: 10 }}>
                    <input
                      placeholder="Report name"
                      value={newReport.name}
                      onChange={(e) => setNewReport((p) => ({ ...p, name: e.target.value }))}
                      style={{ ...inputStyle, width: "100%" }}
                    />
                  </td>
                  <td style={{ padding: 10 }}>
                    <input
                      placeholder="https://example.com/report.pdf"
                      value={newReport.url}
                      onChange={(e) => setNewReport((p) => ({ ...p, url: e.target.value }))}
                      style={{ ...inputStyle, width: "100%" }}
                    />
                  </td>
                  <td style={{ padding: 10, textAlign: "center" }}>
                    <button style={btnSuccess} onClick={addReport}>
                      + Add
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
