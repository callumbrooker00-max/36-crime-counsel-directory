-- Client access via per-firm access codes (replaces the magic-link model).
-- A client enters a code we've issued; a non-revoked matching row grants a
-- signed session cookie (see lib/auth/client-session.ts). Codes are viewable by
-- chambers admins (product decision) — the existing admin-only RLS on this table
-- keeps them out of client reach.

alter table public.client_access
  add column if not exists code text;

-- The legacy matcher constraint required an email or a domain. Extend it so a
-- row may instead be identified by a code. Existing email/domain rows remain
-- valid (legacy); a later migration can drop those columns once fully retired.
alter table public.client_access
  drop constraint if exists client_access_has_matcher;
alter table public.client_access
  add constraint client_access_has_matcher
  check (code is not null or email is not null or domain is not null);

-- One code value per chambers. Lookup at sign-in is by exact (chambers_id, code).
-- Codes are generated from an unambiguous 32-char alphabet, so case-sensitive.
create unique index if not exists idx_client_access_code
  on public.client_access (chambers_id, code) where code is not null;
