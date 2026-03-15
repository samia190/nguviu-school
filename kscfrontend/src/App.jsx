import React, { useState, useEffect, lazy, Suspense } from "react";
import './App.css';
import './styles/mobile-optimization.css';
import Header from "./components/Header";
import Home from "./components/Home";
import Footer from "./components/Footer";
import Loader from "./components/Loader";
import ChatWidget from "./components/ChatWidget";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy-load all pages except Home (first paint)
const About = lazy(() => import("./components/About"));
const Contact = lazy(() => import("./components/Contact"));
const Admissions = lazy(() => import("./components/Admissions"));
const Student = lazy(() => import("./components/Student"));
const StudentLife = lazy(() => import("./components/StudentLife"));
const Newsletter = lazy(() => import("./components/Newsletter"));
const Gallery = lazy(() => import("./components/Gallery"));
const Events = lazy(() => import("./components/Events"));
const Login = lazy(() => import("./components/Login"));
const SignUp = lazy(() => import("./components/SignUp"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const Curriculum = lazy(() => import("./components/Curriculum"));
const Performance = lazy(() => import("./components/Performance"));
const Policies = lazy(() => import("./components/Policies"));
const Parents = lazy(() => import("./components/Parents"));
const Legal = lazy(() => import("./components/Legal"));
const SearchResults = lazy(() => import("./components/SearchResults"));
const FeeStructure = lazy(() => import("./components/FeeStructure"));
const HomeworkPortal = lazy(() => import("./components/HomeworkPortal"));
const TeacherHomework = lazy(() => import("./components/TeacherHomework"));
const StudentVerification = lazy(() => import("./components/StudentVerification"));
const StudentResults = lazy(() => import("./components/StudentResults"));
const ResultsManagement = lazy(() => import("./components/ResultsManagement"));
const ParentLogin = lazy(() => import("./components/ParentLogin"));
const ParentDashboard = lazy(() => import("./components/ParentDashboard"));
const StudentDashboard = lazy(() => import("./components/StudentDashboard"));
// SchoolPerformance and SchoolPerformanceAdmin removed — absorbed into unified Performance page


const StudentFees = lazy(() => import("./components/subpages/StudentFees.jsx"));
const StudentExams = lazy(() => import("./components/subpages/StudentExams.jsx"));
const StudentClubs = lazy(() => import("./components/subpages/StudentClubs.jsx"));

const PageBackgroundManagement = lazy(() => import("./components/PageBackgroundManagement"));

function MenuButton({ route, setRoute, setLoading, user }) {
  const [open, setOpen] = useState(false);
  const HIDDEN = ["login", "signup"];

  if (HIDDEN.includes((route || "").toLowerCase())) return null;

  const links = [
    // admin quick link visible only when logged in as admin
    ...(user && user.role === "admin" ? [
      { key: "admin", label: "Admin", icon: "👤" },
      { key: "results-management", label: "Results Management", icon: "📊" },
      { key: "performance-management", label: "School Performance", icon: "🏆" }
    ] : []),
    // teacher quick link visible only when logged in as teacher
    ...(user && user.role === "teacher" ? [
      { key: "teacher/homework", label: "My Homework", icon: "📝" }
    ] : []),
    { key: "home", label: "Home", icon: "🏠" },
    { key: "about", label: "About", icon: "ℹ️" },
    { key: "admissions", label: "Admissions", icon: "📝" },
    { key: "events", label: "Events", icon: "📅" },
    { key: "student-life", label: "Student Life", icon: "🎓" },
    { key: "feestructure", label: "Fee Structure", icon: "💰" },
    { key: "curriculum", label: "Curriculum", icon: "📖" },
    { key: "performance", label: "Performance", icon: "📊" },
    { key: "policies", label: "Policies", icon: "📋" },
    { key: "parents", label: "Parents", icon: "👨‍👩‍👧" },
    { key: "student", label: "Student", icon: "🎓" },
    { key: "gallery", label: "Gallery", icon: "🖼️" },
    { key: "legal", label: "Legal", icon: "⚖️" },
    { key: "newsletter", label: "Newsletter", icon: "📰" },
    { key: "contact", label: "Contact", icon: "📞" },
    // Auth: show Login / Sign Up only when not logged in
    ...(!user ? [
      { key: "login", label: "Log In", icon: "🔑" },
      { key: "signup", label: "Sign Up", icon: "✍️" },
    ] : []),
    // Homework portal: only visible to students, teachers, and admins
    ...(user && (user.role === "student" || user.role === "teacher" || user.role === "admin") ? [
      { key: "portal/homework", label: "Homework Portal", icon: "📚" }
    ] : []),
  ];

  const handleClick = (key) => {
    setOpen(false);
    if (typeof setLoading === "function") setLoading(true);
    setRoute(key);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((s) => !s)}
        className="app-menu-toggle"
        style={{
          position: "fixed",
          left: 5,
          top: 'calc(var(--header-h, 52px) + 4px)',
          zIndex: 1000,
          width: 44,
          height: 44,
          borderRadius: 8,
          border: "1px solid rgba(13, 236, 39, 0.93)",
          background: "skyblue",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 20,
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(65, 15, 231, 0.25)",
        }}
      >
        {open ? "×" : "≡"}
      </button>

      {/* Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "trasparent",
              zIndex: 999,
            }}
          />
          {/* Drawer */}
          <nav
            aria-label="Sidebar menu"
            style={{
              position: "fixed",
              left: 0,
              top: 'calc(var(--header-h, 52px) + 52px)',
              bottom: 0,
              width: 280,
              background: "blue",
              zIndex: 1000,
              boxShadow: "2px 0 8px rgba(116, 221, 17, 0.43)",
              padding: "16px 12px",
              overflowY: "auto",
            }}
          >
            <h3 style={{ margin: "00 0 00px 0px", textAlign: "right" }}></h3>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(2, 1fr)", 
              gap: "8px",
              padding: 0
            }}>
              {links.map((item) => {
                const isActive = route === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleClick(item.key)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "12px 8px",
                      borderRadius: 8,
                      border: "1px solid rgba(13, 236, 39, 0.3)",
                      background: isActive ? "yellow" : "greenyellow",
                      color: isActive ? "black" : "blue",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: isActive ? "bold" : "normal",
                      textAlign: "center",
                      minHeight: "70px",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: "24px", marginBottom: "4px" }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </>
  );
}

// Helper: Get route from URL path
// ── Per-route SEO metadata ────────────────────────────────────────────────────
const BASE_URL = "https://kangarugirlsseniorschool-sc-ke.onrender.com";
const OG_IMAGE = `${BASE_URL}/header/logo-new.png`;
const SITE_NAME = "Kangaru Girls Senior School";

const ROUTE_META = {
  home:        { title: "Kangaru Girls Senior School – Excellence in Education", description: "A leading girls' school in Embu, Kenya, offering quality education, comprehensive curriculum, and excellent facilities." },
  about:       { title: "About Us – Kangaru Girls Senior School",               description: "Learn about Kangaru Girls Senior School's history, mission, vision, staff and values." },
  admissions:  { title: "Admissions – Kangaru Girls Senior School",              description: "Apply for admission at Kangaru Girls Senior School. Find requirements, procedures and important dates." },
  events:      { title: "Events – Kangaru Girls Senior School",                  description: "Stay up to date with the latest events and activities at Kangaru Girls Senior School." },
  feestructure:{ title: "Fee Structure – Kangaru Girls Senior School",           description: "View the current fee structure and payment details for Kangaru Girls Senior School." },
  curriculum:  { title: "Curriculum – Kangaru Girls Senior School",              description: "Explore the 8-4-4 and CBC curricula offered at Kangaru Girls Senior School." },
  performance: { title: "Academic Performance – Kangaru Girls Senior School",    description: "View KCSE results, mean scores and historical performance data for Kangaru Girls Senior School." },
  policies:    { title: "School Policies – Kangaru Girls Senior School",         description: "Read the school rules, policies and guidelines for Kangaru Girls Senior School." },
  parents:     { title: "Parents & Guardians – Kangaru Girls Senior School",     description: "Information and resources for parents and guardians of Kangaru Girls Senior School students." },
  "student-life": { title: "Student Life – Kangaru Girls Senior School",         description: "Discover clubs, sports, and co-curricular activities at Kangaru Girls Senior School." },
  gallery:     { title: "Gallery – Kangaru Girls Senior School",                 description: "Photos and memories from Kangaru Girls Senior School." },
  newsletter:  { title: "Newsletter – Kangaru Girls Senior School",              description: "Read the latest news and newsletters from Kangaru Girls Senior School." },
  contact:     { title: "Contact Us – Kangaru Girls Senior School",              description: "Get in touch with Kangaru Girls Senior School. Find our address, phone number and email." },
  legal:       { title: "Legal – Kangaru Girls Senior School",                   description: "Legal information, terms of use and privacy policy for Kangaru Girls Senior School." },
};

function updatePageMeta(route) {
  const mainRoute = route.split("/")[0];
  const meta = ROUTE_META[mainRoute] || ROUTE_META.home;
  const canonical = mainRoute === "home" ? BASE_URL + "/" : `${BASE_URL}/${mainRoute}`;

  // Title
  document.title = meta.title;

  const setMeta = (selector, attr, value) => {
    let el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };
  const setLink = (rel, value) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) { el = document.createElement("link"); el.rel = rel; document.head.appendChild(el); }
    el.href = value;
  };

  // Standard
  setMeta('meta[name="description"]',    "content", meta.description);
  // Canonical
  setLink("canonical", canonical);
  // OG
  setMeta('meta[property="og:title"]',       "content", meta.title);
  setMeta('meta[property="og:description"]', "content", meta.description);
  setMeta('meta[property="og:url"]',         "content", canonical);
  setMeta('meta[property="og:image"]',       "content", OG_IMAGE);
  // Twitter
  setMeta('meta[name="twitter:title"]',       "content", meta.title);
  setMeta('meta[name="twitter:description"]', "content", meta.description);
  setMeta('meta[name="twitter:url"]',         "content", canonical);
  setMeta('meta[name="twitter:image"]',       "content", OG_IMAGE);
}

