// components/FloatingAIChat.jsx
import React, { useState, useEffect, useRef } from "react";
import { Send, X, MessageCircle, LogIn, AlertCircle } from "lucide-react";
import { post } from "../utils/api";

export default function FloatingAIChat({ user, setRoute }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check if user is authenticated (either via user prop or token in storage)
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const isAuthenticated = !!(user || token);
    setIsGuest(!isAuthenticated);

    // Load initial greeting
    if (!messages.length) {
      setMessages([
        {
          role: "assistant",
          content: "👋 Hello! I'm your school's AI Assistant. I can help you with information about admissions, programs, fees, events, and more. How can I help you today?",
          isInitial: true,
        },
      ]);
    }
  }, [user]); // Re-run when user prop changes

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const isAuthenticated = !!(user || token);
      
      // For guests: call public endpoint
      if (!isAuthenticated) {
        const data = await post("/api/ai/chat/guest", { message: input });
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

        if (data.requiresLogin) {
          setShowLoginPrompt(true);
        }
      } else {
        const data = await post("/api/ai/chat", { message: input });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
          },
        ]);
      }
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

  const handleLoginClick = () => {
    setRoute("login");
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
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
            hover: {
              transform: "scale(1.1)",
              boxShadow: "0 6px 16px rgba(102, 126, 234, 0.6)",
            },
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

      {/* Chat Widget */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "400px",
            maxWidth: "90vw",
            height: "600px",
            maxHeight: "80vh",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            overflow: "hidden",
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
              borderRadius: "12px 12px 0 0",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
                AI Assistant
              </h3>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "12px",
                  opacity: 0.9,
                }}
              >
                {isGuest ? "Guest Mode" : "Signed in"}
              </p>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setShowLoginPrompt(false);
              }}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "white",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} />
            </button>
          </div>

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
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
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
                      msg.isError ? "1px solid #f99" : msg.requiresLogin ? "1px solid #ffc107" : "none",
                  }}
                >
                  <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                  {msg.truncated && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={() => {
                          setExpandedMessages((prev) => {
                            const s = new Set(prev);
                            if (s.has(idx)) s.delete(idx);
                            else s.add(idx);
                            return s;
                          });
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#667eea",
                          cursor: "pointer",
                          textDecoration: "underline",
                          padding: 0,
                          fontSize: 13,
                        }}
                      >
                        {expandedMessages.has(idx) ? "Show less" : "Read more"}
                      </button>
                      {expandedMessages.has(idx) && msg.details && (
                        <div style={{ marginTop: 8, color: "#333", fontSize: 13 }}>
                          <div style={{ whiteSpace: "pre-wrap" }}>{msg.details}</div>
                        </div>
                      )}
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
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ animation: "pulse 1s infinite" }}>
                    Thinking...
                  </span>
                </div>
              </div>
            )}

            {showLoginPrompt && isGuest && (
              <div
                style={{
                  background: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "13px",
                  color: "#856404",
                }}
              >
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <AlertCircle size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>
                      This information requires sign in
                    </p>
                    <button
                      onClick={handleLoginClick}
                      style={{
                        background: "#ffc107",
                        border: "none",
                        color: "#333",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px",
                      }}
                    >
                      Sign In
                    </button>
                  </div>
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
              background: "#fff",
              borderTop: "1px solid #eee",
            }}
          >
            <input
              ref={(el) => el?.focus()}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about admissions, fees, events..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "13px",
                opacity: loading ? 0.6 : 1,
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: "10px 14px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: loading || !input.trim() ? 0.6 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </form>

          {/* Footer */}
          {isGuest && (
            <div
              style={{
                padding: "8px 12px",
                background: "#f0f0f0",
                fontSize: "11px",
                color: "#666",
                textAlign: "center",
                borderTop: "1px solid #eee",
              }}
            >
              <button
                onClick={handleLoginClick}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#667eea",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
              >
                Sign in
              </button>
              {" "}to access full features
            </div>
          )}
        </div>
      )}

      {/* Global styles for animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
