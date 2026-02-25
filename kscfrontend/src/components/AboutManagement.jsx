import React, { useEffect, useState } from "react";
import { get, put, upload } from "../utils/api";
import Loader from "./Loader";

export default function AboutManagement() {
  const [aboutpage, setAboutpage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("settings");

  // Page settings
  const [pageForm, setPageForm] = useState({ title: "", intro: "" });

  // Motto, Vision, Mission, Promise
  const [mottoForm, setMottoForm] = useState({ heading: "", text: "" });
  const [visionForm, setVisionForm] = useState({ heading: "", text: "" });
  const [missionForm, setMissionForm] = useState({ heading: "", text: "" });
  const [promiseForm, setPromiseForm] = useState({ heading: "", text: "" });

  // Core values
  const [coreValues, setCoreValues] = useState([]);
  const [newValue, setNewValue] = useState("");

  // Hero section
  const [heroForm, setHeroForm] = useState({ imageUrl: "", title: "", subtitle: "" });
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState(null);

  // Leadership
  const [leadershipForm, setLeadershipForm] = useState({
    position: "principal",
    photoUrl: "",
    fullName: "",
    department: "Administration",
    remarks: "",
  });
  const [leadershipImageFile, setLeadershipImageFile] = useState(null);
  const [leadershipImagePreview, setLeadershipImagePreview] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [deputies, setDeputies] = useState([]);

  useEffect(() => {
    fetchAboutpage();
  }, []);

  async function fetchAboutpage() {
    setLoading(true);
    try {
      const data = await get("/api/about/admin");
      setAboutpage(data);
      
      setPageForm({
        title: data.title || "",
        intro: data.intro || "",
      });

      setMottoForm({
        heading: data.motto?.heading || "MOTTO",
        text: data.motto?.text || "",
      });

      setVisionForm({
        heading: data.vision?.heading || "VISION",
        text: data.vision?.text || "",
      });

      setMissionForm({
        heading: data.mission?.heading || "MISSION",
        text: data.mission?.text || "",
      });

      setPromiseForm({
        heading: data.promise?.heading || "Our Promise",
        text: data.promise?.text || "",
      });

      setCoreValues((data.coreValues || []).sort((a, b) => a.order - b.order));

      setHeroForm({
        imageUrl: data.heroContent?.imageUrl || "",
        title: data.heroContent?.title || "",
        subtitle: data.heroContent?.subtitle || "",
      });

      if (data.leadership) {
        setPrincipal(data.leadership.principal);
        setDeputies(data.leadership.deputies || []);
      }
    } catch (err) {
      setError("Failed to load about page data");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handlePageChange(e) {
    const { name, value } = e.target;
    setPageForm((prev) => ({ ...prev, [name]: value }));
  }

  async function savePageSettings() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await put("/api/about", {
        title: pageForm.title,
        intro: pageForm.intro,
      });
      setAboutpage(updated);
      setSuccess("Page settings saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  function handlePhilosophyChange(field, formSetter) {
    return (e) => {
      const { name, value } = e.target;
      formSetter((prev) => ({ ...prev, [name]: value }));
    };
  }

  async function savePhilosophy() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await put("/api/about", {
        motto: mottoForm,
        vision: visionForm,
        mission: missionForm,
        promise: promiseForm,
      });
      setAboutpage(updated);
      setSuccess("Philosophy sections saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  async function addCoreValue() {
    if (!newValue.trim()) {
      setError("Value cannot be empty");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedValues = [
        ...coreValues,
        { order: coreValues.length + 1, value: newValue },
      ];

      const updated = await put("/api/about", { coreValues: updatedValues });
      setCoreValues(updated.coreValues || []);
      setNewValue("");
      setSuccess("Core value added!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to add value: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCoreValue(index) {
    if (!confirm("Delete this value?")) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedValues = coreValues.filter((_, i) => i !== index);

      const updated = await put("/api/about", { coreValues: updatedValues });
      setCoreValues(updated.coreValues || []);
      setSuccess("Core value deleted!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete value: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  function handleHeroImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (heroImagePreview && heroImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(heroImagePreview);
    }

    setHeroImageFile(file);
    setHeroImagePreview(URL.createObjectURL(file));
  }

  function handleHeroFormChange(e) {
    const { name, value } = e.target;
    setHeroForm((prev) => ({ ...prev, [name]: value }));
  }

  async function saveHero() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let imageUrl = heroForm.imageUrl;

      if (heroImageFile) {
        const fd = new FormData();
        fd.append("file", heroImageFile);
        const uploadResult = await upload("/api/about/hero-upload", fd);
        imageUrl = uploadResult.url;
      }

      const updated = await put("/api/about", {
        heroContent: {
          imageUrl,
          title: heroForm.title,
          subtitle: heroForm.subtitle,
        },
      });

      setAboutpage(updated);
      setHeroForm({
        imageUrl,
        title: updated.heroContent?.title || "",
        subtitle: updated.heroContent?.subtitle || "",
      });
      setHeroImageFile(null);
      if (heroImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(heroImagePreview);
      }
      setHeroImagePreview(null);

      setSuccess("Hero section saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save hero: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  function handleLeadershipImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (leadershipImagePreview && leadershipImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(leadershipImagePreview);
    }

    setLeadershipImageFile(file);
    setLeadershipImagePreview(URL.createObjectURL(file));
  }

  function handleLeadershipFormChange(e) {
    const { name, value } = e.target;
    setLeadershipForm((prev) => ({ ...prev, [name]: value }));
  }

  async function addLeadership() {
    setSaving(true);
    setError("");
    setSuccess("");

    if (!leadershipForm.photoUrl && !leadershipImageFile) {
      setError("Photo is required");
      setSaving(false);
      return;
    }

    if (!leadershipForm.fullName.trim()) {
      setError("Full name is required");
      setSaving(false);
      return;
    }

    try {
      let photoUrl = leadershipForm.photoUrl;

      if (leadershipImageFile) {
        const fd = new FormData();
        fd.append("file", leadershipImageFile);
        const uploadResult = await upload("/api/about/hero-upload", fd);
        photoUrl = uploadResult.url;
      }

      const updatedLeadership = { ...aboutpage.leadership };

      if (leadershipForm.position === "principal") {
        updatedLeadership.principal = {
          photoUrl,
          fullName: leadershipForm.fullName,
          remarks: leadershipForm.remarks,
        };
      } else {
        const newDeputy = {
          photoUrl,
          fullName: leadershipForm.fullName,
          department: leadershipForm.department,
          remarks: leadershipForm.remarks,
        };
        updatedLeadership.deputies = updatedLeadership.deputies
          ? [...updatedLeadership.deputies, newDeputy]
          : [newDeputy];
      }

      const updated = await put("/api/about", { leadership: updatedLeadership });

      setAboutpage(updated);
      if (updated.leadership) {
        setPrincipal(updated.leadership.principal);
        setDeputies(updated.leadership.deputies || []);
      }

      setLeadershipForm({
        position: "principal",
        photoUrl: "",
        fullName: "",
        department: "Administration",
        remarks: "",
      });
      setLeadershipImageFile(null);
      if (leadershipImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(leadershipImagePreview);
      }
      setLeadershipImagePreview(null);

      setSuccess("Leadership member added!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to add leadership: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteLeadership(position, index) {
    if (!confirm("Delete this member?")) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedLeadership = { ...aboutpage.leadership };

      if (position === "principal") {
        updatedLeadership.principal = null;
      } else {
        updatedLeadership.deputies = updatedLeadership.deputies.filter(
          (_, i) => i !== index
        );
      }

      const updated = await put("/api/about", { leadership: updatedLeadership });

      setAboutpage(updated);
      if (updated.leadership) {
        setPrincipal(updated.leadership.principal);
        setDeputies(updated.leadership.deputies || []);
      }

      setSuccess("Member deleted!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete member: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>ℹ️ About Page Management</h1>

      {error && (
        <div
          style={{
            background: "#fee",
            color: "#c33",
            padding: "15px",
            borderRadius: "4px",
            marginBottom: "20px",
            border: "1px solid #fcc",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: "#efe",
            color: "#3c3",
            padding: "15px",
            borderRadius: "4px",
            marginBottom: "20px",
            border: "1px solid #cfc",
          }}
        >
          {success}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "2px solid #ddd", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("settings")}
          style={{
            padding: "12px 24px",
            background: activeTab === "settings" ? "#007bff" : "#f0f0f0",
            color: activeTab === "settings" ? "white" : "#333",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "settings" ? "bold" : "normal",
          }}
        >
          📝 Page Settings
        </button>
        <button
          onClick={() => setActiveTab("philosophy")}
          style={{
            padding: "12px 24px",
            background: activeTab === "philosophy" ? "#007bff" : "#f0f0f0",
            color: activeTab === "philosophy" ? "white" : "#333",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "philosophy" ? "bold" : "normal",
          }}
        >
          ✨ Motto/Vision/Mission
        </button>
        <button
          onClick={() => setActiveTab("values")}
          style={{
            padding: "12px 24px",
            background: activeTab === "values" ? "#007bff" : "#f0f0f0",
            color: activeTab === "values" ? "white" : "#333",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "values" ? "bold" : "normal",
          }}
        >
          ⭐ Core Values
        </button>
        <button
          onClick={() => setActiveTab("hero")}
          style={{
            padding: "12px 24px",
            background: activeTab === "hero" ? "#007bff" : "#f0f0f0",
            color: activeTab === "hero" ? "white" : "#333",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "hero" ? "bold" : "normal",
          }}
        >
          🎬 Hero Section
        </button>
        <button
          onClick={() => setActiveTab("leadership")}
          style={{
            padding: "12px 24px",
            background: activeTab === "leadership" ? "#007bff" : "#f0f0f0",
            color: activeTab === "leadership" ? "white" : "#333",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "leadership" ? "bold" : "normal",
          }}
        >
          👥 Leadership
        </button>
      </div>

      {/* TAB 1: PAGE SETTINGS */}
      {activeTab === "settings" && (
        <div style={{ background: "white", padding: "30px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h2>Page Title & Introduction</h2>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Page Title</label>
            <input
              type="text"
              name="title"
              value={pageForm.title}
              onChange={handlePageChange}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Introduction Text</label>
            <textarea
              name="intro"
              value={pageForm.intro}
              onChange={handlePageChange}
              rows="6"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                fontFamily: "Arial, sans-serif",
              }}
            />
          </div>

          <button
            onClick={savePageSettings}
            disabled={saving}
            style={{
              padding: "12px 24px",
              background: saving ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}

      {/* TAB 2: PHILOSOPHY SECTION */}
      {activeTab === "philosophy" && (
        <div style={{ background: "white", padding: "30px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h2>Motto, Vision, Mission & Promise</h2>

          {/* Motto */}
          <div style={{ marginBottom: "30px" }}>
            <h3>Motto</h3>
            <input
              type="text"
              name="heading"
              placeholder="Heading"
              value={mottoForm.heading}
              onChange={handlePhilosophyChange("motto", setMottoForm)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                marginBottom: "10px",
              }}
            />
            <textarea
              name="text"
              placeholder="Text"
              value={mottoForm.text}
              onChange={handlePhilosophyChange("motto", setMottoForm)}
              rows="3"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Vision */}
          <div style={{ marginBottom: "30px" }}>
            <h3>Vision</h3>
            <input
              type="text"
              name="heading"
              placeholder="Heading"
              value={visionForm.heading}
              onChange={handlePhilosophyChange("vision", setVisionForm)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                marginBottom: "10px",
              }}
            />
            <textarea
              name="text"
              placeholder="Text"
              value={visionForm.text}
              onChange={handlePhilosophyChange("vision", setVisionForm)}
              rows="3"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Mission */}
          <div style={{ marginBottom: "30px" }}>
            <h3>Mission</h3>
            <input
              type="text"
              name="heading"
              placeholder="Heading"
              value={missionForm.heading}
              onChange={handlePhilosophyChange("mission", setMissionForm)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                marginBottom: "10px",
              }}
            />
            <textarea
              name="text"
              placeholder="Text"
              value={missionForm.text}
              onChange={handlePhilosophyChange("mission", setMissionForm)}
              rows="3"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Promise */}
          <div style={{ marginBottom: "30px" }}>
            <h3>Promise</h3>
            <input
              type="text"
              name="heading"
              placeholder="Heading"
              value={promiseForm.heading}
              onChange={handlePhilosophyChange("promise", setPromiseForm)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                marginBottom: "10px",
              }}
            />
            <textarea
              name="text"
              placeholder="Text"
              value={promiseForm.text}
              onChange={handlePhilosophyChange("promise", setPromiseForm)}
              rows="3"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>

          <button
            onClick={savePhilosophy}
            disabled={saving}
            style={{
              padding: "12px 24px",
              background: saving ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      )}

      {/* TAB 3: CORE VALUES */}
      {activeTab === "values" && (
        <div style={{ background: "white", padding: "30px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h2>Core Values Management</h2>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Add New Value</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter core value (e.g., Integrity)"
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
                onKeyPress={(e) => e.key === "Enter" && addCoreValue()}
              />
              <button
                onClick={addCoreValue}
                disabled={saving}
                style={{
                  padding: "12px 24px",
                  background: saving ? "#ccc" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}
              >
                Add
              </button>
            </div>
          </div>

          <h3>Current Values</h3>
          <ul style={{ paddingLeft: "20px" }}>
            {coreValues.map((value, idx) => (
              <li key={idx} style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{value.value}</span>
                <button
                  onClick={() => deleteCoreValue(idx)}
                  disabled={saving}
                  style={{
                    padding: "6px 12px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: "12px",
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* TAB 4: HERO SECTION */}
      {activeTab === "hero" && (
        <div style={{ background: "white", padding: "30px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h2>Hero Section</h2>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Upload Image</label>
            <input
              type="file"
              onChange={handleHeroImageChange}
              accept="image/*"
              style={{ marginBottom: "10px" }}
            />
            {heroImagePreview && (
              <div style={{ marginBottom: "10px" }}>
                <img src={heroImagePreview} alt="Preview" style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "4px" }} />
              </div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Hero Title</label>
            <input
              type="text"
              name="title"
              value={heroForm.title}
              onChange={handleHeroFormChange}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Hero Subtitle</label>
            <textarea
              name="subtitle"
              value={heroForm.subtitle}
              onChange={handleHeroFormChange}
              rows="3"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>

          <button
            onClick={saveHero}
            disabled={saving}
            style={{
              padding: "12px 24px",
              background: saving ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {saving ? "Saving..." : "Save Hero Section"}
          </button>
        </div>
      )}

      {/* TAB 5: LEADERSHIP */}
      {activeTab === "leadership" && (
        <div style={{ background: "white", padding: "30px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h2>Leadership Management</h2>

          <div style={{ marginBottom: "20px", padding: "20px", background: "#f9f9f9", borderRadius: "4px" }}>
            <h3>Add Leadership Member</h3>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Position</label>
              <div>
                <label style={{ marginRight: "20px" }}>
                  <input
                    type="radio"
                    name="position"
                    value="principal"
                    checked={leadershipForm.position === "principal"}
                    onChange={handleLeadershipFormChange}
                  />{" "}
                  Principal
                </label>
                <label>
                  <input
                    type="radio"
                    name="position"
                    value="deputy"
                    checked={leadershipForm.position === "deputy"}
                    onChange={handleLeadershipFormChange}
                  />{" "}
                  Deputy Principal
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Upload Photo</label>
              <input
                type="file"
                onChange={handleLeadershipImageChange}
                accept="image/*"
                style={{ marginBottom: "10px" }}
              />
              {leadershipImagePreview && (
                <div>
                  <img src={leadershipImagePreview} alt="Preview" style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "4px" }} />
                </div>
              )}
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={leadershipForm.fullName}
                onChange={handleLeadershipFormChange}
                placeholder="Enter full name"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            </div>

            {leadershipForm.position === "deputy" && (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Department</label>
                <select
                  name="department"
                  value={leadershipForm.department}
                  onChange={handleLeadershipFormChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option>Administration</option>
                  <option>Academic</option>
                  <option>Discipline</option>
                  <option>Finance</option>
                  <option>Other</option>
                </select>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Remarks</label>
              <textarea
                name="remarks"
                value={leadershipForm.remarks}
                onChange={handleLeadershipFormChange}
                placeholder="Enter remarks/bio"
                rows="4"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            </div>

            <button
              onClick={addLeadership}
              disabled={saving}
              style={{
                padding: "12px 24px",
                background: saving ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {saving ? "Saving..." : "Add Member"}
            </button>
          </div>

          {/* Principal */}
          {principal && (
            <div style={{ marginBottom: "30px" }}>
              <h3>Principal</h3>
              <div
                style={{
                  padding: "20px",
                  background: "#fff9e6",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <img src={principal.photoUrl} alt={principal.fullName} style={{ width: "80px", height: "80px", borderRadius: "4px", objectFit: "cover", marginBottom: "10px" }} />
                  <h4>{principal.fullName}</h4>
                  <p>{principal.remarks}</p>
                </div>
                <button
                  onClick={() => deleteLeadership("principal", 0)}
                  disabled={saving}
                  style={{
                    padding: "10px 16px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Deputies */}
          {deputies.length > 0 && (
            <div>
              <h3>Deputy Principals</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                {deputies.map((deputy, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "20px",
                      background: "#e6f3ff",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <img src={deputy.photoUrl} alt={deputy.fullName} style={{ width: "100px", height: "100px", borderRadius: "4px", objectFit: "cover", marginBottom: "10px" }} />
                    <h4>{deputy.fullName}</h4>
                    <p style={{ fontSize: "0.9rem", color: "#666" }}>{deputy.department}</p>
                    <p>{deputy.remarks}</p>
                    <button
                      onClick={() => deleteLeadership("deputy", idx)}
                      disabled={saving}
                      style={{
                        marginTop: "10px",
                        padding: "8px 16px",
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: saving ? "not-allowed" : "pointer",
                        width: "100%",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
