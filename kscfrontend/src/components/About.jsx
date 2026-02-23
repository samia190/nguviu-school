import { useEffect, useState } from "react";
import { get, patch } from "../utils/api";
import EditableText from "../components/EditableText";
import EditableHeading from "../components/EditableHeading";
import EditableSubheading from "../components/EditableSubheading";
import { safePath } from "../utils/paths";
import LazyImage from "./LazyImage";
import OptimizedImage from "./OptimizedImage";
import { useBatchImagePreload } from "../hooks/useImagePreload";

export default function About({ user }) {
  const [content, setContent] = useState({});
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState("");
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffImages, setStaffImages] = useState([]);
  const [heroContent, setHeroContent] = useState(null);

  useEffect(() => {
    Promise.all([
      get("/api/content/about").catch(() => ({})),
      get("/api/hero-content?page=about&type=image").catch(() => null)
    ])
      .then(([aboutData, heroData]) => {
        setContent(aboutData || {});
        // Get first active hero image for the about page
        if (heroData && Array.isArray(heroData) && heroData.length > 0) {
          const activeHero = heroData.find(h => h.active) || heroData[0];
          setHeroContent(activeHero);
        } else {
          // Fallback hero image from public/images/
          setHeroContent({ url: '/images/DSC_5392.jpg', title: 'About Kangaru Girls School' });
        }
      })
      .catch(() => {
        setError("Failed to load about page content.");
        setHeroContent({ url: '/images/DSC_5392.jpg', title: 'About Kangaru Girls School' });
      });
  }, []);

  useEffect(() => {
    // Fetch both principal and deputy principal staff
    Promise.all([
      get("/api/staff?type=principal").catch(() => []),
      get("/api/staff?type=deputy_principal").catch(() => [])
    ])
      .then(([principals, deputies]) => {
        const principalList = Array.isArray(principals) ? principals : (principals.staff || []);
        const deputyList = Array.isArray(deputies) ? deputies : (deputies.staff || []);
        let allStaff = [...principalList, ...deputyList];
        
        // Fallback: show default principal if none from API
        if (!allStaff.some(s => s.type === 'principal')) {
          allStaff.unshift({
            _id: 'default-principal',
            type: 'principal',
            fullName: 'School Principal',
            title: 'Principal - Kangaru Girls School',
            photoUrl: '/images/Principal.png',
            remarks: 'Welcome to Kangaru Girls School. We are dedicated to nurturing excellence and developing well-rounded young women who will be leaders of tomorrow.'
          });
        }
        setStaff(allStaff);
        
        // Prepare staff images for preloading
        const images = allStaff
          .map(person => ({
            src: person.photoUrl || (person.type === 'principal' ? '/images/Principal.png' : '/images/DSC_5372.jpg')
          }));
        setStaffImages(images);
      })
      .catch(() => setStaff([]))
      .finally(() => setLoadingStaff(false));
  }, []);

  // Preload staff photos
  useBatchImagePreload(staffImages);

  function updateSection(section, value) {
    patch(`/api/content/about/${section}`, { value })
      .then(() =>
        setContent((prev) => ({
          ...prev,
          [section]: value
        }))
      )
      .catch((err) => {
        console.error("Failed to save:", err);
        alert("Failed to save content.");
      });
  }

  // ✅ Convert core values (entered one per line) into a list
  const coreValues = (content.coreValues || "")
    .split("\n")
    .filter(Boolean);

  // Normalize image paths coming from content or defaults.
  const resolvePath = (p) => {
    if (!p) return p;
    // If someone saved a `public/...` path, convert to root-served path
    if (p.startsWith("public/")) return "/" + p.slice("public/".length);
    // If already an absolute path, return as-is
    if (p.startsWith("/")) return p;
    // Otherwise prefix with leading slash
    return "/" + p;
  };

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
    height: window.innerWidth <= 480 ? 300 : 500,
          backgroundImage: heroContent?.url ? `url(${encodeURI(heroContent.url)})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.65))"
          }}
        />

        {/* Text container on top of hero (with transparent / semi-transparent box) */}
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
              backgroundColor: "rgba(0, 0, 0, 0.45)", // transparent container
              color: "blue",
              textAlign: "center"
            }}
          >
            <EditableHeading
              value={content.heroTitle || "WELCOME TO KANGARU GIRLS SCHOOL"}
              onSave={(val) => updateSection("heroTitle", val)}
              isAdmin={user?.role === "admin"}
              level={2}
            />

            <EditableText
              value={content.heroSubtitle || "A nurturing environment where young girls grow into confident, responsible leaders."}
              onSave={(val) => updateSection("heroSubtitle", val)}
              isAdmin={user?.role === "admin"}
            />
          </div>
        </div>
      </div>

      {/* ================= MAIN ABOUT CONTENT ================= */}

      <div className="about-content">
      {/* TITLE */}
      <EditableHeading
        value={content.title || "About KANGARU GIRLS' SCHOOL"}
        onSave={(val) => updateSection("title", val)}
        isAdmin={user?.role === "admin"}
        level={2}
      />

      {/* INTRO */}
      <EditableText
        value={
          content.intro ||
          "KANGARU GIRLS' SCHOOL is a center of excellence dedicated to nurturing young girls' into confident, capable leaders."
        }
        onSave={(val) => updateSection("intro", val)}
        isAdmin={user?.role === "admin"}
      />

      {/* MOTTO */}
      <div style={{ marginTop: "30px", marginBottom: "20px", textAlign: "left" }}>
        <EditableSubheading
          value={content.mottoHeading || "MOTTO"}
          onSave={(val) => updateSection("mottoHeading", val)}
          isAdmin={user?.role === "admin"}
          level={3}
          style={{ color: "#2c3e50", fontWeight: "bold", textAlign: "left" }}
        />
        <div style={{ color: "#34495e", fontSize: "1.1rem", marginTop: "8px", textAlign: "left" }}>
          <EditableText
            value={content.motto || "Grow in Grace"}
            onSave={(val) => updateSection("motto", val)}
            isAdmin={user?.role === "admin"}
          />
        </div>
      </div>

      {/* VISION */}
      <div style={{ marginTop: "30px", marginBottom: "20px", textAlign: "left" }}>
        <EditableSubheading
          value={content.visionHeading || "VISION"}
          onSave={(val) => updateSection("visionHeading", val)}
          isAdmin={user?.role === "admin"}
          level={3}
          style={{ color: "#2c3e50", fontWeight: "bold", textAlign: "left" }}
        />
        <div style={{ color: "#34495e", fontSize: "1.1rem", marginTop: "8px", textAlign: "left" }}>
          <EditableText
            value={
              content.vision ||
              "Holistically Developed Person"
            }
            onSave={(val) => updateSection("vision", val)}
            isAdmin={user?.role === "admin"}
          />
        </div>
      </div>

      {/* MISSION */}
      <div style={{ marginTop: "30px", marginBottom: "20px", textAlign: "left" }}>
        <EditableSubheading
          value={content.missionHeading || "MISSION"}
          onSave={(val) => updateSection("missionHeading", val)}
          isAdmin={user?.role === "admin"}
          level={3}
          style={{ color: "#2c3e50", fontWeight: "bold", textAlign: "left" }}
        />
        <div style={{ color: "#34495e", fontSize: "1.1rem", marginTop: "8px", textAlign: "left" }}>
          <EditableText
            value={
              content.mission ||
              "Nurture excellence in a well-integrated person in line with Vision 2030"
            }
            onSave={(val) => updateSection("mission", val)}
            isAdmin={user?.role === "admin"}
          />
        </div>
      </div>

      {/* CORE VALUES */}
      <div style={{ marginTop: "30px", marginBottom: "20px", textAlign: "left" }}>
        <h3 style={{ color: "#2c3e50", fontWeight: "bold", fontSize: "1.3rem", marginBottom: "15px", textAlign: "left" }}>
          CORE VALUES
        </h3>
        <ul className="about-core-values" style={{
          listStyleType: "disc",
          paddingLeft: "40px",
          color: "#34495e",
          fontSize: "1.05rem",
          lineHeight: "2",
          textAlign: "left"
        }}>
          <li>Responsibility</li>
          <li>Accountability & Transparency</li>
          <li>Honesty</li>
          <li>Integrity</li>
          <li>Respect</li>
          <li>Team Work</li>
          <li>Humility</li>
          <li>Professionalism</li>
          <li>Self & Emotional Awareness</li>
          <li>Creativity & Innovation</li>
        </ul>
      </div>

      {/* PROMISE */}
      <div style={{ marginTop: "30px", marginBottom: "20px", textAlign: "left" }}>
        <EditableSubheading
          value={content.promiseHeading || "Our Promise"}
          onSave={(val) => updateSection("promiseHeading", val)}
          isAdmin={user?.role === "admin"}
          level={3}
          style={{ color: "#2c3e50", fontWeight: "bold", textAlign: "left" }}
        />
        <div style={{ color: "#34495e", fontSize: "1.1rem", marginTop: "8px", textAlign: "left" }}>
          <EditableText
            value={content.promise || "Excellence, Our Choice"}
            onSave={(val) => updateSection("promise", val)}
            isAdmin={user?.role === "admin"}
          />
        </div>
      </div>
      </div>

      {/* ================= PRINCIPAL AND DEPUTY SECTION ================= */}
      {!loadingStaff && (
      <div
        className="about-leadership"
        style={{
          marginTop: 40,
          paddingTop: 20,
          borderTop: "1px solid #eee",
        }}
      >
        {staff.filter(s => s.type === "principal").map(principal => (
          <div
            key={principal._id}
            className="about-leader-card about-principal"
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
                marginBottom: 16,
                margin: "0 auto 16px auto",
                border: "3px solid #ddd",
              }}
            >
              <OptimizedImage
                src={principal.photoUrl || "/images/Principal.png"}
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
            <p style={{ color: "#34495e", fontSize: "0.95rem", marginBottom: "15px" }}>{principal.title}</p>
            <p style={{ color: "#34495e", lineHeight: "1.6" }}>{principal.remarks || "Welcome to Kangaru Girls School"}</p>
          </div>
        ))}

        {/* DEPUTY PRINCIPALS - TWO COLUMNS BELOW */}
        <div
          className="about-deputies"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap"
          }}
        >
          {staff.filter(s => s.type === "deputy_principal").map((deputy, idx) => (
            <div
              key={deputy._id}
              className="about-leader-card"
              style={{
                flex: 1,
                textAlign: "center",
                maxWidth: 500,
                minWidth: window.innerWidth <= 768 ? "100%" : "48%"
              }}
            >
              <div
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  overflow: "hidden",
                  marginBottom: 16,
                  margin: "0 auto 16px auto",
                  border: "3px solid #ddd",
                }}
              >
                <OptimizedImage
                  src={deputy.photoUrl || "/images/DSC_5372.jpg"}
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

              <h3>{deputy.title}</h3>
              <p style={{ fontWeight: "bold" }}>{deputy.fullName}</p>
              <p style={{ color: "#34495e", lineHeight: "1.6" }}>{deputy.remarks || "Dedicated to student success"}</p>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* ERROR */}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </section>
  );
}
