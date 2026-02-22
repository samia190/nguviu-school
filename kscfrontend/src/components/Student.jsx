import { useEffect, useState } from "react";
import LazyImage from "../components/LazyImage";
import { get, patch } from "../utils/api";
import EditableHeading from "../components/EditableHeading";
import EditableSubheading from "../components/EditableSubheading";
import EditableText from "../components/EditableText";
import EditableFileList from "../components/EditableFileList";
import { safePath } from "../utils/paths";
import OptimizedVideo from "../components/OptimizedVideo";
import HeroCarousel from "../components/HeroCarousel";
import StudentAdmissionsGuide from "./subpages/StudentAdmissionsGuide.jsx";
import StudentFees from "./subpages/StudentFees.jsx";
import StudentExams from "./subpages/StudentExams.jsx";
import StudentClubs from "./subpages/StudentClubs.jsx";
import StudentSupportServices from "./subpages/StudentSupportServices.jsx";

export default function Student({ user, subRoute }) {
  const route = window.__route;
  const [mainRoute, routeSub] = route.split("/");
  const currentSub = subRoute || routeSub || null;

  const switchTab = (key) => {
    if (typeof window.setRoute === "function") window.setRoute(`student/${key}`);
    else window.setRoute && window.setRoute(`student/${key}`);
  };

  const subpageMap = {
    "admissions-guide": StudentAdmissionsGuide,
    fees: StudentFees,
    exams: StudentExams,
    clubs: StudentClubs,
    "support-services": StudentSupportServices,
  };

  const [content, setContent] = useState({});
  const [error, setError] = useState("");
  const [heroContent, setHeroContent] = useState(null);

  // Load page content and hero content
  useEffect(() => {
    Promise.all([
      get("/api/content/students").catch(() => ({})),
      get("/api/hero-content?page=student").catch(() => null)
    ])
      .then(([studentData, heroData]) => {
        setContent(studentData || {});
        // Separate heroes by type
        if (heroData && Array.isArray(heroData)) {
          const activeHeros = heroData.filter(h => h.active !== false);
          if (activeHeros.length > 0) {
            // Check for video type first, then slide, then image
            const videoHero = activeHeros.find(h => h.type === "video");
            const slideHeros = activeHeros.filter(h => h.type === "slide");
            const imageHero = activeHeros.find(h => h.type === "image");
            
            // Use video if exists, slides if multiple, image as fallback
            if (videoHero) {
              setHeroContent({ type: "video", data: videoHero });
            } else if (slideHeros.length > 0) {
              setHeroContent({ type: "slide", data: slideHeros });
            } else if (imageHero) {
              setHeroContent({ type: "image", data: imageHero });
            }
          }
        }
      })
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

  // Default gallery groups (for first load / non-configured state - now empty - gallery images managed via admin)
  const defaultAcademicGallery = [];

  const defaultCocurricularGallery = [];

  const academicGalleryFiles =
    content.academicGalleryFiles ||defaultAcademicGallery
  const cocurricularGalleryFiles =
    content.cocurricularGalleryFiles  ||defaultCocurricularGallery

  // Lightbox / viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerList, setViewerList] = useState([]);

  // Gallery carousel state
  const [academicStartIndex, setAcademicStartIndex] = useState(0);
  const [cocurricularStartIndex, setCocurricularStartIndex] = useState(0);
  const imagesPerPage = 4; // 2 rows x 2 columns

  function openViewer(list, index) {
    setViewerList(list || []);
    setViewerIndex(index || 0);
    setViewerOpen(true);
  }

  function closeViewer() {
    setViewerOpen(false);
  }

  function nextImage() {
    setViewerIndex((i) => (viewerList.length ? (i + 1) % viewerList.length : i));
  }

  function prevImage() {
    setViewerIndex((i) => (viewerList.length ? (i - 1 + viewerList.length) % viewerList.length : i));
  }

  function nextAcademicPage() {
    setAcademicStartIndex((prev) => 
      Math.min(prev + imagesPerPage, academicGalleryFiles.length - imagesPerPage)
    );
  }

  function prevAcademicPage() {
    setAcademicStartIndex((prev) => Math.max(0, prev - imagesPerPage));
  }

  function nextCocurricularPage() {
    setCocurricularStartIndex((prev) => 
      Math.min(prev + imagesPerPage, cocurricularGalleryFiles.length - imagesPerPage)
    );
  }

  function prevCocurricularPage() {
    setCocurricularStartIndex((prev) => Math.max(0, prev - imagesPerPage));
  }

  useEffect(() => {
    if (!viewerOpen) return;
    function onKey(e) {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen, viewerList]);

  return (
    <div className="student-page">
      {/* ================= HERO SECTION ================= */}
      {heroContent?.type === "slide" && heroContent.data?.length > 0 ? (
        <HeroCarousel slides={heroContent.data} height={420} />
      ) : heroContent?.type === "video" && heroContent.data?.url ? (
        <div
          className="student-hero"
          style={{
            position: "relative",
            width: "100vw",
            marginLeft: "50%",
            transform: "translateX(-50%)",
            maxHeight: 420,
            overflow: "hidden",
          }}
        >
          <OptimizedVideo
            src={heroContent.data.url}
            thumbnail={heroContent.data.thumbnail}
            autoPlay
            loop
            muted
            priority={true}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

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
                value={content.heroTitle || heroContent.data.title || "Welcome to the Student Portal"}
                onSave={(val) => updateSection("heroTitle", val)}
                isAdmin={isAdmin}
                level={2}
              />

              <EditableText
                value={content.heroSubtext || heroContent.data.description || "Discover our academic and co-curricular programs"}
                onSave={(val) => updateSection("heroSubtext", val)}
                isAdmin={isAdmin}
                style={{ color: "#ffffff", fontSize: 16 }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          className="student-hero"
          style={{
            position: "relative",
            width: "100vw",
            marginLeft: "50%",
            transform: "translateX(-50%)",
            maxHeight: 420,
            overflow: "hidden",
            background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
          }}
        >
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
                value={content.heroSubtext || "Discover our academic and co-curricular programs"}
                onSave={(val) => updateSection("heroSubtext", val)}
                isAdmin={isAdmin}
                style={{ color: "#ffffff", fontSize: 16 }}
              />
            </div>
          </div>
        </div>
      )}

      <h1>Student Portal</h1>

      {/* ---------- TABS ---------- */}
      <div
        className="student-tabs"
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
        {user?.role === "student" && (
          <button 
            onClick={() => window.setRoute("student-results")}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            📄 My Results
          </button>
        )}
      </div>

      {/* ---------- CONTENT ---------- */}
      {(() => {
        const Sub = subpageMap[currentSub];
        if (Sub) {
          return (
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <button
                    onClick={() => {
                      if (window && typeof window.__goBack === "function") window.__goBack();
                      else window.setRoute && window.setRoute("student");
                    }}
                    style={{ padding: "6px 8px", borderRadius: 6, border: "none", cursor: "pointer" }}
                  >
                    ← Back
                  </button>
                </div>
                <div style={{ fontWeight: "bold" }}>{currentSub.replace(/-/g, " ")}</div>
                <div />
              </div>

              <div>
                <Sub user={user} />
              </div>
            </div>
          );
        }

        return (
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
                "Explore moments from academic life and co-curricular activities at KANGARU GIRLS School."
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

            <div style={{ position: "relative", marginTop: 12 }}>
              {academicStartIndex > 0 && (
                <button
                  onClick={prevAcademicPage}
                  className="gallery-nav gallery-nav-prev"
                  aria-label="Previous images"
                >
                  ‹
                </button>
              )}
              
              <div className="gallery-grid gallery-grid-optimized">
                {academicGalleryFiles
                  .slice(academicStartIndex, academicStartIndex + imagesPerPage)
                  .map((file, idx) => {
                    const actualIndex = academicStartIndex + idx;
                    return (
                      <div key={file.url} className="gallery-item">
                        <button
                          className="gallery-thumb"
                          onClick={() => openViewer(academicGalleryFiles, actualIndex)}
                          aria-label={`Open image ${actualIndex + 1}`}
                          style={{
                            border: "none",
                            padding: 0,
                            background: "none",
                            cursor: "pointer",
                            width: "100%",
                            display: "block",
                          }}
                        >
                          <LazyImage 
                            src={safePath(file.url)} 
                            alt={file.name || `Academic life ${actualIndex + 1}`}
                            style={{
                              width: "100%",
                              height: "180px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                          />
                        </button>
                        {file.name && <div className="gallery-caption">{file.name}</div>}
                      </div>
                    );
                  })}
              </div>

              {academicStartIndex + imagesPerPage < academicGalleryFiles.length && (
                <button
                  onClick={nextAcademicPage}
                  className="gallery-nav gallery-nav-next"
                  aria-label="Next images"
                >
                  ›
                </button>
              )}
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

            <div style={{ position: "relative", marginTop: 12 }}>
              {cocurricularStartIndex > 0 && (
                <button
                  onClick={prevCocurricularPage}
                  className="gallery-nav gallery-nav-prev"
                  aria-label="Previous images"
                >
                  ‹
                </button>
              )}
              
              <div className="gallery-grid gallery-grid-optimized">
                {cocurricularGalleryFiles
                  .slice(cocurricularStartIndex, cocurricularStartIndex + imagesPerPage)
                  .map((file, idx) => {
                    const actualIndex = cocurricularStartIndex + idx;
                    return (
                      <div key={file.url} className="gallery-item">
                        <button
                          className="gallery-thumb"
                          onClick={() => openViewer(cocurricularGalleryFiles, actualIndex)}
                          aria-label={`Open image ${actualIndex + 1}`}
                          style={{
                            border: "none",
                            padding: 0,
                            background: "none",
                            cursor: "pointer",
                            width: "100%",
                            display: "block",
                          }}
                        >
                          <LazyImage 
                            src={safePath(file.url)} 
                            alt={file.name || `Co-curricular activity ${actualIndex + 1}`}
                            style={{
                              width: "100%",
                              height: "180px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                          />
                        </button>
                        {file.name && <div className="gallery-caption">{file.name}</div>}
                      </div>
                    );
                  })}
              </div>

              {cocurricularStartIndex + imagesPerPage < cocurricularGalleryFiles.length && (
                <button
                  onClick={nextCocurricularPage}
                  className="gallery-nav gallery-nav-next"
                  aria-label="Next images"
                >
                  ›
                </button>
              )}
            </div>

            {/* Lightbox viewer */}
            {viewerOpen && viewerList && viewerList.length > 0 && (
              <div className="lightbox-overlay" onClick={closeViewer}>
                <button
                  className="lightbox-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeViewer();
                  }}
                  aria-label="Close viewer"
                >
                  ×
                </button>

                <button
                  className="lightbox-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  aria-label="Previous image"
                >
                  ‹
                </button>

                <div
                  className="lightbox-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={safePath(viewerList[viewerIndex].url)}
                    alt={viewerList[viewerIndex].name}
                    className="lightbox-image"
                    loading="eager"
                  />
                </div>

                <button
                  className="lightbox-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  aria-label="Next image"
                >
                  ›
                </button>
              </div>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}
          </section>
        );
      })()}
    </div>
  );
}
