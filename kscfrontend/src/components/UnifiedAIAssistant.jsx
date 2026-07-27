import React, { useState, useEffect, useRef } from "react";
import { Send, X, MessageCircle } from "lucide-react";
import { trpc } from "../lib/trpc";

export default function UnifiedAIAssistant({ user, setRoute }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Determine which AI to use based on user role
  const getAIMode = () => {
    if (!user) return "guest";
    if (user.role === "student") return "student";
    if (user.role === "teacher") return "teacher";
    return "guest";
  };

  const aiMode = getAIMode();

  // Get appropriate tRPC mutations
  const guestChatMutation = trpc.chat.guestChat.useMutation();
  const studentRevisionMutation = trpc.chat.studentRevision.useMutation();
  const teacherLessonPlanMutation = trpc.chat.teacherLessonPlan.useMutation();
  const loadHistoryQuery = trpc.chat.loadChatHistory.useQuery({
  portalType: aiMode,
  enabled: isOpen && !!user,
});

  const isLoading =
    guestChatMutation.isPending ||
    studentRevisionMutation.isPending ||
    teacherLessonPlanMutation.isPending;

  // Load chat history when opening
  useEffect(() => {
    if (isOpen && loadHistoryQuery.data) {
      setMessages(loadHistoryQuery.data);
    }
  }, [isOpen, loadHistoryQuery.data]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (content) => {
    if (!content.trim() || isLoading) return;

    const userMessage = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);

    const conversationHistory = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    if (aiMode === "guest") {
      guestChatMutation.mutate(
        { message: content, conversationHistory },
        {
          onSuccess: (response) => {
            if (response.success) {
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: response.message },
              ]);
            }
          },
          onError: (error) => {
            console.error("Error:", error);
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: "An error occurred. Please try again.",
              },
            ]);
          },
        }
      );
    } else if (aiMode === "student") {
      studentRevisionMutation.mutate(
        {
          message: content,
          curriculum: "8-4-4",
          conversationHistory,
        },
        {
          onSuccess: (response) => {
            if (response.success) {
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: response.message },
              ]);
            }
          },
          onError: (error) => {
            console.error("Error:", error);
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: "An error occurred. Please try again.",
              },
            ]);
          },
        }
      );
    } else if (aiMode === "teacher") {
      teacherLessonPlanMutation.mutate(
        {
          message: content,
          subject: "General",
          gradeLevel: "Grade 10",
          conversationHistory,
        },
        {
          onSuccess: (response) => {
            if (response.success) {
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: response.message },
              ]);
            }
          },
          onError: (error) => {
            console.error("Error:", error);
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: "An error occurred. Please try again.",
              },
            ]);
          },
        }
      );
    }
  };

  const getRoleLabel = () => {
    if (!user) return "Guest";
    if (user.role === "student") return "Student AI";
    if (user.role === "teacher") return "Teacher AI";
    return "AI Assistant";
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
          }}
          title="Open AI Assistant"
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
            fontFamily: "system-ui, -apple-system, sans-serif",
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
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
                🤖 {getRoleLabel()}
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.9 }}>
                {user ? user.name || "User" : "Guest"}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "white",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: "4px",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.3)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.2)";
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
              background: "#f9f9f9",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                  textAlign: "center",
                }}
              >
                <p>Start a conversation...</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
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
                      background: msg.role === "user" ? "#667eea" : "#fff",
                      color: msg.role === "user" ? "white" : "#000",
                      fontSize: "14px",
                      lineHeight: "1.4",
                      wordWrap: "break-word",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: "#fff",
                    fontSize: "14px",
                  }}
                >
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
              setInput("");
            }}
            style={{
              display: "flex",
              gap: "8px",
              padding: "12px",
              borderTop: "1px solid #eee",
              background: "#fff",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                padding: "8px 12px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => {
                if (!isLoading && input.trim()) {
                  e.target.style.opacity = "0.9";
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading && input.trim()) {
                  e.target.style.opacity = "1";
                }
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
