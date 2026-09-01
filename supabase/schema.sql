-- ============================================
-- RWANDAFLIX DATABASE SETUP
-- ============================================

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  country text default 'Rwanda',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MOVIES
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

-- SERIES
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

-- EPISODES
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

-- WATCHLIST
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  created_at timestamptz default now()
);

-- WATCH HISTORY
create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  progress_seconds integer default 0,
  completed boolean default false,
  last_watched_at timestamptz default now()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.series enable row level security;
alter table public.episodes enable row level security;
alter table public.watchlist enable row level security;
alter table public.watch_history enable row level security;

-- ============================================
-- PROFILES POLICIES
-- ============================================

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- ============================================
-- MOVIES POLICIES
-- ============================================

create policy "Anyone can view published movies"
on public.movies
for select
to anon, authenticated
using (is_published = true);

-- ============================================
-- SERIES POLICIES
-- ============================================

create policy "Anyone can view published series"
on public.series
for select
to anon, authenticated
using (is_published = true);

-- ============================================
-- EPISODES POLICIES
-- ============================================

create policy "Anyone can view episodes"
on public.episodes
for select
to anon, authenticated
using (true);

-- ============================================
-- WATCHLIST POLICIES
-- ============================================

create policy "Users can view their watchlist"
on public.watchlist
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can add to watchlist"
on public.watchlist
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can remove from watchlist"
on public.watchlist
for delete
to authenticated
using (auth.uid() = user_id);

-- ============================================
-- WATCH HISTORY POLICIES
-- ============================================

create policy "Users can view their watch history"
on public.watch_history
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can add watch history"
on public.watch_history
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update watch history"
on public.watch_history
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================

create index if not exists movies_genre_idx
on public.movies(genre);

create index if not exists movies_featured_idx
on public.movies(is_featured);

create index if not exists series_genre_idx
on public.series(genre);

create index if not exists episodes_series_idx
on public.episodes(series_id);

create index if not exists watchlist_user_idx
on public.watchlist(user_id);

create index if not exists watch_history_user_idx
on public.watch_history(user_id);