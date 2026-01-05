import React, { useEffect, useState } from "react";

function buildWhatsappHref(number, customLink) {
  if (customLink && customLink.trim()) return customLink.trim();
  if (!number) return "";

  // Remove all non-digits
  const digits = number.replace(/\D/g, "");
  if (!digits) return "";

  let msisdn = digits;

  // Very simple Kenya-focused logic:
  // 0712345678 -> 254712345678
  if (digits.startsWith("0")) {
    msisdn = "254" + digits.slice(1);
  } else if (digits.startsWith("7") && digits.length === 9) {
    msisdn = "254" + digits;
  }

  return `https://wa.me/${msisdn}`;
}

export default function Contact({ user }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");

  // ---------- LOAD CONTACT CONTENT ----------
  useEffect(() => {
    async function fetchContent() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/content/contact");
        if (!res.ok) {
          if (res.status === 404) {
            setContent(null);
            setLoading(false);
            return;
          }
          throw new Error("Failed to load contact page content.");
        }
        const data = await res.json();
        setContent(data || {});
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading contact page.");
        setLoading(false);
      }
    }

    fetchContent();
  }, []);

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setSendError("");
    setSendSuccess("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      if (!res.ok) {
        throw new Error("Failed to send message. Please try again later.");
      }

      setSendSuccess("Your message has been sent. Thank you!");
      setFormState({ name: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      setSendError(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <section style={{ padding: 20 }}>
        <h1>Contact Us</h1>
        <p>Loading…</p>
      </section>
    );
  }

  const title = content?.title || "Contact Us";
  // Ensure intro is a plain string to avoid nested <p> elements in the DOM.
  const intro =
    (typeof content?.intro === "string" && content.intro.trim())
      ? content.intro
      : "Get in touch with NGUVIU GIRL'S SCHOOL using the details and contact form below.";

  const address = content?.address || "";
  const phone = content?.phone || "";
  const email = content?.email || "";
  const whatsappNumber = content?.whatsappNumber || "";
  const whatsappLink = content?.whatsappLink || "";
  const mapEmbed = content?.mapEmbed || "";

  const waHref = buildWhatsappHref(whatsappNumber, whatsappLink);

  return (
    <section style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ marginBottom: "1rem" }}>
        <h1>{title}</h1>
        <p style={{ fontSize: "0.95rem" }}>{intro}</p>
      </header>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
          alignItems: "flex-start",
        }}
      >
        {/* LEFT: Contact details */}
        <div style={{ flex: "1 1 280px", minWidth: 260 }}>
          <h2>Contact Details</h2>

          {address && (
            <p>
              <strong>Address:</strong>
              <br />
              <span style={{ whiteSpace: "pre-wrap" }}>{address}</span>
            </p>
          )}

          {phone && (
            <p>
              <strong>Phone:</strong>{" "}
              <a href={`tel:${phone}`} style={{ textDecoration: "underline" }}>
                {phone}
              </a>
            </p>
          )}

          {email && (
            <p>
              <strong>Email:</strong>{" "}
              <a
                href={`mailto:${email}`}
                style={{ textDecoration: "underline" }}
              >
                {email}
              </a>
            </p>
          )}

          {waHref && (
            <p>
              <strong>WhatsApp:</strong>{" "}
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: "#22c55e",
                  color: "white",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                }}
              >
                Chat on WhatsApp
              </a>
              {whatsappNumber && (
                <span style={{ marginLeft: 6, fontSize: "0.85rem" }}>
                  ({whatsappNumber})
                </span>
              )}
            </p>
          )}

          {!waHref && whatsappNumber && (
            <p>
              <strong>WhatsApp:</strong> {whatsappNumber}
            </p>
          )}
        </div>

        {/* RIGHT: Contact form */}
        <div
          style={{
            flex: "1 1 320px",
            minWidth: 280,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "1rem",
          }}
        >
          <h2>Send us a message</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", fontWeight: "bold" }}>
                Your Name
              </label>
              <input
                type="text"
                name="name"
                value={formState.name}
                onChange={handleFormChange}
                required
                style={{ width: "100%", padding: 8 }}
              />
            </div>

            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", fontWeight: "bold" }}>
                Your Email
              </label>
              <input
                type="email"
                name="email"
                value={formState.email}
                onChange={handleFormChange}
                required
                style={{ width: "100%", padding: 8 }}
              />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontWeight: "bold" }}>
                Your Message
              </label>
              <textarea
                name="message"
                value={formState.message}
                onChange={handleFormChange}
                rows={5}
                required
                style={{ width: "100%", padding: 8 }}
              />
            </div>

            {sendError && <p style={{ color: "red" }}>{sendError}</p>}
            {sendSuccess && <p style={{ color: "green" }}>{sendSuccess}</p>}

            <button type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send Message"}
            </button>
          </form>
        </div>
      </div>

      {/* MAP */}
      {mapEmbed && (
        <section style={{ marginTop: "2rem" }}>
          <h2>Find Us</h2>
          <div
            style={{
              width: "100%",
              minHeight: 300,
              borderRadius: 8,
              overflow: "hidden",
            }}
            dangerouslySetInnerHTML={{ __html: mapEmbed }}
          />
        </section>
      )}
    </section>
  );
}
