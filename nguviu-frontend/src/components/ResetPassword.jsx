import React, { useState, useEffect } from "react";
import { post } from "../utils/api";
import { useLocation, useNavigate } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPassword() {
  const q = useQuery();
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    setEmail(q.get("email") || "");
    setToken(q.get("token") || "");
  }, [q]);

  async function submit(e) {
    e.preventDefault();
    const password = new FormData(e.target).get("password");
    setStatus("Resetting...");
    try {
      await post("/api/auth/reset-password", { email, token, password });
      setStatus("Password reset. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setStatus(err.message || "Error");
    }
  }

  return (
    <section style={{ maxWidth: 480 }}>
      <h2>Reset password</h2>
      <form onSubmit={submit}>
        <input name="email" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="form-input" />
        <input name="password" type="password" placeholder="New password" required className="form-input" />
        <button className="btn" type="submit">Set new password</button>
      </form>
      <p>{status}</p>
    </section>
  );
}
