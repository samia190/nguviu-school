import React, { useEffect, useState, useRef } from "react";
import EditableHeading from "./EditableHeading";
import EditableText from "./EditableText";
import EditableSubheading from "./EditableSubheading";
import AdminContentForm from "./AdminContentForm";

import AdmissionsPageManagement from "./AdmissionsPageManagement";
import AdminSubmissions from "./AdminSubmissions";
import FeeStructureManagement from "./FeeStructureManagement";
import NewslettersManagement from "./NewslettersManagement";
import EventsManagement from "./EventsManagement";
import GalleryManagement from "./GalleryManagement";
import LegalManagement from "./LegalManagement";
import StudentLifeManagement from "./StudentLifeManagement";

// Import new content page management components
import AboutManagement from "./AboutManagement";
import ContactManagement from "./ContactManagement";
import CurriculumPageManagement from "./CurriculumPageManagement";
import PerformanceManagement from "./PerformanceManagement";
import PoliciesManagement from "./PoliciesManagement";
import ParentsManagement from "./ParentsManagement";
import StudentPageManagement from "./StudentPageManagement";
import StaffManagement from "./StaffManagement";
import HeroManagement from "./HeroManagement";
import HomeManagement from "./HomeManagement";
import HomeNewsManagement from "./HomeNewsManagement";
import StudentAdminManagement from "./StudentAdminManagement";
import RoleManagement from "./RoleManagement";
import MagazineManagement from "./MagazineManagement";
import HomeworkManagement from "./admin/HomeworkManagement";
import InviteManagement from "./admin/InviteManagement";
import BulkImportManager from "./admin/BulkImportManager";
import SchoolDirectoryManager from "./admin/SchoolDirectoryManager";
import TimetableImportManager from "./admin/TimetableImportManager";
import UserList from "./admin/UserList";
import DirectAccountCreate from "./admin/DirectAccountCreate";
import ChatManagement from "./ChatManagement";
import ResultsManagement from "./ResultsManagement";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ParentPortalManagement from "./ParentPortalManagement";
import EngagementCampaigns from "./EngagementCampaigns";

