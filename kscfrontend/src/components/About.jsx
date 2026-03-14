import { useEffect, useState } from "react";
import { get } from "../utils/api";
import { cachedGet } from "../utils/apiCache";
import OptimizedImage from "./OptimizedImage";

const defaultHero = {
  imageUrl: "https://res.cloudinary.com/ddm1dgws8/image/upload/w_1200,q_auto,f_auto/kangaru/DSC_5392.jpg",
  title: "Welcome to KANGARU GIRLS SCHOOL",
  subtitle: "A nurturing environment where young girls grow into confident, responsible leaders."
};

export default function About({ user }) {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    cachedGet("/api/about", get)
      .then((data) => {
        setAboutData(data || {});
        setError("");
      })
      .catch((err) => {
        console.error("Failed to load about page:", err);
        setError("Failed to load about page");
        setAboutData({});
      })
      .finally(() => setLoading(false));
  }, []);

  const hero = aboutData?.heroContent || defaultHero;
  const principal = aboutData?.leadership?.principal;
  const deputies = aboutData?.leadership?.deputies || [];
  const coreValues = (aboutData?.coreValues || []).sort((a, b) => a.order - b.order);

  if (loading) {
    return <section style={{ padding: 20 }}><p>Loading...</p></section>;
  }

  return (
    <section style={{ padding: 20 }} className="about-page">
      {/* ================= HERO / TOP BACKGROUND SECTION ================= */}
      <div
        className="about-hero"
        style={{
          position: "relative",
          width: "100vw",
          marginLeft: "50%",
          transform: "translateX(-50%)",
          maxHeight: 1000,
          overflow: "hidden",
          height: "clamp(220px, 45vh, 500px)",
          backgroundImage: hero?.imageUrl ? `url(${encodeURI(hero.imageUrl)})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        {/* Overlay so text is readable */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.65))"
          }}
        />

        {/* Text container on top of hero */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            style={{
              maxWidth: 700,
              width: "100%",
              padding: "16px 20px",
              borderRadius: 10,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              color: "white",
              textAlign: "center"
            }}
          >
            <h2 style={{ marginBottom: "10px", fontSize: "2rem" }}>{hero?.title || defaultHero.title}</h2>
            <p style={{ fontSize: "1.1rem" }}>{hero?.subtitle || defaultHero.subtitle}</p>
          </div>
        </div>
      </div>

      {/* ================= MAIN ABOUT CONTENT ================= */}
      <div className="about-content">
        {/* TITLE */}
        <h2 style={{ marginTop: "30px", marginBottom: "20px", color: "#2c3e50", fontSize: "2rem" }}>
          {aboutData?.title || "About KANGARU GIRLS' SCHOOL"}
        </h2>

        {/* INTRO */}
        <p style={{ color: "#34495e", fontSize: "1.05rem", lineHeight: "1.8", marginBottom: "30px" }}>
          {aboutData?.intro || "KANGARU GIRLS' SCHOOL is a center of excellence dedicated to nurturing young girls into confident, capable leaders."}
        </p>

        {/* MOTTO */}
        {aboutData?.motto && (
          <div style={{ marginTop: "30px", marginBottom: "20px", textAlign: "left" }}>
            <h3 style={{ color: "#2c3e50", fontWeight: "bold", textAlign: "left" }}>
              {aboutData.motto.heading || "MOTTO"}
            </h3>
            <p style={{ color: "#34495e", fontSize: "1.1rem", marginTop: "8px", textAlign: "left" }}>
              {aboutData.motto.text || ""}
            </p>
          </div>
        )}

        {/* VISION */}
        {aboutData?.vision && (
          <div style={{ marginTop: "30px", marginBottom: "20px", textAlign: "left" }}>
            <h3 style={{ color: "#2c3e50", fontWeight: "bold", textAlign: "left" }}>
              {aboutData.vision.heading || "VISION"}
            </h3>
            <p style={{ color: "#34495e", fontSize: "1.1rem", marginTop: "8px", textAlign: "left" }}>
              {aboutData.vision.text || ""}
            </p>
          </div>
        )}

        {/* MISSION */}
        {aboutData?.mission && (
          <div style={{ marginTop: "30px", marginBottom: "20px", textAlign: "left" }}>
            <h3 style={{ color: "#2c3e50", fontWeight: "bold", textAlign: "left" }}>
              {aboutData.mission.heading || "MISSION"}
            </h3>
            <p style={{ color: "#34495e", fontSize: "1.1rem", marginTop: "8px", textAlign: "left" }}>
              {aboutData.mission.text || ""}
            </p>
          </div>
        )}

        {/* CORE VALUES */}
        {coreValues.length > 0 && (
          <div style={{ marginTop: "30px", marginBottom: "20px", textAlign: "left" }}>
            <h3 style={{ color: "#2c3e50", fontWeight: "bold", fontSize: "1.3rem", marginBottom: "15px" }}>
              CORE VALUES
            </h3>
            <ul style={{
              listStyleType: "disc",
              paddingLeft: "40px",
              color: "#34495e",
              fontSize: "1.05rem",
              lineHeight: "2",
              textAlign: "left"
            }}>
              {coreValues.map((cv, idx) => (
                <li key={idx}>{cv.value}</li>
              ))}
            </ul>
          </div>
        )}

        {/* PROMISE */}
        {aboutData?.promise && (
          <div style={{ marginTop: "30px", marginBottom: "20px", textAlign: "left" }}>
            <h3 style={{ color: "#2c3e50", fontWeight: "bold", textAlign: "left" }}>
              {aboutData.promise.heading || "Our Promise"}
            </h3>
            <p style={{ color: "#34495e", fontSize: "1.1rem", marginTop: "8px", textAlign: "left" }}>
              {aboutData.promise.text || ""}
            </p>
          </div>
        )}
      </div>

      {/* ================= PRINCIPAL AND DEPUTIES SECTION ================= */}
      {(principal || deputies.length > 0) && (
        <div
          className="about-leadership"
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: "1px solid #eee",
          }}
        >
          {/* PRINCIPAL */}
          {principal && (
            <div
              className="about-principal"
              style={{
                textAlign: "center",
                margin: "0 auto 30px auto",
                maxWidth: 500,
              }}
            >
              <div
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  overflow: "hidden",
                  margin: "0 auto 16px auto",
                  border: "3px solid #ddd",
                }}
              >
                <OptimizedImage
                  src={principal.photoUrl}
                  alt={principal.fullName}
                  priority={true}
                  fetchPriority="high"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              </div>
              <h3>Principal's Remarks</h3>
              <p style={{ fontWeight: "bold" }}>{principal.fullName}</p>
              <p style={{ color: "#34495e", lineHeight: "1.6" }}>{principal.remarks}</p>
            </div>
          )}

          {/* DEPUTIES */}
          {deputies.length > 0 && (
            <div
              className="about-deputies"
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "20px",
                flexWrap: "wrap"
              }}
            >
              {deputies.map((deputy, idx) => (
                <div
                  key={idx}
                  className="about-deputy"
                  style={{
                    flex: 1,
                    textAlign: "center",
                    maxWidth: 500,
                    minWidth: "48%",
                  }}
                >
                  <div
                    style={{
                      width: 180,
                      height: 180,
                      borderRadius: "50%",
                      overflow: "hidden",
                      margin: "0 auto 16px auto",
                      border: "3px solid #ddd",
                    }}
                  >
                    <OptimizedImage
                      src={deputy.photoUrl}
                      alt={deputy.fullName}
                      priority={idx === 0}
                      fetchPriority={idx === 0 ? "high" : "auto"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  </div>
                  <h3>{deputy.fullName}</h3>
                  <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "10px" }}>{deputy.department}</p>
                  <p style={{ color: "#34495e", lineHeight: "1.6" }}>{deputy.remarks}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ERROR */}
      {error && <p style={{ color: "red", marginTop: "20px" }}>{error}</p>}
    </section>
  );
}
