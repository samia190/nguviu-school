import React, { useEffect, useState } from "react";
import { get, put, upload } from "../utils/api";

const CATEGORIES = [
  { value: "sports", label: "Sports", color: "#ef4444" },
  { value: "clubs", label: "Clubs", color: "#3b82f6" },
  { value: "activities", label: "Activities", color: "#f59e0b" },
  { value: "traditions", label: "Traditions", color: "#8b5cf6" },
  { value: "academics", label: "Academics", color: "#10b981" },
  { value: "community", label: "Community", color: "#ec4899" },
];

const emptyActivity = {
  title: "",
  description: "",
  category: "activities",
  imageUrl: "",
  imageAlt: "",
  featured: false,
  active: true,
  displayOrder: 0,
};

export default function StudentLifeManagement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("settings");
  const [saving, setSaving] = useState(false);

  // Page settings
  const [settings, setSettings] = useState({
    title: "",
    subtitle: "",
    heroImage: "",
    heroOverlayText: "",
  });

  // Activities
  const [activities, setActivities] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState(emptyActivity);
  const [uploading, setUploading] = useState(false);
  const [filterCat, setFilterCat] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const d = await get("/api/student-life-page/admin");
      setData(d);
      setSettings({
        title: d.title || "",
        subtitle: d.subtitle || "",
        heroImage: d.heroImage || "",
        heroOverlayText: d.heroOverlayText || "",
      });
      setActivities(d.activities || []);
    } catch (e) {
      setError("Failed to load student life data");
    } finally {
      setLoading(false);
    }
  }

  function flash(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  // ─── Save page settings ───────────────────────────────────────────────────
  async function saveSettings(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const d = await put("/api/student-life-page", settings);
      setData(d);
      flash("Page settings saved!");
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  // ─── Hero image upload ────────────────────────────────────────────────────
  async function handleHeroUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await upload("/api/student-life-page/upload", fd);
      setSettings((s) => ({ ...s, heroImage: res.url }));
      flash("Hero image uploaded!");
    } catch {
      setError("Hero upload failed");
    } finally {
      setUploading(false);
    }
  }

  // ─── Activity image upload ────────────────────────────────────────────────
  async function handleActivityImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await upload("/api/student-life-page/upload", fd);
      setForm((f) => ({ ...f, imageUrl: res.url }));
      flash("Image uploaded!");
    } catch {
      setError("Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  // ─── Save activities ─────────────────────────────────────────────────────
  async function saveActivities() {
    setSaving(true);
    setError("");
    try {
      const d = await put("/api/student-life-page", { activities });
      setData(d);
      setActivities(d.activities || []);
      flash("Activities saved!");
    } catch {
      setError("Failed to save activities");
    } finally {
      setSaving(false);
    }
  }

  // ─── Form helpers ─────────────────────────────────────────────────────────
  function startEdit(idx) {
    setEditIdx(idx);
    setForm({ ...activities[idx] });
  }

  function cancelEdit() {
    setEditIdx(null);
    setForm(emptyActivity);
  }

  function applyEdit() {
    if (!form.title.trim()) return setError("Title is required");
    const updated = [...activities];
    if (editIdx !== null) {
      updated[editIdx] = form;
    } else {
      updated.push({ ...form, displayOrder: updated.length + 1 });
    }
    setActivities(updated);
    cancelEdit();
  }

  function removeActivity(idx) {
    if (!window.confirm("Delete this activity?")) return;
    setActivities((a) => a.filter((_, i) => i !== idx));
  }

  // ─── Reset defaults ──────────────────────────────────────────────────────
  async function resetDefaults() {
    if (
      !window.confirm(
        "Reset all student life content to defaults? This cannot be undone."
      )
    )
      return;
    setSaving(true);
    try {
      const d = await (
        await fetch("/api/student-life-page/reset-defaults", {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
      ).json();
      setData(d);
      setSettings({
        title: d.title || "",
        subtitle: d.subtitle || "",
        heroImage: d.heroImage || "",
        heroOverlayText: d.heroOverlayText || "",
      });
      setActivities(d.activities || []);
      flash("Reset to defaults!");
    } catch {
      setError("Reset failed");
    } finally {
      setSaving(false);
    }
  }

  const filtered =
    filterCat === "all"
      ? activities
      : activities.filter((a) => a.category === filterCat);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
    );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        🎓 Student Life Management
      </h2>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        Manage activities, clubs, sports, and school traditions
      </p>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            background: "#dcfce7",
            color: "#166534",
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {success}
        </div>
      )}

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          borderBottom: "2px solid #e5e7eb",
          paddingBottom: 8,
        }}
      >
        {[
          { key: "settings", label: "⚙️ Page Settings" },
          { key: "activities", label: "📋 Activities" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: tab === t.key ? 700 : 400,
              background: tab === t.key ? "#059669" : "#f3f4f6",
              color: tab === t.key ? "#fff" : "#374151",
            }}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={resetDefaults}
          style={{
            marginLeft: "auto",
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #fca5a5",
            background: "#fff",
            color: "#dc2626",
            cursor: "pointer",
            fontSize: 13,
          }}
          disabled={saving}
        >
          Reset Defaults
        </button>
      </div>

      {/* ─── PAGE SETTINGS TAB ──────────────────────────────────────────── */}
      {tab === "settings" && (
        <form onSubmit={saveSettings}>
          <div style={{ display: "grid", gap: 16 }}>
            <label>
              <span style={labelStyle}>Page Title</span>
              <input
                style={inputStyle}
                value={settings.title}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, title: e.target.value }))
                }
              />
            </label>
            <label>
              <span style={labelStyle}>Subtitle</span>
              <input
                style={inputStyle}
                value={settings.subtitle}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, subtitle: e.target.value }))
                }
              />
            </label>
            <label>
              <span style={labelStyle}>Hero Overlay Text</span>
              <input
                style={inputStyle}
                value={settings.heroOverlayText}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    heroOverlayText: e.target.value,
                  }))
                }
              />
            </label>

            <div>
              <span style={labelStyle}>Hero Image</span>
              {settings.heroImage && (
                <img
                  src={settings.heroImage}
                  alt="hero"
                  style={{
                    width: "100%",
                    maxHeight: 200,
                    objectFit: "cover",
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleHeroUpload}
                disabled={uploading}
              />
              {uploading && (
                <span style={{ color: "#6b7280", fontSize: 13 }}>
                  {" "}
                  Uploading...
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...btnStyle,
              background: "#059669",
              color: "#fff",
              marginTop: 20,
            }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}

      {/* ─── ACTIVITIES TAB ─────────────────────────────────────────────── */}
      {tab === "activities" && (
        <div>
          {/* Category filter */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 16,
            }}
          >
            <button
              onClick={() => setFilterCat("all")}
              style={{
                ...pillStyle,
                background:
                  filterCat === "all" ? "#059669" : "#f3f4f6",
                color: filterCat === "all" ? "#fff" : "#374151",
              }}
            >
              All ({activities.length})
            </button>
            {CATEGORIES.map((c) => {
              const count = activities.filter(
                (a) => a.category === c.value
              ).length;
              return (
                <button
                  key={c.value}
                  onClick={() => setFilterCat(c.value)}
                  style={{
                    ...pillStyle,
                    background:
                      filterCat === c.value ? c.color : "#f3f4f6",
                    color:
                      filterCat === c.value ? "#fff" : "#374151",
                  }}
                >
                  {c.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Add / Edit form */}
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <h3
              style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}
            >
              {editIdx !== null ? "Edit Activity" : "Add New Activity"}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <label>
                <span style={labelStyle}>Title *</span>
                <input
                  style={inputStyle}
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Activity title"
                />
              </label>
              <label>
                <span style={labelStyle}>Category</span>
                <select
                  style={inputStyle}
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label style={{ display: "block", marginTop: 12 }}>
              <span style={labelStyle}>Description</span>
              <textarea
                style={{ ...inputStyle, minHeight: 80 }}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Activity description"
              />
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 12,
              }}
            >
              <label>
                <span style={labelStyle}>Image Alt Text</span>
                <input
                  style={inputStyle}
                  value={form.imageAlt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageAlt: e.target.value }))
                  }
                />
              </label>
              <label>
                <span style={labelStyle}>Display Order</span>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      displayOrder: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </label>
            </div>

            <div style={{ marginTop: 12 }}>
              <span style={labelStyle}>Image</span>
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="preview"
                  style={{
                    width: 160,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: 8,
                    marginBottom: 8,
                    display: "block",
                  }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleActivityImage}
                disabled={uploading}
              />
              {uploading && (
                <span style={{ color: "#6b7280", fontSize: 13 }}>
                  {" "}
                  Uploading...
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                marginTop: 12,
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, featured: e.target.checked }))
                  }
                />
                Featured
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, active: e.target.checked }))
                  }
                />
                Active
              </label>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={applyEdit}
                style={{ ...btnStyle, background: "#059669", color: "#fff" }}
              >
                {editIdx !== null ? "Update" : "Add Activity"}
              </button>
              {editIdx !== null && (
                <button onClick={cancelEdit} style={btnStyle}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Activity cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((a, i) => {
              const realIdx = activities.indexOf(a);
              const cat = CATEGORIES.find((c) => c.value === a.category);
              return (
                <div
                  key={i}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    overflow: "hidden",
                    opacity: a.active ? 1 : 0.5,
                  }}
                >
                  {a.imageUrl && (
                    <img
                      src={a.imageUrl}
                      alt={a.imageAlt || a.title}
                      style={{
                        width: "100%",
                        height: 140,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div style={{ padding: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          flex: 1,
                        }}
                      >
                        {a.title}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: cat?.color || "#6b7280",
                          color: "#fff",
                        }}
                      >
                        {cat?.label || a.category}
                      </span>
                    </div>
                    {a.description && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                          margin: "0 0 8px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {a.description}
                      </p>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      {a.featured && (
                        <span
                          style={{
                            fontSize: 11,
                            background: "#fef3c7",
                            color: "#92400e",
                            padding: "1px 6px",
                            borderRadius: 6,
                          }}
                        >
                          ⭐ Featured
                        </span>
                      )}
                      {!a.active && (
                        <span
                          style={{
                            fontSize: 11,
                            background: "#fee2e2",
                            color: "#991b1b",
                            padding: "1px 6px",
                            borderRadius: 6,
                          }}
                        >
                          Hidden
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          marginLeft: "auto",
                        }}
                      >
                        #{a.displayOrder}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginTop: 8,
                      }}
                    >
                      <button
                        onClick={() => startEdit(realIdx)}
                        style={{
                          ...btnSmallStyle,
                          background: "#e0f2fe",
                          color: "#1e40af",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeActivity(realIdx)}
                        style={{
                          ...btnSmallStyle,
                          background: "#fee2e2",
                          color: "#991b1b",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#9ca3af",
                padding: 40,
              }}
            >
              No activities found.
            </p>
          )}

          {/* Save button */}
          <button
            onClick={saveActivities}
            disabled={saving}
            style={{
              ...btnStyle,
              background: "#059669",
              color: "#fff",
              marginTop: 24,
              width: "100%",
              padding: "12px 0",
              fontSize: 16,
            }}
          >
            {saving ? "Saving..." : "💾 Save All Activities"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Shared styles ──────────────────────────────────────────────────────────
const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 4,
};
const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
};
const btnStyle = {
  padding: "8px 20px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
  background: "#fff",
};
const btnSmallStyle = {
  padding: "4px 10px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontWeight: 500,
  fontSize: 12,
};
const pillStyle = {
  padding: "4px 14px",
  borderRadius: 20,
  border: "none",
  cursor: "pointer",
  fontWeight: 500,
  fontSize: 13,
};
