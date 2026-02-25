// ChatManagement.jsx — Admin panel for chat system (settings, knowledge tree, messages)
import { useState, useEffect, useCallback } from "react";
import { get, post, put, del } from "../utils/api";

/* ═══════════════════════════════════════════════════════════════
   Tabs: Settings | Knowledge Tree | Messages
   ═══════════════════════════════════════════════════════════════ */
const TABS = [
  { key: "settings", label: "⚙️ Settings", desc: "General chat settings" },
  { key: "tree", label: "🌳 Knowledge Tree", desc: "Categories & answers" },
  { key: "messages", label: "📬 Messages", desc: "Visitor messages" },
];

export default function ChatManagement() {
  const [tab, setTab] = useState("settings");
  const [config, setConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgStats, setMsgStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [msgPage, setMsgPage] = useState(1);
  const [msgTotal, setMsgTotal] = useState(0);
  const [msgFilter, setMsgFilter] = useState("all");

  // ─── Load config
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await get("/api/chat/admin");
      setConfig(data);
    } catch (err) {
      setError("Failed to load chat config");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Load messages
  const loadMessages = useCallback(async () => {
    try {
      const data = await get(`/api/chat/messages?page=${msgPage}&limit=20&status=${msgFilter}`);
      setMessages(data.messages || []);
      setMsgTotal(data.total || 0);
    } catch {}
  }, [msgPage, msgFilter]);

  // ─── Load stats
  const loadStats = useCallback(async () => {
    try {
      const data = await get("/api/chat/messages/stats");
      setMsgStats(data);
    } catch {}
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);
  useEffect(() => { if (tab === "messages") { loadMessages(); loadStats(); } }, [tab, loadMessages, loadStats]);

  // ─── Flash helpers
  function flash(msg) { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }
  function flashErr(msg) { setError(msg); setTimeout(() => setError(""), 4000); }

  // ─── Save config
  async function saveConfig(updates) {
    setSaving(true);
    try {
      const data = await put("/api/chat", updates || config);
      setConfig(data);
      flash("Settings saved!");
    } catch {
      flashErr("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // ─── Reset defaults
  async function resetDefaults() {
    if (!window.confirm("Reset all chat settings to defaults? This cannot be undone.")) return;
    setSaving(true);
    try {
      const data = await post("/api/chat/reset-defaults");
      setConfig(data);
      flash("Reset to defaults!");
    } catch {
      flashErr("Reset failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading chat settings...</div>;
  if (!config) return <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>Failed to load config</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 4 }}>💬 Chat System Management</h2>
      <p style={{ color: "#6b7280", marginTop: 0, marginBottom: 16, fontSize: 14 }}>
        Manage the school chatbot, knowledge base, and visitor messages
      </p>

      {/* Success / Error banners */}
      {success && <div style={bannerStyle("#dcfce7", "#166534")}>{success}</div>}
      {error && <div style={bannerStyle("#fef2f2", "#991b1b")}>{error}</div>}

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e5e7eb", paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom: tab === t.key ? "3px solid #1e40af" : "3px solid transparent",
              background: tab === t.key ? "#eff6ff" : "transparent",
              color: tab === t.key ? "#1e40af" : "#6b7280",
              fontWeight: tab === t.key ? 700 : 500,
              cursor: "pointer",
              fontSize: 14,
              borderRadius: "8px 8px 0 0",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "settings" && (
        <SettingsTab config={config} setConfig={setConfig} saveConfig={saveConfig} saving={saving} resetDefaults={resetDefaults} />
      )}
      {tab === "tree" && (
        <KnowledgeTreeTab config={config} setConfig={setConfig} saveConfig={saveConfig} saving={saving} />
      )}
      {tab === "messages" && (
        <MessagesTab
          messages={messages}
          total={msgTotal}
          page={msgPage}
          setPage={setMsgPage}
          filter={msgFilter}
          setFilter={setMsgFilter}
          stats={msgStats}
          loadMessages={loadMessages}
          loadStats={loadStats}
          flash={flash}
          flashErr={flashErr}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS TAB
   ═══════════════════════════════════════════════════════════════ */
function SettingsTab({ config, setConfig, saveConfig, saving, resetDefaults }) {
  const update = (key, val) => setConfig((prev) => ({ ...prev, [key]: val }));
  const updateOffice = (key, val) => setConfig((prev) => ({
    ...prev,
    officeHours: { ...prev.officeHours, [key]: val },
  }));

  return (
    <div>
      {/* General */}
      <SectionCard title="General Settings" icon="⚙️">
        <Field label="Bot Name" help="Display name in the chat header">
          <input type="text" value={config.botName || ""} onChange={(e) => update("botName", e.target.value)} style={inputStyle} maxLength={50} />
        </Field>
        <Field label="Greeting Message" help="First message shown to users">
          <textarea value={config.greeting || ""} onChange={(e) => update("greeting", e.target.value)} style={{ ...inputStyle, minHeight: 60 }} maxLength={500} />
        </Field>
        <Field label="No-Match Reply" help="Shown when user input doesn&#39;t match any keywords">
          <textarea value={config.noMatchReply || ""} onChange={(e) => update("noMatchReply", e.target.value)} style={{ ...inputStyle, minHeight: 60 }} maxLength={500} />
        </Field>
        <Field label="Thank You Reply" help="Shown when user says thanks">
          <input type="text" value={config.thankYouReply || ""} onChange={(e) => update("thankYouReply", e.target.value)} style={inputStyle} maxLength={300} />
        </Field>
      </SectionCard>

      {/* Office Hours */}
      <SectionCard title="Office Hours" icon="🕐">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Start Time">
            <input type="time" value={config.officeHours?.start || "08:00"} onChange={(e) => updateOffice("start", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="End Time">
            <input type="time" value={config.officeHours?.end || "17:00"} onChange={(e) => updateOffice("end", e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <Field label="Office Days" help="Select which days the office is open">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
              const days = config.officeHours?.days || [1, 2, 3, 4, 5];
              const isOn = days.includes(i + 1);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const next = isOn ? days.filter((d) => d !== i + 1) : [...days, i + 1].sort();
                    updateOffice("days", next);
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 16,
                    border: isOn ? "2px solid #1e40af" : "1px solid #d1d5db",
                    background: isOn ? "#dbeafe" : "#f9fafb",
                    color: isOn ? "#1e40af" : "#6b7280",
                    fontWeight: isOn ? 600 : 400,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Closed Message" help="Shown when someone messages outside office hours">
          <textarea value={config.closedMessage || ""} onChange={(e) => update("closedMessage", e.target.value)} style={{ ...inputStyle, minHeight: 60 }} maxLength={500} />
        </Field>
        <Field label="Timezone">
          <input type="text" value={config.officeHours?.timezone || "Africa/Nairobi"} onChange={(e) => updateOffice("timezone", e.target.value)} style={inputStyle} maxLength={50} />
        </Field>
      </SectionCard>

      {/* Contact & WhatsApp */}
      <SectionCard title="Contact & WhatsApp" icon="📱">
        <Field label="WhatsApp Number" help="Optional. Shown as escalation option (e.g. 0796214804 or +254796214804)">
          <input type="text" value={config.whatsappNumber || ""} onChange={(e) => update("whatsappNumber", e.target.value)} style={inputStyle} maxLength={20} />
        </Field>
      </SectionCard>

      {/* Appearance */}
      <SectionCard title="Appearance & Behavior" icon="🎨">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Enabled">
            <Toggle value={config.enabled !== false} onChange={(v) => update("enabled", v)} />
          </Field>
          <Field label="Show on Mobile">
            <Toggle value={config.showOnMobile !== false} onChange={(v) => update("showOnMobile", v)} />
          </Field>
          <Field label="Primary Color">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="color" value={config.primaryColor || "#1e40af"} onChange={(e) => update("primaryColor", e.target.value)} style={{ width: 40, height: 34, border: "none", cursor: "pointer" }} />
              <input type="text" value={config.primaryColor || "#1e40af"} onChange={(e) => update("primaryColor", e.target.value)} style={{ ...inputStyle, width: 100 }} maxLength={7} />
            </div>
          </Field>
          <Field label="Position">
            <select value={config.position || "bottom-right"} onChange={(e) => update("position", e.target.value)} style={inputStyle}>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </Field>
        </div>
      </SectionCard>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <button onClick={() => saveConfig()} disabled={saving} style={btnPrimary}>
          {saving ? "Saving..." : "💾 Save Settings"}
        </button>
        <button onClick={resetDefaults} disabled={saving} style={btnDanger}>
          🔄 Reset to Defaults
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KNOWLEDGE TREE TAB
   ═══════════════════════════════════════════════════════════════ */
function KnowledgeTreeTab({ config, setConfig, saveConfig, saving }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const cats = config.categories || [];

  function updateCategory(idx, key, val) {
    setConfig((prev) => {
      const next = { ...prev, categories: [...prev.categories] };
      next.categories[idx] = { ...next.categories[idx], [key]: val };
      return next;
    });
  }

  function addCategory() {
    const id = `cat-${Date.now()}`;
    setConfig((prev) => ({
      ...prev,
      categories: [
        ...(prev.categories || []),
        {
          id,
          icon: "📌",
          label: "New Category",
          keywords: [],
          reply: "",
          children: [],
          actions: [],
          sortOrder: (prev.categories || []).length,
        },
      ],
    }));
    setEditingIdx(cats.length);
  }

  function removeCategory(idx) {
    if (!window.confirm(`Delete "${cats[idx].label}"?`)) return;
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== idx),
    }));
    setEditingIdx(null);
  }

  function moveCategory(idx, dir) {
    const next = [...cats];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setConfig((prev) => ({ ...prev, categories: next }));
    setEditingIdx(target);
  }

  // ─── Children management for a category
  function addChild(catIdx) {
    const child = {
      id: `child-${Date.now()}`,
      icon: "▸",
      label: "New Item",
      keywords: [],
      reply: "",
      actions: [],
    };
    setConfig((prev) => {
      const next = { ...prev, categories: [...prev.categories] };
      next.categories[catIdx] = {
        ...next.categories[catIdx],
        children: [...(next.categories[catIdx].children || []), child],
      };
      return next;
    });
  }

  function updateChild(catIdx, childIdx, key, val) {
    setConfig((prev) => {
      const next = { ...prev, categories: [...prev.categories] };
      const children = [...(next.categories[catIdx].children || [])];
      children[childIdx] = { ...children[childIdx], [key]: val };
      next.categories[catIdx] = { ...next.categories[catIdx], children };
      return next;
    });
  }

  function removeChild(catIdx, childIdx) {
    setConfig((prev) => {
      const next = { ...prev, categories: [...prev.categories] };
      next.categories[catIdx] = {
        ...next.categories[catIdx],
        children: next.categories[catIdx].children.filter((_, i) => i !== childIdx),
      };
      return next;
    });
  }

  return (
    <div>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>
        Each category appears as a quick-reply button in the chat. Categories can have child items for sub-topics.
        Keywords are used for free-text matching when users type questions.
      </p>

      {cats.map((cat, idx) => (
        <div key={cat.id || idx} style={{
          border: editingIdx === idx ? "2px solid #3b82f6" : "1px solid #e5e7eb",
          borderRadius: 12,
          marginBottom: 12,
          background: "#fff",
          overflow: "hidden",
        }}>
          {/* Category header */}
          <div
            onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              cursor: "pointer",
              background: editingIdx === idx ? "#eff6ff" : "#f9fafb",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{cat.icon}</span>
              <span style={{ fontWeight: 600 }}>{cat.label}</span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                {(cat.keywords || []).length} keywords · {(cat.children || []).length} sub-items
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={(e) => { e.stopPropagation(); moveCategory(idx, -1); }} style={iconBtn} title="Move up" disabled={idx === 0}>↑</button>
              <button onClick={(e) => { e.stopPropagation(); moveCategory(idx, 1); }} style={iconBtn} title="Move down" disabled={idx === cats.length - 1}>↓</button>
              <button onClick={(e) => { e.stopPropagation(); removeCategory(idx); }} style={{ ...iconBtn, color: "#ef4444" }} title="Delete">✕</button>
            </div>
          </div>

          {/* Expanded editor */}
          {editingIdx === idx && (
            <div style={{ padding: 16, borderTop: "1px solid #e5e7eb" }}>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 12 }}>
                <Field label="Icon">
                  <input type="text" value={cat.icon} onChange={(e) => updateCategory(idx, "icon", e.target.value)} style={{ ...inputStyle, textAlign: "center", fontSize: 20 }} maxLength={4} />
                </Field>
                <Field label="Label">
                  <input type="text" value={cat.label} onChange={(e) => updateCategory(idx, "label", e.target.value)} style={inputStyle} maxLength={100} />
                </Field>
              </div>

              <Field label="Category ID" help="Unique identifier (used in API)">
                <input type="text" value={cat.id} onChange={(e) => updateCategory(idx, "id", e.target.value)} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 13 }} maxLength={50} />
              </Field>

              <Field label="Keywords" help="Comma-separated. Used for free-text matching. e.g.: admission, apply, enroll, join">
                <input
                  type="text"
                  value={(cat.keywords || []).join(", ")}
                  onChange={(e) => updateCategory(idx, "keywords", e.target.value.split(",").map((k) => k.trim()).filter(Boolean))}
                  style={inputStyle}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </Field>

              <Field label="Static Reply" help="Text shown to the user. Leave empty if using live data source.">
                <textarea
                  value={cat.reply || ""}
                  onChange={(e) => updateCategory(idx, "reply", e.target.value)}
                  style={{ ...inputStyle, minHeight: 80 }}
                  maxLength={2000}
                  placeholder="This text is shown when the user taps this category..."
                />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Data Source" help="Live data model name, e.g. admissions-page">
                  <input type="text" value={cat.dataSource || ""} onChange={(e) => updateCategory(idx, "dataSource", e.target.value)} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 13 }} maxLength={50} />
                </Field>
                <Field label="Data Field" help="Field to pull from the model, e.g. overview">
                  <input type="text" value={cat.dataField || ""} onChange={(e) => updateCategory(idx, "dataField", e.target.value)} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 13 }} maxLength={50} />
                </Field>
              </div>

              {/* Children */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 14 }}>📂 Sub-Items ({(cat.children || []).length})</h4>
                  <button onClick={() => addChild(idx)} style={btnSmall}>+ Add Sub-Item</button>
                </div>

                {(cat.children || []).map((child, ci) => (
                  <div key={child.id || ci} style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    background: "#fafbfc",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "50px 1fr", gap: 8, flex: 1 }}>
                        <input type="text" value={child.icon || "▸"} onChange={(e) => updateChild(idx, ci, "icon", e.target.value)} style={{ ...inputStyle, textAlign: "center", fontSize: 16 }} maxLength={4} />
                        <input type="text" value={child.label} onChange={(e) => updateChild(idx, ci, "label", e.target.value)} style={inputStyle} maxLength={100} />
                      </div>
                      <button onClick={() => removeChild(idx, ci)} style={{ ...iconBtn, color: "#ef4444", marginLeft: 8 }}>✕</button>
                    </div>
                    <Field label="Keywords" help="Comma-separated">
                      <input
                        type="text"
                        value={(child.keywords || []).join(", ")}
                        onChange={(e) => updateChild(idx, ci, "keywords", e.target.value.split(",").map((k) => k.trim()).filter(Boolean))}
                        style={inputStyle}
                        placeholder="keyword1, keyword2"
                      />
                    </Field>
                    <Field label="Reply">
                      <textarea
                        value={child.reply || ""}
                        onChange={(e) => updateChild(idx, ci, "reply", e.target.value)}
                        style={{ ...inputStyle, minHeight: 60 }}
                        maxLength={2000}
                      />
                    </Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <Field label="Data Source">
                        <input type="text" value={child.dataSource || ""} onChange={(e) => updateChild(idx, ci, "dataSource", e.target.value)} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }} maxLength={50} />
                      </Field>
                      <Field label="Data Field">
                        <input type="text" value={child.dataField || ""} onChange={(e) => updateChild(idx, ci, "dataField", e.target.value)} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }} maxLength={50} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add category button */}
      <button onClick={addCategory} style={{ ...btnPrimary, width: "100%", marginTop: 8 }}>
        ➕ Add New Category
      </button>

      {/* Save */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={() => saveConfig()} disabled={saving} style={btnPrimary}>
          {saving ? "Saving..." : "💾 Save Knowledge Tree"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGES TAB
   ═══════════════════════════════════════════════════════════════ */
function MessagesTab({ messages, total, page, setPage, filter, setFilter, stats, loadMessages, loadStats, flash, flashErr }) {
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const totalPages = Math.ceil(total / 20) || 1;

  async function updateMessage(id, updates) {
    setActionLoading(true);
    try {
      await put(`/api/chat/messages/${id}`, updates);
      flash("Message updated");
      loadMessages();
      loadStats();
    } catch {
      flashErr("Failed to update message");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteMessage(id) {
    if (!window.confirm("Delete this message permanently?")) return;
    setActionLoading(true);
    try {
      await del(`/api/chat/messages/${id}`);
      flash("Message deleted");
      loadMessages();
      loadStats();
    } catch {
      flashErr("Failed to delete");
    } finally {
      setActionLoading(false);
    }
  }

  async function sendReply(id) {
    if (!replyText.trim()) return;
    await updateMessage(id, { status: "replied", adminReply: replyText.trim() });
    setReplyingId(null);
    setReplyText("");
  }

  return (
    <div>
      {/* Stats cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 20 }}>
          {[
            { label: "New", count: stats.new || 0, color: "#3b82f6" },
            { label: "Read", count: stats.read || 0, color: "#f59e0b" },
            { label: "Replied", count: stats.replied || 0, color: "#10b981" },
            { label: "Archived", count: stats.archived || 0, color: "#6b7280" },
            { label: "Total", count: stats.total || 0, color: "#1f2937" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "12px 16px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "new", "read", "replied", "archived"].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            style={{
              padding: "6px 14px",
              borderRadius: 16,
              border: filter === f ? "2px solid #1e40af" : "1px solid #d1d5db",
              background: filter === f ? "#dbeafe" : "#fff",
              color: filter === f ? "#1e40af" : "#374151",
              fontWeight: filter === f ? 600 : 400,
              cursor: "pointer",
              fontSize: 13,
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Messages list */}
      {messages.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
          No messages {filter !== "all" ? `with status "${filter}"` : "yet"}
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg._id} style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 14,
            marginBottom: 10,
            background: msg.status === "new" ? "#fefce8" : "#fff",
            borderLeft: `4px solid ${statusColors[msg.status] || "#d1d5db"}`,
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <strong style={{ fontSize: 15 }}>{msg.name || "Anonymous"}</strong>
                <span style={{ ...statusBadge, background: `${statusColors[msg.status]}20`, color: statusColors[msg.status] }}>
                  {msg.status}
                </span>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  {msg.contact} · {msg.refNumber} · {msg.topic || "general"}
                  {msg.wasOfficeHours === false && <span style={{ color: "#ef4444" }}> · After hours</span>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                {new Date(msg.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            {/* Message body */}
            <div style={{ background: "#f9fafb", padding: 10, borderRadius: 8, fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>
              {msg.message}
            </div>

            {/* Admin reply (if exists) */}
            {msg.adminReply && (
              <div style={{ background: "#eff6ff", padding: 10, borderRadius: 8, fontSize: 14, marginBottom: 8, borderLeft: "3px solid #3b82f6" }}>
                <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600, marginBottom: 4 }}>
                  Admin Reply · {msg.repliedAt ? new Date(msg.repliedAt).toLocaleDateString("en-GB") : ""}
                </div>
                {msg.adminReply}
              </div>
            )}

            {/* Reply form */}
            {replyingId === msg._id && (
              <div style={{ marginBottom: 8 }}>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  style={{ ...inputStyle, minHeight: 60, marginBottom: 6 }}
                  maxLength={2000}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => sendReply(msg._id)} disabled={actionLoading || !replyText.trim()} style={btnSmall}>
                    📨 Send Reply
                  </button>
                  <button onClick={() => { setReplyingId(null); setReplyText(""); }} style={{ ...btnSmall, background: "#f3f4f6", color: "#374151" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {msg.status === "new" && (
                <button onClick={() => updateMessage(msg._id, { status: "read" })} disabled={actionLoading} style={{ ...btnSmall, background: "#fef3c7", color: "#92400e" }}>
                  👁️ Mark Read
                </button>
              )}
              {replyingId !== msg._id && (
                <button onClick={() => { setReplyingId(msg._id); setReplyText(msg.adminReply || ""); }} style={btnSmall}>
                  💬 Reply
                </button>
              )}
              {msg.status !== "archived" && (
                <button onClick={() => updateMessage(msg._id, { status: "archived" })} disabled={actionLoading} style={{ ...btnSmall, background: "#f3f4f6", color: "#6b7280" }}>
                  📦 Archive
                </button>
              )}
              <button onClick={() => deleteMessage(msg._id)} disabled={actionLoading} style={{ ...btnSmall, background: "#fef2f2", color: "#991b1b" }}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={btnSmall}>
            ← Prev
          </button>
          <span style={{ padding: "6px 12px", fontSize: 14, color: "#6b7280" }}>
            Page {page} of {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={btnSmall}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Shared UI helpers
   ═══════════════════════════════════════════════════════════════ */
function SectionCard({ title, icon, children }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16, background: "#fff" }}>
      <h3 style={{ margin: "0 0 14px 0", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
        {label}
      </label>
      {children}
      {help && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{help}</div>}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: 48,
        height: 26,
        borderRadius: 13,
        border: "none",
        background: value ? "#22c55e" : "#d1d5db",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute",
        top: 3,
        left: value ? 24 : 3,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "#fff",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

/* ─── Shared styles ─────────────────────────────────────────── */
const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const btnPrimary = {
  padding: "10px 20px",
  background: "#1e40af",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
};

const btnDanger = {
  padding: "10px 20px",
  background: "#fef2f2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
};

const btnSmall = {
  padding: "5px 12px",
  background: "#eff6ff",
  color: "#1e40af",
  border: "1px solid #bfdbfe",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500,
};

const iconBtn = {
  width: 28,
  height: 28,
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const statusColors = {
  new: "#3b82f6",
  read: "#f59e0b",
  replied: "#10b981",
  archived: "#6b7280",
};

const statusBadge = {
  marginLeft: 8,
  padding: "2px 8px",
  borderRadius: 10,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
};

function bannerStyle(bg, color) {
  return {
    padding: "10px 14px",
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 14,
    fontWeight: 500,
    background: bg,
    color,
  };
}
