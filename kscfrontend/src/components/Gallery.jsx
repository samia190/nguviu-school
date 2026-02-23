import { useEffect, useState, useMemo } from "react";
import { safePath } from "../utils/paths";
import { get } from "../utils/api";
import LazyImage from "./LazyImage";
import OptimizedImage, { OptimizedBackgroundImage } from "./OptimizedImage";

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState("all");

  const [categories, setCategories] = useState({
    all: [],
    main: [],
    arts: [],
    events: [],
    tours: []
  });

  // Get API origin for constructing absolute image URLs
  const API_ORIGIN = useMemo(() => {
    try {
      if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
      }
    } catch {}
    return "http://localhost:4000";
  }, []);

  function absUrl(u) {
    if (!u) return "";
    if (u.startsWith("http")) return u;
    // Convert relative URLs to absolute URLs pointing to the backend
    return `${API_ORIGIN}${u.startsWith("/") ? u : "/" + u}`;
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await get('/api/content/gallery');
        console.log('Gallery API response:', data);
        
        // backend returns array of gallery items; flatten attachments for simple gallery
        const items = Array.isArray(data) ? data : [];
        const flat = [];
        
        items.forEach((section) => {
          console.log('Processing gallery section:', section);
          if (section && section.attachments && Array.isArray(section.attachments)) {
            section.attachments.forEach((att) => {
              if (att && att.url) {
                flat.push({ 
                  url: safePath(absUrl(att.url)), // Convert to absolute URL & encode spaces
                  originalName: att.title || att.originalName || section.title || "Gallery Image", 
                  description: att.description || section.body || "",
                  mimetype: att.mimetype
                });
              }
            });
          }
        });
        
        console.log('Flattened gallery items:', flat);
        
        if (flat.length > 0) {
          setItems(flat);
          setCategories({
            all: flat,
            main: flat.slice(0, Math.ceil(flat.length / 5)),
            arts: flat.slice(Math.ceil(flat.length / 5), Math.ceil(flat.length / 5) * 2),
            events: flat.slice(Math.ceil(flat.length / 5) * 2, Math.ceil(flat.length / 5) * 3),
            tours: flat.slice(Math.ceil(flat.length / 5) * 3)
          });
          setLoading(false);
        } else {
          // No data in database - show empty state
          console.log('No gallery data available');
          setCategories({
            all: [],
            main: [],
            arts: [],
            events: [],
            tours: []
          });
          setItems([]);
          setError('No images available yet. Please upload images through the admin dashboard.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Gallery loading error:', err);
        setItems([]);
        setError(`Failed to load gallery: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    }

    load();
  }, [API_ORIGIN]);

  // Keyboard navigation for full-screen preview
  useEffect(() => {
    if (previewIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        setPreviewIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewIndex, items.length]);

  if (loading) {
    return (
      <section style={{ padding: 20 }}>
        <h2>Gallery</h2>
        <p>Loading gallery images...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section style={{ padding: 20 }}>
        <h2>Gallery</h2>
        <p style={{ color: "red" }}>{error}</p>
      </section>
    );
  }

  // Handle full-screen preview
  const handleImageClick = (index) => {
    setPreviewIndex(index);
  };

  const handlePrev = () => {
    setPreviewIndex((prevIndex) => (prevIndex === 0 ? items.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setPreviewIndex((prevIndex) => (prevIndex === items.length - 1 ? 0 : prevIndex + 1));
  };

  const switchCategory = (category) => {
    setCurrentCategory(category);
    const selectedItems = categories[category] || [];
    setItems(selectedItems);
    setPreviewIndex(null);
  };

  const currentItems = items;

  return (
    <div className="gallery-page">
      <section style={{ padding: 20 }}>
      {/* ================= HERO BACKGROUND SECTION ================= */}
      <div
        className="gallery-hero"
        style={{
          position: "relative",
          width: "100vw",
          marginLeft: "50%",
          transform: "translateX(-50%)",
          minHeight: 420,
          overflow: "hidden",
          marginBottom: 30,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
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
            <h2 style={{ fontSize: "2rem" }}>Explore Our School Gallery</h2>
            <p style={{ fontSize: "1.1rem" }}>
              Discover amazing moments captured throughout our school's events, sports, and more.
            </p>
          </div>
        </div>
      </div>

      <h2>Gallery</h2>
      <p style={{ maxWidth: 720, color: "#4b5563", fontSize: 14 }}>
        Explore highlights from school life, events, and activities. Click on any image to view it in full screen. Use arrow keys to navigate, or press Escape to close.
      </p>

      {/* Category Filter Buttons */}
      <div className="gallery-tabs" style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", borderBottom: "2px solid #ccc", paddingBottom: "10px" }}>
        <button 
          onClick={() => switchCategory("all")}
          style={{ 
            padding: "8px 16px", 
            borderRadius: "6px", 
            border: currentCategory === "all" ? "2px solid #007bff" : "1px solid #ccc",
            background: currentCategory === "all" ? "#007bff" : "#fff",
            color: currentCategory === "all" ? "#fff" : "#333",
            cursor: "pointer",
            fontWeight: currentCategory === "all" ? "bold" : "normal",
            transition: "all 0.2s ease",
          }}
        >
          All ({categories.all.length})
        </button>
        <button 
          onClick={() => switchCategory("main")}
          style={{ 
            padding: "8px 16px", 
            borderRadius: "6px", 
            border: currentCategory === "main" ? "2px solid #007bff" : "1px solid #ccc",
            background: currentCategory === "main" ? "#007bff" : "#fff",
            color: currentCategory === "main" ? "#fff" : "#333",
            cursor: "pointer",
            fontWeight: currentCategory === "main" ? "bold" : "normal",
            transition: "all 0.2s ease",
          }}
        >
          Main ({categories.main.length})
        </button>
        <button 
          onClick={() => switchCategory("arts")}
          style={{ 
            padding: "8px 16px", 
            borderRadius: "6px", 
            border: currentCategory === "arts" ? "2px solid #007bff" : "1px solid #ccc",
            background: currentCategory === "arts" ? "#007bff" : "#fff",
            color: currentCategory === "arts" ? "#fff" : "#333",
            cursor: "pointer",
            fontWeight: currentCategory === "arts" ? "bold" : "normal",
            transition: "all 0.2s ease",
          }}
        >
          Arts ({categories.arts.length})
        </button>
        <button 
          onClick={() => switchCategory("events")}
          style={{ 
            padding: "8px 16px", 
            borderRadius: "6px", 
            border: currentCategory === "events" ? "2px solid #007bff" : "1px solid #ccc",
            background: currentCategory === "events" ? "#007bff" : "#fff",
            color: currentCategory === "events" ? "#fff" : "#333",
            cursor: "pointer",
            fontWeight: currentCategory === "events" ? "bold" : "normal",
            transition: "all 0.2s ease",
          }}
        >
          Events ({categories.events.length})
        </button>
        <button 
          onClick={() => switchCategory("tours")}
          style={{ 
            padding: "8px 16px", 
            borderRadius: "6px", 
            border: currentCategory === "tours" ? "2px solid #007bff" : "1px solid #ccc",
            background: currentCategory === "tours" ? "#007bff" : "#fff",
            color: currentCategory === "tours" ? "#fff" : "#333",
            cursor: "pointer",
            fontWeight: currentCategory === "tours" ? "bold" : "normal",
            transition: "all 0.2s ease",
          }}
        >
          Tours ({categories.tours.length})
        </button>
      </div>

      {/* ================= IMAGE CONTAINER - RESPONSIVE GRID ================= */}
      <div style={{ position: "relative", marginTop: 12, marginBottom: 30 }}>
        <div
          style={{
            display: "grid",
            gap: "12px",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          }}
          className="gallery-grid-optimized"
        >
          {currentItems.map((item, idx) => {
            return (
              <div
                key={idx}
                style={{
                  borderRadius: 10,
                  border: "2px solid #e5e7eb",
                  overflow: "hidden",
                  background: "#f9f9f9",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  aspectRatio: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => handleImageClick(idx)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.08)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = "#007bff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
                title={item.originalName}
              >
                <LazyImage
                  src={item.url}
                  alt={item.originalName || `Gallery image ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-Screen Image Preview */}
      {previewIndex !== null && (
        <div
          onClick={() => setPreviewIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setPreviewIndex(null)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "rgba(255,255,255,0.2)",
                border: "2px solid #fff",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "20px",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                zIndex: 10001,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              aria-label="Close preview"
            >
              ✕
            </button>

            {/* Loading indicator */}
            {imageLoading && (
              <div style={{
                position: "absolute",
                color: "#fff",
                fontSize: "16px",
                zIndex: 10000,
              }}>
                Loading...
              </div>
            )}

            {/* Full image - using contain to show complete image */}
            <OptimizedImage
              src={items[previewIndex].url}
              alt={items[previewIndex].originalName || "Preview"}
              priority={true}
              onLoad={() => setImageLoading(false)}
              style={{
                maxWidth: "95vw",
                maxHeight: "85vh",
                width: "auto",
                height: "auto",
                display: "block",
                borderRadius: "8px",
                objectFit: "contain",
              }}
            />

            {/* Image counter and navigation */}
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10001,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                  setImageLoading(true);
                }}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "2px solid rgba(255,255,255,0.3)",
                  padding: "10px 16px",
                  cursor: "pointer",
                  borderRadius: "6px",
                  fontWeight: "600",
                  color: "#fff",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                }}
                aria-label="Previous image"
              >
                ← Previous
              </button>

              <div style={{
                color: "#fff",
                fontSize: "14px",
                background: "rgba(0,0,0,0.5)",
                padding: "8px 16px",
                borderRadius: "6px",
                minWidth: "80px",
                textAlign: "center",
              }}>
                {previewIndex + 1} / {items.length}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                  setImageLoading(true);
                }}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "2px solid rgba(255,255,255,0.3)",
                  padding: "10px 16px",
                  cursor: "pointer",
                  borderRadius: "6px",
                  fontWeight: "600",
                  color: "#fff",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                }}
                aria-label="Next image"
              >
                Next →
              </button>
            </div>

            {/* Image name/title */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                color: "#fff",
                fontSize: "16px",
                textAlign: "center",
                maxWidth: "90%",
                background: "rgba(0,0,0,0.5)",
                padding: "12px 20px",
                borderRadius: "6px",
                zIndex: 10001,
              }}
            >
              {items[previewIndex].originalName}
            </div>
          </div>
        </div>
      )}
      </section>
    </div>
  );
}
