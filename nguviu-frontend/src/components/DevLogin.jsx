import React from "react";

export default function DevLogin() {
  async function doLogin() {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nguviu@yahoo.com", password: "girls@nguviu" }),
      });
      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();
      const token = data.token;
      // dispatch event so App listens and sets user+route
      window.dispatchEvent(new CustomEvent("nguviu:dev-login", { detail: { token } }));
    } catch (err) {
      alert(err.message || "Dev login failed");
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <h3>Dev Auto-Login</h3>
      <p style={{ marginTop: 6 }}>Click to auto-login as `nguviu@yahoo.com` (dev only).</p>
      <button onClick={doLogin} style={{ marginTop: 8 }}>Auto-login as nguviu@yahoo.com</button>
    </div>
  );
}
