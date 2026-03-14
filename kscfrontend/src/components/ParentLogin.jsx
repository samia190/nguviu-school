import React, { useState, useEffect } from "react";
import { post, saveToken } from "../utils/api";

function parseHashParams() {
  // Reads token and email from hash fragment, e.g. /parent-login#token=abc&email=x@y.com
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  return { email: params.get('email') || '', token: params.get('token') || '' };
}

export default function ParentLogin({ onAuth, navigate }) {
  const { email: hashEmail, token: hashToken } = parseHashParams();
  const [email, setEmail] = useState(hashEmail);
  const [token, setToken] = useState(hashToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // If both email and token are in URL, auto-login
    if (email && token) {
      handleAutoLogin();
    }
  }, []);

  const handleAutoLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await post("/api/parent/parent-login", {
        email,
        token
      });

      // Store token
      saveToken(result.token);

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        if (onAuth) {
          onAuth(result.user);
        } else if (navigate) {
          navigate("parent-dashboard");
        }
      }, 1500);
    } catch (err) {
      setError(err.message || "Login failed. Token may have expired.");
      setEmail("");
      setToken("");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    handleAutoLogin();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        padding: "40px",
        maxWidth: "450px",
        width: "100%"
      }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ margin: 0, fontSize: "32px", color: "#333" }}>
            👨‍👩‍👧 Parent Portal
          </h1>
          <p style={{ margin: "10px 0 0 0", color: "#666", fontSize: "14px" }}>
            View your child's academic progress and performance
          </p>
        </div>

        {error && (
          <div style={{
            background: "#fee",
            border: "1px solid #fcc",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "20px",
            color: "#c33",
            fontSize: "14px"
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{
            background: "#efe",
            border: "1px solid #cfc",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "20px",
            color: "#3c3",
            fontSize: "14px"
          }}>
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#333",
              fontSize: "14px"
            }}>
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              disabled={loading}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "auto"
              }}
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#333",
              fontSize: "14px"
            }}>
              Access Token *
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste the token from your email"
              disabled={loading}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "auto"
              }}
            />
            <p style={{
              margin: "8px 0 0 0",
              fontSize: "12px",
              color: "#999"
            }}>
              Your unique access token was sent to your email
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !token}
            style={{
              width: "100%",
              padding: "14px",
              background: loading || !email || !token
                ? "#ccc"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading || !email || !token ? "not-allowed" : "pointer",
              transition: "all 0.3s ease"
            }}
          >
            {loading ? "🔄 Logging in..." : "✓ Access Parent Portal"}
          </button>
        </form>

        <hr style={{
          border: "none",
          borderTop: "1px solid #e0e0e0",
          margin: "30px 0"
        }} />

        <div style={{
          background: "#f9f9f9",
          borderRadius: "8px",
          padding: "15px",
          fontSize: "13px",
          color: "#666",
          lineHeight: "1.6"
        }}>
          <p style={{ margin: "0 0 10px 0", fontWeight: "600" }}>
            ℹ️ How to Access:
          </p>
          <ol style={{ margin: 0, paddingLeft: "20px" }}>
            <li>School admin sends you an email with access link</li>
            <li>Click the link or copy your email and token</li>
            <li>Paste them into this form</li>
            <li>View your child's results and progress</li>
          </ol>
        </div>

        <div style={{
          textAlign: "center",
          marginTop: "30px",
          fontSize: "12px",
          color: "#999"
        }}>
          <p style={{ margin: 0 }}>
            © 2026 KANGARU GIRLS SENIOR SCHOOL
          </p>
          <p style={{ margin: "5px 0 0 0" }}>
            For support, contact: kangarugirls@yahoo.com
          </p>
        </div>
      </div>
    </div>
  );
}
