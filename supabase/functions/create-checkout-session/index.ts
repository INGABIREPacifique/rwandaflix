// Supabase Edge Function: create-checkout-session
//
// Creates a real Stripe Checkout Session for a subscription plan and
// returns its URL for the client to redirect to. Requires:
//   - STRIPE_SECRET_KEY set as a function secret (test key while developing)
//   - subscription_plans.stripe_price_id populated for the chosen plan
//
// Deploy with:
//   supabase functions deploy create-checkout-session
//   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
//
// Call from the client via supabase.functions.invoke('create-checkout-session', { body: { planId } })

import Stripe from 'https://esm.sh/stripe@17?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Not authenticated')

    const { planId } = await req.json()
    if (!planId) throw new Error('planId is required')

    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, name, stripe_price_id')
      .eq('id', planId)
      .single()
    if (planError || !plan) throw new Error('Plan not found')
    if (!plan.stripe_price_id) throw new Error(`Plan "${plan.name}" has no Stripe price configured yet`)

    const origin = req.headers.get('origin') ?? Deno.env.get('SITE_URL') ?? ''

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: { user_id: user.id, plan_id: plan.id },
      subscription_data: { metadata: { user_id: user.id, plan_id: plan.id } },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
