# Launch checklist (slice 8 — soft-launch gate)

Items that must be resolved before the directory is exposed to real clients.
Grows as slices surface pre-launch work. **Required** = blocks launch.

## Security & abuse
- [ ] **Durable, distributed rate limiter (Upstash) — REQUIRED.** Replace the
      in-memory limiter in `lib/rate-limit.ts` (per-instance, resets on redeploy)
      used by `POST /enquiries`. See the `TODO(slice-8)` there.
- [ ] Developer review of auth, RLS, and data protection (CLAUDE.md) — REQUIRED.

## Enquiries
- [ ] Wire a real email provider (Resend) + clerking inbox in
      `lib/email/notify-enquiry.ts` (currently logs "would have sent") — REQUIRED.

## Data & compliance
- [ ] Confirm live CPS panel & grade lists; replace placeholder taxonomy
      (data-model.md D-DM4) — REQUIRED.
- [ ] Migrate the real Excel counsel list.
- [ ] Counsel PII / headshot consent + retention position (BSB, Data Use and
      Access Act 2025) — REQUIRED.
- [ ] Confirm Supabase project region is London (`eu-west-2`).

## Access
- [ ] Client access model (magic link) wired — REQUIRED (the directory is
      ungated until slice 6).
