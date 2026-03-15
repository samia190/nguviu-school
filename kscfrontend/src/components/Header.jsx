import React, { useState, useRef, useEffect } from "react";
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

  // Measure header height and write to CSS custom property so all layout
  // elements (main content, hamburger button, drawer) always clear the header
  // regardless of screen size, font-load, or orientation change.
  const headerRef = useRef(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--header-h', Math.ceil(h) + 'px');
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
  };

  return (
    <header
      ref={headerRef}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 12px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "blue",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        boxSizing: "border-box",
        zIndex: 500,
        gap: 8,
        flexWrap: "wrap",
      }}
      className="main-header"
    >
      {/* Logo + School Name + Tagline — always a single row */}
      <div
        onClick={() => go("home")}
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flex: "0 0 auto" }}
      >
        {/* Back button: appears when not on home */}
        {route && route !== "home" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window && typeof window.__goBack === "function") window.__goBack();
              else go("home");
            }}
            aria-label="Go back"
            style={{
              marginRight: 2,
              padding: "4px 6px",
              borderRadius: 6,
              border: "none",
              background: "rgba(255,255,255,0.9)",
              cursor: "pointer",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            ←
          </button>
        )}
        <OptimizedImage
          alt="KANGARU GIRLS Logo"
          src="/header/logo new.PNG"
          priority={true}
          className="header-logo"
          style={{ objectFit: "contain", borderRadius: 0, flexShrink: 0 }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "";
          }}
        />
        <div style={{ lineHeight: 1.2 }}>
          <strong className="header-school-name" style={{ color: "#fff", display: "block" }}>
            KANGARU GIRLS' SENIOR SCHOOL
          </strong>
          <small className="header-tagline" style={{ color: "skyblue", fontStyle: "italic", fontWeight: "bold" }}>
            Grow in Grace
          </small>
        </div>
      </div>

      {/* Navigation — hidden on mobile; MenuButton (hamburger) handles mobile nav */}
      <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
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

        {/* Apply Now Button - Highlighted */}
        <button 
          onClick={() => go("admissions")} 
          style={{
            ...navButtonStyle(route === "admissions"),
            background: route === "admissions" ? "skyblue" : "linear-gradient(135deg, greenyellow 50%, skyblue 50%)",
            color: route === "admissions" ? "yellow" : "skyblack",
            fontWeight: "bold",
            padding: "6px 10px",
            fontSize: "0.9rem",
            boxShadow: "0 4px 8px rgba(40, 167, 69, 0.3)",
            border: route === "admissions" ? "2px solid #28a745" : "none",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (route !== "admissions") {
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
      
      {/* Responsive header styles */}
      <style>{`
        /* Nav button base — no wrapping inside each button */
        .main-header nav button,
        .main-header nav > div { white-space: nowrap; }

        /* ── LOGO / NAME / TAGLINE — same desktop look on all screens ── */
        .header-logo { width: 46px !important; height: 46px !important; }
        .header-school-name { font-size: 12px !important; white-space: nowrap; }
        .header-tagline { display: block !important; font-size: 11px !important; }

        /* ── MOBILE (≤768px): nav wraps to second row ── */
        @media (max-width: 768px) {
          /* Nav takes full width on the second row */
          .main-header .desktop-nav {
            flex: 0 0 100% !important;
            justify-content: flex-start !important;
            flex-wrap: wrap !important;
            gap: 4px !important;
          }
          /* Compact nav buttons so more fit per row */
          .main-header nav button,
          .main-header nav > div button {
            font-size: 0.72rem !important;
            padding: 4px 6px !important;
          }
        }

        /* ── VERY SMALL PHONES (≤430px, e.g. 360px CSS viewport) ── */
        @media (max-width: 430px) {
          .header-logo { width: 36px !important; height: 36px !important; }
          .header-school-name { font-size: 10px !important; max-width: 150px; overflow: hidden; text-overflow: ellipsis; }
          .header-tagline { font-size: 9px !important; }
          .main-header nav button,
          .main-header nav > div button {
            font-size: 0.62rem !important;
            padding: 3px 5px !important;
          }
        }

        /* ── DESKTOP (≥769px): full-size nav buttons ── */
        @media (min-width: 769px) {
          .main-header nav button,
          .main-header nav > div button {
            font-size: 0.9rem !important;
            padding: 6px 10px !important;
          }
        }

        /* ── TABLET (769px–1199px): compact one-row nav ── */
        @media (min-width: 769px) and (max-width: 1199px) {
          .main-header nav button,
          .main-header nav > div button {
            font-size: 0.72rem !important;
            padding: 4px 6px !important;
            flex-shrink: 1 !important;
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
