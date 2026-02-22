import React, { useEffect, useState } from "react";
import { get } from "../utils/api";
import Loader from "./Loader";

export default function HomeworkPortal() {
  const [homework, setHomework] = useState([]);
  const [filteredHomework, setFilteredHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const classes = ["Form 1", "Form 2", "Form 3", "Form 4"];
  const subjects = ["Mathematics", "English", "Science", "History", "Geography", "Kiswahili", "Arts", "Physical Education"];

  useEffect(() => {
    fetchHomework();
  }, []);

  async function fetchHomework() {
    setLoading(true);
    try {
      const data = await get("/api/homework");
      const sortedData = (Array.isArray(data) ? data : []).sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setHomework(sortedData);
      setFilteredHomework(sortedData);
    } catch (err) {
      console.error("Error fetching homework:", err);
      setError("Failed to load homework");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let filtered = homework;

    if (selectedClass !== "all") {
      filtered = filtered.filter(hw => hw.class === selectedClass);
    }

    if (selectedSubject !== "all") {
      filtered = filtered.filter(hw => hw.subject === selectedSubject);
    }

    setFilteredHomework(filtered);
  }, [selectedClass, selectedSubject, homework]);

  if (loading) return <Loader />;

  return (
    <div className="homework-portal" style={{ padding: "20px" }}>
      {/* Hero Section */}
      <div style={{
        position: "relative",
        width: "100vw",
        marginLeft: "50%",
        transform: "translateX(-50%)",
        minHeight: 300,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 40,
        color: "white",
        textAlign: "center",
        padding: "40px 20px"
      }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "10px" }}>📚 Homework & Notes Portal</h1>
          <p style={{ fontSize: "1.2rem", opacity: 0.9 }}>Access all your homework, notes, and study materials</p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        {/* Filters */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginTop: 0 }}>Filter Homework</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="all">All Classes</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="all">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ background: "#fee", padding: "15px", borderRadius: "6px", marginBottom: "20px", color: "#c33" }}>
            {error}
          </div>
        )}

        {/* Homework List */}
        {filteredHomework.length === 0 ? (
          <div style={{
            background: "white",
            borderRadius: "8px",
            padding: "40px",
            textAlign: "center",
            color: "#666"
          }}>
            <p style={{ fontSize: "1.1rem" }}>No homework found matching your filters.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {filteredHomework.map(hw => (
              <div
                key={hw._id}
                style={{
                  background: "white",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
              >
                {/* Header */}
                <div style={{ background: "#f8f9fa", padding: "15px", borderBottom: "1px solid #dee2e6" }}>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: "1.1rem" }}>{hw.title}</h3>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "4px 8px",
                      background: "#e7f3ff",
                      color: "#0066cc",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {hw.subject}
                    </span>
                    <span style={{
                      padding: "4px 8px",
                      background: "#f0f0f0",
                      color: "#333",
                      borderRadius: "4px",
                      fontSize: "12px"
                    }}>
                      {hw.class}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "15px" }}>
                  <div style={{ marginBottom: "12px" }}>
                    <small style={{ color: "#666" }}>
                      <strong>By:</strong> {hw.teacher?.name || "Unknown"}
                    </small>
                  </div>

                  {hw.description && (
                    <p style={{
                      color: "#555",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      marginBottom: "12px"
                    }}>
                      {hw.description.substring(0, 150)}
                      {hw.description.length > 150 ? "..." : ""}
                    </p>
                  )}

                  {hw.dueDate && (
                    <div style={{ marginBottom: "12px" }}>
                      <small style={{ color: "#d9534f" }}>
                        <strong>Due:</strong> {new Date(hw.dueDate).toLocaleDateString()}
                      </small>
                    </div>
                  )}

                  {/* Files */}
                  {hw.attachments && hw.attachments.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <small style={{ color: "#666", display: "block", marginBottom: "8px" }}>
                        <strong>📎 {hw.attachments.length} file{hw.attachments.length !== 1 ? 's' : ''}</strong>
                      </small>
                      <div style={{ display: "grid", gap: "6px" }}>
                        {hw.attachments.map((att, idx) => (
                          <a
                            key={att._id || idx}
                            href={att.url}
                            download={att.originalName}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "8px 12px",
                              background: "#007bff",
                              color: "white",
                              textDecoration: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              textAlign: "center",
                              transition: "background 0.2s"
                            }}
                            onMouseEnter={(e) => e.target.style.background = "#0056b3"}
                            onMouseLeave={(e) => e.target.style.background = "#007bff"}
                          >
                            📥 {att.originalName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{
                  padding: "10px 15px",
                  background: "#f8f9fa",
                  borderTop: "1px solid #dee2e6",
                  fontSize: "12px",
                  color: "#666"
                }}>
                  Uploaded {new Date(hw.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

  const levels = [
    { value: "grade10", label: "Grade 10 (CBE)" },
    { value: "grade11", label: "Grade 11 (CBE)" },
    { value: "grade12", label: "Grade 12 (CBE)" },
    { value: "form3", label: "Form 3 (KCSE)" },
    { value: "form4", label: "Form 4 (KCSE)" },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");

    if (!file) {
      setStatus("Please choose a file before submitting.");
      return;
    }
    if (!subject.trim()) {
      setStatus("Please enter the subject (e.g. Mathematics, Biology).");
      return;
    }

    try {
      const formData = new FormData();

      // ⬇⬇ IMPORTANT: field name must match multer.array("attachments")
      formData.append("attachments", file);

      // extra metadata for backend
      formData.append("level", level);
      formData.append("subject", subject);
      formData.append("notes", notes);
      formData.append("studentEmail", user?.email || "");
      formData.append("studentRole", user?.role || "");

      await upload("/api/files", formData, {}, { setLoading });

      setStatus("✅ Homework submitted successfully.");
      setFile(null);
      setNotes("");
      // keep subject & level for quick next submission
    } catch (err) {
      console.error("Upload error:", err);
      setStatus(
        "❌ Failed to submit homework. " +
          (err?.message ? `(${err.message})` : "Please try again.")
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", marginBottom: 4 }}>
          Level / Class
        </label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          style={{ width: "100%", padding: 6 }}
        >
          {levels.map((lvl) => (
            <option key={lvl.value} value={lvl.value}>
              {lvl.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", marginBottom: 4 }}>
          Subject (e.g. Mathematics, Chemistry, English)
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{ width: "100%", padding: 6 }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", marginBottom: 4 }}>
          Comment to Teacher (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: 6 }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", marginBottom: 4 }}>
          Upload Homework File
        </label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
          You can upload PDF, Word, PowerPoint, images, ZIP, etc. (follow your
          teacher’s instructions).
        </p>
      </div>

      <button type="submit" style={{ padding: "8px 16px" }} disabled={loading}>
        {loading ? "Submitting..." : "Submit Homework"}
      </button>

      {status && (
        <p style={{ marginTop: 8, fontSize: 13 }}>
          {status}
        </p>
      )}
    </form>
  );
}

// ================================
// TEACHER / ADMIN SUBMISSIONS TABLE
// ================================
function HomeworkSubmissionsList() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadSubmissions() {
    try {
      setLoading(true);
      setError("");
      const data = await get("/api/files"); // backend returns File[]
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load homework submissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  return (
    <div style={{ marginTop: 16 }}>
      <button onClick={loadSubmissions} style={{ marginBottom: 8 }}>
        🔄 Refresh Submissions
      </button>

      {loading && <p>Loading submissions...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && submissions.length === 0 && !error && (
        <p>No homework submissions yet.</p>
      )}

      {submissions.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 4 }}>Date</th>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 4 }}>Student Email</th>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 4 }}>Level</th>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 4 }}>Subject</th>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 4 }}>File</th>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 4 }}>Download</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((f) => (
                <tr key={f._id}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 4 }}>
                    {f.uploadedAt
                      ? new Date(f.uploadedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 4 }}>
                    {f.studentEmail || "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 4 }}>
                    {f.level || "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 4 }}>
                    {f.subject || "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 4 }}>
                    {f.originalName || "(no name)"}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 4 }}>
                    <a href={`${(import.meta.env.VITE_API_URL || "http://localhost:4000")}${f.url}`} target="_blank" rel="noreferrer" download>
                      Download
                    </a>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ================================
// MAIN HOMEWORK PORTAL COMPONENT
// ================================
export default function HomeworkPortal({ user }) {
  // ✅ allow BOTH admin and teacher to edit / add files
  const canEdit = user?.role === "admin" || user?.role === "teacher";
  const [activeLevel, setActiveLevel] = useState("grade10"); // grade10 | grade11 | grade12 | form3 | form4

  // ============================
  // CBC SENIOR SCHOOL (GRADE 10–12)
  // ============================

  // ----- GRADE 10 (CBC) -----
  const grade10StemFiles = [
    {
      name: "Grade 10 STEM – Mathematics: Linear Equations & Inequalities",
      url: "/files/cbc/grade10/stem/math-linear-equations.pdf",
    },
    {
      name: "Grade 10 STEM – Physics: Measurement & Errors",
      url: "/files/cbc/grade10/stem/physics-measurement.docx",
    },
    {
      name: "Grade 10 STEM – Chemistry: Structure of the Atom",
      url: "/files/cbc/grade10/stem/chemistry-atomic-structure.pptx",
    },
    {
      name: "Grade 10 STEM – ICT: Introduction to Programming (Scratch/Python)",
      url: "/files/cbc/grade10/stem/ict-intro-programming.zip",
    },
  ];

  const grade10SocialFiles = [
    {
      name: "Grade 10 Social Sciences – History: Pre-colonial Kenyan Communities",
      url: "/files/cbc/grade10/social/history-precolonial-kenya.pdf",
    },
    {
      name: "Grade 10 Social Sciences – Geography: Weather & Climate",
      url: "/files/cbc/grade10/social/geography-weather-climate.docx",
    },
    {
      name: "Grade 10 Social Sciences – Business Studies: Forms of Business Units",
      url: "/files/cbc/grade10/social/business-forms-of-business.pptx",
    },
    {
      name: "Grade 10 Social Sciences – CRE: Christian Values in Society",
      url: "/files/cbc/grade10/social/cre-christian-values.pdf",
    },
  ];

  const grade10ArtsFiles = [
    {
      name: "Grade 10 Arts – Music: African Folk Songs Assignment",
      url: "/files/cbc/grade10/arts/music-african-folk-songs.docx",
    },
    {
      name: "Grade 10 Arts – Visual Arts: Design & Colour Theory",
      url: "/files/cbc/grade10/arts/visual-arts-colour-theory.pdf",
    },
    {
      name: "Grade 10 Arts – Drama: Character Development Task",
      url: "/files/cbc/grade10/arts/drama-character-development.pdf",
    },
    {
      name: "Grade 10 Arts – Sports Science: Fitness Assessment Log",
      url: "/files/cbc/grade10/arts/sports-fitness-log.xlsx",
    },
  ];

  // ----- GRADE 11 (CBC) -----
  const grade11StemFiles = [
    {
      name: "Grade 11 STEM – Mathematics: Quadratic Functions & Graphs",
      url: "/files/cbc/grade11/stem/math-quadratic-functions.pdf",
    },
    {
      name: "Grade 11 STEM – Physics: Motion in a Straight Line",
      url: "/files/cbc/grade11/stem/physics-linear-motion.docx",
    },
    {
      name: "Grade 11 STEM – Chemistry: Acids, Bases & Indicators",
      url: "/files/cbc/grade11/stem/chemistry-acids-bases.pptx",
    },
    {
      name: "Grade 11 STEM – Biology: Cell Division (Mitosis & Meiosis)",
      url: "/files/cbc/grade11/stem/biology-cell-division.pdf",
    },
  ];

  const grade11SocialFiles = [
    {
      name: "Grade 11 Social Sciences – History: Nationalism in Kenya",
      url: "/files/cbc/grade11/social/history-nationalism-kenya.pdf",
    },
    {
      name: "Grade 11 Social Sciences – Geography: Population & Settlement",
      url: "/files/cbc/grade11/social/geography-population-settlement.docx",
    },
    {
      name: "Grade 11 Social Sciences – Business: Sources of Business Finance",
      url: "/files/cbc/grade11/social/business-finance.pptx",
    },
    {
      name: "Grade 11 Social Sciences – English: Setbook Essay Questions",
      url: "/files/cbc/grade11/social/english-setbook-essays.pdf",
    },
  ];

  const grade11ArtsFiles = [
    {
      name: "Grade 11 Arts – Music: Harmony & Chord Progressions",
      url: "/files/cbc/grade11/arts/music-harmony.docx",
    },
    {
      name: "Grade 11 Arts – Visual Arts: Perspective Drawing Exercises",
      url: "/files/cbc/grade11/arts/visual-arts-perspective.pdf",
    },
    {
      name: "Grade 11 Arts – Drama: Short Skit Script Writing",
      url: "/files/cbc/grade11/arts/drama-skit-writing.pdf",
    },
    {
      name: "Grade 11 Arts – Sports Science: Training Principles Homework",
      url: "/files/cbc/grade11/arts/sports-training-principles.pdf",
    },
  ];

  // ----- GRADE 12 (CBC) -----
  const grade12StemFiles = [
    {
      name: "Grade 12 STEM – Mathematics: Differentiation & Integration Basics",
      url: "/files/cbc/grade12/stem/math-calculus-basics.pdf",
    },
    {
      name: "Grade 12 STEM – Physics: Work, Energy & Power",
      url: "/files/cbc/grade12/stem/physics-work-energy.docx",
    },
    {
      name: "Grade 12 STEM – Chemistry: Electrochemistry",
      url: "/files/cbc/grade12/stem/chemistry-electrochemistry.pptx",
    },
    {
      name: "Grade 12 STEM – Computer Science: Database Design Task",
      url: "/files/cbc/grade12/stem/compsci-database-design.zip",
    },
  ];

  const grade12SocialFiles = [
    {
      name: "Grade 12 Social Sciences – History: Devolution & Governance in Kenya",
      url: "/files/cbc/grade12/social/history-devolution-governance.pdf",
    },
    {
      name: "Grade 12 Social Sciences – Geography: Environmental Management",
      url: "/files/cbc/grade12/social/geography-environment-management.docx",
    },
    {
      name: "Grade 12 Social Sciences – Business: Strategic Planning in Business",
      url: "/files/cbc/grade12/social/business-strategic-planning.pptx",
    },
    {
      name: "Grade 12 Social Sciences – CRE: Christian Approaches to Contemporary Issues",
      url: "/files/cbc/grade12/social/cre-contemporary-issues.pdf",
    },
  ];

  const grade12ArtsFiles = [
    {
      name: "Grade 12 Arts – Music: Composition for Examination",
      url: "/files/cbc/grade12/arts/music-exam-composition.docx",
    },
    {
      name: "Grade 12 Arts – Visual Arts: Portfolio Preparation Guide",
      url: "/files/cbc/grade12/arts/visual-arts-portfolio.pdf",
    },
    {
      name: "Grade 12 Arts – Drama: Directing & Stage Management Task",
      url: "/files/cbc/grade12/arts/drama-directing.pdf",
    },
    {
      name: "Grade 12 Arts – Sports Science: Sports Nutrition Assignment",
      url: "/files/cbc/grade12/arts/sports-nutrition.pdf",
    },
  ];

  // ============================
  // KCSE TRACK (FORM 3 & FORM 4) BY SUBJECT
  // ============================

  // FORM 3 SUBJECTS
  const form3MathFiles = [
    {
      name: "Form 3 – Mathematics Paper 1: Algebra & Indices",
      url: "/files/kcse/form3/math-paper1-algebra.pdf",
    },
    {
      name: "Form 3 – Mathematics Paper 2: Geometry & Trigonometry",
      url: "/files/kcse/form3/math-paper2-geometry.pdf",
    },
  ];

  const form3SciencesFiles = [
    // Biology
    {
      name: "Form 3 – Biology Paper 1: Genetics & Variation",
      url: "/files/kcse/form3/biology-paper1-genetics.pdf",
    },
    {
      name: "Form 3 – Biology Paper 2: Ecology",
      url: "/files/kcse/form3/biology-paper2-ecology.pdf",
    },
    {
      name: "Form 3 – Biology Paper 3: Practical Work",
      url: "/files/kcse/form3/biology-paper3-practical.docx",
    },

    // Chemistry
    {
      name: "Form 3 – Chemistry Paper 1: Salts & Preparation",
      url: "/files/kcse/form3/chemistry-paper1-salts.pdf",
    },
    {
      name: "Form 3 – Chemistry Paper 2: Organic Chemistry Intro",
      url: "/files/kcse/form3/chemistry-paper2-organic.pdf",
    },
    {
      name: "Form 3 – Chemistry Paper 3: Practical",
      url: "/files/kcse/form3/chemistry-paper3-practical.docx",
    },

    // Physics
    {
      name: "Form 3 – Physics Paper 1: Reflection & Refraction",
      url: "/files/kcse/form3/physics-paper1-reflection.pdf",
    },
    {
      name: "Form 3 – Physics Paper 2: Mechanics",
      url: "/files/kcse/form3/physics-paper2-mechanics.pdf",
    },
    {
      name: "Form 3 – Physics Paper 3: Practical",
      url: "/files/kcse/form3/physics-paper3-practical.docx",
    },
  ];

  const form3LanguagesFiles = [
    // English
    {
      name: "Form 3 – English Paper 1: Functional Writing",
      url: "/files/kcse/form3/english-paper1-functional.pdf",
    },
    {
      name: "Form 3 – English Paper 2: Comprehension & Cloze Test",
      url: "/files/kcse/form3/english-paper2-comprehension.pdf",
    },
    {
      name: "Form 3 – English Paper 3: Creative Writing",
      url: "/files/kcse/form3/english-paper3-creative.pdf",
    },

    // Kiswahili
    {
      name: "Form 3 – Kiswahili Paper 1: Insha",
      url: "/files/kcse/form3/kiswahili-paper1-insha.pdf",
    },
    {
      name: "Form 3 – Kiswahili Paper 2: Ufahamu & Fasihi",
      url: "/files/kcse/form3/kiswahili-paper2-fasihi.pdf",
    },
    {
      name: "Form 3 – Kiswahili Paper 3: Lugha",
      url: "/files/kcse/form3/kiswahili-paper3-lugha.pdf",
    },

    // French
    {
      name: "Form 3 – French Paper 1: Grammar & Vocabulary",
      url: "/files/kcse/form3/french-paper1-grammar.pdf",
    },
    {
      name: "Form 3 – French Paper 2: Oral & Composition",
      url: "/files/kcse/form3/french-paper2-oral.pdf",
    },
  ];

  const form3HumanitiesFiles = [
    // History & Government
    {
      name: "Form 3 – History Paper 1: Kenya History & Government",
      url: "/files/kcse/form3/history-paper1-kenya.pdf",
    },
    {
      name: "Form 3 – History Paper 2: World History",
      url: "/files/kcse/form3/history-paper2-world.pdf",
    },

    // Geography
    {
      name: "Form 3 – Geography Paper 1: Physical Geography",
      url: "/files/kcse/form3/geography-paper1-physical.pdf",
    },
    {
      name: "Form 3 – Geography Paper 2: Human & Economic Geography",
      url: "/files/kcse/form3/geography-paper2-human.pdf",
    },
    {
      name: "Form 3 – Geography Paper 3: Mapwork & Fieldwork",
      url: "/files/kcse/form3/geography-paper3-mapwork.pdf",
    },

    // CRE
    {
      name: "Form 3 – CRE Paper 1: Old Testament",
      url: "/files/kcse/form3/cre-paper1-ot.pdf",
    },
    {
      name: "Form 3 – CRE Paper 2: New Testament & Issues",
      url: "/files/kcse/form3/cre-paper2-nt.pdf",
    },
  ];

  const form3AppliedFiles = [
    // Business Studies
    {
      name: "Form 3 – Business Studies Paper 1",
      url: "/files/kcse/form3/business-paper1.pdf",
    },
    {
      name: "Form 3 – Business Studies Paper 2",
      url: "/files/kcse/form3/business-paper2.pdf",
    },

    // Agriculture
    {
      name: "Form 3 – Agriculture Paper 1",
      url: "/files/kcse/form3/agriculture-paper1.pdf",
    },
    {
      name: "Form 3 – Agriculture Paper 2",
      url: "/files/kcse/form3/agriculture-paper2.pdf",
    },

    // Computer Studies
    {
      name: "Form 3 – Computer Studies Paper 1",
      url: "/files/kcse/form3/computer-paper1.pdf",
    },
    {
      name: "Form 3 – Computer Studies Paper 2",
      url: "/files/kcse/form3/computer-paper2.pdf",
    },

    // Home Science
    {
      name: "Form 3 – Home Science Paper 1",
      url: "/files/kcse/form3/home-science-paper1.pdf",
    },
    {
      name: "Form 3 – Home Science Paper 2",
      url: "/files/kcse/form3/home-science-paper2.pdf",
    },
  ];

  // FORM 4 SUBJECTS
  const form4MathFiles = [
    {
      name: "Form 4 – Mathematics Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/math-paper1-past.pdf",
    },
    {
      name: "Form 4 – Mathematics Paper 2: KCSE Past Paper",
      url: "/files/kcse/form4/math-paper2-past.pdf",
    },
  ];

  const form4SciencesFiles = [
    // Biology
    {
      name: "Form 4 – Biology Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/biology-paper1-past.pdf",
    },
    {
      name: "Form 4 – Biology Paper 2: KCSE Past Paper",
      url: "/files/kcse/form4/biology-paper2-past.pdf",
    },
    {
      name: "Form 4 – Biology Paper 3: KCSE Practical",
      url: "/files/kcse/form4/biology-paper3-practical.docx",
    },

    // Chemistry
    {
      name: "Form 4 – Chemistry Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/chemistry-paper1-past.pdf",
    },
    {
      name: "Form 4 – Chemistry Paper 2: KCSE Past Paper",
      url: "/files/kcse/form4/chemistry-paper2-past.pdf",
    },
    {
      name: "Form 4 – Chemistry Paper 3: KCSE Practical",
      url: "/files/kcse/form4/chemistry-paper3-practical.docx",
    },

    // Physics
    {
      name: "Form 4 – Physics Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/physics-paper1-past.pdf",
    },
    {
      name: "Form 4 – Physics Paper 2: KCSE Past Paper",
      url: "/files/kcse/form4/physics-paper2-past.pdf",
    },
    {
      name: "Form 4 – Physics Paper 3: KCSE Practical",
      url: "/files/kcse/form4/physics-paper3-practical.docx",
    },
  ];

  const form4LanguagesFiles = [
    // English
    {
      name: "Form 4 – English Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/english-paper1-past.pdf",
    },
    {
      name: "Form 4 – English Paper 2: KCSE Past Paper",
      url: "/files/kcse/form4/english-paper2-past.pdf",
    },
    {
      name: "Form 4 – English Paper 3: KCSE Past Paper",
      url: "/files/kcse/form4/english-paper3-past.pdf",
    },

    // Kiswahili
    {
      name: "Form 4 – Kiswahili Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/kiswahili-paper1-past.pdf",
    },
    {
      name: "Form 4 – Kiswahili Paper 2: KCSE Past Paper",
      url: "/files/kcse/form4/kiswahili-paper2-past.pdf",
    },
    {
      name: "Form 4 – Kiswahili Paper 3: KCSE Past Paper",
      url: "/files/kcse/form4/kiswahili-paper3-past.pdf",
    },

    // French
    {
      name: "Form 4 – French Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/french-paper1-past.pdf",
    },
    {
      name: "Form 4 – French Paper 2: KCSE Oral & Composition",
      url: "/files/kcse/form4/french-paper2-oral.pdf",
    },
  ];

  const form4HumanitiesFiles = [
    // History & Government
    {
      name: "Form 4 – History Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/history-paper1-past.pdf",
    },
    {
      name: "Form 4 – History Paper 2: KCSE Past Paper",
      url: "/files/kcse/form4/history-paper2-past.pdf",
    },

    // Geography
    {
      name: "Form 4 – Geography Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/geography-paper1-past.pdf",
    },
    {
      name: "Form 4 – Geography Paper 2: KCSE Past Paper",
      url: "/files/kcse/form4/geography-paper2-past.pdf",
    },
    {
      name: "Form 4 – Geography Paper 3: KCSE Mapwork & Fieldwork",
      url: "/files/kcse/form4/geography-paper3-mapwork.pdf",
    },

    // CRE
    {
      name: "Form 4 – CRE Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/cre-paper1-past.pdf",
    },
    {
      name: "Form 4 – CRE Paper 2: KCSE Past Paper",
      url: "/files/kcse/form4/cre-paper2-past.pdf",
    },
  ];

  const form4AppliedFiles = [
    // Business Studies
    {
      name: "Form 4 – Business Studies Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/business-paper1-past.pdf",
    },
    {
      name: "Form 4 – Business Studies Paper 2: KCSE Past Paper",
      url: "/files/kcse/form4/business-paper2-past.pdf",
    },

    // Agriculture
    {
      name: "Form 4 – Agriculture Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/agriculture-paper1-past.pdf",
    },
    {
      name: "Form 4 – Agriculture Paper 2: KCSE Past Paper",
      url: "/files/kcse/form4/agriculture-paper2-past.pdf",
    },

    // Computer Studies
    {
      name: "Form 4 – Computer Studies Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/computer-paper1-past.pdf",
    },
    {
      name: "Form 4 – Computer Studies Paper 2: KCSE Practical Project",
      url: "/files/kcse/form4/computer-paper2-project.docx",
    },

    // Home Science
    {
      name: "Form 4 – Home Science Paper 1: KCSE Past Paper",
      url: "/files/kcse/form4/home-science-paper1-past.pdf",
    },
    {
      name: "Form 4 – Home Science Paper 2: KCSE Past Paper",
      url: "/files/kcse/form4/home-science-paper2-past.pdf",
    },
  ];

  // ============================
  // RENDER HELPERS
  // ============================

  const levelTabs = [
    { id: "grade10", label: "Grade 10 (CBE)" },
    { id: "grade11", label: "Grade 11 (CBE)" },
    { id: "grade12", label: "Grade 12 (CBE)" },
    { id: "form3", label: "Form 3 (KCSE)" },
    { id: "form4", label: "Form 4 (KCSE)" },
  ];

  function renderGrade10() {
    return (
      <>
        <EditableSubheading
          value="Grade 10 – Choose Your Pathway"
          onSave={() => {}}
          isAdmin={canEdit}
          level={3}
        />
        <EditableText
          value="If you are in Grade 10 (CBC), select your pathway below to download your homework."
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Grade 10 – STEM Pathway"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={grade10StemFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Grade 10 – Social Sciences Pathway"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={grade10SocialFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Grade 10 – Arts & Sports Science Pathway"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={grade10ArtsFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />
      </>
    );
  }

  function renderGrade11() {
    return (
      <>
        <EditableSubheading
          value="Grade 11 – Choose Your Pathway"
          onSave={() => {}}
          isAdmin={canEdit}
          level={3}
        />
        <EditableText
          value="If you are in Grade 11 (CBC), open your pathway to access homework and revision materials."
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Grade 11 – STEM Pathway"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={grade11StemFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Grade 11 – Social Sciences Pathway"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={grade11SocialFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Grade 11 – Arts & Sports Science Pathway"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={grade11ArtsFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />
      </>
    );
  }

  function renderGrade12() {
    return (
      <>
        <EditableSubheading
          value="Grade 12 – Choose Your Pathway"
          onSave={() => {}}
          isAdmin={canEdit}
          level={3}
        />
        <EditableText
          value="Grade 12 learners should use these homework packs for pathway projects, school-based assessments, and final exam preparation."
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Grade 12 – STEM Pathway"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={grade12StemFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Grade 12 – Social Sciences Pathway"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={grade12SocialFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Grade 12 – Arts & Sports Science Pathway"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={grade12ArtsFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />
      </>
    );
  }

  function renderForm3() {
    return (
      <>
        <EditableSubheading
          value="Form 3 – KCSE Homework by Subject"
          onSave={() => {}}
          isAdmin={canEdit}
          level={3}
        />
        <EditableText
          value="If you are in Form 3, select your subject area and download the relevant homework or revision pack."
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Form 3 – Mathematics"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={form3MathFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Form 3 – Sciences (Biology, Chemistry, Physics)"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={form3SciencesFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Form 3 – Languages (English, Kiswahili, French)"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={form3LanguagesFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Form 3 – Humanities (History, CRE, Geography)"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={form3HumanitiesFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Form 3 – Applied & Technical (Business, Agriculture, Computer, Home Science)"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={form3AppliedFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />
      </>
    );
  }

  function renderForm4() {
    return (
      <>
        <EditableSubheading
          value="Form 4 – KCSE Homework & Revision by Subject"
          onSave={() => {}}
          isAdmin={canEdit}
          level={3}
        />
        <EditableText
          value="Form 4 candidates should use these subject-based revision packs and mocks to prepare for KCSE."
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Form 4 – Mathematics"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={form4MathFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Form 4 – Sciences (Biology, Chemistry, Physics)"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={form4SciencesFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Form 4 – Languages (English, Kiswahili, French)"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={form4LanguagesFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Form 4 – Humanities (History, CRE, Geography)"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={form4HumanitiesFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />

        <EditableSubheading
          value="Form 4 – Applied & Technical (Business, Agriculture, Computer, Home Science)"
          onSave={() => {}}
          isAdmin={canEdit}
          level={4}
        />
        <EditableFileList
          files={form4AppliedFiles}
          onSave={() => {}}
          isAdmin={canEdit}
        />
      </>
    );
  }

  function renderActiveLevel() {
    switch (activeLevel) {
      case "grade10":
        return renderGrade10();
      case "grade11":
        return renderGrade11();
      case "grade12":
        return renderGrade12();
      case "form3":
        return renderForm3();
      case "form4":
        return renderForm4();
      default:
        return renderGrade10();
    }
  }

  return (
    <div style={{ padding: "20px 8px" }}>
      {/* MAIN HEADING */}
      <EditableHeading
        value="Senior School Homework Portal – CBC & KCSE"
        onSave={() => {}}
        isAdmin={canEdit}
        level={2}
      />

      {/* INTRO TEXT */}
      <EditableText
        value={
          "Select your level (Grade 10–12 CBC or Form 3–4 KCSE) using the tabs below. " +
          "Then open your pathway or subject area to download homework and revision materials."
        }
        onSave={() => {}}
        isAdmin={canEdit}
      />

      {/* LEVEL TABS */}
      <div
        style={{
          display: "flex",
          gap: 8,
          margin: "16px 0",
          flexWrap: "wrap",
        }}
      >
        {levelTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveLevel(tab.id)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border:
                activeLevel === tab.id ? "2px solid #a00" : "1px solid #ccc",
              background: activeLevel === tab.id ? "#fce4e4" : "#fff",
              cursor: "pointer",
              fontWeight: activeLevel === tab.id ? "bold" : "normal",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ACTIVE LEVEL CONTENT */}
      <div>{renderActiveLevel()}</div>

      {/* 📥 STUDENT SUBMISSION SECTION */}
      <div
        style={{
          marginTop: 32,
          borderTop: "1px solid #ddd",
          paddingTop: 16,
        }}
      >
        <EditableSubheading
          value="Submit Your Homework"
          onSave={() => {}}
          isAdmin={canEdit}
          level={3}
        />
        <EditableText
          value="Upload your completed homework file here. Make sure you have selected the correct level, subject, and followed your teacher’s instructions."
          onSave={() => {}}
          isAdmin={canEdit}
        />

        {/* Students submit here */}
        <StudentSubmissionForm user={user} />

        {/* 👇 Teachers/Admins see this extra block */}
        {canEdit && (
          <div
            style={{
              marginTop: 32,
              borderTop: "1px dashed #ccc",
              paddingTop: 16,
            }}
          >
            <EditableSubheading
              value="Teacher / Admin – View Submitted Homework"
              onSave={() => {}}
              isAdmin={canEdit}
              level={3}
            />
            <EditableText
              value="Below is a list of all homework files submitted by students. You can download each file and use the metadata to track class and subject."
              onSave={() => {}}
              isAdmin={canEdit}
            />

            <HomeworkSubmissionsList />
          </div>
        )}
      </div>
    </div>
  );
}
