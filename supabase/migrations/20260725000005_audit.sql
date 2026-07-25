-- 4.14 audit_logs — append-only history (data-model.md §4.14). entity_id is a
-- soft reference (not an FK): an audit record must outlive the row it describes.
create table public.audit_logs (
  id uuid primary key default public.uuid_generate_v7(),
  chambers_id uuid references public.chambers (id) on delete set null, -- nullable: platform events
  actor_user_id uuid references public.users (id) on delete set null, -- preserve history if user deleted
  action public.audit_action not null,
  entity_type text not null,
  entity_id uuid not null,
  changes jsonb,
  ip_address inet,
  user_agent text,
  occurred_at timestamptz not null default now()
);
