import { useEffect, useState } from "react";

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(null); // Index for the full-screen view

  useEffect(() => {
    // Manually define gallery images with title and description (No grouping)
    const galleryData = [
      { url: "/images/gallery/arts/01.jpg", originalName: "Football Match", description: "A thrilling football match during Sports Day." },
      { url: "/images/gallery/arts/02.jpg", originalName: "Running Race", description: "The exciting 100-meter race with our best athletes." },
      { url: "/images/gallery/arts/03.jpg", originalName: "Dance Performance", description: "An energetic dance performance by the students." },
      { url: "/images/gallery/arts/04.jpg", originalName: "Art Exhibition", description: "Students displaying their creative artwork." },
      { url: "/images/gallery/arts/05.jpg", originalName: "Graduation Day", description: "The joyful moment of our senior students' graduation." },
      { url: "/images/gallery/arts/06.jpg", originalName: "Class of 2022", description: "Our proud graduating class of 2022." },
      { url: "/images/gallery/arts/06.jpg", originalName: "Class of 2022", description: "Our proud graduating class of 2022." },
      { url: "/images/gallery/arts/07.jpg", originalName: "Science Fair", },
      { url: "/images/gallery/arts/08.jpg", originalName: "Music Concert"},
      { url: "/images/gallery/arts/09.jpg", originalName: "Drama Club",  },   
      { url: "/images/gallery/arts/10.jpg", originalName: "Field Trip",  },
      { url: "/images/gallery/arts/11.jpg", originalName: "Sports Day",  },
      { url: "/images/gallery/arts/12.jpg", originalName: "Cultural Fest",  },     
      // Add more images here as needed...
    ];

    setItems(galleryData);
    setLoading(false);
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
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: "1rem",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
              cursor: "pointer",
            }}
            onClick={() => handleImageClick(idx)} // Set the index for preview
          >
            <img
              src={item.url}
              alt={item.originalName || "Image"}
              style={{
                width: "100%",
                height: "180px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <div style={{ marginTop: "10px" }}>
              <h4 style={{ fontSize: "1rem" }}>{item.originalName}</h4>
              <p style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Full-Screen Image Preview */}
      {previewIndex !== null && (
        <div
          onClick={() => setPreviewIndex(null)} // Close preview when clicked
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
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
                padding: "4px 10px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              ✕
            </button>
            <img
              src={items[previewIndex].url} // Display the selected image
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                display: "block",
                borderRadius: 8,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <button
                onClick={handlePrev}
                style={{
                  background: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                style={{
                  background: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
