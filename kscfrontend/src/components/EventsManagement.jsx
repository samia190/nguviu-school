import React, { useEffect, useState } from "react";
import { get, put, upload } from "../utils/api";

const CATEGORIES = [
  { value: "academic", label: "Academic", color: "#3b82f6" },
  { value: "sports", label: "Sports", color: "#10b981" },
  { value: "cultural", label: "Cultural", color: "#f59e0b" },
  { value: "religious", label: "Religious", color: "#8b5cf6" },
  { value: "administrative", label: "Administrative", color: "#6366f1" },
  { value: "social", label: "Social", color: "#ec4899" },
  { value: "other", label: "Other", color: "#6b7280" },
];

const COLOR_OPTIONS = [
  { value: "#f3f4f6", label: "Light Grey" },
  { value: "#e0f2fe", label: "Light Blue" },
  { value: "#dcfce7", label: "Light Green" },
  { value: "#fef3c7", label: "Light Yellow" },
  { value: "#fee2e2", label: "Light Red" },
  { value: "#f3e8ff", label: "Light Purple" },
];

const emptyEvent = {
  title: "",
  description: "",
  date: "",
  endDate: "",
  location: "",
  category: "other",
  imageUrl: "",
  imageAlt: "",
  featured: false,
  active: true,
  displayOrder: 0,
  color: "#f3f4f6",
  linkUrl: "",
};

