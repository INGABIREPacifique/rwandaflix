# RwandaFlix Billing — Deployment Guide (Phase 7)

This is real, working Stripe integration code. It has **not been deployed or
tested against live Stripe/Supabase**, because doing so requires credentials
(Stripe secret keys, Supabase service role key) that should never be pasted
into a chat or committed to this repo. You'll need to run these steps
yourself, from your own machine.

## 1. Run the schema migration

In the Supabase SQL Editor, run:

```
supabase/migrations/20260902_billing_stripe_columns.sql
```

## 2. Create Stripe Products & Prices

In your [Stripe Dashboard](https://dashboard.stripe.com) (start in **test mode**):

1. Create a Product for each plan you have in `subscription_plans` (Free/Premium/Family).
2. Create a recurring monthly Price for each paid product.
3. Copy each Price ID (looks like `price_1AbCdEfGhIjKlM`).
4. In the Supabase SQL editor, update your plans:

```sql
update public.subscription_plans set stripe_price_id = 'price_...' where name = 'Premium';
update public.subscription_plans set stripe_price_id = 'price_...' where name = 'Family';
```

(Leave the Free plan's `stripe_price_id` null — it doesn't need Stripe.)

## 3. Install the Supabase CLI locally (not possible from this sandbox)

```bash
npm install -g supabase
supabase login
supabase link --project-ref cseqmqpkmttqfcprieph
```

## 4. Set secrets (never share these in chat)

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
already available to edge functions automatically — you don't need to set
those yourself.

## 5. Deploy both functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
```

## 6. Register the webhook in Stripe

Stripe Dashboard → Developers → Webhooks → Add endpoint:

```
https://cseqmqpkmttqfcprieph.supabase.co/functions/v1/stripe-webhook
```

Select at least these events: `checkout.session.completed`,
`customer.subscription.updated`, `customer.subscription.deleted`.
Copy the generated signing secret into `STRIPE_WEBHOOK_SECRET` (step 4).

## 7. Test end-to-end

Use a [Stripe test card](https://docs.stripe.com/testing) (`4242 4242 4242 4242`,
any future expiry, any CVC) to run a real checkout in test mode, and confirm
a row appears in `public.subscriptions` with `status = 'active'`.

## What the client already does

`src/lib/platform.js` has `createCheckoutSession(planId)`, which calls the
`create-checkout-session` function and redirects the browser to the
returned Stripe Checkout URL. The pricing section and AccountCenter's
subscription tab call this — but until you complete steps 1–7 above, it
will fail with a clear error message (e.g. "Plan has no Stripe price
configured yet") rather than silently pretending to work.

## Going live

Repeat steps 2–6 with your Stripe **live** keys and a live webhook endpoint
once you're ready to accept real payments, and switch `STRIPE_SECRET_KEY`
to the live secret key.
