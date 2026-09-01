import { supabase } from './supabase'

const requireClient = () => {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.')
  return supabase
}

export async function getSession() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe() {} } } }
  return supabase.auth.onAuthStateChange(callback)
}

export async function signInWithPassword(email, password) {
  const { data, error } = await requireClient().auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpWithPassword(email, password, fullName) {
  const { data, error } = await requireClient().auth.signUp({ email, password, options: { data: { full_name: fullName } } })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCatalog({ search = '', genre = null } = {}) {
  if (!supabase) return []
  let query = supabase.from('movies').select('id,catalog_key,title,description,poster_url,backdrop_url,trailer_url,video_url,release_year,duration_minutes,genre,language,is_featured,is_original,is_published').eq('is_published', true).order('is_featured', { ascending: false }).order('release_year', { ascending: false })
  if (genre && genre !== 'All') query = query.eq('genre', genre)
  if (search.trim()) query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export function catalogToUiMovies(rows) {
  return rows.map((movie, index) => ({
    id: movie.catalog_key || index + 1,
    dbId: movie.id,
    title: movie.title,
    year: movie.release_year || new Date().getFullYear(),
    genre: movie.genre || 'Drama',
    duration: movie.duration_minutes ? `${Math.floor(movie.duration_minutes / 60)}h ${String(movie.duration_minutes % 60).padStart(2, '0')}m` : '—',
    image: movie.poster_url || movie.backdrop_url || '',
    description: movie.description || '',
    videoUrl: movie.video_url || '',
    trailerUrl: movie.trailer_url || '',
    isFeatured: Boolean(movie.is_featured),
    isOriginal: Boolean(movie.is_original),
  }))
}

export async function getRemoteWatchlist(userId) {
  const { data, error } = await requireClient().from('watchlist').select('id,movie_id,series_id,created_at,movies(id,catalog_key)').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addToWatchlist(userId, movieDbId) {
  const { data, error } = await requireClient().from('watchlist').insert({ user_id: userId, movie_id: movieDbId }).select('id,movie_id,series_id,created_at').single()
  if (error) throw error
  return data
}

export async function removeFromWatchlist(userId, movieDbId) {
  const { error } = await requireClient().from('watchlist').delete().eq('user_id', userId).eq('movie_id', movieDbId)
  if (error) throw error
}

export async function getWatchHistory(userId) {
  const { data, error } = await requireClient().from('watch_history').select('id,movie_id,series_id,progress_seconds,duration_seconds,last_watched_at,movies(id,catalog_key,title,poster_url,backdrop_url,release_year,duration_minutes,genre,description,video_url)').eq('user_id', userId).order('last_watched_at', { ascending: false }).limit(20)
  if (error) throw error
  return data ?? []
}

export async function upsertWatchProgress(userId, movieDbId, progressSeconds, durationSeconds) {
  const { data, error } = await requireClient().from('watch_history').upsert({ user_id: userId, movie_id: movieDbId, progress_seconds: Math.max(0, Math.floor(progressSeconds)), duration_seconds: Math.max(0, Math.floor(durationSeconds)), last_watched_at: new Date().toISOString() }, { onConflict: 'user_id,movie_id' }).select().single()
  if (error) throw error
  return data
}

export async function getProfile(userId) {
  const { data, error } = await requireClient().from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await requireClient().from('profiles').update(updates).eq('id', userId).select().single()
  if (error) throw error
  return data
}

export async function getNotifications(userId) {
  const { data, error } = await requireClient().from('notifications').select('id,title,message,type,is_read,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
  if (error) throw error
  return data ?? []
}

export async function markNotificationRead(userId, notificationId) {
  const { error } = await requireClient().from('notifications').update({ is_read: true }).eq('id', notificationId).eq('user_id', userId)
  if (error) throw error
}

export async function getPlans() {
  if (!supabase) return []
  const { data, error } = await supabase.from('subscription_plans').select('id,name,price_monthly,max_profiles,max_devices,video_quality,ads_supported').eq('is_active', true).order('price_monthly')
  if (error) throw error
  return data ?? []
}

export async function getMySubscription(userId) {
  const { data, error } = await requireClient().from('subscriptions').select('id,status,started_at,current_period_start,current_period_end,subscription_plans(id,name,price_monthly,video_quality,max_profiles,max_devices,ads_supported)').eq('user_id', userId).in('status', ['trialing', 'active', 'past_due']).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function getCreatorProfile(userId) {
  const { data, error } = await requireClient().from('creator_profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function getCreatorSubmissions(creatorId) {
  const { data, error } = await requireClient().from('film_submissions').select('*').eq('creator_id', creatorId).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getSeriesCatalog() {
  if (!supabase) return []
  const { data, error } = await supabase.from('series').select('id,catalog_key,title,description,poster_url,backdrop_url,trailer_url,release_year,genre,language,is_featured,is_original,is_published').eq('is_published', true).order('is_featured', { ascending: false }).order('release_year', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getEpisodes(seriesId) {
  const { data, error } = await requireClient().from('episodes').select('id,series_id,title,description,episode_number,season_number,duration_minutes,video_url,thumbnail_url').eq('series_id', seriesId).order('season_number').order('episode_number')
  if (error) throw error
  return data ?? []
}
