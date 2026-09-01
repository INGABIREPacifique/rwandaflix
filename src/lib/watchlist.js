import { supabase } from './supabase'

export async function getWatchlist(userId) {
  if (!supabase || !userId) return []

  const { data, error } = await supabase
    .from('watchlist')
    .select('id, movie_id, series_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function addMovieToWatchlist(userId, movieId) {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (!userId || !movieId) throw new Error('A user and movie are required.')

  const { error } = await supabase
    .from('watchlist')
    .upsert(
      { user_id: userId, movie_id: movieId },
      { onConflict: 'user_id,movie_id', ignoreDuplicates: true },
    )

  if (error) throw error
}

export async function removeMovieFromWatchlist(userId, movieId) {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (!userId || !movieId) throw new Error('A user and movie are required.')

  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('movie_id', movieId)

  if (error) throw error
}

export async function saveWatchProgress(userId, movieId, progressSeconds, completed = false) {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (!userId || !movieId) throw new Error('A user and movie are required.')

  const { error } = await supabase
    .from('watch_history')
    .upsert(
      {
        user_id: userId,
        movie_id: movieId,
        progress_seconds: Math.max(0, Math.floor(progressSeconds)),
        completed: Boolean(completed),
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,movie_id' },
    )

  if (error) throw error
}

export async function getWatchHistory(userId) {
  if (!supabase || !userId) return []

  const { data, error } = await supabase
    .from('watch_history')
    .select('id, movie_id, episode_id, progress_seconds, completed, last_watched_at')
    .eq('user_id', userId)
    .order('last_watched_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
