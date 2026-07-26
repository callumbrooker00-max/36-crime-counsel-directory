-- RLS / tenant-isolation verification. Run in the Supabase SQL editor (London)
-- or via psql. All changes are rolled back — it writes nothing permanent.

-- 1) RLS must be enabled on every public table (expect relrowsecurity = t).
select relname as table, relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by relrowsecurity asc, relname;

-- 2) A clerk sees only their chambers; a non-member sees nothing.
begin;
insert into auth.users (id, email, aud, role)
  values ('00000000-0000-0000-0000-0000000000ab', 'rls-test@example.com', 'authenticated', 'authenticated');
insert into public.memberships (user_id, chambers_id, role, status)
  select '00000000-0000-0000-0000-0000000000ab', id, 'clerk', 'active'
  from public.chambers order by created_at limit 1;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000ab"}', true);
select 'member sees counsel (expect > 0): ' || count(*) as check_member from counsel;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000099"}', true);
select 'non-member sees counsel (expect 0): ' || count(*) as check_nonmember from counsel;
rollback;
