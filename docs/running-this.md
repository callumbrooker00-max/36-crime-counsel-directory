# Running this — operational notes

A plain-English runbook for the people who keep the 36 Crime Counsel Directory
going. Not the build spec (that's the other files in `/docs`) — this is "how do I
actually do the day-to-day thing" for an admin or a clerk. If you're reading this
cold in three months, start here.

---

## Where everything lives

- **The site (Production):** https://36-crime-counsel-directory.vercel.app
  Deploys automatically from the `main` branch on GitHub.
- **Preview deploys:** every branch / PR gets its own temporary Vercel URL. Safe
  to poke at; not the real thing.
- **Code:** https://github.com/callumbrooker00-max/36-crime-counsel-directory
- **Database + auth + image storage:** Supabase project **"36 Crime Counsel
  Directory"**, region **London (`eu-west-2`)** — this is where counsel personal
  data physically sits (data residency). Project ref `wibyvmmrtuqsdgxqgcdv`.
- **Hosting/edge:** Vercel. **Rate limiting:** Upstash Redis (optional; falls
  back to per-instance memory if unset).

## Two separate ways in — don't confuse them

| | Who | How they sign in |
|---|---|---|
| **Admin** (`/admin`) | You + 1–2 clerks | **Email + password** (no email delivery needed) |
| **Client portal** (the directory itself) | CPS lawyers, instructing solicitors | **A per-firm access code** they type at `/access` |

There is **no magic-link / email sign-in** anymore. Clients enter a code; admins
use a password. Nothing here depends on email being deliverable.

## Who has admin

Admins are people with an **active membership** in the chambers at role
`clerk`, `chambers_admin`, or `platform_admin`.

- **Admins:**
  - Callum Brooker — callum@36group.co.uk
  - Jack — Jack@36crime.co.uk
- Two permission tiers to know:
  - **Clerk** can edit member/taxonomy content.
  - **Chambers admin / platform admin** can *also* manage client access codes
    (the `/admin/access` screen). Clerks can't see that screen.
- **Add a new admin:** create the user in Supabase → Authentication → Users
  (set email + password, tick *Auto Confirm*), then give them a `memberships`
  row in this chambers with the right role. **Forgot the admin password?** Reset
  it in Supabase → Authentication (or set a new one via SQL) — no email required.

---

## How to add a client (issue an access code)

This is the common task. **No database editing, no developer needed.**

1. Sign in at **`/admin`**.
2. Go to **Client access** (top nav — visible to chambers/platform admins only).
3. Type the **firm or team name** → **Create code**.
4. The code appears once, big, with a copy button. **Copy it and send it to the
   client** (however you normally reach them). It stays visible in the list too,
   so you can re-copy it later.
5. The client goes to **`/access`**, types the code, and they're in. Their
   session lasts ~30 days, then they re-enter the code.

**Other actions on that screen:**
- **New code** — rotates a firm's code (use if a code leaks). The old one stops
  working immediately.
- **Revoke** — cuts off a firm now (takes effect on their very next request).
  Keeps the record for audit. **Restore** brings it back.
- **Delete** — removes the record entirely (for mistakes; prefer Revoke).

One code per firm — everyone at that firm shares it. Codes are 12 characters from
an unambiguous alphabet (no I/L/O/U, no 0/O mix-ups).

---

## The settings that make it work (Vercel → Environment Variables)

If the client portal is broken, it's almost always one of these:

- **`CLIENT_SESSION_SECRET`** — a long random string that signs the client
  session cookie. **Required.** Without it, client sign-in fails closed (nobody
  can get in). Generate with `openssl rand -base64 48`. Rotating it logs every
  client out (they just re-enter their code).
- **`CLIENT_GATE_ENABLED`** — set to `true` to actually **lock the directory** to
  code-holders. If this is off/unset, the directory is **open to anyone with the
  URL** (counsel PII exposed) — so in Production this must be `true`.
- Plus the Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`) and, ideally, Upstash rate-limit creds.

Env-var changes only take effect on a **new deployment** — set them, then redeploy.

## Changing the database schema

Migrations live in `supabase/migrations/`. To apply pending ones to the live DB:

```bash
supabase migration list   # see what's pending
supabase db push          # apply it
```

The Docker warning `db push` prints is only about a local-caching step — the push
to the remote still happens. Confirm with `supabase migration list` (the migration
shows under both Local and Remote once applied).

## Handy checks

```bash
# Is the directory API correctly refusing without a session? (gate must be on)
curl -i https://36-crime-counsel-directory.vercel.app/api/directory   # expect HTTP 401
```

The whole site is `noindex` on purpose — it must never show up in search results.

---

*Last updated 2026-08-01. Keep this current when the infrastructure changes.*
