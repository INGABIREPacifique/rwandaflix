-- RwandaFlix schema reconciliation
-- Safe to run against a partially restored or previously migrated project.
-- It does not delete application data. Existing policies are replaced only where
-- this migration owns their names, preventing duplicate-policy failures.

create extension if not exists pgcrypto;

-- =========================================================
-- Core application tables
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  country text default 'Rwanda',
  role text default 'viewer',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists country text default 'Rwanda';
alter table public.profiles add column if not exists role text default 'viewer';
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  poster_url text,
  backdrop_url text,
  trailer_url text,
  video_url text,
  release_year integer,
  duration_minutes integer,
  genre text,
  director text,
  language text default 'Kinyarwanda',
  is_featured boolean default false,
  is_original boolean default false,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  poster_url text,
  backdrop_url text,
  trailer_url text,
  release_year integer,
  genre text,
  language text default 'Kinyarwanda',
  is_featured boolean default false,
  is_original boolean default false,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series(id) on delete cascade,
  title text not null,
  description text,
  episode_number integer not null,
  season_number integer default 1,
  duration_minutes integer,
  video_url text,
  thumbnail_url text,
  created_at timestamptz default now()
);

-- =========================================================
-- Viewer state
-- =========================================================

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  progress_seconds integer default 0,
  completed boolean default false,
  last_watched_at timestamptz default now()
);

alter table public.watchlist drop constraint if exists watchlist_one_title;
alter table public.watchlist drop constraint if exists watchlist_content_check;
alter table public.watchlist add constraint watchlist_content_check
check (((movie_id is not null)::integer + (series_id is not null)::integer) = 1);

alter table public.watch_history drop constraint if exists watch_history_one_title;
alter table public.watch_history drop constraint if exists watch_history_content_check;
alter table public.watch_history add constraint watch_history_content_check
check (((movie_id is not null)::integer + (episode_id is not null)::integer) = 1);

create unique index if not exists watchlist_user_movie_uidx
  on public.watchlist(user_id, movie_id) where movie_id is not null;
create unique index if not exists watchlist_user_series_uidx
  on public.watchlist(user_id, series_id) where series_id is not null;
create unique index if not exists watch_history_user_movie_uidx
  on public.watch_history(user_id, movie_id) where movie_id is not null;
create unique index if not exists watch_history_user_episode_uidx
  on public.watch_history(user_id, episode_id) where episode_id is not null;

-- =========================================================
-- Creator area
-- =========================================================

create table if not exists public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  studio_name text,
  display_name text,
  bio text,
  logo_url text,
  avatar_url text,
  website_url text,
  is_verified boolean default false,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.creator_profiles add column if not exists studio_name text;
alter table public.creator_profiles add column if not exists display_name text;
alter table public.creator_profiles add column if not exists bio text;
alter table public.creator_profiles add column if not exists logo_url text;
alter table public.creator_profiles add column if not exists avatar_url text;
alter table public.creator_profiles add column if not exists website_url text;
alter table public.creator_profiles add column if not exists is_verified boolean default false;
alter table public.creator_profiles add column if not exists verified boolean default false;
alter table public.creator_profiles add column if not exists created_at timestamptz default now();
alter table public.creator_profiles add column if not exists updated_at timestamptz default now();

update public.creator_profiles
set display_name = coalesce(display_name, studio_name, 'RwandaFlix Creator'),
    studio_name = coalesce(studio_name, display_name, 'RwandaFlix Creator'),
    avatar_url = coalesce(avatar_url, logo_url),
    logo_url = coalesce(logo_url, avatar_url),
    verified = coalesce(verified, is_verified, false),
    is_verified = coalesce(is_verified, verified, false),
    updated_at = now();

create table if not exists public.film_submissions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  title text not null,
  description text,
  poster_url text,
  trailer_url text,
  video_url text,
  genre text,
  language text default 'Kinyarwanda',
  release_year integer,
  duration_minutes integer,
  status text not null default 'pending',
  reviewer_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.film_submissions add column if not exists description text;
alter table public.film_submissions add column if not exists poster_url text;
alter table public.film_submissions add column if not exists trailer_url text;
alter table public.film_submissions add column if not exists video_url text;
alter table public.film_submissions add column if not exists genre text;
alter table public.film_submissions add column if not exists language text default 'Kinyarwanda';
alter table public.film_submissions add column if not exists release_year integer;
alter table public.film_submissions add column if not exists duration_minutes integer;
alter table public.film_submissions add column if not exists status text default 'pending';
alter table public.film_submissions add column if not exists reviewer_notes text;
alter table public.film_submissions add column if not exists submitted_at timestamptz;
alter table public.film_submissions add column if not exists reviewed_at timestamptz;
alter table public.film_submissions add column if not exists created_at timestamptz default now();
alter table public.film_submissions add column if not exists updated_at timestamptz default now();

