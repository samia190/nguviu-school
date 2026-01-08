import { useEffect, useState } from "react";
import { safePath } from "../utils/paths";
import { get } from "../utils/api";
import LazyImage from "./LazyImage";

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(null); // Index for the full-screen view
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await get('/api/content/gallery');
        // backend returns array of gallery items; flatten attachments for simple gallery
        if (Array.isArray(data) && data.length > 0) {
          const flat = [];
          data.forEach((section) => {
            (section.attachments || []).forEach((att) => {
              flat.push({ url: att.url || att.downloadUrl, originalName: att.title || att.originalName || section.title, description: att.description || section.body });
            });
          });
          if (flat.length > 0) {
            setItems(flat);
            setLoading(false);
            return;
          }
        }

        // Fallback to static list if API empty
        const galleryData = [
          { url: "/images/gallery/arts/01.jpg", originalName: "Football Match", description: "A thrilling football match during Sports Day." },
          { url: "/images/gallery/arts/02.jpg", originalName: "Running Race", description: "The exciting 100-meter race with our best athletes." },
          { url: "/images/gallery/arts/03.jpg", originalName: "Dance Performance", description: "An energetic dance performance by the students." },
        ];
        setItems(galleryData);
        setLoading(false);
      } catch (err) {
        setItems([]);
        setError('Failed to load gallery');
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <section style={{ padding: 20 }}>
        <h2>Gallery</h2>
        <p>Loading gallery…</p>
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

  return (
    <section style={{ padding: 20 }}>
      {/* ================= HERO BACKGROUND SECTION ================= */}
      <div
        style={{
          position: "relative",
          width: "100vw",
          marginLeft: "50%",
          transform: "translateX(-50%)",
          minHeight: 420,
          overflow: "hidden",
          marginBottom: 30,
          backgroundImage: `url(${
            "/images/arts/background-hero.jpg" // Background image from public folder
          })`,
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

      {/* ================= IMAGE CONTAINER ================= */}
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
        }}
        className="gallery-grid-optimized"
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: "0.75rem",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onClick={() => handleImageClick(idx)}
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
              alt={item.originalName || "Gallery image"}
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
        ))}
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
            
            <img
              src={safePath(items[previewIndex].url)}
              alt="Preview"
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
  );
}
