-- RwandaFlix creator + signup completion migration
-- Paste this entire file into Supabase SQL Editor and run it once.

create table if not exists public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  avatar_url text,
  website_url text,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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
  status text not null default 'pending' check (status in ('pending','approved','rejected','published')),
  reviewer_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.creator_profiles enable row level security;
alter table public.film_submissions enable row level security;

create policy "Creators can view their profile"
on public.creator_profiles for select to authenticated
using (auth.uid() = user_id);

create policy "Creators can create their profile"
on public.creator_profiles for insert to authenticated
with check (auth.uid() = user_id);

create policy "Creators can update their profile"
on public.creator_profiles for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Creators can view their submissions"
on public.film_submissions for select to authenticated
using (exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid()));

create policy "Creators can submit films"
on public.film_submissions for insert to authenticated
with check (exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid()));

create policy "Creators can update pending submissions"
on public.film_submissions for update to authenticated
using (exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid()) and status = 'pending')
with check (exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid()));

create index if not exists creator_profiles_user_idx on public.creator_profiles(user_id);
create index if not exists film_submissions_creator_idx on public.film_submissions(creator_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do update set full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
