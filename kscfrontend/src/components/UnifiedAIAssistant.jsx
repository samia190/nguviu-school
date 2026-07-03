/**
 * UnifiedAIAssistant.jsx
 * 
 * A comprehensive AI Assistant that combines:
 * 1. FloatingAIChat - floating bubble Q&A interface
 * 2. ChatWidget - structured category-based navigation
 * 3. Role-based intelligence for authenticated users
 * 4. Full conversation management for logged-in users
 */

import React, { useState, useEffect, useRef } from "react";
import { Send, X, MessageCircle, LogIn, Plus } from "lucide-react";
import { post } from "../utils/api";

export default function UnifiedAIAssistant({ user, setRoute }) {
  // UI States
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("chat"); // "chat" or "categories"
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize on mount
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const isAuthenticated = !!(user || token);
    setIsGuest(!isAuthenticated);

    if (!messages.length && !isOpen) {
      // Pre-load greeting when component mounts but don't show until opened
      setMessages([
        {
          role: "assistant",
          content: `👋 Hello! I'm Kangaru's AI Assistant. ${
            isAuthenticated
              ? `Welcome back! As a ${user?.role || "user"}, I can provide personalized help with your academic journey.`
              : "I can help you with information about admissions, programs, fees, events, and more. Log in for personalized assistance!"
          }`,
          isInitial: true,
        },
      ]);
    }
  }, [user]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Main categories for the structured interface
  const categories = [
    {
      id: "admissions",
      label: "📝 Admissions",
      icon: "📝",
      questions: [
        "Requirements for Form 1",
        "Admission process",
        "Important dates",
      ],
    },
    {
      id: "academics",
      label: "🎓 Academics",
      icon: "🎓",
      questions: [
        "Curriculum details",
        "Subject selection",
        "Academic support",
      ],
    },
    {
      id: "fees",
      label: "💰 Fees",
      icon: "💰",
      questions: [
        "Fee structure",
        "Payment options",
        "Financial aid",
      ],
    },
    {
      id: "facilities",
      label: "🏢 Facilities",
      icon: "🏢",
      questions: [
        "Campus tour",
        "Boarding facilities",
        "Sports facilities",
      ],
    },
    {
      id: "activities",
      label: "🎭 Activities",
      icon: "🎭",
      questions: [
        "Clubs and societies",
        "Sports teams",
        "Events",
      ],
    },
    {
      id: "contact",
      label: "📞 Contact",
      icon: "📞",
      questions: [
        "Call school",
        "Send message",
        "Location",
      ],
    },
  ];

  // Send message
  const sendMessage = async (e) => {
    e?.preventDefault?.();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const endpoint = isGuest ? "/api/ai/chat/guest" : "/api/ai/chat";
      const data = await post(endpoint, { message: input });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          requiresLogin: data.requiresLogin,
          truncated: data.truncated,
          details: data.details,
        },
      ]);
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    addBotMessage(
      `How can I help with ${category.label.toLowerCase()}?`,
      category.questions
    );
  };

  // Add bot message (for category suggestions)
  const addBotMessage = (text, suggestions) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: text,
        suggestions,
      },
    ]);
  };

  // Handle suggestion click
  const handleSuggestion = (suggestion) => {
    setInput(suggestion);
    setTimeout(() => sendMessage(), 100);
  };

  // Handle open/close with greeting
  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `👋 Hello! I'm Kangaru's AI Assistant. ${
            isGuest
              ? "Ask me about admissions, academics, fees, facilities, activities, and more!"
              : `Welcome back! I'm here to help with your academic journey as a ${user?.role || "user"}.`
          }`,
          isInitial: true,
        },
      ]);
    }
  };

  // Handle close
  const handleClose = () => {
    setIsOpen(false);
    setSelectedCategory(null);
  };

  // Open AI Assistant full page
  const openFullAssistant = () => {
    setRoute("ai");
  };

  // ============ RENDER ============

  return (
    <>
      {/* Floating Button - Only show when closed */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
            zIndex: 999,
            fontSize: "24px",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.1)";
            e.target.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
          }}
          title="Ask AI Assistant"
        >
          <MessageCircle size={32} />
        </button>
      )}

      {/* Chat Widget - Only show when open */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "420px",
            maxWidth: "90vw",
            height: "650px",
            maxHeight: "85vh",
            background: "white",
            borderRadius: "14px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1001,
            overflow: "hidden",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: "14px 14px 0 0",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
                🤖 AI Assistant
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.9 }}>
                {isGuest ? "Guest Mode" : `${user?.role?.toUpperCase() || "Signed In"}`}
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {!isGuest && (
                <button
                  onClick={openFullAssistant}
                  title="Open full assistant"
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    padding: "6px 10px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.background = "rgba(255, 255, 255, 0.3)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.background = "rgba(255, 255, 255, 0.2)")
                  }
                >
                  ⬆️
                </button>
              )}

              <button
                onClick={handleClose}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.background = "rgba(255, 255, 255, 0.3)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.background = "rgba(255, 255, 255, 0.2)")
                }
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          {selectedCategory ? (
            // Category mode: show chat
            <>
              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  background: "#f9f9f9",
                }}
              >
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent:
                        msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background:
                          msg.role === "user"
                            ? "#667eea"
                            : msg.isError
                            ? "#fee"
                            : "#fff",
                        color:
                          msg.role === "user"
                            ? "white"
                            : msg.isError
                            ? "#c00"
                            : "#000",
                        fontSize: "14px",
                        lineHeight: "1.4",
                        border:
                          msg.isError
                            ? "1px solid #f99"
                            : msg.requiresLogin
                            ? "1px solid #ffc107"
                            : "none",
                      }}
                    >
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </div>
                      {msg.suggestions && (
                        <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {msg.suggestions.map((sugg, i) => (
                            <button
                              key={i}
                              onClick={() => handleSuggestion(sugg)}
                              style={{
                                background: "rgba(102, 126, 234, 0.1)",
                                border: "1px solid #667eea",
                                color: "#667eea",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                fontSize: "12px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = "rgba(102, 126, 234, 0.2)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = "rgba(102, 126, 234, 0.1)";
                              }}
                            >
                              {sugg}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: "#fff",
                        color: "#999",
                        fontSize: "14px",
                      }}
                    >
                      <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
                        Thinking...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={sendMessage}
                style={{
                  display: "flex",
                  gap: "8px",
                  padding: "12px",
                  borderTop: "1px solid #eee",
                  background: "white",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    border: "1px solid #ddd",
                    borderRadius: "20px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                  onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: loading || !input.trim() ? 0.6 : 1,
                  }}
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            // Category selection mode
            <>
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  background: "#f9f9f9",
                }}
              >
                <p
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "14px",
                    color: "#666",
                    textAlign: "center",
                  }}
                >
                  {isGuest
                    ? "Select a topic to get started:"
                    : `Hi ${user?.name || "there"}! What would you like help with?`}
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "10px",
                  }}
                >
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat)}
                      style={{
                        padding: "16px 12px",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        background: "white",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#333",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#667eea";
                        e.currentTarget.style.background = "rgba(102, 126, 234, 0.05)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#ddd";
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                {!isGuest && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "12px",
                      background: "rgba(102, 126, 234, 0.1)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#333",
                      textAlign: "center",
                    }}
                  >
                    💡 <strong>Pro tip:</strong> Open the full AI Assistant for conversation history and more advanced features!
                  </div>
                )}

                {isGuest && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "12px",
                      background: "#fff3cd",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#856404",
                      textAlign: "center",
                    }}
                  >
                    <button
                      onClick={() => setRoute("login")}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#0c5460",
                        textDecoration: "underline",
                        cursor: "pointer",
                        padding: 0,
                        fontWeight: "bold",
                      }}
                    >
                      Log in
                    </button>
                    {" "}to save conversations and get personalized help!
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
