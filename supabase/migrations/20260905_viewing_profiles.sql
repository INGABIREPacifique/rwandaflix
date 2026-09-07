-- Viewing profiles ("Who's watching?" style switcher).
--
-- IMPORTANT SCOPE LIMITATION, stated plainly: these profiles are for
-- personalization only (name + avatar + a kids flag). They do NOT
-- separate watchlist/watch_history/ratings data — everything remains
-- scoped to the account (auth.uid()) exactly as before. Building true
-- per-profile data isolation would require adding a profile_id column
-- to watchlist, watch_history, and ratings, updating every RLS policy
-- and every query in platform.js, and is a much larger, riskier change
-- than fits safely in this pass. This migration only adds the ability
-- to have named/avatared profiles under one account.

create table if not exists public.viewing_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  is_kids boolean default false,
  created_at timestamptz default now()
);

create index if not exists viewing_profiles_user_idx on public.viewing_profiles(user_id);

alter table public.viewing_profiles enable row level security;

drop policy if exists "Users can view their own viewing profiles" on public.viewing_profiles;
create policy "Users can view their own viewing profiles"
on public.viewing_profiles for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own viewing profiles" on public.viewing_profiles;
create policy "Users can create their own viewing profiles"
on public.viewing_profiles for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own viewing profiles" on public.viewing_profiles;
create policy "Users can update their own viewing profiles"
on public.viewing_profiles for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own viewing profiles" on public.viewing_profiles;
create policy "Users can delete their own viewing profiles"
on public.viewing_profiles for delete to authenticated
using (auth.uid() = user_id);
