import React, { useEffect, useRef, useState } from "react";
import { Send, X, MessageCircle } from "lucide-react";
import { getToken, resolveApiUrl } from "../utils/api";

export default function UnifiedAIAssistant({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  const aiMode = !user ? "guest" : ["student", "teacher", "admin", "superadmin", "staff", "parent"].includes(user.role) ? user.role : "user";
  const storageKey = `kangaru-ai-widget:${user?.id || "guest"}:${aiMode}`;

  useEffect(() => {
    if (!isOpen) return;
    try { setMessages(JSON.parse(sessionStorage.getItem(storageKey) || "[]")); } catch { setMessages([]); }
  }, [isOpen, storageKey]);

  useEffect(() => { try { sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-16))); } catch {} }, [messages, storageKey]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const closeAssistant = () => { abortRef.current?.abort(); setIsOpen(false); };

  const handleSendMessage = async (rawContent) => {
    const content = rawContent.trim();
    if (!content || isLoading) return;
    const history = messages.filter((message) => message.role === "user" || message.role === "assistant").map((message) => ({ role: message.role, content: message.content }));
    const controller = new AbortController();
    let receivedToken = false;
    abortRef.current = controller;
    setMessages((previous) => [...previous, { role: "user", content }]);
    setInput("");
    setIsLoading(true);

    try {
      const endpoint = aiMode === "guest" ? "/api/ai/stream/guest" : "/api/ai/stream";
      const headers = { "Content-Type": "application/json" };
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(resolveApiUrl(endpoint), { method: "POST", signal: controller.signal, headers, body: JSON.stringify({ message: content, history }) });
      if (!response.ok || !response.body) throw new Error("Assistant service is unavailable.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || "";
        for (const event of events) {
          const line = event.split(/\r?\n/).find((entry) => entry.startsWith("data:"));
          if (!line) continue;
          const payload = JSON.parse(line.slice(5).trim());
          if (payload.type === "token" && payload.token) {
            setMessages((previous) => receivedToken ? previous.map((message, index) => index === previous.length - 1 ? { ...message, content: message.content + payload.token } : message) : [...previous, { role: "assistant", content: payload.token }]);
            receivedToken = true;
          }
          if (payload.type === "error") throw new Error(payload.message || "The assistant could not respond.");
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) setMessages((previous) => [...previous, { role: "assistant", content: "An error occurred. Please try again." }]);
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  const getRoleLabel = () => {
    if (!user) return "Guest";
    if (user.role === "student") return "Student AI";
    if (user.role === "teacher") return "Teacher AI";
    if (user.role === "admin" || user.role === "superadmin") return "Administrator AI";
    return "AI Assistant";
  };

  return <>
    {!isOpen && <button onClick={() => setIsOpen(true)} style={{ position: "fixed", bottom: "20px", right: "20px", width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)", zIndex: 999, fontSize: "24px", transition: "all 0.3s ease" }} title="Open AI Assistant"><MessageCircle size={32} /></button>}
    {isOpen && <div style={{ position: "fixed", bottom: "20px", right: "20px", width: "420px", maxWidth: "90vw", height: "650px", maxHeight: "85vh", background: "white", borderRadius: "14px", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)", display: "flex", flexDirection: "column", zIndex: 1001, overflow: "hidden", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>🤖 {getRoleLabel()}</h3><p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.9 }}>{user ? user.name || "User" : "Guest"}</p></div><button onClick={closeAssistant} style={{ background: "rgba(255, 255, 255, 0.2)", border: "none", color: "white", cursor: "pointer", padding: "6px 10px", borderRadius: "4px", transition: "background 0.2s" }}><X size={20} /></button></div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: "#f9f9f9", display: "flex", flexDirection: "column", gap: "12px" }}>{messages.length === 0 ? <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", textAlign: "center" }}><p>Start a conversation...</p></div> : messages.map((message, index) => <div key={index} style={{ display: "flex", justifyContent: message.role === "user" ? "flex-end" : "flex-start" }}><div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: "12px", background: message.role === "user" ? "#667eea" : "#fff", color: message.role === "user" ? "white" : "#000", fontSize: "14px", lineHeight: "1.4", wordWrap: "break-word" }}>{message.content}</div></div>)}{isLoading && <div style={{ display: "flex", justifyContent: "flex-start" }}><div style={{ padding: "10px 14px", borderRadius: "12px", background: "#fff", fontSize: "14px" }}><span>Thinking...</span></div></div>}<div ref={messagesEndRef} /></div>
      <form onSubmit={(event) => { event.preventDefault(); handleSendMessage(input); }} style={{ display: "flex", gap: "8px", padding: "12px", borderTop: "1px solid #eee", background: "#fff" }}><input type="text" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type your message..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit" }} disabled={isLoading} /><button type="submit" disabled={!input.trim() || isLoading} style={{ padding: "8px 12px", background: "#667eea", color: "white", border: "none", borderRadius: "6px", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.6 : 1, transition: "opacity 0.2s" }}><Send size={18} /></button></form>
    </div>}
  </>;
}
