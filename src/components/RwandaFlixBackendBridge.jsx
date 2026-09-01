import { useEffect } from 'react'
import {
  addToWatchlist,
  removeFromWatchlist,
  upsertWatchProgress,
  signInWithPassword,
  signUpWithPassword,
  signOut,
} from '../lib/platform'
import { useRwandaFlix } from '../lib/useRwandaFlix'

/**
 * Keeps the restored UI independent while exposing a small, real backend
 * contract that UI components can consume incrementally.
 *
 * The bridge deliberately does not replace App.jsx or its layout. It publishes
 * current Supabase-backed state and actions on window.rwandaFlix and emits a
 * browser event whenever that state changes.
 */
export default function RwandaFlixBackendBridge() {
  const { user, catalog, watchlist, history, loading, error, refreshAccount } = useRwandaFlix()

  useEffect(() => {
    const api = {
      user,
      catalog,
      watchlist,
      history,
      loading,
      error,
      refreshAccount,
      auth: {
        signIn: signInWithPassword,
        signUp: signUpWithPassword,
        signOut,
      },
      watchlistActions: {
        add: async (movieId) => {
          if (!user) throw new Error('Please sign in before adding titles to My List.')
          const result = await addToWatchlist(user.id, movieId)
          await refreshAccount()
          return result
        },
        remove: async (movieId) => {
          if (!user) throw new Error('Please sign in before editing My List.')
          await removeFromWatchlist(user.id, movieId)
          await refreshAccount()
        },
      },
      playback: {
        saveProgress: async (movieId, seconds, completed = false) => {
          if (!user) return null
          return upsertWatchProgress(user.id, movieId, seconds, completed)
        },
      },
    }

    window.rwandaFlix = api
    window.dispatchEvent(new CustomEvent('rwandaflix:state', { detail: api }))

    return () => {
      if (window.rwandaFlix === api) delete window.rwandaFlix
    }
  }, [user, catalog, watchlist, history, loading, error, refreshAccount])

  return null
}
