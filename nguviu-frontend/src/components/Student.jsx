import { useEffect, useState } from "react";
import { get, patch } from "../utils/api";
import EditableHeading from "../components/EditableHeading";
import EditableSubheading from "../components/EditableSubheading";
import EditableText from "../components/EditableText";
import EditableFileList from "../components/EditableFileList";
import { safePath } from "../utils/paths";

export default function Student({ user }) {
  const route = window.__route;
  const [mainRoute, subRoute] = route.split("/");
  const tab = subRoute || "home";

  const switchTab = (key) => {
    window.setRoute(`student/${key}`);
  };

  const [content, setContent] = useState({});
  const [error, setError] = useState("");

  // Load page content
  useEffect(() => {
    get("/api/content/students")
      .then((data) => setContent(data || {}))
      .catch(() => setError("Failed to load student resources."));
  }, []);

  // Admin update handler
  function updateSection(section, value) {
    patch(`/api/content/students/${section}`, { value })
      .then(() => {
        setContent((prev) => ({ ...prev, [section]: value }));
      })
      .catch((err) => {
        console.error("Failed to save:", err);
        alert("Failed to save content.");
      });
  }

  const isAdmin = user?.role === "admin";

  // Default gallery groups (for first load / non-configured state)
  const defaultAcademicGallery = [
    {
      name: "",
      url: "/images/students/IMG_0778.JPG",
    },
    {
      name: "",
      url:"/images/students/IMG_1030.JPG",
    },
    {
      name: "",
      url: "/images/students/IMG_1043.JPG",
       
    },
    {
      name: "",
      url: "/images/students/IMG_1056.JPG",
    },
    {
      name: "",
      url: "/images/students/IMG_1067.JPG",
    },
    {
      name: "",
      url: "/images/students/IMG_1086.JPG",
    },
    {
      name: "",
      url: "/images/students/IMG_1329.JPG",
    },
    {
      name: "",
      url: "/images/students/IMG_1447.JPG",
    },
    {
      name: "",
      url: "/images/students/IMG_0786.JPG",
    },
    {
      name: "",
      url: "/images/students/student life.JPG",
    },
    {
      name: "",
      url: "/images/students/life 2.JPG",
    },
    {
      name: "",
      url: "/images/students/life 1.JPG",
    },
    {
      name: "",
      url: "/images/students/life 5.JPG",
    },
    {
      name: "",
      url: "/images/students/life.JPG",
    },
    {
      name: "",
      url: "/images/students/sc (3).JPG",
    },
    {
      name: "",
      url: "/images/students/sc(2).JPG",
    },
    {
      name: "",
      url: "/images/students/sc.JPG",
    },
    {
      name: "",
      url: "/images/students/std 7.JPG",
    },
    {
      name: "",
      url: "/images/students/std 4.JPG",
    },
    {
      name: "",
      url: "/images/students/std 2.JPG",
    },
    {
      name: "",
      url: "/images/students/std 0.JPG",
    }
    
  ];

  const defaultCocurricularGallery = [
    { name: "", url: "/images/students/IMG_1257.JPG" },
    { name: "", url: "/images/students/IMG_1221.JPG" },
    { name: "", url: "/images/students/IMG_1194.JPG" },
    { name: "", url: "/images/students/IMG_1329.JPG" },
    { name: "", url: "/images/students/IMG_1332.JPG" },
    { name: "", url: "/images/students/IMG_1413.JPG" },
    { name: "", url: "/images/students/IMG_1415.JPG" },
    { name: "", url: "/images/students/IMG_1424.JPG" },
    { name: "", url: "/images/students/IMG_1443.JPG" },
    { name: "", url: "/images/students/IMG_1444.JPG" },
    { name: "", url: "/images/students/IMG_1447.JPG" },
    { name: "", url: "/images/students/IMG_1449.JPG" },
    { name: "", url: "/images/students/IMG_1458.JPG" },
    { name: "", url: "/images/students/IMG_1459.JPG" },
    { name: "", url: "/images/students/IMG_1475.JPG" },
    { name: "", url: "/images/students/IMG_1528.JPG" },
    { name: "", url: "/images/students/IMG_1641.JPG" },
    { name: "", url: "/images/students/IMG_1644.JPG" },
    { name: "", url: "/images/students/IMG_1649.JPG" },
    { name: "", url: "/images/students/IMG_1650.JPG" },
    { name: "", url: "/images/students/IMG_1651.JPG" },
    { name: "", url: "/images/students/IMG_1653.JPG" },
    { name: "", url: "/images/students/IMG_1655.JPG" },
    { name: "", url: "/images/students/IMG_1659.JPG" },
    { name: "", url: "/images/students/IMG_1667.JPG" },
    { name: "", url: "/images/students/IMG_1669.JPG" },
    { name: "", url: "/images/students/IMG_1671.JPG" },
    { name: "", url: "/images/students/IMG_1672.JPG" },
    { name: "", url: "/images/students/IMG_1673.JPG" },
    { name: "", url: "/images/students/IMG_1674.JPG" },
    { name: "", url: "/images/students/IMG_1675.JPG" },
    { name: "", url: "/images/students/IMG_1676.JPG" },
    { name: "", url: "/images/students/IMG_1677.JPG" },
    { name: "", url: "/images/students/IMG_1680.JPG" },
    { name: "", url: "/images/students/IMG_1681.JPG" },
    { name: "", url: "/images/students/IMG_1682.JPG" },
    { name: "", url: "/images/students/IMG_1683.JPG" },
    { name: "", url: "/images/students/IMG_1684.JPG" },
    { name: "", url: "/images/students/IMG_1685.JPG" },
    { name: "", url: "/images/students/IMG_1686.JPG" },
    { name: "", url: "/images/students/IMG_1687.JPG" },
    { name: "", url: "/images/students/IMG_1688.JPG" },
    { name: "", url: "/images/students/IMG_1689.JPG" },
    { name: "", url: "/images/students/IMG_1690.JPG" },
    { name: "", url: "/images/students/IMG_1691.JPG" },
    { name: "", url: "/images/students/IMG_1692.JPG" },
    { name: "", url: "/images/students/IMG_1693.JPG" },
    { name: "", url: "/images/students/IMG_1745.JPG" },
    { name: "", url: "/images/students/IMG_1741.JPG" },
  ];

  const academicGalleryFiles =
    content.academicGalleryFiles ||defaultAcademicGallery
  const cocurricularGalleryFiles =
    content.cocurricularGalleryFiles  ||defaultCocurricularGallery

  return (
    <div>
      {/* ================= HERO VIDEO SECTION ================= */}
      {/* ================= HERO VIDEO SECTION ================= */}
<div
  style={{
    position: "relative",
    width: "100vw",
    marginLeft: "50%",
    transform: "translateX(-50%)",
    maxHeight: 420,
    overflow: "hidden",
  }}
>
  <video
    width="100%"
    height="100%"
    autoPlay
    loop
    muted
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
    }}
  >
    <source
      src={safePath(content.heroVideoUrl || "/images/students/life 1.mp4")}
      type="video/mp4"
    />
    Your browser does not support the video tag.
  </video>

  {/* Dark overlay */}
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.65))",
    }}
  />

  {/* Text container */}
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
      <EditableHeading
        value={content.heroTitle || "Welcome to the Student Portal"}
        onSave={(val) => updateSection("heroTitle", val)}
        isAdmin={isAdmin}
        level={2}
      />

      <EditableText
        value={
          content.heroSubtitle ||
          "Access your resources, schedules, activities, and support — all in one place."
        }
        onSave={(val) => updateSection("heroSubtitle", val)}
        isAdmin={isAdmin}
      />
    </div>
  </div>
