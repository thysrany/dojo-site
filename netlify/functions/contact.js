// ============================================================
// netlify/functions/contact.js
//
// Receives the contact form POST from js/main.js and sends it
// as an email through Resend (https://resend.com).
//
// Required environment variables (set in Netlify: Site
// settings > Environment variables):
//   RESEND_API_KEY   your Resend API key
//   CONTACT_FROM     verified sender, e.g. "Dojo Web <web@tudojo.com>"
//   CONTACT_TO       where submissions should land, e.g. "info@tudojo.com"
//
// See ../../README.md for full setup steps.
// ============================================================

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const name = (payload.name || "").toString().trim();
  const email = (payload.email || "").toString().trim();
  const phone = (payload.phone || "").toString().trim();
  const interest = (payload.interest || "").toString().trim();
  const message = (payload.message || "").toString().trim();

  // Basic server-side validation (never trust the client)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!name || !message || !emailPattern.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing or invalid fields" }) };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM;
  const to = process.env.CONTACT_TO;

  if (!apiKey || !from || !to) {
    console.error("Missing RESEND_API_KEY, CONTACT_FROM, or CONTACT_TO env vars");
    return { statusCode: 500, body: JSON.stringify({ error: "Server not configured" }) };
  }

  const escapeHtml = (str) =>
    str.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

  const html = `
    <h2>Nuevo mensaje desde el sitio web</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
    <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(phone || "—")}</p>
    <p><strong>Programa de interés:</strong> ${escapeHtml(interest || "—")}</p>
    <p><strong>Mensaje:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
  `;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `Nuevo contacto: ${name}`,
        html
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Resend error:", resp.status, errText);
      return { statusCode: 502, body: JSON.stringify({ error: "Email provider error" }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    console.error("Contact function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Unexpected server error" }) };
  }
};
