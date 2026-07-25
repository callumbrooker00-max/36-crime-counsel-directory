-- Contact-clerks enquiries (PRD FR-14/FR-15, api-contract.md §4 POST /enquiries).
-- Delivered to the clerking team; captured here so a Phase-2 admin view can
-- surface them. Written only by the trusted server context (service role) after
-- validation + rate-limiting — there is no client insert policy.

create type public.enquiry_urgency as enum ('routine', 'soon', 'urgent');

create table public.enquiries (
  id uuid primary key default public.uuid_generate_v7(),
  chambers_id uuid not null references public.chambers (id) on delete cascade,
  counsel_ids uuid[] not null default '{}', -- referenced counsel (shortlist-ready)
  enquirer_name text not null,
  firm text,
  email text not null,
  case_type text,
  urgency public.enquiry_urgency not null default 'routine',
  message text not null,
  status text not null default 'received',
  created_at timestamptz not null default now()
);

create index idx_enquiries_chambers_time on public.enquiries (chambers_id, created_at desc);

alter table public.enquiries enable row level security;

-- Clerks / chambers admins read their chambers' enquiries; no client insert.
create policy enquiries_select on public.enquiries for select to authenticated
  using (app.can_edit(chambers_id) or app.is_platform_admin());

-- Explicit grants (RLS still filters rows); service_role bypasses RLS for inserts.
grant select, insert, update, delete on public.enquiries to authenticated, service_role;
