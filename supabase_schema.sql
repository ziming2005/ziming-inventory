create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  account_type text check (account_type in ('individual','company')),
  phone text,
  position text,
  company_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  data jsonb not null default '{}',
  blueprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_touch_updated
before update on public.profiles
for each row execute procedure public.touch_updated_at();

create trigger inventories_touch_updated
before update on public.inventories
for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.inventories enable row level security;

create policy "Profiles are readable by owners" on public.profiles
  for select using (auth.uid() = user_id);
create policy "Profiles are insertable by owners" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "Profiles are updatable by owners" on public.profiles
  for update using (auth.uid() = user_id);

create policy "Inventories are readable by owners" on public.inventories
  for select using (auth.uid() = user_id);
create policy "Inventories are insertable by owners" on public.inventories
  for insert with check (auth.uid() = user_id);
create policy "Inventories are updatable by owners" on public.inventories
  for update using (auth.uid() = user_id);
