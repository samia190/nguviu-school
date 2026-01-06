import React, { useEffect, useState } from "react";
import EditableHeading from "./EditableHeading";
import EditableText from "./EditableText";
import EditableSubheading from "./EditableSubheading";
import AdminContentForm from "./AdminContentForm";

import AdmissionsManagement from "./AdmissionsManagement";
import AdminSubmissions from "./AdminSubmissions";
import FeeStructureManagement from "./FeeStructureManagement";
import NewslettersManagement from "./NewslettersManagement";
import EventsManagement from "./EventsManagement";
import GalleryManagement from "./GalleryManagement";
import LegalManagement from "./LegalManagement";

// Import new content page management components
import AboutManagement from "./AboutManagement";
import ContactManagement from "./ContactManagement";
import CurriculumManagement from "./CurriculumManagement";
import PerformanceManagement from "./PerformanceManagement";
import PoliciesManagement from "./PoliciesManagement";
import ParentsManagement from "./ParentsManagement";
import StudentsManagement from "./StudentsManagement";
import StaffManagement from "./StaffManagement";
import RoleManagement from "./RoleManagement";

import { get, patch } from "../utils/api";
import PageBackgroundManagement from "./PageBackgroundManagement";
import Notifications from "./Notifications";
import DashboardWidgets from "./DashboardWidgets";
import DragDropUpload from "./DragDropUpload";
import "../admin.css";

export default function AdminDashboard({ user }) {
  const [content, setContent] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    get("/api/content/admin")
      .then((data) => setContent(data || {}))
      .catch(() => setError("Failed to load admin dashboard content."));
  }, []);

  function updateSection(section, value) {
    setLoading(true);

    setSuccess("");

    patch(`/api/content/admin/${section}`, { value })
      .then(() => {
        setContent((prev) => ({ ...prev, [section]: value }));
        setSuccess("Content saved successfully");
      })
      .catch((err) => {
        console.error("Failed to save:", err);
        setError("Failed to save content.");
      })
      .finally(() => setLoading(false));
  }

  if (user?.role !== "admin") {
    return (
      <section style={{ padding: 20, color: "#a00" }}>
        <h2>Access Denied</h2>
        <p>
          You do not have permission to view this page. Please contact the
          system administrator.
        </p>
      </section>
    );
  }

  const sections = [
    "dashboard",
    "submissions",
    "roles",
    "admissions",
    "feeStructure",
    "newsletters",
    "events",
    "gallery",
    "legal",
    "about",
    "contact",
    "curriculum",
    "performance",
    "policies",
    "parents",
    "students",
    "staff",
    "pagebackground",
  ];

  return (
    <section
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
        minHeight: "70vh",
      }}
    >
      <Notifications />
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Admin Panel</h2>
        {user && (
          <p style={{ fontSize: "0.85rem", marginTop: 0, color: "#4b5563" }}>
            Logged in as <strong>{user.email}</strong> {user.role && <span>({user.role})</span>}
          </p>
        )}

        <nav>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {sections.map((key) => {
              const label =
                {
                  dashboard: "Dashboard",
                  admissions: "Admissions",
                  feeStructure: "Fee Structure",
                  newsletters: "Newsletters",
                  events: "Events",
                  gallery: "Gallery",
                  legal: "Legal",
                  about: "About Page",
                  contact: "Contact Page",
                  curriculum: "Curriculum Page",
                  performance: "Performance Page",
                  policies: "Policies Page",
                  parents: "Parents Page",
                  students: "Students Page",
                  staff: "Staff Page",
                  pagebackground: "Page Background",
                }[key] || key;

              const active = activeSection === key;

              return (
                <li key={key} style={{ marginBottom: 4 }}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(key)}
                    className={`menu-item ${active ? "active" : ""}`}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="admin-main-bg" style={{ flexGrow: 1 }}>
        {activeSection === "dashboard" && (
          <>
            <EditableHeading
              value={content.title || "Welcome, Admin"}
              onSave={(val) => updateSection("title", val)}
              isAdmin={true}
              level={2}
            />

            <EditableText
              value={
                content.intro ||
                "You have access to manage school content, upload files, and oversee key settings. Use the form below to post newsletters, gallery items, or admission updates."
              }
              onSave={(val) => updateSection("intro", val)}
              isAdmin={true}
              style={{ marginTop: 20 }}
            />

            <div style={{ marginTop: 30 }}>
              <EditableSubheading
                value={content.formHeading || "Post New Content"}
                onSave={(val) => updateSection("formHeading", val)}
                isAdmin={true}
                level={3}
              />
              <AdminContentForm
                onSaved={() => {
                  setSuccess("Content saved successfully");
                  setTimeout(() => setSuccess(""), 3000);
                }}
              />
            </div>

            <div style={{ marginTop: 28 }}>
              <h3 style={{ marginBottom: 12 }}>Quick Overview</h3>
              <DashboardWidgets onNavigate={setActiveSection} />
            </div>

            <div style={{ marginTop: 22 }}>
              <h3 style={{ marginBottom: 12 }}>Quick Upload</h3>
              <div className="card">
                <DragDropUpload onUploaded={(d) => {
                  setSuccess("File uploaded");
                  setTimeout(() => setSuccess(""), 2500);
                }} />
              </div>
            </div>

            {loading && <p style={{ color: "#00a" }}>Saving...</p>}
            {success && <p style={{ color: "green" }}>{success}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
          </>
        )}

        {activeSection === "admissions" && <AdmissionsManagement />}

        {activeSection === "roles" && <RoleManagement />}

        {activeSection === "submissions" && <AdminSubmissions />}

        {activeSection === "feeStructure" && <FeeStructureManagement />}

        {activeSection === "newsletters" && <NewslettersManagement />}

        {activeSection === "events" && <EventsManagement />}

        {activeSection === "gallery" && <GalleryManagement />}

        {activeSection === "legal" && <LegalManagement />}

        {activeSection === "about" && <AboutManagement />}

        {activeSection === "contact" && <ContactManagement />}

        {activeSection === "curriculum" && <CurriculumManagement />}

        {activeSection === "performance" && <PerformanceManagement />}

        {activeSection === "policies" && <PoliciesManagement />}

        {activeSection === "parents" && <ParentsManagement />}

        {activeSection === "students" && <StudentsManagement />}

        {activeSection === "staff" && <StaffManagement />}
        {activeSection === "pagebackground" && <PageBackgroundManagement />}
      </main>
    </section>
  );
}
