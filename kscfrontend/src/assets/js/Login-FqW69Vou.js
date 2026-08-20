import{j as e,p as x}from"./index-C7bSz-xB.js";import{b as l}from"./vendor-charts-BtUOuRpl.js";import"./vendor-react-DldvXD6N.js";import"./vendor-pdf-Cs2EITz6.js";function w(o){return o?.status?o.status===401?"Incorrect email or password. Please try again.":o.status===400?o.body?.error||"Please enter both your email and password.":o.status===429?"Too many attempts. Please wait a moment before trying again.":o.status>=500?"Server error. Please try again in a moment.":o.body?.error||"Login failed. Please try again.":"Cannot connect to server. Please check your internet connection and try again."}function P({onAuth:o,navigate:i}){const[n,d]=l.useState(""),[f,b]=l.useState(!1),[m,c]=l.useState(!1),[u,g]=l.useState(""),[p,a]=l.useState("");async function h(t){t.preventDefault();const r=Object.fromEntries(new FormData(t.target));r.identifier&&(r.identifier=r.identifier.trim()),d("Logging in...");try{const s=await x("/api/auth/login",r);s&&s.token?((f?localStorage:sessionStorage).setItem("token",s.token),o&&o(s.user),d("Logged in"),y(s.user.role),t.target.reset()):d("Login failed")}catch(s){d(w(s))}}function y(t){if(i)switch(t){case"admin":i("admin");break;case"teacher":i("teacher");break;case"student":i("student");break;case"staff":i("staff");break;default:i("home")}}async function k(t){t.preventDefault(),a("Sending reset link...");try{const r=await x("/api/auth/forgot-password",{identifier:u});a(r.message||"Password reset link sent to your email!"),setTimeout(()=>{c(!1),g(""),a("")},3e3)}catch(r){r?.status?r.status>=500?a("Server error. Please try again in a moment."):a(r.body?.error||"Failed to send reset link. Please try again."):a("Cannot connect to server. Please check your internet connection.")}}return e.jsxs("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",padding:"20px",position:"relative",overflow:"hidden"},children:[e.jsx("style",{children:`
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
      `}),[200,340,480,620].map((t,r)=>e.jsx("div",{style:{position:"absolute",width:t,height:t,borderRadius:"50%",border:`1.5px solid rgba(${r%2===0?"102,126,234":"118,75,162"},${.18-r*.03})`,top:"50%",left:"50%",transform:"translate(-50%,-50%)",animation:`${r%2===0?"login-spin":"login-counter-spin"} ${22+r*8}s linear infinite`,pointerEvents:"none"}},r)),[{size:180,top:"8%",left:"6%",color:"102,126,234",dur:"9s",delay:"0s"},{size:120,top:"72%",left:"4%",color:"118,75,162",dur:"13s",delay:"2s"},{size:90,top:"15%",left:"82%",color:"79,209,197",dur:"11s",delay:"1s"},{size:140,top:"65%",left:"76%",color:"102,126,234",dur:"15s",delay:"3s"},{size:70,top:"42%",left:"90%",color:"240,147,251",dur:"7s",delay:"0.5s"},{size:50,top:"88%",left:"55%",color:"118,75,162",dur:"10s",delay:"4s"}].map((t,r)=>e.jsx("div",{className:"login-particle",style:{width:t.size,height:t.size,top:t.top,left:t.left,background:`radial-gradient(circle, rgba(${t.color},0.22) 0%, rgba(${t.color},0) 70%)`,animation:`login-drift ${t.dur} ease-in-out infinite ${t.delay}`,filter:"blur(2px)"}},r)),[{size:14,top:"18%",left:"20%",dur:"4s",delay:"0s"},{size:10,top:"34%",left:"88%",dur:"6s",delay:"1s"},{size:18,top:"78%",left:"15%",dur:"5s",delay:"2.5s"},{size:12,top:"58%",left:"92%",dur:"7s",delay:"0.5s"},{size:8,top:"90%",left:"38%",dur:"4.5s",delay:"3s"},{size:16,top:"12%",left:"60%",dur:"6.5s",delay:"1.5s"}].map((t,r)=>e.jsx("div",{style:{position:"absolute",width:t.size,height:t.size,top:t.top,left:t.left,background:"linear-gradient(135deg, #a78bfa, #60a5fa)",borderRadius:"3px",transform:"rotate(45deg)",animation:`login-pulse ${t.dur} ease-in-out infinite ${t.delay}`,boxShadow:"0 0 12px rgba(167,139,250,0.7)",pointerEvents:"none"}},r)),[0,60,120,180,240,300].map((t,r)=>e.jsx("div",{style:{position:"absolute",top:"50%",left:"50%",width:8,height:8,marginTop:-4,marginLeft:-4,borderRadius:"50%",background:r%2===0?"#818cf8":"#c084fc",boxShadow:`0 0 8px ${r%2===0?"#818cf8":"#c084fc"}`,"--r":"260px",animation:`login-orbit ${16+r*2}s linear infinite ${r*-2.5}s`,transformOrigin:"0 0",opacity:.55,pointerEvents:"none"}},r)),e.jsxs("section",{style:{background:"rgba(255, 255, 255, 0.97)",backdropFilter:"blur(24px)",borderRadius:"24px",padding:"48px 40px",boxShadow:"0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15)",maxWidth:"440px",width:"100%",position:"relative",zIndex:10},children:[e.jsxs("div",{style:{textAlign:"center",marginBottom:"28px"},children:[e.jsx("div",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",boxShadow:"0 8px 24px rgba(102,126,234,0.4)",marginBottom:14},children:e.jsxs("svg",{width:"30",height:"30",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("path",{d:"M12 3L1 9l11 6 9-4.91V17h2V9L12 3z",fill:"white",opacity:"0.9"}),e.jsx("path",{d:"M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z",fill:"white"})]})}),e.jsx("h2",{style:{fontSize:"28px",fontWeight:"700",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:"6px",marginTop:0},children:"Welcome Back"}),e.jsx("p",{style:{color:"#64748b",fontSize:"14px",margin:0},children:"Sign in to your Kangaru Girls account"})]}),e.jsxs("form",{onSubmit:h,style:{display:"flex",flexDirection:"column",gap:"16px"},children:[e.jsxs("div",{children:[e.jsx("label",{style:{display:"block",fontSize:"12px",fontWeight:600,color:"#64748b",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.4px"},children:"Email, Admission Number, or Staff ID"}),e.jsx("input",{name:"identifier",placeholder:"your@email.com, admission number, or staff ID",required:!0,className:"classic-input"})]}),e.jsxs("div",{children:[e.jsx("label",{style:{display:"block",fontSize:"12px",fontWeight:600,color:"#64748b",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.4px"},children:"Password"}),e.jsx("input",{name:"password",type:"password",placeholder:"Enter your password",required:!0,className:"classic-input"})]}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("label",{style:{display:"flex",gap:"8px",alignItems:"center",fontSize:"14px",color:"#64748b",cursor:"pointer"},children:[e.jsx("input",{type:"checkbox",checked:f,onChange:t=>b(t.target.checked),style:{width:"16px",height:"16px",cursor:"pointer",accentColor:"#667eea"}}),"Remember me"]}),e.jsx("button",{type:"button",onClick:()=>c(!0),style:{background:"none",border:"none",color:"#667eea",fontWeight:600,cursor:"pointer",fontSize:"13px",padding:0},children:"Forgot Password?"})]}),e.jsx("button",{className:"classic-btn",type:"submit",disabled:n==="Logging in...",children:n==="Logging in..."?"Signing in…":"Sign In"})]}),n&&e.jsx("p",{style:{marginTop:"16px",padding:"11px 14px",borderRadius:"10px",background:n.includes("failed")||n.includes("Error")||n.includes("Invalid")?"rgba(239,68,68,0.09)":"rgba(34,197,94,0.09)",color:n.includes("failed")||n.includes("Error")||n.includes("Invalid")?"#dc2626":"#16a34a",textAlign:"center",fontSize:"14px",fontWeight:500,margin:"16px 0 0"},children:n}),e.jsxs("p",{style:{textAlign:"center",marginTop:"20px",color:"#64748b",fontSize:"14px"},children:["Don't have an account?"," ",e.jsx("button",{type:"button",onClick:()=>i&&i("signup"),style:{background:"none",border:"none",color:"#667eea",fontWeight:600,cursor:"pointer",fontSize:"14px",padding:0},children:"Sign up"})]})]}),m&&e.jsx("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e3,padding:"20px"},onClick:()=>c(!1),children:e.jsxs("div",{style:{background:"#ffffff",borderRadius:"20px",padding:"40px",maxWidth:"420px",width:"100%",boxShadow:"0 25px 80px rgba(0,0,0,0.35)"},onClick:t=>t.stopPropagation(),children:[e.jsx("h3",{style:{fontSize:"22px",fontWeight:700,background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:"10px",textAlign:"center",marginTop:0},children:"Reset Password"}),e.jsx("p",{style:{color:"#64748b",fontSize:"14px",textAlign:"center",marginBottom:"24px"},children:"Enter your registered email, admission number, staff ID, or approved phone number. The reset link is sent only to the email held by the school office."}),e.jsxs("form",{onSubmit:k,style:{display:"flex",flexDirection:"column",gap:"16px"},children:[e.jsx("input",{placeholder:"Email, admission number, staff ID, or phone",value:u,onChange:t=>g(t.target.value),required:!0,className:"classic-input"}),e.jsxs("div",{style:{display:"flex",gap:"12px"},children:[e.jsx("button",{type:"button",onClick:()=>{c(!1),g(""),a("")},style:{flex:1,padding:"13px",border:"2px solid #e2e8f0",borderRadius:"12px",background:"white",color:"#64748b",fontSize:"15px",fontWeight:600,cursor:"pointer"},children:"Cancel"}),e.jsx("button",{type:"submit",className:"classic-btn",style:{flex:1},children:"Send Link"})]})]}),p&&e.jsx("p",{style:{marginTop:"16px",padding:"11px",borderRadius:"8px",background:p.includes("Failed")?"rgba(239,68,68,0.09)":"rgba(34,197,94,0.09)",color:p.includes("Failed")?"#dc2626":"#16a34a",textAlign:"center",fontSize:"14px",fontWeight:500},children:p})]})})]})}export{P as default};