-- =========================================================
-- Membership + notifications
-- =========================================================

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price_monthly numeric(10,2) not null default 0,
  max_profiles integer default 1,
  max_devices integer default 1,
  video_quality text default 'HD',
  ads_supported boolean default true,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status text not null default 'active',
  started_at timestamptz default now(),
  current_period_start timestamptz default now(),
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions add column if not exists cancelled_at timestamptz;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'general',
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications add column if not exists type text default 'general';
alter table public.notifications add column if not exists is_read boolean default false;

insert into public.subscription_plans
  (name, price_monthly, max_profiles, max_devices, video_quality, ads_supported, is_active)
values
  ('Free', 0, 1, 1, 'HD', true, true),
  ('Premium', 5.99, 2, 2, 'HD', false, true),
  ('Family', 9.99, 5, 5, '4K', false, true)
on conflict (name) do update set
  price_monthly = excluded.price_monthly,
  max_profiles = excluded.max_profiles,
  max_devices = excluded.max_devices,
  video_quality = excluded.video_quality,
  ads_supported = excluded.ads_supported,
  is_active = true;

-- =========================================================
-- Auth profile trigger
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================================================
-- RLS policy reconciliation
-- =========================================================

alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.series enable row level security;
alter table public.episodes enable row level security;
alter table public.watchlist enable row level security;
alter table public.watch_history enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.film_submissions enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Anyone can view published movies" on public.movies;
drop policy if exists "Anyone can view published series" on public.series;
drop policy if exists "Anyone can view episodes" on public.episodes;
drop policy if exists "Users can view their watchlist" on public.watchlist;
drop policy if exists "Users can add to watchlist" on public.watchlist;
drop policy if exists "Users can remove from watchlist" on public.watchlist;
drop policy if exists "Users can view their watch history" on public.watch_history;
drop policy if exists "Users can add watch history" on public.watch_history;
drop policy if exists "Users can update watch history" on public.watch_history;
drop policy if exists "Creators can view their profile" on public.creator_profiles;
drop policy if exists "Creators can create their profile" on public.creator_profiles;
drop policy if exists "Creators can update their profile" on public.creator_profiles;
drop policy if exists "Creators can view their submissions" on public.film_submissions;
drop policy if exists "Creators can create submissions" on public.film_submissions;
drop policy if exists "Creators can submit films" on public.film_submissions;
drop policy if exists "Creators can update submissions" on public.film_submissions;
drop policy if exists "Creators can update pending submissions" on public.film_submissions;
drop policy if exists "Anyone can view active subscription plans" on public.subscription_plans;
drop policy if exists "Users can view their subscriptions" on public.subscriptions;
drop policy if exists "Users can view their notifications" on public.notifications;
drop policy if exists "Users can mark their notifications read" on public.notifications;

create policy "Users can view their own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Anyone can view published movies" on public.movies for select to anon, authenticated using (is_published = true);
create policy "Anyone can view published series" on public.series for select to anon, authenticated using (is_published = true);
create policy "Anyone can view episodes" on public.episodes for select to anon, authenticated using (true);

create policy "Users can view their watchlist" on public.watchlist for select to authenticated using (auth.uid() = user_id);
create policy "Users can add to watchlist" on public.watchlist for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can remove from watchlist" on public.watchlist for delete to authenticated using (auth.uid() = user_id);

create policy "Users can view their watch history" on public.watch_history for select to authenticated using (auth.uid() = user_id);
create policy "Users can add watch history" on public.watch_history for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update watch history" on public.watch_history for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Creators can view their profile" on public.creator_profiles for select to authenticated using (auth.uid() = user_id);
create policy "Creators can create their profile" on public.creator_profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "Creators can update their profile" on public.creator_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Creators can view their submissions" on public.film_submissions for select to authenticated using (exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid()));
create policy "Creators can create submissions" on public.film_submissions for insert to authenticated with check (exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid()));
create policy "Creators can update submissions" on public.film_submissions for update to authenticated using (exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid())) with check (exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid()));

create policy "Anyone can view active subscription plans" on public.subscription_plans for select to anon, authenticated using (is_active = true);
create policy "Users can view their subscriptions" on public.subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "Users can view their notifications" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "Users can mark their notifications read" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- Supporting indexes
-- =========================================================

create index if not exists movies_public_catalog_idx on public.movies(is_published, release_year desc);
create index if not exists series_public_catalog_idx on public.series(is_published, release_year desc);
create index if not exists episodes_series_idx on public.episodes(series_id);
create index if not exists creator_profiles_user_idx on public.creator_profiles(user_id);
create index if not exists film_submissions_creator_idx on public.film_submissions(creator_id, created_at desc);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