</div>

      <h1>Student Portal</h1>

      {/* ---------- TABS ---------- */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          borderBottom: "2px solid #ccc",
          paddingBottom: "10px",
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => switchTab("admissions-guide")}>
          Admissions Guide
        </button>
        <button onClick={() => switchTab("students")}>Students</button>
        <button onClick={() => switchTab("FeeStructure")}>
          Fee Structure
        </button>
        <button onClick={() => switchTab("exams")}>Exams</button>
        <button onClick={() => switchTab("clubs")}>Clubs</button>
        <button onClick={() => switchTab("support-services")}>
          Support Services
        </button>
      </div>

      {/* ---------- CONTENT ---------- */}
      <section style={{ padding: 20 }}>
        {/* TITLE */}
        <EditableHeading
          value={content.title || "Student Resources"}
          onSave={(val) => updateSection("title", val)}
          isAdmin={isAdmin}
          level={2}
        />

        {/* INTRO */}
        <EditableText
          value={
            content.intro ||
            "Welcome, students! Here you'll find everything you need to stay organized, involved, and informed."
          }
          onSave={(val) => updateSection("intro", val)}
          isAdmin={isAdmin}
        />

        {/* TIMETABLES */}
        <EditableSubheading
          value={content.timetableHeading || "Class Timetables"}
          onSave={(val) => updateSection("timetableHeading", val)}
          isAdmin={isAdmin}
          level={3}
        />

        <EditableFileList
          files={
            content.timetableFiles || [
              { name: "Form 1 Timetable", url: "/files/timetable-form1.pdf" },
              { name: "Form 2 Timetable", url: "/files/timetable-form2.pdf" },
              { name: "Form 3 Timetable", url: "/files/timetable-form3.pdf" },
              { name: "Form 4 Timetable", url: "/files/timetable-form4.pdf" },
            ]
          }
          onSave={(files) => updateSection("timetableFiles", files)}
          isAdmin={isAdmin}
        />

        {/* HOMEWORK */}
        <EditableSubheading
          value={content.homeworkHeading || "Homework Portal"}
          onSave={(val) => updateSection("homeworkHeading", val)}
          isAdmin={isAdmin}
          level={3}
        />

        <EditableText
          value={
            content.homeworkIntro ||
            "Access assignments and submit your work online. Use the portal link below and follow the guide."
          }
          onSave={(val) => updateSection("homeworkIntro", val)}
          isAdmin={isAdmin}
        />

        <EditableFileList
          files={
            content.homeworkFiles || [
              {
                name: "Homework Submission Guide",
                url: "/files/homework-guide.pdf",
              },
            ]
          }
          onSave={(files) => updateSection("homeworkFiles", files)}
          isAdmin={isAdmin}
        />

        <p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (window.setRoute) {
                window.setRoute("portal/homework");
              }
            }}
          >
            Go to Homework Portal
          </a>
        </p>

        {/* CLUBS */}
        <EditableSubheading
          value={content.clubsHeading || "Clubs & Extracurriculars"}
          onSave={(val) => updateSection("clubsHeading", val)}
          isAdmin={isAdmin}
          level={3}
        />

        <EditableText
          value={
            content.clubs ||
            "• Science Club – Thursdays at 3:30 PM\n" +
              "• Drama Club – Wednesdays at 4:00 PM\n" +
              "• Football Team – Practice on Mondays & Fridays\n" +
              "• Debate Society – Tuesdays at 3:45 PM"
          }
          onSave={(val) => updateSection("clubs", val)}
          isAdmin={isAdmin}
        />

        {/* STUDENT COUNCIL */}
        <EditableSubheading
          value={content.councilHeading || "Student Council"}
          onSave={(val) => updateSection("councilHeading", val)}
          isAdmin={isAdmin}
          level={3}
        />

        <EditableText
          value={
            content.councilIntro ||
            "Our student leaders represent your voice. Elections are held every January. Download the charter and candidate form below."
          }
          onSave={(val) => updateSection("councilIntro", val)}
          isAdmin={isAdmin}
        />

        <EditableFileList
          files={
            content.councilFiles || [
              {
                name: "Student Council Charter",
                url: "/files/student-council-charter.pdf",
              },
              { name: "Candidate Form", url: "/files/candidate-form.pdf" },
            ]
          }
          onSave={(files) => updateSection("councilFiles", files)}
          isAdmin={isAdmin}
        />

        {/* CODE OF CONDUCT */}
        <EditableSubheading
          value={content.conductHeading || "Code of Conduct"}
          onSave={(val) => updateSection("conductHeading", val)}
          isAdmin={isAdmin}
          level={3}
        />

        <EditableText
          value={
            content.conductIntro ||
            "All students are expected to uphold our values of respect, responsibility, and excellence."
          }
          onSave={(val) => updateSection("conductIntro", val)}
          isAdmin={isAdmin}
        />

        <EditableFileList
          files={
            content.conductFiles || [
              {
                name: "Code of Conduct",
                url: "/files/code-of-conduct.pdf",
              },
            ]
          }
          onSave={(files) => updateSection("conductFiles", files)}
          isAdmin={isAdmin}
        />

        {/* ================= STUDENT LIFE GALLERY ================= */}
        <EditableSubheading
          value={content.galleryHeading || "Student Life Gallery"}
          onSave={(val) => updateSection("galleryHeading", val)}
          isAdmin={isAdmin}
          level={3}
        />

        <EditableText
          value={
            content.galleryIntro ||
            "Explore moments from academic life and co-curricular activities at Nguviu Girls School."
          }
          onSave={(val) => updateSection("galleryIntro", val)}
          isAdmin={isAdmin}
        />

        {/* Academic Life Group */}
        <EditableSubheading
          value={content.academicGalleryHeading || "Academic Life"}
          onSave={(val) => updateSection("academicGalleryHeading", val)}
          isAdmin={isAdmin}
          level={4}
        />

        <EditableFileList
          files={academicGalleryFiles}
          onSave={(files) => updateSection("academicGalleryFiles", files)}
          isAdmin={isAdmin}
        />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginTop: 12,
          }}
        >
          {academicGalleryFiles.map((file) => (
            <div
              key={file.url}
              style={{
                width: "180px",
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                background: "#fff",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "140px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={safePath(file.url)}
                  alt={file.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div
                style={{
                  padding: "8px 10px",
                  fontSize: 13,
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                {file.name}
              </div>
            </div>
          ))}
        </div>

        {/* Co-curricular Group */}
        <EditableSubheading
          value={content.cocurricularGalleryHeading || "Co-curricular & Clubs"}
          onSave={(val) => updateSection("cocurricularGalleryHeading", val)}
          isAdmin={isAdmin}
          level={4}
        />

        <EditableFileList
          files={cocurricularGalleryFiles}
          onSave={(files) =>
            updateSection("cocurricularGalleryFiles", files)
          }
          isAdmin={isAdmin}
        />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginTop: 12,
          }}
        >
          {cocurricularGalleryFiles.map((file) => (
            <div
              key={file.url}
              style={{
                width: "180px",
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                background: "#fff",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "140px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={safePath(file.url)}
                  alt={file.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div
                style={{
                  padding: "8px 10px",
                  fontSize: 13,
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                {file.name}
              </div>
            </div>
          ))}
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </section>
    </div>
  );
}
