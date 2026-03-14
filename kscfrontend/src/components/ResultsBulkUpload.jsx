import React, { useState } from "react";
import { post } from "../utils/api";

// ── 8-4-4 template ──────────────────────────────────────────────────────────
const SUBJECTS_844 = ["English", "Kiswahili", "Mathematics", "Biology", "Chemistry", "Physics", "History", "Geography", "CRE"];
// ── CBC template ─────────────────────────────────────────────────────────────
const SUBJECTS_CBC = ["English", "Kiswahili", "Mathematics", "Integrated Science", "Social Studies", "Creative Arts", "Physical Education", "CRE", "Life Skills"];
// Kept for backwards compatibility (unused after refactor)
const TEMPLATE_SUBJECTS = SUBJECTS_844;

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function template844() {
  const h = ["admissionNumber", ...SUBJECTS_844, "position", "outOf", "teacherRemarks"];
  const e = ["ADM001", "65", "72", "58", "80", "77", "61", "55", "70", "68", "3", "45", "Good effort"];
  return [h.join(","), e.join(",")].join("\n");
}

function templateCBC() {
  const h = ["admissionNumber", ...SUBJECTS_CBC, "teacherRemarks"];
  const e = ["ADM001", "EE", "ME", "ME", "AE", "ME", "EE", "ME", "ME", "AE", "Good learner"];
  return [h.join(","), e.join(",")].join("\n");
}

// CBC competency level badge colours
const CBC_BADGE = {
  EE: { bg: "#dcfce7", color: "#166534", title: "Exceeding Expectations" },
  ME: { bg: "#dbeafe", color: "#1e40af", title: "Meeting Expectations" },
  AE: { bg: "#fef3c7", color: "#92400e", title: "Approaching Expectations" },
  BE: { bg: "#fee2e2", color: "#991b1b", title: "Below Expectations" }
};

function CbcBadge({ val }) {
  const key = (val || "").toUpperCase();
  const s = CBC_BADGE[key];
  if (!s) return <span>{val}</span>;
  return <span title={s.title} style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, background: s.bg, color: s.color }}>{key}</span>;
}

function parseCSVText(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  return lines.map(line => {
    const vals = []; let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    vals.push(cur.trim());
    return vals;
  });
}

