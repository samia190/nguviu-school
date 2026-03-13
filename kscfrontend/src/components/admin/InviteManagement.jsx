// src/components/admin/InviteManagement.jsx
import React, { useState, useEffect } from "react";
import { get, post } from "../../utils/api";

const API_BASE = import.meta.env.VITE_API_URL || "";

const LINK_TYPES = [
  { value: "student-844", label: "Student — 8-4-4", icon: "🎓", color: "#3b82f6", desc: "Form 1–4 students (8-4-4 curriculum)" },
  { value: "student-cbc", label: "Student — CBC", icon: "📚", color: "#8b5cf6", desc: "Grade 7–12 students (CBC curriculum)" },
  { value: "teacher", label: "Teacher", icon: "👩‍🏫", color: "#059669", desc: "Teaching staff with homework access" },
  { value: "staff", label: "Staff", icon: "🏫", color: "#d97706", desc: "Non-teaching school staff" },
  { value: "parent", label: "Parent / Guardian", icon: "👨‍👩‍👧", color: "#dc2626", desc: "Parents with read-only child info access" },
];

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

function buildInviteUrl(token) {
  return `${window.location.origin}/signup?invite=${token}`;
}

export default function InviteManagement() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [showGenForm, setShowGenForm] = useState(false);
  const [genForm, setGenForm] = useState({ linkType: "student-844", label: "", maxUses: "" });

  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
    setLoading(true);
    setError("");
    try {
      const data = await get("/api/admin/invite");
      setInvites(data.invites || []);
    } catch (err) {
      setError(err.message || "Failed to load invite links");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setGenLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        linkType: genForm.linkType,
        label: genForm.label,
        maxUses: genForm.maxUses ? Number(genForm.maxUses) : null,
      };
      await post("/api/admin/invite/generate", payload);
      setSuccess("Invite link created!");
      setShowGenForm(false);
      setGenForm({ linkType: "student-844", label: "", maxUses: "" });
      await loadInvites();
    } catch (err) {
      setError(err.message || "Failed to generate invite link");
    } finally {
      setGenLoading(false);
    }
  }

  async function handleRevoke(id) {
    if (!window.confirm("Revoke this invite link? It will no longer work.")) return;
    try {
      await fetch(`${API_BASE}/api/admin/invite/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token") || ""}`,
        },
      });
      setSuccess("Invite link revoked.");
      await loadInvites();
    } catch (err) {
      setError(err.message || "Failed to revoke invite link");
    }
  }

  function handleCopy(invite) {
    copyToClipboard(buildInviteUrl(invite.token));
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const typeInfo = (linkType) => LINK_TYPES.find((t) => t.value === linkType) || {};

  const s = {
    card: { background: "#fff", borderRadius: 12, padding: "20px 24px", marginBottom: 12, border: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", gap: 16 },
    badge: (color) => ({ display: "inline-block", padding: "2px 10px", borderRadius: 20, background: color + "18", color: color, fontSize: 12, fontWeight: 700 }),
    btn: (color) => ({ padding: "6px 14px", borderRadius: 8, border: "none", background: color, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }),
    copyBtn: (copied) => ({ padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: copied ? "#dcfce7" : "#f8fafc", color: copied ? "#16a34a" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }),
    input: { padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" },
    label: { fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 },
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Invite Links</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
            Generate links for each role. Share the link — users self-register with the correct form.
          </p>
        </div>
        <button onClick={() => setShowGenForm(true)} style={s.btn("#3b82f6")}>+ New Link</button>
      </div>

      {error && <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 8, fontSize: 14 }}>{error}</p>}
      {success && <p style={{ color: "#16a34a", background: "#f0fdf4", padding: "10px 14px", borderRadius: 8, fontSize: 14 }}>{success}</p>}

      {/* Generate Form */}
      {showGenForm && (
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, marginBottom: 20, border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Create New Invite Link</h4>
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <p style={s.label}>Link Type</p>
              <select value={genForm.linkType} onChange={(e) => setGenForm({ ...genForm, linkType: e.target.value })} style={s.input}>
                {LINK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label} — {t.desc}</option>
                ))}
              </select>
            </div>
            <div>
              <p style={s.label}>Label (optional)</p>
              <input style={s.input} value={genForm.label} onChange={(e) => setGenForm({ ...genForm, label: e.target.value })}
                placeholder="e.g. Form 3 East — Parents 2025" />
            </div>
            <div>
              <p style={s.label}>Max Uses (blank = unlimited)</p>
              <input style={s.input} type="number" min="1" value={genForm.maxUses}
                onChange={(e) => setGenForm({ ...genForm, maxUses: e.target.value })}
                placeholder="Leave blank for unlimited" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={genLoading} style={s.btn("#3b82f6")}>
                {genLoading ? "Creating…" : "Create Link"}
              </button>
              <button type="button" onClick={() => setShowGenForm(false)} style={{ ...s.btn("#64748b"), background: "none", color: "#64748b", border: "1px solid #e2e8f0" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invite list */}
      {loading ? (
        <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading invite links…</p>
      ) : invites.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔗</div>
          <p style={{ fontSize: 14 }}>No invite links yet. Create one to get started.</p>
        </div>
      ) : (
        invites.map((inv) => {
          const type = typeInfo(inv.linkType);
          const url = buildInviteUrl(inv.token);
          const isCopied = copiedId === inv.id;
          const statusColor = inv.isValid ? "#16a34a" : "#dc2626";
          const statusLabel = inv.revoked ? "Revoked" : inv.expired ? "Expired" : inv.exhausted ? "Exhausted" : "Active";

          return (
            <div key={inv.id} style={{ ...s.card, opacity: inv.isValid ? 1 : 0.65 }}>
              <div style={{ fontSize: 28 }}>{type.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={s.badge(type.color || "#64748b")}>{type.label || inv.linkType}</span>
                  <span style={s.badge(statusColor)}>{statusLabel}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    Used: {inv.useCount}{inv.maxUses ? ` / ${inv.maxUses}` : ""} · Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                {inv.label && <p style={{ margin: "0 0 6px", fontSize: 13, color: "#475569" }}>{inv.label}</p>}
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f1f5f9", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#64748b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
                  <button onClick={() => handleCopy(inv)} style={s.copyBtn(isCopied)}>
                    {isCopied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                {inv.isValid && (
                  <button onClick={() => handleRevoke(inv.id)} style={{ ...s.btn("#ef4444"), fontSize: 12, padding: "4px 10px", background: "none", color: "#ef4444", border: "1px solid #fecaca" }}>
                    Revoke
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
