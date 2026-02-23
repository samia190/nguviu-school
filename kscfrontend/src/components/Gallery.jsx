import { useEffect, useState, useMemo } from "react";
import { safePath } from "../utils/paths";
import { get } from "../utils/api";
import LazyImage from "./LazyImage";
import OptimizedImage, { OptimizedBackgroundImage } from "./OptimizedImage";

import OptimizedImage, { OptimizedBackgroundImage } from "./OptimizedImage";

// Cloudinary base for optimized images
const CLD = 'https://res.cloudinary.com/ddm1dgws8/image/upload';
const thumb = (name) => `${CLD}/w_400,q_auto,f_auto/kangaru/${name}`;
const full = (name) => `${CLD}/w_1200,q_auto,f_auto/kangaru/${name}`;

// Default gallery images — shown when no API data is available
const defaultGalleryImages = [
  { url: thumb('DSC_5353.jpg'), fullUrl: full('DSC_5353.jpg'), originalName: 'School Life', description: 'Kangaru Girls School' },
  { url: thumb('DSC_5364.jpg'), fullUrl: full('DSC_5364.jpg'), originalName: 'Campus View', description: 'Our beautiful campus' },
  { url: thumb('DSC_5372.jpg'), fullUrl: full('DSC_5372.jpg'), originalName: 'Students', description: 'Our students' },
  { url: thumb('DSC_5377.jpg'), fullUrl: full('DSC_5377.jpg'), originalName: 'School Activities', description: 'Student activities' },
  { url: thumb('DSC_5379.jpg'), fullUrl: full('DSC_5379.jpg'), originalName: 'Learning', description: 'Academic excellence' },
  { url: thumb('DSC_5384.jpg'), fullUrl: full('DSC_5384.jpg'), originalName: 'School Grounds', description: 'School environment' },
  { url: thumb('DSC_5389.jpg'), fullUrl: full('DSC_5389.jpg'), originalName: 'Student Life', description: 'Life at Kangaru' },
  { url: thumb('DSC_5391.jpg'), fullUrl: full('DSC_5391.jpg'), originalName: 'Assembly', description: 'School assembly' },
  { url: thumb('DSC_5392.jpg'), fullUrl: full('DSC_5392.jpg'), originalName: 'Campus', description: 'Campus view' },
  { url: thumb('DSC_5400.jpg'), fullUrl: full('DSC_5400.jpg'), originalName: 'Academics', description: 'Academic programs' },
  { url: thumb('DSC_5401.jpg'), fullUrl: full('DSC_5401.jpg'), originalName: 'School Event', description: 'School events' },
  { url: thumb('DSC_5402.jpg'), fullUrl: full('DSC_5402.jpg'), originalName: 'Students Together', description: 'Student community' },
  { url: thumb('DSC_5403.jpg'), fullUrl: full('DSC_5403.jpg'), originalName: 'Learning Environment', description: 'Classroom activities' },
  { url: thumb('DSC_5404.jpg'), fullUrl: full('DSC_5404.jpg'), originalName: 'School Pride', description: 'Kangaru pride' },
  { url: thumb('DSC_5406.jpg'), fullUrl: full('DSC_5406.jpg'), originalName: 'Activities', description: 'Student activities' },
  { url: thumb('DSC_5410.jpg'), fullUrl: full('DSC_5410.jpg'), originalName: 'Sports', description: 'Sports activities' },
  { url: thumb('DSC_5411.jpg'), fullUrl: full('DSC_5411.jpg'), originalName: 'Athletics', description: 'Track and field' },
  { url: thumb('DSC_5413.jpg'), fullUrl: full('DSC_5413.jpg'), originalName: 'Team Work', description: 'Teamwork in action' },
  { url: thumb('DSC_5415.jpg'), fullUrl: full('DSC_5415.jpg'), originalName: 'Performance', description: 'Student performances' },
  { url: thumb('DSC_5418.jpg'), fullUrl: full('DSC_5418.jpg'), originalName: 'Arts', description: 'Creative arts' },
  { url: thumb('DSC_5420.jpg'), fullUrl: full('DSC_5420.jpg'), originalName: 'Science', description: 'Science activities' },
  { url: thumb('DSC_5424.jpg'), fullUrl: full('DSC_5424.jpg'), originalName: 'School Tour', description: 'Campus tour' },
  { url: thumb('DSC_5427.jpg'), fullUrl: full('DSC_5427.jpg'), originalName: 'Cultural Day', description: 'Cultural celebrations' },
  { url: thumb('DSC_5428.jpg'), fullUrl: full('DSC_5428.jpg'), originalName: 'Celebration', description: 'School celebration' },
  { url: thumb('DSC_5432.jpg'), fullUrl: full('DSC_5432.jpg'), originalName: 'Competition', description: 'School competitions' },
  { url: thumb('DSC_5434.jpg'), fullUrl: full('DSC_5434.jpg'), originalName: 'Field Day', description: 'Field activities' },
  { url: thumb('DSC_5435.jpg'), fullUrl: full('DSC_5435.jpg'), originalName: 'Students', description: 'Our students' },
  { url: thumb('DSC_5440.jpg'), fullUrl: full('DSC_5440.jpg'), originalName: 'Debate', description: 'Debate sessions' },
  { url: thumb('DSC_5441.jpg'), fullUrl: full('DSC_5441.jpg'), originalName: 'Classroom', description: 'In the classroom' },
  { url: thumb('DSC_5443.jpg'), fullUrl: full('DSC_5443.jpg'), originalName: 'Open Day', description: 'School open day' },
  { url: thumb('DSC_5446.jpg'), fullUrl: full('DSC_5446.jpg'), originalName: 'Leadership', description: 'Student leadership' },
  { url: thumb('DSC_5447.jpg'), fullUrl: full('DSC_5447.jpg'), originalName: 'Innovation', description: 'Innovation week' },
  { url: thumb('DSC_5450.jpg'), fullUrl: full('DSC_5450.jpg'), originalName: 'Community', description: 'Community outreach' },
  { url: thumb('DSC_5454.jpg'), fullUrl: full('DSC_5454.jpg'), originalName: 'School Life', description: 'Daily life' },
  { url: thumb('DSC_5455.jpg'), fullUrl: full('DSC_5455.jpg'), originalName: 'Friendship', description: 'Student friendships' },
  { url: thumb('DSC_5456.jpg'), fullUrl: full('DSC_5456.jpg'), originalName: 'Service', description: 'Community service' },
  { url: thumb('DSC_5457.jpg'), fullUrl: full('DSC_5457.jpg'), originalName: 'Achievement', description: 'Student achievements' },
  { url: thumb('DSC_5458.jpg'), fullUrl: full('DSC_5458.jpg'), originalName: 'Excellence', description: 'Pursuit of excellence' },
  { url: thumb('DSC_5462.jpg'), fullUrl: full('DSC_5462.jpg'), originalName: 'Inter-School', description: 'Inter-school events' },
  { url: thumb('DSC_5463.jpg'), fullUrl: full('DSC_5463.jpg'), originalName: 'Ceremony', description: 'School ceremony' },
  { url: thumb('DSC_5472.jpg'), fullUrl: full('DSC_5472.jpg'), originalName: 'Prize Giving', description: 'Prize giving day' },
  { url: thumb('DSC_5473.jpg'), fullUrl: full('DSC_5473.jpg'), originalName: 'Awards', description: 'Award ceremony' },
  { url: thumb('DSC_5475.jpg'), fullUrl: full('DSC_5475.jpg'), originalName: 'Recognition', description: 'Student recognition' },
  { url: thumb('DSC_5489.jpg'), fullUrl: full('DSC_5489.jpg'), originalName: 'Career Day', description: 'Career guidance' },
  { url: thumb('DSC_5490.jpg'), fullUrl: full('DSC_5490.jpg'), originalName: 'Mentorship', description: 'Mentorship programs' },
  { url: thumb('DSC_5493.jpg'), fullUrl: full('DSC_5493.jpg'), originalName: 'Workshop', description: 'Student workshops' },
  { url: thumb('DSC_5500.jpg'), fullUrl: full('DSC_5500.jpg'), originalName: 'Campus Life', description: 'Life on campus' },
  { url: thumb('DSC_5501.jpg'), fullUrl: full('DSC_5501.jpg'), originalName: 'Music', description: 'Music performances' },
  { url: thumb('DSC_5502.jpg'), fullUrl: full('DSC_5502.jpg'), originalName: 'Talent', description: 'Talent showcase' },
  { url: thumb('DSC_5512.jpg'), fullUrl: full('DSC_5512.jpg'), originalName: 'School Spirit', description: 'School spirit' },
  { url: thumb('DSC_5515.jpg'), fullUrl: full('DSC_5515.jpg'), originalName: 'Graduation', description: 'Graduation ceremony' },
  { url: thumb('DSC_5533.jpg'), fullUrl: full('DSC_5533.jpg'), originalName: 'Library', description: 'Library activities' },
  { url: thumb('DSC_5534.jpg'), fullUrl: full('DSC_5534.jpg'), originalName: 'Reading', description: 'Reading culture' },
  { url: thumb('DSC_5535.jpg'), fullUrl: full('DSC_5535.jpg'), originalName: 'Study', description: 'Study time' },
  { url: thumb('DSC_5537.jpg'), fullUrl: full('DSC_5537.jpg'), originalName: 'Learning', description: 'Active learning' },
  { url: thumb('DSC_5541.jpg'), fullUrl: full('DSC_5541.jpg'), originalName: 'Lab Work', description: 'Laboratory work' },
  { url: thumb('DSC_5545.jpg'), fullUrl: full('DSC_5545.jpg'), originalName: 'Experiment', description: 'Science experiments' },
  { url: thumb('DSC_5548.jpg'), fullUrl: full('DSC_5548.jpg'), originalName: 'Discovery', description: 'Scientific discovery' },
  { url: thumb('DSC_5581.jpg'), fullUrl: full('DSC_5581.jpg'), originalName: 'School Grounds', description: 'School grounds' },
  { url: thumb('DSC_5613.jpg'), fullUrl: full('DSC_5613.jpg'), originalName: 'Sports Field', description: 'Sports activities' },
  { url: thumb('DSC_5614.jpg'), fullUrl: full('DSC_5614.jpg'), originalName: 'Exercise', description: 'Physical education' },
  { url: thumb('DSC_5615.jpg'), fullUrl: full('DSC_5615.jpg'), originalName: 'Fitness', description: 'Fitness activities' },
  { url: thumb('DSC_5625.jpg'), fullUrl: full('DSC_5625.jpg'), originalName: 'Teamwork', description: 'Team activities' },
  { url: thumb('DSC_5626.jpg'), fullUrl: full('DSC_5626.jpg'), originalName: 'Cooperation', description: 'Working together' },
  { url: thumb('DSC_5631.jpg'), fullUrl: full('DSC_5631.jpg'), originalName: 'Unity', description: 'United in purpose' },
  { url: thumb('DSC_5712.jpg'), fullUrl: full('DSC_5712.jpg'), originalName: 'School Building', description: 'School architecture' },
  { url: thumb('DSC_5721.jpg'), fullUrl: full('DSC_5721.jpg'), originalName: 'Campus Beauty', description: 'Beautiful campus' },
  { url: thumb('DSC_5725.jpg'), fullUrl: full('DSC_5725.jpg'), originalName: 'Nature', description: 'Natural surroundings' },
  { url: thumb('DSC_5726.jpg'), fullUrl: full('DSC_5726.jpg'), originalName: 'Gardens', description: 'School gardens' },
  { url: thumb('DSC_5728.jpg'), fullUrl: full('DSC_5728.jpg'), originalName: 'Environment', description: 'Green environment' },
  { url: thumb('DSC_5735.jpg'), fullUrl: full('DSC_5735.jpg'), originalName: 'Walkways', description: 'Campus walkways' },
  { url: thumb('DSC_5739.jpg'), fullUrl: full('DSC_5739.jpg'), originalName: 'Scenery', description: 'Campus scenery' },
  { url: thumb('DSC_5766.jpg'), fullUrl: full('DSC_5766.jpg'), originalName: 'Infrastructure', description: 'School facilities' },
  { url: thumb('DSC_5781.jpg'), fullUrl: full('DSC_5781.jpg'), originalName: 'Facilities', description: 'Modern facilities' },
  { url: thumb('DSC_5797.jpg'), fullUrl: full('DSC_5797.jpg'), originalName: 'Resources', description: 'School resources' },
  { url: thumb('DSC_5820.jpg'), fullUrl: full('DSC_5820.jpg'), originalName: 'Panorama', description: 'Panoramic view' },
  { url: thumb('DSC_5824.jpg'), fullUrl: full('DSC_5824.jpg'), originalName: 'Administration', description: 'Admin block' },
  { url: thumb('DSC_5830.jpg'), fullUrl: full('DSC_5830.jpg'), originalName: 'Hall', description: 'School hall' },
  { url: thumb('DSC_5833.jpg'), fullUrl: full('DSC_5833.jpg'), originalName: 'Dining', description: 'Dining facilities' },
  { url: thumb('DSC_5836.jpg'), fullUrl: full('DSC_5836.jpg'), originalName: 'Dormitory', description: 'Student dormitories' },
  { url: thumb('DSC_5837.jpg'), fullUrl: full('DSC_5837.jpg'), originalName: 'Accommodation', description: 'Student accommodation' },
  { url: thumb('DSC_5839.jpg'), fullUrl: full('DSC_5839.jpg'), originalName: 'Evening', description: 'Evening at school' },
  { url: thumb('DSC_5840.jpg'), fullUrl: full('DSC_5840.jpg'), originalName: 'Sunset', description: 'Beautiful sunset' },
  { url: thumb('DSC_5882.jpg'), fullUrl: full('DSC_5882.jpg'), originalName: 'Memories', description: 'School memories' },
  { url: thumb('DSC_5886.jpg'), fullUrl: full('DSC_5886.jpg'), originalName: 'Moments', description: 'Precious moments' },
  { url: thumb('DSC_5892.jpg'), fullUrl: full('DSC_5892.jpg'), originalName: 'Legacy', description: 'Building a legacy' },
];

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
          // No data in database — use default images from public/images/
          console.log('Using default gallery images from public/images/');
          const defaults = defaultGalleryImages;
          setItems(defaults);
          setCategories({
            all: defaults,
            main: defaults.slice(0, Math.ceil(defaults.length / 4)),
            arts: defaults.slice(Math.ceil(defaults.length / 4), Math.ceil(defaults.length / 4) * 2),
            events: defaults.slice(Math.ceil(defaults.length / 4) * 2, Math.ceil(defaults.length / 4) * 3),
            tours: defaults.slice(Math.ceil(defaults.length / 4) * 3),
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('Gallery loading error:', err);
        // Use default gallery images on error
        const defaults = defaultGalleryImages;
        setItems(defaults);
        setCategories({
          all: defaults,
          main: defaults.slice(0, Math.ceil(defaults.length / 4)),
          arts: defaults.slice(Math.ceil(defaults.length / 4), Math.ceil(defaults.length / 4) * 2),
          events: defaults.slice(Math.ceil(defaults.length / 4) * 2, Math.ceil(defaults.length / 4) * 3),
          tours: defaults.slice(Math.ceil(defaults.length / 4) * 3),
        });
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
          background: `url('${CLD}/w_1200,q_auto,f_auto/kangaru/DSC_5535.jpg') center/cover no-repeat, linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
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
              src={items[previewIndex].fullUrl || items[previewIndex].url}
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
