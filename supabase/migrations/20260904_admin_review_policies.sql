-- Admin review workflow for creator film submissions.
-- profiles.role already existed in the schema (default 'viewer', with
-- 'creator' and 'admin' as valid values per schema.sql's check constraint)
-- but nothing in the app ever read or granted admin access until now.

-- To make yourself an admin for testing, run:
--   update public.profiles set role = 'admin' where id = 'YOUR-USER-UUID';
-- (find your user id in Authentication -> Users in the Supabase dashboard)

drop policy if exists "Admins can view all submissions" on public.film_submissions;
create policy "Admins can view all submissions"
on public.film_submissions for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins can update any submission" on public.film_submissions;
create policy "Admins can update any submission"
on public.film_submissions for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins can publish movies" on public.movies;
create policy "Admins can publish movies"
on public.movies for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins can view all creator profiles" on public.creator_profiles;
create policy "Admins can view all creator profiles"
on public.creator_profiles for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
