import React, { useState } from "react";
import { safePath } from "../utils/paths";

export default function Header({ route, setRoute, setLoading, user, logout }) {
  const go = (r) => {
    if (typeof setLoading === "function") setLoading(true);
    setRoute && setRoute(r);
  };

  const navButtonStyle = (active) => ({
    background: active ? "#fff" : "transparent",
    color: active ? "#b80000" : "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: active ? "bold" : "normal",
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
        padding: "12px 16px",
        paddingRight: 80,
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "#38060695",
        position: "sticky",
        top: 0,
        zIndex: 500,
      }}
    >
      {/* Logo + School Name + Tagline */}
      <div
        onClick={() => go("home")}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        {/* Back button: appears when not on home */}
        {route && route !== "home" && (
          <button
            onClick={() => {
              if (window && typeof window.__goBack === "function") window.__goBack();
              else go("home");
            }}
            aria-label="Go back"
            style={{
              marginRight: 8,
              padding: "6px 8px",
              borderRadius: 6,
              border: "none",
              background: "rgba(255,255,255,0.9)",
              cursor: "pointer",
            }}
          >
            ←
          </button>
        )}
        <img
          alt="NGUVIU Girls Logo"
          src={safePath("/header/logo.PNG")}
          style={{
            width: 70,
            height: 70,
            objectFit: "contain",
            borderRadius: 4,
          }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "";
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <strong style={{ fontSize: 18, color: "#fff" }}> ST ANGELA NGUVIU GIRLS' SENIOR SCHOOL</strong>
          <small
            style={{
              color: "#0b0b0bf5",
              fontSize: 16,
              fontStyle: "italic",
              fontWeight: "bold",
            }}
          >
            strive for excellence
          </small>
          <small style={{ color: "#ddd", fontSize: 10, marginTop: 4 }}>
            {route ? route.charAt(0).toUpperCase() + route.slice(1) : "Welcome"}
          </small>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: "flex", alignItems: "center", gap: 15 }}>
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

        {/* Auth buttons or user info */}
        {!user ? (
          <>
            <button onClick={() => go("login")} style={{ ...buttonStyle, background: "#eb1026ef" }}>
              Log in
            </button>
            <button onClick={() => go("signup")} style={{ ...buttonStyle, background: "#ba4409ef" }}>
              Sign up
            </button>
          </>
        ) : (
          <>
            <span style={{ padding: "0 8px", fontSize: 14, color: "#fff" }}>
              {user.email} ({user.role})
            </span>
            {user.role === "admin" && (
              <button onClick={() => go("admin")} style={{ ...buttonStyle, background: "#740505ef" }}>
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
};
