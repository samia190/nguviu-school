import { useEffect, useMemo, useState } from "react";
import { safePath } from "../utils/paths";
import { get, post, patch, del, upload } from "../utils/api";
import EditableText from "../components/EditableText";
import EditableHeading from "../components/EditableHeading";

export default function GalleryManagement() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState({});
  const [preview, setPreview] = useState(null);

  // create new section
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newFiles, setNewFiles] = useState([]);
  const [creating, setCreating] = useState(false);

  const API_ORIGIN = useMemo(() => {
    try {
      if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
      }
    } catch {}
    return "http://localhost:4000";
  }, []);

  function absUrl(u) {
    if (!u) return "";
    if (u.startsWith("http")) return u;
    return `${API_ORIGIN}${u}`;
  }

  function isImage(m) {
    return !!m && m.startsWith("image/");
  }
  function isVideo(m) {
    return !!m && m.startsWith("video/");
  }

  async function loadGallery() {
    try {
      setError("");
      const data = await get("/api/content/gallery");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Failed to load gallery items.");
    }
  }

  useEffect(() => {
    loadGallery();
  }, []);

  async function updateItem(id, fields) {
    try {
      const updated = await patch(`/api/content/gallery/${id}`, fields);
      const next = updated?.updated || updated;
      setItems((prev) =>
        prev.map((it) => (String(it._id || it.id) === String(id) ? next : it))
      );
    } catch (e) {
      console.error(e);
      alert("Failed to save changes.");
    }
  }

  /**
   * Upload files directly to the gallery item's attachments endpoint.
   * Uses POST /api/content/gallery/:id/attachments with multipart form data.
   */
  async function uploadAttachments(itemId, fileArray) {
    const files = Array.from(fileArray || []);
    if (files.length === 0) return;

    // Validate files
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Allowed: Images, Videos, PDFs, Word docs, Excel sheets, PowerPoint`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB). Max 100MB per file`);
        return;
      }
    }

    try {
      setError("");
      setUploading((s) => ({
        ...s,
        [itemId]: { uploading: true, progress: 0, message: "Uploading..." },
      }));

      const form = new FormData();
      files.forEach((file) => form.append("attachments", file));

      // Upload directly to the gallery attachments endpoint.
      // Backend handles file storage AND saves to the gallery item's attachments array.
      const result = await upload(`/api/content/gallery/${itemId}/attachments`, form, {}, {
        onProgress: (pct) => {
          setUploading((s) => ({
            ...s,
            [itemId]: { uploading: true, progress: pct, message: `Uploading... ${pct}%` },
          }));
        }
      });

      // Backend returns { added, item } with absolute URLs already applied
      const updatedItem = result?.item || result;

      setItems((prev) =>
        prev.map((it) => (String(it._id || it.id) === String(itemId) ? updatedItem : it))
      );

      setUploading((s) => ({
        ...s,
        [itemId]: { uploading: false, progress: 100, message: "✅ Upload complete" },
      }));
    } catch (e) {
      console.error(e);
      setUploading((s) => ({
        ...s,
        [itemId]: {
          uploading: false,
          progress: 0,
          message: `❌ Upload failed (${e?.message || "error"})`,
        },
      }));
      setError(`Upload failed: ${e?.message || "error"}`);
    }
  }

  async function removeAttachment(itemId, attachmentId) {
    if (!window.confirm("Remove this attachment?")) return;
    try {
      // Use the dedicated DELETE endpoint which also removes the file from disk
      const result = await del(`/api/content/gallery/${itemId}/attachments/${attachmentId}`);

      // Backend returns { ok, removed, item } with absolute URLs
      const updatedItem = result?.item;
      if (updatedItem) {
        setItems((prev) =>
          prev.map((it) => (String(it._id || it.id) === String(itemId) ? updatedItem : it))
        );
      } else {
        // Fallback: reload gallery data
        await loadGallery();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to remove attachment.");
    }
  }

  async function deleteItem(itemId) {
    if (!window.confirm("Delete this gallery section and all its media?")) return;
    try {
      await del(`/api/content/gallery/${itemId}`);
      setItems((prev) => prev.filter((it) => String(it._id || it.id) !== String(itemId)));
    } catch (e) {
      console.error(e);
      alert("Failed to delete gallery item.");
    }
  }

  async function createSectionWithMedia() {
    if (!newTitle.trim() && !newBody.trim() && newFiles.length === 0) {
      setError("Add a title/body or select media files.");
      return;
    }

    // Validation
    if (newTitle.length > 255) {
      setError("Title must be 255 characters or less");
      return;
    }
    if (newBody.length > 5000) {
      setError("Description must be 5000 characters or less");
      return;
    }

    // Validate files if any
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Allowed: Images, Videos, PDFs, Word docs, Excel sheets, PowerPoint`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB). Max 100MB per file`);
        return;
      }
    }

    try {
      setCreating(true);
      setError("");

      // 1) Create section (title + body, no attachments yet)
      const created = await post("/api/content/gallery", {
        title: newTitle.trim(),
        body: newBody.trim(),
      });

      const item = created?.item || created;
      const itemId = item?._id || item?.id;
      if (!itemId) throw new Error("Create gallery item did not return an ID");

      // Optimistically add to list
      setItems((prev) => [item, ...prev]);

      // 2) Upload attachments if any
      if (newFiles.length > 0) {
        await uploadAttachments(itemId, newFiles);
      }

      setNewTitle("");
      setNewBody("");
      setNewFiles([]);
    } catch (e) {
      console.error(e);
      setError(`Failed to create section. ${e?.message || ""}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <section style={{ padding: 20 }}>
      <h2>Gallery Management</h2>
      <p style={{ maxWidth: 800, fontSize: 14, color: "#4b5563" }}>
        Create and manage gallery sections. Each section can have a title, description, and multiple media
        attachments (images, videos, PDFs, etc.). Changes here will reflect on the public Gallery page.
      </p>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Admin create form */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          maxWidth: 900,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Create New Gallery Section</h3>

        <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
          Section Title
        </label>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="e.g. Sports Day 2025"
          style={{ width: "100%", padding: 6, marginBottom: 8 }}
        />

        <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
          Description / Body
        </label>
        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder="Short description of this event or gallery section."
          rows={3}
          style={{ width: "100%", padding: 6, marginBottom: 8 }}
        />

        <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
          Media files (images, videos, documents)
        </label>
        <input
          type="file"
          multiple
          accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
        />
        {newFiles.length > 0 && (
          <p style={{ fontSize: 13, marginTop: 6 }}>
            Selected: <b>{newFiles.length}</b> files
          </p>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={createSectionWithMedia} disabled={creating}>
            {creating ? "Creating..." : "+ Create Section"}
          </button>
          <button type="button" onClick={loadGallery} disabled={creating}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Existing gallery items */}
      {items.length === 0 && !error && <p>No gallery items found.</p>}

      <div
        style={{
          display: "grid",
          gap: "1.2rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        {items.map((item) => {
          const itemId = item._id || item.id;
          const status = uploading[itemId] || { uploading: false, progress: 0, message: "" };

          return (
            <article
              key={itemId}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 12,
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <EditableHeading
                value={item.title || "Untitled section"}
                onSave={(val) => updateItem(itemId, { title: val })}
                isAdmin={true}
                level={3}
              />

              <EditableText
                value={item.body || ""}
                onSave={(val) => updateItem(itemId, { body: val })}
                isAdmin={true}
              />

              {/* Upload more media to this section */}
              <div style={{ marginTop: 8 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                  Add media to this section
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={(e) => uploadAttachments(itemId, Array.from(e.target.files || []))}
                />
                {status.uploading && (
                  <p style={{ fontSize: 12, marginTop: 4 }}>
                    {status.message} ({status.progress}%)
                  </p>
                )}
              </div>

              {/* Attachments Grid Display */}
              <div style={{ marginTop: 12 }}>
                <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: 14 }}>Media Files ({item.attachments?.length || 0})</h4>
                
                {(!item.attachments || item.attachments.length === 0) && (
                  <p style={{ margin: 0, fontSize: 13, color: "#666" }}>No media attachments yet.</p>
                )}

                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: "12px",
                  marginTop: item.attachments?.length > 0 ? "8px" : "0"
                }}>
                  {item.attachments?.map((att, idx) => {
                    const url = absUrl(att.url);
                    const img = isImage(att.mimetype);
                    const vid = isVideo(att.mimetype);

                    return (
                      <div 
                        key={att._id || idx} 
                        style={{ 
                          position: "relative",
                          borderRadius: 8,
                          overflow: "hidden",
                          backgroundColor: "#f0f0f0",
                          aspectRatio: "1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "transform 0.2s ease, box-shadow 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {img && (
                          <img
                            src={safePath(url)}
                            alt={att.originalName || `Image ${idx + 1}`}
                            style={{ 
                              width: "100%", 
                              height: "100%",
                              objectFit: "cover"
                            }}
                            onClick={() => setPreview({ url, name: att.originalName })}
                            title={att.originalName || "Click to preview"}
                          />
                        )}

                        {vid && (
                          <div style={{ textAlign: "center", width: "100%", height: "100%" }}>
                            <video
                              src={safePath(url)}
                              style={{ 
                                width: "100%", 
                                height: "100%",
                                objectFit: "cover"
                              }}
                            />
                            <div style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "rgba(0,0,0,0.3)"
                            }}>
                              <span style={{ fontSize: 24, color: "#fff" }}>▶</span>
                            </div>
                          </div>
                        )}

                        {!img && !vid && (
                          <div style={{ 
                            textAlign: "center", 
                            padding: "8px",
                            fontSize: "11px"
                          }}>
                            📄<br/>
                            <span style={{ wordBreak: "break-word", display: "block", marginTop: "4px" }}>
                              {att.originalName?.substring(0, 15) || "File"}
                            </span>
                          </div>
                        )}

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeAttachment(itemId, att._id)}
                          style={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            background: "rgba(220, 38, 38, 0.9)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: 24,
                            height: 24,
                            cursor: "pointer",
                            fontSize: 12,
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(220, 38, 38, 1)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(220, 38, 38, 0.9)"}
                          title="Remove this file"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, gap: 8 }}>
                <button
                  type="button"
                  onClick={() => deleteItem(itemId)}
                  style={{
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: "#fee2e2",
                    color: "#b91c1c",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Delete Section
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Image preview overlay */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ maxWidth: "95%", maxHeight: "95%" }}>
            <img
              src={safePath(preview.url)}
              alt={preview.name || "preview"}
              style={{ width: "100%", height: "auto", borderRadius: 8 }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
