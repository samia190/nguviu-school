import React, { useEffect, useState } from "react";
import { get } from "../utils/api";
import { cachedGet } from "../utils/apiCache";
import OptimizedImage from "./OptimizedImage";
import Loader from "./Loader";

const CATEGORIES = [
  { value: "academic", label: "Academic", color: "#3b82f6" },
  { value: "sports", label: "Sports", color: "#10b981" },
  { value: "cultural", label: "Cultural", color: "#f59e0b" },
  { value: "religious", label: "Religious", color: "#8b5cf6" },
  { value: "administrative", label: "Administrative", color: "#6366f1" },
  { value: "social", label: "Social", color: "#ec4899" },
  { value: "other", label: "Other", color: "#6b7280" },
];

export default function Events() {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("all"); // "all" | "upcoming" | "past"
  const [selectedEvent, setSelectedEvent] = useState(null); // modal

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await cachedGet("/api/events-page", get);
        setPage(data);
      } catch (err) {
        console.error("Events fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main className="page events-page">
        <h1>School Events</h1>
        <Loader message="Loading events…" />
      </main>
    );
  }

  const title = page?.title || "School Events";
  const intro = page?.intro || "";
  const heroImage = page?.heroImage || "";
  const heroOverlayText = page?.heroOverlayText || "";
  const allEvents = page?.events || [];

  // Split into upcoming / past
  const now = new Date();
  const upcoming = allEvents.filter((e) => e.date && new Date(e.date) >= now);
  const past = allEvents.filter((e) => !e.date || new Date(e.date) < now);

  // Apply view filter
  let displayEvents = allEvents;
  if (view === "upcoming") displayEvents = upcoming;
  else if (view === "past") displayEvents = past;

  // Apply category filter
  if (filter !== "all") displayEvents = displayEvents.filter((e) => e.category === filter);

  // Featured events (from full list, always show)
  const featured = allEvents.filter((e) => e.featured);

  // Unique categories present
  const activeCats = [...new Set(allEvents.map((e) => e.category))];

  return (
    <main className="page events-page" style={{ padding: "1rem 8px", textAlign: "left" }}>
      {/* ── HERO ── */}
      {heroImage && (
        <div
          className="events-hero"
          style={{
            position: "relative",
            width: "100vw",
            marginLeft: "50%",
            transform: "translateX(-50%)",
            minHeight: "clamp(180px, 38vh, 380px)",
            overflow: "hidden",
            marginBottom: 30,
            background: `url('${encodeURI(heroImage)}') center/cover no-repeat, linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.65))" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ maxWidth: 720, width: "100%", padding: "16px 20px", borderRadius: 10, backgroundColor: "rgba(0,0,0,0.45)", color: "#fff", textAlign: "center" }}>
              <h2 style={{ fontSize: "2rem", margin: "0 0 10px 0" }}>{title}</h2>
              {heroOverlayText && <p style={{ fontSize: "1.1rem", margin: 0 }}>{heroOverlayText}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>{title}</h1>
        {intro && <p style={{ margin: 0, color: "#666" }}>{intro}</p>}
      </div>

      {/* ── FEATURED EVENTS ── */}
      {featured.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>⭐ Featured Events</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {featured.map((ev) => (
              <EventCard key={ev._id} event={ev} featured onSelect={setSelectedEvent} />
            ))}
          </div>
        </section>
      )}

      {/* ── FILTERS ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: "1rem" }}>
        {/* View toggle */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { key: "all", label: `All (${allEvents.length})` },
            { key: "upcoming", label: `Upcoming (${upcoming.length})` },
            { key: "past", label: `Past (${past.length})` },
          ].map((v) => (
            <button key={v.key} onClick={() => setView(v.key)} style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: view === v.key ? 700 : 400, background: view === v.key ? "#1e293b" : "#e2e8f0", color: view === v.key ? "#fff" : "#334155", fontSize: 13 }}>
              {v.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button onClick={() => setFilter("all")} style={{ padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, background: filter === "all" ? "#1e293b" : "#f1f5f9", color: filter === "all" ? "#fff" : "#475569" }}>All</button>
          {CATEGORIES.filter((c) => activeCats.includes(c.value)).map((c) => (
            <button key={c.value} onClick={() => setFilter(c.value)} style={{ padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, background: filter === c.value ? c.color : "#f1f5f9", color: filter === c.value ? "#fff" : "#475569" }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── EVENT CARDS ── */}
      {displayEvents.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
          {displayEvents.map((ev) => (
            <EventCard key={ev._id} event={ev} onSelect={setSelectedEvent} />
          ))}
        </div>
      ) : (
        <div style={{ padding: "2rem", textAlign: "center", background: "#f5f5f5", borderRadius: 8 }}>
          <p style={{ color: "#999" }}>No events match the current filter. Try a different category or view.</p>
        </div>
      )}

      {/* ── EVENT DETAIL MODAL ── */}
      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </main>
  );
}

// ─── Event Card Component ─────────────────────────────────────
function EventCard({ event, featured: isFeaturedSection, onSelect }) {
  const catObj = CATEGORIES.find((c) => c.value === event.category) || CATEGORIES[6];
  const dateLabel = event.date
    ? new Date(event.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : null;
  const isPast = event.date && new Date(event.date) < new Date();

  return (
    <article
      onClick={() => onSelect?.(event)}
      style={{
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: isFeaturedSection ? "0 4px 20px rgba(102,126,234,0.15)" : "0 2px 8px rgba(0,0,0,0.08)",
        backgroundColor: event.color || "#fff",
        border: isFeaturedSection ? "2px solid #667eea" : "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = isFeaturedSection ? "0 4px 20px rgba(102,126,234,0.15)" : "0 2px 8px rgba(0,0,0,0.08)"; }}
    >
      {/* Image */}
      {event.imageUrl && (
        <div style={{ width: "100%", height: 200, overflow: "hidden", backgroundColor: "#f0f0f0", flexShrink: 0 }}>
          <OptimizedImage
            src={event.imageUrl}
            alt={event.imageAlt || event.title}
            priority={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}

      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Category badge + Date */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: catObj.color, color: "#fff" }}>{catObj.label}</span>
          {dateLabel && (
            <span style={{ fontSize: 12, color: isPast ? "#9ca3af" : "#667eea", fontWeight: 600 }}>
              {isPast ? "Past" : "📅"} {dateLabel}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: "1.1rem" }}>{event.title}</h3>

        {/* Location */}
        {event.location && (
          <p style={{ fontSize: "0.85rem", margin: "0 0 6px 0", color: "#666" }}>📍 {event.location}</p>
        )}

        {/* Description (truncated on card) */}
        {event.description && (
          <p style={{ fontSize: "0.9rem", margin: "0.5rem 0", lineHeight: 1.5, color: "#333", flex: 1 }}>
            {event.description.length > 120 ? event.description.slice(0, 120) + "…" : event.description}
          </p>
        )}

        {/* Footer badges */}
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {event.featured && (
            <span style={{ display: "inline-block", padding: "3px 10px", backgroundColor: "#fef3c7", color: "#b45309", borderRadius: 4, fontSize: "0.75rem", fontWeight: 600 }}>⭐ Featured</span>
          )}
          {event.linkUrl && (
            <a href={event.linkUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: "inline-block", padding: "3px 10px", backgroundColor: "#e0f2fe", color: "#0369a1", borderRadius: 4, fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}>
              🔗 More Info
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Event Detail Modal ───────────────────────────────────────
function EventModal({ event, onClose }) {
  const catObj = CATEGORIES.find((c) => c.value === event.category) || CATEGORIES[6];

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : null;
  const formatTime = (d) =>
    d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : null;

  const startDate = formatDate(event.date);
  const startTime = formatTime(event.date);
  const endDate = formatDate(event.endDate);
  const endTime = formatTime(event.endDate);
  const isPast = event.date && new Date(event.date) < new Date();

  // Close on Escape
  React.useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 14,
          maxWidth: 720, width: "100%", maxHeight: "90vh",
          overflow: "auto", position: "relative",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          animation: "fadeInUp 0.25s ease-out",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 12, zIndex: 10,
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(0,0,0,0.5)", color: "#fff",
            border: "none", fontSize: 20, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ✕
        </button>

        {/* Hero image */}
        {event.imageUrl && (
          <div style={{ width: "100%", height: 320, overflow: "hidden", borderRadius: "14px 14px 0 0", background: "#f0f0f0" }}>
            <OptimizedImage
              src={event.imageUrl}
              alt={event.imageAlt || event.title}
              priority
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: "24px 28px 28px" }}>
          {/* Category + status badges */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: catObj.color, color: "#fff" }}>{catObj.label}</span>
            {event.featured && (
              <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#fef3c7", color: "#b45309" }}>⭐ Featured</span>
            )}
            {isPast && (
              <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#f1f5f9", color: "#64748b" }}>Past Event</span>
            )}
          </div>

          {/* Title */}
          <h2 style={{ margin: "0 0 16px", fontSize: "1.6rem", color: "#1e293b", lineHeight: 1.3 }}>{event.title}</h2>

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
            {startDate && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 22 }}>📅</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#334155" }}>Date</p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, color: "#475569" }}>{startDate}</p>
                  {startTime && <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>{startTime}</p>}
                  {endDate && endDate !== startDate && (
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>to {endDate} {endTime || ""}</p>
                  )}
                  {endDate && endDate === startDate && endTime && (
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>– {endTime}</p>
                  )}
                </div>
              </div>
            )}
            {event.location && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 22 }}>📍</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#334155" }}>Location</p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, color: "#475569" }}>{event.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Full description */}
          {event.description && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#334155" }}>About This Event</h3>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "#374151", margin: 0, whiteSpace: "pre-wrap" }}>
                {event.description}
              </p>
            </div>
          )}

          {/* Action link */}
          {event.linkUrl && (
            <a
              href={event.linkUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 24px", background: "#667eea", color: "#fff",
                borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 14,
              }}
            >
              🔗 More Information
            </a>
          )}
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
