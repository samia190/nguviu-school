import React, { useEffect, useState, useCallback } from "react";
import { get, put, upload } from "../utils/api";
import Loader from "./Loader";

const TABS = ["Settings", "Sections", "Quick Links", "Announcements"];

export default function StudentPageManagement() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await get("/api/student-page/admin");
      setData(d);
      setError("");
    } catch (err) {
      setError("Failed to load student page data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(patch) {
    setSaving(true);
    setError("");
    try {
      const updated = await put("/api/student-page", { ...data, ...patch });
      setData(updated);
      flash("Saved successfully!");
    } catch (err) {
      setError("Save failed: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  async function uploadFile(file) {
    const form = new FormData();
    form.append("file", file);
    const res = await upload("/api/student-page/upload", form);
    return res;
  }

  async function resetDefaults() {
    if (!confirm("Reset ALL student page content to defaults? This cannot be undone.")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/student-page/reset-defaults", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const d = await res.json();
      setData(d);
      flash("Reset to defaults!");
    } catch (err) {
      setError("Reset failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader />;
  if (!data) return <p style={{ color: "red" }}>{error || "No data"}</p>;

  const sty = {
    card: { background: "#fff", borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
    label: { display: "block", fontWeight: 600, marginBottom: 4, fontSize: 13 },
    input: { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" },
    textarea: { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, minHeight: 80, boxSizing: "border-box", resize: "vertical" },
    btn: { padding: "8px 18px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14 },
    btnPrimary: { background: "#3b82f6", color: "#fff" },
    btnDanger: { background: "#ef4444", color: "#fff" },
    btnSecondary: { background: "#e5e7eb", color: "#374151" },
    btnSuccess: { background: "#10b981", color: "#fff" },
    tabBar: { display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #e5e7eb" },
    tab: (active) => ({
      padding: "10px 20px", cursor: "pointer", fontWeight: active ? 700 : 400, fontSize: 14,
      borderBottom: active ? "3px solid #3b82f6" : "3px solid transparent",
      color: active ? "#3b82f6" : "#6b7280", background: "none", border: "none",
      borderBottomWidth: 3, borderBottomStyle: "solid",
      borderBottomColor: active ? "#3b82f6" : "transparent",
    }),
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>📖 Student Page Management</h2>
        <button style={{ ...sty.btn, ...sty.btnDanger, fontSize: 12 }} onClick={resetDefaults} disabled={saving}>
          Reset Defaults
        </button>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 12, borderRadius: 6, marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ background: "#d1fae5", color: "#065f46", padding: 12, borderRadius: 6, marginBottom: 12 }}>{success}</div>}

      {/* Tabs */}
      <div style={sty.tabBar}>
        {TABS.map((t, i) => (
          <button key={t} style={sty.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {/* ─── Tab 0: Settings ───────────────────────────────────────── */}
      {tab === 0 && <SettingsTab data={data} setData={setData} save={save} saving={saving} sty={sty} uploadFile={uploadFile} />}

      {/* ─── Tab 1: Sections ───────────────────────────────────────── */}
      {tab === 1 && <SectionsTab data={data} setData={setData} save={save} saving={saving} sty={sty} uploadFile={uploadFile} />}

      {/* ─── Tab 2: Quick Links ────────────────────────────────────── */}
      {tab === 2 && <QuickLinksTab data={data} setData={setData} save={save} saving={saving} sty={sty} />}

      {/* ─── Tab 3: Announcements ──────────────────────────────────── */}
      {tab === 3 && <AnnouncementsTab data={data} setData={setData} save={save} saving={saving} sty={sty} />}
    </div>
  );
}

/* ═══════════════════════════  SETTINGS TAB  ══════════════════════════ */
function SettingsTab({ data, setData, save, saving, sty, uploadFile }) {
  const [heroUploading, setHeroUploading] = useState(false);

  async function handleHeroUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      const res = await uploadFile(file);
      setData((d) => ({ ...d, heroImage: res.url }));
    } catch { } finally { setHeroUploading(false); }
  }

  return (
    <div style={sty.card}>
      <h3 style={{ marginTop: 0 }}>Page Settings</h3>

      <label style={sty.label}>Title</label>
      <input style={sty.input} value={data.title || ""} onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))} />

      <label style={{ ...sty.label, marginTop: 12 }}>Subtitle</label>
      <textarea style={sty.textarea} value={data.subtitle || ""} onChange={(e) => setData((d) => ({ ...d, subtitle: e.target.value }))} />

      <label style={{ ...sty.label, marginTop: 12 }}>Hero Overlay Text</label>
      <input style={sty.input} value={data.heroOverlayText || ""} onChange={(e) => setData((d) => ({ ...d, heroOverlayText: e.target.value }))} />

      <label style={{ ...sty.label, marginTop: 12 }}>Hero Image</label>
      {data.heroImage && (
        <img src={data.heroImage} alt="Hero" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />
      )}
      <input type="file" accept="image/*" onChange={handleHeroUpload} disabled={heroUploading} />
      {heroUploading && <span style={{ fontSize: 12, color: "#6b7280" }}> Uploading...</span>}

      <div style={{ marginTop: 20 }}>
        <button style={{ ...sty.btn, ...sty.btnPrimary }} onClick={() => save({ title: data.title, subtitle: data.subtitle, heroImage: data.heroImage, heroOverlayText: data.heroOverlayText })} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════  SECTIONS TAB  ══════════════════════════ */
function SectionsTab({ data, setData, save, saving, sty, uploadFile }) {
  const sections = data.sections || [];

  function updateSection(idx, field, value) {
    setData((d) => {
      const s = [...(d.sections || [])];
      s[idx] = { ...s[idx], [field]: value };
      return { ...d, sections: s };
    });
  }

  function removeSection(idx) {
    if (!confirm("Remove this section?")) return;
    setData((d) => {
      const s = [...(d.sections || [])];
      s.splice(idx, 1);
      return { ...d, sections: s };
    });
  }

  function addSection() {
    setData((d) => ({
      ...d,
      sections: [...(d.sections || []), { key: `section-${Date.now()}`, heading: "New Section", intro: "", files: [], active: true, displayOrder: (d.sections || []).length }],
    }));
  }

  async function handleFileUpload(sectionIdx, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadFile(file);
      setData((d) => {
        const s = [...(d.sections || [])];
        const files = [...(s[sectionIdx].files || []), { name: res.name || file.name, url: res.url, mimetype: res.mimetype || file.type, size: res.size || file.size }];
        s[sectionIdx] = { ...s[sectionIdx], files };
        return { ...d, sections: s };
      });
    } catch (err) {
      console.error("Upload failed", err);
    }
  }

  function removeFile(sectionIdx, fileIdx) {
    setData((d) => {
      const s = [...(d.sections || [])];
      const files = [...(s[sectionIdx].files || [])];
      files.splice(fileIdx, 1);
      s[sectionIdx] = { ...s[sectionIdx], files };
      return { ...d, sections: s };
    });
  }

  function moveSection(idx, dir) {
    setData((d) => {
      const s = [...(d.sections || [])];
      const target = idx + dir;
      if (target < 0 || target >= s.length) return d;
      [s[idx], s[target]] = [s[target], s[idx]];
      s.forEach((sec, i) => { sec.displayOrder = i; });
      return { ...d, sections: s };
    });
  }

  return (
    <div>
      {sections.map((sec, i) => (
        <div key={sec._id || sec.key || i} style={{ ...sty.card, border: sec.active ? "1px solid #d1fae5" : "1px solid #fecaca" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong style={{ fontSize: 15 }}>#{i + 1} — {sec.heading}</strong>
            <div style={{ display: "flex", gap: 4 }}>
              <button style={{ ...sty.btn, ...sty.btnSecondary, padding: "4px 8px", fontSize: 12 }} onClick={() => moveSection(i, -1)} title="Move up">▲</button>
              <button style={{ ...sty.btn, ...sty.btnSecondary, padding: "4px 8px", fontSize: 12 }} onClick={() => moveSection(i, 1)} title="Move down">▼</button>
              <button style={{ ...sty.btn, ...sty.btnDanger, padding: "4px 8px", fontSize: 12 }} onClick={() => removeSection(i)}>✕</button>
            </div>
          </div>

          <label style={sty.label}>Key</label>
          <input style={sty.input} value={sec.key || ""} onChange={(e) => updateSection(i, "key", e.target.value)} />

          <label style={{ ...sty.label, marginTop: 8 }}>Heading</label>
          <input style={sty.input} value={sec.heading || ""} onChange={(e) => updateSection(i, "heading", e.target.value)} />

          <label style={{ ...sty.label, marginTop: 8 }}>Intro Text</label>
          <textarea style={sty.textarea} value={sec.intro || ""} onChange={(e) => updateSection(i, "intro", e.target.value)} />

          <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={sec.active !== false} onChange={(e) => updateSection(i, "active", e.target.checked)} />
            Active
          </label>

          {/* Files */}
          <div style={{ marginTop: 12 }}>
            <label style={sty.label}>Files ({(sec.files || []).length})</label>
            {(sec.files || []).map((f, fi) => (
              <div key={f._id || fi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13 }}>
                <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>📎 {f.name}</a>
                <button style={{ ...sty.btn, ...sty.btnDanger, padding: "2px 8px", fontSize: 11 }} onClick={() => removeFile(i, fi)}>✕</button>
              </div>
            ))}
            <input type="file" onChange={(e) => handleFileUpload(i, e)} style={{ marginTop: 6 }} />
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button style={{ ...sty.btn, ...sty.btnSecondary }} onClick={addSection}>+ Add Section</button>
        <button style={{ ...sty.btn, ...sty.btnPrimary }} onClick={() => save({ sections: data.sections })} disabled={saving}>
          {saving ? "Saving..." : "Save Sections"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════  QUICK LINKS TAB  ═══════════════════════ */
function QuickLinksTab({ data, setData, save, saving, sty }) {
  const links = data.quickLinks || [];

  function updateLink(idx, field, value) {
    setData((d) => {
      const l = [...(d.quickLinks || [])];
      l[idx] = { ...l[idx], [field]: value };
      return { ...d, quickLinks: l };
    });
  }

  function removeLink(idx) {
    setData((d) => {
      const l = [...(d.quickLinks || [])];
      l.splice(idx, 1);
      return { ...d, quickLinks: l };
    });
  }

  function addLink() {
    setData((d) => ({
      ...d,
      quickLinks: [...(d.quickLinks || []), { label: "New Link", route: "", icon: "📄", active: true, displayOrder: (d.quickLinks || []).length, requiresAuth: false, allowedRoles: [] }],
    }));
  }

  function moveLink(idx, dir) {
    setData((d) => {
      const l = [...(d.quickLinks || [])];
      const target = idx + dir;
      if (target < 0 || target >= l.length) return d;
      [l[idx], l[target]] = [l[target], l[idx]];
      l.forEach((lnk, i) => { lnk.displayOrder = i; });
      return { ...d, quickLinks: l };
    });
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0 }}>
        Quick links appear as tabs on the Student page. Route examples: <code>student/exams</code>, <code>feestructure</code>, <code>portal/homework</code>, <code>student-results</code>
      </p>
      {links.map((lnk, i) => (
        <div key={lnk._id || i} style={{ ...sty.card, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong>{lnk.icon} {lnk.label}</strong>
            <div style={{ display: "flex", gap: 4 }}>
              <button style={{ ...sty.btn, ...sty.btnSecondary, padding: "4px 8px", fontSize: 12 }} onClick={() => moveLink(i, -1)}>▲</button>
              <button style={{ ...sty.btn, ...sty.btnSecondary, padding: "4px 8px", fontSize: 12 }} onClick={() => moveLink(i, 1)}>▼</button>
              <button style={{ ...sty.btn, ...sty.btnDanger, padding: "4px 8px", fontSize: 12 }} onClick={() => removeLink(i)}>✕</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 8 }}>
            <div>
              <label style={sty.label}>Label</label>
              <input style={sty.input} value={lnk.label || ""} onChange={(e) => updateLink(i, "label", e.target.value)} />
            </div>
            <div>
              <label style={sty.label}>Route</label>
              <input style={sty.input} value={lnk.route || ""} onChange={(e) => updateLink(i, "route", e.target.value)} />
            </div>
            <div>
              <label style={sty.label}>Icon</label>
              <input style={sty.input} value={lnk.icon || ""} onChange={(e) => updateLink(i, "icon", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={lnk.active !== false} onChange={(e) => updateLink(i, "active", e.target.checked)} /> Active
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={lnk.requiresAuth === true} onChange={(e) => updateLink(i, "requiresAuth", e.target.checked)} /> Requires Login
            </label>
          </div>

          {lnk.requiresAuth && (
            <div style={{ marginTop: 6 }}>
              <label style={sty.label}>Allowed Roles (comma-separated)</label>
              <input style={sty.input} value={(lnk.allowedRoles || []).join(", ")} onChange={(e) => updateLink(i, "allowedRoles", e.target.value.split(",").map((r) => r.trim()).filter(Boolean))} placeholder="e.g. student, teacher, admin" />
            </div>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button style={{ ...sty.btn, ...sty.btnSecondary }} onClick={addLink}>+ Add Link</button>
        <button style={{ ...sty.btn, ...sty.btnPrimary }} onClick={() => save({ quickLinks: data.quickLinks })} disabled={saving}>
          {saving ? "Saving..." : "Save Quick Links"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════  ANNOUNCEMENTS TAB  ═════════════════════ */
function AnnouncementsTab({ data, setData, save, saving, sty }) {
  const announcements = data.announcements || [];
  const categories = ["general", "academic", "exams", "fees", "events", "urgent"];

  function updateAnn(idx, field, value) {
    setData((d) => {
      const a = [...(d.announcements || [])];
      a[idx] = { ...a[idx], [field]: value };
      return { ...d, announcements: a };
    });
  }

  function removeAnn(idx) {
    if (!confirm("Delete this announcement?")) return;
    setData((d) => {
      const a = [...(d.announcements || [])];
      a.splice(idx, 1);
      return { ...d, announcements: a };
    });
  }

  function addAnn() {
    setData((d) => ({
      ...d,
      announcements: [{ title: "", body: "", date: new Date().toISOString().slice(0, 10), category: "general", active: true }, ...(d.announcements || [])],
    }));
  }

  const catColors = { general: "#6b7280", academic: "#3b82f6", exams: "#f59e0b", fees: "#10b981", events: "#8b5cf6", urgent: "#ef4444" };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button style={{ ...sty.btn, ...sty.btnSecondary }} onClick={addAnn}>+ Add Announcement</button>
        <button style={{ ...sty.btn, ...sty.btnPrimary }} onClick={() => save({ announcements: data.announcements })} disabled={saving}>
          {saving ? "Saving..." : "Save Announcements"}
        </button>
      </div>

      {announcements.length === 0 && <p style={{ color: "#9ca3af" }}>No announcements yet.</p>}

      {announcements.map((ann, i) => (
        <div key={ann._id || i} style={{ ...sty.card, padding: 14, borderLeft: `4px solid ${catColors[ann.category] || "#ccc"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong style={{ fontSize: 14 }}>{ann.title || "(untitled)"}</strong>
            <button style={{ ...sty.btn, ...sty.btnDanger, padding: "2px 10px", fontSize: 12 }} onClick={() => removeAnn(i)}>✕</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 8 }}>
            <div>
              <label style={sty.label}>Title</label>
              <input style={sty.input} value={ann.title || ""} onChange={(e) => updateAnn(i, "title", e.target.value)} />
            </div>
            <div>
              <label style={sty.label}>Date</label>
              <input type="date" style={sty.input} value={(ann.date || "").slice(0, 10)} onChange={(e) => updateAnn(i, "date", e.target.value)} />
            </div>
            <div>
              <label style={sty.label}>Category</label>
              <select style={sty.input} value={ann.category || "general"} onChange={(e) => updateAnn(i, "category", e.target.value)}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <label style={{ ...sty.label, marginTop: 8 }}>Body</label>
          <textarea style={sty.textarea} value={ann.body || ""} onChange={(e) => updateAnn(i, "body", e.target.value)} />

          <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, cursor: "pointer", fontSize: 13 }}>
            <input type="checkbox" checked={ann.active !== false} onChange={(e) => updateAnn(i, "active", e.target.checked)} /> Active
          </label>
        </div>
      ))}
    </div>
  );
}
