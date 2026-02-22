import React, { useEffect, useState } from "react";
import { get, post, put, del } from "../utils/api";
import Loader from "./Loader";

export default function HomeNewsManagement() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "news",
    displayOrder: 0,
    link: "",
    author: ""
  });

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    setLoading(true);
    try {
      const data = await get("/api/home-news");
      setNews(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load news");
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!imageFile && !editingId) {
      setError("Image is required for new items");
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      if (imageFile) formData.append("image", imageFile);

      if (editingId) {
        await put(`/api/home-news/${editingId}`, formData);
        setSuccess("Updated!");
      } else {
        await post("/api/home-news", formData);
        setSuccess("Added!");
      }

      setForm({ title: "", description: "", category: "news", displayOrder: 0, link: "", author: "" });
      setImageFile(null);
      setShowForm(false);
      setEditingId(null);
      fetchNews();
    } catch (err) {
      setError(err.message || "Failed");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item) {
    setEditingId(item._id);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      displayOrder: item.displayOrder,
      link: item.link || "",
      author: item.author || ""
    });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this news item?")) return;
    try {
      await del(`/api/home-news/${id}`);
      setSuccess("Deleted!");
      fetchNews();
    } catch (err) {
      setError("Failed");
    }
  }

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>📰 Home News Management</h1>
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
          {showForm ? "Cancel" : "Add News"}
        </button>
      </div>

      {error && <div style={{ background: "#fee", padding: "15px", marginBottom: "20px", color: "#c33" }}>{error}</div>}
      {success && <div style={{ background: "#efe", padding: "15px", marginBottom: "20px", color: "#3c3" }}>{success}</div>}

      {showForm && (
        <div style={{ background: "white", border: "1px solid #ddd", padding: "20px", marginBottom: "30px", borderRadius: "8px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <input type="text" name="title" placeholder="Title*" value={form.title} onChange={handleFormChange} required style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <select name="category" value={form.category} onChange={handleFormChange} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}>
                <option value="news">News</option>
                <option value="event">Event</option>
                <option value="update">Update</option>
                <option value="announcement">Announcement</option>
                <option value="achievement">Achievement</option>
              </select>
              <textarea name="description" placeholder="Description*" value={form.description} onChange={handleFormChange} rows="3" required style={{ gridColumn: "1/-1", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <input type="text" name="author" placeholder="Author" value={form.author} onChange={handleFormChange} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <input type="text" name="link" placeholder="Link (optional)" value={form.link} onChange={handleFormChange} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <input type="number" name="displayOrder" placeholder="Order" value={form.displayOrder} onChange={handleFormChange} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }} />
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ padding: "10px" }} />
            </div>
            <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
              <button type="submit" disabled={saving} style={{ padding: "10px 20px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gap: "15px" }}>
        {news.map(item => (
          <div key={item._id} style={{ background: "white", border: "1px solid #ddd", padding: "15px", borderRadius: "8px", display: "grid", gridTemplateColumns: "150px 1fr auto", gap: "15px", alignItems: "start" }}>
            {item.imageUrl && <img src={item.imageUrl} alt={item.title} style={{ width: "150px", height: "100px", objectFit: "cover", borderRadius: "4px" }} />}
            <div>
              <h4 style={{ margin: 0, marginBottom: "5px" }}>{item.title}</h4>
              <p style={{ margin: "3px 0", fontSize: "12px", color: "#666" }}>{item.description.substring(0, 100)}...</p>
              <p style={{ margin: "3px 0", fontSize: "11px", color: "#999" }}>Category: {item.category} | Views: {item.views}</p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
              <button onClick={() => handleEdit(item)} style={{ padding: "6px 12px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Edit</button>
              <button onClick={() => handleDelete(item._id)} style={{ padding: "6px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
