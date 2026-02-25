// src/components/CurriculumPageManagement.jsx
import { useEffect, useState, useCallback } from "react";
import { get, put, upload } from "../utils/api";

const EMPTY_COMBO = { code: "", subjects: ["", "", ""], active: true };
const EMPTY_STREAM = { name: "", icon: "", combinations: [], active: true, displayOrder: 0 };
const EMPTY_SECTION = { key: "", heading: "", body: "", imageUrl: "", files: [], active: true, displayOrder: 0 };

export default function CurriculumPageManagement() {
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
      const d = await get("/api/curriculum-page/admin");
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
      const updated = await put("/api/curriculum-page", partial);
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
    return await upload("/api/curriculum-page/upload", fd);
  }

  async function resetDefaults() {
    if (!window.confirm("Reset ALL curriculum page data to defaults? This cannot be undone.")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/curriculum-page/reset-defaults", { method: "POST", credentials: "include" });
      const d = await res.json();
      setData(d);
      flash("Reset to defaults!");
    } catch (e) {
      fail("Reset failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-section"><p>Loading curriculum page...</p></div>;
  if (!data) return <div className="admin-section"><p className="error-message">Failed to load data</p></div>;

  return (
    <div className="admin-section">
      <h2>📚 Curriculum Page Management</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message" style={{ background: "#d1fae5", color: "#065f46", padding: "10px 16px", borderRadius: 8, marginBottom: 12 }}>{success}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { k: "settings", l: "⚙️ Settings" },
          { k: "streams", l: "🔬 Subject Combinations" },
          { k: "sections", l: "📄 Content Sections" },
        ].map(({ k, l }) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: "8px 16px", borderRadius: 8, border: tab === k ? "2px solid #7c3aed" : "1px solid #d1d5db", background: tab === k ? "#ede9fe" : "#fff", fontWeight: tab === k ? 700 : 400, cursor: "pointer" }}>
            {l}
          </button>
        ))}
      </div>

      {/* ═══ SETTINGS TAB ═══ */}
      {tab === "settings" && <SettingsTab data={data} save={save} saving={saving} uploadFile={uploadFile} resetDefaults={resetDefaults} />}

      {/* ═══ STREAMS TAB ═══ */}
      {tab === "streams" && <StreamsTab data={data} save={save} saving={saving} />}

      {/* ═══ SECTIONS TAB ═══ */}
      {tab === "sections" && <SectionsTab data={data} save={save} saving={saving} uploadFile={uploadFile} />}
    </div>
  );
}

/* ──────────────── SETTINGS TAB ──────────────── */
function SettingsTab({ data, save, saving, uploadFile, resetDefaults }) {
  const [form, setForm] = useState({
    title: data.title || "",
    subtitle: data.subtitle || "",
    heroImage: data.heroImage || "",
    heroOverlayText: data.heroOverlayText || "",
    intro: data.intro || "",
    schoolName: data.schoolName || "",
    schoolLocation: data.schoolLocation || "",
    schoolCategory: data.schoolCategory || "",
  });
  const [uploading, setUploading] = useState(false);

  async function handleHeroUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      setForm((p) => ({ ...p, heroImage: res.url }));
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <div className="form-group"><label>Page Title</label>
        <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
      <div className="form-group"><label>Subtitle</label>
        <input value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} /></div>
      <div className="form-group"><label>Hero Overlay Text</label>
        <input value={form.heroOverlayText} onChange={(e) => setForm((p) => ({ ...p, heroOverlayText: e.target.value }))} /></div>
      <div className="form-group"><label>Hero Image</label>
        {form.heroImage && <img src={form.heroImage} alt="Hero" style={{ maxWidth: 300, borderRadius: 8, marginBottom: 8, display: "block" }} />}
        <input type="file" accept="image/*" onChange={handleHeroUpload} disabled={uploading} />
        {uploading && <span>Uploading...</span>}
      </div>
      <div className="form-group"><label>Introduction Text</label>
        <textarea rows={4} value={form.intro} onChange={(e) => setForm((p) => ({ ...p, intro: e.target.value }))} /></div>

      <h4 style={{ marginTop: 20 }}>School Profile</h4>
      <div className="form-group"><label>School Name</label>
        <input value={form.schoolName} onChange={(e) => setForm((p) => ({ ...p, schoolName: e.target.value }))} /></div>
      <div style={{ display: "flex", gap: 12 }}>
        <div className="form-group" style={{ flex: 1 }}><label>Location</label>
          <input value={form.schoolLocation} onChange={(e) => setForm((p) => ({ ...p, schoolLocation: e.target.value }))} /></div>
        <div className="form-group" style={{ flex: 1 }}><label>Category</label>
          <input value={form.schoolCategory} onChange={(e) => setForm((p) => ({ ...p, schoolCategory: e.target.value }))} /></div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={() => save(form)} disabled={saving} className="btn-primary">{saving ? "Saving..." : "💾 Save Settings"}</button>
        <button onClick={resetDefaults} disabled={saving} className="btn-secondary" style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5" }}>🔄 Reset Defaults</button>
      </div>
    </div>
  );
}

