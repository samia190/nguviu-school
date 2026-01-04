import React, { useState } from "react";
import { post, saveToken } from "../utils/api";
import PageBackground from "../components/PageBackground"; // ✅ ADDED


export default function SignUp({ onAuth }) {
  const [status, setStatus] = useState("");

  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    setStatus("Creating...");
    try {
      const payload = {
        name: f.name,
        email: f.email,
        password: f.password,
        role: f.role || "user"
      };
      const data = await post("/api/auth/register", payload);

      if (data && data.token) {
        saveToken(data.token);
        onAuth && onAuth(data.user);
        setStatus("Created");
        e.target.reset();
      } else {
        setStatus("Failed to create account");
      }
    } catch (err) {
      setStatus(err.message || "Error");
    }
  }

  return (
    // ✅ WRAPPED WITH ADMIN-CONTROLLED BACKGROUND
    <PageBackground page="signup">
      <section className="auth-card">
        <h2>Sign Up</h2>

        <form onSubmit={submit} className="grid" style={{ maxWidth: 420 }}>
          <input
            name="name"
            placeholder="Full name"
            required
            className="form-input"
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="form-input"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="form-input"
          />

          <select
            name="role"
            required
            className="form-input"
            defaultValue="user"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="staff">Staff</option>
          </select>

          <button className="btn" type="submit">
            Sign Up
          </button>
        </form>

        <p>{status}</p>
      </section>
    </PageBackground>
  );
}
