import { supabase } from './supabase'

export async function getMovies({ featuredOnly = false, genre = null, search = '' } = {}) {
  if (!supabase) return []
  let query = supabase.from('movies').select('id,title,description,poster_url,backdrop_url,trailer_url,video_url,release_year,duration_minutes,genre,director,language,is_featured,is_original').eq('is_published', true).order('created_at', { ascending: false })
  if (featuredOnly) query = query.eq('is_featured', true)
  if (genre && genre !== 'All') query = query.eq('genre', genre)
  if (search.trim()) query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getSeries({ featuredOnly = false, genre = null, search = '' } = {}) {
  if (!supabase) return []
  let query = supabase.from('series').select('id,title,description,poster_url,backdrop_url,trailer_url,release_year,genre,language,is_featured,is_original').eq('is_published', true).order('created_at', { ascending: false })
  if (featuredOnly) query = query.eq('is_featured', true)
  if (genre && genre !== 'All') query = query.eq('genre', genre)
  if (search.trim()) query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getEpisodes(seriesId) {
  if (!supabase || !seriesId) return []
  const { data, error } = await supabase.from('episodes').select('id,series_id,title,description,episode_number,season_number,duration_minutes,video_url,thumbnail_url').eq('series_id', seriesId).order('season_number').order('episode_number')
  if (error) throw error
  return data ?? []
}
