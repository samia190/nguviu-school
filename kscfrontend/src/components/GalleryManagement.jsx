import { useEffect, useState, useRef } from "react";
import { get, put, post, upload } from "../utils/api";

const tabs = [
  { key: "settings", label: "Page Settings", icon: "⚙️" },
  { key: "albums", label: "Albums", icon: "📁" },
  { key: "images", label: "Images", icon: "🖼️" },
];

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 16,
  background: "#fff",
  marginBottom: 16,
};
const labelStyle = {
  display: "block",
  fontWeight: 600,
  marginBottom: 4,
  fontSize: 14,
};
const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 14,
  boxSizing: "border-box",
};
const btnPrimary = {
  padding: "8px 20px",
  borderRadius: 6,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
};
const btnDanger = {
  padding: "6px 14px",
  borderRadius: 6,
  border: "none",
  background: "#fee2e2",
  color: "#b91c1c",
  cursor: "pointer",
  fontSize: 13,
};

export default function GalleryManagement() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("settings");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, percent: 0, startTime: 0 });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Page settings
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [heroOverlayText, setHeroOverlayText] = useState("");
  const heroRef = useRef();

  // New album form
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");

  // Image upload
  const [uploadAlbumId, setUploadAlbumId] = useState("");
  const imgRef = useRef();

  // Image filter
  const [filterAlbum, setFilterAlbum] = useState("all");

  function flash(message) {
    setMsg(message);
    setTimeout(() => setMsg(""), 3000);
  }

  async function loadData() {
    try {
      setErr("");
      const d = await get("/api/gallery-page/admin");
      setData(d);
      setTitle(d.title || "");
      setSubtitle(d.subtitle || "");
      setHeroOverlayText(d.heroOverlayText || "");
    } catch (e) {
      setErr("Failed to load gallery data: " + (e?.message || ""));
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function save(updates) {
    setSaving(true);
    setMsg("");
    setErr("");
    try {
      const result = await put("/api/gallery-page", updates);
      setData(result);
      flash("Saved successfully!");
    } catch (e) {
      setErr("Save failed: " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  }

  // ─── SETTINGS ──────────────────────────────────────────────────────────────
  function saveSettings() {
    save({ title, subtitle, heroOverlayText });
  }

  async function uploadHero() {
    const file = heroRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("images", file);
      const result = await upload("/api/gallery-page/upload", form);
      if (result?.urls?.[0]) {
        await save({ heroImage: result.urls[0] });
      }
      heroRef.current.value = "";
    } catch (e) {
      setErr("Hero upload failed: " + (e?.message || ""));
    } finally {
      setUploading(false);
    }
  }

  // ─── ALBUMS ────────────────────────────────────────────────────────────────
  function addAlbum() {
    if (!newAlbumName.trim()) return;
    const albums = [
      ...(data?.albums || []),
      {
        name: newAlbumName.trim(),
        description: newAlbumDesc.trim(),
        active: true,
        displayOrder: (data?.albums?.length || 0) + 1,
      },
    ];
    save({ albums });
    setNewAlbumName("");
    setNewAlbumDesc("");
  }

  function updateAlbum(id, fields) {
    const albums = (data?.albums || []).map((a) =>
      (a._id || a.id) === id ? { ...a, ...fields } : a
    );
    save({ albums });
  }

  function deleteAlbum(id) {
    if (!confirm("Delete this album? Images will become unassigned.")) return;
    const albums = (data?.albums || []).filter((a) => (a._id || a.id) !== id);
    const images = (data?.images || []).map((img) =>
      img.albumId === id ? { ...img, albumId: "" } : img
    );
    save({ albums, images });
  }

  // ─── IMAGES ────────────────────────────────────────────────────────────────
  async function uploadImages() {
    const files = imgRef.current?.files;
    if (!files?.length) {
      setErr("Select files to upload");
      return;
    }
    if (!uploadAlbumId) {
      setErr("Please select an album first");
      return;
    }

    const fileArr = Array.from(files);
    const totalFiles = fileArr.length;
    const BATCH = 30; // send 30 files per request to stay fast
    const startTime = Date.now();

    setUploading(true);
    setUploadProgress({ current: 0, total: totalFiles, percent: 0, startTime });
    setErr("");

    try {
      let uploaded = 0;
      for (let i = 0; i < totalFiles; i += BATCH) {
        const batch = fileArr.slice(i, i + BATCH);
        const form = new FormData();
        for (const f of batch) form.append("images", f);
        form.append("albumId", uploadAlbumId);

        await upload("/api/gallery-page/upload", form, {}, {
          onProgress: (pct) => {
            // weighted progress across batches
            const batchProgress = pct / 100;
            const overallDone = uploaded + batch.length * batchProgress;
            const overallPct = Math.round((overallDone / totalFiles) * 100);
            setUploadProgress({ current: Math.round(overallDone), total: totalFiles, percent: overallPct, startTime });
          }
        });

        uploaded += batch.length;
        setUploadProgress({ current: uploaded, total: totalFiles, percent: Math.round((uploaded / totalFiles) * 100), startTime });
      }

      await loadData();
      flash(`${totalFiles} image(s) uploaded successfully!`);
      imgRef.current.value = "";
    } catch (e) {
      setErr(`Upload failed at image ${uploadProgress.current + 1}/${totalFiles}: ${e?.message || ""}`);
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0, percent: 0, startTime: 0 });
    }
  }

  function updateImage(id, fields) {
    const images = (data?.images || []).map((img) =>
      (img._id || img.id) === id ? { ...img, ...fields } : img
    );
    save({ images });
  }

  function deleteImage(id) {
    if (!confirm("Delete this image?")) return;
    const images = (data?.images || []).filter(
      (img) => (img._id || img.id) !== id
    );
    save({ images });
  }

  async function resetDefaults() {
    if (!confirm("Reset gallery to defaults? All custom data will be lost."))
      return;
    setSaving(true);
    try {
      const result = await post("/api/gallery-page/reset-defaults", {});
      setData(result);
      setTitle(result.title || "");
      setSubtitle(result.subtitle || "");
      setHeroOverlayText(result.heroOverlayText || "");
      flash("Reset to defaults!");
    } catch (e) {
      setErr("Reset failed: " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────
  if (!data) {
    return (
      <section style={{ padding: 20 }}>
        <h2>Gallery Management</h2>
        <p>{err || "Loading..."}</p>
      </section>
    );
  }

  const albums = data.albums || [];
  const images = data.images || [];
  const filteredImages =
    filterAlbum === "all"
      ? images
      : filterAlbum === "unassigned"
        ? images.filter((i) => !i.albumId)
        : images.filter((img) => img.albumId === filterAlbum);

  return (
    <section style={{ padding: 20, maxWidth: 1000 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>Gallery Management</h2>
        <button
          onClick={resetDefaults}
          disabled={saving}
          style={{ ...btnDanger, fontSize: 12 }}
        >
          🔄 Reset to Defaults
        </button>
      </div>
      <p style={{ color: "#4b5563", fontSize: 14, maxWidth: 800 }}>
        Manage albums and images for the public Gallery page. Upload images,
        organize them into albums, and control how they appear on the site.
      </p>

      {msg && <p style={{ color: "green", fontWeight: 600 }}>{msg}</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          borderBottom: "2px solid #e5e7eb",
          paddingBottom: 6,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px 8px 0 0",
              border: "none",
              cursor: "pointer",
              background: tab === t.key ? "#2563eb" : "#f1f5f9",
              color: tab === t.key ? "#fff" : "#475569",
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: 14,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB: SETTINGS ═══════════════ */}
      {tab === "settings" && (
        <div>
          <div style={cardStyle}>
            <label style={labelStyle}>Page Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={cardStyle}>
            <label style={labelStyle}>Subtitle / Description</label>
            <textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div style={cardStyle}>
            <label style={labelStyle}>Hero Overlay Text</label>
            <input
              value={heroOverlayText}
              onChange={(e) => setHeroOverlayText(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={cardStyle}>
            <label style={labelStyle}>Hero Image</label>
            {data.heroImage && (
              <img
                src={data.heroImage}
                alt="Hero preview"
                style={{
                  width: "100%",
                  maxHeight: 200,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              />
            )}
            <input
              type="file"
              ref={heroRef}
              accept="image/*"
              style={{ marginBottom: 8 }}
            />
            <button
              onClick={uploadHero}
              disabled={uploading}
              style={btnPrimary}
            >
              {uploading ? "Uploading..." : "Upload Hero Image"}
            </button>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            style={btnPrimary}
          >
            {saving ? "Saving..." : "Save Page Settings"}
          </button>
        </div>
      )}

      {/* ═══════════════ TAB: ALBUMS ═══════════════ */}
      {tab === "albums" && (
        <div>
          {/* Add new album */}
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Add New Album</h3>
            <label style={labelStyle}>Album Name</label>
            <input
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="e.g. Sports Day 2025"
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <label style={labelStyle}>Description</label>
            <input
              value={newAlbumDesc}
              onChange={(e) => setNewAlbumDesc(e.target.value)}
              placeholder="Brief description of this album"
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <button onClick={addAlbum} disabled={saving} style={btnPrimary}>
              + Add Album
            </button>
          </div>

          {/* Existing albums */}
          <h3>
            Existing Albums ({albums.length})
          </h3>
          {albums.length === 0 && (
            <p style={{ color: "#888" }}>No albums yet. Create one above.</p>
          )}

          {[...albums]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((album) => {
              const albumId = album._id || album.id;
              const imageCount = images.filter(
                (img) => img.albumId === albumId
              ).length;

              return (
                <div
                  key={albumId}
                  style={{
                    ...cardStyle,
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={labelStyle}>Name</label>
                    <input
                      value={album.name}
                      onChange={(e) => {
                        const updated = albums.map((a) =>
                          (a._id || a.id) === albumId
                            ? { ...a, name: e.target.value }
                            : a
                        );
                        setData((d) => ({ ...d, albums: updated }));
                      }}
                      onBlur={(e) =>
                        updateAlbum(albumId, { name: e.target.value })
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={labelStyle}>Description</label>
                    <input
                      value={album.description || ""}
                      onChange={(e) => {
                        const updated = albums.map((a) =>
                          (a._id || a.id) === albumId
                            ? { ...a, description: e.target.value }
                            : a
                        );
                        setData((d) => ({ ...d, albums: updated }));
                      }}
                      onBlur={(e) =>
                        updateAlbum(albumId, { description: e.target.value })
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      minWidth: 130,
                    }}
                  >
                    <label style={{ fontSize: 13, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={album.active !== false}
                        onChange={(e) =>
                          updateAlbum(albumId, { active: e.target.checked })
                        }
                      />{" "}
                      Active
                    </label>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      📷 {imageCount} image{imageCount !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => deleteAlbum(albumId)}
                      style={btnDanger}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ═══════════════ TAB: IMAGES ═══════════════ */}
      {tab === "images" && (
        <div>
          {/* Upload form */}
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Upload Images</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={labelStyle}>Album</label>
                <select
                  value={uploadAlbumId}
                  onChange={(e) => setUploadAlbumId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- Select Album --</option>
                  {albums
                    .filter((a) => a.active !== false)
                    .map((a) => (
                      <option key={a._id || a.id} value={a._id || a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </div>
              <div style={{ flex: 2, minWidth: 200 }}>
                <label style={labelStyle}>Image Files</label>
                <input type="file" ref={imgRef} multiple accept="image/*" />
              </div>
            </div>
            <button
              onClick={uploadImages}
              disabled={uploading}
              style={{ ...btnPrimary, marginTop: 10 }}
            >
              {uploading ? "Uploading..." : "Upload Images"}
            </button>

            {/* Upload Progress Bar */}
            {uploading && uploadProgress.total > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: "#374151" }}>
                  <span>
                    📤 Uploading {uploadProgress.current} of {uploadProgress.total} images
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {uploadProgress.percent}%
                    {uploadProgress.startTime > 0 && uploadProgress.percent > 0 && uploadProgress.percent < 100 && (() => {
                      const elapsed = (Date.now() - uploadProgress.startTime) / 1000;
                      const remaining = Math.round((elapsed / uploadProgress.percent) * (100 - uploadProgress.percent));
                      return remaining > 0 ? ` • ~${remaining}s left` : "";
                    })()}
                  </span>
                </div>
                <div style={{ width: "100%", height: 8, background: "#e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${uploadProgress.percent}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                      borderRadius: 8,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  Images are uploaded in parallel batches for maximum speed.
                </p>
              </div>
            )}
          </div>

          {/* Filter badges */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setFilterAlbum("all")}
              style={{
                padding: "6px 14px",
                borderRadius: 16,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                background: filterAlbum === "all" ? "#2563eb" : "#f1f5f9",
                color: filterAlbum === "all" ? "#fff" : "#475569",
                fontWeight: filterAlbum === "all" ? 700 : 500,
              }}
            >
              All ({images.length})
            </button>
            {albums.map((a) => {
              const aid = a._id || a.id;
              const count = images.filter(
                (img) => img.albumId === aid
              ).length;
              return (
                <button
                  key={aid}
                  onClick={() => setFilterAlbum(aid)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 16,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    background: filterAlbum === aid ? "#2563eb" : "#f1f5f9",
                    color: filterAlbum === aid ? "#fff" : "#475569",
                    fontWeight: filterAlbum === aid ? 700 : 500,
                  }}
                >
                  {a.name} ({count})
                </button>
              );
            })}
            {images.some((img) => !img.albumId) && (
              <button
                onClick={() => setFilterAlbum("unassigned")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 16,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  background:
                    filterAlbum === "unassigned" ? "#2563eb" : "#f1f5f9",
                  color:
                    filterAlbum === "unassigned" ? "#fff" : "#475569",
                  fontWeight: filterAlbum === "unassigned" ? 700 : 500,
                }}
              >
                Unassigned ({images.filter((i) => !i.albumId).length})
              </button>
            )}
          </div>

          {/* Image grid */}
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            }}
          >
            {filteredImages.map((img) => {
              const imgId = img._id || img.id;
              return (
                <div
                  key={imgId}
                  style={{
                    ...cardStyle,
                    padding: 0,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ aspectRatio: "4/3", background: "#f0f0f0" }}>
                    <img
                      src={img.url}
                      alt={img.caption || "Image"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      padding: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      fontSize: 13,
                    }}
                  >
                    <input
                      value={img.caption || ""}
                      placeholder="Caption"
                      onChange={(e) => {
                        const updated = images.map((i) =>
                          (i._id || i.id) === imgId
                            ? { ...i, caption: e.target.value }
                            : i
                        );
                        setData((d) => ({ ...d, images: updated }));
                      }}
                      onBlur={(e) =>
                        updateImage(imgId, { caption: e.target.value })
                      }
                      style={{ ...inputStyle, fontSize: 13 }}
                    />
                    <select
                      value={img.albumId || ""}
                      onChange={(e) =>
                        updateImage(imgId, { albumId: e.target.value })
                      }
                      style={{ ...inputStyle, fontSize: 13 }}
                    >
                      <option value="">Unassigned</option>
                      {albums.map((a) => (
                        <option key={a._id || a.id} value={a._id || a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <label style={{ fontSize: 12, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={img.featured || false}
                          onChange={(e) =>
                            updateImage(imgId, { featured: e.target.checked })
                          }
                        />{" "}
                        ⭐ Featured
                      </label>
                      <label style={{ fontSize: 12, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={img.active !== false}
                          onChange={(e) =>
                            updateImage(imgId, { active: e.target.checked })
                          }
                        />{" "}
                        Active
                      </label>
                      <button
                        onClick={() => deleteImage(imgId)}
                        style={{
                          ...btnDanger,
                          padding: "3px 8px",
                          marginLeft: "auto",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredImages.length === 0 && (
            <p
              style={{ color: "#888", textAlign: "center", padding: 20 }}
            >
              No images in this view.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
