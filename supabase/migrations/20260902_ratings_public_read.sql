-- The original ratings policy only let a signed-in user see their OWN rating row,
-- which makes it impossible to compute or display a public average rating for a movie.
-- This migration adds a public read policy for ratings (needed for aggregate display)
-- without touching the existing insert/update/delete policies, which correctly stay
-- restricted to the row's owner.

drop policy if exists "Anyone can view ratings for averages" on public.ratings;

create policy "Anyone can view ratings for averages"
on public.ratings for select to anon, authenticated
using (true);

-- Note: the older "Users can view their ratings" policy (authenticated-only, own-row-only)
-- can stay in place alongside this one; Postgres RLS policies are additive (OR'd together),
-- so this migration only widens access, it does not remove the narrower policy.
