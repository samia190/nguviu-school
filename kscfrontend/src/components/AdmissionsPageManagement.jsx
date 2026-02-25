// src/components/AdmissionsPageManagement.jsx
import { useEffect, useState, useCallback } from "react";
import { get, put, upload } from "../utils/api";

export default function AdmissionsPageManagement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("settings");

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };
  const fail = (msg) => { setError(msg); setTimeout(() => setError(""), 5000); };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await get("/api/admissions-page/admin");
      setData(d);
    } catch (e) {
      fail("Failed to load: " + (e.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(partial) {
    setSaving(true);
    setError("");
    try {
      const updated = await put("/api/admissions-page", partial);
      setData(updated);
      flash("Saved successfully!");
    } catch (e) {
      fail("Save failed: " + (e.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append("file", file);
    return await upload("/api/admissions-page/upload", fd);
  }

  async function resetDefaults() {
    if (!window.confirm("Reset ALL admissions page data to defaults? This cannot be undone.")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admissions-page/reset-defaults", { method: "POST", credentials: "include" });
      const d = await res.json();
      setData(d);
      flash("Reset to defaults!");
    } catch (e) {
      fail("Reset failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-section"><p>Loading admissions page...</p></div>;
  if (!data) return <div className="admin-section"><p className="error-message">Failed to load data</p></div>;

  return (
    <div className="admin-section">
      <h2>📝 Admissions Page Management</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message" style={{ background: "#d1fae5", color: "#065f46", padding: "10px 16px", borderRadius: 8, marginBottom: 12 }}>{success}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { k: "settings", l: "⚙️ Settings" },
          { k: "downloads", l: "📎 Downloads" },
          { k: "form", l: "📋 Form Config" },
        ].map(({ k, l }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600,
              background: tab === k ? "#4f46e5" : "#e5e7eb", color: tab === k ? "#fff" : "#1f2937",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ─── Settings Tab ─── */}
      {tab === "settings" && (
        <SettingsTab data={data} save={save} saving={saving} uploadFile={uploadFile} />
      )}

      {/* ─── Downloads Tab ─── */}
      {tab === "downloads" && (
        <DownloadsTab data={data} save={save} saving={saving} uploadFile={uploadFile} />
      )}

      {/* ─── Form Config Tab ─── */}
      {tab === "form" && (
        <FormConfigTab data={data} save={save} saving={saving} />
      )}

      {/* Reset */}
      <div style={{ marginTop: 40, paddingTop: 20, borderTop: "2px dashed #e5e7eb" }}>
        <button
          onClick={resetDefaults}
          disabled={saving}
          style={{ padding: "8px 20px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
        >
          🔄 Reset to Defaults
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Settings Tab — title, subtitle, hero image, text sections
   ════════════════════════════════════════════════════════════════ */
function SettingsTab({ data, save, saving, uploadFile }) {
  const [form, setForm] = useState({
    title: data.title || "",
    subtitle: data.subtitle || "",
    heroImage: data.heroImage || "",
    overview: data.overview || "",
    process: data.process || "",
    requirements: data.requirements || "",
    importantDates: data.importantDates || "",
    contactInfo: data.contactInfo || "",
    downloadsHeading: data.downloadsHeading || "",
  });
  const [uploading, setUploading] = useState(false);

  function onChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleHeroUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      setForm((p) => ({ ...p, heroImage: res.url }));
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(form); }}>
      <Field label="Page Title" name="title" value={form.title} onChange={onChange} />
      <Field label="Subtitle" name="subtitle" value={form.subtitle} onChange={onChange} textarea rows={2} />

      {/* Hero Image */}
      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>Hero Image</label>
        {form.heroImage && (
          <div style={{ marginBottom: 8 }}>
            <img src={form.heroImage} alt="Hero" style={{ maxHeight: 160, borderRadius: 8 }} />
            <br />
            <button type="button" onClick={() => setForm((p) => ({ ...p, heroImage: "" }))} style={smBtn}>Remove</button>
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleHeroUpload} disabled={uploading} />
        {uploading && <span style={{ marginLeft: 8, color: "#6b7280" }}>Uploading…</span>}
      </div>

      <Field label="Overview" name="overview" value={form.overview} onChange={onChange} textarea rows={4} />
      <Field label="Admissions Process" name="process" value={form.process} onChange={onChange} textarea rows={4} />
      <Field label="Requirements" name="requirements" value={form.requirements} onChange={onChange} textarea rows={5} />
      <Field label="Important Dates" name="importantDates" value={form.importantDates} onChange={onChange} textarea rows={3} />
      <Field label="Contact Info" name="contactInfo" value={form.contactInfo} onChange={onChange} textarea rows={3} />
      <Field label="Downloads Heading" name="downloadsHeading" value={form.downloadsHeading} onChange={onChange} />

      <SaveBtn saving={saving} />
    </form>
  );
}

/* ════════════════════════════════════════════════════════════════
   Downloads Tab — upload / manage downloadable files
   ════════════════════════════════════════════════════════════════ */
function DownloadsTab({ data, save, saving, uploadFile }) {
  const [downloads, setDownloads] = useState(data.downloads || []);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      setDownloads((prev) => [
        ...prev,
        {
          name: res.name || file.name,
          url: res.url,
          mimetype: res.mimetype || file.type,
          size: res.size || file.size,
          description: "",
          displayOrder: prev.length,
          active: true,
        },
      ]);
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function updateField(idx, field, value) {
    setDownloads((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  }

  function removeDownload(idx) {
    if (!window.confirm("Remove this download?")) return;
    setDownloads((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveUp(idx) {
    if (idx === 0) return;
    setDownloads((prev) => {
      const copy = [...prev];
      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
      return copy.map((d, i) => ({ ...d, displayOrder: i }));
    });
  }

  function moveDown(idx) {
    setDownloads((prev) => {
      if (idx >= prev.length - 1) return prev;
      const copy = [...prev];
      [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
      return copy.map((d, i) => ({ ...d, displayOrder: i }));
    });
  }

  return (
    <div>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        Upload application forms, brochures, and other documents for visitors to download.
      </p>

      {/* Upload */}
      <div style={{ marginBottom: 20 }}>
        <input type="file" onChange={handleUpload} disabled={uploading} />
        {uploading && <span style={{ marginLeft: 8, color: "#6b7280" }}>Uploading…</span>}
      </div>

      {/* List */}
      {downloads.length === 0 && <p style={{ color: "#9ca3af" }}>No downloads yet. Upload files above.</p>}
      {downloads.map((dl, idx) => (
        <div key={dl.url || idx} style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 10, background: dl.active ? "#fff" : "#f9fafb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong style={{ fontSize: "0.9rem" }}>
              📄 {dl.name || "Untitled"}{" "}
              {dl.size ? <span style={{ fontWeight: 400, color: "#6b7280" }}>({(dl.size / 1024).toFixed(1)} KB)</span> : ""}
            </strong>
            <div style={{ display: "flex", gap: 4 }}>
              <button type="button" onClick={() => moveUp(idx)} style={smBtn} title="Move up">▲</button>
              <button type="button" onClick={() => moveDown(idx)} style={smBtn} title="Move down">▼</button>
              <button type="button" onClick={() => removeDownload(idx)} style={{ ...smBtn, background: "#fee2e2", color: "#991b1b" }}>✕</button>
            </div>
          </div>

          <Field label="Display Name" value={dl.name} onChange={(e) => updateField(idx, "name", e.target.value)} />
          <Field label="Description" value={dl.description} onChange={(e) => updateField(idx, "description", e.target.value)} textarea rows={2} />

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <input type="checkbox" checked={dl.active} onChange={(e) => updateField(idx, "active", e.target.checked)} />
            <span style={{ fontSize: "0.85rem" }}>Visible on public page</span>
          </label>

          {dl.url && (
            <div style={{ marginTop: 6, fontSize: "0.8rem" }}>
              <a href={dl.url} target="_blank" rel="noreferrer">Open file ↗</a>
            </div>
          )}
        </div>
      ))}

      <SaveBtn saving={saving} onClick={() => save({ downloads })} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Form Config Tab — enable/disable form, year, title, steps, declarations
   ════════════════════════════════════════════════════════════════ */
function FormConfigTab({ data, save, saving }) {
  const [form, setForm] = useState({
    formEnabled: data.formEnabled ?? true,
    formTitle: data.formTitle || "",
    admissionYear: data.admissionYear || new Date().getFullYear(),
    formInstructions: data.formInstructions || "",
    formDisclaimer: data.formDisclaimer || "",
  });
  const [steps, setSteps] = useState(data.formSteps || []);
  const [declarations, setDeclarations] = useState(data.formDeclarations || []);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  function updateStep(idx, field, value) {
    setSteps((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  }

  function updateDeclaration(idx, field, value) {
    setDeclarations((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  }

  function addDeclaration() {
    setDeclarations((prev) => [
      ...prev,
      { key: `custom_${Date.now()}`, heading: "New Declaration", text: "" },
    ]);
  }

  function removeDeclaration(idx) {
    if (!window.confirm("Remove this declaration?")) return;
    setDeclarations((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    save({
      ...form,
      admissionYear: parseInt(form.admissionYear),
      formSteps: steps,
      formDeclarations: declarations,
    });
  }

  return (
    <div>
      {/* Basic settings */}
      <div style={{ marginBottom: 24, padding: 16, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
        <h3 style={{ marginTop: 0, fontSize: "1rem", color: "#374151" }}>⚙️ Basic Settings</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: "1rem" }}>
            <input type="checkbox" name="formEnabled" checked={form.formEnabled} onChange={onChange} style={{ width: 20, height: 20 }} />
            Online Application Form Enabled
          </label>
          <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: "4px 0 0 30px" }}>
            When disabled, visitors will see the page info but not the application form.
          </p>
        </div>

        <Field label="Form Title" name="formTitle" value={form.formTitle} onChange={onChange} />

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Admission Year</label>
          <input type="number" name="admissionYear" value={form.admissionYear} onChange={onChange} min={2020} max={2040} style={inp} />
        </div>

        <Field label="General Instructions" name="formInstructions" value={form.formInstructions} onChange={onChange} textarea rows={2} />
        <Field label="Disclaimer / Warning (bottom of form)" name="formDisclaimer" value={form.formDisclaimer} onChange={onChange} textarea rows={2} />
      </div>

      {/* Step customization */}
      <div style={{ marginBottom: 24, padding: 16, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
        <h3 style={{ marginTop: 0, fontSize: "1rem", color: "#374151" }}>📋 Form Steps</h3>
        <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 12 }}>
          Customize the title and instruction text shown at the top of each step.
        </p>

        {steps.map((s, idx) => (
          <div key={s.step || idx} style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 10, background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <strong style={{ fontSize: "0.9rem", color: "#4f46e5" }}>Step {s.step}</strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ ...lbl, fontSize: "0.8rem" }}>Icon</label>
                <input
                  type="text"
                  value={s.icon || ""}
                  onChange={(e) => updateStep(idx, "icon", e.target.value)}
                  style={{ ...inp, textAlign: "center" }}
                  maxLength={4}
                />
              </div>
              <div>
                <label style={{ ...lbl, fontSize: "0.8rem" }}>Title</label>
                <input
                  type="text"
                  value={s.title || ""}
                  onChange={(e) => updateStep(idx, "title", e.target.value)}
                  style={inp}
                />
              </div>
            </div>

            <div>
              <label style={{ ...lbl, fontSize: "0.8rem" }}>Instructions (shown below title)</label>
              <textarea
                value={s.instructions || ""}
                onChange={(e) => updateStep(idx, "instructions", e.target.value)}
                rows={2}
                style={{ ...inp, resize: "vertical" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Declaration customization */}
      <div style={{ marginBottom: 24, padding: 16, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
        <h3 style={{ marginTop: 0, fontSize: "1rem", color: "#374151" }}>✅ Declarations</h3>
        <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 12 }}>
          Edit the declaration checkboxes that applicants must agree to before submitting.
        </p>

        {declarations.map((d, idx) => (
          <div key={d.key || idx} style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 10, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong style={{ fontSize: "0.85rem", color: "#374151" }}>Declaration {idx + 1}</strong>
              <button type="button" onClick={() => removeDeclaration(idx)} style={{ ...smBtn, background: "#fee2e2", color: "#991b1b" }}>✕ Remove</button>
            </div>
            <Field label="Heading" value={d.heading} onChange={(e) => updateDeclaration(idx, "heading", e.target.value)} />
            <Field label="Declaration Text" value={d.text} onChange={(e) => updateDeclaration(idx, "text", e.target.value)} textarea rows={2} />
          </div>
        ))}

        <button
          type="button"
          onClick={addDeclaration}
          style={{ padding: "8px 16px", background: "#e0e7ff", color: "#3730a3", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
        >
          + Add Declaration
        </button>
      </div>

      <SaveBtn saving={saving} onClick={handleSave} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Shared UI helpers
   ════════════════════════════════════════════════════════════════ */
const lbl = { display: "block", fontWeight: 600, marginBottom: 4, fontSize: "0.9rem" };
const inp = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: "0.9rem", boxSizing: "border-box" };
const smBtn = { padding: "4px 10px", border: "1px solid #d1d5db", borderRadius: 6, background: "#f3f4f6", cursor: "pointer", fontSize: "0.8rem" };

function Field({ label, name, value, onChange, textarea, rows }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={lbl}>{label}</label>}
      {textarea ? (
        <textarea name={name} value={value || ""} onChange={onChange} rows={rows || 3} style={{ ...inp, resize: "vertical" }} />
      ) : (
        <input type="text" name={name} value={value || ""} onChange={onChange} style={inp} />
      )}
    </div>
  );
}

function SaveBtn({ saving, onClick }) {
  const props = onClick ? { type: "button", onClick } : { type: "submit" };
  return (
    <button
      {...props}
      disabled={saving}
      style={{ marginTop: 12, padding: "10px 28px", background: saving ? "#9ca3af" : "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: saving ? "default" : "pointer", fontWeight: 600, fontSize: "0.95rem" }}
    >
      {saving ? "Saving…" : "💾 Save Changes"}
    </button>
  );
}
