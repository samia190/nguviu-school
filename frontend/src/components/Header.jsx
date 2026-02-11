import React, { useState } from "react";
import { safePath } from "../utils/paths";
import OptimizedImage from "./OptimizedImage";

export default function Header({ route, setRoute, setLoading, user, logout }) {
  const go = (r) => {
    if (typeof setLoading === "function") setLoading(true);
    setRoute && setRoute(r);
  };

  const navButtonStyle = (active) => ({
    background: active ? "purple" : "transparent",
    color: active ? "yellow" : "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: active ? "bold" : "normal",
    fontSize: "0.9rem",
    whiteSpace: "nowrap",
    flexShrink: 0,
  });

  const [openSubmenu, setOpenSubmenu] = useState(null);

  const subLinks = {
    curriculum: [
      { key: "curriculum/overview", label: "Overview" },
      { key: "curriculum/primary", label: "Primary" },
      { key: "curriculum/secondary", label: "Secondary" },
      { key: "curriculum/syllabus", label: "Syllabus" },
      { key: "curriculum/extracurricular", label: "Extracurricular" },
      { key: "curriculum/assessment", label: "Assessment" },
      { key: "curriculum/careers", label: "Careers" },
    ],
    student: [
      { key: "student/admissions-guide", label: "Admissions Guide" },
      { key: "student/fees", label: "Fees" },
      { key: "student/exams", label: "Exams" },
      { key: "student/clubs", label: "Clubs" },
      { key: "student/support-services", label: "Support Services" },
    ],
    staff: [
      { key: "staff/leadership", label: "Leadership" },
      { key: "staff/teaching", label: "Teaching" },
      { key: "staff/support", label: "Support" },
    ],
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "blue",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        boxSizing: "border-box",
        zIndex: 500,
        gap: 15,
        minHeight: "fit-content",
      }}
      className="main-header"
    >
      {/* Logo + School Name + Tagline */}
      <div
        onClick={() => go("home")}
        style={{ display: "flex", flexDirection: "column", gap: 2, cursor: "pointer", flex: "0 0 auto", minWidth: "fit-content" }}
      >
        {/* Top: Logo + Name */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Back button: appears when not on home */}
          {route && route !== "home" && (
            <button
              onClick={() => {
                if (window && typeof window.__goBack === "function") window.__goBack();
                else go("home");
              }}
              aria-label="Go back"
              style={{
                marginRight: 4,
                padding: "4px 6px",
                borderRadius: 6,
                border: "none",
                background: "rgba(255,255,255,0.9)",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ←
            </button>
          )}
          <OptimizedImage
            alt="KANGARU GIRLS Logo"
            src="/header/logo.png"
            priority={true}
            style={{
              width: 50,
              height: 50,
              objectFit: "contain",
              borderRadius: 4,
            }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "";
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <strong style={{ fontSize: 12, color: "#fff" }}>KANGARU GIRLS' SENIOR SCHOOL</strong>
            
          </div>
        </div>
        
        {/* Tagline */}
        <div style={{ display: "flex", flexDirection: "column", paddingLeft: route && route !== "home" ? 62 : 58 }}>
          <small
            style={{
              color: "skyblue",
              fontSize: 11,
              fontStyle: "italic",
              fontWeight: "bold",
            }}
          >
            Grow in Grace
          </small>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", flex: 1, justifyContent: "flex-end" }}>
        {/* Quick access buttons */}
        <button onClick={() => go("home")} style={navButtonStyle(route === "home")}>
          Home
        </button>
        <button onClick={() => go("about")} style={navButtonStyle(route === "about")}>
          About
        </button>

        {/* Curriculum parent + submenu */}
        <div
          onMouseEnter={() => setOpenSubmenu("curriculum")}
          onMouseLeave={() => setOpenSubmenu(null)}
          style={{ position: "relative" }}
        >
          <button onClick={() => go("curriculum") } style={navButtonStyle(route && route.split("/")[0] === "curriculum")}>
            Curriculum
          </button>
          {openSubmenu === "curriculum" && (
            <div
              style={{
                position: "absolute",
                top: 36,
                left: 0,
                background: "#fff",
                color: "#111",
                padding: 8,
                borderRadius: 6,
                boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                zIndex: 600,
              }}
            >
              {subLinks.curriculum.map((s) => (
                <div key={s.key} style={{ marginBottom: 6 }}>
                  <button
                    onClick={() => go(s.key)}
                    style={{ padding: "6px 8px", border: "none", background: "transparent", cursor: "pointer" }}
                  >
                    {s.label}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student parent + submenu */}
        <div
          onMouseEnter={() => setOpenSubmenu("student")}
          onMouseLeave={() => setOpenSubmenu(null)}
          style={{ position: "relative" }}
        >
          <button onClick={() => go("student")} style={navButtonStyle(route && route.split("/")[0] === "student") }>
            Student
          </button>
          {openSubmenu === "student" && (
            <div
              style={{
                position: "absolute",
                top: 36,
                left: 0,
                background: "#fff",
                color: "#111",
                padding: 8,
                borderRadius: 6,
                boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                zIndex: 600,
              }}
            >
              {subLinks.student.map((s) => (
                <div key={s.key} style={{ marginBottom: 6 }}>
                  <button
                    onClick={() => go(s.key)}
                    style={{ padding: "6px 8px", border: "none", background: "transparent", cursor: "pointer" }}
                  >
                    {s.label}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => go("contact")} style={navButtonStyle(route === "contact")}>
          Contact
        </button>
        <button
          onClick={() => go("performance")}
          style={navButtonStyle(route === "performance")}
        >
          Performance
        </button>
        <button
          onClick={() => go("feestructure")}
          style={navButtonStyle(route === "feestructure")}
        >
          FeeStructure
        </button>

        {/* Staff parent + submenu */}
        <div
          onMouseEnter={() => setOpenSubmenu("staff")}
          onMouseLeave={() => setOpenSubmenu(null)}
          style={{ position: "relative" }}
        >
          <button onClick={() => go("staff")} style={navButtonStyle(route && route.split("/")[0] === "staff") }>
            Staff
          </button>
          {openSubmenu === "staff" && (
            <div
              style={{
                position: "absolute",
                top: 36,
                left: 0,
                background: "#fff",
                color: "#111",
                padding: 8,
                borderRadius: 6,
                boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                zIndex: 600,
              }}
            >
              {subLinks.staff.map((s) => (
                <div key={s.key} style={{ marginBottom: 6 }}>
                  <button
                    onClick={() => go(s.key)}
                    style={{ padding: "6px 8px", border: "none", background: "transparent", cursor: "pointer" }}
                  >
                    {s.label}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Apply Now Button - Highlighted */}
        <button 
          onClick={() => go("admission")} 
          style={{
            ...navButtonStyle(route === "admission"),
            background: route === "admission" ? "skyblue" : "linear-gradient(135deg, greenyellow 50%, skyblue 50%)",
            color: route === "admission" ? "yellow" : "skyblack",
            fontWeight: "bold",
            padding: "6px 10px",
            fontSize: "0.9rem",
            boxShadow: "0 4px 8px rgba(40, 167, 69, 0.3)",
            border: route === "admission" ? "2px solid #28a745" : "none",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (route !== "admission") {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 12px rgba(40, 167, 69, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(40, 167, 69, 0.3)";
          }}
        >
          📝 Apply Now
        </button>

        {/* Auth buttons or user info */}
        {!user ? (
          <>
            <button onClick={() => go("login")} style={{ ...buttonStyle, background: "linear-gradient(135deg, greenyellow 50%, skyblue 50%)" }}>
              Log in
            </button>
            <button onClick={() => go("signup")} style={{ ...buttonStyle, background: "linear-gradient(135deg, greenyellow 50%, skyblue 50%)" }}>
              Sign up
            </button>
          </>
        ) : (
          <>
            <span style={{ padding: "0 8px", fontSize: 14, color: "linear-gradient(135deg, greenyellow 50%, skyblue 50%)" }}>
              {user.email} ({user.role})
            </span>
            {user.role === "admin" && (
              <button onClick={() => go("admin")} style={{ ...buttonStyle, background: "linear-gradient(135deg, green 50%, pink 50%)" }}>
                Admin
              </button>
            )}
            <button
              onClick={() => {
                logout && logout();
                go("home");
              }}
              style={buttonStyle}
            >
              Log out
            </button>
          </>
        )}
      </nav>
      
      {/* Responsive styles */}
      <style>{`
        .main-header nav button,
        .main-header nav > div {
          flex-shrink: 0;
          white-space: nowrap;
        }
        
        /* Desktop: Full layout */
        @media (min-width: 1200px) {
          .main-header nav button,
          .main-header nav > div button {
            font-size: 0.9rem;
          }
        }
        
        /* Tablet: logo + name on single line, nav on second line */
        @media (min-width: 481px) and (max-width: 1199px) {
          .main-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 8px 12px !important;
            gap: 8px;
          }
          
          .main-header nav {
            width: 100%;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 6px !important;
          }
        }
        
        /* Mobile: Compact layout */
        @media (max-width: 480px) {
          .main-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 8px 12px !important;
            gap: 8px;
          }
          
          .main-header nav {
            width: 100%;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 4px !important;
          }
          
          .main-header nav button {
            font-size: 0.75rem !important;
            padding: 4px 8px !important;
          }
          
          .main-header nav > div button {
            font-size: 0.75rem !important;
            padding: 4px 8px !important;
          }
        }
      `}</style>
    </header>
  );
}

const buttonStyle = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "#cf0a0aff",
  color: "#fff",
  cursor: "pointer",
  fontSize: "0.9rem",
  whiteSpace: "nowrap",
};
