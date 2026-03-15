import React, { useEffect, useState, useCallback } from "react";
import { get } from "../utils/api";
import { cachedGet } from "../utils/apiCache";
import OptimizedImage from "./OptimizedImage";

const CATEGORIES = [
  { value: "sports", label: "Sports", color: "#ef4444" },
  { value: "clubs", label: "Clubs", color: "#3b82f6" },
  { value: "activities", label: "Activities", color: "#f59e0b" },
  { value: "traditions", label: "Traditions", color: "#8b5cf6" },
  { value: "academics", label: "Academics", color: "#10b981" },
  { value: "community", label: "Community", color: "#ec4899" },
];

export default function StudentLife() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    cachedGet("/api/student-life-page", get)
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Close modal on Escape
  useEffect(() => {
    if (!selected) return;
    const handler = (e) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [selected]);

  const activities = data?.activities || [];
  const filtered =
    filter === "all"
      ? activities
      : activities.filter((a) => a.category === filter);

  // Get unique categories that have activities
  const activeCats = CATEGORIES.filter((c) =>
    activities.some((a) => a.category === c.value)
  );

  const featuredActivities = activities.filter((a) => a.featured);

  if (loading) {
    return (
      <div style={styles.loaderWrap}>
        <div style={styles.loader} />
      </div>
    );
  }

  return (
    <div style={styles.page} className="sl-page">
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section style={styles.hero}>
        {data?.heroImage && (
          <img
            src={data.heroImage}
            alt={data.title || "Student Life"}
            style={styles.heroImg}
          />
        )}
        <div style={styles.heroOverlay}>
          <h1 style={styles.heroTitle}>
            {data?.heroOverlayText || data?.title || "Student Life"}
          </h1>
          {data?.subtitle && (
            <p style={styles.heroSubtitle}>{data.subtitle}</p>
          )}
        </div>
      </section>

      {/* ─── FEATURED ACTIVITIES ──────────────────────────────────────── */}
      {featuredActivities.length > 0 && (
        <section style={styles.featuredSection}>
          <div style={styles.container}>
            <h2 style={styles.sectionTitle}>Featured Activities</h2>
            <div style={styles.featuredGrid} className="sl-featured-grid">
              {featuredActivities.map((a, i) => {
                const cat = CATEGORIES.find((c) => c.value === a.category);
                return (
                  <div
                    key={i}
                    style={styles.featuredCard}
                    className="sl-featured-card"
                    onClick={() => setSelected(a)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setSelected(a)
                    }
                  >
                    {a.imageUrl && (
                      <OptimizedImage
                        src={a.imageUrl}
                        alt={a.imageAlt || a.title}
                        style={styles.featuredImg}
                      />
                    )}
                    <div style={styles.featuredContent}>
                      <span
                        style={{
                          ...styles.badge,
                          background: cat?.color || "#6b7280",
                        }}
                      >
                        {cat?.label || a.category}
                      </span>
                      <h3 style={styles.featuredTitle}>{a.title}</h3>
                      <p style={styles.featuredDesc}>
                        {a.description?.slice(0, 120)}
                        {a.description?.length > 120 ? "..." : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── ALL ACTIVITIES ───────────────────────────────────────────── */}
      <section style={styles.allSection}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>All Activities</h2>

          {/* Category filter pills */}
          {activeCats.length > 1 && (
            <div style={styles.filterWrap}>
              <button
                onClick={() => setFilter("all")}
                style={{
                  ...styles.filterPill,
                  background: filter === "all" ? "#1f2937" : "#f3f4f6",
                  color: filter === "all" ? "#fff" : "#374151",
                }}
              >
                All
              </button>
              {activeCats.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setFilter(c.value)}
                  style={{
                    ...styles.filterPill,
                    background:
                      filter === c.value ? c.color : "#f3f4f6",
                    color: filter === c.value ? "#fff" : "#374151",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Activity grid */}
          <div style={styles.grid} className="sl-activities-grid">
            {filtered.map((a, i) => {
              const cat = CATEGORIES.find((c) => c.value === a.category);
              return (
                <div
                  key={i}
                  style={styles.card}
                  onClick={() => setSelected(a)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setSelected(a)
                  }
                  className="sl-card"
                >
                  <div style={styles.cardImgWrap}>
                    {a.imageUrl ? (
                      <OptimizedImage
                        src={a.imageUrl}
                        alt={a.imageAlt || a.title}
                        style={styles.cardImg}
                      />
                    ) : (
                      <div style={styles.cardPlaceholder}>🎓</div>
                    )}
                    <span
                      style={{
                        ...styles.cardBadge,
                        background: cat?.color || "#6b7280",
                      }}
                    >
                      {cat?.label || a.category}
                    </span>
                    {a.featured && (
                      <span style={styles.featuredBadge}>⭐</span>
                    )}
                  </div>
                  <div style={styles.cardBody}>
                    <h3 style={styles.cardTitle}>{a.title}</h3>
                    <p style={styles.cardDesc}>
                      {a.description?.slice(0, 100)}
                      {a.description?.length > 100 ? "..." : ""}
                    </p>
                    <span style={styles.viewMore}>Click to view →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p style={styles.empty}>No activities found in this category.</p>
          )}
        </div>
      </section>

      {/* ─── MODAL ────────────────────────────────────────────────────── */}
      {selected && (
        <div
          style={styles.modalOverlay}
          onClick={() => setSelected(null)}
        >
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              style={styles.modalClose}
              aria-label="Close"
            >
              ✕
            </button>

            {selected.imageUrl && (
              <img
                src={selected.imageUrl.replace(
                  /w_\d+/,
                  "w_1200"
                )}
                alt={selected.imageAlt || selected.title}
                style={styles.modalImg}
              />
            )}

            <div style={styles.modalBody}>
              {(() => {
                const cat = CATEGORIES.find(
                  (c) => c.value === selected.category
                );
                return (
                  <span
                    style={{
                      ...styles.badge,
                      background: cat?.color || "#6b7280",
                      marginBottom: 12,
                      display: "inline-block",
                    }}
                  >
                    {cat?.label || selected.category}
                  </span>
                );
              })()}
              <h2 style={styles.modalTitle}>{selected.title}</h2>
              <p style={styles.modalDesc}>{selected.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── INLINE STYLES (hover effects) ────────────────────────────── */}
      <style>{`
        .sl-card {
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        .sl-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
        }
        @keyframes slFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = {
  page: { minHeight: "100vh", background: "#fff" },

  // Loader
  loaderWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "60vh",
  },
  loader: {
    width: 40,
    height: 40,
    border: "4px solid #e5e7eb",
    borderTopColor: "#059669",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  // Hero
  hero: {
    position: "relative",
    height: "50vh",
    minHeight: 340,
    overflow: "hidden",
  },
  heroImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2))",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "40px 5%",
  },
  heroTitle: {
    color: "#fff",
    fontSize: "clamp(28px, 5vw, 48px)",
    fontWeight: 800,
    margin: 0,
    textShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: "clamp(14px, 2vw, 20px)",
    marginTop: 8,
    maxWidth: 680,
  },

  // Container
  container: { maxWidth: 1200, margin: "0 auto", padding: "0 20px" },

  // Section titles
  sectionTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center",
  },

  // Featured section
  featuredSection: {
    padding: "48px 0 32px",
    background: "#f9fafb",
  },
  featuredGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 24,
  },
  featuredCard: {
    display: "flex",
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  featuredImg: {
    width: 200,
    minHeight: 180,
    objectFit: "cover",
    flexShrink: 0,
  },
  featuredContent: { padding: 20, flex: 1 },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1f2937",
    margin: "8px 0 6px",
  },
  featuredDesc: { fontSize: 14, color: "#6b7280", margin: 0, lineHeight: 1.5 },

  // All section
  allSection: { padding: "48px 0 64px" },

  // Filters
  filterWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginBottom: 28,
  },
  filterPill: {
    padding: "6px 18px",
    borderRadius: 20,
    border: "none",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 14,
    transition: "background 0.2s, color 0.2s",
  },

  // Grid cards
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 24,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
    border: "1px solid #f3f4f6",
  },
  cardImgWrap: { position: "relative", height: 200 },
  cardImg: { width: "100%", height: "100%", objectFit: "cover" },
  cardPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 48,
    background: "#f3f4f6",
  },
  cardBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 12,
  },
  featuredBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    fontSize: 18,
  },
  cardBody: { padding: 16 },
  cardTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "#1f2937",
    margin: "0 0 6px",
  },
  cardDesc: {
    fontSize: 14,
    color: "#6b7280",
    margin: "0 0 10px",
    lineHeight: 1.5,
  },
  viewMore: {
    fontSize: 13,
    color: "#059669",
    fontWeight: 600,
  },

  // Badge
  badge: {
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 12px",
    borderRadius: 12,
  },

  // Empty state
  empty: {
    textAlign: "center",
    color: "#9ca3af",
    padding: 48,
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    animation: "slFadeIn 0.25s ease-out",
  },
  modal: {
    background: "#fff",
    borderRadius: 16,
    maxWidth: 720,
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative",
  },
  modalClose: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: 36,
    height: 36,
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalImg: {
    width: "100%",
    maxHeight: 400,
    objectFit: "cover",
  },
  modalBody: { padding: 24 },
  modalTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1f2937",
    margin: "8px 0 12px",
  },
  modalDesc: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
  },
};
