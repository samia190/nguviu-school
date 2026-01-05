import React from "react";
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
        <img
          alt="NGUVIU Girls Logo"
          src={safePath("/header/logo.svg")}
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
        <button onClick={() => go("student")} style={navButtonStyle(route === "student")}>
          Student
        </button>
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

        {/* Apply Now button */}
        <button
          onClick={() => go("admissions")}
          style={{
            ...buttonStyle,
            background: "#28a745",
            border: "1px solid #1e7e34",
            fontWeight: "bold",
          }}
          aria-label="Apply now to NGUVIU Girl's School"
        >
          Apply Now
        </button>

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
