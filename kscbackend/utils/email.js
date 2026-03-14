// utils/email.js
import nodemailer from "nodemailer";

export async function sendEmail(to, subject, text, html) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(`Email not configured — SMTP_USER and SMTP_PASS must be set (SMTP_USER=${user || 'missing'})`);
  }

  const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.SMTP_PORT || 587);
  console.log(`[email] Connecting to ${host}:${port} as ${user}`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false, // STARTTLS on 587
    auth: { user, pass },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
  });

  const from = process.env.SMTP_FROM || user;
  const info = await transporter.sendMail({ from, to, subject, text, html });
  console.log(`[email] sent to ${to} — messageId: ${info.messageId}`);
  return info;
}
