import { useEffect } from 'react'
import { useRwandaFlix } from '../lib/useRwandaFlix'

export default function RwandaFlixBackendBridge() {
  const { user, catalog, watchlist, history, loading, error } = useRwandaFlix()

  useEffect(() => {
    window.rwandaFlix = { user, catalog, watchlist, history, loading, error }
  }, [user, catalog, watchlist, history, loading, error])

  return null
}
