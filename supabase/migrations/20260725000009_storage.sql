-- Private storage for headshots/assets. Files are keyed by chambers: the first
-- path segment is the chambers_id, so RLS can scope objects to the tenant.
insert into storage.buckets (id, name, public)
values ('counsel-images', 'counsel-images', false)
on conflict (id) do nothing;

-- Members of the chambers may read its objects; clerk+ may write them.
create policy "counsel-images read by chambers members"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'counsel-images'
    and (
      nullif(split_part(name, '/', 1), '')::uuid in (select app.current_chambers_ids())
      or app.is_platform_admin()
    )
  );

create policy "counsel-images write by chambers editors"
  on storage.objects for all to authenticated
  using (bucket_id = 'counsel-images' and app.can_edit(nullif(split_part(name, '/', 1), '')::uuid))
  with check (bucket_id = 'counsel-images' and app.can_edit(nullif(split_part(name, '/', 1), '')::uuid));