/* ──────────────── STREAMS TAB (Subject Combinations) ──────────────── */
function StreamsTab({ data, save, saving }) {
  const [streams, setStreams] = useState(data.streams || []);
  const [editIdx, setEditIdx] = useState(null);

  function updateStream(idx, field, value) {
    setStreams((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  function addStream() {
    setStreams((prev) => [...prev, { ...EMPTY_STREAM, displayOrder: prev.length + 1, name: "New Stream" }]);
    setEditIdx(streams.length);
  }

  function removeStream(idx) {
    if (!window.confirm("Delete this entire stream and all its combinations?")) return;
    setStreams((prev) => prev.filter((_, i) => i !== idx));
    setEditIdx(null);
  }

  function addCombo(streamIdx) {
    setStreams((prev) => prev.map((s, i) => i === streamIdx ? { ...s, combinations: [...s.combinations, { ...EMPTY_COMBO }] } : s));
  }

  function updateCombo(streamIdx, comboIdx, field, value) {
    setStreams((prev) => prev.map((s, si) =>
      si === streamIdx
        ? { ...s, combinations: s.combinations.map((c, ci) => ci === comboIdx ? { ...c, [field]: value } : c) }
        : s
    ));
  }

  function updateComboSubject(streamIdx, comboIdx, subjectIdx, value) {
    setStreams((prev) => prev.map((s, si) =>
      si === streamIdx
        ? {
            ...s,
            combinations: s.combinations.map((c, ci) =>
              ci === comboIdx
                ? { ...c, subjects: c.subjects.map((sub, subi) => subi === subjectIdx ? value : sub) }
                : c
            ),
          }
        : s
    ));
  }

  function removeCombo(streamIdx, comboIdx) {
    setStreams((prev) => prev.map((s, si) =>
      si === streamIdx ? { ...s, combinations: s.combinations.filter((_, ci) => ci !== comboIdx) } : s
    ));
  }

  function moveStream(idx, dir) {
    const arr = [...streams];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    arr.forEach((s, i) => (s.displayOrder = i + 1));
    setStreams(arr);
  }

  return (
    <div>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>Manage the subject combination streams offered at the school. Each stream contains multiple combinations with their KNEC codes.</p>

      {streams.map((stream, si) => (
        <div key={si} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 16, background: editIdx === si ? "#f9fafb" : "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>{stream.icon || "📋"}</span>
              <strong style={{ fontSize: 16 }}>{stream.name}</strong>
              <span style={{ color: "#9ca3af", fontSize: 13 }}>({stream.combinations?.length || 0} combinations)</span>
              {!stream.active && <span style={{ background: "#fef2f2", color: "#991b1b", fontSize: 11, padding: "2px 8px", borderRadius: 12 }}>Hidden</span>}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => moveStream(si, -1)} disabled={si === 0} title="Move up">↑</button>
              <button onClick={() => moveStream(si, 1)} disabled={si === streams.length - 1} title="Move down">↓</button>
              <button onClick={() => setEditIdx(editIdx === si ? null : si)}>{editIdx === si ? "Close" : "Edit"}</button>
              <button onClick={() => removeStream(si)} className="danger" style={{ color: "#dc2626" }}>✕</button>
            </div>
          </div>

          {editIdx === si && (
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div className="form-group" style={{ flex: 2 }}><label>Stream Name</label>
                  <input value={stream.name} onChange={(e) => updateStream(si, "name", e.target.value)} /></div>
                <div className="form-group" style={{ flex: 1 }}><label>Icon (emoji)</label>
                  <input value={stream.icon} onChange={(e) => updateStream(si, "icon", e.target.value)} maxLength={4} /></div>
                <div className="form-group" style={{ width: 80 }}>
                  <label>Active</label>
                  <input type="checkbox" checked={stream.active} onChange={(e) => updateStream(si, "active", e.target.checked)} style={{ width: 20, height: 20 }} />
                </div>
              </div>

              <h5 style={{ marginBottom: 8 }}>Combinations</h5>
              {(stream.combinations || []).map((combo, ci) => (
                <div key={ci} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, padding: 8, background: "#fff", borderRadius: 6, border: "1px solid #e5e7eb" }}>
                  <input value={combo.code} onChange={(e) => updateCombo(si, ci, "code", e.target.value)} placeholder="Code" style={{ width: 90 }} />
                  {(combo.subjects || []).map((sub, subi) => (
                    <input key={subi} value={sub} onChange={(e) => updateComboSubject(si, ci, subi, e.target.value)} placeholder={`Subject ${subi + 1}`} style={{ flex: 1 }} />
                  ))}
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                    <input type="checkbox" checked={combo.active !== false} onChange={(e) => updateCombo(si, ci, "active", e.target.checked)} /> Vis
                  </label>
                  <button onClick={() => removeCombo(si, ci)} style={{ color: "#dc2626", padding: "4px 8px" }}>✕</button>
                </div>
              ))}
              <button onClick={() => addCombo(si)} style={{ marginTop: 8, fontSize: 13 }}>+ Add Combination</button>
            </div>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={addStream} className="btn-secondary">+ Add Stream</button>
        <button onClick={() => save({ streams })} disabled={saving} className="btn-primary">{saving ? "Saving..." : "💾 Save Streams"}</button>
      </div>
    </div>
  );
}

/* ──────────────── SECTIONS TAB ──────────────── */
function SectionsTab({ data, save, saving, uploadFile }) {
  const [sections, setSections] = useState(data.sections || []);
  const [editIdx, setEditIdx] = useState(null);
  const [uploading, setUploading] = useState(false);

  function updateSection(idx, field, value) {
    setSections((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  function addSection() {
    setSections((prev) => [...prev, { ...EMPTY_SECTION, key: `section-${Date.now()}`, heading: "New Section", displayOrder: prev.length + 1 }]);
    setEditIdx(sections.length);
  }

  function removeSection(idx) {
    if (!window.confirm("Delete this section?")) return;
    setSections((prev) => prev.filter((_, i) => i !== idx));
    setEditIdx(null);
  }

  function moveSection(idx, dir) {
    const arr = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    arr.forEach((s, i) => (s.displayOrder = i + 1));
    setSections(arr);
  }

  async function handleImageUpload(idx, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      updateSection(idx, "imageUrl", res.url);
    } catch { /* ignore */ } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleFileUpload(idx, e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const res = await uploadFile(file);
        uploaded.push({ name: res.name || file.name, url: res.url, mimetype: res.mimetype || file.type, size: res.size || file.size });
      }
      setSections((prev) => prev.map((s, i) => i === idx ? { ...s, files: [...(s.files || []), ...uploaded] } : s));
    } catch { /* ignore */ } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeFile(sectionIdx, fileIdx) {
    setSections((prev) => prev.map((s, i) =>
      i === sectionIdx ? { ...s, files: s.files.filter((_, fi) => fi !== fileIdx) } : s
    ));
  }

  return (
    <div>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>Manage content sections that appear on the curriculum page. Add text content, images, and downloadable files.</p>

      {sections.map((sec, idx) => (
        <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 12, background: editIdx === idx ? "#f9fafb" : "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <strong>{sec.heading || "Untitled"}</strong>
              {!sec.active && <span style={{ background: "#fef2f2", color: "#991b1b", fontSize: 11, padding: "2px 8px", borderRadius: 12 }}>Hidden</span>}
              <span style={{ color: "#9ca3af", fontSize: 12 }}>({sec.files?.length || 0} files)</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}>↑</button>
              <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}>↓</button>
              <button onClick={() => setEditIdx(editIdx === idx ? null : idx)}>{editIdx === idx ? "Close" : "Edit"}</button>
              <button onClick={() => removeSection(idx)} style={{ color: "#dc2626" }}>✕</button>
            </div>
          </div>

          {editIdx === idx && (
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="form-group" style={{ flex: 2 }}><label>Heading</label>
                  <input value={sec.heading} onChange={(e) => updateSection(idx, "heading", e.target.value)} /></div>
                <div className="form-group" style={{ flex: 1 }}><label>Key (slug)</label>
                  <input value={sec.key} onChange={(e) => updateSection(idx, "key", e.target.value)} /></div>
                <div className="form-group" style={{ width: 80 }}>
                  <label>Active</label>
                  <input type="checkbox" checked={sec.active} onChange={(e) => updateSection(idx, "active", e.target.checked)} style={{ width: 20, height: 20 }} />
                </div>
              </div>
              <div className="form-group"><label>Body</label>
                <textarea rows={5} value={sec.body} onChange={(e) => updateSection(idx, "body", e.target.value)} /></div>

              <div className="form-group"><label>Section Image</label>
                {sec.imageUrl && <img src={sec.imageUrl} alt="" style={{ maxWidth: 200, borderRadius: 8, marginBottom: 8, display: "block" }} />}
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(idx, e)} disabled={uploading} />
              </div>

              <div className="form-group"><label>Downloadable Files</label>
                {(sec.files || []).map((f, fi) => (
                  <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span>📎 {f.name || "File"}</span>
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>({f.mimetype})</span>
                    <button onClick={() => removeFile(idx, fi)} style={{ color: "#dc2626", padding: "2px 6px" }}>✕</button>
                  </div>
                ))}
                <input type="file" multiple onChange={(e) => handleFileUpload(idx, e)} disabled={uploading} />
                {uploading && <span style={{ color: "#6b7280" }}>Uploading...</span>}
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={addSection} className="btn-secondary">+ Add Section</button>
        <button onClick={() => save({ sections })} disabled={saving} className="btn-primary">{saving ? "Saving..." : "💾 Save Sections"}</button>
      </div>
    </div>
  );
}
