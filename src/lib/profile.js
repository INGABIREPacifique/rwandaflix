import { supabase } from './supabase'

export async function getProfile(userId) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertProfile(profile) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single()

  if (error) throw error
  return data
}
