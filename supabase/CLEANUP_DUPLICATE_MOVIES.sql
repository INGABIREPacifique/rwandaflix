-- RwandaFlix: clean up duplicate movie rows.
-- Root cause: not an app bug. Repeated inserts (most likely from
-- re-running an early version of the seed SQL before it had its
-- "where not exists" idempotency guard) created many rows sharing
-- the same title. Since different parts of the UI can end up
-- referencing different specific duplicate rows, playback looked
-- inconsistent per-title even though nothing in the app code was
-- actually broken.

-- STEP 1 — Preview only. Run this first, look at the results,
-- don't run STEP 2 until you're comfortable with what it'll remove.
select title, count(*) as copies, count(video_url) as copies_with_video_url
from public.movies
group by title
having count(*) > 1
order by copies desc;

-- STEP 2 — Actually delete duplicates. For each title, keeps exactly
-- one row: prefers a row that already has video_url set (so you
-- don't lose the one you were testing with), otherwise keeps the
-- oldest row. Deletes the rest.
--
-- WARNING: this is destructive. Any watchlist/watch_history/ratings
-- rows pointing at a deleted duplicate's id will be removed too
-- (the schema uses "on delete cascade" for those foreign keys).
-- That's very unlikely to matter for accidental duplicate seed rows,
-- but don't run this on a table with real user data you haven't
-- backed up.
delete from public.movies m
using (
  select id, title,
         row_number() over (
           partition by title
           order by (video_url is not null) desc, created_at asc
         ) as keep_rank
  from public.movies
) ranked
where m.id = ranked.id
  and ranked.keep_rank > 1;

-- STEP 3 — Verify: should now show 0 rows.
select title, count(*) as copies
from public.movies
group by title
having count(*) > 1;
