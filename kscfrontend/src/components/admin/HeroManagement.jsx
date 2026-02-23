import { useEffect, useState } from "react";
import { get, post, put, del } from "../../utils/api";

export default function HeroManagement({ user }) {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    page: "about",
    type: "image",
    title: "",
    description: "",
    displayOrder: 0,
    media: null,
  });

  const pages = ["about", "home", "student", "news", "gallery"];
  const types = ["image", "video", "slide"];

  // Fetch all heroes
  useEffect(() => {
    async function loadHeroes() {
      try {
        const data = await get("/api/hero-content");
        setHeroes(Array.isArray(data) ? data : []);
        setError("");
      } catch (err) {
        setError("Failed to load hero content");
      } finally {
        setLoading(false);
      }
    }
    loadHeroes();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "displayOrder" ? Number(value) : value,
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File type validation based on type selected
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm'];
    
    const allowedTypes = formData.type === 'video' ? validVideoTypes : validImageTypes;
    
    if (!allowedTypes.includes(file.type)) {
      alert(`Invalid file type. Expected ${formData.type === 'video' ? 'MP4 or WebM' : 'JPG, PNG, or WebP'}`);
      return;
    }

    // File size validation (max 50MB for video, 5MB for images)
    const maxSize = formData.type === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File too large. Max ${formData.type === 'video' ? '50MB' : '5MB'}`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      media: file,
    }));
  };

  // Handle upload
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!formData.media) {
      alert("Please select a file");
      return;
    }

    if (!formData.page) {
      alert("Please select a page");
      return;
    }

    if (!formData.type) {
      alert("Please select a type");
      return;
    }

    // Validation
    if (formData.title.length > 255) {
      alert("Title must be 255 characters or less");
      return;
    }
    if (formData.description.length > 5000) {
      alert("Description must be 5000 characters or less");
      return;
    }
    if (formData.displayOrder < 0 || formData.displayOrder > 9999) {
      alert("Display order must be between 0 and 9999");
      return;
    }

    const data = new FormData();
    data.append("media", formData.media);
    data.append("page", formData.page);
    data.append("type", formData.type);
    if (formData.title?.trim()) data.append("title", formData.title);
    if (formData.description?.trim()) data.append("description", formData.description);
    data.append("displayOrder", formData.displayOrder);

    try {
      const result = await post("/api/hero-content", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setHeroes((prev) => [...prev, result]);
      setFormData({
        page: "about",
        type: "image",
        title: "",
        description: "",
        displayOrder: 0,
        media: null,
      });
      alert("Hero content uploaded successfully!");
    } catch (err) {
      alert("Failed to upload hero content: " + (err.response?.data?.error || err.message));
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this hero content?")) return;

    try {
      await del(`/api/hero-content/${id}`);
      setHeroes((prev) => prev.filter((h) => h._id !== id));
      alert("Hero content deleted successfully!");
    } catch (err) {
      alert("Failed to delete hero content");
    }
  };

  // Handle toggle active
  const handleToggleActive = async (hero) => {
    try {
      const updated = await put(`/api/hero-content/${hero._id}`, {
        active: !hero.active,
      });
      setHeroes((prev) =>
        prev.map((h) => (h._id === hero._id ? updated : h))
      );
    } catch (err) {
      alert("Failed to update hero content");
    }
  };

  const groupedByPage = pages.reduce((acc, page) => {
    acc[page] = heroes.filter((h) => h.page === page);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <h3>Hero Management</h3>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h3>🎬 Hero Content Management</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Upload Form */}
      <div
        style={{
          background: "#f9fafb",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h4>Upload New Hero Content</h4>
        <form onSubmit={handleUpload} style={{ display: "grid", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label>Page *</label>
              <select
                name="page"
                value={formData.page}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                }}
              >
                {pages.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                }}
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Hero title (optional)"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div>
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Hero description (optional)"
              rows="2"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div>
            <label>Display Order</label>
            <input
              type="number"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleChange}
              min="0"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div>
            <label>Media File * ({formData.type === "video" ? "MP4, WebM" : "JPG, PNG, WebP"})</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept={formData.type === "video" ? "video/*" : "image/*"}
              required
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
              }}
            />
            {formData.media && (
              <p style={{ marginTop: "8px", color: "#666", fontSize: "0.9rem" }}>
                Selected: {formData.media.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              padding: "10px 16px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Upload Hero Content
          </button>
        </form>
      </div>

      {/* Hero Content by Page */}
      {pages.map((page) => {
        const pageHeroes = groupedByPage[page];
        return (
          <div key={page} style={{ marginBottom: "30px" }}>
            <h4 style={{ marginBottom: "12px" }}>
              {page.charAt(0).toUpperCase() + page.slice(1)} Page (
              {pageHeroes.length})
            </h4>

            {pageHeroes.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>No hero content for this page</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
                }}
              >
                {pageHeroes.map((hero) => (
                  <div
                    key={hero._id}
                    style={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      overflow: "hidden",
                      transition: "box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                  >
                    {/* Preview */}
                    <div
                      style={{
                        height: "180px",
                        background: "#f3f4f6",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {hero.type === "video" ? (
                        <div style={{ textAlign: "center", color: "#9ca3af" }}>
                          🎬 Video<br />
                          <span style={{ fontSize: "0.85rem" }}>
                            {hero.originalName}
                          </span>
                        </div>
                      ) : (
                        <img
                          src={hero.url}
                          alt={hero.title || "Hero"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: "0.95rem" }}>
                            {hero.title || `Untitled (${hero.type})`}
                          </p>
                          <p style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "#6b7280" }}>
                            Order: {hero.displayOrder} | {hero.type}
                          </p>
                          <p
                            style={{
                              margin: "0",
                              fontSize: "0.8rem",
                              color: "#9ca3af",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {hero.originalName}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleActive(hero)}
                          style={{
                            padding: "4px 8px",
                            background: hero.active ? "#10b981" : "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                          }}
                        >
                          {hero.active ? "Active" : "Inactive"}
                        </button>
                      </div>

                      {hero.description && (
                        <p style={{ margin: "8px 0 0 0", fontSize: "0.85rem", color: "#4b5563" }}>
                          {hero.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleDelete(hero._id)}
                          style={{
                            padding: "6px 12px",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
