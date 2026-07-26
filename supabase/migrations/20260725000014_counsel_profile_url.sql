-- External profile link (chambers website). Client-visible as a discreet
-- "Full profile at <host>" link on the profile. Push-only, additive.
alter table public.counsel add column profile_url text;
