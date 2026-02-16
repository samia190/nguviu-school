// src/components/Curriculum.jsx
import { useEffect, useState } from "react";
import { get } from "../utils/api";
import { safePath } from "../utils/paths";
import LazyImage from "./LazyImage";
import LazyVideo from "./LazyVideo";

const SUBJECT_COMBINATIONS = {
  STEM: [
    { code: "ST2007", subjects: ["Business Studies", "Computer Studies", "Physics"] },
    { code: "ST2067", subjects: ["Agriculture", "Computer Studies", "Physics"] },
    { code: "ST2075", subjects: ["Agriculture", "Geography", "Physics"] },
    { code: "ST2097", subjects: ["Biology", "Business Studies", "Computer Studies"] },
    { code: "ST2065", subjects: ["Core Mathematics", "Agriculture", "Computer Studies"] },
    { code: "ST2018", subjects: ["Computer Studies", "Geography", "Physics"] },
    { code: "ST1046", subjects: ["Biology", "Chemistry", "Computer Studies"] },
    { code: "ST2013", subjects: ["Chemistry", "Computer Studies", "Geography"] },
    { code: "ST2044", subjects: ["Agriculture", "Biology", "Business Studies"] },
    { code: "ST2050", subjects: ["Agriculture", "Business Studies", "Geography"] },
    { code: "ST2061", subjects: ["Agriculture", "Computer Studies", "General Science"] },
    { code: "ST2072", subjects: ["Core Mathematics", "Agriculture", "Geography"] },
    { code: "ST2099", subjects: ["Business Studies", "Chemistry", "Computer Studies"] },
    { code: "ST1020", subjects: ["Core Mathematics", "Chemistry", "Physics"] },
  ],
  "Social Sciences": [
    { code: "SS2033", subjects: ["Computer Studies", "Geography", "Islamic Religious Education"] },
    { code: "SS2112", subjects: ["Business Studies", "Christian Religious Education", "French"] },
    { code: "SS2061", subjects: ["Business Studies", "Geography", "Literature in English"] },
    { code: "SS2024", subjects: ["Computer Studies", "Geography", "History & Citizenship"] },
    { code: "SS2056", subjects: ["Core Mathematics", "Business Studies", "Geography"] },
    { code: "SS2110", subjects: ["Business Studies", "Fasihi ya Kiswahili", "Islamic Religious Education"] },
    { code: "SS2115", subjects: ["Business Studies", "Christian Religious Education", "General Science"] },
    { code: "SS2018", subjects: ["Fasihi ya Kiswahili", "Geography", "History & Citizenship"] },
    { code: "SS1080", subjects: ["Business Studies", "Fasihi ya Kiswahili", "Literature in English"] },
  ],
  "Arts & Sports": [
    { code: "AS2009", subjects: ["Biology", "Geography", "Sports & Recreation"] },
    { code: "AS2003", subjects: ["Biology", "Computer Studies", "Sports & Recreation"] },
    { code: "AS2020", subjects: ["General Science", "Islamic Religious Education", "Sports & Recreation"] },
    { code: "AS2002", subjects: ["Biology", "Business Studies", "Sports & Recreation"] },
    { code: "AS2007", subjects: ["Biology", "Fasihi ya Kiswahili", "Sports & Recreation"] },
    { code: "AS2008", subjects: ["Biology", "French", "Sports & Recreation"] },
    { code: "AS2019", subjects: ["Christian Religious Education", "General Science", "Sports & Recreation"] },
    { code: "AS2004", subjects: ["Biology", "Christian Religious Education", "Sports & Recreation"] },
    { code: "AS2022", subjects: ["Fasihi ya Kiswahili", "General Science", "Sports & Recreation"] },
    { code: "AS2023", subjects: ["French", "General Science", "Sports & Recreation"] },
  ],
};

