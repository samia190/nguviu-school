import React, { useEffect, useState } from "react";

export default function AboutManagement() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    promiseHeading:"",
    promise:"",
  });

  // ---------- LOAD EXISTING ABOUT CONTENT ----------
  useEffect(() => {
    async function fetchContent() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/content/about");
        if (!res.ok) {
          if (res.status === 404) {
            // Nothing created yet – use sensible defaults
            setContent(null);
            setForm({
              title: "About NGUVIU GIRL'S SCHOOL",
              intro:
                "NGUVIU GIRL'S SCHOOL is a centre of excellence dedicated to nurturing young women into confident, capable leaders.",
              missionHeading: "Our Mission",
              mission:
                "Our mission is to provide a safe, inclusive, and academically rigorous environment where every girl thrives.",
              visionHeading: "Our Vision",
              vision:
                "We envision a future where every NGUVIU GIRL'S SCHOOL student becomes a beacon of change in her community and beyond.",
              mottoHeading:  "Our Motto",
              motto:
                "Empowering Girls, Transforming Lives",
              coreValuesHeading: "Our Core Values",
              coreValues:
                "Integrity, Excellence, Empowerment, Respect, Innovation", 
              promiseHeading: "Our Promise",
          promise:
            "update me", 
            });
            setLoading(false);
            return;
          }
          throw new Error("Failed to load about page content");
        }

        const data = await res.json();
        const safe = data || {};
        setContent(safe);

        setForm({
          title:
            safe.title || "About NGUVIU GIRL'S SCHOOL",
          intro:
            safe.intro ||
            "NGUVIU GIRL'S SCHOOL is a centre of excellence dedicated to nurturing young women into confident, capable leaders.",
          missionHeading: safe.missionHeading || "Our Mission",
          mission:
            safe.mission ||
            "Our mission is to provide a safe, inclusive, and academically rigorous environment where every girl thrives.",
          visionHeading: safe.visionHeading || "Our Vision",
          vision:
            safe.vision ||
            "We envision a future where every NGUVIU GIRL'S SCHOOL student becomes a beacon of change in her community and beyond.",
          coreValuesHeading: safe.coreValuesHeading || "Our Core Values",
          coreValues:
            safe.coreValues ||
            "Integrity, Excellence, Empowerment, Respect, Innovation",
          mottoHeading: safe.mottoHeading || "Our Motto",
          motto:
            safe.motto ||
            "Empowering Girls, Transforming Lives",
          promiseHeading: safe.promiseHeading || "Our Promise",
          promise:
            safe.promise ||
            "Empowering Girls, Transforming Lives",
           





        });

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading about page content");
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
      // If document already exists, update it via PUT /api/content/:id
      if (content?._id) {
        const res = await fetch(`/api/content/${content._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            intro: form.intro,
            missionHeading: form.missionHeading,
            mission: form.mission,
            visionHeading: form.visionHeading,
            vision: form.vision,
            motto: form.motto,
            coreValues: form.coreValues,
            promise: form.promise,
          }),
        });

        if (!res.ok) throw new Error("Failed to save about page content");
        const updated = await res.json();
        setContent(updated);
        setSuccess("About page content saved.");
      } else {
        // First-time create via /api/admin/content
        const fd = new FormData();
        fd.append("type", "about");
        fd.append("title", form.title);
        fd.append("intro", form.intro);
        fd.append("missionHeading", form.missionHeading);
        fd.append("mission", form.mission);
        fd.append("visionHeading", form.visionHeading);
        fd.append("vision", form.vision);
        fd.append("mottoHeading", form.mottoHeading);
        fd.append("motto", form.motto);
        fd.append("coreValuesHeading", form.coreValuesHeading);
        fd.append("coreValues", form.coreValues);
        fd.append("promise", form.promiseHeading);
        fd.append("promise", form.promise);

        const res = await fetch("/api/admin/content", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error("Failed to create about page content");

        const data = await res.json();
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
        <p>Loading…</p>
      </section>
    );
  }
const values = (content?.coreValues || "")
  .split("\n")
  .filter(Boolean);

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
