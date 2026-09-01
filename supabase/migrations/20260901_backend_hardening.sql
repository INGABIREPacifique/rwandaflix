-- RwandaFlix backend hardening migration
-- Run after supabase/schema.sql.

-- Unique composite indexes support Supabase upsert(onConflict: ...).
-- PostgreSQL UNIQUE indexes allow multiple NULL values, so movie and series
-- rows do not conflict with each other.
create unique index if not exists watchlist_user_movie_uidx
on public.watchlist(user_id, movie_id);

create unique index if not exists watchlist_user_series_uidx
on public.watchlist(user_id, series_id);

create unique index if not exists watch_history_user_movie_uidx
on public.watch_history(user_id, movie_id);

-- Automatically create a profile when a new Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Useful indexes for the public catalog.
create index if not exists movies_published_year_idx
on public.movies(is_published, release_year desc);

create index if not exists series_published_year_idx
on public.series(is_published, release_year desc);
