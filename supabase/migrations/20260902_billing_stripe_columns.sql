-- Additive migration for real Stripe billing (Phase 7).
-- Adds columns only; does not modify or drop anything existing.

alter table public.subscription_plans add column if not exists stripe_price_id text;
alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;

create unique index if not exists subscriptions_stripe_subscription_uidx
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- After running this migration, you must:
--   1. Create a Product + Price in your Stripe dashboard (test mode first)
--      for each row in subscription_plans, then run an UPDATE to set
--      stripe_price_id to the real Stripe price id (e.g. price_123...).
--   2. Deploy the two edge functions in supabase/functions/ (see their
--      README for the exact CLI commands) and set STRIPE_SECRET_KEY and
--      STRIPE_WEBHOOK_SECRET as Supabase Edge Function secrets — never
--      paste these into chat or commit them to the repo.
