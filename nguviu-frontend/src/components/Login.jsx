import React, { useState, useEffect } from "react";
import { post, get } from "../utils/api";
import PageBackground from "../components/PageBackground";

export default function Login({ onAuth, navigate }) {
  const [status, setStatus] = useState("");
  const [remember, setRemember] = useState(false);

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
        navigate("/admin/dashboard");
        break;
      case "teacher":
        navigate("/teacher/dashboard");
        break;
      case "student":
        navigate("/student/dashboard");
        break;
      case "staff":
        navigate("/staff/dashboard");
        break;
      default:
        navigate("/");
    }
  }

  return (
    <PageBackground page="login">
      <section className="auth-card">
        <h2>Login</h2>

        <form onSubmit={submit} className="grid">
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

          <select name="role" required className="form-input">
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="staff">Staff</option>
          </select>

          {/* REMEMBER ME */}
          <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>

          <button className="btn" type="submit">
            Login
          </button>
        </form>

        <p>{status}</p>
      </section>
    </PageBackground>
  );
}
