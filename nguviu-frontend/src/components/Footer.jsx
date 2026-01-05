import React, { useEffect, useState } from "react";
import { safePath } from "../utils/paths";
import { get } from "../utils/api";

const defaultLinks = {
  quickLinks: [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Admissions", href: "/admissions" },
    { label: "Curriculum", href: "/curriculum" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
  ],
  portals: [
    { label: "Student Portal", href: "/portal/students" },
    { label: "Staff Portal", href: "/portal/staff" },
    { label: "Homework Portal", href: "/portal/homework" },
    { label: "Application Portal", href: "/portal/applications" },
  ],
  academics: [
    { label: "Curriculum Overview", href: "/curriculum" },
    { label: "Subjects", href: "/subjects" },
    { label: "Examinations", href: "/exams" },
    { label: "Clubs & Societies", href: "/clubs" },
    { label: "Guidance & Counseling", href: "/guidance" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();
  const [links, setLinks] = useState(defaultLinks);

  const safeList = (list, fallback = []) => (Array.isArray(list) ? list : fallback);

  // Make links dynamic from API, but keep safe fallbacks
  useEffect(() => {
    get("/api/footer-links")
      .then((data) => {
        if (!data) return;
        setLinks({
          quickLinks: data.quickLinks || defaultLinks.quickLinks,
          portals: data.portals || defaultLinks.portals,
          academics: data.academics || defaultLinks.academics,
        });
      })
      .catch(() => {
        // Silent fail – keep defaultLinks
      });
  }, []);

  return (
    <>
      {/* Simple local styles for hover + responsiveness */}
      <style>
        {`
          .footer-link {
            color: #e0ef0aff;
            text-decoration: none;
            transition: color 0.2s ease, transform 0.2s ease;
          }
          .footer-link:hover {
            color: #1b0bfbff;
            transform: translateX(2px);
          }
          .footer-column-title {
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .footer-columns {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
          }
          .footer-column {
            flex: 1 1 150px;
            min-width: 100px;
          }
        `}
      </style>

      <footer
        style={{
          background: "#7506065d",
          padding: "20px 40px",
          borderTop: "1px solid #5a3fd2ff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          {/* ================= SCHOOL BRANDING ================= */}
          <div
            className="brand"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <img
              alt="NGUVIU logo"
              src={safePath("/header/logo.png")}
              style={{ width: 60, height: 60 }}
            />
            <div>
              <strong style={{ fontSize: 18 }}>NGUVIU GIRLS' SCHOOL</strong>
              <div className="meta" style={{ fontSize: 14, color: "#666" }}>
                © {year}
              </div>
            </div>
          </div>

          {/* ================= COLLABORATORS ================= */}
          <div style={{ flex: 1, minWidth: 500 }}>
            <h4 style={{ marginBottom: 8 }}>KENYAN CURRUCULUM PATNERSHIP</h4>
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <a
                href="https://www.knec.ac.ke"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={safePath("/header/knec.PNG")}
                  alt="KNEC"
                  style={{ width: 80, height: 40, objectFit: "contain" }}
                />
              </a>
              <a
                href="https://www.tsc.go.ke"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={safePath("/header/tsc.PNG")}
                  alt="TSC"
                  style={{ width: 80, height: 40, objectFit: "contain" }}
                />
              </a>
              <a
                href="https://www.education.go.ke"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={safePath("/header/MOF E.PNG")}
                  alt="Ministry of Education"
                  style={{ width: 80, height: 40, objectFit: "contain" }}
                />
              </a>
              <a
                href="https://www.kicd.ac.ke"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={safePath("/header/kicd.PNG")}
                  alt="KICD"
                  style={{ width: 80, height: 40, objectFit: "contain" }}
                />
              </a>
              <a
                href="https://www.cbc.go.ke"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={safePath("/header/CBE.PNG")}
                  alt="CBC Kenya"
                  style={{ width: 80, height: 40, objectFit: "contain" }}
                />
              </a>
            </div>
          </div>

          {/* ================= CREDITS ================= */}
          <div style={{ fontSize: 14, color: "#555", minWidth: 160 }}>
            Built <br />
            Designed and developed by Samia
          </div>
        </div>

        {/* ================= NAV / INFO COLUMNS ================= */}
        <div
          className="footer-columns"
          style={{
            marginTop: 24,
            borderTop: "1px solid #5d0c0c32",
            paddingTop: 16,
          }}
        >
          {/* CONTACT */}
          <div className="footer-column">
            <h4 className="footer-column-title">
              <span role="img" aria-label="contact">
                📞
              </span>
              <span>Contact</span>
            </h4>
            <div style={{ fontSize: 16, color: "#4812deff", lineHeight: 1.7 }}>
              Nguviu Girls' Senior School <br />
              P.O Box 12,60100 EMBU—  <br />
              Phone: 0113688538<br />
              Email:nguviugirls@yahoo.com.<br />
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className="footer-column">
            <h4 className="footer-column-title">
              <span role="img" aria-label="links">
                🔗
              </span>
              <span>Quick Links</span>
            </h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 29,
                lineHeight: 1.8,
                fontSize: 18,
                fontWeight: "bold",
                marginleft:23
              }}
            >
              {safeList(links.quickLinks, defaultLinks.quickLinks).map((item) => (
                <li key={item.href || item.label}>
                  <a href={item.href || "#"} className="footer-link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* PORTALS */}
          <div className="footer-column">
            <h4 className="footer-column-title">
              <span role="img" aria-label="portals">
                🔐
              </span>
              <span>Portals</span>
            </h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                lineHeight: 1.8,
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              {safeList(links.portals, defaultLinks.portals).map((item) => (
                <li key={item.href || item.label}>
                  <a href={item.href || "#"} className="footer-link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ACADEMICS */}
          <div className="footer-column">
            <h4 className="footer-column-title">
              <span role="img" aria-label="academics">
                🎓
              </span>
              <span>Academics</span>
            </h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                lineHeight: 1.8,
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              {safeList(links.academics, defaultLinks.academics).map((item) => (
                <li key={item.href || item.label}>
                  <a href={item.href || "#"} className="footer-link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}