// ── Per-curriculum upload form ───────────────────────────────────────────────
function UploadForm({ curriculum }) {
  const isCBC = curriculum === "CBC";
  const accent = isCBC ? "#059669" : "#667eea";
  const accentLight = isCBC ? "#d1fae5" : "#ede9fe";
  const accentDark = isCBC ? "#065f46" : "#5b21b6";

  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    term: "Term 1",
    year: new Date().getFullYear().toString(),
    examType: "End of Term"
  });
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      setCsvText(text);
      const rows = parseCSVText(text);
      if (rows.length >= 2) {
        setPreview({ headers: rows[0], rows: rows.slice(1).filter(r => r.some(v => v)) });
      }
      setStep(3);
    };
    reader.readAsText(file);
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const data = await post("/api/results/admin/csv-import", {
        csv: csvText,
        curriculum,
        term: config.term,
        year: parseInt(config.year),
        examType: isCBC ? "End of Term" : config.examType
      });
      setResult(data);
      setStep(4);
    } catch (err) {
      setResult({ error: err?.message || "Import failed" });
      setStep(4);
    } finally {
      setLoading(false);
    }
  }

  function reset() { setStep(1); setCsvText(""); setPreview(null); setResult(null); }

  const inp = { padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", width: "100%", boxSizing: "border-box" };
  const lbl = { fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px", display: "block" };
  const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" };
  const btnPrimary = { padding: "10px 20px", background: `linear-gradient(135deg, ${accent}, ${accentDark})`, color: "#fff", border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "14px" };
  const btnSecondary = { padding: "10px 20px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" };

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
        {["Configure", "Upload CSV", "Preview", "Done"].map((label, i) => (
          <div key={i} style={{
            flex: 1, padding: "7px", textAlign: "center", borderRadius: "6px", fontSize: "12px",
            fontWeight: step === i + 1 ? 700 : 400,
            background: step > i ? accent : step === i + 1 ? accentLight : "#f1f5f9",
            color: step > i ? "#fff" : step === i + 1 ? accentDark : "#94a3b8"
          }}>{i + 1}. {label}</div>
        ))}
      </div>

      {/* STEP 1 — Configure */}
      {step === 1 && (
        <div style={card}>
          <h3 style={{ fontSize: "15px", marginBottom: "18px", color: "#1e293b" }}>Exam Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
            <div>
              <label style={lbl}>Term</label>
              <select style={inp} value={config.term} onChange={e => setConfig(c => ({ ...c, term: e.target.value }))}>
                <option>Term 1</option><option>Term 2</option><option>Term 3</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Year</label>
              <input style={inp} type="number" min="2020" max="2030" value={config.year} onChange={e => setConfig(c => ({ ...c, year: e.target.value }))} />
            </div>
            {!isCBC && (
              <div>
                <label style={lbl}>Exam Type</label>
                <select style={inp} value={config.examType} onChange={e => setConfig(c => ({ ...c, examType: e.target.value }))}>
                  <option>End of Term</option><option>Mid Term</option><option>Mock Exam</option><option>Final Exam</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
            <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "6px" }}>📥 Download CSV Template</p>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
              {isCBC
                ? <>First column: <strong>admissionNumber</strong>. Then one column per learning area with values <strong>EE / ME / AE / BE</strong>. Add or remove subjects freely. No position column — CBC doesn't rank students.</>
                : <>First column: <strong>admissionNumber</strong>. Then subject columns with marks <strong>0–100</strong>. Optional: <strong>position</strong>, <strong>outOf</strong>, <strong>teacherRemarks</strong>. Grades are auto-calculated.</>
              }
            </p>
            <button style={btnSecondary} onClick={() => isCBC
              ? downloadCsv(templateCBC(), "cbc_results_template.csv")
              : downloadCsv(template844(), "844_results_template.csv")
            }>⬇ Download Template</button>
          </div>

          {isCBC && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "12px", marginBottom: "20px", fontSize: "13px" }}>
              <strong>Competency Key: &nbsp;</strong>
              {[["EE", "#dcfce7", "#166534", "Exceeding Expectations"],
                ["ME", "#dbeafe", "#1e40af", "Meeting Expectations"],
                ["AE", "#fef3c7", "#92400e", "Approaching Expectations"],
                ["BE", "#fee2e2", "#991b1b", "Below Expectations"]].map(([k, bg, col, title]) => (
                <span key={k} style={{ marginRight: "10px" }}>
                  <span style={{ background: bg, color: col, padding: "2px 7px", borderRadius: "4px", fontWeight: 700, marginRight: "4px" }}>{k}</span>
                  {title}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button style={btnPrimary} onClick={() => setStep(2)}>Next: Upload CSV →</button>
          </div>
        </div>
      )}

      {/* STEP 2 — Upload */}
      {step === 2 && (
        <div style={card}>
          <h3 style={{ fontSize: "15px", marginBottom: "14px", color: "#1e293b" }}>Upload CSV File</h3>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById(`csvInput-${curriculum}`).click()}
            style={{
              border: `2px dashed ${dragOver ? accent : "#d1d5db"}`,
              borderRadius: "12px", padding: "40px", textAlign: "center",
              cursor: "pointer", background: dragOver ? accentLight : "#f8fafc",
              marginBottom: "16px", transition: "all 0.2s"
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📂</div>
            <p style={{ fontWeight: 600, color: "#374151" }}>Drag & drop CSV here, or click to browse</p>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>Supports .csv files exported from Excel</p>
            <input id={`csvInput-${curriculum}`} type="file" accept=".csv,.txt" style={{ display: "none" }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>
          <button style={btnSecondary} onClick={() => setStep(1)}>← Back</button>
        </div>
      )}

      {/* STEP 3 — Preview */}
      {step === 3 && preview && (
        <div style={card}>
          <h3 style={{ fontSize: "15px", marginBottom: "4px", color: "#1e293b" }}>Preview</h3>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px" }}>
            {preview.rows.length} student(s) · {config.term} {config.year}{!isCBC && ` · ${config.examType}`}
          </p>

          <div style={{ overflowX: "auto", maxHeight: "310px", overflowY: "auto", marginBottom: "18px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  {preview.headers.map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #e2e8f0", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {row.map((val, j) => (
                      <td key={j} style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>
                        {isCBC && j > 0 && j < row.length - 1 ? <CbcBadge val={val} /> : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
            <button style={btnSecondary} onClick={() => { setStep(2); setPreview(null); setCsvText(""); }}>← Change File</button>
            <button style={btnPrimary} disabled={loading} onClick={handleSubmit}>
              {loading ? "Importing..." : `✅ Import ${preview.rows.length} Results`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Done */}
      {step === 4 && result && (
        <div style={card}>
          {result.error ? (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ fontWeight: 700, color: "#dc2626" }}>❌ Import failed</p>
              <p style={{ fontSize: "13px", color: "#7f1d1d" }}>{result.error}</p>
            </div>
          ) : (
            <>
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "14px", marginBottom: "14px" }}>
                <p style={{ fontWeight: 700, color: "#15803d", fontSize: "15px" }}>✅ {result.message}</p>
                <p style={{ fontSize: "13px", color: "#166534" }}>
                  Results are <strong>unpublished</strong> — review in Student Results and publish when ready.
                </p>
              </div>
              {result.errors?.length > 0 && (
                <div>
                  <p style={{ fontWeight: 600, fontSize: "13px", color: "#dc2626", marginBottom: "8px" }}>⚠️ {result.errors.length} row(s) had errors:</p>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#fef2f2" }}>
                        <th style={{ padding: "7px", textAlign: "left", borderBottom: "1px solid #fca5a5" }}>Row</th>
                        <th style={{ padding: "7px", textAlign: "left", borderBottom: "1px solid #fca5a5" }}>Adm No</th>
                        <th style={{ padding: "7px", textAlign: "left", borderBottom: "1px solid #fca5a5" }}>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i}>
                          <td style={{ padding: "6px 7px", borderBottom: "1px solid #fee2e2" }}>{e.row}</td>
                          <td style={{ padding: "6px 7px", borderBottom: "1px solid #fee2e2" }}>{e.admissionNumber || "—"}</td>
                          <td style={{ padding: "6px 7px", borderBottom: "1px solid #fee2e2", color: "#dc2626" }}>{e.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          <button style={{ ...btnPrimary, marginTop: "16px" }} onClick={reset}>Upload Another File</button>
        </div>
      )}
    </div>
  );
}

// ── Main export: two-tab wrapper ─────────────────────────────────────────────
export default function ResultsBulkUpload() {
  const [curriculum, setCurriculum] = useState("8-4-4");

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "20px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>📤 Bulk Results Upload</h2>
      <p style={{ color: "#64748b", marginBottom: "20px" }}>Upload an Excel/CSV file to import results for an entire class at once.</p>

      {/* Curriculum tab switcher */}
      <div style={{ display: "flex", marginBottom: "24px", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden", width: "fit-content" }}>
        {[["8-4-4", "📋 8-4-4 Results"], ["CBC", "📗 CBC Results"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCurriculum(key)}
            style={{
              padding: "11px 30px", border: "none", cursor: "pointer",
              fontWeight: curriculum === key ? 700 : 400,
              fontSize: "14px",
              background: curriculum === key ? (key === "CBC" ? "#059669" : "#667eea") : "#fff",
              color: curriculum === key ? "#fff" : "#64748b",
              borderRight: key === "8-4-4" ? "1px solid #e5e7eb" : "none",
              transition: "all 0.15s"
            }}
          >{label}</button>
        ))}
      </div>

      {/* key prop resets all internal state when switching curricula */}
      <UploadForm key={curriculum} curriculum={curriculum} />
    </div>
  );
}
