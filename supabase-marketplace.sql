-- GastroConnect marketplace support.
-- Run in Supabase SQL Editor after review. It does not change Supabase keys or auth settings.
-- Existing tables worker_profiles, shift_invites and supplier_offers are reused.

create table if not exists public.supply_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text,
  quantity text,
  budget text,
  city text,
  message text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.supply_requests enable row level security;

drop policy if exists "restaurants can create supply requests" on public.supply_requests;
create policy "restaurants can create supply requests"
on public.supply_requests
for insert
to authenticated
with check (restaurant_id = auth.uid());

drop policy if exists "restaurants can update own supply requests" on public.supply_requests;
create policy "restaurants can update own supply requests"
on public.supply_requests
for update
to authenticated
using (restaurant_id = auth.uid())
with check (restaurant_id = auth.uid());

drop policy if exists "authenticated can read supply requests" on public.supply_requests;
create policy "authenticated can read supply requests"
on public.supply_requests
for select
to authenticated
using (true);
