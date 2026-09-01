import { useEffect, useState } from 'react'
import { fetchMovies, fetchSeries } from '../lib/catalog'
import { movies as demoMovies } from '../data/movies'

function normalizeMovie(item, index) {
  return {
    id: item.id ?? item.slug ?? index + 1,
    title: item.title ?? item.name ?? 'Untitled',
    year: item.release_year ?? item.year ?? new Date().getFullYear(),
    genre: item.genre ?? item.category ?? 'Drama',
    duration: item.duration ?? item.runtime ?? '—',
    description: item.description ?? '',
    image: item.poster_url ?? item.poster ?? item.thumbnail_url ?? item.image ?? '',
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
          fetchMovies(),
          fetchSeries(),
        ])

        if (!active) return

        const remote = [...movieRows, ...seriesRows].map(normalizeMovie)
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
