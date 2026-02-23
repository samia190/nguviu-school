import React, { useEffect, useState } from "react";
import { get } from "../utils/api";
import { cachedGet } from "../utils/apiCache";
import OptimizedImage from "./OptimizedImage";
import Loader from "./Loader";

// Cloudinary base for optimized images
const CLD = 'https://res.cloudinary.com/ddm1dgws8/image/upload';

// Default events — shown when no API data is available
const defaultEvents = [
  { _id: 'ev-1', title: 'Open Day', date: '2025-02-15', location: 'School Campus', description: 'Visit our campus and learn about our programs, meet teachers, and experience Kangaru Girls School firsthand.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5443.jpg`, featured: true },
  { _id: 'ev-2', title: 'Science & Innovation Week', date: '2025-03-10', location: 'Science Block', description: 'A week dedicated to science experiments, innovation showcases, and hands-on STEM activities.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5447.jpg` },
  { _id: 'ev-3', title: 'Inter-School Sports', date: '2025-04-05', location: 'Sports Ground', description: 'Competitive sports events with neighboring schools in athletics, volleyball, and more.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5462.jpg`, featured: true },
  { _id: 'ev-4', title: 'Career Day', date: '2025-05-20', location: 'School Hall', description: 'Professionals from various fields share career guidance and mentorship with students.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5489.jpg` },
  { _id: 'ev-5', title: 'Music Festival', date: '2025-06-15', location: 'School Grounds', description: 'Annual music festival featuring student performances, choir competitions, and instrumental showcases.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5502.jpg` },
  { _id: 'ev-6', title: 'Graduation Ceremony', date: '2025-11-28', location: 'Main Hall', description: 'Celebrating our graduating class achievements and welcoming them to the next chapter of their lives.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5515.jpg`, featured: true },
];


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
        const data = await cachedGet("/api/events?active=true", get);
        let eventList = Array.isArray(data) ? data : (data.events || []);
        
        // Fallback: use default events if API returns empty
        if (eventList.length === 0) {
          eventList = defaultEvents;
        }
        setEvents(eventList);
      } catch (err) {
        console.error("Events fetch error:", err);
        // Fallback: use default events on error
        setEvents(defaultEvents);
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
      {/* ================= HERO SECTION ================= */}
      <div
        className="events-hero"
        style={{
          position: "relative",
          width: "100vw",
          marginLeft: "50%",
          transform: "translateX(-50%)",
          minHeight: 380,
          overflow: "hidden",
          marginBottom: 30,
          background: `url('${CLD}/w_1200,q_auto,f_auto/kangaru/DSC_5454.jpg') center/cover no-repeat, linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.65))",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              maxWidth: 720,
              width: "100%",
              padding: "16px 20px",
              borderRadius: 10,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              color: "#ffffff",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: "2rem", margin: "0 0 10px 0" }}>School Events</h2>
            <p style={{ fontSize: "1.1rem", margin: 0 }}>
              Discover our upcoming and recent events at Kangaru Girls Senior School
            </p>
          </div>
        </div>
      </div>

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
