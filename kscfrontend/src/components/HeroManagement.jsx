import React, { useEffect, useState } from "react";
import { get, post, put, del } from "../utils/api";
import Loader from "./Loader";

export default function HeroManagement() {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    page: "about",
    type: "image",
    displayOrder: 0
  });

  useEffect(() => {
    fetchHeroes();
  }, []);

  async function fetchHeroes() {
    setLoading(true);
    try {
      const data = await get("/api/hero-content");
      setHeroes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching hero content:", err);
      setError("Failed to load hero content");
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleMediaChange(e) {
    setMediaFile(e.target.files[0] || null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!mediaFile && !editingId) {
      setError("Media file is required");
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        formData.append(key, form[key]);
      });
      if (mediaFile) {
        formData.append("media", mediaFile);
      }

      if (editingId) {
        await put(`/api/hero-content/${editingId}`, formData);
        setSuccess("Hero content updated!");
      } else {
        await post("/api/hero-content", formData);
        setSuccess("Hero content added!");
      }

      setForm({ title: "", description: "", page: "about", type: "image", displayOrder: 0 });
      setMediaFile(null);
      setShowForm(false);
      setEditingId(null);
      fetchHeroes();
    } catch (err) {
      setError(err.message || "Failed to save hero content");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(hero) {
    setEditingId(hero._id);
    setForm({
      title: hero.title || "",
      description: hero.description || "",
      page: hero.page,
      type: hero.type,
      displayOrder: hero.displayOrder || 0
    });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this hero content?")) return;
    try {
      await del(`/api/hero-content/${id}`);
      setSuccess("Hero content deleted!");
      fetchHeroes();
    } catch (err) {
      setError("Failed to delete");
    }
  }

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>🎨 Hero Content Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "12px 24px",
            background: showForm ? "#dc3545" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          {showForm ? "✖ Cancel" : "➕ Add Hero"}
        </button>
      </div>

      {error && <div style={{ background: "#fee", padding: "15px", borderRadius: "6px", marginBottom: "20px", color: "#c33" }}>{error}</div>}
      {success && <div style={{ background: "#efe", padding: "15px", borderRadius: "6px", marginBottom: "20px", color: "#3c3" }}>{success}</div>}

      {showForm && (
        <div style={{ background: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "20px", marginBottom: "30px" }}>
          <h3>{editingId ? "Edit Hero Content" : "Add Hero Content"}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label>Page *</label>
                <select
                  name="page"
                  value={form.page}
                  onChange={handleFormChange}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <option value="home">Home</option>
                  <option value="about">About</option>
                </select>
              </div>

              <div>
                <label>Type *</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="slide">Slide</option>
                </select>
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows="3"
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>

              <div>
                <label>Display Order</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={form.displayOrder}
                  onChange={handleFormChange}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>

              <div>
                <label>Media File {!editingId && " *"}</label>
                <input
                  type="file"
                  accept={form.type === "video" ? "video/*" : "image/*"}
                  onChange={handleMediaChange}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button type="submit" disabled={saving} style={{ padding: "12px 24px", background: saving ? "#ccc" : "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving..." : editingId ? "Update" : "Add"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "12px 24px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gap: "20px" }}>
        {heroes.length === 0 ? (
          <p>No hero content found.</p>
        ) : (
          heroes.map(hero => (
            <div key={hero._id} style={{  background: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "20px", display: "grid", gridTemplateColumns: "200px 1fr auto", gap: "20px", alignItems: "start" }}>
              <div>
                {hero.type === "video" && hero.thumbnail ? (
                  <img src={hero.thumbnail} alt={hero.title} style={{ width: "200px", height: "120px", objectFit: "cover", borderRadius: "4px" }} />
                ) : hero.type !== "video" && hero.url ? (
                  <img src={hero.url} alt={hero.title} style={{ width: "200px", height: "120px", objectFit: "cover", borderRadius: "4px" }} />
                ) : (
                  <div style={{ width: "200px", height: "120px", background: "#e0e0e0", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>No media</div>
                )}
              </div>
              <div>
                <h4 style={{ margin: 0, marginBottom: "5px" }}>{hero.title || hero.type}</h4>
                <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
                  <strong>Page:</strong> {hero.page} | <strong>Type:</strong> {hero.type}
                </p>
                {hero.description && <p style={{ margin: "5px 0", color: "#666" }}>{hero.description}</p>}
              </div>
              <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
                <button onClick={() => handleEdit(hero)} style={{ padding: "8px 16px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(hero._id)} style={{ padding: "8px 16px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
