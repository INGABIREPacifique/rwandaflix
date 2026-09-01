-- RwandaFlix initial database schema
-- Run this script once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'viewer' check (role in ('viewer', 'creator', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null default 'movie' check (type in ('movie', 'series')),
  genre text,
  release_year integer,
  duration_minutes integer,
  poster_url text,
  backdrop_url text,
  video_url text,
  is_original boolean not null default false,
  is_published boolean not null default false,
  creator_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.watchlist (
  user_id uuid not null references public.profiles(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

create table if not exists public.watch_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  progress_seconds integer not null default 0 check (progress_seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.watchlist enable row level security;
alter table public.watch_progress enable row level security;

create policy "profiles are viewable by owner"
on public.profiles for select
using (auth.uid() = id);

create policy "users can insert their profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "users can update their profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "published movies are public"
on public.movies for select
using (is_published = true or auth.uid() = creator_id);

create policy "creators can insert their movies"
on public.movies for insert
authenticated
with check (auth.uid() = creator_id);

create policy "creators can update their movies"
on public.movies for update
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

create policy "users manage their watchlist"
on public.watchlist for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage their watch progress"
on public.watch_progress for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
