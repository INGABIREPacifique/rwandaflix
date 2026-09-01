-- RwandaFlix catalog reconciliation
-- Run AFTER supabase/schema.sql and 20260901_final_live_sync.sql.
-- Safe to rerun. Preserves existing movies and subscription plans.

-- Missing catalog support tables reported by the live Supabase project.
create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  rating numeric(2,1) not null check (rating >= 1 and rating <= 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint ratings_user_movie_unique unique (user_id, movie_id)
);

create index if not exists genres_name_idx on public.genres(name);
create index if not exists ratings_movie_idx on public.ratings(movie_id);
create index if not exists ratings_user_idx on public.ratings(user_id);

alter table public.genres enable row level security;
alter table public.ratings enable row level security;

drop policy if exists "Anyone can view genres" on public.genres;
drop policy if exists "Users can view their ratings" on public.ratings;
drop policy if exists "Users can create their ratings" on public.ratings;
drop policy if exists "Users can update their ratings" on public.ratings;
drop policy if exists "Users can delete their ratings" on public.ratings;

create policy "Anyone can view genres"
on public.genres for select to anon, authenticated
using (true);

create policy "Users can view their ratings"
on public.ratings for select to authenticated
using (auth.uid() = user_id);

create policy "Users can create their ratings"
on public.ratings for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their ratings"
on public.ratings for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their ratings"
on public.ratings for delete to authenticated
using (auth.uid() = user_id);

-- Canonical RwandaFlix genres used by the original UI and catalog.
insert into public.genres (name, slug, description)
values
  ('Drama', 'drama', 'Rwandan dramatic stories and character-driven films.'),
  ('Romance', 'romance', 'Rwandan love stories and relationship-driven films.'),
  ('Comedy', 'comedy', 'Rwandan comedy and light-hearted stories.'),
  ('Thriller', 'thriller', 'Suspenseful Rwandan stories and mysteries.'),
  ('Documentary', 'documentary', 'Documentaries exploring Rwanda, its people and culture.'),
  ('Family', 'family', 'Stories suitable for families and shared viewing.'),
  ('Action', 'action', 'Action-focused Rwandan stories and adventures.'),
  ('Historical', 'historical', 'Stories inspired by Rwanda''s history and heritage.')
on conflict (name) do update
set slug = excluded.slug,
    description = excluded.description,
    updated_at = now();

-- Keep the existing movie genre text compatible with the genre catalog.
update public.movies
set genre = initcap(trim(genre))
where genre is not null and trim(genre) <> '';

-- Ensure the existing demo catalog is visible to the public catalog query.
update public.movies
set is_published = true
where is_published is null;

comment on table public.genres is 'RwandaFlix canonical catalog genres.';
comment on table public.ratings is 'One authenticated viewer rating per movie.';
