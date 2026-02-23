import React, { useEffect, useState } from "react";
import { get } from "../utils/api";
import { cachedGet } from "../utils/apiCache";
import OptimizedImage from "./OptimizedImage";
import Loader from "./Loader";

// Cloudinary base for optimized images
const CLD = 'https://res.cloudinary.com/ddm1dgws8/image/upload';

// Default student life items — shown when no API data is available
const defaultStudentLifeItems = [
  { _id: 'sl-1', title: 'Sports Day', category: 'sports', description: 'Annual sports day featuring athletics, swimming, and team sports competitions where students showcase their athletic abilities.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5410.jpg`, featured: true },
  { _id: 'sl-2', title: 'Drama Club', category: 'clubs', description: 'Students showcase their acting talents in plays and drama performances throughout the school year.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5415.jpg` },
  { _id: 'sl-3', title: 'Science Fair', category: 'activities', description: 'Students present innovative science projects and experiments, pushing the boundaries of discovery.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5420.jpg` },
  { _id: 'sl-4', title: 'Cultural Day', category: 'traditions', description: 'Celebrating our diverse cultures and traditions through music, dance, food, and vibrant performances.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5427.jpg`, featured: true },
  { _id: 'sl-5', title: 'Athletics', category: 'sports', description: 'Track and field events where students compete at inter-school and regional level.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5432.jpg` },
  { _id: 'sl-6', title: 'Debate Club', category: 'clubs', description: 'Developing public speaking and critical thinking skills through competitive debate sessions.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5440.jpg` },
  { _id: 'sl-7', title: 'Community Service', category: 'activities', description: 'Students give back to the community through various outreach programs and volunteer work.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5456.jpg` },
  { _id: 'sl-8', title: 'Prize Giving Day', category: 'traditions', description: 'Annual ceremony recognizing academic and extracurricular achievements of our students.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5472.jpg` },
  { _id: 'sl-9', title: 'Volleyball', category: 'sports', description: 'Competitive volleyball training and tournaments building teamwork and sportsmanship.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5614.jpg` },
  { _id: 'sl-10', title: 'Music Club', category: 'clubs', description: 'Students explore musical talents through choir, instrumental music, and music festivals.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5501.jpg` },
  { _id: 'sl-11', title: 'Environmental Club', category: 'activities', description: 'Promoting environmental awareness through tree planting, recycling, and conservation activities.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5728.jpg` },
  { _id: 'sl-12', title: 'Founders Day', category: 'traditions', description: 'Commemorating the founding of our school with special ceremonies and celebrations.', imageUrl: `${CLD}/w_600,q_auto,f_auto/kangaru/DSC_5463.jpg` },
];

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
        const data = await cachedGet("/api/student-life", get);
        let itemList = Array.isArray(data) ? data : (data.items || []);
        
        // Fallback: use default items if API returns empty
        if (itemList.length === 0) {
          itemList = defaultStudentLifeItems;
        }
        
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
        // Fallback: use default items on error
        const itemList = defaultStudentLifeItems;
        const organized = {
          all: itemList,
          sports: itemList.filter((item) => item.category === "sports"),
          clubs: itemList.filter((item) => item.category === "clubs"),
          activities: itemList.filter((item) => item.category === "activities"),
          traditions: itemList.filter((item) => item.category === "traditions"),
        };
        setCategories(organized);
        setItems(itemList);
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
      {/* ================= HERO SECTION ================= */}
      <div
        className="student-life-hero"
        style={{
          position: "relative",
          width: "100vw",
          marginLeft: "50%",
          transform: "translateX(-50%)",
          minHeight: 380,
          overflow: "hidden",
          marginBottom: 30,
          background: `url('${CLD}/w_1200,q_auto,f_auto/kangaru/DSC_5384.jpg') center/cover no-repeat, linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
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
            <h2 style={{ fontSize: "2rem", margin: "0 0 10px 0" }}>Student Life</h2>
            <p style={{ fontSize: "1.1rem", margin: 0 }}>
              Explore the vibrant life and activities at Kangaru Girls Senior School
            </p>
          </div>
        </div>
      </div>

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
