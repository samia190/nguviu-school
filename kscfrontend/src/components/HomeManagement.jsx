import React, { useEffect, useState } from "react";
import { get, put, upload } from "../utils/api";
import Loader from "./Loader";

export default function HomeManagement() {
  const [homepage, setHomepage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("settings"); // settings | hero | links

  const [formData, setFormData] = useState({
    title: "",
    intro: "",
  });

  const [heroItems, setHeroItems] = useState([]);
  const [editingHeroId, setEditingHeroId] = useState(null);
  const [heroForm, setHeroForm] = useState({
    url: "",
    title: "",
    description: "",
    type: "slide",
    displayOrder: 0,
    active: true,
  });
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState(null);

  const [quickLinks, setQuickLinks] = useState([]);
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [linkForm, setLinkForm] = useState({
    key: "",
    title: "",
    text: "",
    childContainers: [],
  });

  useEffect(() => {
    fetchHomepage();
  }, []);

  async function fetchHomepage() {
    setLoading(true);
    try {
      const data = await get("/api/home/admin");
      setHomepage(data);
      setFormData({
        title: data.title || "",
        intro: data.intro || "",
      });
      setHeroItems(data.heroContent?.items || []);
      setQuickLinks(data.quickLinks || []);
    } catch (err) {
      setError("Failed to load home page data");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  // ===== PAGE SETTINGS TAB =====
  function handleSettingsChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function savePageSettings() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await put("/api/home", {
        title: formData.title,
        intro: formData.intro,
      });
      setHomepage(updated);
      setSuccess("Page settings saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  // ===== HERO SECTION TAB =====
  function handleHeroImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (heroImagePreview && heroImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(heroImagePreview);
    }

    setHeroImageFile(file);
    setHeroImagePreview(URL.createObjectURL(file));
  }

  function handleHeroFormChange(e) {
    const { name, value, type, checked } = e.target;
    setHeroForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function addOrUpdateHero() {
    setSaving(true);
    setError("");
    setSuccess("");

    if (!heroForm.url && !heroImageFile) {
      setError("Image URL or file is required");
      setSaving(false);
      return;
    }

    if (!heroForm.title.trim()) {
      setError("Title is required");
      setSaving(false);
      return;
    }

    try {
      let imageUrl = heroForm.url;

      // Upload image if file selected
      if (heroImageFile) {
        const fd = new FormData();
        fd.append("file", heroImageFile);
        const uploadResult = await upload("/api/home/hero-upload", fd);
        imageUrl = uploadResult.url;
      }

      // Create new hero item
      const newHeroItem = {
        _id: editingHeroId || new Date().getTime().toString(),
        url: imageUrl,
        title: heroForm.title,
        description: heroForm.description,
        type: heroForm.type,
        displayOrder: parseInt(heroForm.displayOrder),
        active: heroForm.active,
      };

      let updatedItems;
      if (editingHeroId) {
        updatedItems = heroItems.map((item) => (item._id === editingHeroId ? newHeroItem : item));
      } else {
        updatedItems = [...heroItems, newHeroItem];
      }

      // Save to backend
      const updated = await put("/api/home", {
        heroContent: {
          type: heroForm.type === "video" ? "video" : heroForm.type === "image" ? "image" : "slide",
          items: updatedItems,
        },
      });

      setHeroItems(updated.heroContent?.items || []);
      setHeroForm({
        url: "",
        title: "",
        description: "",
        type: "slide",
        displayOrder: 0,
        active: true,
      });
      setHeroImageFile(null);
      if (heroImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(heroImagePreview);
      }
      setHeroImagePreview(null);
      setEditingHeroId(null);

      setSuccess(editingHeroId ? "Hero slide updated!" : "Hero slide added!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save hero: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  function editHero(item) {
    setEditingHeroId(item._id);
    setHeroForm({
      url: item.url,
      title: item.title,
      description: item.description,
      type: item.type,
      displayOrder: item.displayOrder,
      active: item.active,
    });
    setHeroImageFile(null);
    setHeroImagePreview(null);
  }

  async function deleteHero(id) {
    if (!confirm("Delete this hero slide?")) return;

    try {
      const updatedItems = heroItems.filter((item) => item._id !== id);
      const updated = await put("/api/home", {
        heroContent: {
          type: homepage.heroContent?.type || "slide",
          items: updatedItems,
        },
      });
      setHeroItems(updated.heroContent?.items || []);
      setSuccess("Hero slide deleted!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete hero: " + (err.message || "Unknown error"));
    }
  }

  // ===== QUICK LINKS TAB =====
  function handleLinkFormChange(e) {
    const { name, value } = e.target;
    setLinkForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleChildChange(childIndex, field, value) {
    const updatedChildren = [...linkForm.childContainers];
    updatedChildren[childIndex] = {
      ...updatedChildren[childIndex],
      [field]: value,
    };
    setLinkForm((prev) => ({
      ...prev,
      childContainers: updatedChildren,
    }));
  }

  function addChild() {
    setLinkForm((prev) => ({
      ...prev,
      childContainers: [...prev.childContainers, { title: "", text: "" }],
    }));
  }

  function removeChild(index) {
    setLinkForm((prev) => ({
      ...prev,
      childContainers: prev.childContainers.filter((_, i) => i !== index),
    }));
  }

  async function addOrUpdateLink() {
    setSaving(true);
    setError("");
    setSuccess("");

    if (!linkForm.key.trim() || !linkForm.title.trim()) {
      setError("Key and title are required");
      setSaving(false);
      return;
    }

    try {
      const newLink = {
        _id: editingLinkId || new Date().getTime().toString(),
        key: linkForm.key,
        title: linkForm.title,
        text: linkForm.text,
        childContainers: linkForm.childContainers,
        displayOrder: quickLinks.length,
        active: true,
      };

      let updatedLinks;
      if (editingLinkId) {
        updatedLinks = quickLinks.map((link) => (link._id === editingLinkId ? newLink : link));
      } else {
        updatedLinks = [...quickLinks, newLink];
      }

      const updated = await put("/api/home", {
        quickLinks: updatedLinks,
      });

      setQuickLinks(updated.quickLinks || []);
      setLinkForm({
        key: "",
        title: "",
        text: "",
        childContainers: [],
      });
      setEditingLinkId(null);

      setSuccess(editingLinkId ? "Link updated!" : "Link added!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save link: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  function editLink(link) {
    setEditingLinkId(link._id);
    setLinkForm({
      key: link.key,
      title: link.title,
      text: link.text,
      childContainers: link.childContainers || [],
    });
  }

  async function deleteLink(id) {
    if (!confirm("Delete this quick link?")) return;

    try {
      const updatedLinks = quickLinks.filter((link) => link._id !== id);
      const updated = await put("/api/home", {
        quickLinks: updatedLinks,
      });
      setQuickLinks(updated.quickLinks || []);
      setSuccess("Link deleted!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete link: " + (err.message || "Unknown error"));
    }
  }

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>🏠 Home Page Management</h1>

      {error && (
        <div
          style={{
            background: "#fee",
            color: "#c33",
            padding: "15px",
            borderRadius: "4px",
            marginBottom: "20px",
            border: "1px solid #fcc",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: "#efe",
            color: "#3c3",
            padding: "15px",
            borderRadius: "4px",
            marginBottom: "20px",
            border: "1px solid #cfc",
          }}
        >
          {success}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "2px solid #ddd" }}>
        <button
          onClick={() => setActiveTab("settings")}
          style={{
            padding: "12px 24px",
            background: activeTab === "settings" ? "#007bff" : "#f0f0f0",
            color: activeTab === "settings" ? "white" : "#333",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "settings" ? "bold" : "normal",
          }}
        >
          📝 Page Settings
        </button>
        <button
          onClick={() => setActiveTab("hero")}
          style={{
            padding: "12px 24px",
            background: activeTab === "hero" ? "#007bff" : "#f0f0f0",
            color: activeTab === "hero" ? "white" : "#333",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "hero" ? "bold" : "normal",
          }}
        >
          🎬 Hero Section
        </button>
        <button
          onClick={() => setActiveTab("links")}
          style={{
            padding: "12px 24px",
            background: activeTab === "links" ? "#007bff" : "#f0f0f0",
            color: activeTab === "links" ? "white" : "#333",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "links" ? "bold" : "normal",
          }}
        >
          🔗 Quick Links
        </button>
      </div>

      {/* TAB 1: PAGE SETTINGS */}
      {activeTab === "settings" && (
        <div style={{ background: "white", padding: "30px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h2>Page Title & Introduction</h2>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Page Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleSettingsChange}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Introduction Text</label>
            <textarea
              name="intro"
              value={formData.intro}
              onChange={handleSettingsChange}
              rows="6"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                fontFamily: "Arial, sans-serif",
              }}
            />
          </div>

          <button
            onClick={savePageSettings}
            disabled={saving}
            style={{
              padding: "12px 30px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}

      {/* TAB 2: HERO SECTION */}
      {activeTab === "hero" && (
        <div style={{ background: "white", padding: "30px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h2>Manage Hero Slides/Videos</h2>

          {/* ADD/EDIT FORM */}
          <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "8px", marginBottom: "30px", border: "1px solid #eee" }}>
            <h3>{editingHeroId ? "Edit Hero Slide" : "Add New Hero Slide"}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Title*</label>
                <input
                  type="text"
                  name="title"
                  value={heroForm.title}
                  onChange={handleHeroFormChange}
                  placeholder="Slide title"
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Type</label>
                <select
                  name="type"
                  value={heroForm.type}
                  onChange={handleHeroFormChange}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <option value="slide">Slide</option>
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Description</label>
              <textarea
                name="description"
                value={heroForm.description}
                onChange={handleHeroFormChange}
                placeholder="Optional description"
                rows="3"
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Image Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleHeroImageChange}
                style={{ padding: "10px" }}
              />
            </div>

            {heroImagePreview && (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#666" }}>Image Preview</label>
                <img src={heroImagePreview} alt="preview" style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "4px" }} />
              </div>
            )}

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Or Paste Image URL</label>
              <input
                type="text"
                name="url"
                value={heroForm.url}
                onChange={handleHeroFormChange}
                placeholder="https://..."
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Display Order</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={heroForm.displayOrder}
                  onChange={handleHeroFormChange}
                  min="0"
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  <input
                    type="checkbox"
                    name="active"
                    checked={heroForm.active}
                    onChange={handleHeroFormChange}
                    style={{ marginRight: "8px" }}
                  />
                  Active
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={addOrUpdateHero}
                disabled={saving}
                style={{
                  padding: "10px 20px",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : editingHeroId ? "Update Slide" : "Add Slide"}
              </button>
              {editingHeroId && (
                <button
                  onClick={() => {
                    setEditingHeroId(null);
                    setHeroForm({
                      url: "",
                      title: "",
                      description: "",
                      type: "slide",
                      displayOrder: 0,
                      active: true,
                    });
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* EXISTING HERO ITEMS */}
          <h3>Current Hero Slides ({heroItems.length})</h3>
          <div style={{ display: "grid", gap: "15px" }}>
            {heroItems.map((item) => (
              <div
                key={item._id}
                style={{
                  background: "#fafafa",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #eee",
                  display: "grid",
                  gridTemplateColumns: "120px 1fr auto",
                  gap: "15px",
                  alignItems: "start",
                }}
              >
                {item.url && (
                  <img src={item.url} alt={item.title} style={{ width: "120px", height: "80px", objectFit: "cover", borderRadius: "4px" }} />
                )}
                <div>
                  <h4 style={{ margin: "0 0 5px 0" }}>{item.title}</h4>
                  <p style={{ margin: "3px 0", fontSize: "12px", color: "#666" }}>{item.description}</p>
                  <p style={{ margin: "3px 0", fontSize: "11px", color: "#999" }}>
                    Type: {item.type} | Order: {item.displayOrder} | {item.active ? "✅ Active" : "⛔ Inactive"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                  <button
                    onClick={() => editHero(item)}
                    style={{
                      padding: "6px 12px",
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteHero(item._id)}
                    style={{
                      padding: "6px 12px",
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: QUICK LINKS */}
      {activeTab === "links" && (
        <div style={{ background: "white", padding: "30px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h2>Manage Quick Links Sections</h2>

          {/* ADD/EDIT FORM */}
          <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "8px", marginBottom: "30px", border: "1px solid #eee" }}>
            <h3>{editingLinkId ? "Edit Quick Link" : "Add New Quick Link"}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Key (internal)*</label>
                <input
                  type="text"
                  name="key"
                  value={linkForm.key}
                  onChange={handleLinkFormChange}
                  placeholder="about, admissions, etc"
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Title*</label>
                <input
                  type="text"
                  name="title"
                  value={linkForm.title}
                  onChange={handleLinkFormChange}
                  placeholder="Section title"
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Description</label>
              <textarea
                name="text"
                value={linkForm.text}
                onChange={handleLinkFormChange}
                placeholder="Brief description"
                rows="3"
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <h4>Child Containers</h4>
              {linkForm.childContainers.map((child, idx) => (
                <div key={idx} style={{ marginBottom: "15px", padding: "12px", background: "white", borderRadius: "4px", border: "1px solid #ddd" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Child title"
                      value={child.title}
                      onChange={(e) => handleChildChange(idx, "title", e.target.value)}
                      style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                    />
                    <button
                      onClick={() => removeChild(idx)}
                      style={{
                        padding: "8px 12px",
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    placeholder="Child description"
                    value={child.text}
                    onChange={(e) => handleChildChange(idx, "text", e.target.value)}
                    rows="2"
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
              ))}
              <button
                onClick={addChild}
                style={{
                  padding: "8px 16px",
                  background: "#17a2b8",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                + Add Child Container
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={addOrUpdateLink}
                disabled={saving}
                style={{
                  padding: "10px 20px",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : editingLinkId ? "Update Link" : "Add Link"}
              </button>
              {editingLinkId && (
                <button
                  onClick={() => {
                    setEditingLinkId(null);
                    setLinkForm({
                      key: "",
                      title: "",
                      text: "",
                      childContainers: [],
                    });
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* EXISTING LINKS */}
          <h3>Current Quick Links ({quickLinks.length})</h3>
          <div style={{ display: "grid", gap: "15px" }}>
            {quickLinks.map((link) => (
              <div
                key={link._id}
                style={{
                  background: "#fafafa",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #eee",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "15px",
                  alignItems: "start",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 5px 0" }}>{link.title}</h4>
                  <p style={{ margin: "3px 0", fontSize: "12px", color: "#666" }}>{link.text}</p>
                  <p style={{ margin: "3px 0", fontSize: "11px", color: "#999" }}>
                    Children: {link.childContainers?.length || 0} | {link.active ? "✅ Active" : "⛔ Inactive"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                  <button
                    onClick={() => editLink(link)}
                    style={{
                      padding: "6px 12px",
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteLink(link._id)}
                    style={{
                      padding: "6px 12px",
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
