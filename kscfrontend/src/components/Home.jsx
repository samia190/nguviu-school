import React, { useEffect, useState } from "react";
import { get } from "../utils/api";
import { cachedGet } from "../utils/apiCache";
import HeroCarousel from "./HeroCarousel";
import OptimizedImage from "./OptimizedImage";
import OptimizedVideo from "./OptimizedVideo";
import NewsWidget from "./NewsWidget";

// Default hero slides as fallback
const defaultHeroSlides = [
  { _id: 'default-1', url: 'https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5353.jpg', title: 'Welcome to Kangaru Girls School', description: 'A center of excellence in education', active: true, type: 'slide' },
  { _id: 'default-2', url: 'https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5400.jpg', title: 'Academic Excellence', description: 'Nurturing future leaders with knowledge and confidence', active: true, type: 'slide' },
  { _id: 'default-3', url: 'https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5500.jpg', title: 'Student Life', description: 'Vibrant community and enriching experiences', active: true, type: 'slide' },
  { _id: 'default-4', url: 'https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5613.jpg', title: 'Sports & Activities', description: 'Building character through sports and extracurricular activities', active: true, type: 'slide' },
  { _id: 'default-5', url: 'https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5820.jpg', title: 'Our Campus', description: 'A beautiful and serene learning environment', active: true, type: 'slide' },
];

export default function Home({ user, setRoute }) {
  // Single data source from /api/home
  const [homeData, setHomeData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  async function fetchHomeData() {
    setLoading(true);
    try {
      const data = await cachedGet("/api/home", get);
      setHomeData(data);
      console.log("✅ Home page data loaded:", data);
    } catch (err) {
      console.error("❌ Failed to load home data:", err);
      setError("Failed to load home page data");
      // Use safe defaults on error
      setHomeData({
        title: "WELCOME TO KANGARU GIRLS' SCHOOL",
        intro: "A center of excellence in education...",
        heroContent: {
          type: "slide",
          items: defaultHeroSlides,
        },
        quickLinks: [],
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section style={{ padding: "40px 20px", textAlign: "center" }}>
        <p>Loading home page...</p>
      </section>
    );
  }

  if (!homeData) {
    return (
      <section style={{ padding: "40px 20px", textAlign: "center" }}>
        <p>Unable to load home page</p>
      </section>
    );
  }

  const { title, intro, heroContent, quickLinks } = homeData;

  return (
    <section style={{ padding: 0, position: "relative", overflow: "hidden" }}>
      {error && <p style={{ color: "red", padding: "20px" }}>{error}</p>}

      {/* ===== HERO SECTION ===== */}
      {heroContent && heroContent.items && heroContent.items.length > 0 ? (
        heroContent.type === "slide" ? (
          // CAROUSEL: Multiple slides
          <div style={{ width: "100%" }}>
            <HeroCarousel slides={heroContent.items} />
          </div>
        ) : heroContent.type === "video" ? (
          // VIDEO: Full-width video
          <div
            style={{
              position: "relative",
              width: "100vw",
              marginLeft: "50%",
              transform: "translateX(-50%)",
              maxHeight: 500,
              overflow: "hidden",
            }}
          >
            <OptimizedVideo
              src={heroContent.items[0]?.url}
              autoPlay
              loop
              muted
              priority={true}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))",
              }}
            />
          </div>
        ) : (
          // IMAGE: Single image with overlay text
          <div
            style={{
              position: "relative",
              width: "100vw",
              marginLeft: "50%",
              transform: "translateX(-50%)",
              maxHeight: 500,
              overflow: "hidden",
            }}
          >
            <OptimizedImage
              src={heroContent.items[0]?.url}
              alt={heroContent.items[0]?.title || "Hero Image"}
              priority={true}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))",
              }}
            />
            {heroContent.items[0]?.title && (
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
                  <h2 style={{ fontSize: "2rem", margin: 0 }}>{heroContent.items[0].title}</h2>
                  {heroContent.items[0]?.description && (
                    <p style={{ fontSize: "1.1rem", marginTop: "10px" }}>{heroContent.items[0].description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        // FALLBACK: Default gradient hero
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          <h2 style={{ margin: "0 0 10px 0", fontSize: "28px" }}>WELCOME TO KANGARU GIRLS' SCHOOL!</h2>
          <p>Explore our programs and discover excellence in education</p>
        </div>
      )}

      {/* ===== TITLE ===== */}
      <div style={{ padding: "clamp(20px, 4vw, 40px) 20px", textAlign: "center", maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", margin: "0 0 14px 0" }}>
          {title || "WELCOME TO KANGARU GIRLS' SCHOOL"}
        </h1>

        {/* ===== INTRO ===== */}
        <p style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)", lineHeight: "1.6", color: "#555", maxWidth: "900px", margin: "0 auto clamp(20px, 4vw, 40px)" }}>
          {intro || "At our institution, we believe education is a journey of creativity, growth, and excellence..."}
        </p>
      </div>

      {/* ===== MAIN CONTENT + SIDEBAR ===== */}
      <div
        className="home-layout"
        style={{
          display: "flex",
          gap: "30px",
          flexWrap: "wrap",
          alignItems: "flex-start",
          margin: "30px auto",
          maxWidth: "1400px",
          padding: "0 20px",
        }}
      >
        {/* LEFT: QUICK LINKS GRID (70%) */}
        <div style={{ flex: "1 1 65%", minWidth: "300px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "30px", textAlign: "center" }}>Quick Links</h2>

          {quickLinks && quickLinks.length > 0 ? (
            <div style={{ display: "grid", gap: "clamp(16px, 3vw, 30px)" }}>
              {quickLinks.map((section) => (
                <div key={section._id} style={{ width: "100%" }}>
                  <h3 style={{ textAlign: "center", marginBottom: "20px", fontSize: "1.3rem" }}>
                    {section.title}
                  </h3>

                  {/* Child containers grid */}
                  <div
                    className="home-ql-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(min(48%, 140px), 1fr))",
                      gap: "20px",
                    }}
                  >
                    {section.childContainers && section.childContainers.length > 0 ? (
                      section.childContainers.map((child, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "skyblue",
                            padding: "20px",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          <h4 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "1rem" }}>
                            {child.title}
                          </h4>
                          <p style={{ margin: 0, fontSize: "0.9rem", color: "purple", lineHeight: "1.5" }}>
                            {child.text}
                          </p>
                          <button
                            onClick={() => setRoute(section.key)}
                            style={{
                              marginTop: "auto",
                              padding: "10px 16px",
                              background: "#667eea",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                            }}
                          >
                            Visit →
                          </button>
                        </div>
                      ))
                    ) : (
                      <button
                        onClick={() => setRoute(section.key)}
                        style={{
                          gridColumn: "1/-1",
                          padding: "15px 20px",
                          background: "#667eea",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "1rem",
                          fontWeight: "600",
                        }}
                      >
                        {section.title} →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "#999" }}>No quick links available</p>
          )}
        </div>

        {/* RIGHT: NEWS WIDGET SIDEBAR (30%) */}
        <div style={{ flex: "1 1 30%", minWidth: "280px" }}>
          <NewsWidget />
        </div>
      </div>
    </section>
  );
}
