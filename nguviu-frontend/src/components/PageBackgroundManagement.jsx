import React, { useEffect, useState } from "react";
import { safePath } from "../utils/paths";

const PAGES = [
  { key: "home", label: "Home Page" },
  { key: "login", label: "Login Page" },
  { key: "signup", label: "Signup Page" },
];

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

  async function fetchContent() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/content/page-backgrounds");
      if (!res.ok) throw new Error("Failed to load page backgrounds");
      const data = await res.json();
      setContent(data || {});

      setOverlays(
        Object.fromEntries(
          PAGES.map((p) => [
            p.key,
            data?.data?.[p.key]?.overlay ?? 0.55,
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
    setSelectedFiles((prev) => ({ ...prev, [page]: file }));

    if (file) {
      setPreviews((prev) => ({
        ...prev,
        [page]: URL.createObjectURL(file),
      }));
    }
  }

  function handleOverlayChange(page, value) {
    setOverlays((prev) => ({ ...prev, [page]: Number(value) }));
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

      const res = await fetch("/api/admin/content", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("Failed to save background");

      await res.json();
      setSuccess(`${page} background saved`);
      setSelectedFiles((prev) => {
        const copy = { ...prev };
        delete copy[page];
        return copy;
      });
      setPreviews((prev) => {
        const copy = { ...prev };
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

      const res = await fetch(`/api/content/${content._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updated }),
      });

      if (!res.ok) throw new Error("Failed to delete background");

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
              <img
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
                Overlay darkness ({overlays[page.key]})
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
