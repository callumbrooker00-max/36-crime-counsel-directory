-- Mirror auth.users into public.users on signup. Credentials stay in the auth
-- provider (data-model.md §4.2); this row is the application profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, status)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', 'active')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
