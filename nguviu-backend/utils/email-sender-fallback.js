// utils/email-sender-fallback.js
// tries to use nodemailer if env SMTP vars present, otherwise fallback to console
const nodemailer = require("nodemailer");

let transporter;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true" || false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendEmail(to, subject, text, html) {
  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html
    });
    return;
  }
  // fallback
  console.log("sendEmail fallback:", { to, subject, text, html });
}

module.exports = { sendEmail };
