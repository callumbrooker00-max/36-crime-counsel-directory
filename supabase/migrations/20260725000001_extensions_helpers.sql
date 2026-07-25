-- Extensions and shared helpers.

create extension if not exists pgcrypto; -- gen_random_bytes / gen_random_uuid

-- Time-ordered UUID v7. Supabase's Postgres predates native uuidv7(), so we
-- generate one: 48-bit unix-ms timestamp, version 7, variant 10, rest random.
create or replace function public.uuid_generate_v7()
returns uuid
language plpgsql
volatile
as $$
declare
  unix_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  b bytea := gen_random_bytes(16);
begin
  -- first 48 bits: big-endian unix milliseconds (mask in bigint, then cast — a
  -- high byte shifted still exceeds int32, so the mask must come first)
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

-- Keep updated_at fresh on any row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Helper schema for RLS predicates (security-definer, so policies never recurse).
create schema if not exists app;
