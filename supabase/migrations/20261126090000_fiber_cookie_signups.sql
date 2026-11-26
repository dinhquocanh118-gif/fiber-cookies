begin;
create table public.fiber_cookie_signups (
  id uuid primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 100),
  email text check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  phone text check (phone ~ '^[+]?[0-9]{8,15}$'),
  flavor text check (flavor in ('tim-bui', 'nang-vang', 'cam-oi', 'xanh-diu')),
  message text check (char_length(message) <= 500),
  consent_at timestamptz not null default now(),
  contacted_at timestamptz,
  check (email is not null or phone is not null)
);
alter table public.fiber_cookie_signups enable row level security;
revoke all on public.fiber_cookie_signups from public, anon, authenticated;
grant select, insert, update, delete on public.fiber_cookie_signups to service_role;
create index fiber_cookie_signups_created_at_idx on public.fiber_cookie_signups (created_at desc);
create index fiber_cookie_signups_email_created_at_idx on public.fiber_cookie_signups (email, created_at desc) where email is not null;
create index fiber_cookie_signups_phone_created_at_idx on public.fiber_cookie_signups (phone, created_at desc) where phone is not null;
create function public.submit_fiber_cookie_signup(
  p_id uuid, p_name text, p_email text, p_phone text, p_flavor text, p_message text
) returns text
language plpgsql
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(9271041);
  if exists (select 1 from public.fiber_cookie_signups where id = p_id) then
    return 'accepted';
  end if;
  if (select count(*) from public.fiber_cookie_signups where created_at >= now() - interval '1 minute') >= 30
    or (select count(*) from public.fiber_cookie_signups where created_at >= now() - interval '1 hour'
        and (email = p_email or phone = p_phone)) >= 3
  then
    return 'limited';
  end if;
  insert into public.fiber_cookie_signups (id, name, email, phone, flavor, message)
  values (p_id, p_name, p_email, p_phone, p_flavor, p_message);
  return 'accepted';
end;
$$;
revoke all on function public.submit_fiber_cookie_signup(uuid,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_fiber_cookie_signup(uuid,text,text,text,text,text) to service_role;
notify pgrst, 'reload schema';
commit;
