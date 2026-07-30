# Launch checklist (slice 8 — go-live gate)

Everything that must be true before real client data goes in and the portal is
opened. **REQUIRED** items block launch. Run the verification scripts where noted.

## A. Data protection & sign-off (do first)
- [ ] **Data-protection review signed off** — `docs/data-protection.md`
      (PII inventory, London residency, D4, headshot consent + retention) —
      **REQUIRED**, by the practice manager + DPO.
- [ ] **Developer review** of auth, RLS, and data protection — **REQUIRED**.
- [ ] Headshot **consent** obtained per barrister; retention/erasure process agreed — **REQUIRED**.

## B. Security & isolation (verify)
- [ ] **RLS / tenant isolation** — run `scripts/verify/rls.sql` on London: RLS
      enabled on every table; a member sees only their chambers; a non-member
      sees nothing. **REQUIRED**.
- [ ] **Secrets** — `npm run build` then `scripts/verify/secrets.sh`: service-role
      key absent from the client bundle; no real `.env` committed. **REQUIRED**.
- [ ] **noindex** — `node scripts/verify/noindex.mjs <deployment-url>`: every
      route returns `X-Robots-Tag: noindex`. **REQUIRED**.
- [x] **Durable rate limiter (Upstash)** — `lib/rate-limit.ts` now uses Upstash
      sliding-window when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are
      set (in-memory fallback for local dev only). **Action left:** provision an
      Upstash Redis DB and set those two env vars on Vercel. **REQUIRED**.
- [x] **Security headers** — `next.config.ts` sets CSP, `X-Frame-Options: DENY`,
      `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`,
      `Permissions-Policy` on all routes. Verify on the deploy with
      `curl -sI <url> | grep -i -E 'content-security|x-frame|strict-transport'`.
      Follow-up: tighten CSP `script-src` to nonce-based (drop `'unsafe-inline'`).
- [x] **Headshot bucket private** — `counsel-images` is `public:false`; the app
      serves signed URLs. Verify a public URL is refused (see §F).
- [x] **Session cookies hardened** — httpOnly + secure(prod) + SameSite=Lax
      (`lib/supabase/server.ts`, `lib/supabase/middleware.ts`).

## C. Client access model (D1 — magic link)
- [ ] Allowlist populated — `scripts/grant-client-access.mjs` for each firm/
      domain. **REQUIRED**.
- [ ] Supabase Auth: magic-link/OTP enabled; `/**/auth/callback` in allowed
      redirect URLs; sender email configured. **REQUIRED**.
- [ ] **Turn the gate ON** — set `CLIENT_GATE_ENABLED=true` on Vercel, and ensure
      `CLIENT_GATE_DEV_BYPASS` is **unset** in production. **REQUIRED**.
      Verify: `GET /api/directory` returns **401** without a session; a valid
      allowlisted session returns 200. (The dev bypass is inert in production by
      construction — `NODE_ENV=production`.)

## D. Data & delivery
- [ ] **Real CPS panel & grade lists confirmed** (D-DM4); placeholder taxonomy
      replaced/verified. **REQUIRED**.
- [ ] **Excel import** — finalise the column mapping in `scripts/import-counsel.mjs`
      against the real sheet; dry-run (no `--apply`) and review the report
      (unmatched / near-match / duplicate taxonomy; draft-only rows); then
      `--apply` only after the above sign-offs.
- [ ] **Enquiry email** — wire a real provider (Resend) + clerking inbox in
      `lib/email/notify-enquiry.ts` (currently logs "would have sent"). **REQUIRED**.

## E. Ops
- [ ] Supabase project region is **London (`eu-west-2`)** — immutable; confirm.
- [ ] Vercel region **Dublin (`dub1`)**; env vars set (Production + Preview).
- [ ] Error monitoring (Sentry) + uptime monitoring (NFR-10).

## F. Final go-live gate — verify against the DEPLOYED site
These can only be proven once the app is live with its real env. Replace
`$URL` with the production URL. Each must pass before opening the portal.

- [ ] **Gate returns 401 without a session** — the whole thing hinges on
      `CLIENT_GATE_ENABLED=true` being set on Vercel (with `CLIENT_GATE_DEV_BYPASS`
      unset). Run:
      ```
      curl -s -o /dev/null -w "%{http_code}\n" $URL/api/directory      # expect 401
      curl -s -o /dev/null -w "%{http_code}\n" -X POST $URL/api/enquiries # expect 401
      ```
      A `200` on `/api/directory` means the gate is OFF — do not launch.
- [ ] **Non-allowlisted email is refused** — sign in via magic link with an
      email/domain that is NOT in `client_access`. Expect to land on
      `/access?denied=1`, never the directory. (Allowlist an address with
      `scripts/grant-client-access.mjs`, then confirm that one gets in.)
- [ ] **`/admin` refused for non-admins** —
      ```
      curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" $URL/admin/members  # expect 307 → /admin/sign-in
      ```
      Then sign in at `/admin/sign-in` as an authenticated **non-member** (an
      auth user with no membership row): you must be bounced back to
      `/admin/sign-in`, never seeing the member list.
- [ ] **Headshots 403/refused without auth** — take any headshot the app shows
      (a signed URL) and strip the `?token=…`, or hit the public path
      `$URL-of-supabase/storage/v1/object/public/counsel-images/<key>`:
      expect a refusal (Supabase returns 400 "Bucket not found" for a private
      bucket), while the app's signed URL loads.
- [ ] **noindex on the live site** — `node scripts/verify/noindex.mjs $URL`.
- [ ] **Security headers on the live site** —
      `curl -sI $URL | grep -iE 'content-security-policy|x-frame-options|strict-transport-security'`.
- [ ] **Full RLS sweep** — run `scripts/verify/rls-sweep.sql` in the Supabase SQL
      editor; every public table shows `rls_enabled = true`.
- [ ] **Rate limiter is durable** — confirm `UPSTASH_REDIS_REST_URL`/`_TOKEN` are
      set on Vercel (otherwise the limiter silently falls back to in-memory and
      logs a warning).
