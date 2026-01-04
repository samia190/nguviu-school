import React, { useEffect, useState } from "react";

function fileHref(file) {
  return file?.downloadUrl || file?.url || "";
}

const COLOR_OPTIONS = [
  { value: "#f3f4f6", label: "Light Grey" },
  { value: "#e0f2fe", label: "Light Blue" },
  { value: "#dcfce7", label: "Light Green" },
  { value: "#fef3c7", label: "Light Yellow" },
  { value: "#fee2e2", label: "Light Red" },
];

export default function EventsManagement() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Intro form
  const [textForm, setTextForm] = useState({ title: "", body: "" });
  const [savingText, setSavingText] = useState(false);

  // Upload files
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Attachments
  const attachments = content?.attachments || [];

  // Events list
  const [events, setEvents] = useState([]);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    color: COLOR_OPTIONS[0].value,
    linkUrl: "",
  });
  const [savingEvents, setSavingEvents] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/content/events");
      if (!res.ok) throw new Error("Failed to load events content");
      const data = await res.json();
      const safe = data || {};
      setContent(safe);
      setTextForm({
        title: safe.title || "School Events",
        body:
          safe.body ||
          safe.intro ||
          "Manage upcoming and past events, activities, and key dates.",
      });
      const existingEvents =
        (safe.data && Array.isArray(safe.data.events) && safe.data.events) || [];
      setEvents(existingEvents);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error loading events content");
      setLoading(false);
    }
  }

  // -------- Intro text --------
  function handleTextChange(e) {
    const { name, value } = e.target;
    setTextForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSaveText(e) {
    e.preventDefault();
    setSavingText(true);
    setError("");
    setSuccess("");
    try {
      const fd = new FormData();
      fd.append("type", "events");

      if (textForm.title && textForm.title.trim().length > 0) {
        fd.append("title", textForm.title);
      }
      if (textForm.body && textForm.body.trim().length > 0) {
        fd.append("body", textForm.body);
      }

      const res = await fetch("/api/admin/content", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Failed to save intro text");
      await res.json();
      setSuccess("Events intro text saved.");
      await fetchContent();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error saving intro text");
    } finally {
      setSavingText(false);
    }
  }

  // -------- File uploads --------
  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  }

  async function handleUploadFiles(e) {
    e.preventDefault();
    if (!selectedFiles.length) {
      setError("Please choose one or more files to upload.");
      return;
    }
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const fd = new FormData();
      fd.append("type", "events");
      selectedFiles.forEach((file) => {
        fd.append("files", file);
      });

      const res = await fetch("/api/admin/content", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Failed to upload files");
      await res.json();
      setSuccess("Event files uploaded successfully.");
      setSelectedFiles([]);
      await fetchContent();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error uploading files");
    } finally {
      setUploading(false);
    }
  }

  // -------- Media meta (title / description for each attachment) --------
  function handleMediaMetaChange(index, field, value) {
    setContent((prev) => {
      if (!prev) return prev;
      const nextAttachments = [...(prev.attachments || [])];
      nextAttachments[index] = { ...nextAttachments[index], [field]: value };
      return { ...prev, attachments: nextAttachments };
    });
  }

  async function handleSaveMediaDetails() {
    if (!content?._id) {
      setError("Cannot save media details: missing content ID.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/content/${content._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attachments: content.attachments || [],
        }),
      });
      if (!res.ok) throw new Error("Failed to save media details");
      const updated = await res.json();
      setContent(updated);
      setSuccess("Media titles and descriptions saved.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error saving media details");
    }
  }

  // -------- Events list --------
  function handleEventFormChange(e) {
    const { name, value } = e.target;
    setEventForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddEvent(e) {
    e.preventDefault();
    if (!content?._id) {
      setError(
        "Please save the events intro text or upload a file once before adding events."
      );
      return;
    }
    if (!eventForm.title.trim() && !eventForm.description.trim()) {
      setError("Please provide at least a title or description for the event.");
      return;
    }

    setSavingEvents(true);
    setError("");
    setSuccess("");

    try {
      const newEvent = {
        id: Date.now().toString(),
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date || null,
        location: eventForm.location || "",
        color: eventForm.color || COLOR_OPTIONS[0].value,
        linkUrl: eventForm.linkUrl || "",
        createdAt: new Date().toISOString(),
      };

      const updatedEvents = [newEvent, ...(events || [])];

      const res = await fetch(`/api/content/${content._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            ...(content.data || {}),
            events: updatedEvents,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to save events");
      const updated = await res.json();
      setContent(updated);
      const freshEvents =
        (updated.data && Array.isArray(updated.data.events) && updated.data.events) ||
        [];
      setEvents(freshEvents);
      setEventForm({
        title: "",
        description: "",
        date: "",
        location: "",
        color: eventForm.color,
        linkUrl: "",
      });
      setSuccess("Event added.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error adding event");
    } finally {
      setSavingEvents(false);
    }
  }

  function handleEventChange(index, field, value) {
    setEvents((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  async function handleSaveAllEvents() {
    if (!content?._id) {
      setError("Cannot save events: missing content ID.");
      return;
    }
    setSavingEvents(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/content/${content._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            ...(content.data || {}),
            events,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to save events");
      const updated = await res.json();
      setContent(updated);
      const freshEvents =
        (updated.data && Array.isArray(updated.data.events) && updated.data.events) ||
        [];
      setEvents(freshEvents);
      setSuccess("All events saved.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error saving events");
    } finally {
      setSavingEvents(false);
    }
  }

  function handleDeleteEvent(index) {
    setEvents((prev) => prev.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <section>
        <h2>Events Management</h2>
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Events Management</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {/* Intro text */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3>Events Intro Text</h3>
        <form onSubmit={handleSaveText}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", fontWeight: "bold" }}>Title</label>
            <input
              type="text"
              name="title"
              value={textForm.title}
              onChange={handleTextChange}
              style={{ width: "100%", padding: "6px" }}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", fontWeight: "bold" }}>Intro text</label>
            <textarea
              name="body"
              value={textForm.body}
              onChange={handleTextChange}
              rows={4}
              style={{ width: "100%", padding: "6px" }}
            />
          </div>
          <button type="submit" disabled={savingText}>
            {savingText ? "Saving..." : "Save Intro"}
          </button>
        </form>
      </div>

      {/* Upload media */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3>Upload Event Media</h3>
        <p style={{ fontSize: "0.85rem" }}>
          Upload images, videos, PDFs, or other files linked to events.
        </p>
        <form onSubmit={handleUploadFiles}>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ marginBottom: "0.5rem" }}
          />
          <br />
          <button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Files"}
          </button>
        </form>
      </div>

      {/* Media titles/descriptions */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3>Media Titles & Descriptions</h3>
        {attachments.length === 0 && <p>No media uploaded yet.</p>}

        {attachments.map((file, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "0.75rem",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          >
            <div style={{ marginBottom: "0.25rem", fontSize: "0.85rem" }}>
              File: {file.originalName || file.name || "(unnamed)"}{" "}
              {file.mimetype ? ` · ${file.mimetype}` : ""}{" "}
              {file.size ? ` · ${(file.size / 1024).toFixed(1)} KB` : ""}
            </div>

            <div style={{ marginBottom: "0.25rem" }}>
              <label style={{ display: "block", fontWeight: "bold" }}>Title</label>
              <input
                type="text"
                value={file.title || ""}
                onChange={(e) =>
                  handleMediaMetaChange(idx, "title", e.target.value)
                }
                placeholder="Title shown on public page"
                style={{ width: "100%", padding: "4px" }}
              />
            </div>

            <div style={{ marginBottom: "0.25rem" }}>
              <label style={{ display: "block", fontWeight: "bold" }}>
                Description / Caption
              </label>
              <textarea
                value={file.description || ""}
                onChange={(e) =>
                  handleMediaMetaChange(idx, "description", e.target.value)
                }
                rows={2}
                placeholder="Short description shown under the media"
                style={{ width: "100%", padding: "4px" }}
              />
            </div>

            {fileHref(file) && (
              <div style={{ fontSize: "0.85rem" }}>
                <a href={fileHref(file)} target="_blank" rel="noreferrer">
                  Open file
                </a>
              </div>
            )}
          </div>
        ))}

        {attachments.length > 0 && (
          <button onClick={handleSaveMediaDetails} style={{ marginTop: "0.5rem" }}>
            Save Media Titles & Descriptions
          </button>
        )}
      </div>

      {/* Events list */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3>Events List</h3>
        <form onSubmit={handleAddEvent} style={{ marginBottom: "1rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", fontWeight: "bold" }}>Event title</label>
            <input
              type="text"
              name="title"
              value={eventForm.title}
              onChange={handleEventFormChange}
              style={{ width: "100%", padding: "6px" }}
              placeholder="e.g. 'Prize Giving Day'"
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", fontWeight: "bold" }}>
              Description / details
            </label>
            <textarea
              name="description"
              value={eventForm.description}
              onChange={handleEventFormChange}
              rows={3}
              style={{ width: "100%", padding: "6px" }}
              placeholder="Details about this event..."
            />
          </div>
          <div style={{ marginBottom: "0.5rem", display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontWeight: "bold" }}>Date</label>
              <input
                type="date"
                name="date"
                value={eventForm.date}
                onChange={handleEventFormChange}
                style={{ width: "100%", padding: "4px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontWeight: "bold" }}>Location</label>
              <input
                type="text"
                name="location"
                value={eventForm.location}
                onChange={handleEventFormChange}
                style={{ width: "100%", padding: "4px" }}
                placeholder="e.g. School Hall"
              />
            </div>
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", fontWeight: "bold" }}>
              Container colour
            </label>
            <select
              name="color"
              value={eventForm.color}
              onChange={handleEventFormChange}
              style={{ padding: "4px" }}
            >
              {COLOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", fontWeight: "bold" }}>
              Optional link (more details)
            </label>
            <input
              type="text"
              name="linkUrl"
              value={eventForm.linkUrl}
              onChange={handleEventFormChange}
              style={{ width: "100%", padding: "4px" }}
              placeholder="https://..."
            />
          </div>
          <button type="submit" disabled={savingEvents}>
            {savingEvents ? "Adding..." : "Add Event"}
          </button>
        </form>

        {events.length === 0 && <p>No events added yet.</p>}

        {events.length > 0 && (
          <div>
            {events.map((ev, index) => (
              <div
                key={ev.id || ev._id || index}
                style={{
                  marginBottom: "0.75rem",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  backgroundColor: ev.color || "#f3f4f6",
                }}
              >
                <div style={{ marginBottom: "0.25rem" }}>
                  <label style={{ display: "block", fontWeight: "bold" }}>
                    Event title
                  </label>
                  <input
                    type="text"
                    value={ev.title || ""}
                    onChange={(e) => handleEventChange(index, "title", e.target.value)}
                    style={{ width: "100%", padding: "4px" }}
                  />
                </div>
                <div style={{ marginBottom: "0.25rem" }}>
                  <label style={{ display: "block", fontWeight: "bold" }}>
                    Description / details
                  </label>
                  <textarea
                    value={ev.description || ""}
                    onChange={(e) =>
                      handleEventChange(index, "description", e.target.value)
                    }
                    rows={3}
                    style={{ width: "100%", padding: "4px" }}
                  />
                </div>
                <div
                  style={{
                    marginBottom: "0.25rem",
                    display: "flex",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontWeight: "bold" }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={ev.date ? ev.date.substring(0, 10) : ""}
                      onChange={(e) =>
                        handleEventChange(index, "date", e.target.value)
                      }
                      style={{ width: "100%", padding: "4px" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontWeight: "bold" }}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={ev.location || ""}
                      onChange={(e) =>
                        handleEventChange(index, "location", e.target.value)
                      }
                      style={{ width: "100%", padding: "4px" }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: "0.25rem" }}>
                  <label style={{ display: "block", fontWeight: "bold" }}>
                    Container colour
                  </label>
                  <select
                    value={ev.color || COLOR_OPTIONS[0].value}
                    onChange={(e) =>
                      handleEventChange(index, "color", e.target.value)
                    }
                  >
                    {COLOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "0.25rem" }}>
                  <label style={{ display: "block", fontWeight: "bold" }}>
                    Optional link (more details)
                  </label>
                  <input
                    type="text"
                    value={ev.linkUrl || ""}
                    onChange={(e) =>
                      handleEventChange(index, "linkUrl", e.target.value)
                    }
                    style={{ width: "100%", padding: "4px" }}
                    placeholder="https://..."
                  />
                </div>
                {ev.createdAt && (
                  <div style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                    Created:{" "}
                    {new Date(ev.createdAt).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(index)}
                  style={{
                    backgroundColor: "#fee2e2",
                    border: "1px solid #fecaca",
                    padding: "2px 6px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Delete event
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleSaveAllEvents}
              disabled={savingEvents}
              style={{ marginTop: "0.5rem" }}
            >
              {savingEvents ? "Saving..." : "Save All Events"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
