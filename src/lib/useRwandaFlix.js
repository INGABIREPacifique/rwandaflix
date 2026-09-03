import { useCallback, useEffect, useState } from 'react'
import {
  getSession,
  onAuthStateChange,
  getCatalog,
  catalogToUiMovies,
  getRemoteWatchlist,
  getWatchHistory,
  getSeriesCatalog,
} from './platform'
import { movies as fallbackMovies } from '../data/movies'

export function useRwandaFlix() {
  const [user, setUser] = useState(null)
  const [catalog, setCatalog] = useState(fallbackMovies)
  const [series, setSeries] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshAccount = useCallback(async () => {
    if (!user) {
      setWatchlist([])
      setHistory([])
      return { watchlist: [], history: [] }
    }

    const [list, historyRows] = await Promise.all([
      getRemoteWatchlist(user.id),
      getWatchHistory(user.id),
    ])
    setWatchlist(list)
    setHistory(historyRows)
    return { watchlist: list, history: historyRows }
  }, [user])

  const refreshHistory = useCallback(async () => {
    if (!user) {
      setHistory([])
      return []
    }
    const historyRows = await getWatchHistory(user.id)
    setHistory(historyRows)
    return historyRows
  }, [user])

  useEffect(() => {
    let mounted = true
    setError('')

    getSession()
      .then(session => mounted && setUser(session?.user || null))
      .catch(err => mounted && setError(err.message || 'Unable to restore your session.'))

    const auth = onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user || null)
    })

    return () => {
      mounted = false
      auth?.data?.subscription?.unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    let mounted = true
    setLoading(true)

    getCatalog()
      .then(rows => {
        if (mounted && rows.length) setCatalog(catalogToUiMovies(rows))
      })
      .catch(err => {
        if (mounted) setError(err.message || 'Unable to load the online catalog. Showing the local catalog.')
      })
      .finally(() => mounted && setLoading(false))

    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    getSeriesCatalog()
      .then(rows => { if (mounted) setSeries(rows) })
      .catch(() => { /* non-fatal: series section just stays empty */ })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!user) {
      setWatchlist([])
      setHistory([])
      return undefined
    }

    let mounted = true
    refreshAccount()
      .catch(err => mounted && setError(err.message || 'Unable to load your account data.'))

    return () => { mounted = false }
  }, [user, refreshAccount])

  return { user, catalog, series, watchlist, history, loading, error, refreshAccount, refreshHistory }
}
