-- Tenant root, global user identities, and the RBAC join (data-model.md §4.1–4.3).

-- 4.1 chambers — the tenant root.
create table public.chambers (
  id uuid primary key default public.uuid_generate_v7(),
  name text not null,
  slug text not null unique, -- globally unique: it identifies the tenant
  settings jsonb not null default '{}'::jsonb,
  status public.chambers_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_chambers_updated_at before update on public.chambers
  for each row execute function public.set_updated_at();

-- 4.2 users — application profile; credentials live in auth.users (same id).
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  status public.user_status not null default 'invited',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- 4.3 memberships — user <-> chambers, carrying the permission level.
create table public.memberships (
  id uuid primary key default public.uuid_generate_v7(),
  user_id uuid not null references public.users (id) on delete cascade,
  chambers_id uuid not null references public.chambers (id) on delete cascade,
  role public.membership_role not null default 'clerk',
  status public.membership_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, chambers_id) -- one role per chambers
);
create trigger trg_memberships_updated_at before update on public.memberships
  for each row execute function public.set_updated_at();
