// utils/email.js — uses Resend HTTP API (no SMTP, works from any cloud provider)
// Docs: https://resend.com/docs/api-reference/emails/send-email

export async function sendEmail(to, subject, text, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Email not configured — RESEND_API_KEY must be set in environment");
  }

  // from must be a verified sender on Resend.
  // Until you verify a domain, use: onboarding@resend.dev (sends only to your own account email)
  // After verifying a domain: "Kangaru Girls School <noreply@yourdomain.com>"
  const from = process.env.SMTP_FROM || "Kangaru Girls School <onboarding@resend.dev>";

  console.log(`[email] Sending via Resend to ${to}`);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to, subject, text, html })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${data?.message || JSON.stringify(data)}`);
  }

  console.log(`[email] sent to ${to} — id: ${data.id}`);
  return data;
}

