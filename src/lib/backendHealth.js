import { supabase } from './supabase'

const requiredTables = ['movies', 'series', 'episodes', 'watchlist', 'watch_history', 'profiles', 'notifications', 'subscription_plans', 'subscriptions', 'creator_profiles', 'film_submissions']

export async function checkBackendHealth() {
  if (!supabase) return { configured: false, tables: {}, ok: false }

  const checks = await Promise.all(requiredTables.map(async (table) => {
    const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' }).limit(1)
    return [table, !error]
  }))

  const tables = Object.fromEntries(checks)
  return { configured: true, tables, ok: Object.values(tables).every(Boolean) }
}
