import { supabase } from './supabase'

export async function getWatchlist(userId) {
  if (!supabase || !userId) return []
  const { data, error } = await supabase
    .from('watchlist')
    .select('movie_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function addToWatchlist(userId, movieId) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase
    .from('watchlist')
    .upsert({ user_id: userId, movie_id: movieId })
  if (error) throw error
}

export async function removeFromWatchlist(userId, movieId) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('movie_id', movieId)
  if (error) throw error
}

export async function saveWatchProgress(userId, movieId, progressSeconds) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase
    .from('watch_progress')
    .upsert({
      user_id: userId,
      movie_id: movieId,
      progress_seconds: Math.max(0, Math.floor(progressSeconds)),
      updated_at: new Date().toISOString(),
    })
  if (error) throw error
}
