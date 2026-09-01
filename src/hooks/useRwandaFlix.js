import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getMovies, getSeries, getGenres } from '../lib/catalog'
import { getWatchlist, addMovieToWatchlist, removeMovieFromWatchlist, getWatchHistory } from '../lib/watchlist'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/notifications'
import { getMySubscription } from '../lib/subscriptions'

export function useRwandaFlixData() {
  const [user, setUser] = useState(null)
  const [movies, setMovies] = useState([])
  const [series, setSeries] = useState([])
  const [genres, setGenres] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [history, setHistory] = useState([])
  const [notifications, setNotifications] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async (currentUser = user) => {
    setLoading(true)
    setError('')
    try {
      const [movieData, seriesData, genreData] = await Promise.all([getMovies(), getSeries(), getGenres()])
      setMovies(movieData)
      setSeries(seriesData)
      setGenres(genreData)
      if (currentUser) {
        const [list, historyData, notificationData, subscriptionData] = await Promise.all([
          getWatchlist(currentUser.id), getWatchHistory(currentUser.id), getNotifications(), getMySubscription(),
        ])
        setWatchlist(list)
        setHistory(historyData)
        setNotifications(notificationData)
        setSubscription(subscriptionData)
      } else {
        setWatchlist([])
        setHistory([])
        setNotifications([])
        setSubscription(null)
      }
    } catch (err) {
      setError(err?.message || 'Unable to load RwandaFlix data.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!supabase) return undefined
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ?? null)
    }).catch(err => {
      if (mounted) setError(err?.message || 'Unable to read the current session.')
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null)
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let mounted = true
    refresh(user).catch(err => mounted && setError(err?.message || 'Unable to refresh RwandaFlix data.'))
    return () => { mounted = false }
  }, [refresh, user])

  const toggleMovie = useCallback(async (movieId) => {
    if (!user) throw new Error('Please sign in to use My List.')
    const exists = watchlist.some(item => item.movie_id === movieId)
    if (exists) await removeMovieFromWatchlist(user.id, movieId)
    else await addMovieToWatchlist(user.id, movieId)
    setWatchlist(await getWatchlist(user.id))
  }, [user, watchlist])

  const readNotification = useCallback(async (id) => {
    await markNotificationRead(id)
    setNotifications(current => current.map(item => item.id === id ? { ...item, is_read: true } : item))
  }, [])

  const readAllNotifications = useCallback(async () => {
    await markAllNotificationsRead()
    setNotifications(current => current.map(item => ({ ...item, is_read: true })))
  }, [])

  return { user, movies, series, genres, watchlist, history, notifications, subscription, loading, error, refresh, toggleMovie, readNotification, readAllNotifications }
}
