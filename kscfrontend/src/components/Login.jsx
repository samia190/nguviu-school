import React, { useState } from "react";
import { post } from "../utils/api";

export default function Login({ onAuth, navigate }) {
  const [status, setStatus] = useState("");
  const [remember, setRemember] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState("");

  /**
   * Handle form submit
   */
  async function submit(e) {
    e.preventDefault();

    const formData = Object.fromEntries(new FormData(e.target));
    setStatus("Logging in...");

    try {
      const data = await post("/api/auth/login", formData);

      if (data && data.token) {
        /**
         * REMEMBER ME LOGIC
         * ------------------
         * If remember is checked → keep token in localStorage
         * Else → keep token in sessionStorage (clears on browser close)
         */
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem("token", data.token);

        // Notify app that user is authenticated
        onAuth && onAuth(data.user);

        setStatus("Logged in");

        // Redirect user based on role
        redirectByRole(data.user.role);

        e.target.reset();
      } else {
        setStatus("Login failed");
      }
    } catch (err) {
      setStatus(err.message || "Error occurred");
    }
  }

  /**
   * ROLE-BASED REDIRECTION
   */
  function redirectByRole(role) {
    if (!navigate) return;

    switch (role) {
      case "admin":
        navigate("admin");
        break;
      case "teacher":
        navigate("teacher");
        break;
      case "student":
        navigate("student");
        break;
      case "staff":
        navigate("staff");
        break;
      default:
        navigate("home");
    }
  }

  /**
   * Handle forgot password request
   */
  async function handleForgotPassword(e) {
    e.preventDefault();
    setResetStatus("Sending reset link...");

    try {
      const response = await post("/api/auth/forgot-password", { email: resetEmail });
      setResetStatus(response.message || "Password reset link sent to your email!");
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail("");
        setResetStatus("");
      }, 3000);
    } catch (err) {
      setResetStatus(err.message || "Failed to send reset link");
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes login-orbit {
          0%   { transform: rotate(0deg) translateX(var(--r)) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(var(--r)) rotate(-360deg); }
        }
        @keyframes login-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(1.15); opacity: 1; }
        }
        @keyframes login-drift {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.5; }
          33%  { transform: translateY(-40px) translateX(30px) rotate(120deg); opacity: 0.8; }
          66%  { transform: translateY(20px) translateX(-20px) rotate(240deg); opacity: 0.6; }
          100% { transform: translateY(0) translateX(0) rotate(360deg); opacity: 0.5; }
        }
        @keyframes login-shimmer {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.45; }
        }
        @keyframes login-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes login-counter-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        .login-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .classic-input {
          width: 100%;
          padding: 14px 18px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          font-size: 15px;
          transition: all 0.3s ease;
          outline: none;
          box-sizing: border-box;
          color: #1e293b;
        }
        .classic-input:focus {
          border-color: #667eea;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.12);
        }
        .classic-btn {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.45);
          letter-spacing: 0.3px;
        }
        .classic-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(102, 126, 234, 0.7);
        }
        .classic-btn:active { transform: translateY(0); }
        .classic-btn:disabled { opacity: 0.65; cursor: not-allowed; }
      `}</style>

      {/* ── Animated geometric rings ── */}
      {[200, 340, 480, 620].map((size, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          border: `1.5px solid rgba(${i % 2 === 0 ? '102,126,234' : '118,75,162'},${0.18 - i * 0.03})`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          animation: `${i % 2 === 0 ? 'login-spin' : 'login-counter-spin'} ${22 + i * 8}s linear infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* ── Floating orbs ── */}
      {[
        { size: 180, top: '8%',  left: '6%',  color: '102,126,234', dur: '9s',  delay: '0s'  },
        { size: 120, top: '72%', left: '4%',  color: '118,75,162',  dur: '13s', delay: '2s'  },
        { size: 90,  top: '15%', left: '82%', color: '79,209,197',  dur: '11s', delay: '1s'  },
        { size: 140, top: '65%', left: '76%', color: '102,126,234', dur: '15s', delay: '3s'  },
        { size: 70,  top: '42%', left: '90%', color: '240,147,251', dur: '7s',  delay: '0.5s'},
        { size: 50,  top: '88%', left: '55%', color: '118,75,162',  dur: '10s', delay: '4s'  },
      ].map((o, i) => (
        <div key={i} className="login-particle" style={{
          width: o.size,
          height: o.size,
          top: o.top,
          left: o.left,
          background: `radial-gradient(circle, rgba(${o.color},0.22) 0%, rgba(${o.color},0) 70%)`,
          animation: `login-drift ${o.dur} ease-in-out infinite ${o.delay}`,
          filter: 'blur(2px)',
        }} />
      ))}

      {/* ── Glowing diamond shapes ── */}
      {[
        { size: 14, top: '18%', left: '20%', dur: '4s',  delay: '0s'   },
        { size: 10, top: '34%', left: '88%', dur: '6s',  delay: '1s'   },
        { size: 18, top: '78%', left: '15%', dur: '5s',  delay: '2.5s' },
        { size: 12, top: '58%', left: '92%', dur: '7s',  delay: '0.5s' },
        { size: 8,  top: '90%', left: '38%', dur: '4.5s',delay: '3s'   },
        { size: 16, top: '12%', left: '60%', dur: '6.5s',delay: '1.5s' },
      ].map((d, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: d.size,
          height: d.size,
          top: d.top,
          left: d.left,
          background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
          borderRadius: '3px',
          transform: 'rotate(45deg)',
          animation: `login-pulse ${d.dur} ease-in-out infinite ${d.delay}`,
          boxShadow: '0 0 12px rgba(167,139,250,0.7)',
          pointerEvents: 'none',
        }} />
      ))}

      {/* ── Orbit dots around card center ── */}
      {[0,60,120,180,240,300].map((deg, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 8,
          height: 8,
          marginTop: -4,
          marginLeft: -4,
          borderRadius: '50%',
          background: i % 2 === 0 ? '#818cf8' : '#c084fc',
          boxShadow: `0 0 8px ${i % 2 === 0 ? '#818cf8' : '#c084fc'}`,
          '--r': '260px',
          animation: `login-orbit ${16 + i * 2}s linear infinite ${i * -2.5}s`,
          transformOrigin: '0 0',
          opacity: 0.55,
          pointerEvents: 'none',
        }} />
      ))}

      {/* ── Card ── */}
      <section style={{
        background: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(24px)',
        borderRadius: '24px',
        padding: '48px 40px',
        boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15)',
        maxWidth: '440px',
        width: '100%',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* School logo / icon */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 8px 24px rgba(102,126,234,0.4)',
            marginBottom: 14,
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="white" opacity="0.9"/>
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill="white"/>
            </svg>
          </div>
          <h2 style={{
            fontSize: '28px', fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '6px', marginTop: 0,
          }}>Welcome Back</h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Sign in to your Kangaru Girls account
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Email Address
            </label>
            <input name="email" type="email" placeholder="your@email.com" required className="classic-input" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Password
            </label>
            <input name="password" type="password" placeholder="Enter your password" required className="classic-input" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', color: '#64748b', cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#667eea' }} />
              Remember me
            </label>
            <button type="button" onClick={() => setShowForgotPassword(true)}
              style={{ background: 'none', border: 'none', color: '#667eea', fontWeight: 600, cursor: 'pointer', fontSize: '13px', padding: 0 }}>
              Forgot Password?
            </button>
          </div>

          <button className="classic-btn" type="submit" disabled={status === "Logging in..."}>
            {status === "Logging in..." ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {status && (
          <p style={{
            marginTop: '16px', padding: '11px 14px', borderRadius: '10px',
            background: status.includes('failed') || status.includes('Error') || status.includes('Invalid')
              ? 'rgba(239,68,68,0.09)' : 'rgba(34,197,94,0.09)',
            color: status.includes('failed') || status.includes('Error') || status.includes('Invalid')
              ? '#dc2626' : '#16a34a',
            textAlign: 'center', fontSize: '14px', fontWeight: 500, margin: '16px 0 0',
          }}>
            {status}
          </p>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748b', fontSize: '14px' }}>
          Don't have an account?{' '}
          <button type="button" onClick={() => navigate && navigate('signup')}
            style={{ background: 'none', border: 'none', color: '#667eea', fontWeight: 600, cursor: 'pointer', fontSize: '14px', padding: 0 }}>
            Sign up
          </button>
        </p>
      </section>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }} onClick={() => setShowForgotPassword(false)}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', padding: '40px',
            maxWidth: '420px', width: '100%',
            boxShadow: '0 25px 80px rgba(0,0,0,0.35)',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              fontSize: '22px', fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: '10px', textAlign: 'center', marginTop: 0,
            }}>Reset Password</h3>
            <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="email" placeholder="Enter your email" value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)} required className="classic-input" />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button"
                  onClick={() => { setShowForgotPassword(false); setResetEmail(""); setResetStatus(""); }}
                  style={{ flex: 1, padding: '13px', border: '2px solid #e2e8f0', borderRadius: '12px', background: 'white', color: '#64748b', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="classic-btn" style={{ flex: 1 }}>Send Link</button>
              </div>
            </form>
            {resetStatus && (
              <p style={{
                marginTop: '16px', padding: '11px', borderRadius: '8px',
                background: resetStatus.includes('Failed') ? 'rgba(239,68,68,0.09)' : 'rgba(34,197,94,0.09)',
                color: resetStatus.includes('Failed') ? '#dc2626' : '#16a34a',
                textAlign: 'center', fontSize: '14px', fontWeight: 500,
              }}>{resetStatus}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
