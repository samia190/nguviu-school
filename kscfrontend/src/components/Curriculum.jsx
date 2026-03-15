// src/components/Curriculum.jsx
import { useEffect, useState } from "react";
import { get } from "../utils/api";
import { cachedGet } from "../utils/apiCache";
import OptimizedImage from "./OptimizedImage";
import Loader from "./Loader";

export default function Curriculum() {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedStream, setExpandedStream] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    setLoading(true);
    cachedGet("/api/curriculum-page", () => get("/api/curriculum-page"))
      .then((data) => {
        setPage(data);
        // Auto-expand first stream
        if (data.streams?.length > 0) setExpandedStream(0);
      })
      .catch(() => setError("Failed to load curriculum information."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading curriculum..." />;
  if (error) return <div className="page-error">{error}</div>;
  if (!page) return null;

  return (
    <div className="page curriculum-page">
      {/* Hero Section */}
      {page.heroImage ? (
        <div className="curriculum-hero" style={{ position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 32 }}>
          <OptimizedImage src={page.heroImage} alt={page.title} style={{ width: "100%", maxHeight: 350, objectFit: "cover" }} />
          {page.heroOverlayText && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}>
              <h1 style={{ color: "#fff", fontSize: "clamp(1.5rem, 4vw, 2.8rem)", textAlign: "center", textShadow: "0 2px 12px rgba(0,0,0,.5)" }}>
                {page.heroOverlayText}
              </h1>
            </div>
          )}
        </div>
      ) : (
        <h1>{page.title}</h1>
      )}

      {page.subtitle && <p className="page-subtitle" style={{ fontSize: "1.1rem", color: "#6b7280", marginBottom: 24, textAlign: "center" }}>{page.subtitle}</p>}

      {page.intro && <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "#374151", maxWidth: 900, margin: "0 auto 32px", textAlign: "center" }}>{page.intro}</p>}

      {/* School Profile */}
      {(page.schoolName || page.schoolLocation) && (
        <section className="school-profile-section" style={{ background: "#f0fdf4", borderRadius: 12, padding: "20px 24px", marginBottom: 32 }}>
          <h2 style={{ marginBottom: 12 }}>🏫 School Profile</h2>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {page.schoolName && <div><strong>School:</strong> {page.schoolName}</div>}
            {page.schoolLocation && <div><strong>Location:</strong> {page.schoolLocation}</div>}
            {page.schoolCategory && <div><strong>Category:</strong> {page.schoolCategory}</div>}
          </div>
        </section>
      )}

      {/* Subject Combinations */}
      {page.streams?.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 8 }}>📚 Subject Combinations Offered</h2>
          <p style={{ color: "#6b7280", marginBottom: 20 }}>
            Available subject combinations organized by stream
            <span style={{ color: "#9ca3af" }}> — {page.streams.reduce((t, s) => t + (s.combinations?.length || 0), 0)} total combinations</span>
          </p>

          {page.streams.map((stream, si) => (
            <div key={si} style={{ border: "1px solid #e5e7eb", borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
              {/* Stream header (clickable) */}
              <button
                onClick={() => setExpandedStream(expandedStream === si ? null : si)}
                style={{
                  width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 20px", background: expandedStream === si ? "#f9fafb" : "#fff",
                  border: "none", cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                  {stream.icon} {stream.name}
                  <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: "0.9rem", marginLeft: 8 }}>
                    ({stream.combinations?.length || 0} combinations)
                  </span>
                </span>
                <span style={{ fontSize: 18, transition: "transform .2s", transform: expandedStream === si ? "rotate(180deg)" : "none" }}>▼</span>
              </button>

              {/* Expanded combinations */}
              {expandedStream === si && (
                <div style={{ padding: "0 20px 16px" }}>
                  <div className="curriculum-combos-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                    {(stream.combinations || []).map((combo, ci) => (
                      <div key={ci} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 14px", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontWeight: 600, color: "#7c3aed", fontSize: "0.85rem", marginBottom: 6 }}>{combo.code}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {(combo.subjects || []).map((subject, subi) => (
                            <span key={subi} style={{
                              background: "#ede9fe", color: "#5b21b6", padding: "3px 10px",
                              borderRadius: 20, fontSize: "0.82rem", fontWeight: 500,
                            }}>
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Content Sections */}
      {page.sections?.length > 0 && (
        <section>
          {/* Section nav pills */}
          {page.sections.length > 1 && (
            <div className="curriculum-section-pills" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              <button
                onClick={() => setActiveSection(null)}
                style={{
                  padding: "6px 14px", borderRadius: 20, border: activeSection === null ? "2px solid #7c3aed" : "1px solid #d1d5db",
                  background: activeSection === null ? "#ede9fe" : "#fff", fontWeight: activeSection === null ? 600 : 400, cursor: "pointer", fontSize: "0.85rem",
                }}
              >
                All
              </button>
              {page.sections.map((sec, si) => (
                <button
                  key={si}
                  onClick={() => setActiveSection(si)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, border: activeSection === si ? "2px solid #7c3aed" : "1px solid #d1d5db",
                    background: activeSection === si ? "#ede9fe" : "#fff", fontWeight: activeSection === si ? 600 : 400, cursor: "pointer", fontSize: "0.85rem",
                  }}
                >
                  {sec.heading}
                </button>
              ))}
            </div>
          )}

          {/* Section content */}
          {page.sections
            .filter((_, si) => activeSection === null || activeSection === si)
            .map((sec, idx) => (
              <div key={idx} style={{ marginBottom: 32, padding: 24, background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
                <h3 style={{ marginBottom: 12, color: "#1f2937" }}>{sec.heading}</h3>

                <div className="curriculum-section-flex" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    {sec.body && <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#374151" }}>{sec.body}</p>}
                  </div>
                  {sec.imageUrl && (
                    <div style={{ flexShrink: 0 }}>
                      <OptimizedImage src={sec.imageUrl} alt={sec.heading} style={{ maxWidth: 300, borderRadius: 10 }} />
                    </div>
                  )}
                </div>

                {/* Downloadable files */}
                {sec.files?.length > 0 && (
                  <div style={{ marginTop: 16, padding: "12px 16px", background: "#f9fafb", borderRadius: 8 }}>
                    <strong style={{ fontSize: "0.9rem", marginBottom: 8, display: "block" }}>📎 Downloads</strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {sec.files.map((f, fi) => (
                        <a
                          key={fi}
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
                            background: "#fff", border: "1px solid #d1d5db", borderRadius: 8,
                            color: "#2563eb", textDecoration: "none", fontSize: "0.85rem",
                          }}
                        >
                          📄 {f.name || "Download"}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </section>
      )}
    </div>
  );
}
