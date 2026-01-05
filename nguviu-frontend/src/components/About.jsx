import { useEffect, useState } from "react";
import { get, patch } from "../utils/api";
import EditableText from "../components/EditableText";
import EditableHeading from "../components/EditableHeading";
import EditableSubheading from "../components/EditableSubheading";

export default function About({ user }) {
  const [content, setContent] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    get("/api/content/about")
      .then((data) => setContent(data || {}))
      .catch(() => setError("Failed to load about page content."));
  }, []);

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

  return (
    <section style={{ padding: 20 }}>
      {/* ================= HERO / TOP BACKGROUND SECTION ================= */}
      <div
        style={{
            position: "relative",
    width: "100vw",
    marginLeft: "50%",
    transform: "translateX(-50%)",
    maxHeight: 1000,
    overflow: "hidden",
    height: 500,
          backgroundImage: `url(${
           
            content.heroBackgroundUrl || "/images/hero.jpg"
          })`,
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
              color: "#ffffff",
              textAlign: "center"
            }}
          >
            <EditableHeading
              value={content.heroTitle || "Welcome to Nguviu Girls' School"}
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

      {/* TITLE */}
      <EditableHeading
        value={content.title || "About Nguviu Girls' School"}
        onSave={(val) => updateSection("title", val)}
        isAdmin={user?.role === "admin"}
        level={2}
      />

      {/* INTRO */}
      <EditableText
        value={
          content.intro ||
          "Nguviu Girls' School is a center of excellence dedicated to nurturing young girls' into confident, capable leaders."
        }
        onSave={(val) => updateSection("intro", val)}
        isAdmin={user?.role === "admin"}
      />

      {/* MOTTO */}
      <EditableSubheading
        value={content.mottoHeading || "Our Motto"}
        onSave={(val) => updateSection("mottoHeading", val)}
        isAdmin={user?.role === "admin"}
        level={3}
      />

      <EditableText
        value={content.motto || "Empowering Girls, Transforming Lives"}
        onSave={(val) => updateSection("motto", val)}
        isAdmin={user?.role === "admin"}
      />

      {/* CORE VALUES */}
      <EditableSubheading
        value={content.coreValuesHeading || "Our Core Values"}
        onSave={(val) => updateSection("coreValuesHeading", val)}
        isAdmin={user?.role === "admin"}
        level={3}
      />

      {/* Admin edits text, public sees list */}
      {user?.role === "admin" ? (
        <EditableText
          value={
            content.coreValues ||
            "Integrity\nExcellence\nEmpowerment\nRespect\nInnovation"
          }
          onSave={(val) => updateSection("coreValues", val)}
          isAdmin
        />
      ) : (
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            paddingLeft: "20px",
            lineHeight: "1.8"
          }}
        >
          {coreValues.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}

      {/* MISSION */}
      <EditableSubheading
        value={content.missionHeading || "Our Mission"}
        onSave={(val) => updateSection("missionHeading", val)}
        isAdmin={user?.role === "admin"}
        level={3}
      />

      <EditableText
        value={
          content.mission ||
          "To provide a safe, inclusive, and academically rigorous environment where every girl thrives."
        }
        onSave={(val) => updateSection("mission", val)}
        isAdmin={user?.role === "admin"}
      />

      {/* VISION */}
      <EditableSubheading
        value={content.visionHeading || "Our Vision"}
        onSave={(val) => updateSection("visionHeading", val)}
        isAdmin={user?.role === "admin"}
        level={3}
      />

      <EditableText
        value={
          content.vision ||
          "To nurture confident, responsible, and innovative young girls who positively impact their communities."
        }
        onSave={(val) => updateSection("vision", val)}
        isAdmin={user?.role === "admin"}
      />

      {/* PROMISE */}
      <EditableSubheading
        value={content.promiseHeading || "Our Promise"}
        onSave={(val) => updateSection("promiseHeading", val)}
        isAdmin={user?.role === "admin"}
        level={3}
      />
      <EditableText
        value={content.promise || "Excellence, Our Choice"}
        onSave={(val) => updateSection("promise", val)}
        isAdmin={user?.role === "admin"}
      />

      {/* ================= PRINCIPAL AND DEPUTY SECTION ================= */}
      <div
        style={{
          marginTop: 40,
          paddingTop: 20,
          borderTop: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          gap: "20px", // Space between Principal and Deputy sections
        }}
      >
        {/* PRINCIPAL SECTION */}
        <div

          style={{
            textAlignLast: "center",
            textAlign: "center",
            flex: 1,
            textweight: "bold",
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
              border: "3px solid #ddd",
            }}
          >
            <img
              src={content.principalImageUrl || "/images/background images/principle.jpeg"}
              alt="Principal"
              
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
          </div>

          <h3>Principal's Remarks</h3>,
          <p style={{ fontWeight: "bold" }}>Dr. Elizabeth Musili</p>

          <EditableText
            value={
              content.principalMessage ||
              "At Nguviu Girls School, we believe that every girl has a unique potential. Our commitment is to provide a supportive environment where she can discover her strengths, grow in character, and pursue academic excellence with confidence."
            }
            onSave={(val) => updateSection("principalMessage", val)}
            isAdmin={user?.role === "admin"}
          />
        </div>

        {/* DEPUTY PRINCIPAL SECTION */}
        <div
          style={{
            flex: 1,
            textAlign: "center",
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
              border: "3px solid #ddd",
            }}
          >
            <img
              src={content.deputyImageUrl || "/images/background images/deputy.jpeg"}
              alt="Deputy Principal"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
          </div>

          <h3>Deputy Principal Remarks(Administration)</h3>
          <p style={{ fontWeight: "bold" }}>Ms. Magret kariuki</p>
          <EditableText
            value={
              content.deputyMessage ||
              "As the Deputy Principal, I am committed to ensuring that each student receives the guidance and support necessary for their personal and academic growth."
            }
            onSave={(val) => updateSection("deputyMessage", val)}
            isAdmin={user?.role === "admin"}
          />
        </div>
      </div>

      {/* ERROR */}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </section>
  );
}
