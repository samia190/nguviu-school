import { useEffect, useState } from "react";
import { get, patch } from "../utils/api";
import EditableHeading from "../components/EditableHeading";
import EditableText from "../components/EditableText";

export default function Home({ user, setRoute }) {
  const [content, setContent] = useState({});
  const [error, setError] = useState("");
  const [summaries, setSummaries] = useState({});

  useEffect(() => {
    get("/api/content/home")
      .then((data) => setContent(data || {}))
      .catch(() => setError("Failed to load home page content."));

    // fetch summaries for quick sections
    fetchSummaries();
  }, []);

  async function fetchSummaries() {
    try {
      const keys = ["about", "admissions", "curriculum", "staff", "gallery", "contact"];
      const results = await Promise.all(
        keys.map((k) => get(`/api/content/summary/${k}`).catch(() => null))
      );
      const map = {};
      keys.forEach((k, i) => {
        if (results[i]) map[k] = results[i];
      });
      setSummaries(map);
    } catch (err) {
      // ignore errors fetching small summaries
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

      {/* Hero Section - Removed video/image slider */}
      <div style={{ padding: "40px 20px", textAlign: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "28px" }}>WELCOME TO KANGARU GIRLS' SENIOR SCHOOL!</h2>
        <p>Explore our programs and discover excellence in education</p>
      </div>

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

      {/* Main Sections */}
      <h2 style={{ marginTop: 30 }}>Quick Links</h2>
      <SectionGrid sections={sections} />
    </section>
  );
};
