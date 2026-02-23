import React, { useEffect, useState } from "react";
import { get, upload, put } from "../utils/api";
import { safePath } from "../utils/paths";
import LazyImage from "../components/LazyImage";

const PAGES = [
  { key: "home", label: "Home Page" },
  { key: "login", label: "Login Page" },
  { key: "signup", label: "Signup Page" },
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function fileHref(file) {
  return file?.downloadUrl || file?.url || "";
}

export default function PageBackgroundManagement() {
  // State declarations
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedFiles, setSelectedFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [overlays, setOverlays] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    // Cleanup blob URLs on unmount
    return () => {
      Object.values(previews).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  async function fetchContent() {
    setLoading(true);
    setError("");
    try {
      const data = await get("/api/content/page-backgrounds");
      setContent(data || {});

      setOverlays(
        Object.fromEntries(
          PAGES.map((p) => [
            p.key,
            Math.max(0, Math.min(0.8, data?.data?.[p.key]?.overlay ?? 0.55)),
          ])
        )
      );

      setLoading(false);
    } catch (err) {
      setError(err.message || "Error loading backgrounds");
      setLoading(false);
    }
  }

  // ---------------- FILE SELECT + PREVIEW ----------------
  function handleFileChange(page, file) {
    if (!file) return;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(`Invalid file type. Allowed: JPG, PNG, WebP, GIF, SVG`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size must be 50MB or less. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Revoke old preview if exists
    if (previews[page] && previews[page].startsWith('blob:')) {
      URL.revokeObjectURL(previews[page]);
    }

    setError("");
    setSelectedFiles((prev) => ({ ...prev, [page]: file }));
    setPreviews((prev) => ({
      ...prev,
      [page]: URL.createObjectURL(file),
    }));
  }

  function handleOverlayChange(page, value) {
    const numValue = Number(value);
    // Clamp value between 0 and 0.8
    const clampedValue = Math.max(0, Math.min(0.8, numValue));
    setOverlays((prev) => ({ ...prev, [page]: clampedValue }));
  }

  // ---------------- SAVE / UPDATE ----------------
  async function handleSave(page) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const fd = new FormData();
      fd.append("type", "page-backgrounds");
      fd.append("page", page);

      if (selectedFiles[page]) {
        fd.append("files", selectedFiles[page]);
      }

      fd.append(
        "data",
        JSON.stringify({
          ...(content?.data || {}),
          [page]: {
            ...(content?.data?.[page] || {}),
            overlay: overlays[page],
          },
        })
      );

      await upload("/api/admin/content", fd);
      setSuccess(`${page} background saved`);
      setSelectedFiles((prev) => {
        const copy = { ...prev };
        delete copy[page];
        return copy;
      });
      setPreviews((prev) => {
        const copy = { ...prev };
        if (copy[page] && copy[page].startsWith('blob:')) {
          URL.revokeObjectURL(copy[page]);
        }
        delete copy[page];
        return copy;
      });
      await fetchContent();
    } catch (err) {
      setError(err.message || "Error saving background");
    } finally {
      setSaving(false);
    }
  }

  // ---------------- DELETE ----------------
  async function handleDelete(page) {
    if (!content?._id) return;

    const confirmDelete = window.confirm(
      `Remove background for ${page.toUpperCase()} page?`
    );
    if (!confirmDelete) return;

    try {
      const updated = {
        ...(content.data || {}),
      };
      delete updated[page];

      await put(`/api/content/${content._id}`, { data: updated });

      setSuccess(`${page} background removed`);
      await fetchContent();
    } catch (err) {
      setError(err.message || "Error deleting background");
    }
  }

  if (loading) {
    return (
      <section>
        <h2>Page Background Management</h2>
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Page Background Management</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {PAGES.map((page) => {
        const existing = content?.data?.[page.key];
        const file = existing?.file || existing?.attachments?.[0];
        const preview = previews[page.key];

        return (
          <div
            key={page.key}
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              border: "1px solid #ddd",
              borderRadius: 6,
            }}
          >
            <h3>{page.label}</h3>

            {/* PREVIEW */}
            {(preview || fileHref(file)) && (
              <LazyImage
                src={safePath(preview || fileHref(file))}
                alt=""
                style={{
                  width: "100%",
                  maxHeight: 200,
                  objectFit: "cover",
                  borderRadius: 4,
                  marginBottom: "0.5rem",
                }}
              />
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(page.key, e.target.files[0])}
            />

            <div style={{ marginTop: "0.5rem" }}>
              <label>
                Overlay darkness ({overlays[page.key].toFixed(2)})
              </label>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={overlays[page.key]}
                onChange={(e) => handleOverlayChange(page.key, e.target.value)}
              />
            </div>

            <div style={{ marginTop: "0.5rem", display: "flex", gap: "8px" }}>
              <button onClick={() => handleSave(page.key)} disabled={saving}>
                {saving ? "Saving..." : "Save / Update"}
              </button>

              {file && (
                <button
                  onClick={() => handleDelete(page.key)}
                  style={{ background: "#fee2e2" }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
