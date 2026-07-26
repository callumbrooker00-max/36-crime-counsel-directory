-- Client access allowlist (PRD D1 — magic link). A read-only client may request
-- a sign-in link only if their email matches a non-revoked row (exact email OR
-- firm domain). Managed by chambers admins; checked server-side (service role)
-- both when a link is requested and on every gated request (defence in depth).
create table public.client_access (
  id uuid primary key default public.uuid_generate_v7(),
  chambers_id uuid not null references public.chambers (id) on delete cascade,
  label text not null, -- firm / team name
  email text, -- exact allowlisted address (lowercased)
  domain text, -- allowlisted email domain, e.g. "cps.gov.uk" (lowercased)
  method text not null default 'magic_link',
  issued_at timestamptz not null default now(),
  issued_by uuid references public.users (id),
  revoked_at timestamptz,
  last_used_at timestamptz,
  -- at least one matcher; a row grants access by email or by domain
  constraint client_access_has_matcher check (email is not null or domain is not null)
);

create index idx_client_access_chambers on public.client_access (chambers_id);
create index idx_client_access_email on public.client_access (lower(email)) where email is not null and revoked_at is null;
create index idx_client_access_domain on public.client_access (lower(domain)) where domain is not null and revoked_at is null;

alter table public.client_access enable row level security;

-- Chambers admins manage their chambers' allowlist; no client-tier access.
create policy client_access_select on public.client_access for select to authenticated
  using (app.is_chambers_admin(chambers_id) or app.is_platform_admin());
create policy client_access_write on public.client_access for all to authenticated
  using (app.is_chambers_admin(chambers_id)) with check (app.is_chambers_admin(chambers_id));

grant select, insert, update, delete on public.client_access to authenticated, service_role;
