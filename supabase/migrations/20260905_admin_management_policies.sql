-- Admin movie management (edit/unpublish/delete existing catalog rows —
-- previously admins could only INSERT new movies via the review flow,
-- nothing let them touch existing ones).
drop policy if exists "Admins can update movies" on public.movies;
create policy "Admins can update movies"
on public.movies for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins can delete movies" on public.movies;
create policy "Admins can delete movies"
on public.movies for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Admin user management (view everyone, change any role). Kept as its
-- own separate policy rather than widening the existing self-update
-- policy, so a regular user still can only ever touch their own row.
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
on public.profiles for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
