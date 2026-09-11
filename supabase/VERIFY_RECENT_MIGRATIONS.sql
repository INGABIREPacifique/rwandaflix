-- Checks every migration added since the last full verification pass.
-- Paste into Supabase SQL Editor and run. Read each result carefully.

-- 1. Storage buckets (creator-submissions, avatars)
select id, public from storage.buckets where id in ('creator-submissions', 'avatars');
-- Expect 2 rows: creator-submissions (public=false), avatars (public=true).

-- 2. Creator analytics table + movies.creator_id column
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'movies' and column_name = 'creator_id';
-- Expect 1 row. No row = 20260904_creator_analytics.sql was NOT run.

select table_name from information_schema.tables
where table_schema = 'public' and table_name = 'playback_events';
-- Expect 1 row.

-- 3. Viewing profiles table
select table_name from information_schema.tables
where table_schema = 'public' and table_name = 'viewing_profiles';
-- Expect 1 row.

-- 4. Admin policies on movies (update/delete) and profiles (view-all/update-any)
select tablename, policyname, cmd from pg_policies
where schemaname = 'public'
  and (
    (tablename = 'movies' and policyname in ('Admins can update movies', 'Admins can publish movies', 'Admins can delete movies'))
    or (tablename = 'profiles' and policyname in ('Admins can view all profiles', 'Admins can update any profile'))
  )
order by tablename, policyname;
-- Expect 5 rows total. Fewer = admin management policies are incomplete.

-- 5. Notifications/subscriptions insert policies (from the security audit)
select tablename, policyname, cmd from pg_policies
where schemaname = 'public'
  and tablename in ('notifications', 'subscriptions')
  and cmd = 'INSERT';
-- Expect at least 3 rows (2 for notifications, 1 for subscriptions).
-- If missing, notifications/free-plan-subscribe are silently broken again.
