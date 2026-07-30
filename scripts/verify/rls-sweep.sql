-- Full RLS sweep — confirm Row-Level Security is enabled on EVERY table in the
-- public schema (not just the ones probed over REST).
--
-- Run it in the Supabase SQL editor (London project) or via psql. Read-only.
--   Dashboard → SQL Editor → New query → paste → Run.
--
-- Expect EVERY row to show rls_enabled = true. Any row with false is a hole:
-- that table is readable/writable outside its policies.

select
  n.nspname               as schema,
  c.relname               as table,
  c.relrowsecurity        as rls_enabled,
  c.relforcerowsecurity   as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'            -- ordinary tables only
order by c.relrowsecurity asc,   -- any FALSE (holes) float to the top
         c.relname;

-- Bonus: list tables that have RLS on but ZERO policies (on = deny-all, which
-- may be intentional for service-role-only tables, but worth eyeballing).
select c.relname as table_with_rls_but_no_policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
order by c.relname;
