-- GastroConnect launch fixes.
-- Run this in Supabase SQL Editor before advertising the site.
-- It does not expose service-role/private keys and is safe for a frontend-only app.

create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create table if not exists public.public_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('worker', 'restaurant', 'supplier', 'callback', 'feedback', 'telegram_bot')),
  title text,
  phone text,
  telegram text,
  city text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.public_submissions enable row level security;
grant insert on public.public_submissions to anon, authenticated;
grant select on public.public_submissions to authenticated;

drop policy if exists public_submissions_insert_anon on public.public_submissions;
create policy public_submissions_insert_anon
on public.public_submissions
for insert
to anon, authenticated
with check (type in ('worker', 'restaurant', 'supplier', 'callback', 'feedback', 'telegram_bot'));

drop policy if exists public_submissions_admin_select on public.public_submissions;
create policy public_submissions_admin_select
on public.public_submissions
for select
to authenticated
using (public.is_admin());

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('worker', 'restaurant', 'supplier', 'admin')),
  name text not null,
  city text,
  district text,
  status text not null default 'active',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and role in ('worker', 'restaurant', 'supplier')
);

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (
  public.is_admin()
  or (
    id = auth.uid()
    and role in ('worker', 'restaurant', 'supplier')
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name, city, status)
  values (
    new.id,
    case
      when new.raw_user_meta_data->>'role' in ('worker', 'restaurant', 'supplier')
        then new.raw_user_meta_data->>'role'
      else 'worker'
    end,
    coalesce(new.raw_user_meta_data->>'name', new.email, 'Пользователь'),
    new.raw_user_meta_data->>'city',
    'active'
  )
  on conflict (id) do update set
    role = excluded.role,
    name = excluded.name,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
