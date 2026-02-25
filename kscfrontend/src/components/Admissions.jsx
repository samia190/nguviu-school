// src/components/Admissions.jsx
import { useEffect, useState } from "react";
import { get } from "../utils/api";
import { cachedGet } from "../utils/apiCache";
import OptimizedImage from "./OptimizedImage";
import AdmissionForm from "./AdmissionForm";
import Loader from "./Loader";

export default function Admissions() {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    cachedGet("/api/admissions-page", () => get("/api/admissions-page"))
      .then((data) => setPage(data))
      .catch(() => setError("Failed to load admissions information."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading admissions..." />;
  if (error) return <div className="page-error">{error}</div>;
  if (!page) return null;

  const downloads = page.downloads || [];

  return (
    <div className="page admissions-page" style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      {/* Hero */}
      {page.heroImage && (
        <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 28 }}>
          <OptimizedImage
            src={page.heroImage}
            alt={page.title}
            style={{ width: "100%", maxHeight: 300, objectFit: "cover" }}
          />
        </div>
      )}

      {/* Title & Subtitle */}
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, margin: 0 }}>
          {page.title}
        </h1>
        {page.subtitle && (
          <p style={{ fontSize: "1rem", color: "#4b5563", fontStyle: "italic", margin: "8px 0 0" }}>
            {page.subtitle}
          </p>
        )}
      </header>

      {/* Overview */}
      {page.overview && (
        <section style={{ marginBottom: 24 }}>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#1f2937" }}>{page.overview}</p>
        </section>
      )}

      {/* Process */}
      {page.process && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={sectionHead}>Admissions Process</h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#374151" }}>{page.process}</p>
        </section>
      )}

      {/* Requirements */}
      {page.requirements && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={sectionHead}>Requirements</h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#374151" }}>{page.requirements}</p>
        </section>
      )}

      {/* Important Dates */}
      {page.importantDates && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={sectionHead}>Important Dates</h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#374151" }}>{page.importantDates}</p>
        </section>
      )}

      {/* Contact */}
      {page.contactInfo && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={sectionHead}>Contact for Admissions</h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#374151" }}>{page.contactInfo}</p>
        </section>
      )}

      {/* Downloads */}
      {downloads.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={sectionHead}>{page.downloadsHeading || "Downloads"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {downloads.map((dl, i) => (
              <a
                key={dl.url || i}
                href={dl.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  background: "#f0f4ff",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: "#1e40af",
                  border: "1px solid #dbeafe",
                  transition: "background .2s",
                }}
              >
                <span style={{ fontSize: 24 }}>📄</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{dl.name || "Download"}</div>
                  {dl.description && (
                    <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 2 }}>{dl.description}</div>
                  )}
                  {dl.size > 0 && (
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 2 }}>
                      {dl.size > 1024 * 1024
                        ? (dl.size / (1024 * 1024)).toFixed(1) + " MB"
                        : (dl.size / 1024).toFixed(1) + " KB"}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Embedded Admission Application Form */}
      {page.formEnabled && (
        <section style={{ marginTop: 32 }}>
          <AdmissionForm
            year={page.admissionYear}
            formTitle={page.formTitle}
            downloads={downloads}
            formSteps={page.formSteps}
            formDeclarations={page.formDeclarations}
            formInstructions={page.formInstructions}
            formDisclaimer={page.formDisclaimer}
          />
        </section>
      )}
    </div>
  );
}

const sectionHead = {
  fontSize: "1.3rem",
  fontWeight: 700,
  color: "#111827",
  marginBottom: 10,
  paddingBottom: 6,
  borderBottom: "2px solid #e5e7eb",
};
