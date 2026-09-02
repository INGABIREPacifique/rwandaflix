// Supabase Edge Function: stripe-webhook
//
// Receives real Stripe webhook events and keeps public.subscriptions in
// sync with what actually happened in Stripe (this is the piece that makes
// billing real rather than a UI that just says "subscribed"). Requires:
//   - STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET set as function secrets
//   - SUPABASE_SERVICE_ROLE_KEY set as a function secret (needed to write
//     to subscriptions bypassing RLS, since Stripe calls this with no user
//     session)
//
// Deploy with:
//   supabase functions deploy stripe-webhook --no-verify-jwt
//   supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_...
//
// Then in the Stripe dashboard: Developers -> Webhooks -> Add endpoint,
// pointing at https://<project-ref>.supabase.co/functions/v1/stripe-webhook
// and select at least: checkout.session.completed, customer.subscription.updated,
// customer.subscription.deleted.

import Stripe from 'https://esm.sh/stripe@17?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature ?? '', webhookSecret)
  } catch (error) {
    return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.user_id
        const planId = session.metadata?.plan_id
        if (userId && planId && session.subscription) {
          await supabaseAdmin.from('subscriptions').upsert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            current_period_start: new Date().toISOString(),
          }, { onConflict: 'stripe_subscription_id' })
        }
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object
        await supabaseAdmin.from('subscriptions')
          .update({
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await supabaseAdmin.from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id)
        break
      }
      default:
        // Unhandled event types are ignored on purpose — Stripe sends many
        // event types we don't need to act on for a simple subscription flow.
        break
    }
    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
