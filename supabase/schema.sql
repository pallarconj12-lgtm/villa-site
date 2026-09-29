-- Perry's Ville: bookings backend. Run once in Supabase → SQL Editor.
-- All objects are prefixed pv_ so they never clash with your other apps in this project.

create extension if not exists btree_gist;

create table if not exists public.pv_bookings (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  check_in    date not null,
  check_out   date not null,
  guests      int  not null check (guests between 1 and 8),
  guest_name  text not null check (char_length(guest_name) between 1 and 120),
  guest_email text not null check (guest_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  guest_phone text check (char_length(guest_phone) <= 40),
  notes       text check (char_length(notes) <= 1000),
  total       numeric(10,2),
  status      text not null default 'pending'
              check (status in ('pending','confirmed','declined','blocked')),
  check (check_out > check_in),
  -- two confirmed stays (or owner blocks) can never overlap; pending requests can
  constraint pv_no_overlap
    exclude using gist (daterange(check_in, check_out) with &&)
    where (status in ('confirmed','blocked'))
);

create table if not exists public.pv_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.pv_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pv_admins where user_id = auth.uid())
$$;

alter table public.pv_bookings enable row level security;
alter table public.pv_admins   enable row level security;

-- visitors may only CREATE pending requests; they can never read any booking
create policy pv_insert_pending on public.pv_bookings
  for insert to anon, authenticated with check (status = 'pending');

-- admins can do everything
create policy pv_admin_all on public.pv_bookings
  for all to authenticated using (public.pv_is_admin()) with check (public.pv_is_admin());

create policy pv_admin_self on public.pv_admins
  for select to authenticated using (user_id = auth.uid());

-- public availability: dates only, no personal data
create or replace function public.pv_availability()
returns table (check_in date, check_out date)
language sql stable security definer set search_path = public as $$
  select check_in, check_out from public.pv_bookings
  where status in ('confirmed','blocked') and check_out >= current_date
$$;
grant execute on function public.pv_availability() to anon, authenticated;

-- AFTER creating your admin login (Authentication → Users → Add user), run:
-- insert into public.pv_admins (user_id) select id from auth.users where email = 'YOU@EXAMPLE.COM';
