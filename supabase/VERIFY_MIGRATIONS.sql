-- RwandaFlix migration verification.
-- Paste this whole thing into Supabase SQL Editor and run it.
-- Read the "status" column in each result — "OK" or "MISSING".

-- 1. Core tables from schema_reconciliation
select table_name,
       case when table_name is not null then 'OK' else 'MISSING' end as status
from information_schema.tables
where table_schema = 'public'
  and table_name = any(array[
    'movies','genres','ratings','series','episodes','profiles',
    'watchlist','watch_history','notifications','subscription_plans',
    'subscriptions','creator_profiles','film_submissions'
  ])
order by table_name;

-- 2. Episode support on watch_history (schema_reconciliation)
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'watch_history' and column_name = 'episode_id';
-- expect 1 row. No row = schema_reconciliation.sql was NOT run.

-- 3. Ratings public-read policy (20260902_ratings_public_read.sql)
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'ratings';
-- expect to see "Anyone can view ratings for averages" with cmd = SELECT.
-- If you only see an older own-row-only policy, that migration was NOT run.

-- 4. Stripe billing columns (20260902_billing_stripe_columns.sql)
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'subscription_plans' and column_name = 'stripe_price_id') or
    (table_name = 'subscriptions' and column_name in ('stripe_customer_id','stripe_subscription_id'))
  );
-- expect 3 rows. Fewer = that migration was NOT run.

-- 5. Actual content — this is likely WHY playback looks broken
select 'movies' as table_name, count(*) as row_count, count(video_url) as rows_with_video_url from public.movies
union all
select 'series', count(*), null from public.series
union all
select 'episodes', count(*), count(video_url) from public.episodes;
-- If rows_with_video_url is 0 or low, that's exactly why Play buttons show
-- the demo screen instead of a real video — there's nothing to play yet,
-- independent of any app code.
