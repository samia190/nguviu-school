import { useEffect, useState } from "react";
import { get } from "../utils/api";
import { cachedGet } from "../utils/apiCache";
import Loader from "./Loader";
import LazyImage from "./LazyImage";

// Subpage components (lazy-loaded in App.jsx, eagerly here as they're small stubs)
import StudentAdmissionsGuide from "./subpages/StudentAdmissionsGuide.jsx";
import StudentFees from "./subpages/StudentFees.jsx";
import StudentExams from "./subpages/StudentExams.jsx";
import StudentClubs from "./subpages/StudentClubs.jsx";
import StudentSupportServices from "./subpages/StudentSupportServices.jsx";

const subpageMap = {
  "admissions-guide": StudentAdmissionsGuide,
  fees: StudentFees,
  exams: StudentExams,
  clubs: StudentClubs,
  "support-services": StudentSupportServices,
};

const catColors = {
  general: "#6b7280",
  academic: "#3b82f6",
  exams: "#f59e0b",
  fees: "#10b981",
  events: "#8b5cf6",
  urgent: "#ef4444",
};

export default function Student({ user, subRoute, setRoute }) {
  const route = window.__route || "";
  const [, routeSub] = route.split("/");
  const currentSub = subRoute || routeSub || null;

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    cachedGet("/api/student-page", get)
      .then((d) => { setPage(d); setError(""); })
      .catch(() => setError("Failed to load student portal"))
      .finally(() => setLoading(false));
  }, []);

  const switchTab = (key) => {
    if (typeof window.setRoute === "function") window.setRoute(key);
    else if (setRoute) setRoute(key);
  };

  // ─── Subpage view ─────────────────────────────────────────────────
  const SubComponent = subpageMap[currentSub];
  if (SubComponent) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button
            onClick={() => {
              if (window.__goBack) window.__goBack();
              else switchTab("student");
            }}
            style={{
              padding: "8px 16px", borderRadius: 6, border: "1px solid #d1d5db",
              cursor: "pointer", background: "#f9fafb", fontWeight: 600,
            }}
          >
            ← Back to Student Portal
          </button>
          <div style={{ fontWeight: 600, textTransform: "capitalize" }}>
            {currentSub.replace(/-/g, " ")}
          </div>
          <div />
        </div>
        <SubComponent user={user} />
      </div>
    );
  }

  // ─── Main student portal ──────────────────────────────────────────
  if (loading) return <Loader />;

  const {
    title = "Student Portal",
    subtitle = "",
    heroImage = "",
    heroOverlayText = "",
    sections = [],
    quickLinks = [],
    announcements = [],
  } = page || {};

  return (
    <div className="student-page">
      {/* ═══ HERO ═══ */}
      <div
        style={{
          position: "relative",
          width: "100vw",
          marginLeft: "50%",
          transform: "translateX(-50%)",
          minHeight: 320,
          background: heroImage
            ? `url(${heroImage}) center/cover no-repeat`
            : "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.65))" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 700, padding: "40px 20px" }}>
          <h1 style={{ fontSize: "2.5rem", margin: "0 0 12px", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
            {heroOverlayText || title}
          </h1>
          <p style={{ fontSize: "1.15rem", opacity: 0.92, margin: 0 }}>{subtitle}</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>

        {/* ═══ QUICK LINKS ═══ */}
        {quickLinks.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: 12,
            marginBottom: 32,
          }}>
            {quickLinks.map((lnk) => {
              // Check auth requirements
              if (lnk.requiresAuth && !user) return null;
              if (lnk.requiresAuth && lnk.allowedRoles?.length > 0 && !lnk.allowedRoles.includes(user?.role)) return null;

              return (
                <button
                  key={lnk._id || lnk.route}
                  onClick={() => switchTab(lnk.route)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1e40af",
                    minHeight: 90,
                    transition: "all 0.2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
                  }}
                >
                  <span style={{ fontSize: 28, marginBottom: 6 }}>{lnk.icon}</span>
                  <span>{lnk.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ═══ ANNOUNCEMENTS ═══ */}
        {announcements.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: 12, color: "#1e293b" }}>📢 Announcements</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {announcements.map((ann) => (
                <div
                  key={ann._id}
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    padding: "14px 18px",
                    borderLeft: `4px solid ${catColors[ann.category] || "#ccc"}`,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                    <strong style={{ fontSize: 15 }}>{ann.title}</strong>
                    <span style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: catColors[ann.category] || "#e5e7eb",
                      color: "#fff",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}>
                      {ann.category}
                    </span>
                  </div>
                  {ann.body && <p style={{ margin: "4px 0 0", fontSize: 14, color: "#4b5563", lineHeight: 1.5 }}>{ann.body}</p>}
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                    {ann.date ? new Date(ann.date).toLocaleDateString() : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SECTIONS ═══ */}
        {sections.map((sec) => (
          <div key={sec._id || sec.key} style={{
            background: "#fff",
            borderRadius: 10,
            padding: "24px",
            marginBottom: 20,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <h2 style={{ fontSize: "1.3rem", margin: "0 0 10px", color: "#1e293b" }}>{sec.heading}</h2>
            {sec.intro && (
              <p style={{ color: "#4b5563", lineHeight: 1.6, margin: "0 0 14px", whiteSpace: "pre-line" }}>{sec.intro}</p>
            )}

            {/* Homework section gets a link to the portal */}
            {sec.key === "homework" && (
              <button
                onClick={() => switchTab("portal/homework")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 12,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                📚 Go to Homework Portal
              </button>
            )}

            {/* Files */}
            {sec.files && sec.files.length > 0 && (
              <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                {sec.files.map((f, i) => (
                  <a
                    key={f._id || i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={f.name}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 14px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      borderRadius: 6,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 500,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; }}
                  >
                    📎 {f.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}

        {error && <p style={{ color: "#ef4444", textAlign: "center" }}>{error}</p>}
      </div>
    </div>
  );
}
