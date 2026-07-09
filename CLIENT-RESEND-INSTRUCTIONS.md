# Getting Your Contact Form Connected — What I Need From You

Your website's "Book a Shoot" form is built and ready. Before it can actually
deliver messages to your inbox, I need three things from you. It takes about
15–20 minutes total. Here's exactly what to do, in order.

---

## Step 1 — Create a free Resend account

Resend is the email service that delivers form submissions to your inbox.

1. Go to **https://resend.com/signup**
2. Sign up with your email (or continue with Google/GitHub)
3. Confirm your email if it asks you to

---

## Step 2 — Verify your domain (jacob1k.com)

This proves to email providers that mail sent "from" jacob1k.com is
legitimate, so it lands in inboxes instead of spam.

1. In the Resend dashboard, click **Domains** in the left sidebar
2. Click **Add Domain**
3. Type in `jacob1k.com` and confirm
4. Resend will show you a short list of DNS records to add — they'll look
   like rows of text labeled things like `TXT` and `CNAME`, each with a long
   string of letters and numbers
5. Log in to wherever you manage jacob1k.com's DNS settings — this is
   usually your domain registrar (GoDaddy, Namecheap, Google Domains,
   Cloudflare, etc.), wherever you bought/manage the domain
6. Find the **DNS management** or **DNS records** section
7. Add each record Resend showed you, exactly as shown (copy/paste the
   values so there's no typo)

> ⚠️ **Please read before adding anything:**
> Since `Jacob@jacob1k.com` already receives email today, your domain
> almost certainly already has a record called an **SPF record** (it looks
> like `v=spf1 ...`). A domain can only have **one** of these — if you add
> Resend's as a brand new second record, it will break your existing email.
>
> **Before you touch anything**, take a screenshot of your domain's current
> DNS records and send it to me. I'll tell you exactly how to merge Resend's
> requirement into your existing record safely, in one line, rather than
> risk breaking your inbox.

8. Wait for the domain to show **Verified** in the Resend dashboard (usually
   a few minutes, occasionally up to 48 hours)

---

## Step 3 — Create an API key

This is like a password that lets the website send emails on your behalf.

1. In the Resend dashboard, click **API Keys** in the sidebar
2. Click **Create API Key**
3. Name it something like `Jacob1K Website`
4. Permission level: **Sending access** is enough — no need for full access
5. Click **Create**
6. **Copy the key immediately** (it starts with `re_`) — Resend only shows
   it once and won't display it again

---

## Step 4 — Send the key back to me securely

This key is a secret, the same as a password — please don't send it in a
regular text message or email.

- **Easiest:** use a one-time secret link tool like
  **https://onetimesecret.com** — paste the key in, it gives you a link
  that self-destructs after I open it once. Send me that link.
- **Also fine:** share it through a password manager's secure-share feature
  (1Password, Bitwarden, etc.) if you use one.

I'll add it directly to the website's hosting settings — it's never typed
anywhere public, and I'll let you know once the form is live and tested.

---

## That's everything

Once I have your domain verified and the API key, I'll finish wiring it up
and test that a real submission lands in `Jacob@jacob1k.com`. You'll get a
confirmation from me when it's done.
