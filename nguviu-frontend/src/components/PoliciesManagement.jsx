import React, { useEffect, useState } from "react";

export default function PoliciesManagement() {
  const [content, setContent] = useState({ title: "", policiesText: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/content/policies")
      .then((res) => res.json())
      .then((data) => {
        setContent(data || { title: "", policiesText: "" });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load policies content.");
        setLoading(false);
      });
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setContent((prev) => ({ ...prev, [name]: value }));
  }

  function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");

    fetch("/api/content/policies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save policies content.");
        return res.json();
      })
      .then(() => {
        setSuccess("Policies content saved successfully.");
      })
      .catch(() => {
        setError("Failed to save policies content.");
      })
      .finally(() => setSaving(false));
  }

  if (loading) return <p>Loading policies content...</p>;

  return (
    <section>
      <h2>Policies Management</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <div>
        <label>Title</label><br />
        <input
          type="text"
          name="title"
          value={content.title}
          onChange={handleChange}
          style={{ width: "100%", padding: "8px", marginBottom: 12 }}
        />
      </div>

      <div>
        <label>Policies Text</label><br />
        <textarea
          name="policiesText"
          value={content.policiesText}
          onChange={handleChange}
          rows={10}
          style={{ width: "100%", padding: "8px" }}
        />
      </div>

      <button onClick={handleSave} disabled={saving} style={{ marginTop: 15, padding: "10px 20px" }}>
        {saving ? "Saving..." : "Save"}
      </button>
    </section>
  );
}
