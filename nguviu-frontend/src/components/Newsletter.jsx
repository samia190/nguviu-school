import React, { useEffect, useState } from "react";
import { get } from "../utils/api";
import EditableFileList from "./EditableFileList";

const postsWrapperStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "1rem",
  alignItems: "stretch",
  marginTop: "1rem",
};

const postCardBaseStyle = {
  flex: "1 1 260px",
  maxWidth: "360px",
  borderRadius: "8px",
  padding: "0.75rem 1rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  boxSizing: "border-box",
};

const eventsCardStyle = {
  borderRadius: "8px",
  padding: "0.75rem 1rem",
  backgroundColor: "#eef2ff",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  marginTop: "1rem",
};

export default function Newsletter() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({}); // for "Read more" per post

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        setError("");
        const data = await get("/api/content/newsletter");
        setContent(data || {});
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load newsletter content.");
        setLoading(false);
      }
    }

    fetchContent();
  }, []);

  function toggleReadMore(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (loading) {
    return (
      <main className="page newsletter-page">
        <h1>Newsletter</h1>
        <p>Loading…</p>
      </main>
    );
  }

  const introTitle = content?.title || "School Newsletter";
  const introBody =
    content?.body ||
    content?.intro ||
    "Stay updated with news, announcements, and highlights from our school.";

  const posts = (content?.data && content.data.posts) || [];
  const attachments = content?.attachments || [];

  return (
    <main className="page newsletter-page" style={{ padding: "1rem 8px" }}>
      <header style={{ marginBottom: "1rem" }}>
        <h1>{introTitle}</h1>
        <p>{introBody}</p>
      </header>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* EVENTS / QUICK LINK SECTION */}
      <section style={eventsCardStyle}>
        <h2 style={{ marginTop: 0 }}>Events & Important Dates</h2>
        <p style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          Keep an eye on upcoming school events, academic calendars, and key
          activities.
        </p>
        <a
          href="#events"
          onClick={(e) => {
            e.preventDefault();
            if (window.setRoute) {
              window.setRoute("events");
            }
          }}
          style={{
            fontWeight: "bold",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Go to Events page &raquo;
        </a>
      </section>

      {/* NEWSLETTER POSTS AS COLOURED CONTAINERS */}
      {posts.length > 0 && (
        <section style={{ marginTop: "1.5rem" }}>
          <h2>Newsletter Highlights</h2>
          <div style={postsWrapperStyle}>
            {posts.map((post, index) => {
              const id = post.id || post._id || String(index);
              const bgColor = post.color || "#f3f4f6";
              const isOpen = !!expanded[id];
              const fullText = post.body || "";
              const shortText =
                fullText.length > 280 ? fullText.slice(0, 280) + "…" : fullText;

              return (
                <article
                  key={id}
                  style={{ ...postCardBaseStyle, backgroundColor: bgColor }}
                >
                  <h3 style={{ marginTop: 0 }}>{post.title || "Newsletter item"}</h3>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {isOpen ? fullText : shortText}
                  </p>
                  {fullText.length > 280 && (
                    <button
                      type="button"
                      onClick={() => toggleReadMore(id)}
                      style={{
                        border: "none",
                        background: "none",
                        padding: 0,
                        color: "#2563eb",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      {isOpen ? "Show less" : "Read more"}
                    </button>
                  )}
                  {post.createdAt && (
                    <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                      Posted on{" "}
                      {new Date(post.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ATTACHMENTS / MEDIA (IMAGES, VIDEOS, DOCS) */}
      {attachments.length > 0 && (
        <section style={{ marginTop: "1.5rem" }}>
          <h2>Newsletter Media & Downloads</h2>
          {/* Public page: not an admin, editing is in admin dashboard */}
          <EditableFileList files={attachments} isAdmin={false} />
        </section>
      )}
    </main>
  );
}
