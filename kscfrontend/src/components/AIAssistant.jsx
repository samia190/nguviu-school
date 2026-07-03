// components/AIAssistant.jsx
/**
 * Enhanced AI Assistant - Full Page Version
 * Features:
 * - Role-based personalized experience
 * - Conversation history and management
 * - Advanced features for authenticated users
 * - Knowledge base integration
 */
import React, { useState, useEffect, useRef } from "react";
import { Send, Plus, Trash2, Archive, MessageCircle, LogOut, Settings } from "lucide-react";
import { get, post, del } from "../utils/api";

export default function AIAssistant({ user, setRoute }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [roleInfo, setRoleInfo] = useState(null);
  const messagesEndRef = useRef(null);

  // Role-based configuration
  const roleConfig = {
    student: {
      title: "🎓 Student AI Assistant",
      subtitle: "Academic Support & Learning Companion",
      color: "#667eea",
      features: ["Homework Help", "Study Plans", "Exam Prep", "Grade Tracking"],
      systemPrompt: "You are a personalized AI tutor for a student. Provide academic support, explain concepts clearly, suggest study strategies, and help with homework (without giving direct answers). Always encourage learning and critical thinking.",
    },
    teacher: {
      title: "👨‍🏫 Teacher AI Assistant",
      subtitle: "Curriculum & Classroom Support",
      color: "#f093fb",
      features: ["Lesson Planning", "Resource Creation", "Student Management", "Grading Support"],
      systemPrompt: "You are an AI assistant for a teacher. Help with lesson planning, create educational resources, suggest classroom activities, and provide pedagogical advice.",
    },
    parent: {
      title: "👨‍👩‍👧 Parent AI Assistant",
      subtitle: "Child's Education & Progress",
      color: "#f5576c",
      features: ["Progress Tracking", "School Info", "Communication Tips", "Support Advice"],
      systemPrompt: "You are an AI assistant for a parent. Provide information about school programs, explain academic progress, and offer parenting advice related to education.",
    },
    admin: {
      title: "🛠️ Admin AI Assistant",
      subtitle: "School Management & Analytics",
      color: "#4facfe",
      features: ["System Analytics", "User Management", "Data Reports", "Resource Planning"],
      systemPrompt: "You are an AI assistant for a school administrator. Help with system management, provide analytics insights, assist with resource allocation, and support strategic planning.",
    },
    superadmin: {
      title: "👑 SuperAdmin AI Assistant",
      subtitle: "Full System Control & Intelligence",
      color: "#00f2fe",
      features: ["All Features", "System Config", "Advanced Analytics", "Integration Support"],
      systemPrompt: "You are an AI assistant for a superadmin with full system access. Provide comprehensive system management support, advanced analytics, and help with all aspects of the platform.",
    },
    staff: {
      title: "📋 Staff AI Assistant",
      subtitle: "Administrative Support",
      color: "#fa709a",
      features: ["Task Management", "Communication", "Documentation", "Scheduling"],
      systemPrompt: "You are an AI assistant for school staff. Help with administrative tasks, communication, documentation, and scheduling.",
    },
  };

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      setIsGuest(true);
      initGuestChat();
    } else {
      setIsGuest(false);
      setRoleInfo(roleConfig[user?.role] || roleConfig.student);
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initGuestChat = () => {
    // Initialize guest conversation from sessionStorage
    let guestConv = sessionStorage.getItem("guestConversation");
    if (!guestConv) {
      guestConv = {
        _id: "guest-" + Date.now(),
        title: "Guest Chat",
        isGuest: true,
        createdAt: new Date(),
      };
      sessionStorage.setItem("guestConversation", JSON.stringify(guestConv));
    } else {
      guestConv = JSON.parse(guestConv);
    }

    setActiveConversation(guestConv);
    
    // Load guest messages from sessionStorage
    const guestMessages = sessionStorage.getItem("guestMessages");
    if (guestMessages) {
      setMessages(JSON.parse(guestMessages));
    }
  };

  const fetchConversations = async () => {
    try {
      const data = await get("/api/ai/conversations");
      setConversations(data.conversations || []);
      if (data.conversations?.length > 0 && !activeConversation) {
        loadConversation(data.conversations[0]._id);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const data = await get(`/api/ai/conversations/${conversationId}`);
      setActiveConversation(data.conversation);
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  };

  const createNewConversation = async () => {
    if (isGuest) {
      // For guests, just clear the chat
      setMessages([]);
      sessionStorage.removeItem("guestMessages");
      return null;
    }

    setCreatingNew(true);
    try {
      const data = await post("/api/ai/conversations", { title: "New Conversation" });
      setConversations([data.conversation, ...conversations]);
      setActiveConversation(data.conversation);
      setMessages([]);
      setInput("");
      return data.conversation;
    } catch (err) {
      console.error("Error creating conversation:", err);
      return null;
    } finally {
      setCreatingNew(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      if (isGuest) {
        const userMessage = {
          _id: "msg-" + Date.now(),
          role: "user",
          content: input,
          createdAt: new Date(),
        };

        const assistantMessage = {
          _id: "msg-" + (Date.now() + 1),
          role: "assistant",
          content: "Thank you for your question! As a guest, you have limited access. Please log in to get personalized assistance from our AI assistant.",
          createdAt: new Date(),
        };

        const updatedMessages = [...messages, userMessage, assistantMessage];
        setMessages(updatedMessages);
        sessionStorage.setItem("guestMessages", JSON.stringify(updatedMessages));
        setInput("");
      } else {
        let currentConversation = activeConversation;
        if (!currentConversation) {
          currentConversation = await createNewConversation();
        }

        if (!currentConversation) {
          throw new Error("Unable to establish an AI conversation session");
        }

        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const data = await post("/api/ai/chat", {
          message: input,
          conversationId: currentConversation._id,
        });

        const userMessage = { role: "user", content: input, createdAt: new Date() };
        const assistantMessage = { role: "assistant", content: data.response, createdAt: new Date() };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setInput("");
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

  const deleteConversation = async (conversationId) => {
    if (!confirm("Delete this conversation?")) return;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await del(`/api/ai/conversations/${conversationId}`);
      const filtered = conversations.filter((c) => c._id !== conversationId);
      setConversations(filtered);
      if (activeConversation?._id === conversationId) {
        if (filtered.length > 0) {
          loadConversation(filtered[0]._id);
        } else {
          setActiveConversation(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 60px)", maxWidth: "1600px", margin: "0 auto", background: "#f5f5f5" }}>
      {/* Sidebar */}
      <div style={{
        width: "320px",
        background: roleInfo?.color ? `${roleInfo.color}15` : "#f5f5f5",
        borderRight: "2px solid #eee",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        overflowY: "auto",
        boxShadow: "1px 0 4px rgba(0,0,0,0.05)",
      }}>
        {/* Role Header */}
        {roleInfo && !isGuest && (
          <div style={{
            padding: "16px",
            background: roleInfo.color,
            borderRadius: "10px",
            color: "white",
            marginBottom: "20px",
            textAlign: "center",
            boxShadow: `0 4px 12px ${roleInfo.color}40`,
          }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>{roleInfo.title}</h2>
            <p style={{ margin: "0", fontSize: "13px", opacity: 0.9 }}>{roleInfo.subtitle}</p>
            <p style={{ margin: "8px 0 0 0", fontSize: "12px", opacity: 0.8 }}>
              Logged in as <strong>{user?.role?.toUpperCase()}</strong>
            </p>
          </div>
        )}

        {/* Features */}
        {roleInfo && !isGuest && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "600", color: "#666", textTransform: "uppercase" }}>Available Features</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {roleInfo.features?.map((feat, i) => (
                <div key={i} style={{
                  padding: "8px 10px",
                  background: "white",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#333",
                  border: `1px solid ${roleInfo.color}30`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = roleInfo.color;
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.color = "#333";
                  }}
                >
                  ✨ {feat}
                </div>
              ))}
            </div>
          </div>
        )}

        {isGuest ? (
          <div style={{
            padding: "16px",
            background: "#fff3cd",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#856404",
            textAlign: "center",
            border: "1px solid #ffc107",
          }}>
            <p style={{ marginTop: 0 }}>👋 Welcome Guest</p>
            <p style={{ margin: "8px 0 0 0", fontSize: "12px" }}>
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
                  fontSize: "12px",
                }}
              >
                Log in
              </button>
              {" "}to unlock full features
            </p>
          </div>
        ) : (
          <button
            onClick={createNewConversation}
            disabled={creatingNew}
            style={{
              padding: "12px",
              background: roleInfo?.color || "#667eea",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: creatingNew ? "not-allowed" : "pointer",
              fontWeight: "bold",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: creatingNew ? 0.7 : 1,
              boxShadow: `0 4px 12px ${roleInfo?.color}40`,
            }}
          >
            <Plus size={18} /> New Chat
          </button>
        )}

        {!isGuest && (
          <div style={{ display: "grid", gap: "10px" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "600", color: "#666", textTransform: "uppercase" }}>Conversations ({conversations.length})</h4>
            {conversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => loadConversation(conv._id)}
                style={{
                  padding: "12px",
                  background: activeConversation?._id === conv._id ? roleInfo?.color : "#fff",
                  color: activeConversation?._id === conv._id ? "white" : "#000",
                  border: `1px solid ${activeConversation?._id === conv._id ? "transparent" : "#ddd"}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s",
                  boxShadow: activeConversation?._id === conv._id ? `0 2px 8px ${roleInfo?.color}40` : "none",
                }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "13px" }}>
                  {conv.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv._id);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white" }}>
        {activeConversation ? (
          <>
            {/* Header */}
            <div style={{
              padding: "20px",
              borderBottom: "1px solid #eee",
              background: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}>
              <div>
                <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 4px 0" }}>
                  {activeConversation.title}
                </h1>
                {isGuest && (
                  <p style={{ fontSize: "12px", color: "#999", margin: "0" }}>
                    Guest session • Conversation will be cleared when closed
                  </p>
                )}
                {!isGuest && (
                  <p style={{ fontSize: "12px", color: "#999", margin: "0" }}>
                    Created {new Date(activeConversation.createdAt).toLocaleDateString()} • {messages.length} messages
                  </p>
                )}
              </div>
              <div style={{ fontSize: "12px", color: "#666", textAlign: "right" }}>
                <p style={{ margin: 0 }}>Messages: <strong>{messages.length}</strong></p>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              display: "grid",
              gap: "15px",
              background: "#fafafa",
            }}>
              {messages.length === 0 && (
                <div style={{
                  textAlign: "center",
                  color: "#999",
                  padding: "40px 20px",
                  gridColumn: "1/-1",
                }}>
                  <MessageCircle size={48} style={{ marginBottom: "16px", opacity: 0.3 }} />
                  <p>Start the conversation! Ask anything about your learning journey.</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div style={{
                    maxWidth: "65%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: msg.role === "user" ? (roleInfo?.color || "#667eea") : "#f0f0f0",
                    color: msg.role === "user" ? "white" : "#000",
                    lineHeight: "1.5",
                    fontSize: "14px",
                    boxShadow: msg.role === "user" ? `0 2px 8px ${roleInfo?.color}40` : "0 1px 3px rgba(0,0,0,0.05)",
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={sendMessage}
              style={{
                padding: "20px",
                borderTop: "1px solid #eee",
                background: "white",
                display: "flex",
                gap: "10px",
                boxShadow: "0 -1px 4px rgba(0,0,0,0.05)",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={roleInfo?.subtitle || "Ask me anything..."}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: `1px solid #ddd`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  opacity: loading ? 0.7 : 1,
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = roleInfo?.color || "#667eea")}
                onBlur={(e) => (e.target.style.borderColor = "#ddd")}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  padding: "12px 28px",
                  background: roleInfo?.color || "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  opacity: loading || !input.trim() ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                  boxShadow: `0 2px 8px ${roleInfo?.color}40`,
                }}
              >
                <Send size={18} /> Send
              </button>
            </form>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
          }}>
            <MessageCircle size={64} style={{ marginBottom: "20px", opacity: 0.2 }} />
            <p style={{ fontSize: "16px", fontWeight: "500" }}>No conversation selected</p>
            <p style={{ fontSize: "14px" }}>Create a new chat or select one from the sidebar</p>
          </div>
        )}
      </div>
    </div>
  );
}
