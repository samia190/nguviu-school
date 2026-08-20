import{j as e,O as u,p as P}from"./index-C7bSz-xB.js";import{b as o}from"./vendor-charts-BtUOuRpl.js";import"./vendor-react-DldvXD6N.js";import"./vendor-pdf-Cs2EITz6.js";function z({navigate:x}){const[r,b]=o.useState(""),[g,m]=o.useState(""),[s,i]=o.useState(""),[h,f]=o.useState(""),[n,w]=o.useState(""),[d,y]=o.useState(!1),[k,j]=o.useState(0),v=4,l=()=>{j(a=>{const t=a+1;return t===v&&setTimeout(()=>y(!0),100),t})};o.useEffect(()=>{["/images/students/IMG_0778.JPG","/images/students/IMG_1194.JPG","/images/students/IMG_1221.JPG","/images/students/std 2.JPG"].forEach(t=>{const p=new Image;p.src=t;const c=t.replace(/\.(jpe?g|png)$/i,".webp"),I=new Image;I.src=c})},[]),o.useEffect(()=>{const a=window.location.hash.replace(/^#/,""),t=new URLSearchParams(a),p=t.get("token"),c=t.get("email");p&&c?(f(p),w(decodeURIComponent(c))):i("Invalid reset link")},[]);async function S(a){if(a.preventDefault(),r!==g){i("Passwords do not match");return}if(r.length<8){i("Password must be at least 8 characters");return}i("Resetting password...");try{const t=await P("/api/auth/reset-password",{email:n,token:h,newPassword:r});i(t.message||"Password reset successfully!"),setTimeout(()=>{x?x("login"):window.location.hash="#/login"},2e3)}catch(t){i(t.message||"Failed to reset password")}}return e.jsxs("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",padding:"20px",position:"relative",overflow:"hidden"},children:[e.jsx("div",{style:{position:"absolute",top:"-10%",right:"-5%",width:"500px",height:"500px",borderRadius:"50%",background:"rgba(255, 255, 255, 0.1)",filter:"blur(60px)",animation:"float 8s ease-in-out infinite"}}),e.jsx("div",{style:{position:"absolute",bottom:"-10%",left:"-5%",width:"400px",height:"400px",borderRadius:"50%",background:"rgba(255, 255, 255, 0.1)",filter:"blur(60px)",animation:"float 6s ease-in-out infinite reverse"}}),e.jsx("div",{className:"auth-shape",style:{position:"absolute",top:"10%",right:"8%",width:"180px",height:"180px",borderRadius:"50%",overflow:"hidden",border:"4px solid rgba(255, 255, 255, 0.3)",boxShadow:"0 8px 32px rgba(0, 0, 0, 0.2)",animation:"slideIn 15s infinite",opacity:d?1:0,transition:"opacity 1.5s ease-in-out"},children:e.jsx(u,{src:"/images/students/IMG_0778.JPG",alt:"Student",priority:!0,onLoad:l,style:{width:"100%",height:"100%",objectFit:"cover"}})}),e.jsx("div",{className:"auth-shape",style:{position:"absolute",bottom:"15%",right:"5%",width:"140px",height:"140px",borderRadius:"30% 70% 70% 30% / 30% 30% 70% 70%",overflow:"hidden",border:"4px solid rgba(255, 255, 255, 0.3)",boxShadow:"0 8px 32px rgba(0, 0, 0, 0.2)",animation:"slideIn 18s infinite 2s",opacity:d?1:0,transition:"opacity 1.8s ease-in-out 0.3s"},children:e.jsx(u,{src:"/images/students/IMG_1194.JPG",alt:"Student",priority:!0,onLoad:l,style:{width:"100%",height:"100%",objectFit:"cover"}})}),e.jsx("div",{className:"auth-shape",style:{position:"absolute",top:"20%",left:"6%",width:"160px",height:"160px",borderRadius:"20px",overflow:"hidden",border:"4px solid rgba(255, 255, 255, 0.3)",boxShadow:"0 8px 32px rgba(0, 0, 0, 0.2)",transform:"rotate(15deg)",animation:"slideIn 20s infinite 4s",opacity:d?1:0,transition:"opacity 2s ease-in-out 0.6s"},children:e.jsx(u,{src:"/images/students/IMG_1221.JPG",alt:"Student",priority:!0,onLoad:l,style:{width:"100%",height:"100%",objectFit:"cover"}})}),e.jsx("div",{className:"auth-shape",style:{position:"absolute",bottom:"25%",left:"10%",width:"120px",height:"120px",borderRadius:"50%",overflow:"hidden",border:"4px solid rgba(255, 255, 255, 0.3)",boxShadow:"0 8px 32px rgba(0, 0, 0, 0.2)",animation:"slideIn 16s infinite 6s",opacity:d?1:0,transition:"opacity 2.2s ease-in-out 0.9s"},children:e.jsx(u,{src:"/images/students/std 2.JPG",alt:"Student",priority:!0,onLoad:l,style:{width:"100%",height:"100%",objectFit:"cover"}})}),e.jsx("style",{children:`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(20px); }
        }
        @keyframes slideIn {
          0% { opacity: 0; transform: scale(0.8) rotate(0deg); }
          10% { opacity: 1; transform: scale(1) rotate(5deg); }
          90% { opacity: 1; transform: scale(1) rotate(-5deg); }
          100% { opacity: 0; transform: scale(0.8) rotate(0deg); }
        }
        .classic-input {
          width: 100%;
          padding: 14px 18px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.95);
          font-size: 15px;
          transition: all 0.3s ease;
          outline: none;
        }
        .classic-input:focus {
          border-color: #667eea;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }
        .classic-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .classic-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        .classic-btn:active {
          transform: translateY(0);
        }
        .classic-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}),e.jsxs("section",{style:{background:"rgba(255, 255, 255, 0.95)",backdropFilter:"blur(20px)",borderRadius:"24px",padding:"48px 40px",boxShadow:"0 20px 60px rgba(0, 0, 0, 0.3)",maxWidth:"440px",width:"100%",position:"relative",zIndex:1,border:"1px solid rgba(255, 255, 255, 0.3)"},children:[e.jsxs("div",{style:{textAlign:"center",marginBottom:"32px"},children:[e.jsx("h2",{style:{fontSize:"32px",fontWeight:"700",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:"8px"},children:"Reset Password"}),e.jsx("p",{style:{color:"#64748b",fontSize:"15px"},children:"Enter your new password"}),n&&e.jsxs("p",{style:{color:"#667eea",fontSize:"14px",marginTop:"8px",fontWeight:"500"},children:["for ",n]})]}),e.jsxs("form",{onSubmit:S,style:{display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsx("input",{type:"password",placeholder:"New Password",value:r,onChange:a=>b(a.target.value),required:!0,minLength:"6",className:"classic-input"}),e.jsx("input",{type:"password",placeholder:"Confirm New Password",value:g,onChange:a=>m(a.target.value),required:!0,minLength:"6",className:"classic-input"}),e.jsx("button",{className:"classic-btn",type:"submit",disabled:!h||!n,children:"Reset Password"})]}),s&&e.jsx("p",{style:{marginTop:"20px",padding:"12px",borderRadius:"8px",background:s.includes("Failed")||s.includes("Invalid")||s.includes("do not match")||s.includes("expired")?"rgba(239, 68, 68, 0.1)":"rgba(34, 197, 94, 0.1)",color:s.includes("Failed")||s.includes("Invalid")||s.includes("do not match")||s.includes("expired")?"#dc2626":"#16a34a",textAlign:"center",fontSize:"14px",fontWeight:"500"},children:s}),e.jsxs("p",{style:{textAlign:"center",marginTop:"24px",color:"#64748b",fontSize:"14px"},children:["Remember your password? ",e.jsx("a",{href:"#/login",style:{color:"#667eea",fontWeight:"600",textDecoration:"none"},children:"Back to login"})]})]})]})}export{z as default};
