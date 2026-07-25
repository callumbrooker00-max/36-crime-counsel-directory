-- Counsel, the editable vocabularies, and the relationships between them
-- (data-model.md §4.4–4.13). Lookups carry a NULLABLE chambers_id: NULL = a
-- platform-global row shared by all chambers (§8).

-- Sentinel for tenant-scoped uniqueness that treats NULL as the global namespace.
-- (Postgres treats NULLs as distinct in unique constraints, so we coalesce.)

-- 4.4 counsel — the core entity.
create table public.counsel (
  id uuid primary key default public.uuid_generate_v7(),
  chambers_id uuid not null references public.chambers (id) on delete restrict,
  full_name text not null,
  slug text not null,
  year_of_call smallint,
  practice_capacity public.practice_capacity not null default 'both',
  short_bio text,
  status public.counsel_status not null default 'draft',
  display_order int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users (id),
  updated_by uuid references public.users (id),
  unique (chambers_id, slug)
);
create trigger trg_counsel_updated_at before update on public.counsel
  for each row execute function public.set_updated_at();

-- 4.5 practice_areas — specialism vocabulary (tenant-scoped or global).
create table public.practice_areas (
  id uuid primary key default public.uuid_generate_v7(),
  chambers_id uuid references public.chambers (id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  display_order int not null default 0,
  is_active boolean not null default true
);
create unique index practice_areas_chambers_slug_key on public.practice_areas
  (coalesce(chambers_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

-- 4.6 counsel_practice_areas — junction (M:N).
create table public.counsel_practice_areas (
  counsel_id uuid not null references public.counsel (id) on delete cascade,
  practice_area_id uuid not null references public.practice_areas (id) on delete restrict,
  is_primary boolean not null default false,
  primary key (counsel_id, practice_area_id)
);

-- 4.7 roles — professional appointments (tenant-scoped or global).
create table public.roles (
  id uuid primary key default public.uuid_generate_v7(),
  chambers_id uuid references public.chambers (id) on delete restrict,
  name text not null,
  slug text not null,
  abbreviation text,
  display_order int not null default 0,
  is_active boolean not null default true
);
create unique index roles_chambers_slug_key on public.roles
  (coalesce(chambers_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

-- 4.8 counsel_roles — junction (M:N).
create table public.counsel_roles (
  counsel_id uuid not null references public.counsel (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  since_year smallint,
  primary key (counsel_id, role_id)
);

-- 4.9 panels — CPS panels (national → recommended global).
create table public.panels (
  id uuid primary key default public.uuid_generate_v7(),
  chambers_id uuid references public.chambers (id) on delete restrict,
  name text not null,
  slug text not null,
  type public.panel_type not null,
  issuing_body text not null default 'CPS',
  display_order int not null default 0,
  is_active boolean not null default true
);
create unique index panels_chambers_slug_key on public.panels
  (coalesce(chambers_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

-- 4.10 grades — advocacy levels (national → recommended global).
create table public.grades (
  id uuid primary key default public.uuid_generate_v7(),
  chambers_id uuid references public.chambers (id) on delete restrict,
  name text not null,
  slug text not null,
  rank smallint not null, -- numeric ordering for range filters (4 > 3 > 2 > 1)
  is_active boolean not null default true
);
create unique index grades_chambers_slug_key on public.grades
  (coalesce(chambers_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

-- 4.11 panel_memberships — associative entity (M:N + attributes). Powers the
-- flagship "Level 4 on the RASSO panel" filter.
create table public.panel_memberships (
  id uuid primary key default public.uuid_generate_v7(),
  counsel_id uuid not null references public.counsel (id) on delete cascade,
  panel_id uuid not null references public.panels (id) on delete restrict,
  grade_id uuid references public.grades (id) on delete restrict, -- some panels are membership-only
  date_admitted date,
  date_expires date,
  status public.panel_membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_panel_memberships_updated_at before update on public.panel_memberships
  for each row execute function public.set_updated_at();
-- One active membership per panel, while allowing historical lapsed rows.
create unique index panel_memberships_active_key on public.panel_memberships (counsel_id, panel_id)
  where status = 'active';

-- 4.12 notable_cases — reported/notable work (1:M).
create table public.notable_cases (
  id uuid primary key default public.uuid_generate_v7(),
  counsel_id uuid not null references public.counsel (id) on delete cascade,
  title text not null,
  citation text,
  year smallint,
  court text,
  role_in_case text,
  summary text,
  is_published boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_notable_cases_updated_at before update on public.notable_cases
  for each row execute function public.set_updated_at();

-- 4.13 images — headshots and assets (1:M). Files live in storage; this is metadata.
create table public.images (
  id uuid primary key default public.uuid_generate_v7(),
  chambers_id uuid not null references public.chambers (id) on delete restrict,
  counsel_id uuid references public.counsel (id) on delete cascade, -- NULL = chambers-level asset
  type public.image_type not null default 'headshot',
  storage_key text not null,
  alt_text text,
  width int,
  height int,
  mime_type text,
  checksum text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references public.users (id)
);
-- Exactly one primary headshot per counsel.
create unique index images_primary_headshot_key on public.images (counsel_id)
  where is_primary = true and type = 'headshot';
