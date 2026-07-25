-- Enumerated types (small, stable sets — data-model.md §2).

create type public.chambers_status as enum ('active', 'suspended');
create type public.user_status as enum ('active', 'invited', 'disabled');
create type public.membership_role as enum ('platform_admin', 'chambers_admin', 'clerk', 'viewer');
create type public.membership_status as enum ('active', 'invited', 'revoked');
create type public.counsel_status as enum ('draft', 'published', 'archived');
create type public.practice_capacity as enum ('prosecution', 'defence', 'both');
create type public.panel_type as enum ('general', 'specialist');
create type public.panel_membership_status as enum ('active', 'lapsed', 'pending');
create type public.image_type as enum ('headshot', 'chambers_logo', 'other');
create type public.audit_action as enum (
  'create', 'update', 'delete', 'publish', 'unpublish', 'login', 'access_grant', 'access_revoke'
);
