# Mushin Dojo — Website

A martial-arts dojo website (Aikido + Karaté), client-editable through a
CMS panel. Hosting and the CMS run on **GitHub Pages** + **Supabase**;
the contact form emails through **Web3Forms** (no server needed for
that part). No Netlify, no Vercel.

## Files

```
dojo-site/
├── index.html                    ← all page content & structure, CMS-marked
├── css/styles.css                ← design tokens (colors/fonts) + layout + animations
├── js/main.js                    ← nav, scroll reveal, gallery, contact form logic
├── cms.js                        ← CMS runtime (copied in manually, not tracked by setup script)
├── supabase/functions/contact/   ← retired — see "Retired" note in section 3 below
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

## 3. Contact form → email via Web3Forms

The form posts directly to [Web3Forms](https://web3forms.com) from the
browser — no backend to deploy, no domain verification. Web3Forms emails
the submission straight to `contact@mushindojo.net`.

### One-time setup

1. Go to [web3forms.com](https://web3forms.com) and enter
   `contact@mushindojo.net` — they'll email an **Access Key** to that
   address (check that inbox once it exists).
2. Open `js/main.js`, find `WEB3FORMS_ACCESS_KEY_HERE`, and paste the
   real key in its place.
3. Re-run `setup-dojo-site.sh` and push.

That's the whole setup — no secrets to manage on a server, nothing to
redeploy later. If you ever want the notification email to go to a
different address, just create a new key at web3forms.com for that
address and swap it in the same spot.

### Test

Submit the form on the live site — a message should land in
`contact@mushindojo.net` within seconds, with the visitor's email set
as "reply-to" so you can reply directly from your inbox.

### Retired: Supabase Edge Function + Resend

An earlier version of this form went through a Supabase Edge Function
(`supabase/functions/contact`) that sent via Resend. That's no longer
used — Resend's free plan hit its domain limit, and Web3Forms needs no
domain verification at all, so it's simpler for this use case. The old
Edge Function code is still in this repo for reference but isn't called
by anything; it's safe to ignore or delete.

## 4. Local preview

No build step — open `index.html` in a browser, or serve the folder
with `npx serve .`. The CMS content won't load without `cms.js` present
and a live Supabase connection; the contact form won't actually send
until the real Web3Forms access key is in place. Everything else
(layout, animations, gallery) works fully offline.
