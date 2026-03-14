import React, { useState, useEffect } from "react";
import { get, post, saveToken } from "../utils/api";

function friendlySignupError(err) {
  if (!err?.status) return "Cannot connect to server. Please check your internet connection.";
  if (err.status === 409) return "An account with this email already exists. Try logging in instead.";
  if (err.status === 410) return err.body?.error || "This invite link is no longer valid.";
  if (err.status === 400) return err.body?.error || "Please check your details and try again.";
  if (err.status === 429) return "Too many attempts. Please wait a moment before trying again.";
  if (err.status >= 500) return "Server error. Please try again in a moment.";
  return err.body?.error || "Registration failed. Please try again.";
}

export default function SignUp({ onAuth, navigate }) {
  const [inviteToken, setInviteToken] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    length: false, uppercase: false, number: false, special: false, isValid: false
  });
  const [status, setStatus] = useState("");

  // Check for invite token on mount — if none, allow public registration as "user"
  // Reads from hash fragment (#invite=TOKEN) — hash is never sent to the server so
  // the CDN rewrite always serves index.html for /signup regardless of invite token.
  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const params = new URLSearchParams(hash);
    const token = params.get("invite");
    if (token) {
      setInviteToken(token);
      get(`/api/invite/validate/${encodeURIComponent(token)}`)
        .then((data) => {
          if (data.valid) {
            setInviteInfo({ linkType: data.linkType, role: data.role, label: data.label });
          }
          // If invalid invite, fall through to public registration
        })
        .catch(() => {
          // Fall through to public registration
        })
        .finally(() => setInviteLoading(false));
    } else {
      setInviteLoading(false);
    }
  }, []);

  // Validate password strength
  const validatePassword = (pwd) => {
    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
      isValid: false
    };
    requirements.isValid = requirements.length && requirements.uppercase && requirements.number && requirements.special;
    return requirements;
  };

  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    if (f.password !== f.confirmPassword) {
      setStatus("Passwords do not match");
      return;
    }
    if (!passwordStrength.isValid) {
      setStatus("Password does not meet the required strength criteria");
      return;
    }
    setStatus("Creating account...");
    try {
      const payload = {
        name: f.name,
        email: f.email,
        password: f.password,
        ...(inviteToken ? { inviteToken } : {}),
        admissionNumber: f.admissionNumber || undefined,
        stream: f.stream || undefined,
        grade: f.grade || undefined,
        form: f.form || undefined,
        dateOfBirth: f.dateOfBirth || undefined,
        yearOfAdmission: f.yearOfAdmission || undefined,
        guardianName: f.guardianName || undefined,
        guardianPhone: f.guardianPhone || undefined,
        guardianRelation: f.guardianRelation || undefined,
        staffId: f.staffId || undefined,
        subjects: f.subjects ? f.subjects.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        department: f.department || undefined,
        qualifications: f.qualifications || undefined,
        position: f.position || undefined,
        phone: f.phone || undefined,
        occupation: f.occupation || undefined,
        providedAdmissionNumbers: f.admissionNumbers
          ? f.admissionNumbers.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      };
      const data = await post("/api/auth/register", payload);
      if (data && data.token) {
        saveToken(data.token);
        onAuth && onAuth(data.user);
        setStatus("Account created! ✓");
        e.target.reset();
      } else {
        setStatus("Failed to create account. Please try again.");
      }
    } catch (err) {
      setStatus(friendlySignupError(err));
    }
  }

  const isPublic = !inviteToken || !inviteInfo;
  const linkType = inviteInfo?.linkType;
  const isStudent = linkType === "student-cbc" || linkType === "student-844";
  const isCBC = linkType === "student-cbc";
  const isTeacher = linkType === "teacher";
  const isStaff = linkType === "staff";
  const isParent = linkType === "parent";
  const formValid = passwordStrength.isValid && confirmPassword === password && confirmPassword.length > 0;

  if (inviteLoading) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
        background:"linear-gradient(135deg,#064e3b 0%,#065f46 50%,#0f172a 100%)" }}>
        <p style={{ color:"rgba(255,255,255,0.7)", fontSize:16 }}>Loading…</p>
      </div>
    );
  }

  const LINK_TYPE_LABELS = {
    "student-cbc": "Student (CBC)", "student-844": "Student (8-4-4)",
    "teacher": "Teacher", "staff": "Staff Member", "parent": "Parent / Guardian",
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"linear-gradient(135deg,#064e3b 0%,#065f46 50%,#0f172a 100%)",
      padding:"20px", position:"relative", overflow:"hidden" }}>

      <style>{`
        @keyframes su-rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes su-counter { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes su-drift {
          0%{transform:translate(0px,0px) scale(1)}
          33%{transform:translate(18px,-22px) scale(1.08)}
          66%{transform:translate(-14px,14px) scale(0.94)}
          100%{transform:translate(0px,0px) scale(1)}
        }
        @keyframes su-pulse {
          0%,100%{opacity:.18;transform:rotate(45deg) scale(1)}
          50%{opacity:.38;transform:rotate(45deg) scale(1.2)}
        }
        @keyframes su-orbit {
          from{transform:rotate(0deg) translateX(var(--r,220px)) rotate(0deg)}
          to{transform:rotate(360deg) translateX(var(--r,220px)) rotate(-360deg)}
        }
        .si-input{width:100%;padding:11px 15px;border:2px solid rgba(255,255,255,0.15);border-radius:10px;
          background:rgba(255,255,255,0.08);color:#e2e8f0;font-size:14px;transition:all 0.25s;
          outline:none;box-sizing:border-box;}
        .si-input:focus{border-color:#34d399;box-shadow:0 0 0 3px rgba(52,211,153,0.2);}
        .si-input::placeholder{color:rgba(255,255,255,0.35);}
        .si-input option{background:#065f46;color:#e2e8f0;}
        .si-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .si-btn{width:100%;padding:13px;border:none;border-radius:12px;
          background:linear-gradient(135deg,#10b981 0%,#059669 100%);
          color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.3s;
          box-shadow:0 4px 15px rgba(16,185,129,0.4);}
        .si-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 20px rgba(16,185,129,0.6);}
        .si-btn:disabled{opacity:.55;cursor:not-allowed;}
        .si-label{font-size:12px;font-weight:600;color:rgba(167,243,208,0.9);margin-bottom:4px;
          text-transform:uppercase;letter-spacing:0.4px;}
        .si-section{font-size:12px;font-weight:700;color:#34d399;border-bottom:1px solid rgba(52,211,153,0.3);
          padding-bottom:3px;margin:6px 0 2px;text-transform:uppercase;letter-spacing:0.5px;}
        .si-card::-webkit-scrollbar{width:5px;}
        .si-card::-webkit-scrollbar-track{background:rgba(255,255,255,0.05);}
        .si-card::-webkit-scrollbar-thumb{background:rgba(52,211,153,0.4);border-radius:3px;}
      `}</style>

      {/* Animated rings */}
      {[240,200,160,120].map((size, i) => (
        <div key={i} style={{
          position:"absolute", top:"50%", left:"50%",
          width:size*2, height:size*2,
          marginLeft:-size, marginTop:-size,
          borderRadius:"50%",
          border:`${i%2===0?"2px":"1px"} solid rgba(52,211,153,${0.08+i*0.04})`,
          animation:`${i%2===0?"su-rotate":"su-counter"} ${18+i*7}s linear infinite`,
          pointerEvents:"none",
        }} />
      ))}

      {/* Floating orbs */}
      {[
        {top:"8%",left:"5%",w:200,h:200,c:"radial-gradient(circle,rgba(16,185,129,0.18),transparent 70%)",d:"11s"},
        {top:"55%",right:"3%",w:260,h:260,c:"radial-gradient(circle,rgba(6,95,70,0.25),transparent 70%)",d:"14s"},
        {bottom:"5%",left:"15%",w:180,h:180,c:"radial-gradient(circle,rgba(52,211,153,0.14),transparent 70%)",d:"9s"},
        {top:"25%",right:"20%",w:140,h:140,c:"radial-gradient(circle,rgba(4,120,87,0.2),transparent 70%)",d:"16s"},
        {bottom:"25%",right:"30%",w:110,h:110,c:"radial-gradient(circle,rgba(167,243,208,0.1),transparent 70%)",d:"12s"},
        {top:"70%",left:"40%",w:90,h:90,c:"radial-gradient(circle,rgba(16,185,129,0.15),transparent 70%)",d:"8s"},
      ].map((o, i) => (
        <div key={i} style={{
          position:"absolute", top:o.top, left:o.left, right:o.right, bottom:o.bottom,
          width:o.w, height:o.h, borderRadius:"50%", background:o.c,
          animation:`su-drift ${o.d} ease-in-out infinite`,
          animationDelay:`${i*1.8}s`, pointerEvents:"none",
        }} />
      ))}

      {/* Diamond sparks */}
      {[
        {top:"15%",left:"18%",s:18},{top:"38%",right:"12%",s:14},{bottom:"28%",left:"22%",s:22},
        {top:"62%",right:"25%",s:12},{bottom:"12%",right:"18%",s:16},{top:"82%",left:"45%",s:10},
      ].map((d, i) => (
        <div key={i} style={{
          position:"absolute", top:d.top, left:d.left, right:d.right, bottom:d.bottom,
          width:d.s, height:d.s, background:"rgba(52,211,153,0.5)",
          transform:"rotate(45deg)",
          animation:`su-pulse ${3+i*0.7}s ease-in-out infinite`,
          animationDelay:`${i*0.9}s`, pointerEvents:"none",
        }} />
      ))}

      {/* Orbiting dots */}
      {[
        {r:"200px",dur:"20s",delay:"0s",color:"rgba(52,211,153,0.7)"},
        {r:"240px",dur:"28s",delay:"4s",color:"rgba(167,243,208,0.6)"},
        {r:"180px",dur:"16s",delay:"8s",color:"rgba(16,185,129,0.8)"},
        {r:"260px",dur:"34s",delay:"2s",color:"rgba(52,211,153,0.5)"},
        {r:"145px",dur:"12s",delay:"6s",color:"rgba(110,231,183,0.65)"},
        {r:"300px",dur:"40s",delay:"10s",color:"rgba(167,243,208,0.45)"},
      ].map((dot, i) => (
        <div key={i} style={{
          position:"absolute", top:"50%", left:"50%",
          width:7, height:7, marginLeft:-3.5, marginTop:-3.5,
          borderRadius:"50%", background:dot.color,
          boxShadow:`0 0 8px ${dot.color}`,
          animation:`su-orbit ${dot.dur} linear infinite`,
          animationDelay:dot.delay,
          "--r": dot.r,
          pointerEvents:"none",
        }} />
      ))}

      {/* Registration card */}
      <section className="si-card" style={{
        background:"rgba(255,255,255,0.06)", backdropFilter:"blur(24px)",
        borderRadius:24, padding:"40px 36px",
        boxShadow:"0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
        width:"100%", maxWidth: isStudent ? 500 : 460,
        position:"relative", zIndex:1,
        border:"1px solid rgba(52,211,153,0.2)",
        maxHeight:"90vh", overflowY:"auto",
      }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{
            width:56, height:56, borderRadius:"50%",
            background:"linear-gradient(135deg,#10b981,#059669)",
            display:"flex", alignItems:"center", justifyContent:"center",
            margin:"0 auto 12px", fontSize:24,
            boxShadow:"0 4px 20px rgba(16,185,129,0.5)",
          }}>🎓</div>
          <h2 style={{
            fontSize:26, fontWeight:700, margin:"0 0 4px",
            background:"linear-gradient(135deg,#a7f3d0,#34d399)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>
            {isPublic ? "Create Account" : "Complete Registration"}
          </h2>
          <p style={{ color:"rgba(167,243,208,0.7)", fontSize:13, margin:0 }}>
            {isPublic
              ? "Kangaru Girls School · Public Registration"
              : (LINK_TYPE_LABELS[linkType] || "Invited Registration")}
          </p>
        </div>

        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <p className="si-section">Account Details</p>

          <div>
            <p className="si-label">Full Name</p>
            <input name="name" placeholder="Enter your full name" required className="si-input" />
          </div>
          <div>
            <p className="si-label">Email Address</p>
            <input name="email" type="email" placeholder="your@email.com" required className="si-input" />
          </div>

          <div>
            <p className="si-label">Password</p>
            <input name="password" type="password" placeholder="Create a strong password" required
              className="si-input" value={password} onChange={(e) => {
                setPassword(e.target.value);
                setPasswordStrength(validatePassword(e.target.value));
              }} />
            {password && (
              <div style={{ marginTop:8, fontSize:12 }}>
                {([
                  [passwordStrength.length, "At least 8 characters"],
                  [passwordStrength.uppercase, "One uppercase letter"],
                  [passwordStrength.number, "One number"],
                  [passwordStrength.special, "One special character"],
                ]).map(([ok, label]) => (
                  <div key={label} style={{ color:ok?"#34d399":"rgba(255,255,255,0.35)",
                    display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                    <span>{ok ? "✓" : "○"}</span> {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="si-label">Confirm Password</p>
            <input name="confirmPassword" type="password" placeholder="Repeat your password" required
              className="si-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ borderColor: confirmPassword && confirmPassword !== password ? "#f87171" : undefined }} />
            {confirmPassword && confirmPassword !== password && (
              <p style={{ color:"#f87171", fontSize:12, marginTop:3 }}>Passwords do not match</p>
            )}
          </div>

          {/* Invited-user extra fields */}
          {!isPublic && (isTeacher || isStaff || isParent) && (
            <div>
              <p className="si-label">Phone Number</p>
              <input name="phone" type="tel" placeholder="+254 700 000 000" className="si-input" />
            </div>
          )}

          {/* ── Student fields ── */}
          {!isPublic && isStudent && (
            <>
              <p className="si-section">Student Information</p>
              <div className="si-row">
                <div><p className="si-label">Admission Number</p><input name="admissionNumber" placeholder="e.g. 62191" className="si-input" /></div>
                <div><p className="si-label">Stream / Class</p><input name="stream" placeholder="e.g. East" className="si-input" /></div>
              </div>
              {isCBC ? (
                <div><p className="si-label">Grade</p>
                  <select name="grade" className="si-input" style={{ cursor:"pointer" }} defaultValue="">
                    <option value="" disabled>Select grade</option>
                    {["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"].map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              ) : (
                <div><p className="si-label">Form</p>
                  <select name="form" className="si-input" style={{ cursor:"pointer" }} defaultValue="">
                    <option value="" disabled>Select form</option>
                    {["Form 1","Form 2","Form 3","Form 4"].map((fm) => <option key={fm} value={fm}>{fm}</option>)}
                  </select>
                </div>
              )}
              <div className="si-row">
                <div><p className="si-label">Date of Birth</p><input name="dateOfBirth" type="date" className="si-input" /></div>
                <div><p className="si-label">Year of Admission</p>
                  <input name="yearOfAdmission" type="number" placeholder={String(new Date().getFullYear())}
                    min="2000" max={String(new Date().getFullYear())} className="si-input" />
                </div>
              </div>
              <p className="si-section">Guardian / Emergency Contact</p>
              <div><p className="si-label">Guardian Name</p><input name="guardianName" placeholder="Parent or guardian full name" className="si-input" /></div>
              <div className="si-row">
                <div><p className="si-label">Guardian Phone</p><input name="guardianPhone" type="tel" placeholder="+254 700 000 000" className="si-input" /></div>
                <div><p className="si-label">Relation</p>
                  <select name="guardianRelation" className="si-input" style={{ cursor:"pointer" }} defaultValue="">
                    <option value="" disabled>Select</option>
                    {["Mother","Father","Guardian","Sibling","Other"].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ── Teacher fields ── */}
          {!isPublic && isTeacher && (
            <>
              <p className="si-section">Professional Details</p>
              <div className="si-row">
                <div><p className="si-label">Staff ID (optional)</p><input name="staffId" placeholder="e.g. T-042" className="si-input" /></div>
                <div><p className="si-label">Department</p><input name="department" placeholder="e.g. Sciences" className="si-input" /></div>
              </div>
              <div><p className="si-label">Subjects Taught (comma-separated)</p><input name="subjects" placeholder="e.g. Mathematics, Physics" className="si-input" /></div>
              <div><p className="si-label">Qualifications</p><input name="qualifications" placeholder="e.g. B.Ed Mathematics" className="si-input" /></div>
            </>
          )}

          {/* ── Staff fields ── */}
          {!isPublic && isStaff && (
            <>
              <p className="si-section">Staff Details</p>
              <div className="si-row">
                <div><p className="si-label">Staff ID (optional)</p><input name="staffId" placeholder="e.g. S-021" className="si-input" /></div>
                <div><p className="si-label">Position</p><input name="position" placeholder="e.g. Librarian" className="si-input" /></div>
              </div>
              <div><p className="si-label">Department</p><input name="department" placeholder="e.g. Administration" className="si-input" /></div>
            </>
          )}

          {/* ── Parent fields ── */}
          {!isPublic && isParent && (
            <>
              <p className="si-section">About Your Child(ren)</p>
              <div>
                <p className="si-label">Child Admission Numbers (comma-separated, optional)</p>
                <input name="admissionNumbers" placeholder="e.g. 62191, 64121" className="si-input" />
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>
                  Leave blank if unknown — the school will link your account later.
                </p>
              </div>
              <div><p className="si-label">Occupation (optional)</p><input name="occupation" placeholder="e.g. Teacher" className="si-input" /></div>
            </>
          )}

          <button className="si-btn" type="submit" disabled={!formValid || status === "Creating account..."}>
            {status === "Creating account..." ? "Creating…" : "Create Account"}
          </button>
        </form>

        {status && status !== "Creating account..." && (
          <p style={{ marginTop:14, padding:"10px 14px", borderRadius:8,
            background: status.includes("✓") ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
            color: status.includes("✓") ? "#34d399" : "#f87171",
            border: `1px solid ${status.includes("✓") ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
            textAlign:"center", fontSize:14, fontWeight:500 }}>
            {status}
          </p>
        )}

        <p style={{ textAlign:"center", marginTop:18, color:"rgba(167,243,208,0.6)", fontSize:14 }}>
          Already have an account?{" "}
          <button type="button" onClick={() => navigate && navigate("login")}
            style={{ background:"none", border:"none", color:"#34d399", fontWeight:600,
              cursor:"pointer", fontSize:14, padding:0, textDecoration:"underline" }}>
            Sign in
          </button>
        </p>
      </section>
    </div>
  );
}
