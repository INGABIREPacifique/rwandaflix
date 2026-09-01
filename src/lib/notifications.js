import { supabase } from './supabase'

export async function getNotifications(limit = 20) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, type, is_read, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function markNotificationRead(id) {
  if (!supabase || !id) return null
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markAllNotificationsRead() {
  if (!supabase) return
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('You must be signed in.')
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userData.user.id)
    .eq('is_read', false)
  if (error) throw error
}
