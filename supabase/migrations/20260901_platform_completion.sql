-- RwandaFlix platform completion migration
-- Run after supabase/schema.sql and 20260901_backend_hardening.sql.

-- Ensure each watchlist row points to exactly one content type.
alter table public.watchlist drop constraint if exists watchlist_content_check;
alter table public.watchlist add constraint watchlist_content_check
check (((movie_id is not null)::integer + (series_id is not null)::integer) = 1);

-- Safe upsert targets for movie watchlists/history.
create unique index if not exists watchlist_user_movie_uidx
on public.watchlist(user_id, movie_id) where movie_id is not null;

create unique index if not exists watchlist_user_series_uidx
on public.watchlist(user_id, series_id) where series_id is not null;

alter table public.watch_history drop constraint if exists watch_history_content_check;
alter table public.watch_history add constraint watch_history_content_check
check (((movie_id is not null)::integer + (episode_id is not null)::integer) = 1);

create unique index if not exists watch_history_user_movie_uidx
on public.watch_history(user_id, movie_id) where movie_id is not null;

create unique index if not exists watch_history_user_episode_uidx
on public.watch_history(user_id, episode_id) where episode_id is not null;

-- CREATOR PROFILES
create table if not exists public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  studio_name text not null,
  bio text,
  logo_url text,
  website_url text,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- FILM SUBMISSIONS
create table if not exists public.film_submissions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  title text not null,
  description text,
  poster_url text,
  trailer_url text,
  video_url text,
  release_year integer,
  duration_minutes integer,
  genre text,
  language text default 'Kinyarwanda',
  status text not null default 'draft' check (status in ('draft','submitted','reviewing','approved','rejected')),
  reviewer_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SUBSCRIPTION PLANS
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price_monthly numeric(10,2) not null default 0 check (price_monthly >= 0),
  max_profiles integer not null default 1,
  max_devices integer not null default 1,
  video_quality text not null default 'standard',
  ads_supported boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- USER SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status text not null default 'active' check (status in ('trialing','active','past_due','cancelled','expired')),
  started_at timestamptz default now(),
  current_period_start timestamptz default now(),
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'system',
  is_read boolean not null default false,
  created_at timestamptz default now()
);

-- Seed plans.
insert into public.subscription_plans (name, price_monthly, max_profiles, max_devices, video_quality, ads_supported)
values
  ('Free', 0, 1, 1, 'standard', true),
  ('Premium', 5.99, 1, 2, 'hd', false),
  ('Family', 9.99, 5, 5, '4k', false)
on conflict (name) do update set
  price_monthly = excluded.price_monthly,
  max_profiles = excluded.max_profiles,
  max_devices = excluded.max_devices,
  video_quality = excluded.video_quality,
  ads_supported = excluded.ads_supported,
  is_active = true;

-- RLS
alter table public.creator_profiles enable row level security;
alter table public.film_submissions enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;

create policy "Creators can view their profile" on public.creator_profiles for select to authenticated
using (auth.uid() = user_id);
create policy "Creators can create their profile" on public.creator_profiles for insert to authenticated
with check (auth.uid() = user_id);
create policy "Creators can update their profile" on public.creator_profiles for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Creators can view their submissions" on public.film_submissions for select to authenticated
using (exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid()));
create policy "Creators can create submissions" on public.film_submissions for insert to authenticated
with check (exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid()));
create policy "Creators can update submissions" on public.film_submissions for update to authenticated
using (exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid()))
with check (exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid()));

create policy "Anyone can view active subscription plans" on public.subscription_plans for select to anon, authenticated
using (is_active = true);
create policy "Users can view their subscriptions" on public.subscriptions for select to authenticated
using (auth.uid() = user_id);
create policy "Users can view their notifications" on public.notifications for select to authenticated
using (auth.uid() = user_id);
create policy "Users can mark their notifications read" on public.notifications for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists creator_profiles_user_idx on public.creator_profiles(user_id);
create index if not exists film_submissions_creator_status_idx on public.film_submissions(creator_id, status);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
