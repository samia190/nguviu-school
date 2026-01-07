import React from "react";
import SmartLink from "./SmartLink";

export default function MenuButton({ route, setRoute, setLoading, links = [] }) {
  const [open, setOpen] = React.useState(false);
  const HIDDEN = ["login", "signup"];
  if (HIDDEN.includes((route || "").toLowerCase())) return null;

  const defaultLinks = [
    { key: "home", label: "Home" },
    { key: "about", label: "About" },
    { key: "admissions", label: "Admissions" },

    // Curriculum and subpages
    { key: "curriculum", label: "Curriculum" },
  
    { key: "performance", label: "Performance" },
    { key: "policies", label: "Policies" },
    { key: "parents", label: "Parents" },

    // Student and subpages
    { key: "student", label: "Student" },


    { key: "staff", label: "Staff" },
   
    { key: "gallery", label: "Gallery" },
    { key: "legal", label: "Legal" },
    { key: "newsletter", label: "Newsletter" },
    { key: "events", label: "Events" },
    { key: "contact", label: "Contact" },
    
  ];

  const items = links.length ? links : defaultLinks;

  React.useEffect(() => {
    const body = document.body;
    if (open) {
      body.style.overflow = "hidden";
      body.style.height = "100vh";
    } else {
      body.style.overflow = "";
      body.style.height = "";
    }
    return () => {
      body.style.overflow = "";
      body.style.height = "";
    };
  }, [open]);

  return (
    <>
      {/* Menu Toggle Button */}
      <button
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((s) => !s)}
        style={{
          position: "fixed",
          right: 12,
          top: 12,
          marginTop: 90,
          zIndex: 1002,
          width: 60,
          height: 44,
          borderRadius: 8,
          border: "1px solid rgba(29, 11, 221, 0.93)",
          background: "brown",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <span style={{ display: "inline-block", width: 20 }}>{open ? "✕" : "☰"}</span>
      </button>

      {/* Overlay and Menu */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              zIndex: 1000,
            }}
            aria-hidden
          />
          <nav
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              left: 12,
              top: 64,
              bottom: 12,
              zIndex: 1001,
              width: "80vw",
              maxWidth: 280,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              background: "#d60a0a8a",
              borderRadius: 8,
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              padding: 12,
            }}
          >
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
              }}
            >
              {items.map((l) => (
                <li key={l.key} style={{ marginBottom: 6 }}>
                  <SmartLink
                    to={l.key}
                    label={l.label}
                    setRoute={setRoute}
                    setLoading={setLoading}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}