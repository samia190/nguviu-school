import { useEffect, useState } from "react";
import { get, patch } from "../utils/api";
import EditableHeading from "../components/EditableHeading";
import EditableSubheading from "../components/EditableSubheading";
import EditableText from "../components/EditableText";
import EditableFileList from "../components/EditableFileList";

export default function Performance({ user }) {
  const [content, setContent] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    get("/api/content/performance")
      .then((data) => setContent(data || {}))
      .catch(() => setError("Failed to load performance content."));
  }, []);

  function updateSection(section, value) {
    patch(`/api/content/performance/${section}`, { value })
      .then(() => setContent((prev) => ({ ...prev, [section]: value })))
      .catch((err) => {
        console.error("Failed to save:", err);
        alert("Failed to save content.");
      });
  }

  return (
    <section style={{ padding: 20 }}>
      <EditableHeading
        value={content.title || "School Performance"}
        onSave={(val) => updateSection("title", val)}
        isAdmin={user?.role === "admin"}
        level={2}
      />

      <EditableText
        value={
          content.intro ||
          "We are proud of our students' achievements and continually strive for academic excellence. Our performance reflects the dedication of our learners, teachers, and parents."
        }
        onSave={(val) => updateSection("intro", val)}
        isAdmin={user?.role === "admin"}
      />

      <EditableSubheading
        value={content.resultsHeading || "Recent Exam Results"}
        onSave={(val) => updateSection("resultsHeading", val)}
        isAdmin={user?.role === "admin"}
        level={3}
      />

      <div style={{ overflowX: "auto", maxWidth: "100%" }}>
        <table className="table" style={{ maxWidth: 600 }}>
          <thead>
            <tr>
              <th>Year</th>
              <th>KCSE Mean Grade</th>
              <th>Top Score</th>
              <th>Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2024</td>
              <td>C+</td>
              <td>A- (84 points)</td>
              <td>54.4%</td>
            </tr>
            <tr>
              <td>2023</td>
              <td>C+</td>
              <td>A- (82 points)</td>
              <td>64.26%</td>
            </tr>
            <tr>
              <td>2022</td>
              <td>C+</td>
              <td>B+ (76 points)</td>
              <td>53.37%</td>
            </tr>

            <tr>
              <td>2021</td>
              <td>C+</td>
              <td>A-(82 points)</td>
              <td>63.3%</td>
            </tr>
            <tr>
              <td>2020</td>
              <td>C+</td>
              <td>B+ (78 points)</td>
              <td>60%</td>
            </tr>



          </tbody>
        </table>
      </div>

      <EditableSubheading
        value={content.highlightsHeading || "Progress Highlights"}
        onSave={(val) => updateSection("highlightsHeading", val)}
        isAdmin={user?.role === "admin"}
        level={3}
      />
      <EditableText
        value={
          content.highlights ||
          `• Consistent improvement in mean grade over the past 5 years\n• Over 90% of students qualify for university admission\n• Strong performance in STEM subjects and languages`
        }
        onSave={(val) => updateSection("highlights", val)}
        isAdmin={user?.role === "admin"}
      />

      <EditableSubheading
        value={content.reportsHeading || "Downloadable Reports"}
        onSave={(val) => updateSection("reportsHeading", val)}
        isAdmin={user?.role === "admin"}
        level={3}
      />
      <EditableFileList
        files={
          content.reports || [
            { name: "2021 Performance Report", url: "/files/downloads/Biology" },
            { name: "2023 Performance Report", url: "/files/performance-report-2023.pdf" }
          ]
        }
        onSave={(files) => updateSection("reports", files)}
        isAdmin={user?.role === "admin"}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}
    </section>
  );
}
