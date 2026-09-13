# Mushin Dojo — Website

A martial-arts dojo website (Aikido + Karaté), client-editable through a
CMS panel. Everything runs on just two services: **GitHub** (hosting,
via GitHub Pages) and **Supabase** (the CMS content and the contact
form's email-sending function). No Netlify, no Vercel.

## Files

```
dojo-site/
├── index.html                    ← all page content & structure, CMS-marked
├── css/styles.css                ← design tokens (colors/fonts) + layout + animations
├── js/main.js                    ← nav, scroll reveal, gallery, contact form logic
├── cms.js                        ← CMS runtime (copied in manually, not tracked by setup script)
├── supabase/functions/contact/   ← Supabase Edge Function: form → Resend email
├── push.sh                       ← commit + push helper
├── download-assets.sh            ← pulls the two real client images
└── assets/                       ← logo + real photos live here once downloaded
```

## 1. Hosting: GitHub Pages

Much simpler than Netlify — no separate account to link, just a setting
in the repo itself.

1. Push this repo to GitHub as usual (`bash push.sh "message"`).
2. On GitHub, go to the repo → **Settings → Pages**.
3. Under "Build and deployment," set **Source** to "Deploy from a
   branch," branch **main**, folder **/ (root)**.
4. Save. GitHub gives you a URL like
   `https://thysrany.github.io/dojo-site/` within a minute or two.
5. Every future `git push` (via `push.sh`) updates the live site
   automatically — no extra step needed.

A custom domain can be added later under the same Pages settings.

## 2. The CMS

`index.html` has `data-cms="section.champ"` attributes on the elements
the client can edit — text, images, and a few repeating lists (programs,
events, benefits, instructors, schedule). The text already in the HTML
is the fallback shown if the CMS backend is ever unreachable, so it
should always stay real content, never be emptied out.

`cms.js` is the runtime script that fills those elements in from the
published content. It's **not written by `setup-dojo-site.sh`** — copy
it in manually from `~/code/fuc-cms/cms.js` any time it's updated:

```
cp ~/code/fuc-cms/cms.js dojo-site/
```

Onboarding this client into the CMS (generating the SQL, creating their
login, etc.) happens with the tools in `~/code/fuc-cms/` — see the
Editable Site CMS project for that process.

## 3. Contact form → email via Supabase Edge Function

The form posts to a Supabase Edge Function (`supabase/functions/contact`)
that sends through Resend — the same Supabase project the CMS already
uses, so there's only one backend to manage.

### Deploy the function (one-time, from your Mac)

You'll need the Supabase CLI installed (`brew install supabase/tap/supabase`
if you don't have it yet). Then, from inside `dojo-site/`:

```
supabase functions deploy contact --no-verify-jwt --project-ref lerdkmzzdqcwxzjfmrpi
```

`--no-verify-jwt` is required — this function is called directly from
the public page with no logged-in user, same as it was on Netlify.

### Set the secrets (one-time)

```
supabase secrets set \
  RESEND_API_KEY=your_resend_api_key \
  CONTACT_FROM="Mushin Dojo <web@mushindojo.net>" \
  CONTACT_TO=info@mushindojo.net \
  --project-ref lerdkmzzdqcwxzjfmrpi
```

In [Resend](https://resend.com), verify the sending domain (`mushindojo.net`)
so `CONTACT_FROM` is allowed to send — until it's verified you can test
with Resend's sandbox sender.

### Test

Submit the form on the live site — a message should land in `CONTACT_TO`
within seconds, with the visitor's email set as "reply-to" so you can
reply directly.

If you ever change the Resend key or the destination email, just re-run
the `supabase secrets set` command — no redeploy of the function needed.

## 4. Local preview

No build step — open `index.html` in a browser, or serve the folder
with `npx serve .`. The CMS content won't load without `cms.js` present
and a live Supabase connection; the contact form won't actually send
until the Edge Function is deployed. Everything else (layout, animations,
gallery) works fully offline.
