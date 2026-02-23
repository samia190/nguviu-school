import React, { useEffect, useState } from "react";
import { get, patch } from "../utils/api";
import { cachedGet } from "../utils/apiCache";
import EditableHeading from "../components/EditableHeading";
import EditableText from "../components/EditableText";
import NewsWidget from "./NewsWidget";
import HeroCarousel from "./HeroCarousel";
import OptimizedImage from "./OptimizedImage";
import OptimizedVideo from "./OptimizedVideo";
import { useBatchImagePreload } from "../hooks/useImagePreload";

// Cloudinary base for optimized images
const CLD = 'https://res.cloudinary.com/ddm1dgws8/image/upload';

// Default hero slides — shown when no API data is available
const defaultHeroSlides = [
  { _id: 'default-1', url: `${CLD}/w_1200,q_auto,f_auto/kangaru/DSC_5353.jpg`, title: 'Welcome to Kangaru Girls School', description: 'A center of excellence in education', active: true, type: 'slide' },
  { _id: 'default-2', url: `${CLD}/w_1200,q_auto,f_auto/kangaru/DSC_5400.jpg`, title: 'Academic Excellence', description: 'Nurturing future leaders with knowledge and confidence', active: true, type: 'slide' },
  { _id: 'default-3', url: `${CLD}/w_1200,q_auto,f_auto/kangaru/DSC_5500.jpg`, title: 'Student Life', description: 'Vibrant community and enriching experiences', active: true, type: 'slide' },
  { _id: 'default-4', url: `${CLD}/w_1200,q_auto,f_auto/kangaru/DSC_5613.jpg`, title: 'Sports & Activities', description: 'Building character through sports and extracurricular activities', active: true, type: 'slide' },
  { _id: 'default-5', url: `${CLD}/w_1200,q_auto,f_auto/kangaru/DSC_5820.jpg`, title: 'Our Campus', description: 'A beautiful and serene learning environment', active: true, type: 'slide' },
];

