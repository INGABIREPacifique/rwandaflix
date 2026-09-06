// Supabase Edge Function: delete-account
//
// Deletes the CALLING user's own account permanently. The client SDK
// cannot delete auth.users directly (requires the service role key),
// so this function does it server-side after verifying the request's
// JWT identifies a real, currently-authenticated user — and only ever
// deletes that same user, never an arbitrary id passed by the client.
//
// Deploy with:
//   npx supabase functions deploy delete-account
// (uses the same STRIPE_SECRET_KEY-style pattern: SUPABASE_URL,
// SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are already
// available to every edge function automatically — no extra secrets
// needed for this one.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

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

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Deleting the auth user cascades to profiles, watchlist,
    // watch_history, ratings, notifications, subscriptions,
    // creator_profiles, and film_submissions via their existing
    // "on delete cascade" foreign keys — no manual cleanup needed.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ deleted: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
