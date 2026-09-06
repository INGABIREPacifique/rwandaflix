-- Real creator analytics, phase 1: data model.
-- Previously, movies had no link back to which creator (if any)
-- submitted it, making "your movies' views" structurally impossible.
-- Also adds a genuine playback_events table so view counts are real
-- counts of actual plays, not a hardcoded number.

alter table public.movies add column if not exists creator_id uuid references public.creator_profiles(id) on delete set null;

create table if not exists public.playback_events (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid references public.movies(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  constraint playback_events_content_check
    check (((movie_id is not null)::integer + (episode_id is not null)::integer) = 1)
);

create index if not exists playback_events_movie_idx on public.playback_events(movie_id);
create index if not exists playback_events_episode_idx on public.playback_events(episode_id);

alter table public.playback_events enable row level security;

-- Anyone (including signed-out visitors, for accurate public-content
-- view counts) can record that a play happened. This is deliberately
-- permissive on INSERT since it's just an anonymous or user-tagged
-- event log, not sensitive data.
drop policy if exists "Anyone can record a playback event" on public.playback_events;
create policy "Anyone can record a playback event"
on public.playback_events for insert to anon, authenticated
with check (true);

-- Only admins and the owning creator can read the raw event log.
-- Regular viewers don't need to see this; creators see aggregate
-- counts for their own movies, admins can see everything.
drop policy if exists "Creators can view events for their own movies" on public.playback_events;
create policy "Creators can view events for their own movies"
on public.playback_events for select to authenticated
using (
  exists (
    select 1 from public.movies m
    join public.creator_profiles cp on cp.id = m.creator_id
    where m.id = playback_events.movie_id and cp.user_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
