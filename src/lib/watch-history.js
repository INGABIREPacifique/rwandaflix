import { supabase } from './supabase'

export async function getWatchHistory(limit = 20) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('watch_history')
    .select('id, movie_id, episode_id, progress_seconds, completed, last_watched_at')
    .order('last_watched_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function saveMovieProgress({ movieId, progressSeconds = 0, completed = false }) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('You must be signed in to save watch progress.')

  const { data, error } = await supabase
    .from('watch_history')
    .upsert(
      {
        user_id: userData.user.id,
        movie_id: movieId,
        progress_seconds: Math.max(0, Math.floor(progressSeconds)),
        completed,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,movie_id' },
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function saveEpisodeProgress({ episodeId, progressSeconds = 0, completed = false }) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('You must be signed in to save watch progress.')

  const { data, error } = await supabase
    .from('watch_history')
    .upsert(
      {
        user_id: userData.user.id,
        episode_id: episodeId,
        progress_seconds: Math.max(0, Math.floor(progressSeconds)),
        completed,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,episode_id' },
    )
    .select()
    .single()

  if (error) throw error
  return data
}
