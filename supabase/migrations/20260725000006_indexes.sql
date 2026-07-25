-- Indexing (data-model.md §7). Every FK indexed (Postgres does not do this
-- automatically) plus the directory/panel read-pattern composites.

-- Directory base filter: "published counsel in this chambers".
create index idx_counsel_chambers_status on public.counsel (chambers_id, status);
create index idx_counsel_created_by on public.counsel (created_by);
create index idx_counsel_updated_by on public.counsel (updated_by);

-- Panel filter: resolve "Level 4 on RASSO" quickly.
create index idx_panel_memberships_panel_grade_status on public.panel_memberships (panel_id, grade_id, status);
create index idx_panel_memberships_counsel on public.panel_memberships (counsel_id);
create index idx_panel_memberships_grade on public.panel_memberships (grade_id);

-- Membership / RBAC lookups.
create index idx_memberships_user on public.memberships (user_id);
create index idx_memberships_chambers on public.memberships (chambers_id);

-- Junction reverse-direction FKs (composite PK already covers the leading column).
create index idx_counsel_practice_areas_pa on public.counsel_practice_areas (practice_area_id);
create index idx_counsel_roles_role on public.counsel_roles (role_id);

-- One-to-many children.
create index idx_notable_cases_counsel on public.notable_cases (counsel_id);
create index idx_images_counsel on public.images (counsel_id);
create index idx_images_chambers on public.images (chambers_id);

-- Lookup tenant scoping.
create index idx_practice_areas_chambers on public.practice_areas (chambers_id);
create index idx_roles_chambers on public.roles (chambers_id);
create index idx_panels_chambers on public.panels (chambers_id);
create index idx_grades_chambers on public.grades (chambers_id);

-- Audit access paths.
create index idx_audit_chambers_time on public.audit_logs (chambers_id, occurred_at desc);
create index idx_audit_entity on public.audit_logs (entity_type, entity_id);
create index idx_audit_actor on public.audit_logs (actor_user_id);