export default function Home({ user, setRoute }) {
  const [content, setContent] = useState({});
  const [error, setError] = useState("");
  const [summaries, setSummaries] = useState({});
  const [newsImages, setNewsImages] = useState([]);
  // Show default slides INSTANTLY — no waiting for API
  const [heroContent, setHeroContent] = useState({ type: "slide", data: defaultHeroSlides });

  useEffect(() => {
    // Fire all API calls in parallel using cache
    Promise.all([
      cachedGet("/api/content/home", get).catch(() => null),
      cachedGet("/api/hero-content?page=home", get).catch(() => null),
      fetchSummaries(),
      fetchNewsImages(),
    ]).then(([homeData, heroData]) => {
        if (homeData) setContent(homeData);
        // Only override defaults if API returns real data
        if (heroData && Array.isArray(heroData)) {
          const activeHeros = heroData.filter(h => h.active !== false);
          if (activeHeros.length > 0) {
            const videoHero = activeHeros.find(h => h.type === "video");
            const slideHeros = activeHeros.filter(h => h.type === "slide");
            const imageHero = activeHeros.find(h => h.type === "image");
            
            if (videoHero) {
              setHeroContent({ type: "video", data: videoHero });
            } else if (slideHeros.length > 0) {
              setHeroContent({ type: "slide", data: slideHeros });
            } else if (imageHero) {
              setHeroContent({ type: "image", data: imageHero });
            }
          }
        }
      });
  }, []);

  async function fetchNewsImages() {
    try {
      const data = await cachedGet("/api/home-news?active=true", get);
      const newsList = Array.isArray(data) ? data : (data.news || []);
      const images = newsList
        .slice(0, 3)
        .filter(item => item.imageUrl)
        .map(item => ({ src: item.imageUrl }));
      setNewsImages(images);
    } catch (err) {
      // Silently ignore errors
    }
  }

  // Preload news images on component mount
  useBatchImagePreload(newsImages);

  async function fetchSummaries() {
    try {
      const keys = ["about", "admissions", "curriculum", "staff", "gallery", "contact"];
      const results = await Promise.all(
        keys.map((k) => cachedGet(`/api/content/summary/${k}`, get).catch(() => null))
      );
      const map = {};
      keys.forEach((k, i) => {
        if (results[i]) map[k] = results[i];
      });
      setSummaries(map);
    } catch (err) {
      setSummaries({});
    }
  }

  async function updateSection(key, value) {
    try {
      await patch("/api/content/home", { [key]: value });
      setContent((c) => ({ ...c, [key]: value }));
    } catch (err) {
      setError("Failed to save changes.");
    }
  }

  const sections = [
    {
      key: "about",
      title: "About Us",
      text: "Learn about our mission, history, values, and vision.",
      childContainers: [
        {
          title: "Our Vision",
          text: "To empower future leaders with knowledge and confidence.",
        },
        {
          title: "Leadership",
          text: "We believe in strong leadership to guide our students.",
        },
      ],
    },

    {
      key: "our-school",
      title: "About Our School",
      text: "Learn about our mission, history, values, and vision.",
      childContainers: [],
    },

    {
      childContainers: [],
    },

    {
      key: "admissions",
      title: "Admission Process",
      text: "See the full admission process and join our school.",
      childContainers: [
        {
          title: "Admission Requirements",
          text: "Find out the requirements to apply to our school.",
        },
        {
          title: "Scholarships",
          text: "Explore the scholarship opportunities we offer.",
        },
        {
          title: "Application Deadline",
          text: "Check the deadlines for applying for the upcoming academic year.",
        },
        {
          title: "Admission Events",
          text: "Attend our open days and information sessions.",
        },
      ],
    },
    {
      key: "curriculum",
      title: "Curriculum Overview",
      text: "Explore subjects, programs, and academic structure.",
      childContainers: [
        {
          title: "Secondary School Curriculum",
          text: "A detailed overview of our secondary school offerings.",
        },
        {
          title: "Extracurricular Activities",
          text: "Sports, arts, and leadership programs beyond the classroom.",
        },
        {
          title: "Assessments and Exams",
          text: "Information on how we assess our students' progress.",
        },
        {
          title: "Curriculum Syllabus",
          text: "Detailed breakdown of each subject and course.",
        },
      ],  
    },
    {
      key: "staff",
      title: "Our Staff",
      text: "Meet our teachers, leadership, and support staff.",
      childContainers: [
        {
          title: "Leadership Team",
          text: "Meet the leaders guiding our institution.",
        },
        {
          title: "Teaching Staff",
          text: "Our team of dedicated educators.",
        },
        {
          title: "Support Staff",
          text: "The support team that ensures the smooth running of our school.",
        },
        {
          title: "Staff Training",
          text: "Our continuous professional development programs.",
        },
        {
          title: "Staff Wellness",
          text: "We prioritize the well-being of our staff members.",
        },
        {
          title: "Faculty Achievements",
          text: "Recognizing the accomplishments of our academic staff.",
        },
      ],
    },
    {
      key: "gallery",
      title: "School Gallery",
      text: "Browse photos of school events and student life.",
      childContainers: [
        {
          title: "Graduation Ceremony",
          text: "Celebrate our students' achievements.",
        },
        {
          title: "Field Trips",
          text: "Our students' educational field trips and excursions.",
        },
        {
          title: "Student Performances",
          text: "Talent shows, performances, and arts exhibitions.",
        },
      ],
    },
    {
      key: "contact",
      title: "Get in Touch",
      text: "Reach out to us for inquiries and support.",
      childContainers: [
        {
          title: "Contact Information",
          text: "call us through the school official number on 0113688538.",
        },
        {
          title: "Whatsapp account details",
          text: "for any inquiry reach us through whatsapp account on +254 720 123456.",
        },
        {
          title: "Visit Us",
          text: "Plan visit to our institution and experience our learning environment.",
        },
        {
          title: "Email Us",
          text: "Send us an email at info@nguvuigirls@yahoo.com for any questions or support.",
        },
      ],
    },
  ];

  const SectionGrid = ({ sections: gridSections }) => {
    return (
      <div style={{ marginTop: 20 }}>
        {gridSections.map((sec) => {
          const s = summaries[sec.key] || {};
          return (
            <div
              key={sec.key}
              style={{
                width: "100%",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
                {sec.title || s.title}
              </h2>

              {/* Landscape Main Container */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                  gap: "0px",
                  childgap: "0px",
                  flexWrap: "wrap", // Ensures it’s responsive
                }}
              >
                {/* Loop through each child container for the section */}
                {sec.childContainers &&
                  sec.childContainers.map((child, index) => (
                    <div key={index} className="section-child">
                      <h3 className="section-child-title">{child.title}</h3>
                      <p className="section-child-text">{child.text}</p>
                      <button
                        onClick={() => setRoute(sec.key)}
                        className="section-child-button"
                      >
                        Visit →
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section style={{ padding: 0, position: "relative", overflow: "hidden" }}>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Hero Section - Managed from Admin Dashboard */}
      {heroContent ? (
        // Render hero carousel for slides or single hero for image/video
        heroContent.type === "slide" ? (
          <div style={{ width: "100%"}}>
            <HeroCarousel slides={heroContent.data} />
          </div>
        ) : heroContent.type === "video" ? (
          <div
            style={{
              position: "relative",
              width: "100vw",
              marginLeft: "50%",
              transform: "translateX(-50%)",
              maxHeight: 500,
              overflow: "hidden",
            }}
          >
            <OptimizedVideo
              src={heroContent.data.url}
              autoPlay
              loop
              muted
              priority={true}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))",
              }}
            />
          </div>
        ) : (
          // Image hero
          <div
            style={{
              position: "relative",
              width: "100vw",
              marginLeft: "50%",
              transform: "translateX(-50%)",
              maxHeight: 500,
              overflow: "hidden",
            }}
          >
            <OptimizedImage
              src={heroContent.data.url}
              alt={heroContent.data.title || "Hero Image"} 
              priority={true}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))",
              }}
            />
            {heroContent.data.title && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    maxWidth: 720,
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: 10,
                    backgroundColor: "rgba(0, 0, 0, 0.45)",
                    color: "#ffffff",
                    textAlign: "center",
                  }}
                >
                  <h2 style={{ fontSize: "2rem", margin: 0 }}>{heroContent.data.title}</h2>
                  {heroContent.data.description && (
                    <p style={{ fontSize: "1.1rem", marginTop: "10px" }}>{heroContent.data.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        // Fallback gradient hero if no database content
        <div style={{ padding: "40px 20px", textAlign: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: "28px" }}>WELCOME TO KANGARU GIRLS' SENIOR SCHOOL!</h2>
          <p>Explore our programs and discover excellence in education</p>
        </div>
      )}

      <EditableHeading
        value={content.title || "WELCOME TO KANGARU GIRLS' SCHOOL"}
        onSave={(val) => updateSection("title", val)}
        isAdmin={user?.role === "admin"}
        level={1}
      />

      <EditableText
        value={
          content.intro ||
          "At our institution, we believe education is a journey of creativity, growth, and excellence..."
        }
        onSave={(val) => updateSection("intro", val)}
        isAdmin={user?.role === "admin"}
      />

      {/* HORIZONTAL SPLIT: Main Content + News Widget Sidebar */}
      <div style={{
        display: "flex",
        gap: "30px",
        flexWrap: "wrap",
        alignItems: "flex-start",
        margin: "30px auto",
        maxWidth: "1400px"
      }}>
        {/* LEFT SIDE: Quick Links (70%) */}
        <div style={{ flex: "1 1 65%", minWidth: "300px" }}>
          <h2 style={{ marginTop: 0 }}>Quick Links</h2>
          <SectionGrid sections={sections} />
        </div>

        {/* RIGHT SIDE: News Widget Sidebar (30%) */}
        <div style={{ flex: "1 1 30%", minWidth: "280px" }}>
          <NewsWidget />
        </div>
      </div>
    </section>
  );
};