export default function Curriculum() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState(null);

  useEffect(() => {
    setLoading(true);
    get("/api/content/curriculum")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data[0].items || []);
        } else if (data && data.items) {
          setItems(data.items);
        } else {
          setItems([]);
        }
      })
      .catch(() => setError("Failed to load curriculum information."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page-loading">Loading curriculum...</div>;
  }

  if (error) {
    return <div className="page-error">{error}</div>;
  }

  return (
    <div className="page curriculum-page">
      <h1>Our Curriculum</h1>

      {/* School Profile Section */}
      <section className="school-profile-section">
        <div className="profile-header">
          <h2>🏫 School Profile & Information</h2>
          <p className="subtitle">Complete overview of academic programs and school details</p>
        </div>
        
        <div className="profile-info">
          <div className="info-item">
            <strong>School:</strong> KANGARU GIRLS' SENIOR SCHOOL
          </div>
          <div className="info-item">
            <strong>Location:</strong> EMBU
          </div>
          <div className="info-item">
            <strong>Category:</strong> REGULAR
          </div>
        </div>

        {/* Subject Combinations */}
        <div className="subject-combinations-container">
          <h3>📚 Subject Combinations Offered</h3>
          <p className="combinations-intro">Available subject combinations at our school organized by stream:</p>

          {Object.entries(SUBJECT_COMBINATIONS).map(([stream, combinations]) => (
            <div key={stream} className="stream-section">
              <h4 className="stream-title">
                {stream === "STEM" && "🔬"}
                {stream === "Social Sciences" && "📖"}
                {stream === "Arts & Sports" && "🎯"}
                {" "}{stream} ({combinations.length} combinations)
              </h4>

              <div className="combinations-grid">
                {combinations.map((combo, idx) => (
                  <div key={idx} className="combination-card">
                    <div className="combo-code">{combo.code}</div>
                    <div className="combo-subjects">
                      {combo.subjects.map((subject, sidx) => (
                        <span key={sidx} className="subject-badge">{subject}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <hr className="section-divider" />

      {items.length === 0 && <p>Curriculum content will be available soon.</p>}

      <div className="cards-grid">
        {items.map((item, index) => (
          <div key={index} className="card curriculum-card">
            {item.heading && <h2 className="card-heading">{item.heading}</h2>}
            {item.title && <h3 className="card-title">{item.title}</h3>}
            {item.description && (
              <p className="card-description">{item.description}</p>
            )}

            {/* Media section */}
            {item.media && item.media.length > 0 && (
              <div className="card-media">
                {item.media.map((m, i) => {
                  const mime = m.mimeType || "";
                  const isImage = mime.startsWith("image/");
                  const isVideo = mime.startsWith("video/");
                  const isAudio = mime.startsWith("audio/");

                  if (isImage) {
                    return (
                      <div
                        key={i}
                        className="media-thumb image-thumb"
                        onClick={() => setLightboxUrl(m.url)}
                      >
                        <LazyImage src={safePath(m.url)} alt={m.originalName || "Curriculum"} />
                      </div>
                    );
                  }

                  if (isVideo) {
                    return (
                      <div key={i} className="media-thumb video-thumb">
                        <LazyVideo src={safePath(m.url)} controls />
                      </div>
                    );
                  }

                  if (isAudio) {
                    return (
                      <div key={i} className="media-thumb audio-thumb">
                        <audio src={safePath(m.url)} controls />
                      </div>
                    );
                  }

                  // Other files (PDF, docs, etc.)
                  return (
                    <div key={i} className="media-file-link">
                      <a href={m.url} target="_blank" rel="noreferrer">
                        {m.originalName || "Download file"}
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Simple lightbox for images */}
      {lightboxUrl && (
        <div className="lightbox" onClick={() => setLightboxUrl(null)}>
          <div className="lightbox-backdrop" />
          <div className="lightbox-content">
            <button
              type="button"
              className="lightbox-close"
              onClick={() => setLightboxUrl(null)}
            >
              ×
            </button>
            <LazyImage src={safePath(lightboxUrl)} alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
}
