import { writeFileSync } from "fs";

const content = `import React, { useState, useEffect } from "react";
import { post, saveToken } from "../utils/api";
import OptimizedImage from "./OptimizedImage";

const API_BASE = import.meta.env.VITE_API_URL || "";

const LINK_TYPE_LABELS = {
  "student-CBE": "Student (CBE Curriculum)",
  "student-844": "Student (8-4-4 Curriculum)",
  "teacher": "Teacher",
  "staff": "Staff Member",
  "parent": "Parent / Guardian",
};

export default function SignUp({ onAuth, navigate }) {
  const [inviteToken, setInviteToken] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({ length:false,uppercase:false,number:false,special:false,isValid:false });
  const [status, setStatus] = useState("");
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const totalImages = 4;

  // Validate invite token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (!token) {
      setInviteError("No invite link found. Please use a valid invite link to register.");
      setInviteLoading(false);
      return;
    }
    setInviteToken(token);
    fetch(\`\${API_BASE}/api/invite/validate/\${encodeURIComponent(token)}\`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.valid) {
          setInviteError(data.error || "This invite link is invalid or has expired.");
        } else {
          setInviteInfo({ linkType: data.linkType, role: data.role, label: data.label });
        }
      })
      .catch(() => setInviteError("Could not validate this invite link. Please try again later."))
      .finally(() => setInviteLoading(false));
  }, []);

  const validatePassword = (pwd) => {
    const r = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()\\-_=+[\\]{};:'"\\\\|,.<>/?]/.test(pwd),
      isValid: false,
    };
    r.isValid = r.length && r.uppercase && r.number && r.special;
    return r;
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(validatePassword(pwd));
  };

  const handleImageLoad = () => {
    setLoadedCount((prev) => {
      const n = prev + 1;
      if (n === totalImages) setTimeout(() => setImagesLoaded(true), 100);
      return n;
    });
  };

  useEffect(() => {
    [
      "https://res.cloudinary.com/ddm1dgws8/image/upload/w_400,q_auto,f_auto/kangaru/IMG_1641.JPG",
      "https://res.cloudinary.com/ddm1dgws8/image/upload/w_400,q_auto,f_auto/kangaru/IMG_1651.JPG",
      "https://res.cloudinary.com/ddm1dgws8/image/upload/w_400,q_auto,f_auto/kangaru/IMG_1424.JPG",
      "https://res.cloudinary.com/ddm1dgws8/image/upload/w_400,q_auto,f_auto/kangaru/student_7.JPG",
    ].forEach((src) => { const i = new Image(); i.src = src; });
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!inviteInfo || !inviteToken) return;
    const f = Object.fromEntries(new FormData(e.target));
    if (f.password !== f.confirmPassword) { setStatus("Passwords do not match"); return; }
    setStatus("Creating account...");
    try {
      const payload = {
        name: f.name, email: f.email, password: f.password, inviteToken,
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
        setStatus("Account created!");
        e.target.reset();
      } else {
        setStatus("Failed to create account. Please try again.");
      }
    } catch (err) {
      setStatus(err.message || "Registration failed");
    }
  }

  const wrapperStyle = {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)",
    padding: "20px", position: "relative", overflow: "hidden",
  };
  const cardBase = {
    background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)",
    borderRadius: "24px", padding: "44px 40px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)", width: "100%",
    position: "relative", zIndex: 1, border: "1px solid rgba(255,255,255,0.3)",
    maxHeight: "90vh", overflowY: "auto",
  };

  if (inviteLoading) {
    return (
      <div style={wrapperStyle}>
        <div style={{ ...cardBase, maxWidth: 400 }}>
          <p style={{ textAlign: "center", color: "#64748b", fontSize: 16 }}>Validating invite link\u2026</p>
        </div>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div style={wrapperStyle}>
        <div style={{ ...cardBase, maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>\uD83D\uDD12</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
              Registration Restricted
            </h2>
            <p style={{ color: "#ef4444", fontSize: 15, lineHeight: 1.6 }}>{inviteError}</p>
          </div>
          <p style={{ textAlign: "center", color: "#64748b", fontSize: 14, marginTop: 16 }}>
            Contact the school administration to receive a valid invite link.
          </p>
          <p style={{ textAlign: "center", marginTop: 20, fontSize: 14 }}>
            Already have an account?{" "}
            <button type="button" onClick={() => navigate && navigate("login")}
              style={{ background: "none", border: "none", color: "#f5576c", fontWeight: 600, cursor: "pointer", fontSize: 14, padding: 0 }}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  const { linkType } = inviteInfo;
  const isStudent = linkType === "student-CBE" || linkType === "student-844";
  const isCBE = linkType === "student-CBE";
  const isTeacher = linkType === "teacher";
  const isStaff = linkType === "staff";
  const isParent = linkType === "parent";
  const formValid = passwordStrength.isValid && confirmPassword === password && confirmPassword.length > 0;

  return (
    <div style={wrapperStyle}>
      {/* Background blobs */}
      <div style={{ position:"absolute",top:"-10%",left:"-5%",width:500,height:500,borderRadius:"50%",background:"rgba(255,255,255,0.1)",filter:"blur(60px)",animation:"float 8s ease-in-out infinite" }} />
      <div style={{ position:"absolute",bottom:"-10%",right:"-5%",width:400,height:400,borderRadius:"50%",background:"rgba(255,255,255,0.1)",filter:"blur(60px)",animation:"float 6s ease-in-out infinite reverse" }} />

      {/* Decorative images */}
      <div className="auth-shape" style={{ position:"absolute",top:"12%",right:"7%",width:170,height:170,borderRadius:"40% 60% 60% 40% / 60% 40% 60% 40%",overflow:"hidden",border:"4px solid rgba(255,255,255,0.3)",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",animation:"slideIn 17s infinite",opacity:imagesLoaded?1:0,transition:"opacity 1.5s ease-in-out" }}>
        <OptimizedImage src="https://res.cloudinary.com/ddm1dgws8/image/upload/w_400,q_auto,f_auto/kangaru/IMG_1641.JPG" alt="Student" priority onLoad={handleImageLoad} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
      </div>
      <div className="auth-shape" style={{ position:"absolute",bottom:"18%",right:"8%",width:150,height:150,borderRadius:"50%",overflow:"hidden",border:"4px solid rgba(255,255,255,0.3)",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",animation:"slideIn 19s infinite 3s",opacity:imagesLoaded?1:0,transition:"opacity 1.8s ease-in-out 0.3s" }}>
        <OptimizedImage src="https://res.cloudinary.com/ddm1dgws8/image/upload/w_400,q_auto,f_auto/kangaru/IMG_1651.JPG" alt="Student" priority onLoad={handleImageLoad} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
      </div>
      <div className="auth-shape" style={{ position:"absolute",top:"18%",left:"5%",width:145,height:145,borderRadius:"25px",overflow:"hidden",border:"4px solid rgba(255,255,255,0.3)",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",transform:"rotate(-12deg)",animation:"slideIn 21s infinite 5s",opacity:imagesLoaded?1:0,transition:"opacity 2s ease-in-out 0.6s" }}>
        <OptimizedImage src="https://res.cloudinary.com/ddm1dgws8/image/upload/w_400,q_auto,f_auto/kangaru/IMG_1424.JPG" alt="Student" priority onLoad={handleImageLoad} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
      </div>
      <div className="auth-shape" style={{ position:"absolute",bottom:"22%",left:"8%",width:130,height:130,borderRadius:"30% 70% 70% 30% / 40% 40% 60% 60%",overflow:"hidden",border:"4px solid rgba(255,255,255,0.3)",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",animation:"slideIn 15s infinite 7s",opacity:imagesLoaded?1:0,transition:"opacity 1.5s ease-in-out" }}>
        <OptimizedImage src="https://res.cloudinary.com/ddm1dgws8/image/upload/w_400,q_auto,f_auto/kangaru/student_7.JPG" alt="Student" priority onLoad={handleImageLoad} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
      </div>

      <style>{\`
        @keyframes float { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-20px) translateX(20px)} }
        @keyframes slideIn { 0%{opacity:0;transform:scale(.8) rotate(0)} 10%{opacity:1;transform:scale(1) rotate(5deg)} 90%{opacity:1;transform:scale(1) rotate(-5deg)} 100%{opacity:0;transform:scale(.8) rotate(0)} }
        .si-input { width:100%; padding:11px 15px; border:2px solid rgba(0,0,0,0.12); border-radius:10px; background:#fff; font-size:14px; transition:all 0.25s; outline:none; box-sizing:border-box; }
        .si-input:focus { border-color:#f5576c; box-shadow:0 0 0 3px rgba(245,87,108,0.12); }
        .si-input::placeholder { color:#a0aec0; }
        .si-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .si-btn { width:100%; padding:13px; border:none; border-radius:12px; background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%); color:#fff; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.3s; box-shadow:0 4px 15px rgba(245,87,108,0.4); }
        .si-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 20px rgba(245,87,108,0.6); }
        .si-btn:disabled { opacity:.55; cursor:not-allowed; }
        .si-label { font-size:12px; font-weight:600; color:#64748b; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.4px; }
        .si-section { font-size:12px; font-weight:700; color:#f5576c; border-bottom:2px solid #fee2e2; padding-bottom:3px; margin:6px 0 2px; text-transform:uppercase; letter-spacing:0.5px; }
      \`}</style>

      <section style={{ ...cardBase, maxWidth: isStudent ? 500 : 460 }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ display:"inline-block", padding:"6px 16px", borderRadius:20, background:"linear-gradient(135deg,#f093fb20,#f5576c20)", marginBottom:8 }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#f5576c", textTransform:"uppercase", letterSpacing:1 }}>
              {LINK_TYPE_LABELS[linkType] || "Register"}
            </span>
          </div>
          <h2 style={{ fontSize:26, fontWeight:700, background:"linear-gradient(135deg,#f093fb,#f5576c)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:4 }}>
            Create Account
          </h2>
          {inviteInfo.label && <p style={{ color:"#64748b", fontSize:13 }}>{inviteInfo.label}</p>}
        </div>

        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <p className="si-section">Account Details</p>

          <div><p className="si-label">Full Name</p><input name="name" placeholder="Enter your full name" required className="si-input" /></div>
          <div><p className="si-label">Email Address</p><input name="email" type="email" placeholder="your@email.com" required className="si-input" /></div>

          <div>
            <p className="si-label">Password</p>
            <input name="password" type="password" placeholder="Create a strong password" required className="si-input" value={password} onChange={handlePasswordChange} />
            {password && (
              <div style={{ marginTop:8, fontSize:12 }}>
                {[
                  [passwordStrength.length, "At least 8 characters"],
                  [passwordStrength.uppercase, "One uppercase letter"],
                  [passwordStrength.number, "One number"],
                  [passwordStrength.special, "One special character"],
                ].map(([ok, label]) => (
                  <div key={label} style={{ color:ok?"#16a34a":"#94a3b8", display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                    <span>{ok ? "\u2713" : "\u25CB"}</span> {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="si-label">Confirm Password</p>
            <input name="confirmPassword" type="password" placeholder="Repeat your password" required className="si-input"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ borderColor: confirmPassword && confirmPassword !== password ? "#ef4444" : undefined }} />
            {confirmPassword && confirmPassword !== password && (
              <p style={{ color:"#ef4444", fontSize:12, marginTop:3 }}>Passwords do not match</p>
            )}
          </div>

          {(isTeacher || isStaff || isParent) && (
            <div><p className="si-label">Phone Number</p><input name="phone" type="tel" placeholder="+254 700 000 000" className="si-input" /></div>
          )}

          {/* Student fields */}
          {isStudent && (
            <>
              <p className="si-section">Student Information</p>
              <div className="si-row">
                <div><p className="si-label">Admission Number</p><input name="admissionNumber" placeholder="e.g. 62191" className="si-input" /></div>
                <div><p className="si-label">Stream / Class</p><input name="stream" placeholder="e.g. East" className="si-input" /></div>
              </div>
              {isCBE ? (
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
                    {["Form 1","Form 2","Form 3","Form 4"].map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}
              <div className="si-row">
                <div><p className="si-label">Date of Birth</p><input name="dateOfBirth" type="date" className="si-input" /></div>
                <div><p className="si-label">Year of Admission</p><input name="yearOfAdmission" type="number" placeholder={String(new Date().getFullYear())} min="2000" max={String(new Date().getFullYear())} className="si-input" /></div>
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

          {/* Teacher fields */}
          {isTeacher && (
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

          {/* Staff fields */}
          {isStaff && (
            <>
              <p className="si-section">Staff Details</p>
              <div className="si-row">
                <div><p className="si-label">Staff ID (optional)</p><input name="staffId" placeholder="e.g. S-021" className="si-input" /></div>
                <div><p className="si-label">Position</p><input name="position" placeholder="e.g. Librarian" className="si-input" /></div>
              </div>
              <div><p className="si-label">Department</p><input name="department" placeholder="e.g. Administration" className="si-input" /></div>
            </>
          )}

          {/* Parent fields */}
          {isParent && (
            <>
              <p className="si-section">About Your Child(ren)</p>
              <div>
                <p className="si-label">Child Admission Numbers (comma-separated, optional)</p>
                <input name="admissionNumbers" placeholder="e.g. 62191, 64121" className="si-input" />
                <p style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>
                  Leave blank if unknown \u2014 the school will link your account later.
                </p>
              </div>
              <div><p className="si-label">Occupation (optional)</p><input name="occupation" placeholder="e.g. Teacher" className="si-input" /></div>
            </>
          )}

          <button className="si-btn" type="submit" disabled={!formValid || status === "Creating account..."}>
            {status === "Creating account..." ? "Creating\u2026" : "Create Account"}
          </button>
        </form>

        {status && status !== "Creating account..." && (
          <p style={{ marginTop:14, padding:"10px 14px", borderRadius:8,
            background: status.includes("!") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            color: status.includes("!") ? "#16a34a" : "#dc2626",
            textAlign:"center", fontSize:14, fontWeight:500 }}>
            {status}
          </p>
        )}

        <p style={{ textAlign:"center", marginTop:18, color:"#64748b", fontSize:14 }}>
          Already have an account?{" "}
          <button type="button" onClick={() => navigate && navigate("login")}
            style={{ background:"none", border:"none", color:"#f5576c", fontWeight:600, cursor:"pointer", fontSize:14, padding:0 }}>
            Sign in
          </button>
        </p>
      </section>
    </div>
  );
}
`;

writeFileSync("kscfrontend/src/components/SignUp.jsx", content, "utf8");
console.log("SignUp.jsx written successfully");
