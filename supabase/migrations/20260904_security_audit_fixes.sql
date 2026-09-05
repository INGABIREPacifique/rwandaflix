-- Security audit fixes (found by systematically checking every existing
-- policy against what the app's code actually does, not just assuming
-- the original schema was complete).

-- GAP 1: subscriptions had NO insert policy at all. subscribeToFreePlan()
-- would be rejected by the database in any environment with RLS properly
-- enforced. Fix restricts self-service inserts to genuinely free plans
-- only — a user cannot grant themselves a paid plan this way. Paid plans
-- only ever become active via the stripe-webhook edge function, which
-- uses the service role key and bypasses RLS entirely, as intended.
drop policy if exists "Users can self-subscribe to free plans only" on public.subscriptions;
create policy "Users can self-subscribe to free plans only"
on public.subscriptions for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.subscription_plans sp
    where sp.id = plan_id and coalesce(sp.price_monthly, 0) = 0
  )
);

-- GAP 2: notifications had NO insert policy at all. Every
-- createNotification() call added in this session (submission
-- confirmations, approve/reject notices) has been silently failing,
-- caught by a .catch(() => {}) in the client code — the app was reading
-- and marking-read notifications that could never actually be created.
drop policy if exists "Users can create their own notifications" on public.notifications;
create policy "Users can create their own notifications"
on public.notifications for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Admins can create notifications for any user" on public.notifications;
create policy "Admins can create notifications for any user"
on public.notifications for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- GAP 3: the existing "Creators can update submissions" policy let a
-- creator change ANY column on their own submission, including status —
-- meaning nothing stopped someone from setting their own submission to
-- 'approved' directly via the client SDK, bypassing admin review. Fix
-- requires status to remain 'pending' both before AND after the update,
-- so creators can still edit their own pending submission's details, but
-- cannot change its review status, and lose edit access entirely once an
-- admin has actually reviewed it.
drop policy if exists "Creators can update submissions" on public.film_submissions;
create policy "Creators can update their own pending submissions"
on public.film_submissions for update to authenticated
using (
  exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid())
  and status = 'pending'
)
with check (
  exists (select 1 from public.creator_profiles cp where cp.id = creator_id and cp.user_id = auth.uid())
  and status = 'pending'
);

-- GAP 4 (lower severity, hardening): episodes were visible to anyone
-- regardless of whether their parent series was published, so an
-- unpublished/draft series' episode data could still be fetched directly
-- by anyone who knew or guessed its UUID. Episodes now inherit their
-- parent series' publish status.
drop policy if exists "Anyone can view episodes" on public.episodes;
create policy "Anyone can view episodes of published series"
on public.episodes for select to anon, authenticated
using (exists (select 1 from public.series s where s.id = series_id and s.is_published = true));
