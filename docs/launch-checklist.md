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
- [ ] **Durable rate limiter (Upstash)** — replace the in-memory limiter in
      `lib/rate-limit.ts` (per-instance, resets on redeploy) used by
      `POST /api/enquiries`. **REQUIRED**.

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
