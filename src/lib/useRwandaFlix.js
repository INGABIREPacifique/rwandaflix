import { useEffect, useState } from 'react'
import { getSession, onAuthStateChange, getCatalog, catalogToUiMovies, getRemoteWatchlist, getWatchHistory } from './platform'
import { movies as fallbackMovies } from '../data/movies'

export function useRwandaFlix() {
  const [user, setUser] = useState(null)
  const [catalog, setCatalog] = useState(fallbackMovies)
  const [watchlist, setWatchlist] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    getSession().then(session => mounted && setUser(session?.user || null)).catch(() => {})
    const auth = onAuthStateChange((_event, session) => mounted && setUser(session?.user || null))
    return () => {
      mounted = false
      auth?.data?.subscription?.unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getCatalog().then(rows => {
      if (mounted && rows.length) setCatalog(catalogToUiMovies(rows))
    }).catch(err => mounted && setError(err.message || 'Unable to load the online catalog. Showing the local catalog.'))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!user) { setWatchlist([]); setHistory([]); return }
    let mounted = true
    Promise.all([getRemoteWatchlist(user.id), getWatchHistory(user.id)]).then(([list, historyRows]) => {
      if (!mounted) return
      setWatchlist(list)
      setHistory(historyRows)
    }).catch(err => mounted && setError(err.message || 'Unable to load your account data.'))
    return () => { mounted = false }
  }, [user])

  return { user, catalog, watchlist, history, loading, error }
}