// Universal subpage management component
import SubpageManagement from "./SubpageManagement";

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
  const [genericValue, setGenericValue] = useState("");
  const [unreadChat, setUnreadChat] = useState(0);
  const [chatToast, setChatToast] = useState(false);
  const prevUnreadRef = useRef(-1); // -1 = first poll, skip notification on mount

  function getNested(obj, path) {
    if (!obj || !path) return "";
    const parts = path.split("/");

    // Prefer to look inside obj.data for nested admin keys
    let cur = obj.data ?? obj;
    for (const p of parts) {
      if (cur == null) return "";
      cur = cur[p];
    }
    if (cur == null) {
      // fallback to top-level path
      cur = obj;
      for (const p of parts) {
        if (cur == null) return "";
        cur = cur[p];
      }
    }
    return typeof cur === "string" ? cur : JSON.stringify(cur, null, 2);
  }

  useEffect(() => {
    if (activeSection && activeSection.includes("/")) {
      setGenericValue(getNested(content, activeSection) || "");
    }
  }, [activeSection, content]);

  // ─── Poll for unread chat messages every 30s
  useEffect(() => {
    const pollChat = async () => {
      try {
        const data = await get("/api/chat/messages/stats");
        const count = data?.new || 0;
        if (prevUnreadRef.current >= 0 && count > prevUnreadRef.current) {
          setChatToast(true);
          setTimeout(() => setChatToast(false), 4000);
        }
        prevUnreadRef.current = count;
        setUnreadChat(count);
      } catch {}
    };
    pollChat();
    const id = setInterval(pollChat, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setLoading(true);
    get("/api/content/admin")
      .then((data) => {
        setContent(data || {});
        setError("");
      })
      .catch((err) => {
        console.error("Failed to load admin content:", err);
        setError("Failed to load admin content: " + (err?.message || "Unknown error"));
        setContent({});
      })
      .finally(() => setLoading(false));
  }, []);

  function updateSection(section, value) {
    // Validate section name
    if (!section || typeof section !== 'string') {
      setError("Invalid section name");
      return;
    }

    setLoading(true);
    setSuccess("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    patch(`/api/content/admin/${section}`, { value })
      .then(() => {
        clearTimeout(timeoutId);
        // update nested state to reflect saved change (store under data for typed content)
        setContent((prev) => {
          const next = { ...prev };
          const parts = section.split("/");
          if (parts.length === 1) {
            next[section] = value;
          } else {
            if (!next.data || typeof next.data !== "object") next.data = {};
            let cur = next.data;
            for (let i = 0; i < parts.length - 1; i++) {
              const p = parts[i];
              if (cur[p] == null || typeof cur[p] !== "object") cur[p] = {};
              cur = cur[p];
            }
            cur[parts[parts.length - 1]] = value;
          }
          return next;
        });
        setSuccess("Content saved successfully");
        setError("");
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("Failed to save:", err);
        const msg = controller.signal.aborted
          ? "Save request timed out. Please try again."
          : "Failed to save content: " + (err?.message || "Unknown error");
        setError(msg);
      })
      .finally(() => setLoading(false));
  }

  if (!["admin", "superadmin"].includes(user?.role)) {
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
    { key: "about", label: "About", icon: "ℹ️", color: "#0ea5e9" },
    { key: "admissions", label: "Admissions", icon: "📝", color: "#10b981" },
    { key: "chat", label: "Chat System", icon: "💬", color: "#0d9488" },
    { key: "contact", label: "Contact", icon: "📞", color: "#22c55e" },
    { key: "create-account", label: "Create Account", icon: "➕", color: "#059669" },
    { key: "curriculum", label: "Curriculum", icon: "📚", color: "#a855f7" },
    { key: "dashboard", label: "Dashboard", icon: "🏠", color: "#3b82f6" },
    { key: "events", label: "Events", icon: "📅", color: "#ef4444" },
    { key: "feeStructure", label: "Fee Structure", icon: "💰", color: "#f59e0b" },
    { key: "gallery", label: "Gallery", icon: "🖼️", color: "#14b8a6" },
    { key: "homeNews", label: "Home News", icon: "📣", color: "#06b6d4" },
    { key: "home", label: "Home Page", icon: "🏡", color: "#14b8a6" },
    { key: "homework", label: "Homework & Notes", icon: "📚", color: "#FF6B6B" },
    { key: "invites", label: "Invite Links", icon: "🔗", color: "#0ea5e9" },
    { key: "bulkImports", label: "Excel Imports", icon: "📥", color: "#0f766e" },
    { key: "schoolDirectory", label: "School Directory", icon: "🏫", color: "#0369a1" },
    { key: "timetables", label: "Timetables", icon: "🗓️", color: "#7c3aed" },
    { key: "legal", label: "Legal", icon: "⚖️", color: "#64748b" },
    { key: "magazine", label: "Magazine", icon: "📖", color: "#6366f1" },
    { key: "newsletters", label: "Newsletters", icon: "📰", color: "#06b6d4" },
    { key: "parents", label: "Parents", icon: "👨‍👩‍👧", color: "#e11d48" },
    { key: "parentPortal", label: "Parent Portal", icon: "🏠", color: "#3b82f6" },
    { key: "performance", label: "Performance", icon: "📊", color: "#f97316" },
    { key: "policies", label: "Policies", icon: "📋", color: "#84cc16" },
    { key: "users", label: "Registered Users", icon: "👥", color: "#6366f1" },
    { key: "roles", label: "Roles", icon: "👥", color: "#ec4899" },
    { key: "staff", label: "Staff", icon: "👔", color: "#7c3aed" },
    { key: "studentAdmin", label: "Student Admin", icon: "🛠️", color: "#8b5cf6" },
    { key: "studentLife", label: "Student Life", icon: "🎓", color: "#059669" },
    { key: "students", label: "Student Page", icon: "🎓", color: "#0891b2" },
    { key: "submissions", label: "Submissions", icon: "📬", color: "#8b5cf6" },
    { key: "studentResults", label: "Student Results", icon: "📊", color: "#06b6d4" },
    // NOTE: The sections below require additional setup before enabling:
    // { key: "analytics", label: "Analytics Dashboard", icon: "📈", color: "#8b5cf6" },
    // { key: "engagement", label: "Engagement Campaigns", icon: "📧", color: "#10b981" },
    // Hidden until needed:
    // { key: "heroContent", label: "Hero Content (Legacy)", icon: "🎬", color: "#f43f5e" },
    // { key: "pagebackground", label: "Backgrounds", icon: "🎨", color: "#db2777" },
  ];

  const subSections = [
    { key: "staff/leadership", label: "Staff Leadership", contentTypes: ["text", "staffList", "images"] },
    { key: "staff/teaching", label: "Staff Teaching", contentTypes: ["text", "staffList", "images"] },
    { key: "staff/support", label: "Staff Support", contentTypes: ["text", "staffList", "images"] },
    { key: "students/fees", label: "Student Fees", contentTypes: ["text", "table", "files"] },
    { key: "students/exams", label: "Student Exams", contentTypes: ["text", "table", "files"] },
    { key: "students/clubs", label: "Student Clubs", contentTypes: ["text", "images"] },
    { key: "students/support-services", label: "Student Support Services", contentTypes: ["text", "staffList"] },
    { key: "parents/communication", label: "Parents Communication", contentTypes: ["text", "files"] },
    { key: "parents/resources", label: "Parents Resources", contentTypes: ["text", "files"] },
    { key: "parents/calendar", label: "Parents Calendar", contentTypes: ["text", "table"] },

  ];

  return (
    <section className="admin-dashboard-wrapper">
      <Notifications />
      
      {/* MODERN HORIZONTAL NAVIGATION */}
      <div className="admin-nav-container">
        <div className="admin-nav-header">
          <h1 className="admin-title">🛠️ Admin Dashboard</h1>
          {user && (
            <p className="admin-user-info">
              Welcome, <strong>{user.email}</strong> <span className="role-badge">{user.role}</span>
            </p>
          )}
        </div>
        
        {/* HORIZONTAL GRID OF NAVIGATION CARDS */}
        <div className="admin-nav-grid">
          {sections.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveSection(item.key)}
                className={`admin-nav-card ${isActive ? "active" : ""}`}
                style={{ "--card-color": item.color }}
              >
                <span className="nav-card-icon">{item.icon}</span>
                {item.key === "chat" && unreadChat > 0 && (
                  <span className="nav-card-badge">{unreadChat > 99 ? "99+" : unreadChat}</span>
                )}
                <span className="nav-card-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* SUB-SECTIONS DROPDOWN */}
        {(activeSection.includes("staff") || activeSection.includes("students") || activeSection.includes("parents") || activeSection.includes("curriculum")) && (
          <div className="admin-subsections">
            <label>Sub-section:</label>
            <select 
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="admin-select"
            >
              {subSections
                .filter((s) => s.key.startsWith(activeSection.split("/")[0]))
                .map((sub) => (
                  <option key={sub.key} value={sub.key}>{sub.label}</option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="admin-main-content">
        {/* Subpage Management for nested keys like staff/leadership or curriculum/overview */}
        {activeSection.includes("/") && (() => {
          const subConfig = subSections.find(s => s.key === activeSection);
          if (subConfig) {
            return (
              <SubpageManagement
                key={activeSection}
                pageType={activeSection}
                pageTitle={subConfig.label}
                contentTypes={subConfig.contentTypes || ["text"]}
              />
            );
          }
          return null;
        })()}
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

        {activeSection === "admissions" && <AdmissionsPageManagement />}

        {activeSection === "roles" && <RoleManagement />}

        {activeSection === "submissions" && <AdminSubmissions />}

        {activeSection === "feeStructure" && <FeeStructureManagement />}

        {activeSection === "newsletters" && <NewslettersManagement />}

        {activeSection === "magazine" && <MagazineManagement user={user} />}

        {activeSection === "events" && <EventsManagement />}

        {activeSection === "studentLife" && <StudentLifeManagement />}

        {activeSection === "gallery" && <GalleryManagement />}

        {activeSection === "legal" && <LegalManagement />}

        {activeSection === "about" && <AboutManagement />}

        {activeSection === "contact" && <ContactManagement />}

        {activeSection === "curriculum" && <CurriculumPageManagement />}

        {activeSection === "performance" && <PerformanceManagement />}

        {activeSection === "policies" && <PoliciesManagement />}

        {activeSection === "parents" && <ParentsManagement />}

        {activeSection === "students" && <StudentPageManagement />}

        {activeSection === "staff" && <StaffManagement />}

        {activeSection === "heroContent" && <HeroManagement />}

        {activeSection === "home" && <HomeManagement />}

        {activeSection === "homeNews" && <HomeNewsManagement />}

        {activeSection === "homework" && <HomeworkManagement user={user} />}

        {activeSection === "bulkImports" && <BulkImportManager user={user} />}

        {activeSection === "schoolDirectory" && <SchoolDirectoryManager />}

        {activeSection === "timetables" && <TimetableImportManager />}

        {activeSection === "studentAdmin" && <StudentAdminManagement />}

        {activeSection === "pagebackground" && <PageBackgroundManagement />}

        {activeSection === "chat" && <ChatManagement />}

        {/* Phase 2: Student Results Management */}
        {activeSection === "studentResults" && (
          <ResultsManagement />
        )}

        {/* Phase 3: Analytics Dashboard */}
        {activeSection === "analytics" && <AnalyticsDashboard />}

        {/* Phase 4: Parent Portal Management */}
        {activeSection === "parentPortal" && <ParentPortalManagement user={user} />}

        {/* Phase 4: Engagement Campaigns */}
        {activeSection === "engagement" && <EngagementCampaigns user={user} />}

        {/* Phase 5: Role-Based Registration */}
        {activeSection === "invites" && <InviteManagement />}
        {activeSection === "users" && <UserList />}
        {activeSection === "create-account" && <DirectAccountCreate />}
      </main>

      {/* Chat unread toast notification */}
      {chatToast && (
        <div className="chat-toast" role="status" aria-live="polite">
          <span>📬</span>
          <span>{unreadChat} unread chat message{unreadChat !== 1 ? "s" : ""}</span>
          <button
            onClick={() => { setActiveSection("chat"); setChatToast(false); }}
            className="chat-toast-btn"
          >
            View
          </button>
        </div>
      )}
    </section>
  );
}
