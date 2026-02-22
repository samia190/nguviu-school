import { useEffect, useState } from "react";
import { safePath } from "../utils/paths";
import { get } from "../utils/api";
import LazyImage from "./LazyImage";
import OptimizedImage, { OptimizedBackgroundImage } from "./OptimizedImage";

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(null); // Index for the full-screen view
  const [imageLoading, setImageLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState("all");
  const imagesPerPage = 4; // 2 rows x 2 columns

  const [categories, setCategories] = useState({
    all: [],
    main: [],
    arts: [],
    events: [],
    tours: []
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await get('/api/content/gallery');
        console.log('Gallery API response:', data);
        
        // backend returns array of gallery items; flatten attachments for simple gallery
        if (Array.isArray(data) && data.length > 0) {
          const flat = [];
          data.forEach((section) => {
            console.log('Processing gallery section:', section);
            if (section && section.attachments && Array.isArray(section.attachments)) {
              section.attachments.forEach((att) => {
                if (att) {
                  flat.push({ 
                    url: att.url || att.downloadUrl, 
                    originalName: att.title || att.originalName || section.title || "Gallery Item", 
                    description: att.description || section.body || "" 
                  });
                }
              });
            }
          });
          console.log('Flattened gallery items:', flat);
          if (flat.length > 0) {
            setItems(flat);
            setLoading(false);
            return;
          }
        }

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
      } catch (err) {
        console.error('Gallery loading error:', err);
        setItems([]);
        setError(`Failed to load gallery: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    }

    load();
  }, []);

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
    setPreviewIndex(index); // Set index of the clicked image for preview
  };

  const handlePrev = () => {
    // Go to the previous image
    setPreviewIndex((prevIndex) => (prevIndex === 0 ? items.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    // Go to the next image
    setPreviewIndex((prevIndex) => (prevIndex === items.length - 1 ? 0 : prevIndex + 1));
  };

  const nextPage = () => {
    setStartIndex((prev) => 
      Math.min(prev + imagesPerPage, items.length - imagesPerPage)
    );
  };

  const prevPage = () => {
    setStartIndex((prev) => Math.max(0, prev - imagesPerPage));
  };

  const switchCategory = (category) => {
    setCurrentCategory(category);
    setItems(categories[category]);
    setStartIndex(0);
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
        Explore highlights from school life, events, and activities. Click on images to view them in a larger preview.
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
            fontWeight: currentCategory === "all" ? "bold" : "normal"
          }}
        >
          All Images ({categories.all.length})
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
            fontWeight: currentCategory === "main" ? "bold" : "normal"
          }}
        >
          School Life ({categories.main.length})
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
            fontWeight: currentCategory === "arts" ? "bold" : "normal"
          }}
        >
          Arts & Culture ({categories.arts.length})
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
            fontWeight: currentCategory === "events" ? "bold" : "normal"
          }}
        >
          Events & Celebrations ({categories.events.length})
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
            fontWeight: currentCategory === "tours" ? "bold" : "normal"
          }}
        >
          Educational Tours ({categories.tours.length})
        </button>
      </div>

      {/* ================= IMAGE CONTAINER ================= */}
      <div style={{ position: "relative", marginTop: 12 }}>
        {startIndex > 0 && (
          <button
            onClick={prevPage}
            className="gallery-nav gallery-nav-prev"
            aria-label="Previous images"
          >
            ‹
          </button>
        )}
        
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
          }}
          className="gallery-grid-optimized"
        >
          {currentItems.slice(startIndex, startIndex + imagesPerPage).map((item, idx) => {
            const actualIndex = startIndex + idx;
            return (
          <div
            key={actualIndex}
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: "0.75rem",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onClick={() => handleImageClick(actualIndex)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,23,42,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.06)";
            }}
          >
            <LazyImage
              src={safePath(item.url)}
              alt={item.originalName || `Gallery image ${actualIndex + 1}`}
              style={{
                width: "100%",
                height: "180px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <div style={{ marginTop: "10px" }}>
              <h4 style={{ fontSize: "0.95rem", marginBottom: "4px" }}>{item.originalName}</h4>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: "1.4" }}>
                {item.description}
              </p>
            </div>
          </div>
            );
          })}
        </div>
        
        {startIndex + imagesPerPage < currentItems.length && (
          <button
            onClick={nextPage}
            className="gallery-nav gallery-nav-next"
            aria-label="Next images"
          >
            ›
          </button>
        )}
      </div>

      {/* Full-Screen Image Preview */}
      {previewIndex !== null && (
        <div
          onClick={() => setPreviewIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              maxWidth: "95%",
              maxHeight: "95%",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewIndex(null);
              }}
              style={{
                position: "absolute",
                top: -10,
                right: -10,
                background: "#fff",
                borderRadius: "999px",
                border: "none",
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "18px",
                zIndex: 10000,
              }}
              aria-label="Close preview"
            >
              ✕
            </button>
            
            {imageLoading && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "#fff",
              }}>
                Loading...
              </div>
            )}
            
            <OptimizedImage
              src={items[previewIndex].url}
              alt="Preview"
              priority={true}
              onLoad={() => setImageLoading(false)}
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                display: "block",
                borderRadius: 8,
                objectFit: "contain",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                  setImageLoading(true);
                }}
                style={{
                  background: "rgba(255,255,255,0.9)",
                  border: "none",
                  padding: "10px 16px",
                  cursor: "pointer",
                  borderRadius: "6px",
                  fontWeight: 600,
                }}
                aria-label="Previous image"
              >
                ← Previous
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                  setImageLoading(true);
                }}
                style={{
                  background: "rgba(255,255,255,0.9)",
                  border: "none",
                  padding: "10px 16px",
                  cursor: "pointer",
                  borderRadius: "6px",
                  fontWeight: 600,
                }}
                aria-label="Next image"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
      </section>
    </div>
  );
}
