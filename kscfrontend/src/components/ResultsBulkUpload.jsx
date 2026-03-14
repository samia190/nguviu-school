import React, { useState } from "react";
import { post } from "../utils/api";

// Default subjects in the CSV template (admin can edit in Excel)
const TEMPLATE_SUBJECTS = ["English", "Kiswahili", "Mathematics", "Biology", "Chemistry", "Physics", "History", "Geography", "CRE"];

function generateTemplate() {
  const headers = ["admissionNumber", ...TEMPLATE_SUBJECTS, "position", "outOf", "teacherRemarks"];
  const example = ["ADM001", "65", "72", "58", "80", "77", "61", "55", "70", "68", "3", "45", "Good effort"];
  return [headers.join(","), example.join(",")].join("\n");
}

function downloadTemplate() {
  const csv = generateTemplate();
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "results_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsBulkUpload() {
  const [step, setStep] = useState(1); // 1=config, 2=upload, 3=preview, 4=done
  const [config, setConfig] = useState({
    term: "Term 1",
    year: new Date().getFullYear().toString(),
    examType: "End of Term",
    curriculum: "8-4-4"
  });
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState(null); // { headers, rows }
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { imported, errors, results }
  const [dragOver, setDragOver] = useState(false);

  function handleFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      setCsvText(text);
      buildPreview(text);
      setStep(3);
    };
    reader.readAsText(file);
  }

  function buildPreview(text) {
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
    if (lines.length < 2) return;
    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1).filter(l => l.trim()).map(l => l.split(",").map(v => v.trim()));
    setPreview({ headers, rows });
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const data = await post("/api/results/admin/csv-import", {
        csv: csvText,
        ...config,
        year: parseInt(config.year)
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

  function reset() {
    setStep(1);
    setCsvText("");
    setPreview(null);
    setResult(null);
  }

  const inputStyle = {
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box"
  };

  const labelStyle = { fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px", display: "block" };

  const btnPrimary = {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px"
  };

  const btnSecondary = {
    padding: "10px 20px",
    background: "#e5e7eb",
    color: "#374151",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px"
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
        📤 Bulk Results Upload
      </h2>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>
        Upload an Excel/CSV file to import results for an entire class at once.
      </p>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
        {["Configure", "Upload CSV", "Preview", "Done"].map((label, i) => (
          <div key={i} style={{
            flex: 1, padding: "8px", textAlign: "center", borderRadius: "6px", fontSize: "13px", fontWeight: step === i + 1 ? 700 : 400,
            background: step > i ? "#667eea" : step === i + 1 ? "#ede9fe" : "#f1f5f9",
            color: step > i ? "#fff" : step === i + 1 ? "#5b21b6" : "#94a3b8"
          }}>{i + 1}. {label}</div>
        ))}
      </div>

      {/* STEP 1 — Configure */}
      {step === 1 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ marginBottom: "20px", fontSize: "16px", color: "#1e293b" }}>Exam Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div>
              <label style={labelStyle}>Term</label>
              <select style={inputStyle} value={config.term} onChange={e => setConfig(c => ({ ...c, term: e.target.value }))}>
                <option>Term 1</option>
                <option>Term 2</option>
                <option>Term 3</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Year</label>
              <input style={inputStyle} type="number" value={config.year} onChange={e => setConfig(c => ({ ...c, year: e.target.value }))} min="2020" max="2030" />
            </div>
            <div>
              <label style={labelStyle}>Exam Type</label>
              <select style={inputStyle} value={config.examType} onChange={e => setConfig(c => ({ ...c, examType: e.target.value }))}>
                <option>End of Term</option>
                <option>Mid Term</option>
                <option>Mock Exam</option>
                <option>Final Exam</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Curriculum</label>
              <select style={inputStyle} value={config.curriculum} onChange={e => setConfig(c => ({ ...c, curriculum: e.target.value }))}>
                <option>8-4-4</option>
                <option>CBC</option>
              </select>
            </div>
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
            <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>📥 Download CSV Template</p>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
              The template has: admissionNumber, English, Kiswahili, Mathematics, Biology, Chemistry, Physics, History, Geography, CRE, position, outOf, teacherRemarks.
              Add or remove subject columns in Excel to match your class subjects.
              <br/>Grades are calculated automatically from marks. Term/Year/ExamType apply to all rows.
            </p>
            <button style={btnSecondary} onClick={downloadTemplate}>⬇ Download Template</button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button style={btnPrimary} onClick={() => setStep(2)}>Next: Upload CSV →</button>
          </div>
        </div>
      )}

      {/* STEP 2 — Upload */}
      {step === 2 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ marginBottom: "16px", fontSize: "16px", color: "#1e293b" }}>Upload CSV File</h3>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files[0]); }}
            style={{
              border: `2px dashed ${dragOver ? "#667eea" : "#d1d5db"}`,
              borderRadius: "12px",
              padding: "40px",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? "#ede9fe" : "#f8fafc",
              marginBottom: "16px",
              transition: "all 0.2s"
            }}
            onClick={() => document.getElementById("csvInput").click()}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📂</div>
            <p style={{ fontWeight: 600, color: "#374151" }}>Drag & drop CSV here, or click to browse</p>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>Supports .csv and .txt files</p>
            <input id="csvInput" type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files[0])} />
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
            <button style={btnSecondary} onClick={() => setStep(1)}>← Back</button>
          </div>
        </div>
      )}

      {/* STEP 3 — Preview */}
      {step === 3 && preview && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ marginBottom: "4px", fontSize: "16px", color: "#1e293b" }}>Preview</h3>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
            {preview.rows.length} student(s) found · {config.term} {config.year} · {config.examType}
          </p>

          <div style={{ overflowX: "auto", marginBottom: "20px", maxHeight: "320px", overflowY: "auto" }}>
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
                      <td key={j} style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>{val}</td>
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
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
          {result.error ? (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
              <p style={{ fontWeight: 600, color: "#dc2626" }}>❌ Import failed</p>
              <p style={{ fontSize: "13px", color: "#7f1d1d" }}>{result.error}</p>
            </div>
          ) : (
            <>
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                <p style={{ fontWeight: 700, color: "#15803d", fontSize: "16px" }}>✅ {result.message}</p>
                <p style={{ fontSize: "13px", color: "#166534" }}>
                  {result.imported} result(s) imported · Results are <strong>unpublished</strong> — go to Student Results to review and publish.
                </p>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div>
                  <p style={{ fontWeight: 600, fontSize: "14px", color: "#dc2626", marginBottom: "8px" }}>⚠️ {result.errors.length} row(s) had errors:</p>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#fef2f2" }}>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #fca5a5" }}>Row</th>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #fca5a5" }}>Adm No</th>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #fca5a5" }}>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i}>
                          <td style={{ padding: "7px 8px", borderBottom: "1px solid #fee2e2" }}>{e.row}</td>
                          <td style={{ padding: "7px 8px", borderBottom: "1px solid #fee2e2" }}>{e.admissionNumber || "—"}</td>
                          <td style={{ padding: "7px 8px", borderBottom: "1px solid #fee2e2", color: "#dc2626" }}>{e.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button style={btnPrimary} onClick={reset}>Upload Another File</button>
          </div>
        </div>
      )}
    </div>
  );
}
