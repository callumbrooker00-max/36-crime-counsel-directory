-- Fix: on Supabase, pgcrypto is installed in the `extensions` schema, so the
-- unqualified gen_random_bytes() inside uuid_generate_v7() fails to resolve when
-- the caller's search_path doesn't include extensions (e.g. during seeding on
-- the hosted project: "function gen_random_bytes(integer) does not exist").
--
-- Pin the function's OWN search_path so it resolves regardless of the caller.
-- New migration by design — 0001 is already applied; we redefine in place.
-- (gen_random_bytes is the only pgcrypto call in the schema; gen_random_uuid is
-- not used and is a core function anyway.)
create or replace function public.uuid_generate_v7()
returns uuid
language plpgsql
volatile
set search_path = public, extensions
as $$
declare
  unix_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  b bytea := gen_random_bytes(16);
begin
  -- first 48 bits: big-endian unix milliseconds (mask in bigint, then cast)
  b := set_byte(b, 0, ((unix_ms >> 40) & 255)::int);
  b := set_byte(b, 1, ((unix_ms >> 32) & 255)::int);
  b := set_byte(b, 2, ((unix_ms >> 24) & 255)::int);
  b := set_byte(b, 3, ((unix_ms >> 16) & 255)::int);
  b := set_byte(b, 4, ((unix_ms >> 8) & 255)::int);
  b := set_byte(b, 5, (unix_ms & 255)::int);
  -- version 7 in the high nibble of byte 6
  b := set_byte(b, 6, (get_byte(b, 6) & 15) | 112);
  -- variant 10 in the high bits of byte 8
  b := set_byte(b, 8, (get_byte(b, 8) & 63) | 128);
  return encode(b, 'hex')::uuid;
end;
$$;
