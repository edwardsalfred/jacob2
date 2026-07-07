# Wiring up the contact form (Resend + Vercel)

The contact form (`api/contact.js`) sends mail via [Resend](https://resend.com).
It needs a verified sending domain and an API key set as an environment
variable on whatever host runs the function. Nothing sends until both are
in place.

## 1. Create a Resend account

Sign up free at https://resend.com/signup (100 emails/day, 3,000/month on
the free tier — plenty for a contact form).

## 2. Verify `jacob1k.com`

1. Resend dashboard → **Domains** → **Add Domain** → enter `jacob1k.com`.
2. Resend shows you DNS records to add (an SPF `TXT`, one or more DKIM
   `CNAME`s, and usually a `DMARC` record).
3. Add those records wherever `jacob1k.com`'s DNS is managed (your
   registrar or DNS host).

   **Important:** `Jacob@jacob1k.com` already receives mail, which means
   `jacob1k.com` almost certainly already has an SPF `TXT` record (something
   starting `v=spf1 ...`). A domain can only have **one** SPF record — if
   you add Resend's as a second one, SPF breaks for all mail on the domain
   (including your existing inbox). Instead, **merge** Resend's
   `include:` mechanism into your existing SPF record. Example: if you
   currently have

   ```
   v=spf1 include:_spf.google.com ~all
   ```

   and Resend asks for `include:amazonses.com`, change it to:

   ```
   v=spf1 include:_spf.google.com include:amazonses.com ~all
   ```

   The DKIM `CNAME` records are separate per-service and can just be added
   alongside whatever's already there.

4. Wait for Resend to show the domain as **Verified** (usually minutes,
   can take up to ~48h for DNS to propagate).

## 3. Create an API key

Resend dashboard → **API Keys** → **Create API Key** → "Sending access"
is enough. Copy it (`re_...`) — it's only shown once.

## 4. Deploy this repo to Vercel

This is a static site with one serverless function (`api/contact.js`),
so Vercel needs zero build configuration:

```
npm i -g vercel      # if not already installed
vercel login
vercel                # first deploy — creates the project, follow prompts
vercel --prod         # promote to production
```

Or connect `github.com/edwardsalfred/jacob2` in the Vercel dashboard
(Add New → Project → Import Git Repository) for automatic deploys on push.

## 5. Add the API key to Vercel

Project → **Settings** → **Environment Variables** → add:

```
RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Add it for Production (and Preview/Development if you want preview
deploys to be able to send too). Redeploy after adding it — env var
changes don't apply to already-running deployments.

## 6. Local testing (optional)

Copy `.env.example` to `.env` and fill in your real key (`.env` is
gitignored, it won't get committed). Run `vercel dev` instead of a plain
static server — that's what actually executes `api/contact.js` locally;
`python -m http.server` cannot run it.

## Notes

- The form sends **to** `Jacob@jacob1k.com`, **from**
  `Jacob1K Website <booking@jacob1k.com>` (`booking@` doesn't need to be a
  real inbox — it just needs to live on the verified domain), and sets
  `reply_to` to the visitor's email, so hitting Reply in your inbox goes
  straight back to them.
- There's a hidden honeypot field (`company`) that real visitors never see
  or fill in; submissions that fill it are silently dropped as spam.
