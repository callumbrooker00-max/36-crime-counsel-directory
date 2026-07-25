-- Table privileges. RLS is the ROW-level boundary; these are the TABLE-level
-- grants it filters on top of. Without them, even a valid authenticated user is
-- denied before any policy runs.
--
--   anon           — nothing. Clients never query these tables directly; the
--                    /directory payload is built in a trusted server context.
--   authenticated  — full CRUD, with every row scoped by the RLS policies.
--   service_role   — bypasses RLS (trusted server work: payload build, admin).

grant usage on schema public to authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

-- Apply the same grants to any tables added by later migrations.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
