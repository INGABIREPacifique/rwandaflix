-- RwandaFlix FINAL LIVE SYNC
-- Run this AFTER supabase/schema.sql in Supabase SQL Editor.
-- Safe to rerun. It reconciles the earlier creator migration variants.

-- Core indexes used by the application.
create unique index if not exists watchlist_user_movie_uidx on public.watchlist(user_id, movie_id) where movie_id is not null;
create unique index if not exists watchlist_user_series_uidx on public.watchlist(user_id, series_id) where series_id is not null;
create unique index if not exists watch_history_user_movie_uidx on public.watch_history(user_id, movie_id) where movie_id is not null;
create unique index if not exists watch_history_user_episode_uidx on public.watch_history(user_id, episode_id) where episode_id is not null;

-- Creator schema reconciliation.
create table if not exists public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  website_url text,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.creator_profiles add column if not exists display_name text;
alter table public.creator_profiles add column if not exists bio text;
alter table public.creator_profiles add column if not exists avatar_url text;
alter table public.creator_profiles add column if not exists website_url text;
alter table public.creator_profiles add column if not exists verified boolean default false;
alter table public.creator_profiles add column if not exists studio_name text;
alter table public.creator_profiles add column if not exists logo_url text;
alter table public.creator_profiles add column if not exists is_verified boolean default false;
alter table public.creator_profiles alter column studio_name drop not null;

update public.creator_profiles
set display_name = coalesce(display_name, studio_name, 'RwandaFlix Creator'),
    verified = coalesce(verified, is_verified, false),
    avatar_url = coalesce(avatar_url, logo_url),
    updated_at = now()
where display_name is null or verified is null or avatar_url is null;

-- Submission table reconciliation.
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
alter table public.film_submissions add column if not exists created_at timestamptz default now();
alter table public.film_submissions add column if not exists updated_at timestamptz default now();

-- Subscription/notification fields required by the client.
alter table public.subscriptions add column if not exists cancelled_at timestamptz;
alter table public.notifications add column if not exists type text default 'general';
alter table public.notifications add column if not exists is_read boolean default false;

-- New-user profile trigger. Existing profile rows are preserved.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email,''), '@', 1)),
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
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- RLS: replace policies created by previous RwandaFlix migrations so duplicates cannot fail.
alter table public.creator_profiles enable row level security;
alter table public.film_submissions enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;

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

create index if not exists creator_profiles_user_idx on public.creator_profiles(user_id);
create index if not exists film_submissions_creator_idx on public.film_submissions(creator_id, created_at desc);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

insert into public.subscription_plans (name, price_monthly, max_profiles, max_devices, video_quality, ads_supported)
values ('Free',0,1,1,'HD',true),('Premium',5.99,2,2,'HD',false),('Family',9.99,5,5,'4K',false)
on conflict (name) do update set price_monthly=excluded.price_monthly,max_profiles=excluded.max_profiles,max_devices=excluded.max_devices,video_quality=excluded.video_quality,ads_supported=excluded.ads_supported,is_active=true;