function getRouteFromPath() {
  const path = window.location.pathname;
  // Remove leading slash and return route, default to "home" for root
  const route = path.replace(/^\//, '') || 'home';
  return route;
}

export default function App() {
  // Initialize route from URL path for SEO/direct URL access
  const [route, setRouteState] = useState(() => getRouteFromPath());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Wrapper to sync route state with browser URL
  const setRoute = (newRoute) => {
    setRouteState((prev) => {
      // Push to history stack for back button
      try {
        window.__routeStack = window.__routeStack || [];
        window.__routeStack.push(prev);
      } catch (err) {}
      
      // Update browser URL without page reload
      const newPath = newRoute === 'home' ? '/' : `/${newRoute}`;
      window.history.pushState({ route: newRoute }, '', newPath);
      
      return newRoute;
    });
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      const newRoute = event.state?.route || getRouteFromPath();
      setRouteState(newRoute);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Set initial history state — preserve query string and hash so invite tokens survive
    const initialRoute = getRouteFromPath();
    const initialPath = initialRoute === 'home' ? '/' : `/${initialRoute}`;
    window.history.replaceState({ route: initialRoute }, '', initialPath + window.location.search + window.location.hash);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial page load — run ONCE to dismiss the loader when the document is ready.
  // Separated from the route-change effect so it doesn't re-run on every navigation.
  useEffect(() => {
    const clearLoading = () => {
      requestAnimationFrame(() => setLoading(false));
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
      clearLoading();
    } else {
      // Page not yet parsed — wait for the load event
      window.addEventListener("load", clearLoading, { once: true });
      return () => window.removeEventListener("load", clearLoading);
    }
  }, []); // empty deps — fires exactly once on mount

  // Route change side-effects: clear navigation loading and keep window globals fresh.
  // Does NOT touch the document-ready listener — that is handled by the effect above.
  useEffect(() => {
    // After each navigation Header/MenuButton sets loading=true; clear it now that
    // the new page component has rendered.
    requestAnimationFrame(() => setLoading(false));

    // Update canonical URL, page title, and OG/Twitter meta for the current route
    updatePageMeta(route);

    // Keep window helpers in sync with current route
    window.__routeStack = window.__routeStack || [];
    window.setRoute = setRoute;
    window.__goBack = () => {
      try {
        const last = window.__routeStack.pop();
        if (last) {
          setRouteState(last);
          const path = last === 'home' ? '/' : `/${last}`;
          window.history.pushState({ route: last }, '', path);
        } else {
          setRouteState("home");
          window.history.pushState({ route: "home" }, '', '/');
        }
      } catch (err) {
        setRouteState("home");
      }
    };
    window.__route = route;
  }, [route]);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  // Decode user from token (if any).
  // Checks both localStorage (remember me) and sessionStorage (session-only login).
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      try {
        const [, payload] = token.split(".");
        if (payload) {
          const data = JSON.parse(atob(payload));
          setUser({ email: data.email, role: data.role, id: data.id });
        }
      } catch (err) {
        console.error("Failed to decode token", err);
      }
    }
  }, []);

  function handleAuth(u) {
    setUser(u);
    if (u?.role === "admin") setRoute("admin");
    else if (u?.role === "teacher") setRoute("teacher");
    else if (u?.role === "student") setRoute("student");
    else if (u?.role === "parent") setRoute("parent-dashboard");
    else setRoute("home");
  }

  function logout() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setUser(null);
    setRoute("home");
  }

  return (
    <>
      {/* Fast Loader overlay - optimized for performance */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "blue",
          zIndex: 9999,
          display: loading ? "flex" : "none",
          alignItems: "center",
          justifyContent: "center",
          opacity: loading ? 1 : 0,
          transition: "opacity 0.3s ease-out",
          willChange: loading ? "opacity" : "auto",
        }}
      >
        <Loader />
      </div>

      {/* Page content */}
      <Header
        route={route}
        setRoute={setRoute}
        setLoading={setLoading}
        user={user}
        logout={logout}
      />
      <MenuButton route={route} setRoute={setRoute} setLoading={setLoading} user={user} />

      <main
        className="app-main-content"
        style={{
          minHeight: "60vh",
          opacity: loading ? 0 : 1,
          transition: "opacity 0.15s ease-in",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }} 
      >
       
      <ErrorBoundary>
      <Suspense fallback={<div style={{ textAlign: "center", padding: "60px 20px" }}><Loader size={80} /></div>}>
        {(() => {
          const [mainRoute, subRoute] = route.split("/");

          switch (mainRoute) {
     
            case "home":
              return <Home user={user} setRoute={setRoute} />;

            case "about":
              return <About user={user} />;

            case "contact":
              return <Contact user={user} />;

            case "admissions":
              return <Admissions user={user} />;

            case "curriculum":
              return <Curriculum />;

            case "performance":
              return <Performance />;

            case "policies":
              return <Policies user={user} />;

            case "parents":
              return <Parents user={user} />;

            case "feestructure":
              return <FeeStructure user={user} />;

            case "gallery":
              return <Gallery user={user} />;

            case "legal":
              return <Legal user={user} />;

            case "student":
              // Always render the Student page as the parent container and let it
              // mount its subpages when `subRoute` is present. This preserves the
              // student page layout while keeping routing behaviour.
              return <Student user={user} subRoute={subRoute} setRoute={setRoute} />;

            case "portal":
              // ✅ Homework portal — restricted to students, teachers, admins
              if (subRoute === "homework") {
                if (user && (user.role === "student" || user.role === "teacher" || user.role === "admin")) {
                  return <HomeworkPortal user={user} />;
                }
                return (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <h2>🔒 Access Restricted</h2>
                    <p>Only Varified Student have access to this Portal.</p>
                    <button onClick={() => setRoute("login")} style={{ padding: "10px 24px", background: "#667eea", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px", marginTop: "16px" }}>Log In</button>
                  </div>
                );
              }
              // fallback if someone navigates to just "portal"
              return <Home user={user} setRoute={setRoute} />;

            case "teacher":
              // ✅ Teacher routes
              if (user?.role === "teacher") {
                if (subRoute === "homework") {
                  return <TeacherHomework user={user} />;
                }
              }
              return <div>Access denied — teacher only</div>;

            case "events":
              return <Events user={user} />;

            case "student-life":
              return <StudentLife user={user} />;

            case "newsletter":
              return <Newsletter user={user} />;

            case "search":
              return <SearchResults user={user} />;

            case "login":
              return <Login onAuth={handleAuth} navigate={setRoute} user={user} />;

            case "reset-password":
              return <ResetPassword navigate={setRoute} user={user} />;

            case "signup":
              return <SignUp onAuth={handleAuth} navigate={setRoute} user={user} />;

            case "verify-student":
              // Hidden route - only accessible via QR code scan
              return <StudentVerification />;

            case "student-results":
              // Student-only route for viewing and downloading results
              if (user?.role === "student")
                return <StudentResults user={user} />;
              return <div>Access denied — student only</div>;

            case "results-management":
              // Manage student results
              if (user?.role !== "admin") return <div>Access denied — admin only</div>;
              return <ResultsManagement user={user} />;

            case "parent-login":
              // Parent portal login page
              return <ParentLogin onAuth={handleAuth} navigate={setRoute} />;

            case "parent-dashboard":
              // Parent-only route for viewing child's results and recommendations
              if (user?.role === "parent")
                return <ParentDashboard user={user} />;
              return <div>Access denied — parent only</div>;

            case "student-dashboard":
              // Student-only route for viewing personal academic performance
              if (user?.role === "student")
                return <StudentDashboard user={user} />;
              return <div>Access denied — student only</div>;

            case "performance-management":
              // Redirect to admin dashboard performance tab
              if (user?.role !== "admin") return <div>Access denied — admin only</div>;
              return <AdminDashboard user={user} />;

            case "admin":
              if (user?.role === "admin")
                return <AdminDashboard user={user} />;
              return <div>Access denied — admin only</div>;

            default:
              return <Home user={user} setRoute={setRoute} />;

          }
        })()}
      </Suspense>
      </ErrorBoundary>
      </main>

      <Footer />
      <ChatWidget />
    </>
  );
}
