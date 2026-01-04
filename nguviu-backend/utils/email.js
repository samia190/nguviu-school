// utils/email.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || ""
  }
});

async function sendEmail(to, subject, text, html) {
  const from = process.env.SMTP_FROM || `no-reply@${(process.env.SMTP_HOST || "example.com").replace(/^smtp\./, "")}`;
  const msg = {
    from,
    to,
    subject,
    text,
    html
  };
  const info = await transporter.sendMail(msg);
  console.log("Email sent:", info.messageId);
  return info;
}

module.exports = { sendEmail };
