import { supabase } from './supabase'

export async function getSubscriptionPlans() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('id, name, price_monthly, max_profiles, max_devices, video_quality, ads_supported')
    .eq('is_active', true)
    .order('price_monthly', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getMySubscription() {
  if (!supabase) return null
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, status, started_at, current_period_start, current_period_end, subscription_plans(id, name, price_monthly, max_profiles, max_devices, video_quality, ads_supported)')
    .eq('user_id', userData.user.id)
    .in('status', ['trialing', 'active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}