export default function EventsManagement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("settings");
  const [saving, setSaving] = useState(false);

  // Page settings form
  const [settings, setSettings] = useState({ title: "", intro: "", heroImage: "", heroOverlayText: "" });

  // Events
  const [events, setEvents] = useState([]);
  const [editEvent, setEditEvent] = useState(null); // null = adding new, or index
  const [eventForm, setEventForm] = useState({ ...emptyEvent });
  const [imageUploading, setImageUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const d = await get("/api/events-page/admin");
      setData(d);
      setSettings({
        title: d.title || "School Events",
        intro: d.intro || "",
        heroImage: d.heroImage || "",
        heroOverlayText: d.heroOverlayText || "",
      });
      setEvents(d.events || []);
    } catch (err) {
      setError(err.message || "Failed to load events page");
    } finally {
      setLoading(false);
    }
  }

  function flash(msg) { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }

  async function save(updates) {
    setSaving(true);
    setError("");
    try {
      const d = await put("/api/events-page", updates);
      setData(d);
      setSettings({
        title: d.title || "",
        intro: d.intro || "",
        heroImage: d.heroImage || "",
        heroOverlayText: d.heroOverlayText || "",
      });
      setEvents(d.events || []);
      flash("Saved successfully!");
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadImage(file, onUrl) {
    if (!file) return;
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED.includes(file.type)) { setError("Only JPEG, PNG, WebP, GIF allowed"); return; }
    if (file.size > 20 * 1024 * 1024) { setError("Image too large (max 20 MB)"); return; }
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await upload("/api/events-page/upload", fd);
      if (result?.url) onUrl(result.url);
      else setError("Upload succeeded but no URL returned");
    } catch (err) {
      setError("Upload failed: " + (err.message || "Unknown error"));
    }
  }

  // ─── Page Settings ──────────────────────────────────────────
  function renderSettings() {
    return (
      <div style={{ maxWidth: 700 }}>
        <h3 style={{ marginTop: 0 }}>Page Settings</h3>

        <label style={labelStyle}>Page Title</label>
        <input style={inputStyle} value={settings.title} onChange={(e) => setSettings({ ...settings, title: e.target.value })} />

        <label style={labelStyle}>Intro Text</label>
        <textarea style={{ ...inputStyle, minHeight: 80 }} value={settings.intro} onChange={(e) => setSettings({ ...settings, intro: e.target.value })} />

        <label style={labelStyle}>Hero Overlay Text</label>
        <input style={inputStyle} value={settings.heroOverlayText} onChange={(e) => setSettings({ ...settings, heroOverlayText: e.target.value })} />

        <label style={labelStyle}>Hero Image</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <label style={{ ...btnStyle, background: heroUploading ? "#ccc" : "#667eea", cursor: heroUploading ? "not-allowed" : "pointer" }}>
            {heroUploading ? "Uploading…" : "📁 Upload Hero Image"}
            <input type="file" accept="image/*" hidden disabled={heroUploading} onChange={async (e) => {
              setHeroUploading(true);
              await handleUploadImage(e.target.files?.[0], (url) => setSettings({ ...settings, heroImage: url }));
              setHeroUploading(false);
            }} />
          </label>
        </div>
        <input style={inputStyle} value={settings.heroImage} onChange={(e) => setSettings({ ...settings, heroImage: e.target.value })} placeholder="https://..." />
        {settings.heroImage && <img src={settings.heroImage} alt="Hero preview" style={{ maxWidth: 400, maxHeight: 160, borderRadius: 6, marginTop: 6, border: "1px solid #ddd" }} onError={(e) => { e.target.style.display = "none"; }} />}

        <div style={{ marginTop: 20 }}>
          <button style={{ ...btnStyle, background: "#667eea" }} disabled={saving} onClick={() => save({ title: settings.title, intro: settings.intro, heroImage: settings.heroImage, heroOverlayText: settings.heroOverlayText })}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Events CRUD ────────────────────────────────────────────
  function openNewEvent() {
    setEditEvent("new");
    setEventForm({ ...emptyEvent, displayOrder: events.length + 1 });
  }

  function openEditEvent(idx) {
    const ev = events[idx];
    setEditEvent(idx);
    setEventForm({
      ...emptyEvent,
      ...ev,
      date: ev.date ? new Date(ev.date).toISOString().slice(0, 16) : "",
      endDate: ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 16) : "",
    });
  }

  function cancelEdit() { setEditEvent(null); setEventForm({ ...emptyEvent }); }

  async function saveEvent() {
    if (!eventForm.title.trim()) { setError("Event title is required"); return; }

    const entry = {
      ...eventForm,
      date: eventForm.date ? new Date(eventForm.date).toISOString() : null,
      endDate: eventForm.endDate ? new Date(eventForm.endDate).toISOString() : null,
    };

    let updated;
    if (editEvent === "new") {
      updated = [...events, entry];
    } else {
      updated = events.map((e, i) => (i === editEvent ? { ...e, ...entry } : e));
    }
    await save({ events: updated });
    cancelEdit();
  }

  async function deleteEvent(idx) {
    if (!window.confirm("Delete this event?")) return;
    const updated = events.filter((_, i) => i !== idx);
    await save({ events: updated });
  }

  async function toggleActive(idx) {
    const updated = events.map((e, i) => (i === idx ? { ...e, active: !e.active } : e));
    await save({ events: updated });
  }

  async function toggleFeatured(idx) {
    const updated = events.map((e, i) => (i === idx ? { ...e, featured: !e.featured } : e));
    await save({ events: updated });
  }

  const filteredEvents = filterCategory === "all" ? events : events.filter((e) => e.category === filterCategory);

  function renderEventForm() {
    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h4 style={{ marginTop: 0 }}>{editEvent === "new" ? "Add New Event" : "Edit Event"}</h4>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Event title" />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={inputStyle} value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, minHeight: 80 }} value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Event details…" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Start Date & Time</label>
            <input type="datetime-local" style={inputStyle} value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>End Date & Time</label>
            <input type="datetime-local" style={inputStyle} value={eventForm.endDate} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Location</label>
            <input style={inputStyle} value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Event venue" />
          </div>
          <div>
            <label style={labelStyle}>Link URL</label>
            <input style={inputStyle} value={eventForm.linkUrl} onChange={(e) => setEventForm({ ...eventForm, linkUrl: e.target.value })} placeholder="https://..." />
          </div>
        </div>

        {/* Image Upload */}
        <label style={labelStyle}>Event Image</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <label style={{ ...btnStyle, background: imageUploading ? "#ccc" : "#667eea", cursor: imageUploading ? "not-allowed" : "pointer" }}>
            {imageUploading ? "Uploading…" : "📁 Upload Image"}
            <input type="file" accept="image/*" hidden disabled={imageUploading} onChange={async (e) => {
              setImageUploading(true);
              await handleUploadImage(e.target.files?.[0], (url) => setEventForm({ ...eventForm, imageUrl: url }));
              setImageUploading(false);
            }} />
          </label>
          <span style={{ color: "#666", fontSize: 13 }}>or paste URL below</span>
        </div>
        <input style={inputStyle} value={eventForm.imageUrl} onChange={(e) => setEventForm({ ...eventForm, imageUrl: e.target.value })} placeholder="Image URL" />
        {eventForm.imageUrl && <img src={eventForm.imageUrl} alt="Preview" style={{ maxWidth: 200, maxHeight: 120, borderRadius: 4, marginTop: 4, border: "1px solid #ddd" }} onError={(e) => { e.target.style.display = "none"; }} />}

        <div style={{ marginTop: 8 }}>
          <label style={labelStyle}>Image Alt Text</label>
          <input style={inputStyle} value={eventForm.imageAlt} onChange={(e) => setEventForm({ ...eventForm, imageAlt: e.target.value })} placeholder="Describe the image" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Card Colour</label>
            <select style={inputStyle} value={eventForm.color} onChange={(e) => setEventForm({ ...eventForm, color: e.target.value })}>
              {COLOR_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Display Order</label>
            <input type="number" style={inputStyle} value={eventForm.displayOrder} onChange={(e) => setEventForm({ ...eventForm, displayOrder: parseInt(e.target.value) || 0 })} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <input type="checkbox" checked={eventForm.featured} onChange={(e) => setEventForm({ ...eventForm, featured: e.target.checked })} /> Featured
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <input type="checkbox" checked={eventForm.active} onChange={(e) => setEventForm({ ...eventForm, active: e.target.checked })} /> Active
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button style={{ ...btnStyle, background: "#667eea" }} disabled={saving} onClick={saveEvent}>{saving ? "Saving…" : editEvent === "new" ? "Add Event" : "Update Event"}</button>
          <button style={{ ...btnStyle, background: "#6b7280" }} onClick={cancelEdit}>Cancel</button>
        </div>
      </div>
    );
  }

  function renderEvents() {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Events ({events.length})</h3>
          <button style={{ ...btnStyle, background: "#10b981" }} onClick={openNewEvent}>+ Add Event</button>
        </div>

        {/* Category filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          <button style={{ ...pillStyle, background: filterCategory === "all" ? "#1e293b" : "#e2e8f0", color: filterCategory === "all" ? "#fff" : "#334155" }} onClick={() => setFilterCategory("all")}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.value} style={{ ...pillStyle, background: filterCategory === c.value ? c.color : "#e2e8f0", color: filterCategory === c.value ? "#fff" : "#334155" }} onClick={() => setFilterCategory(c.value)}>{c.label}</button>
          ))}
        </div>

        {editEvent !== null && renderEventForm()}

        {filteredEvents.length === 0 && <p style={{ color: "#999", textAlign: "center", padding: 20 }}>No events{filterCategory !== "all" ? ` in "${filterCategory}"` : ""}. Add one above!</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filteredEvents.map((ev, idx) => {
            const realIdx = events.indexOf(ev);
            const catObj = CATEGORIES.find((c) => c.value === ev.category) || CATEGORIES[6];
            return (
              <div key={ev._id || idx} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", opacity: ev.active ? 1 : 0.5, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                {ev.imageUrl && (
                  <div style={{ height: 150, overflow: "hidden", background: "#f0f0f0" }}>
                    <img src={ev.imageUrl} alt={ev.imageAlt || ev.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
                  </div>
                )}
                <div style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8, marginBottom: 6 }}>
                    <h4 style={{ margin: 0, fontSize: 15 }}>{ev.title}</h4>
                    <span style={{ ...pillStyle, background: catObj.color, color: "#fff", fontSize: 11, flexShrink: 0 }}>{catObj.label}</span>
                  </div>
                  {ev.date && <p style={{ margin: "0 0 4px", fontSize: 12, color: "#666" }}>📅 {new Date(ev.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</p>}
                  {ev.location && <p style={{ margin: "0 0 4px", fontSize: 12, color: "#666" }}>📍 {ev.location}</p>}
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {ev.featured && <span style={{ fontSize: 11, background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: 4 }}>⭐ Featured</span>}
                    {!ev.active && <span style={{ fontSize: 11, background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 4 }}>Hidden</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10, borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                    <button style={{ ...smallBtn, background: "#3b82f6" }} onClick={() => openEditEvent(realIdx)}>Edit</button>
                    <button style={{ ...smallBtn, background: ev.featured ? "#f59e0b" : "#e2e8f0", color: ev.featured ? "#fff" : "#333" }} onClick={() => toggleFeatured(realIdx)}>{ev.featured ? "Unfeature" : "Feature"}</button>
                    <button style={{ ...smallBtn, background: ev.active ? "#6b7280" : "#10b981", color: "#fff" }} onClick={() => toggleActive(realIdx)}>{ev.active ? "Hide" : "Show"}</button>
                    <button style={{ ...smallBtn, background: "#ef4444" }} onClick={() => deleteEvent(realIdx)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 20 }}>Loading events…</div>;

  const tabs = [
    { key: "settings", label: "Page Settings", icon: "⚙️" },
    { key: "events", label: "Events", icon: "📅" },
  ];

  return (
    <section style={{ padding: 0 }}>
      <h2>📅 Events Management</h2>
      {error && <div style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 6, marginBottom: 14 }}>{error}</div>}
      {success && <div style={{ color: "#16a34a", background: "#f0fdf4", padding: "10px 14px", borderRadius: 6, marginBottom: 14 }}>{success}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e2e8f0", paddingBottom: 0 }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "10px 20px", border: "none", borderBottom: tab === t.key ? "3px solid #667eea" : "3px solid transparent", background: "none", cursor: "pointer", fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? "#667eea" : "#64748b", fontSize: 14 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "settings" && renderSettings()}
      {tab === "events" && renderEvents()}
    </section>
  );
}

// ─── Shared styles ────────────────────────────────────────────
const labelStyle = { display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4, marginTop: 12, color: "#374151" };
const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" };
const btnStyle = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", border: "none", borderRadius: 6, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const pillStyle = { padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 };
const smallBtn = { padding: "5px 10px", border: "none", borderRadius: 4, color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 };
