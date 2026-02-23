import React, { useEffect, useState } from "react";
import { get, put, post } from "../utils/api";
import Loader from "./Loader";

export default function AboutManagement() {
  const [content, setContent] = useState(null);
  const [form, setForm] = useState({
    title: "",
    intro: "",
    missionHeading: "",
    mission: "",
    visionHeading: "",
    vision: "",
    mottoHeading: "",
    motto: "",
    coreValuesHeading: "",
    coreValues: "",
    promiseHeading: "",
    promise: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchContent() {
      setLoading(true);
      setError("");
      try {
        const data = await get("/api/content/about");

        if (!data) {
          setContent(null);
          setForm({
            title: "About kangaru girls GIRL'S SCHOOL",
            intro:
              "kangaru girls GIRL'S SCHOOL is a centre of excellence dedicated to nurturing young women into confident, capable leaders.",
            missionHeading: "Our Mission",
            mission:
              "Our mission is to provide a safe, inclusive, and academically rigorous environment where every girl thrives.",
            visionHeading: "Our Vision",
            vision:
              "We envision a future where every kangaru girls GIRL'S SCHOOL student becomes a beacon of change in her community and beyond.",
            mottoHeading: "Our Motto",
            motto: "Empowering Girls, Transforming Lives",
            coreValuesHeading: "Our Core Values",
            coreValues: "Integrity, Excellence, Empowerment, Respect, Innovation",
            promiseHeading: "Our Promise",
            promise: "",
          });
          return;
        }

        const safe = data || {};
        setContent(safe);
        setForm({
          title: safe.title || "About kangaru girls GIRL'S SCHOOL",
          intro:
            safe.intro ||
            "kangaru girls GIRL'S SCHOOL is a centre of excellence dedicated to nurturing young women into confident, capable leaders.",
          missionHeading: safe.missionHeading || "Our Mission",
          mission:
            safe.mission ||
            "Our mission is to provide a safe, inclusive, and academically rigorous environment where every girl thrives.",
          visionHeading: safe.visionHeading || "Our Vision",
          vision:
            safe.vision ||
            "We envision a future where every kangaru girls GIRL'S SCHOOL student becomes a beacon of change in her community and beyond.",
          coreValuesHeading: safe.coreValuesHeading || "Our Core Values",
          coreValues:
            safe.coreValues || "Integrity, Excellence, Empowerment, Respect, Innovation",
          mottoHeading: safe.mottoHeading || "Our Motto",
          motto: safe.motto || "Empowering Girls, Transforming Lives",
          promiseHeading: safe.promiseHeading || "Our Promise",
          promise: safe.promise || "",
        });
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading about page content");
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, []);

  // ---------- FORM HANDLERS ----------
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (!form.title || form.title.trim().length === 0) {
        setError("Title is required");
        setSaving(false);
        return;
      }
      if (form.title.length > 255) {
        setError("Title must be 255 characters or less");
        setSaving(false);
        return;
      }
      if (form.intro.length > 5000) {
        setError("Intro text must be 5000 characters or less");
        setSaving(false);
        return;
      }
      if (form.missionHeading.length > 255) {
        setError("Mission heading must be 255 characters or less");
        setSaving(false);
        return;
      }
      if (form.mission.length > 5000) {
        setError("Mission text must be 5000 characters or less");
        setSaving(false);
        return;
      }
      if (form.visionHeading.length > 255) {
        setError("Vision heading must be 255 characters or less");
        setSaving(false);
        return;
      }
      if (form.vision.length > 5000) {
        setError("Vision text must be 5000 characters or less");
        setSaving(false);
        return;
      }
      if (form.mottoHeading.length > 255) {
        setError("Motto heading must be 255 characters or less");
        setSaving(false);
        return;
      }
      if (form.motto.length > 5000) {
        setError("Motto text must be 5000 characters or less");
        setSaving(false);
        return;
      }
      if (form.coreValuesHeading.length > 255) {
        setError("Core values heading must be 255 characters or less");
        setSaving(false);
        return;
      }
      if (form.coreValues.length > 5000) {
        setError("Core values text must be 5000 characters or less");
        setSaving(false);
        return;
      }
      if (form.promiseHeading.length > 255) {
        setError("Promise heading must be 255 characters or less");
        setSaving(false);
        return;
      }
      if (form.promise.length > 5000) {
        setError("Promise text must be 5000 characters or less");
        setSaving(false);
        return;
      }

      // If document already exists, update it via PUT /api/content/:id
      if (content?._id) {
        const updated = await put(`/api/content/${content._id}`, {
          title: form.title,
          intro: form.intro,
          missionHeading: form.missionHeading,
          mission: form.mission,
          visionHeading: form.visionHeading,
          vision: form.vision,
          mottoHeading: form.mottoHeading,
          motto: form.motto,
          coreValuesHeading: form.coreValuesHeading,
          coreValues: form.coreValues,
          promiseHeading: form.promiseHeading,
          promise: form.promise,
        });
        setContent(updated);
        setSuccess("About page content saved.");
      } else {
        // First-time create via /api/content with JSON
        const data = await post("/api/content", {
          type: "about",
          title: form.title,
          intro: form.intro,
          missionHeading: form.missionHeading,
          mission: form.mission,
          visionHeading: form.visionHeading,
          vision: form.vision,
          mottoHeading: form.mottoHeading,
          motto: form.motto,
          coreValuesHeading: form.coreValuesHeading,
          coreValues: form.coreValues,
          promiseHeading: form.promiseHeading,
          promise: form.promise,
        });
        const created = data.content || data;
        setContent(created);
        setSuccess("About page content saved.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Error saving about page content");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section>
        <h2>About Page Management</h2>
        <Loader message="Loading about page content…" />
      </section>
    );
  }

  const values = (content?.coreValues || "").split("\n").filter(Boolean);

  return (
    <section>
      <h2>About Page Management</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "bold" }}>Page title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "bold" }}>Intro text</label>
          <textarea
            name="intro"
            value={form.intro}
            onChange={handleChange}
            rows={4}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "bold" }}>Mission heading</label>
          <input
            type="text"
            name="missionHeading"
            value={form.missionHeading}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "bold" }}>Mission text</label>
          <textarea
            name="mission"
            value={form.mission}
            onChange={handleChange}
            rows={4}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "bold" }}>Vision heading</label>
          <input
            type="text"
            name="visionHeading"
            value={form.visionHeading}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "bold" }}>Vision text</label>
          <textarea
            name="vision"
            value={form.vision}
            onChange={handleChange}
            rows={4}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "bold", color: "red", fontStyle: "italic" }}>Motto text</label>
          <textarea
            name="motto"
            value={form.motto}
            onChange={handleChange}
            rows={4}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "bold" }}>Motto heading</label>
          <input
            type="text"
            name="mottoHeading"
            value={form.mottoHeading}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 50 }}>
          <label style={{ display: "block", fontWeight: "bold" }}>Core values text</label>
          <textarea name="coreValues" value={form.coreValues} onChange={handleChange} rows={15} style={{ width: "100%", padding: 8 }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "bold" }}>Core values heading</label>
          <input
            type="text"
            name="coreValuesHeading"
            value={form.coreValuesHeading}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
         <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "bold" }}>Promise heading</label>
          <input
            type="text"
            name="promiseHeading"
            value={form.promiseHeading}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "bold" }}>Promise text</label>
          <textarea
            name="promise"
            value={form.promise}
            onChange={handleChange}
            rows={4}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{ marginTop: 10, padding: "10px 20px" }}
        >
          {saving ? "Saving…" : "Save About Page"}
        </button>
      </form>
    </section>
  );
}
