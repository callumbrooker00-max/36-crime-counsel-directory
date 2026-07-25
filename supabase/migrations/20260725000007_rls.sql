-- Row-Level Security (data-model.md §1, api-contract.md §9). Deny by default;
-- the chambers is derived from the session's active memberships, never a
-- request parameter. Helpers are SECURITY DEFINER so policies never recurse.

-- Chambers the current user has an ACTIVE membership in.
create or replace function app.current_chambers_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.chambers_id
  from public.memberships m
  where m.user_id = auth.uid() and m.status = 'active';
$$;

-- Cross-tenant operator.
create or replace function app.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.status = 'active' and m.role = 'platform_admin'
  );
$$;

-- May administer users/access within a chambers.
create or replace function app.is_chambers_admin(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.chambers_id = target and m.status = 'active'
      and m.role in ('chambers_admin', 'platform_admin')
  );
$$;

-- May edit member data within a chambers (clerk and above).
create or replace function app.can_edit(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.chambers_id = target and m.status = 'active'
      and m.role in ('clerk', 'chambers_admin', 'platform_admin')
  );
$$;

grant usage on schema app to authenticated, anon, service_role;
grant execute on all functions in schema app to authenticated, anon, service_role;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere (no policy for anon anywhere → anon is denied; the
-- client read path is served by a trusted server context, not direct access).
-- ---------------------------------------------------------------------------
alter table public.chambers enable row level security;
alter table public.users enable row level security;
alter table public.memberships enable row level security;
alter table public.counsel enable row level security;
alter table public.practice_areas enable row level security;
alter table public.counsel_practice_areas enable row level security;
alter table public.roles enable row level security;
alter table public.counsel_roles enable row level security;
alter table public.panels enable row level security;
alter table public.grades enable row level security;
alter table public.panel_memberships enable row level security;
alter table public.notable_cases enable row level security;
alter table public.images enable row level security;
alter table public.audit_logs enable row level security;

-- chambers: members read their own; only platform admin mutates.
create policy chambers_select on public.chambers for select to authenticated
  using (id in (select app.current_chambers_ids()) or app.is_platform_admin());
create policy chambers_write on public.chambers for all to authenticated
  using (app.is_platform_admin()) with check (app.is_platform_admin());

-- users: self, fellow chambers members, or platform admin.
create policy users_select on public.users for select to authenticated
  using (
    id = auth.uid()
    or app.is_platform_admin()
    or id in (select m.user_id from public.memberships m where m.chambers_id in (select app.current_chambers_ids()))
  );
create policy users_update_self on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- memberships: see your own or your chambers'; chambers_admin manages them.
create policy memberships_select on public.memberships for select to authenticated
  using (user_id = auth.uid() or chambers_id in (select app.current_chambers_ids()) or app.is_platform_admin());
create policy memberships_write on public.memberships for all to authenticated
  using (app.is_chambers_admin(chambers_id)) with check (app.is_chambers_admin(chambers_id));

-- counsel: members read their chambers; clerk+ writes.
create policy counsel_select on public.counsel for select to authenticated
  using (chambers_id in (select app.current_chambers_ids()) or app.is_platform_admin());
create policy counsel_write on public.counsel for all to authenticated
  using (app.can_edit(chambers_id)) with check (app.can_edit(chambers_id));

-- Lookups (nullable chambers_id): global rows readable by all authenticated
-- users; tenant rows scoped; global writes are platform-only.
create policy practice_areas_select on public.practice_areas for select to authenticated
  using (chambers_id is null or chambers_id in (select app.current_chambers_ids()) or app.is_platform_admin());
create policy practice_areas_write on public.practice_areas for all to authenticated
  using ((chambers_id is not null and app.can_edit(chambers_id)) or (chambers_id is null and app.is_platform_admin()))
  with check ((chambers_id is not null and app.can_edit(chambers_id)) or (chambers_id is null and app.is_platform_admin()));

create policy roles_select on public.roles for select to authenticated
  using (chambers_id is null or chambers_id in (select app.current_chambers_ids()) or app.is_platform_admin());
