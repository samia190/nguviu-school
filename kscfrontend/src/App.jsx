import React, { useState, useEffect, lazy, Suspense } from "react";
import './App.css'; 
import Header from "./components/Header";
import Home from "./components/Home";
import Footer from "./components/Footer";
import Loader from "./components/Loader";

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
const DevLogin = lazy(() => import("./components/DevLogin"));
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
// SchoolPerformance and SchoolPerformanceAdmin removed — absorbed into unified Performance page


const StudentFees = lazy(() => import("./components/subpages/StudentFees.jsx"));
const StudentExams = lazy(() => import("./components/subpages/StudentExams.jsx"));
const StudentClubs = lazy(() => import("./components/subpages/StudentClubs.jsx"));
const StudentSupportServices = lazy(() => import("./components/subpages/StudentSupportServices.jsx"));

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
        style={{
          position: "fixed",
          left: 5,
          top: 68,
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
              top: 110,
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
    
    // Set initial history state
    const initialRoute = getRouteFromPath();
    const initialPath = initialRoute === 'home' ? '/' : `/${initialRoute}`;
    window.history.replaceState({ route: initialRoute }, '', initialPath);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fast loader - optimized for sub-500ms load
  useEffect(() => {
    const handleLoad = () => {
      // Immediate hide for faster perceived performance
      requestAnimationFrame(() => {
        setLoading(false);
      });
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      // Use DOMContentLoaded for faster initial render
      if (document.readyState === "interactive") {
        handleLoad();
      } else {
        window.addEventListener("DOMContentLoaded", handleLoad, { once: true });
        window.addEventListener("load", handleLoad, { once: true });
      }
    }

    // make router globally available and maintain a simple in-memory route stack
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

    return () => {
      window.removeEventListener("DOMContentLoaded", handleLoad);
      window.removeEventListener("load", handleLoad);
    };
  }, [route]);

  // Decode user from token (if any)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const [header, payload] = token.split(".");
        if (payload) {
          const data = JSON.parse(atob(payload));
          setUser({ email: data.email, role: data.role, id: data.id });
        }
      } catch (err) {
        console.error("Failed to decode token", err);
      }
    }
  }, []);

  // Listen for dev auto-login events (dev helper)
  useEffect(() => {
    function onDevLogin(e) {
      try {
        const token = e?.detail?.token;
        if (!token) return;
        localStorage.setItem("token", token);
        const payload = JSON.parse(atob(token.split(".")[1]));
        const u = { email: payload.email, role: payload.role, id: payload.id };
        setUser(u);
        if (u?.role === "admin") setRoute("admin");
        else if (u?.role === "teacher") setRoute("teacher");
        else if (u?.role === "student") setRoute("student");
        else setRoute("staff");
      } catch (err) {
        console.error("Dev login failed", err);
      }
    }

    window.addEventListener("kangaru girls:dev-login", onDevLogin);
    return () => window.removeEventListener("kangaru girls:dev-login", onDevLogin);
  }, []);

  function handleAuth(u) {
    setUser(u);
    if (u?.role === "admin") setRoute("admin");
    else if (u?.role === "teacher") setRoute("teacher");
    else if (u?.role === "student") setRoute("student");
    else setRoute("staff");
  }

  function logout() {
    localStorage.removeItem("token");
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
        style={{
          padding: "140px 16px 20px 16px",
          minHeight: "60vh",
          opacity: loading ? 0 : 1,
          transition: "opacity 0.15s ease-in",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }} 
      >
       
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
                    <p>The Homework Portal is only available to registered students, teachers, and administrators.</p>
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

            case "dev-login":
              return <DevLogin />;

            case "signup":
              return <SignUp onAuth={handleAuth} user={user} />;

            case "verify-student":
              // Hidden route - only accessible via QR code scan
              return <StudentVerification />;

            case "student-results":
              // Student-only route for viewing and downloading results
              if (user?.role === "student")
                return <StudentResults user={user} />;
              return <div>Access denied — student only</div>;

            case "results-management":
              // Admin-only route for managing student results
              if (user?.role === "admin")
                return <ResultsManagement user={user} />;
              return <div>Access denied — admin only</div>;

            case "performance-management":
              // Redirect to admin dashboard performance tab
              return <AdminDashboard user={user} />;

            case "admin":
              if (user?.role === "admin")
                return <AdminDashboard user={user} />;
              return <div>Access denied — admin only</div>;

            default:
              return <Home user={user} setRoute={setRoute} />;
            
            
               
               

               case "page-backgrounds":
              if (user?.role === "admin")
                return <PageBackgroundManagement user={user} />;
              return <div>Access denied — admin only</div>;

          }
        })()}
      </Suspense>
      </main>

      <Footer />
    </>
  );
}
