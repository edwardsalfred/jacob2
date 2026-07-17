// Vercel serverless function — sends contact-form submissions via Resend.
// Requires the RESEND_API_KEY environment variable (see RESEND_SETUP.md).

const TO_EMAIL = "Jacob@jacob1k.com";
const FROM_EMAIL = "Jacob1K Website <jacob@jacob1k.com>";
const MAX_MESSAGE_LENGTH = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  const { name, email, message, company } = req.body || {};

  // Honeypot: a hidden field real visitors never fill in. Bots that fill
  // every field trip this, and we silently no-op instead of sending mail.
  if (company) {
    return res.status(200).json({ ok: true });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: "Name, email, and message are required." });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
  }
  if (String(message).length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ ok: false, error: "Message is too long." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return res.status(500).json({ ok: false, error: "Email service isn't configured yet." });
  }

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `New booking inquiry from ${name}`,
        text: `${message}\n\n— ${name} (${email})`,
        html: `<div style="font-family:sans-serif;line-height:1.6;color:#111">
          <p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}) sent a message from the Jacob1K site:</p>
          <p style="white-space:pre-wrap;border-left:3px solid #16f584;padding-left:12px;margin-left:0">${escapeHtml(message)}</p>
        </div>`,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("Resend API error:", resendRes.status, errBody);
      return res.status(502).json({ ok: false, error: "Failed to send message. Please try again." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact form send failed:", err);
    return res.status(500).json({ ok: false, error: "Failed to send message. Please try again." });
  }
};
