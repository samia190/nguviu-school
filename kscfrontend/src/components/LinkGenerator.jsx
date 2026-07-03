// components/LinkGenerator.jsx
import React, { useState, useEffect } from "react";
import { Copy, Trash2, Eye, AlertCircle } from "lucide-react";

export default function LinkGenerator({ user, setRoute }) {
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState({
    originalUrl: "",
    title: "",
    description: "",
    password: "",
    expiresAt: "",
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/links", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch links");
      const data = await response.json();
      setLinks(data.links || []);
    } catch (err) {
      console.error("Error fetching links:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    if (!newLink.originalUrl) {
      setError("URL is required");
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newLink),
      });

      if (!response.ok) throw new Error("Failed to create link");
      const data = await response.json();
      setLinks([data.link, ...links]);
      setNewLink({ originalUrl: "", title: "", description: "", password: "", expiresAt: "" });
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!confirm("Delete this link?")) return;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`/api/links/${linkId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete link");
      setLinks(links.filter((l) => l._id !== linkId));
    } catch (err) {
      setError(err.message);
    }
  };

  const copyToClipboard = (shortCode) => {
    const url = `${window.location.origin}/s/${shortCode}`;
    navigator.clipboard.writeText(url);
    alert("Copied to clipboard!");
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 20px" }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>🔗 Link Generator</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>Create and manage short links with analytics.</p>

      {error && (
        <div style={{ background: "#fee", padding: "15px", borderRadius: "6px", marginBottom: "20px", display: "flex", gap: "10px" }}>
          <AlertCircle size={20} style={{ color: "#c00" }} />
          {error}
        </div>
      )}

      {/* Create Link Form */}
      <div style={{
        background: "#f9f9f9",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "30px",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>Create New Link</h2>
        <form onSubmit={handleCreateLink} style={{ display: "grid", gap: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              URL *
            </label>
            <input
              type="url"
              value={newLink.originalUrl}
              onChange={(e) => setNewLink({ ...newLink, originalUrl: e.target.value })}
              placeholder="https://example.com"
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Title</label>
              <input
                type="text"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                placeholder="Link title"
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Password (optional)</label>
              <input
                type="password"
                value={newLink.password}
                onChange={(e) => setNewLink({ ...newLink, password: e.target.value })}
                placeholder="Protect with password"
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Description</label>
            <textarea
              value={newLink.description}
              onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
              placeholder="Link description"
              style={{ width: "100%", minHeight: "100px", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            style={{
              padding: "12px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: creating ? "not-allowed" : "pointer",
              fontWeight: "bold",
              opacity: creating ? 0.7 : 1,
            }}
          >
            {creating ? "Creating..." : "Create Link"}
          </button>
        </form>
      </div>

      {/* Links List */}
      <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>Your Links</h2>
      {links.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
          No links yet. Create one above!
        </div>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {links.map((link) => (
            <div key={link._id} style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: "bold", marginBottom: "5px" }}>{link.title || link.shortCode}</h3>
                <p style={{ fontSize: "12px", color: "#666" }}>
                  Clicks: {link.accessCount} | Created: {new Date(link.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => copyToClipboard(link.shortCode)}
                  style={{
                    padding: "8px 12px",
                    background: "#17a2b8",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Copy size={16} /> Copy
                </button>

                <button
                  onClick={() => setRoute(`links/analytics?id=${link._id}`)}
                  style={{
                    padding: "8px 12px",
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Eye size={16} /> Analytics
                </button>

                <button
                  onClick={() => handleDeleteLink(link._id)}
                  style={{
                    padding: "8px 12px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
