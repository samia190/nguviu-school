// utils/email.js
import nodemailer from "nodemailer";

export async function sendEmail(to, subject, text, html) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(`Email not configured — SMTP_USER and SMTP_PASS must be set in environment (SMTP_USER=${user || 'missing'})`);
  }

  // Create transporter per-call so env vars are always current
  // (safe on Render — nodemailer reuses the TCP connection internally)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass }
  });

  // Gmail requires From address to match the authenticated user
  const from = process.env.SMTP_FROM || user;

  const info = await transporter.sendMail({ from, to, subject, text, html });
  console.log(`[email] sent to ${to} — messageId: ${info.messageId}`);
  return info;
}
