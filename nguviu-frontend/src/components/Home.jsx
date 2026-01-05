import { useEffect, useState, useRef } from "react";
import { get, patch } from "../utils/api";
import EditableHeading from "../components/EditableHeading";
import EditableText from "../components/EditableText";
import { safePath } from "../utils/paths";

export default function Home({ user, setRoute }) {
  const [content, setContent] = useState({});
  const [error, setError] = useState("");
  const [bgContent, setBgContent] = useState(null);
  const [bgIndex, setBgIndex] = useState(0);
  const bgTimerRef = useRef(null);
  const [summaries, setSummaries] = useState({});

  useEffect(() => {
    get("/api/content/home")
      .then((data) => setContent(data || {}))
      .catch(() => setError("Failed to load home page content."));

    // fetch page backgrounds
    get("/api/content/page-backgrounds")
      .then((data) => setBgContent(data || null))
      .catch(() => {});

    // fetch summaries for quick sections
    fetchSummaries();

    return () => {
      if (bgTimerRef.current) clearInterval(bgTimerRef.current);
    };
  }, []);

  async function fetchSummaries() {
    const keys = ["about", "admissions", "curriculum", "staff", "gallery", "contact"];
    try {
      const results = await Promise.all(
        keys.map((k) => get(`/api/content/${k}`).catch(() => null))
      );

      const map = {};
      keys.forEach((k, i) => {
        const d = results[i] || {};
        const fallback = sections.find((s) => s.key === k);

        map[k] = {
          title: d.title || fallback?.title,
          summary: (d.body || d.intro || fallback?.text || "").slice(0, 160),
          image:
            (d.attachments &&
              d.attachments[0] &&
              (d.attachments[0].downloadUrl || d.attachments[0].url)) ||
            null,
        };
      });

      setSummaries(map);
    } catch (err) {
      // ignore
    }
  }

  const sections = [
    {
      key: "about",
      title: "About Us",
      text: "Learn about our mission, history, values, and vision.",
      image: "/logo.png",
      childContainers: [
        {
          title: "Our History",
          text: "Our school has a rich history of academic excellence.",
          image: "/history-image.png",
        },
        {
          title: "Our Values",
          text: "Integrity, Respect, and Excellence are our core values.",
          image: "/values-image.png",
        },
        {
          title: "Our Vision",
          text: "To empower future leaders with knowledge and confidence.",
          image: "/vision-image.png",
        },
        {
          title: "Leadership",
          text: "We believe in strong leadership to guide our students.",
          image: "/images/school/lab 4.jpeg",
        },
        {
          title: "school Life",
          text: "Our vibrant campus is home to diverse activities.",
          image: "/images/school/lab 4.jpeg",
        },
        {
          title: "Community Engagement",
          text: "We actively engage with the local community.",
          image: "/images/school/lab 4.jpeg",
        },
      ],
    },

    {
      key: "our-school",
      title: "About Our School",
      text: "Learn about our mission, history, values, and vision.",
      
      childContainers: [
        {
          title: "Our classes",
          text: "Get a chance to take your studies in our well condusive learning enviroments.",
          image: "/images/school/class 3.jpeg",
        },
        {
          
          image: "/images/school/dh 1.jpeg",
        },
        {
          
          image: "/images/school/face 2.jpeg",
        },
        {
          
          image: "/images/school/face 4.jpeg",
        },
        {
          
          image: "/images/school/06.jpeg",
        },
        {
          
          image: "/images/school/class 1.jpeg",
        },
      ],
    },

    {
      key: "student",
      title: "student life",
      text: "Learn about our mission, history, values, and vision.",
      image: "/images/std 1.jpg",
      childContainers: [
        {
          title: "Students Engaged in Current Affairs Reading",
          text: "A group of students reading newspapers, fostering awareness of current events and promoting critical thinking in a group setting.",
          image: "/images/gallery/school life/std 1.jpg",
        },
        {
          
          image: "/images/students/IMG_0778.jpg",
        },
        {
          image: "/images/students/IMG_1067.jpg  ",
        },
        {
          
          image: "/images/students/life.jpg",
        },
        {
          
          image: "/images/students/std 4.jpg",
        },
        {
         
          image: "/images/students/sc.jpg",
        },
        {
          
          image: "/images/students/std 2.jpg",
        },
      ],
    },

    {
      key: "admissions",
      title: "Admission Process",
      text: "See the full admission process and join our school.",
      image: "/images/admissions/admission 1.jpeg",
      childContainers: [
        {
          title: "Admission Requirements",
          text: "Find out the requirements to apply to our school.",
          image: "/images/admissions/requirements.png",
        },
        {
          title: "How to Apply",
          text: "A step-by-step guide to help you through the application process.",
          image: "/images/admissions/how-to-apply.png",
        },
        {
          title: "Tuition Fees",
          text: "Learn about our competitive tuition fees and payment plans.",
          image: "/images/admissions/tuition.png",
        },
        {
          title: "Scholarships",
          text: "Explore the scholarship opportunities we offer.",
          image: "/images/admissions/scholarships.png",
        },
        {
          title: "Application Deadline",
          text: "Check the deadlines for applying for the upcoming academic year.",
          image: "/images/admissions/deadline.png",
        },
        {
          title: "Admission Events",
          text: "Attend our open days and information sessions.",
          image: "/images/admissions/events.png",
        },
      ],
    },
    {
      key: "curriculum",
      title: "Curriculum Overview",
      text: "Explore subjects, programs, and academic structure.",
      image: "/images/curriculum/curriculum 1.jpeg",
      childContainers: [
        {
          title: "Primary School Curriculum",
          text: "An introduction to our primary school curriculum.",
          image: "/images/curriculum/primary-curriculum-image.png",
        },
        {
          title: "Secondary School Curriculum",
          text: "A detailed overview of our secondary school offerings.",
          image: "/images/curriculum/secondary-curriculum-image.png",
        },
        {
          title: "Extracurricular Activities",
          text: "Sports, arts, and leadership programs beyond the classroom.",
          image: "/images/curriculum/extracurricular-image.png",
        },
        {
          title: "Assessments and Exams",
          text: "Information on how we assess our students' progress.",
          image: "/images/curriculum/assessment-image.png",
        },
        {
          title: "Curriculum Syllabus",
          text: "Detailed breakdown of each subject and course.",
          image: "/images/curriculum/syllabus-image.png",
        },
        {
          title: "Special Programs",
          text: "Our special programs for gifted students and more.",
          image: "/images/curriculum/special-programs-image.png",
        },
      ],
    },
    {
      key: "staff",
      title: "Our Staff",
      text: "Meet our teachers, leadership, and support staff.",
      image: "/images/staff/staff 1.jpeg",
      childContainers: [
        {
          title: "Leadership Team",
          text: "Meet the leaders guiding our institution.",
          image: "/images/staff/leadership-team-image.png",
        },
        {
          title: "Teaching Staff",
          text: "Our team of dedicated educators.",
          image: "/images/staff/teaching-staff-image.png",
        },
        {
          title: "Support Staff",
          text: "The support team that ensures the smooth running of our school.",
          image: "/images/staff/support-staff-image.png",
        },
        {
          title: "Staff Training",
          text: "Our continuous professional development programs.",
          image: "/images/staff/staff-training-image.png",
        },
        {
          title: "Staff Wellness",
          text: "We prioritize the well-being of our staff members.",
          image: "/images/staff/staff-wellness-image.png",
        },
        {
          title: "Faculty Achievements",
          text: "Recognizing the accomplishments of our academic staff.",
          image: "/images/staff/faculty-achievements-image.png",
        },
      ],
    },
    {
      key: "gallery",
      title: "school Gallery",
      text: "Browse photos of school events and student life.",
      image: "/images/gallery/gallery 1.jpeg",
      childContainers: [
        {
          title: "Sports Day",
          text: "Highlights from our annual sports events.",
          image: "/images/gallery/sports-day-image.png",
        },
        {
          title: "Cultural Celebrations",
          text: "A glimpse of our cultural festivals and events.",
          image: "/images/gallery/arts/19.jpg",
        },
        {
          title: "Graduation Ceremony",
          text: "Celebrate our students' achievements.",
          image: "/images/gallery/graduation-ceremony-image.png",
        },
        {
          title: "Field Trips",
          text: "Our students' educational field trips and excursions.",
          image: "/images/gallery/tours/IMG_0986.jpg",
        },
        {
          title: "Community Service",
          text: "The volunteer and service projects our students are involved in.",
          image: "/images/gallery/community-service-image.png",
        },
        {
          title: "Student Performances",
          text: "Talent shows, performances, and arts exhibitions.",
          image: "/images/gallery/arts/04.jpg",
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
          text: "Find our address, phone numbers, and email contacts.",
          
        },
        {
          title: "Contact Form",
          text: "Fill out our contact form for specific inquiries.",
          
        },
        {
          title: "Visit Us",
          text: "Plan a visit to our campus and meet our staff.",
          
        },
        
        {
          title: "Support Services",
          text: "Get help with admissions, fees, and more.",
          
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
                    <div
                      key={index}
                      style={{
                        width: "19.7%", // Each container takes 16.5% width to fit six containers in landscape
                        backgroundColor: "#47080ab3",
                        padding: "1px",
                        borderRadius: "5px",
                        boxShadow: "0 3px 10px rgba(244, 41, 10, 1)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "space-between",
                        
                      }}
                    >
                      {child.image && (
                        <div
                          style={{
                            width: "100%",
                            height: "250px",
                            overflow: "hidden",
                            borderRadius: "8px",
                            marginBottom: "10px",
                          }}
                        >
                          <img
                            src={safePath(child.image || "/images/hike.jpg")}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      )}
                      <h3 style={{ textAlign: "center" }}>{child.title}</h3>
                      <p
                        style={{
                          fontSize: "18px",
                          color: "#f0f00aff",
                          textAlign: "center",
                        }}
                      >
                        {child.text}
                      </p>
                      <button
                        onClick={() => setRoute(sec.key)}
                        style={{
                          padding: "8px 12px",
                          background: "#32f40bff",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          marginTop: "10px",
                        }}
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

      {/* Video and Image Slider Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div
          className="video-section"
          style={{
            position: "relative",
            flex: 1,
            marginRight: 20,
            height: "400px",
          }}
        >
          <video width="100%" height="100%" autoPlay loop muted>
            <source src="/images/videos/vid 1.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="welcome-text video-text">
            Welcome to NGUVIU GIRLS' SENIOR SCHOOL!
          </div>
        </div>

        <div
          className="image-slider"
          style={{
            position: "relative",
            flex: 1,
            height: "400px",
            backgroundImage: "url('public/header/hike.JPG')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <ImageSlider />
          <div className="welcome-text image-text">Explore Our Gallery</div>
        </div>
      </div>

      <EditableHeading
        value={content.title || "Welcome to NGUVIU GIRLS' SCHOOL"}
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
}

const ImageSlider = () => {
  const images = [
    "/images/background images/principle.jpeg",
    "/images/background images/deputy.jpeg",
    "/images/background images/img 1.jpeg",
    "/images/background images/lab 1.jpeg",
    "/images/background images/student 01.jpeg",
    "/images/background images/school3.jpeg",

  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 800);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="slider-container" style={{ width: "100%", height: "100%" }}>
      <img
        src={safePath(images[currentIndex])}
        alt=""
        className="slider-image"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "fit",
          transition: "opacity 0.9s ease-in-out",
          loading: "fast",
        }}
      />
    </div>
  );
};
