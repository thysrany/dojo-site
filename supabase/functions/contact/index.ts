// ============================================================
// supabase/functions/contact/index.ts
//
// Supabase Edge Function (Deno). Receives the contact form POST
// from js/main.js and sends it as an email through Resend.
//
// Deploy from the Supabase CLI, from inside dojo-site/:
//   supabase functions deploy contact --no-verify-jwt --project-ref lerdkmzzdqcwxzjfmrpi
//
// --no-verify-jwt is needed because this is called directly from a
// public page with no logged-in user — same pattern already used
// for other public-facing functions.
//
// Required secrets (set once via the Supabase CLI or dashboard):
//   supabase secrets set RESEND_API_KEY=... CONTACT_FROM="Mushin Dojo <web@mushindojo.net>" CONTACT_TO=info@mushindojo.net --project-ref lerdkmzzdqcwxzjfmrpi
//
// See ../../../README.md for full setup steps.
// ============================================================

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim();
  const phone = String(payload.phone ?? "").trim();
  const interest = String(payload.interest ?? "").trim();
  const message = String(payload.message ?? "").trim();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!name || !message || !emailPattern.test(email)) {
    return new Response(JSON.stringify({ error: "Missing or invalid fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("CONTACT_FROM");
  const to = Deno.env.get("CONTACT_TO");

  if (!apiKey || !from || !to) {
    console.error("Missing RESEND_API_KEY, CONTACT_FROM, or CONTACT_TO secret");
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const escapeHtml = (str: string) =>
    str.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c] as string));

  const html = `
    <h2>Nouveau message depuis le site web</h2>
    <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
    <p><strong>Courriel :</strong> ${escapeHtml(email)}</p>
    <p><strong>Téléphone :</strong> ${escapeHtml(phone || "—")}</p>
    <p><strong>Programme d'intérêt :</strong> ${escapeHtml(interest || "—")}</p>
    <p><strong>Message :</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
  `;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `Nouveau contact : ${name}`,
        html,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Resend error:", resp.status, errText);
      return new Response(JSON.stringify({ error: "Email provider error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Contact function error:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
