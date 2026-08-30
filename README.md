# Dojo Website Template

A reusable martial-arts / dojo website template (based on the structure of
aikikaird.org), built as plain HTML/CSS/JS so it's easy to reskin per client.
Push it to GitHub as normal, deploy it on Netlify.

## Files

```
dojo-site/
├── index.html                     ← all page content & structure
├── css/styles.css                 ← design tokens (colors/fonts) + layout + animations
├── js/main.js                     ← nav, scroll reveal, gallery, contact form logic
├── netlify/functions/contact.js   ← serverless function: form → Resend email
├── netlify.toml                   ← Netlify build/functions config
└── assets/                        ← drop client logo + photos here
```

## 1. Customize per client

Open `index.html` and search for `CUSTOMIZE` — each comment marks a spot
that needs client-specific content:
- Dojo name, founder story, affiliation/federation text
- Logo (replace the inline SVG placeholder in the header with
  `<img src="assets/logo.svg" alt="...">`)
- Photos — every `<div class="photo-placeholder">` is a stand-in. Replace
  with an `<img>` tag pointing to a real photo in `assets/`.
- Address, phone, WhatsApp, email (appears in 3 places: philosophy section,
  contact form section, footer)
- Program cards, instructor names/ranks/quotes, social links

Open `css/styles.css` and edit the `:root` block at the top to change the
palette or fonts for the whole site in one place — nothing else needs to
change.

## 2. Animations already included

- Scroll-reveal fade/rise on every major section (`.reveal` class,
  IntersectionObserver-driven, respects `prefers-reduced-motion`)
- An animated "ensō" (hand-drawn zen circle) that draws itself on page load
  — used behind the hero photo and the CTA banner as the site's signature
  visual motif
- Smooth mobile nav open/close
- Gallery carousel with swipe/scroll, arrow buttons, and dot indicators
- Button hover lifts, nav underline hovers

## 3. Deploying: GitHub → Netlify

Keep working exactly like you already do — push to a GitHub repo. Netlify
connects to that repo and auto-deploys on every push, and it also runs the
serverless function in `netlify/functions/contact.js`, so the static site
and the contact-form backend live in one place.

Netlify's free plan is a good fit here: $0/month, no expiry, and — unlike
some competitors — its terms explicitly allow commercial client sites, not
just personal projects. The free tier's monthly allowance (300 credits,
roughly 15 GB of traffic plus generous function calls) is far more than a
single dojo site with a contact form will use.

1. Push this folder to a GitHub repo (new repo, or a folder in an existing
   one — just make sure `index.html` sits at the root Netlify will deploy).
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import an
   existing project** → connect GitHub and pick the repo. Netlify reads
   `netlify.toml` automatically, so no build command setup is needed —
   just confirm the publish directory is `.` (repo root).
3. Go to **Site settings → Environment variables** and add:
   - `RESEND_API_KEY` — your Resend API key
   - `CONTACT_FROM` — a verified sender, e.g. `Dojo Web <web@tudojo.com>`
   - `CONTACT_TO` — the inbox that should receive submissions, e.g.
     `info@tudojo.com`
4. Trigger a redeploy (or just push again) so the function picks up the
   new environment variables.
5. In [Resend](https://resend.com), verify the sending domain
   (`tudojo.com`) so `CONTACT_FROM` is allowed to send — until it's
   verified you can test with Resend's sandbox sender.
6. Test the live form — a submission should land in `CONTACT_TO` within
   seconds, with the visitor's email set as "reply-to" so you can respond
   directly.

Custom domain: point it at Netlify the same way you'd normally do with
Namecheap DNS — Netlify gives you the records under **Domain settings**.

### Notes

- The function does its own server-side validation (never trust client
  input) and the form includes a hidden honeypot field (`_gotcha`) to
  filter out simple bots.
- If a project ever needs to stay on GitHub Pages specifically (no
  Netlify), the contact form would need its backend hosted separately —
  ask and I can wire up an alternative.

## 4. Local preview

No build step for the static part — open `index.html` in a browser, or
serve the folder with `npx serve .`. The contact form won't actually send
until it's deployed to Netlify with the environment variables set (or you
run `netlify dev` locally with a `.env` file).