create policy roles_write on public.roles for all to authenticated
  using ((chambers_id is not null and app.can_edit(chambers_id)) or (chambers_id is null and app.is_platform_admin()))
  with check ((chambers_id is not null and app.can_edit(chambers_id)) or (chambers_id is null and app.is_platform_admin()));

create policy panels_select on public.panels for select to authenticated
  using (chambers_id is null or chambers_id in (select app.current_chambers_ids()) or app.is_platform_admin());
create policy panels_write on public.panels for all to authenticated
  using ((chambers_id is not null and app.can_edit(chambers_id)) or (chambers_id is null and app.is_platform_admin()))
  with check ((chambers_id is not null and app.can_edit(chambers_id)) or (chambers_id is null and app.is_platform_admin()));

create policy grades_select on public.grades for select to authenticated
  using (chambers_id is null or chambers_id in (select app.current_chambers_ids()) or app.is_platform_admin());
create policy grades_write on public.grades for all to authenticated
  using ((chambers_id is not null and app.can_edit(chambers_id)) or (chambers_id is null and app.is_platform_admin()))
  with check ((chambers_id is not null and app.can_edit(chambers_id)) or (chambers_id is null and app.is_platform_admin()));

-- Junctions / children: scoped through the owning counsel's chambers.
create policy cpa_select on public.counsel_practice_areas for select to authenticated
  using (exists (select 1 from public.counsel c where c.id = counsel_id
    and (c.chambers_id in (select app.current_chambers_ids()) or app.is_platform_admin())));
create policy cpa_write on public.counsel_practice_areas for all to authenticated
  using (exists (select 1 from public.counsel c where c.id = counsel_id and app.can_edit(c.chambers_id)))
  with check (exists (select 1 from public.counsel c where c.id = counsel_id and app.can_edit(c.chambers_id)));

create policy cr_select on public.counsel_roles for select to authenticated
  using (exists (select 1 from public.counsel c where c.id = counsel_id
    and (c.chambers_id in (select app.current_chambers_ids()) or app.is_platform_admin())));
create policy cr_write on public.counsel_roles for all to authenticated
  using (exists (select 1 from public.counsel c where c.id = counsel_id and app.can_edit(c.chambers_id)))
  with check (exists (select 1 from public.counsel c where c.id = counsel_id and app.can_edit(c.chambers_id)));

create policy pm_select on public.panel_memberships for select to authenticated
  using (exists (select 1 from public.counsel c where c.id = counsel_id
    and (c.chambers_id in (select app.current_chambers_ids()) or app.is_platform_admin())));
create policy pm_write on public.panel_memberships for all to authenticated
  using (exists (select 1 from public.counsel c where c.id = counsel_id and app.can_edit(c.chambers_id)))
  with check (exists (select 1 from public.counsel c where c.id = counsel_id and app.can_edit(c.chambers_id)));

create policy nc_select on public.notable_cases for select to authenticated
  using (exists (select 1 from public.counsel c where c.id = counsel_id
    and (c.chambers_id in (select app.current_chambers_ids()) or app.is_platform_admin())));
create policy nc_write on public.notable_cases for all to authenticated
  using (exists (select 1 from public.counsel c where c.id = counsel_id and app.can_edit(c.chambers_id)))
  with check (exists (select 1 from public.counsel c where c.id = counsel_id and app.can_edit(c.chambers_id)));

-- images: carry chambers_id directly.
create policy images_select on public.images for select to authenticated
  using (chambers_id in (select app.current_chambers_ids()) or app.is_platform_admin());
create policy images_write on public.images for all to authenticated
  using (app.can_edit(chambers_id)) with check (app.can_edit(chambers_id));

-- audit_logs: read-only to chambers admins / platform admin; writes via trusted
-- server context only (no insert policy here).
create policy audit_select on public.audit_logs for select to authenticated
  using (
    (chambers_id is not null and (app.is_chambers_admin(chambers_id) or app.is_platform_admin()))
    or (chambers_id is null and app.is_platform_admin())
  );
