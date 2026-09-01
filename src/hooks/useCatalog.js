import { useEffect, useState } from 'react'
import { getMovies, getSeries } from '../lib/catalog'
import { movies as demoMovies } from '../data/movies'

function normalize(item, index) {
  return {
    id: item.id ?? index + 1,
    title: item.title ?? 'Untitled',
    year: item.release_year ?? new Date().getFullYear(),
    genre: item.genre ?? 'Drama',
    duration: item.duration ?? (item.duration_minutes ? `${item.duration_minutes}m` : '—'),
    description: item.description ?? '',
    image: item.poster_url ?? item.backdrop_url ?? '',
    ...item,
  }
}

export function useCatalog() {
  const [catalog, setCatalog] = useState(demoMovies)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [movieRows, seriesRows] = await Promise.all([
          getMovies(),
          getSeries(),
        ])
        if (!active) return
        const remote = [...movieRows, ...seriesRows].map(normalize)
        setCatalog(remote.length ? remote : demoMovies)
        setError(null)
      } catch (err) {
        if (!active) return
        setCatalog(demoMovies)
        setError(err)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  return { catalog, loading, error }
}
