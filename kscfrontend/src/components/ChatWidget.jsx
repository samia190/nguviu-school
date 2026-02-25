// src/components/ChatWidget.jsx — Floating school chatbot widget
import { useState, useEffect, useRef, useCallback } from "react";
import { get, post } from "../utils/api";

/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */
const CHAT_KEY = "ksc_chat_open";

/* ═══════════════════════════════════════════════════════════════
   WhatsApp href builder (reused from Contact.jsx logic)
   ═══════════════════════════════════════════════════════════════ */
function waHref(number, prefill = "") {
  if (!number) return "";
  const digits = number.replace(/\D/g, "");
  if (!digits) return "";
  let msisdn = digits;
  if (digits.startsWith("0")) msisdn = "254" + digits.slice(1);
  else if (digits.startsWith("7") && digits.length === 9) msisdn = "254" + digits;
  const url = `https://wa.me/${msisdn}`;
  return prefill ? `${url}?text=${encodeURIComponent(prefill)}` : url;
}

/* ═══════════════════════════════════════════════════════════════
   ChatWidget
   ═══════════════════════════════════════════════════════════════ */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(null);
  const [messages, setMessages] = useState([]);          // { role: "bot"|"user", text, buttons?, type? }
  const [input, setInput] = useState("");
  const [context, setContext] = useState({ categoryId: null, path: [] }); // navigation
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", contact: "", message: "" });
  const [contactSending, setContactSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // ─── Load config
  useEffect(() => {
    get("/api/chat")
      .then((data) => { if (data) setConfig(data); })
      .catch(() => {});
  }, []);

  // ─── Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, showContactForm]);

  // ─── Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // ─── Show greeting when first opened
  useEffect(() => {
    if (open && config && messages.length === 0) {
      showGreeting();
    }
  }, [open, config]);

  /* ──── Helpers ──────────────────────────────────────────────── */

  function addBot(text, buttons, extra) {
    setMessages((prev) => [...prev, { role: "bot", text, buttons, ...extra }]);
  }

  function addUser(text) {
    setMessages((prev) => [...prev, { role: "user", text }]);
  }

  async function simulateTyping(fn) {
    setTyping(true);
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
    setTyping(false);
    fn();
  }

  /* ──── Greeting ─────────────────────────────────────────────── */

  function showGreeting() {
    const cats = config.categories || [];
    const buttons = cats.map((c) => ({
      label: `${c.icon} ${c.label}`,
      action: () => handleCategoryClick(c),
    }));
    buttons.push({ label: "💬 Talk to Admin", action: () => startContactForm(), style: "secondary" });

    addBot(config.greeting || "Hi! How can I help you?", buttons);
  }

  function showMainMenu() {
    setContext({ categoryId: null, path: [] });
    setShowContactForm(false);
    const cats = config.categories || [];
    const buttons = cats.map((c) => ({
      label: `${c.icon} ${c.label}`,
      action: () => handleCategoryClick(c),
    }));
    buttons.push({ label: "💬 Talk to Admin", action: () => startContactForm(), style: "secondary" });
    addBot("What else can I help you with?", buttons);
  }

  /* ──── Category click ───────────────────────────────────────── */

  async function handleCategoryClick(cat) {
    addUser(cat.label);
    setContext({ categoryId: cat.id, path: [cat.label] });

    // If category has children, show them
    if (cat.children && cat.children.length > 0) {
      await simulateTyping(() => {
        const childButtons = cat.children.map((ch) => ({
          label: `${ch.icon || "▸"} ${ch.label}`,
          action: () => handleChildClick(cat, ch),
        }));
        childButtons.push({ label: "← Back to Menu", action: () => { addUser("Back"); showMainMenu(); }, style: "ghost" });

        // If category itself has a reply or data, fetch it
        if (cat.dataSource && cat.dataField) {
          fetchAnswer(cat.id, null, cat.label, childButtons);
        } else if (cat.reply) {
          addBot(cat.reply, childButtons);
        } else {
          addBot(`What would you like to know about ${cat.label}?`, childButtons);
        }
      });
    } else {
      // Leaf category — fetch answer directly
      await simulateTyping(() => {
        fetchAnswer(cat.id, null, cat.label);
      });
    }
  }

  /* ──── Child node click ─────────────────────────────────────── */

  async function handleChildClick(cat, child) {
    addUser(child.label);
    setContext((prev) => ({ ...prev, path: [...prev.path, child.label] }));

    await simulateTyping(() => {
      if (child.dataSource && child.dataField) {
        fetchAnswer(cat.id, child.id, child.label);
      } else if (child.reply) {
        const afterBtns = buildAfterButtons(child.actions, cat);
        addBot(child.reply, afterBtns);
      } else if (child.actions && child.actions.length > 0) {
        const actionBtns = buildActionButtons(child.actions);
        actionBtns.push({ label: "← Back", action: () => { addUser("Back"); handleCategoryClick(cat); }, style: "ghost" });
        addBot(child.label, actionBtns);
      } else {
        const afterBtns = buildAfterButtons([], cat);
        addBot(`For more details about ${child.label}, please contact the school office.`, afterBtns);
      }
    });
  }

  /* ──── Fetch dynamic answer ─────────────────────────────────── */

  async function fetchAnswer(categoryId, childId, label, existingButtons) {
    try {
      const url = childId
        ? `/api/chat/answer/${categoryId}?childId=${childId}`
        : `/api/chat/answer/${categoryId}`;
      const data = await get(url);

      const cat = config.categories.find((c) => c.id === categoryId);
      const allActions = [...(data.actions || []), ...(cat?.actions || [])];
      const afterBtns = existingButtons || buildAfterButtons(allActions, cat);

      addBot(data.answer || `Here's what we have about ${label}:`, afterBtns);
    } catch {
      const afterBtns = buildAfterButtons([], config.categories.find((c) => c.id === categoryId));
      addBot(`Sorry, I couldn't load that information right now. Please try again or contact the school.`, afterBtns);
    }
  }

  /* ──── Build action buttons ─────────────────────────────────── */

  function buildActionButtons(actions) {
    if (!actions || actions.length === 0) return [];
    return actions.map((a) => {
      if (a.type === "link") {
        return {
          label: a.label || "Visit Page",
          action: () => {
            if (a.url) window.open(a.url, "_blank");
            else if (a.route && typeof window.setRoute === "function") window.setRoute(a.route);
          },
          style: "primary",
        };
      }
      if (a.type === "whatsapp") {
        const href = waHref(config.whatsappNumber, a.prefillMessage || "");
        return {
          label: a.label || "📱 WhatsApp",
          action: () => { if (href) window.open(href, "_blank"); },
          style: "whatsapp",
        };
      }
      if (a.type === "contact-admin") {
        return {
          label: a.label || "💬 Talk to Admin",
          action: () => startContactForm(),
          style: "secondary",
        };
      }
      return null;
    }).filter(Boolean);
  }

  function buildAfterButtons(actions, cat) {
    const btns = buildActionButtons(actions || []);

    // Was this helpful?
    btns.push({ label: "👍 Helpful", action: () => {
      addUser("That was helpful, thanks!");
      simulateTyping(() => addBot(config.thankYouReply || "You're welcome! Is there anything else?", [
        { label: "🏠 Main Menu", action: () => { addUser("Main Menu"); showMainMenu(); }, style: "ghost" },
      ]));
    }, style: "ghost" });

    btns.push({ label: "💬 Talk to Admin", action: () => startContactForm(), style: "secondary" });
    btns.push({ label: "← Back to Menu", action: () => { addUser("Back"); showMainMenu(); }, style: "ghost" });

    return btns;
  }

  /* ──── Free‑text keyword matching ───────────────────────────── */

  function matchInput(text) {
    if (!config || !config.categories) return null;

    const words = text.toLowerCase().split(/\s+/).filter(Boolean);

    let bestScore = 0;
    let bestNode = null;
    let bestParent = null;

    for (const cat of config.categories) {
      // Score against category keywords
      const catScore = scoreKeywords(words, cat.keywords || []);
      if (catScore > bestScore) {
        bestScore = catScore;
        bestNode = cat;
        bestParent = null;
      }

      // Also check children
      if (cat.children) {
        for (const child of cat.children) {
          const childScore = scoreKeywords(words, child.keywords || []);
          if (childScore > bestScore) {
            bestScore = childScore;
            bestNode = child;
            bestParent = cat;
          }
        }
      }
    }

    // Require at least 1 keyword match
    if (bestScore >= 1) {
      return { node: bestNode, parent: bestParent };
    }
    return null;
  }

  function scoreKeywords(words, keywords) {
    if (!keywords || keywords.length === 0) return 0;
    let score = 0;
    const inputJoined = words.join(" ");

    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      // Multi-word keyword match (e.g., "form one")
      if (kwLower.includes(" ")) {
        if (inputJoined.includes(kwLower)) score += 2;
      } else {
        if (words.includes(kwLower)) score += 1;
      }
    }
    return score;
  }

  /* ──── Handle user typing ───────────────────────────────────── */

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    addUser(text);

    // Check for greetings
    const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "howdy", "hola"];
    if (greetings.some((g) => text.toLowerCase().startsWith(g))) {
      await simulateTyping(() => showGreeting());
      return;
    }

    // Check for thanks
    const thanks = ["thank", "thanks", "asante", "cheers"];
    if (thanks.some((t) => text.toLowerCase().includes(t))) {
      await simulateTyping(() => {
        addBot(config.thankYouReply || "You're welcome!", [
          { label: "🏠 Main Menu", action: () => { addUser("Main Menu"); showMainMenu(); }, style: "ghost" },
        ]);
      });
      return;
    }

    // Keyword matching
    const match = matchInput(text);
    if (match) {
      if (match.parent) {
        // Matched a child node
        await simulateTyping(() => handleChildClick(match.parent, match.node));
      } else {
        // Matched a top-level category
        await simulateTyping(() => handleCategoryClick(match.node));
      }
    } else {
      // No match
      await simulateTyping(() => {
        const cats = config.categories || [];
        const buttons = cats.map((c) => ({
          label: `${c.icon} ${c.label}`,
          action: () => handleCategoryClick(c),
        }));
        buttons.push({ label: "💬 Talk to Admin", action: () => startContactForm(), style: "secondary" });
        addBot(config.noMatchReply || "I didn't quite understand that. Please pick a topic:", buttons);
      });
    }
  }

  /* ──── Contact form (Talk to Admin) ─────────────────────────── */

  function startContactForm() {
    addUser("I'd like to talk to an admin");
    setShowContactForm(true);
    simulateTyping(() => {
      if (!config.isOfficeOpen) {
        addBot(config.closedMessage || "Our office is currently closed. Please leave your details:");
      } else {
        addBot("Sure! Please fill in the form below and we'll get back to you as soon as possible.");
      }
    });
  }

  async function handleContactSubmit(e) {
    e.preventDefault();
    if (!contactForm.name || !contactForm.contact || !contactForm.message) return;

    setContactSending(true);
    try {
      const res = await post("/api/chat/message", {
        ...contactForm,
        topic: context.categoryId || "general",
        page: window.__route || "",
      });

      setContactSending(false);
      setShowContactForm(false);
      setContactForm({ name: "", contact: "", message: "" });

      addBot(
        `✅ Message received! Your reference number is **${res.refNumber || "N/A"}**.\nWe'll get back to you as soon as possible.`,
        [{ label: "🏠 Main Menu", action: () => { addUser("Main Menu"); showMainMenu(); }, style: "ghost" }]
      );
    } catch {
      setContactSending(false);
      addBot("Sorry, there was an error sending your message. Please try again or call us directly.");
    }
  }

  /* ──── Render ───────────────────────────────────────────────── */

  if (!config || !config.enabled) return null;

  // Mobile check
  const isMobile = typeof window !== "undefined" && window.innerWidth < 600;
  if (isMobile && !config.showOnMobile) return null;

  const isRight = config.position !== "bottom-left";
  const color = config.primaryColor || "#1e40af";

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          style={{
            position: "fixed",
            bottom: 24,
            [isRight ? "right" : "left"]: 24,
            zIndex: 10000,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            fontSize: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          💬
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: isMobile ? 0 : 24,
          [isRight ? "right" : "left"]: isMobile ? 0 : 24,
          zIndex: 10001,
          width: isMobile ? "100vw" : 380,
          height: isMobile ? "100vh" : 520,
          maxHeight: isMobile ? "100vh" : "calc(100vh - 48px)",
          borderRadius: isMobile ? 0 : 16,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}>

          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            color: "#fff",
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>🏫 {config.botName || "School Assistant"}</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                {config.isOfficeOpen ? "🟢 Online" : "🔴 Office Closed"}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "#fff",
                width: 32,
                height: 32,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages area */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 14px",
            background: "#f0f2f5",
          }}>
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} color={color} config={config} />
            ))}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display: "flex", gap: 4, padding: "8px 14px", marginBottom: 8 }}>
                <span style={{ ...dot, animationDelay: "0ms" }} />
                <span style={{ ...dot, animationDelay: "150ms" }} />
                <span style={{ ...dot, animationDelay: "300ms" }} />
              </div>
            )}

            {/* Contact form */}
            {showContactForm && !typing && (
              <div style={{
                background: "#fff",
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}>
                <form onSubmit={handleContactSubmit}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={formLabel}>Your Name *</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                      required
                      maxLength={200}
                      placeholder="Enter your name"
                      style={formInput}
                    />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={formLabel}>Phone or Email *</label>
                    <input
                      type="text"
                      value={contactForm.contact}
                      onChange={(e) => setContactForm((p) => ({ ...p, contact: e.target.value }))}
                      required
                      maxLength={200}
                      placeholder="How can we reach you?"
                      style={formInput}
                    />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={formLabel}>Your Question *</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                      required
                      maxLength={2000}
                      rows={3}
                      placeholder="Type your question or message..."
                      style={{ ...formInput, resize: "vertical" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="submit"
                      disabled={contactSending}
                      style={{
                        flex: 1,
                        padding: "10px",
                        background: color,
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        cursor: contactSending ? "wait" : "pointer",
                        fontWeight: 600,
                        fontSize: 14,
                        opacity: contactSending ? 0.7 : 1,
                      }}
                    >
                      {contactSending ? "Sending..." : "📨 Send Message"}
                    </button>
                    {config.whatsappNumber && (
                      <a
                        href={waHref(config.whatsappNumber, contactForm.message || "Hi, I need help")}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "10px 14px",
                          background: "#25d366",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          textDecoration: "none",
                          fontWeight: 600,
                          fontSize: 14,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        📱 WhatsApp
                      </a>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <form
            onSubmit={handleSend}
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 12px",
              borderTop: "1px solid #e5e7eb",
              background: "#fff",
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: "10px 14px",
                border: "1px solid #d1d5db",
                borderRadius: 20,
                fontSize: 14,
                outline: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = color; }}
              onBlur={(e) => { e.target.style.borderColor = "#d1d5db"; }}
            />
            <button
              type="submit"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: color,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Keyframe for typing dots */}
      <style>{`
        @keyframes chatDotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MessageBubble sub-component
   ═══════════════════════════════════════════════════════════════ */
function MessageBubble({ msg, color, config }) {
  const isBot = msg.role === "bot";

  // Parse bold markers **text**
  function renderText(text) {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={i}>{p.slice(2, -2)}</strong>;
      }
      // Handle newlines
      return p.split("\n").map((line, j, arr) => (
        <span key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</span>
      ));
    });
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: isBot ? "flex-start" : "flex-end",
      marginBottom: 8,
    }}>
      <div style={{ maxWidth: "85%" }}>
        {/* Bubble */}
        <div style={{
          padding: "10px 14px",
          borderRadius: isBot ? "14px 14px 14px 4px" : "14px 14px 4px 14px",
          background: isBot ? "#fff" : color,
          color: isBot ? "#1f2937" : "#fff",
          fontSize: 14,
          lineHeight: 1.5,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          whiteSpace: "pre-line",
          wordBreak: "break-word",
        }}>
          {renderText(msg.text)}
        </div>

        {/* Buttons */}
        {msg.buttons && msg.buttons.length > 0 && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 6,
          }}>
            {msg.buttons.map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.action}
                style={{
                  padding: "7px 12px",
                  borderRadius: 18,
                  border: btn.style === "ghost" ? `1px solid #d1d5db` : "none",
                  background: btn.style === "whatsapp" ? "#25d366"
                    : btn.style === "secondary" ? "#f3f4f6"
                    : btn.style === "ghost" ? "transparent"
                    : `${color}18`,
                  color: btn.style === "whatsapp" ? "#fff"
                    : btn.style === "secondary" ? "#374151"
                    : btn.style === "ghost" ? "#6b7280"
                    : color,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Typing dot style ─────────────────────────────────────────── */
const dot = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "#9ca3af",
  animation: "chatDotBounce 1.2s infinite",
  display: "inline-block",
};

/* ─── Contact form styles ──────────────────────────────────────── */
const formLabel = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 4,
};

const formInput = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};
