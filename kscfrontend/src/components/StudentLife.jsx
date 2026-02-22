import React, { useEffect, useState } from "react";
import { get } from "../utils/api";
import OptimizedImage from "./OptimizedImage";
import Loader from "./Loader";

const categoryColors = {
  sports: "#ef4444",
  clubs: "#3b82f6",
  activities: "#f59e0b",
  traditions: "#8b5cf6",
};

const itemsWrapperStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "1.5rem",
  alignItems: "stretch",
  marginTop: "1rem",
};

const itemCardBaseStyle = {
  flex: "1 1 280px",
  maxWidth: "380px",
  borderRadius: "12px",
  padding: "1.25rem",
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  boxSizing: "border-box",
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

export default function StudentLife() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [categories, setCategories] = useState({
    all: [],
    sports: [],
    clubs: [],
    activities: [],
    traditions: [],
  });

  useEffect(() => {
    async function fetchStudentLife() {
      try {
        setLoading(true);
        setError("");
        // Fetch from /api/student-life endpoint
        const data = await get("/api/student-life");
        const itemList = Array.isArray(data) ? data : (data.items || []);
        
        // Organize by category
        const organized = {
          all: itemList,
          sports: itemList.filter((item) => item.category === "sports"),
          clubs: itemList.filter((item) => item.category === "clubs"),
          activities: itemList.filter((item) => item.category === "activities"),
          traditions: itemList.filter((item) => item.category === "traditions"),
        };

        setCategories(organized);
        setItems(itemList);
      } catch (err) {
        console.error("StudentLife fetch error:", err);
        setError("Failed to load student life items.");
      } finally {
        setLoading(false);
      }
    }

    fetchStudentLife();
  }, []);

  const filteredItems = filter === "all" ? items : (categories[filter] || []);

  if (loading) {
    return (
      <main className="page student-life-page">
        <h1>Student Life</h1>
        <Loader message="Loading student life activities…" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="page student-life-page" style={{ padding: "1rem 8px" }}>
        <h1>Student Life</h1>
        <p style={{ color: "red" }}>{error}</p>
      </main>
    );
  }

  return (
    <main className="page student-life-page" style={{ padding: "1rem 8px", textAlign: "left" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: "0.5rem", textAlign: "left" }}>Student Life</h1>
        <p style={{ margin: 0, textAlign: "left", color: "#666" }}>
          Explore the vibrant life and activities at Kangaru Girls Senior School
        </p>
      </div>

      {/* Category Filter */}
      {Object.keys(categories).length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginBottom: "2rem",
            flexWrap: "wrap",
          }}
        >
          {Object.entries(categories).map(([cat, items]) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: filter === cat ? "2px solid #667eea" : "1px solid #ddd",
                backgroundColor: filter === cat ? "#667eea" : "#fff",
                color: filter === cat ? "#fff" : "#333",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: filter === cat ? "600" : "normal",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (filter !== cat) {
                  e.currentTarget.style.borderColor = "#667eea";
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== cat) {
                  e.currentTarget.style.borderColor = "#ddd";
                }
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)} ({items.length})
            </button>
          ))}
        </div>
      )}

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <section style={{ marginTop: "1.5rem" }}>
          <h2>
            {filter === "all"
              ? "All Activities"
              : `${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
          </h2>
          <div style={itemsWrapperStyle}>
            {filteredItems.map((item) => {
              const categoryColor = categoryColors[item.category] || "#667eea";

              return (
                <article
                  key={item._id}
                  style={itemCardBaseStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 12px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 6px rgba(0,0,0,0.1)";
                  }}
                >
                  {/* Item Image */}
                  {item.imageUrl && (
                    <div
                      style={{
                        width: "100%",
                        height: "220px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        marginBottom: "1rem",
                        backgroundColor: "#f0f0f0",
                        flexShrink: 0,
                      }}
                    >
                      <OptimizedImage
                        src={item.imageUrl}
                        alt={item.title}
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

                  {/* Category Badge */}
                  <div
                    style={{
                      display: "inline-block",
                      marginBottom: "0.75rem",
                      padding: "0.35rem 0.85rem",
                      backgroundColor: categoryColor,
                      color: "#fff",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      width: "fit-content",
                    }}
                  >
                    {item.category}
                  </div>

                  {/* Item Title */}
                  <h3 style={{ marginTop: 0, marginBottom: "0.75rem", color: "#1f2937" }}>
                    {item.title}
                  </h3>

                  {/* Item Description */}
                  {item.description && (
                    <p
                      style={{
                        fontSize: "0.95rem",
                        margin: "0 0 1rem 0",
                        lineHeight: "1.6",
                        color: "#4b5563",
                        flex: 1,
                      }}
                    >
                      {item.description}
                    </p>
                  )}

                  {/* Featured Badge */}
                  {item.featured && (
                    <div
                      style={{
                        display: "inline-block",
                        padding: "0.35rem 0.75rem",
                        backgroundColor: "#fef3c7",
                        color: "#b45309",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        marginTop: "auto",
                        width: "fit-content",
                      }}
                    >
                      ⭐ Featured
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            background: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <p style={{ color: "#999" }}>
            No {filter === "all" ? "" : filter} activities available at this time.
          </p>
        </div>
      )}
    </main>
  );
}
