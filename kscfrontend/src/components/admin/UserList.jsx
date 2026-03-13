// src/components/admin/UserList.jsx
import React, { useState, useEffect } from "react";
import { get } from "../../utils/api";

const ROLES = ["", "student", "teacher", "staff", "parent", "admin"];
const ROLE_COLORS = { student: "#3b82f6", teacher: "#059669", staff: "#d97706", parent: "#dc2626", admin: "#7c3aed" };

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (search) params.set("search", search);
      const data = await get(`/api/admin/users?${params.toString()}`);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    loadUsers();
  }

  async function openProfile(user) {
    setSelectedUser(user);
    setProfile(null);
    setProfileLoading(true);
    try {
      const data = await get(`/api/admin/users/${user._id}/profile`);
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }

  const s = {
    badge: (role) => ({
      display: "inline-block", padding: "2px 10px", borderRadius: 20,
      background: (ROLE_COLORS[role] || "#64748b") + "18",
      color: ROLE_COLORS[role] || "#64748b",
      fontSize: 12, fontWeight: 700, textTransform: "capitalize"
    }),
    input: { padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" },
    btn: (color) => ({ padding: "8px 16px", borderRadius: 8, border: "none", background: color, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }),
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
    modalBox: { background: "#fff", borderRadius: 16, padding: 28, maxWidth: 480, width: "100%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Registered Users</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>View and manage all accounts by role.</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input style={{ ...s.input, flex: 1, minWidth: 180 }} value={search}
          onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" />
        <select style={s.input} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.filter(Boolean).map((r) => (
            <option key={r} value={r} style={{ textTransform: "capitalize" }}>{r}</option>
          ))}
        </select>
        <button type="submit" style={s.btn("#3b82f6")}>Search</button>
      </form>

      {error && <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 8, fontSize: 14 }}>{error}</p>}

      {/* Table */}
      {loading ? (
        <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading users…</p>
      ) : users.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
          <p style={{ fontSize: 14 }}>No users found.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Name", "Email", "Role", "Joined", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1e293b" }}>{u.name || "—"}</td>
                  <td style={{ padding: "12px 14px", color: "#64748b" }}>{u.email}</td>
                  <td style={{ padding: "12px 14px" }}><span style={s.badge(u.role)}>{u.role}</span></td>
                  <td style={{ padding: "12px 14px", color: "#94a3b8", fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button onClick={() => openProfile(u)} style={{ ...s.btn("#64748b"), padding: "5px 12px", fontSize: 12, background: "#f1f5f9", color: "#475569" }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>{users.length} user{users.length !== 1 ? "s" : ""} shown</p>
        </div>
      )}

      {/* Profile Modal */}
      {selectedUser && (
        <div style={s.modal} onClick={(e) => e.target === e.currentTarget && setSelectedUser(null)}>
          <div style={s.modalBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{selectedUser.name}</h4>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{selectedUser.email}</p>
                <span style={{ ...s.badge(selectedUser.role), marginTop: 6 }}>{selectedUser.role}</span>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>

            {profileLoading ? (
              <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading profile…</p>
            ) : profile?.profile ? (
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>Profile Details</p>
                {Object.entries(profile.profile).filter(([k]) => !["_id", "__v", "user", "linkedStudents"].includes(k)).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 140, textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</span>
                    <span style={{ fontSize: 13, color: "#1e293b", wordBreak: "break-all" }}>{Array.isArray(v) ? (v.length ? v.join(", ") : "—") : (v?.toString() || "—")}</span>
                  </div>
                ))}
                {profile.profile.linkedStudents?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>Linked Students</p>
                    {profile.profile.linkedStudents.map((st) => (
                      <p key={st._id} style={{ margin: "4px 0", fontSize: 13, color: "#1e293b" }}>{st.name} — {st.email}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: "#94a3b8", fontSize: 13 }}>No extended profile found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
