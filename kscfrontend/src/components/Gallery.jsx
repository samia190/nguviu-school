import { useEffect, useState, useRef } from "react";
import { get } from "../utils/api";
import LazyImage from "./LazyImage";

/**
 * Enhance Cloudinary URLs for lightbox (higher resolution).
 */
function getHiRes(url) {
  if (!url) return "";
  if (url.includes("res.cloudinary.com") && url.includes("/w_800")) {
    return url.replace("/w_800", "/w_1600");
  }
  return url;
}

export default function Gallery() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeAlbum, setActiveAlbum] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    get("/api/gallery-page")
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load gallery");
        setLoading(false);
      });
  }, []);

  // Compute filtered images
  const images = data?.images || [];
  const albums = data?.albums || [];
  const filteredImages =
    activeAlbum === "all"
      ? images
      : images.filter((img) => img.albumId === activeAlbum);

  // Ref for keyboard handler to access latest filtered count
  const filteredRef = useRef(filteredImages);
  filteredRef.current = filteredImages;

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handle = (e) => {
      const len = filteredRef.current.length;
      if (!len) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i === 0 ? len - 1 : i - 1));
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i + 1) % len);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handle);
    return () => {
      window.removeEventListener("keydown", handle);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  // Close lightbox on album switch
  function switchAlbum(id) {
    setActiveAlbum(id);
    setLightboxIndex(null);
  }

  if (loading) {
    return (
      <section style={{ padding: 20 }}>
        <h2>Gallery</h2>
        <p>Loading gallery...</p>
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

  if (!data) return null;

  const { title, subtitle, heroImage, heroOverlayText } = data;

  // Only show album tabs for albums that have images
  const albumsWithImages = albums.filter((a) =>
    images.some((img) => img.albumId === (a._id || a.id))
  );

  return (
    <div className="gallery-page">
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      {heroImage && (
        <div
          style={{
            position: "relative",
            width: "100vw",
            marginLeft: "50%",
            transform: "translateX(-50%)",
            minHeight: 380,
            overflow: "hidden",
            marginBottom: 30,
            background: `url('${heroImage}') center/cover no-repeat, linear-gradient(135deg, #667eea, #764ba2)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              style={{
                maxWidth: 700,
                padding: "16px 24px",
                borderRadius: 10,
                backgroundColor: "rgba(0,0,0,0.45)",
                color: "#fff",
                textAlign: "center",
              }}
            >
              <h2 style={{ fontSize: "2rem", margin: "0 0 8px" }}>
                {heroOverlayText || title}
              </h2>
              {subtitle && (
                <p style={{ fontSize: "1.1rem", margin: 0, opacity: 0.9 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <section style={{ padding: "0 20px 40px" }}>
        <h2 style={{ marginBottom: 4 }}>{title}</h2>
        <p
          style={{
            maxWidth: 720,
            color: "#4b5563",
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          {subtitle}
        </p>

        {/* ═══════════════ ALBUM FILTER TABS ═══════════════ */}
        {albumsWithImages.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => switchAlbum("all")}
              style={{
                padding: "8px 18px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                background: activeAlbum === "all" ? "#2563eb" : "#f1f5f9",
                color: activeAlbum === "all" ? "#fff" : "#475569",
                fontWeight: activeAlbum === "all" ? 700 : 500,
                fontSize: 14,
                transition: "all 0.2s",
              }}
            >
              All ({images.length})
            </button>
            {albumsWithImages.map((album) => {
              const albumId = album._id || album.id;
              const count = images.filter(
                (img) => img.albumId === albumId
              ).length;
              const isActive = activeAlbum === albumId;
              return (
                <button
                  key={albumId}
                  onClick={() => switchAlbum(albumId)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 20,
                    border: "none",
                    cursor: "pointer",
                    background: isActive ? "#2563eb" : "#f1f5f9",
                    color: isActive ? "#fff" : "#475569",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 14,
                    transition: "all 0.2s",
                  }}
                >
                  {album.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* ═══════════════ IMAGE GRID ═══════════════ */}
        {filteredImages.length === 0 ? (
          <p
            style={{
              color: "#888",
              textAlign: "center",
              padding: "40px 0",
            }}
          >
            No images in this album yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            }}
          >
            {filteredImages.map((img, idx) => (
              <div
                key={img._id || idx}
                onClick={() => setLightboxIndex(idx)}
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  aspectRatio: "1",
                  cursor: "pointer",
                  position: "relative",
                  border: "2px solid #e5e7eb",
                  background: "#f9f9f9",
                  transition:
                    "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = "#2563eb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
                title={img.caption || "Gallery image"}
              >
                <LazyImage
                  src={img.url}
                  alt={img.caption || `Gallery image ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {img.caption && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background:
                        "linear-gradient(transparent, rgba(0,0,0,0.7))",
                      color: "#fff",
                      padding: "20px 8px 8px",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {img.caption}
                  </div>
                )}
                {img.featured && (
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      background: "#f59e0b",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 10,
                    }}
                  >
                    ⭐ Featured
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════ LIGHTBOX ═══════════════ */}
      {lightboxIndex !== null && filteredImages[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
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
              onClick={() => setLightboxIndex(null)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(255,255,255,0.2)",
                border: "2px solid #fff",
                borderRadius: "50%",
                width: 40,
                height: 40,
                cursor: "pointer",
                fontSize: 20,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10001,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
              }
              aria-label="Close preview"
            >
              ✕
            </button>

            {/* Caption */}
            {filteredImages[lightboxIndex].caption && (
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "#fff",
                  background: "rgba(0,0,0,0.5)",
                  padding: "10px 20px",
                  borderRadius: 6,
                  fontSize: 16,
                  textAlign: "center",
                  maxWidth: "90%",
                  zIndex: 10001,
                }}
              >
                {filteredImages[lightboxIndex].caption}
              </div>
            )}

            {/* Full-size image */}
            <img
              src={getHiRes(filteredImages[lightboxIndex].url)}
              alt={filteredImages[lightboxIndex].caption || "Preview"}
              style={{
                maxWidth: "95vw",
                maxHeight: "85vh",
                display: "block",
                borderRadius: 8,
                objectFit: "contain",
              }}
            />

            {/* Navigation controls */}
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 12,
                alignItems: "center",
                zIndex: 10001,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) =>
                    i === 0 ? filteredImages.length - 1 : i - 1
                  );
                }}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "2px solid rgba(255,255,255,0.3)",
                  padding: "10px 16px",
                  cursor: "pointer",
                  borderRadius: 6,
                  fontWeight: 600,
                  color: "#fff",
                  fontSize: 14,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255,255,255,0.25)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255,255,255,0.15)")
                }
                aria-label="Previous image"
              >
                ← Prev
              </button>

              <div
                style={{
                  color: "#fff",
                  fontSize: 14,
                  background: "rgba(0,0,0,0.5)",
                  padding: "8px 16px",
                  borderRadius: 6,
                  minWidth: 80,
                  textAlign: "center",
                }}
              >
                {lightboxIndex + 1} / {filteredImages.length}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(
                    (i) => (i + 1) % filteredImages.length
                  );
                }}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "2px solid rgba(255,255,255,0.3)",
                  padding: "10px 16px",
                  cursor: "pointer",
                  borderRadius: 6,
                  fontWeight: 600,
                  color: "#fff",
                  fontSize: 14,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255,255,255,0.25)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255,255,255,0.15)")
                }
                aria-label="Next image"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
