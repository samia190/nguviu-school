// utils/email.js
import nodemailer from "nodemailer";

export async function sendEmail(to, subject, text, html) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(`Email not configured — SMTP_USER and SMTP_PASS must be set (SMTP_USER=${user || 'missing'})`);
  }

  console.log(`[email] Attempting send to ${to} via ${user}`);

  // Use nodemailer's built-in 'gmail' service config:
  // - port 465, secure SSL (avoids port 587 which cloud providers often block)
  // - Gmail app password auth (not OAuth2)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    // Give up after 20s — Gmail on cloud can be slow on first connection
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
  });

  // Gmail requires From to match the authenticated account
  const from = process.env.SMTP_FROM || user;

  const info = await transporter.sendMail({ from, to, subject, text, html });
  console.log(`[email] sent to ${to} — messageId: ${info.messageId}`);
  return info;
}
