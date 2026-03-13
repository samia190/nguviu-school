// src/components/admin/DirectAccountCreate.jsx
import React, { useState } from "react";
import { post, get } from "../../utils/api";

const CREATABLE_ROLES = [
  { value: "teacher", label: "Teacher", icon: "👩‍🏫" },
  { value: "staff", label: "Staff", icon: "🏫" },
  { value: "parent", label: "Parent / Guardian", icon: "👨‍👩‍👧" },
];

const EMPTY_FORM = { name: "", email: "", password: "", role: "teacher", staffId: "", department: "", subjects: "", qualifications: "", position: "", phone: "", occupation: "", providedAdmissionNumbers: "" };

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</label>
      {children}
    </div>
  );
}

const INPUT_STYLE = { padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" };

export default function DirectAccountCreate() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Link-student section
  const [linkUserId, setLinkUserId] = useState("");
  const [linkAdmission, setLinkAdmission] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name || !form.email || !form.password) {
      setError("Name, email, and password are required.");
      return;
    }
    setLoading(true);
    try {
      const body = { name: form.name, email: form.email, password: form.password, role: form.role, phone: form.phone || undefined };
      if (form.role === "teacher") {
        Object.assign(body, {
          staffId: form.staffId || undefined,
          department: form.department || undefined,
          subjects: form.subjects ? form.subjects.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
          qualifications: form.qualifications || undefined,
        });
      } else if (form.role === "staff") {
        Object.assign(body, {
          staffId: form.staffId || undefined,
          position: form.position || undefined,
          department: form.department || undefined,
        });
      } else if (form.role === "parent") {
        Object.assign(body, {
          occupation: form.occupation || undefined,
          providedAdmissionNumbers: form.providedAdmissionNumbers
            ? form.providedAdmissionNumbers.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
        });
      }
      await post("/api/admin/users/create", body);
      setSuccess(`Account for ${form.email} created successfully.`);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  async function searchUsers(e) {
    e.preventDefault();
    if (!userSearch.trim()) return;
    setUserSearchLoading(true);
    try {
      const data = await get(`/api/admin/users?role=parent&search=${encodeURIComponent(userSearch)}`);
      setUserResults(data.users || []);
    } catch {
      setUserResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  }

  async function handleLink(e) {
    e.preventDefault();
    setLinkError("");
    setLinkSuccess("");
    if (!linkUserId || !linkAdmission.trim()) {
      setLinkError("Select a parent and enter an admission number.");
      return;
    }
    setLinkLoading(true);
    try {
      await post(`/api/admin/users/${linkUserId}/link-student`, { admissionNumber: linkAdmission.trim() });
      setLinkSuccess("Student linked to parent successfully.");
      setLinkAdmission("");
    } catch (err) {
      setLinkError(err.message || "Failed to link student");
    } finally {
      setLinkLoading(false);
    }
  }

  const s = {
    section: { background: "#fff", borderRadius: 12, padding: "24px", border: "1px solid #e2e8f0", marginBottom: 20 },
    btn: (color) => ({ padding: "10px 20px", borderRadius: 8, border: "none", background: color, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }),
  };

  const r = form.role;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Create Account Directly</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Create teacher, staff, or parent accounts without an invite link.</p>
      </div>

      {/* Create form */}
      <div style={s.section}>
        <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>New Account</h4>
        {error && <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 14 }}>{error}</p>}
        {success && <p style={{ color: "#16a34a", background: "#f0fdf4", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 14 }}>{success}</p>}
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Role selector */}
          <Field label="Account Type">
            <div style={{ display: "flex", gap: 8 }}>
              {CREATABLE_ROLES.map((ro) => (
                <button key={ro.value} type="button"
                  onClick={() => setForm((f) => ({ ...f, role: ro.value }))}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: form.role === ro.value ? "2px solid #3b82f6" : "1px solid #e2e8f0", background: form.role === ro.value ? "#eff6ff" : "#f8fafc", fontSize: 13, fontWeight: 600, cursor: "pointer", color: form.role === ro.value ? "#1d4ed8" : "#475569" }}>
                  {ro.icon} {ro.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Common fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Full Name *"><input style={INPUT_STYLE} value={form.name} onChange={set("name")} placeholder="Full name" /></Field>
            <Field label="Email *"><input style={INPUT_STYLE} type="email" value={form.email} onChange={set("email")} placeholder="Email address" /></Field>
            <Field label="Password *"><input style={INPUT_STYLE} type="password" value={form.password} onChange={set("password")} placeholder="Temporary password" /></Field>
            <Field label="Phone"><input style={INPUT_STYLE} value={form.phone} onChange={set("phone")} placeholder="+254…" /></Field>
          </div>

          {/* Teacher-specific */}
          {r === "teacher" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Staff ID"><input style={INPUT_STYLE} value={form.staffId} onChange={set("staffId")} placeholder="e.g. TSC-001" /></Field>
              <Field label="Department"><input style={INPUT_STYLE} value={form.department} onChange={set("department")} placeholder="e.g. Sciences" /></Field>
              <Field label="Subjects (comma-separated)"><input style={INPUT_STYLE} value={form.subjects} onChange={set("subjects")} placeholder="e.g. Math, Physics" /></Field>
              <Field label="Qualifications"><input style={INPUT_STYLE} value={form.qualifications} onChange={set("qualifications")} placeholder="e.g. B.Ed, M.Sc" /></Field>
            </div>
          )}

          {/* Staff-specific */}
          {r === "staff" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Staff ID"><input style={INPUT_STYLE} value={form.staffId} onChange={set("staffId")} placeholder="e.g. STF-001" /></Field>
              <Field label="Position"><input style={INPUT_STYLE} value={form.position} onChange={set("position")} placeholder="e.g. Secretary" /></Field>
              <Field label="Department"><input style={INPUT_STYLE} value={form.department} onChange={set("department")} placeholder="e.g. Administration" /></Field>
            </div>
          )}

          {/* Parent-specific */}
          {r === "parent" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Occupation"><input style={INPUT_STYLE} value={form.occupation} onChange={set("occupation")} placeholder="e.g. Nurse" /></Field>
              <Field label="Child Admission No(s) (comma-separated)"><input style={INPUT_STYLE} value={form.providedAdmissionNumbers} onChange={set("providedAdmissionNumbers")} placeholder="e.g. 2023001, 2023002" /></Field>
            </div>
          )}

          <div>
            <button type="submit" disabled={loading} style={s.btn("#3b82f6")}>{loading ? "Creating…" : "Create Account"}</button>
          </div>
        </form>
      </div>

      {/* Link parent to student */}
      <div style={s.section}>
        <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Link Parent to Student</h4>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#94a3b8" }}>Find a parent account and link them to a student by admission number.</p>

        {linkError && <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 14 }}>{linkError}</p>}
        {linkSuccess && <p style={{ color: "#16a34a", background: "#f0fdf4", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 14 }}>{linkSuccess}</p>}

        {/* Step 1: Find parent */}
        <form onSubmit={searchUsers} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <input style={{ ...INPUT_STYLE, flex: 1 }} value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search parent by name or email…" />
          <button type="submit" style={s.btn("#3b82f6")}>{userSearchLoading ? "…" : "Search"}</button>
        </form>

        {userResults.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {userResults.map((u) => (
              <div key={u._id}
                onClick={() => { setLinkUserId(u._id); setUserResults([]); setUserSearch(u.name + " — " + u.email); }}
                style={{ padding: "10px 14px", borderRadius: 8, border: linkUserId === u._id ? "2px solid #3b82f6" : "1px solid #e2e8f0", background: linkUserId === u._id ? "#eff6ff" : "#f8fafc", cursor: "pointer", marginBottom: 4, fontSize: 13 }}>
                <strong>{u.name}</strong> — {u.email}
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Enter admission number */}
        <form onSubmit={handleLink} style={{ display: "flex", gap: 10 }}>
          <input style={{ ...INPUT_STYLE, flex: 1 }} value={linkAdmission} onChange={(e) => setLinkAdmission(e.target.value)} placeholder="Student admission number" disabled={!linkUserId} />
          <button type="submit" disabled={linkLoading || !linkUserId} style={s.btn(linkUserId ? "#059669" : "#94a3b8")}>
            {linkLoading ? "Linking…" : "Link Student"}
          </button>
        </form>
        {!linkUserId && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>Search and select a parent above first.</p>}
      </div>
    </div>
  );
}
