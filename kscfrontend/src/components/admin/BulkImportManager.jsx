import { useState } from "react";
import { getToken, resolveApiUrl } from "../../utils/api";

export default function BulkImportManager({ user }) {
  const [type, setType] = useState("accounts");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [publishResults, setPublishResults] = useState(false);

  const headers = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const downloadTemplate = async () => {
    setMessage("");
    const response = await fetch(resolveApiUrl(`/api/admin/imports/templates/${type}`), { headers: headers() });
    if (!response.ok) return setMessage("Unable to download the template.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `kangaru-${type}-template.xlsx`; anchor.click(); URL.revokeObjectURL(url);
  };

  const previewImport = async (event) => {
    event.preventDefault();
    if (!file) return setMessage("Select an Excel file first.");
    setLoading(true); setMessage(""); setPreview(null);
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch(resolveApiUrl(`/api/admin/imports/${type}/preview`), { method: "POST", headers: headers(), body });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Import validation failed.");
      setPreview(data.import);
      setMessage(data.import.summary.invalidRows ? "Validation found errors. Resolve all errors before confirmation." : "Validation passed. Review the preview and confirm the import.");
    } catch (error) { setMessage(error.message || "Import validation failed."); }
    finally { setLoading(false); }
  };

  const confirmImport = async () => {
    if (!preview || preview.summary.invalidRows) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch(resolveApiUrl(`/api/admin/imports/${preview.id}/confirm`), { method: "POST", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify({ publishResults }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Import confirmation failed.");
      setMessage(`Import completed: ${data.import.summary.appliedRows} ${type === "accounts" ? "accounts" : "result records"} processed.`);
      setPreview(null); setFile(null);
    } catch (error) { setMessage(error.message || "Import confirmation failed."); }
    finally { setLoading(false); }
  };

  const downloadErrorReport = async () => {
    if (!preview) return;
    const response = await fetch(resolveApiUrl(`/api/admin/imports/${preview.id}/errors.xlsx`), { headers: headers() });
    if (!response.ok) return setMessage("Unable to download the error report.");
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `kangaru-${type}-import-errors.xlsx`; anchor.click(); URL.revokeObjectURL(url);
  };

  return <section style={{ maxWidth: 1000 }}>
    <h2>Bulk account and results import</h2>
    <p style={{ color: "#475569", lineHeight: 1.6 }}>Use the template, validate the Excel file, review every row, then explicitly confirm. Account imports send one-time password-setup links by email. Passwords are never stored in the Excel file or shown to an administrator.</p>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "18px 0" }}>
      <button type="button" onClick={() => { setType("accounts"); setPreview(null); }} style={{ padding: "10px 14px", border: 0, borderRadius: 6, background: type === "accounts" ? "#1d4ed8" : "#e2e8f0", color: type === "accounts" ? "white" : "#1e293b" }}>Accounts</button>
      <button type="button" onClick={() => { setType("results"); setPreview(null); }} style={{ padding: "10px 14px", border: 0, borderRadius: 6, background: type === "results" ? "#1d4ed8" : "#e2e8f0", color: type === "results" ? "white" : "#1e293b" }}>Student results</button>
      <button type="button" onClick={downloadTemplate} style={{ padding: "10px 14px", border: "1px solid #1d4ed8", borderRadius: 6, background: "white", color: "#1d4ed8" }}>Download {type} template</button>
    </div>
    {type === "accounts" && user?.role !== "superadmin" && <p style={{ color: "#92400e", background: "#fffbeb", padding: 12, borderRadius: 6 }}>Administrators can create student, teacher, and staff accounts. Only a superadmin can confirm a file containing administrator accounts.</p>}
    <form onSubmit={previewImport} style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 18, background: "#f8fafc" }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>Excel file (.xlsx or .xls)</label>
      <input type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={(event) => setFile(event.target.files?.[0] || null)} />
      <button type="submit" disabled={loading} style={{ marginLeft: 12, padding: "9px 14px", background: "#0f766e", color: "white", border: 0, borderRadius: 6, cursor: "pointer" }}>{loading ? "Validating…" : "Validate import"}</button>
    </form>
    {message && <p style={{ marginTop: 16, color: preview?.summary.invalidRows ? "#b91c1c" : "#166534" }}>{message}</p>}
    {preview && <div style={{ marginTop: 20, border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: 14, background: "#eff6ff" }}><strong>Validation summary:</strong> {preview.summary.totalRows} rows; {preview.summary.validRows} valid; {preview.summary.invalidRows} invalid.</div>
      <div style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}><thead><tr style={{ background: "#f1f5f9" }}><th style={{ textAlign: "left", padding: 10 }}>Row</th><th style={{ textAlign: "left", padding: 10 }}>Data</th><th style={{ textAlign: "left", padding: 10 }}>Validation</th></tr></thead><tbody>{preview.rows.map((row) => <tr key={row.rowNumber} style={{ borderTop: "1px solid #e2e8f0" }}><td style={{ padding: 10 }}>{row.rowNumber}</td><td style={{ padding: 10 }}>{type === "accounts" ? `${row.data.name || ""} · ${row.data.email || ""} · ${row.data.role || ""}` : `${row.data.admissionNumber || ""} · ${row.data.subjectName || ""} · ${row.data.marks ?? ""}`}</td><td style={{ padding: 10, color: row.errors?.length ? "#b91c1c" : "#166534" }}>{row.errors?.length ? row.errors.join("; ") : "Ready"}</td></tr>)}</tbody></table></div>
      {type === "results" && <label style={{ display: "block", padding: 14, borderTop: "1px solid #e2e8f0" }}><input type="checkbox" checked={publishResults} onChange={(event) => setPublishResults(event.target.checked)} /> Publish results immediately after import. Leave unchecked to stage them as unpublished.</label>}
      <div style={{ padding: 14, borderTop: "1px solid #e2e8f0", display: "flex", gap: 10 }}><button type="button" disabled={loading || preview.summary.invalidRows > 0} onClick={confirmImport} style={{ padding: "10px 16px", border: 0, borderRadius: 6, background: preview.summary.invalidRows ? "#94a3b8" : "#16a34a", color: "white", cursor: preview.summary.invalidRows ? "not-allowed" : "pointer" }}>Confirm {type} import</button>{preview.summary.invalidRows > 0 && <button type="button" onClick={downloadErrorReport} style={{ padding: "10px 16px", border: "1px solid #b91c1c", borderRadius: 6, background: "white", color: "#b91c1c" }}>Download error report</button>}</div>
    </div>}
  </section>;
}
