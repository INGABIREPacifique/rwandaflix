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

export async function signInWithPassword(email, password) {
  const client = requireClient()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpWithPassword(email, password, fullName) {
  const client = requireClient()
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCatalog() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('movies')
    .select('id,catalog_key,title,description,poster_url,backdrop_url,trailer_url,video_url,release_year,duration_minutes,genre,language,is_featured,is_original,is_published')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('release_year', { ascending: false })
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
  const client = requireClient()
  const { data, error } = await client
    .from('watchlist')
    .select('id,movie_id,series_id,created_at,movies(id,catalog_key)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function replaceMovieWatchlist(userId, movieDbIds) {
  const client = requireClient()
  const { error: deleteError } = await client
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .not('movie_id', 'is', null)
  if (deleteError) throw deleteError
  if (!movieDbIds.length) return
  const { error } = await client.from('watchlist').insert(
    movieDbIds.map(movieId => ({ user_id: userId, movie_id: movieId })),
  )
  if (error) throw error
}

export async function getNotifications(userId) {
  const client = requireClient()
  const { data, error } = await client
    .from('notifications')
    .select('id,title,message,type,is_read,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data ?? []
}

export async function markNotificationRead(userId, notificationId) {
  const client = requireClient()
  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function getPlans() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('id,name,price_monthly,max_profiles,max_devices,video_quality,ads_supported')
    .eq('is_active', true)
    .order('price_monthly')
  if (error) throw error
  return data ?? []
}

export async function getMySubscription(userId) {
  const client = requireClient()
  const { data, error } = await client
    .from('subscriptions')
    .select('id,status,started_at,current_period_start,current_period_end,subscription_plans(id,name,price_monthly,video_quality,max_profiles,max_devices,ads_supported)')
    .eq('user_id', userId)
    .in('status', ['trialing', 'active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getCreatorProfile(userId) {
  const client = requireClient()
  const { data, error } = await client.from('creator_profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function getCreatorSubmissions(creatorId) {
  const client = requireClient()
  const { data, error } = await client
    .from('film_submissions')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
