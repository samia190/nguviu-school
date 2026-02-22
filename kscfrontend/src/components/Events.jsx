import React, { useEffect, useState } from "react";
import { get } from "../utils/api";
import OptimizedImage from "./OptimizedImage";
import Loader from "./Loader";


const eventsWrapperStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "1rem",
  alignItems: "stretch",
  marginTop: "1rem",
};

const eventCardBaseStyle = {
  flex: "1 1 280px",
  maxWidth: "380px",
  borderRadius: "8px",
  padding: "1rem",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  boxSizing: "border-box",
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        setError("");
        // Fetch from new /api/events endpoint
        const data = await get("/api/events?active=true");
        const eventList = Array.isArray(data) ? data : (data.events || []);
        setEvents(eventList);
      } catch (err) {
        console.error("Events fetch error:", err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <main className="page events-page">
        <h1>School Events</h1>
        <Loader message="Loading events…" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="page events-page" style={{ padding: "1rem 8px" }}>
        <h1>School Events</h1>
        <p style={{ color: "red" }}>{error}</p>
      </main>
    );
  }

  return (
    <main className="page events-page" style={{ padding: "1rem 8px", textAlign: "left" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: "0.5rem", textAlign: "left" }}>School Events</h1>
        <p style={{ margin: 0, textAlign: "left", color: "#666" }}>
          Discover our upcoming and recent events at Kangaru Girls Senior School
        </p>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* EVENTS CARDS */}
      {events.length > 0 ? (
        <section style={{ marginTop: "1.5rem" }}>
          <h2>Upcoming & Recent Events</h2>
          <div style={eventsWrapperStyle}>
            {events.map((event) => {
              const dateLabel = event.date
                ? new Date(event.date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : null;

              return (
                <article
                  key={event._id}
                  style={eventCardBaseStyle}
                >
                  {/* Event Image */}
                  {event.imageUrl && (
                    <div
                      style={{
                        width: "100%",
                        height: "200px",
                        borderRadius: "6px",
                        overflow: "hidden",
                        marginBottom: "1rem",
                        backgroundColor: "#f0f0f0",
                        flexShrink: 0,
                      }}
                    >
                      <OptimizedImage
                        src={event.imageUrl}
                        alt={event.title}
                        priority={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  )}

                  {/* Event Title */}
                  <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
                    {event.title}
                  </h3>

                  {/* Date */}
                  {dateLabel && (
                    <p style={{ fontSize: "0.9rem", margin: "0 0 0.5rem 0", color: "#666" }}>
                      <strong>📅 Date:</strong> {dateLabel}
                    </p>
                  )}

                  {/* Location */}
                  {event.location && (
                    <p style={{ fontSize: "0.9rem", margin: "0 0 0.5rem 0", color: "#666" }}>
                      <strong>📍 Location:</strong> {event.location}
                    </p>
                  )}

                  {/* Description */}
                  {event.description && (
                    <p
                      style={{
                        fontSize: "0.95rem",
                        margin: "0.5rem 0",
                        lineHeight: "1.5",
                        color: "#333",
                        flex: 1,
                      }}
                    >
                      {event.description}
                    </p>
                  )}

                  {/* Featured Badge */}
                  {event.featured && (
                    <div
                      style={{
                        display: "inline-block",
                        marginTop: "0.75rem",
                        padding: "0.25rem 0.75rem",
                        backgroundColor: "#fef3c7",
                        color: "#b45309",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                      }}
                    >
                      ⭐ Featured Event
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <div style={{ padding: "2rem", textAlign: "center", background: "#f5f5f5", borderRadius: "8px" }}>
          <p style={{ color: "#999" }}>No events currently available. Check back soon!</p>
        </div>
      )}
    </main>
  );
}
