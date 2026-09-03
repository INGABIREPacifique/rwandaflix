import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BarChart3, Bell, Check, ChevronRight, Clock3, Download,
  Film, Heart, Info, Menu, Play, Plus, Search, Settings, Star, Tv, User, X
} from 'lucide-react'
import { movies, categories } from './data/movies'
import { useRwandaFlix } from './lib/useRwandaFlix'
import AccountCenter from './components/AccountCenter.jsx'
import {
  isDownloadSupported,
  listDownloads,
  isDownloaded,
  deleteDownload,
  downloadForOffline,
  getOfflinePlaybackUrl,
} from './lib/downloads'
import {
  addToWatchlist,
  removeFromWatchlist,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  upsertWatchProgress,
  upsertEpisodeProgress,
  getEpisodes,
  getEpisodeProgressMap,
  getMovieRatings,
  upsertMovieRating,
  getRatingsSummary,
} from './lib/platform'
import './App.css'

const INFO_PAGES = {
  help: {
    title: 'Help Center',
    body: [
      'RwandaFlix is in active development. If something looks broken or a video won\u2019t play, it\u2019s most likely a title without a published video file yet, not an error on your end.',
      'Account issues: use the Sign In / Sign Up option in the top-right profile menu. If you\u2019ve forgotten your password, contact support below for now \u2014 self-serve password reset is on the roadmap.',
      'Playback issues: try refreshing the page. If a specific title never loads, it may not have a video URL published yet.',
      'For anything else, reach us through the Contact page.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    draft: true,
    body: [
      'This is a starter Terms of Service template for RwandaFlix while the product is in development. It is not a substitute for legal advice \u2014 have a qualified lawyer review and adapt it before RwandaFlix accepts real paying subscribers.',
      'By creating an account, you agree to use RwandaFlix for personal, non-commercial viewing only, and not to redistribute, download, or publicly broadcast any content without permission from the rights holder.',
      'RwandaFlix reserves the right to suspend accounts that violate these terms, abuse the platform, or attempt to circumvent access controls.',
      'Subscription plans, pricing, and billing terms will be finalized once real payment processing is enabled; no payment is currently collected through this app.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    draft: true,
    body: [
      'This is a starter Privacy Policy template for RwandaFlix while the product is in development. It is not a substitute for legal advice \u2014 have it reviewed before real user data is collected at scale.',
      'RwandaFlix stores your account email, watch history, watchlist, and ratings in order to provide the service. This data is protected by database-level access rules (Row Level Security) so that only you can read your own watch history, watchlist, notifications, and subscription details.',
      'We do not sell personal data to third parties. If analytics or advertising partners are added in the future, this policy will be updated first.',
      'You can request deletion of your account and associated data by contacting support.',
    ],
  },
  contact: {
    title: 'Contact Us',
    body: [
      'RwandaFlix is currently a project in active development.',
      'For support, partnership, or creator questions, please reach out via the email associated with this project. A dedicated in-app contact form is planned for a future release.',
    ],
  },
  partner: {
    title: 'Partner With Us',
    body: [
      'RwandaFlix is building a home for Rwandan cinema \u2014 filmmakers, studios, and distributors are welcome to reach out about getting content onto the platform.',
      'The Creator Studio (available from your account menu) is where verified creators will eventually manage submissions, track performance, and receive payouts once the creator platform and billing system are complete.',
    ],
  },
  guidelines: {
    title: 'Creator Guidelines',
    body: [
      'Content submitted to RwandaFlix should be content you own the rights to, or have explicit permission to distribute.',
      'Submissions go through a review process before publishing. Real upload and review workflows are still being built \u2014 for now, reach out via Contact to discuss getting a title onto the platform.',
      'RwandaFlix does not tolerate hateful, violent, or exploitative content, and reserves the right to reject or remove any submission.',
    ],
  },
}

function Button({ children, className = '', ...props }) {
  return <button className={`btn ${className}`} {...props}>{children}</button>
}

function MovieCard({ movie, onInfo, onPlay, onToggleList, inList }) {
  return (
    <article className="movie-card" onClick={() => onInfo(movie)}>
      <img src={movie.image} alt={movie.title} loading="lazy" />
      <div className="movie-overlay">
        <div className="rating"><Star size={12} fill="currentColor" /> {movie.ratingAverage ? movie.ratingAverage.toFixed(1) : 'New'}</div>
        <strong>{movie.title}</strong>
        <span>{movie.year} · {movie.genre} · {movie.duration}</span>
        <div className="card-actions">
          <button aria-label={`Play ${movie.title}`} onClick={(e) => { e.stopPropagation(); onPlay(movie) }}><Play size={15} fill="currentColor" /></button>
          <button aria-label={inList ? 'Remove from My List' : 'Add to My List'} className="dark-action" onClick={(e) => { e.stopPropagation(); onToggleList(movie) }}>
            {inList ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
    </article>
  )
}

function SeriesCard({ show, onClick }) {
  return (
    <article className="movie-card" onClick={() => onClick(show)}>
      <img src={show.poster_url || show.backdrop_url} alt={show.title} loading="lazy" />
      <div className="movie-overlay">
        <div className="rating"><Tv size={12} /> Series</div>
        <strong>{show.title}</strong>
        <span>{show.release_year || ''} · {show.genre || 'Drama'}</span>
      </div>
    </article>
  )
}

function EpisodeRow({ episode, series, progress, onPlay }) {
  const pct = episode.duration_minutes ? Math.min(100, Math.round(((progress?.progress || 0) / (episode.duration_minutes * 60)) * 100)) : 0
  return (
    <div className="wide-card" onClick={() => onPlay(episode, series)}>
      <img src={episode.thumbnail_url || series.poster_url} alt="" />
      <div className="watch-progress"><i style={{ width: `${pct}%` }} /></div>
      <div className="wide-content">
        <strong>S{episode.season_number ?? 1}E{episode.episode_number} · {episode.title}</strong>
        <span><Clock3 size={12}/> {episode.duration_minutes ? `${episode.duration_minutes}m` : ''} {progress?.completed ? '· Watched' : ''}</span>
      </div>
      <button className="mini-play" onClick={e => { e.stopPropagation(); onPlay(episode, series) }} aria-label={`Play ${episode.title}`}><Play size={14} fill="currentColor" /></button>
    </div>
  )
}

function Row({ title, items, onInfo, onPlay, onToggleList, list, onSeeAll }) {
  return (
    <section className="section">
      <div className="section-header">
        <h2>{title}</h2>
        {onSeeAll && <button className="see-all" onClick={onSeeAll}>See all <ChevronRight size={15} /></button>}
      </div>
      <div className="movie-row">
        {items.map(movie => <MovieCard key={movie.id} movie={movie} onInfo={onInfo} onPlay={onPlay} onToggleList={onToggleList} inList={list.has(movie.id)} />)}
      </div>
    </section>
  )
}

function App() {
  const { user, catalog, series, watchlist, history, loading: backendLoading, error: backendError, refreshAccount } = useRwandaFlix()
  const baseLibraryMovies = catalog.length ? catalog : movies

  const [selected, setSelected] = useState(null)
  const [player, setPlayer] = useState(null)
  const [login, setLogin] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('All')
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const pathToPage = { '/': 'home', '/browse': 'browse', '/my-list': 'my-list' }
  const seriesDetailMatch = location.pathname.match(/^\/series\/([^/]+)$/)
  const activeSeriesId = seriesDetailMatch ? decodeURIComponent(seriesDetailMatch[1]) : null
  const infoSlug = location.pathname.replace(/^\//, '')
  const activePage = pathToPage[location.pathname]
    || (location.pathname.startsWith('/series') ? 'series' : null)
    || (location.pathname === '/downloads' ? 'downloads' : null)
    || (INFO_PAGES[infoSlug] ? 'info' : null)
    || 'home'
  const [list, setList] = useState(new Set([4, 11]))
  const [notice, setNotice] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [authMode, setAuthMode] = useState('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [ratingsSummary, setRatingsSummary] = useState({})
  const [myRating, setMyRating] = useState(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [accountTab, setAccountTab] = useState('profile')
  const [seriesEpisodes, setSeriesEpisodes] = useState([])
  const [episodeProgress, setEpisodeProgress] = useState({})
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [episodesError, setEpisodesError] = useState('')
  const [downloads, setDownloads] = useState(() => (isDownloadSupported() ? listDownloads() : []))
  const [downloadProgress, setDownloadProgress] = useState({})

  useEffect(() => {
    let mounted = true
    getRatingsSummary()
      .then(summary => mounted && setRatingsSummary(summary))
      .catch(() => {})
    return () => { mounted = false }
  }, [player, selected])

  useEffect(() => {
    let mounted = true
    if (!selected?.dbId || !user) {
      setMyRating(null)
      return undefined
    }
    getMovieRatings(selected.dbId, user.id)
      .then(result => mounted && setMyRating(result.mine))
      .catch(() => mounted && setMyRating(null))
    return () => { mounted = false }
  }, [selected, user])

  const toastTimerRef = useRef(null)
  const toast = (message) => {
    setNotice(message)
    window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setNotice(''), 2600)
  }

  const submitRating = async (rating) => {
    if (!user) {
      toast('Sign in to rate this title')
      return
    }
    if (!selected?.dbId) return
    try {
      await upsertMovieRating(user.id, selected.dbId, rating)
      setMyRating(rating)
      const summary = await getRatingsSummary()
      setRatingsSummary(summary)
      toast('Thanks for rating!')
    } catch (error) {
      toast(error.message || 'Unable to save your rating')
    }
  }

  const libraryMovies = useMemo(() => baseLibraryMovies.map(movie => {
    const summary = movie.dbId ? ratingsSummary[movie.dbId] : null
    return summary ? { ...movie, ratingAverage: summary.average, ratingCount: summary.count } : movie
  }), [baseLibraryMovies, ratingsSummary])

  const featured = libraryMovies[0] || movies[0]

  useEffect(() => {
    if (backendError) toast(backendError)
  }, [backendError])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const movieId = searchParams.get('movie')
    if (!movieId || !libraryMovies.length || player) return
    const match = libraryMovies.find(m => String(m.id) === movieId)
    if (match && selected?.id !== match.id) setSelected(match)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, libraryMovies, player])

  useEffect(() => {
    document.body.classList.toggle('modal-open', Boolean(selected || player || login || accountOpen))
    return () => document.body.classList.remove('modal-open')
  }, [selected, player, login, accountOpen])

  useEffect(() => {
    let mounted = true
    if (!activeSeriesId) {
      setSeriesEpisodes([])
      setEpisodeProgress({})
      setEpisodesError('')
      return undefined
    }
    setEpisodesLoading(true)
    setEpisodesError('')
    getEpisodes(activeSeriesId)
      .then(rows => { if (mounted) setSeriesEpisodes(rows) })
      .catch(err => { if (mounted) setEpisodesError(err.message || 'Unable to load episodes') })
      .finally(() => mounted && setEpisodesLoading(false))
    if (user) {
      getEpisodeProgressMap(user.id, activeSeriesId)
        .then(map => { if (mounted) setEpisodeProgress(map) })
        .catch(() => {})
    } else {
      setEpisodeProgress({})
    }
    return () => { mounted = false }
  }, [activeSeriesId, user])

  const activeSeries = useMemo(() => series.find(s => String(s.id) === activeSeriesId) || null, [series, activeSeriesId])

  const openEpisodePlayer = (episode, show) => {
    setSelected(null)
    setPlayer({
      id: `episode-${episode.id}`,
      dbId: episode.id,
      kind: 'episode',
      title: `${show.title} · S${episode.season_number ?? 1}E${episode.episode_number} — ${episode.title}`,
      image: episode.thumbnail_url || show.poster_url,
      videoUrl: episode.video_url,
      duration: episode.duration_minutes ? `${episode.duration_minutes}m` : '',
    })
  }

  useEffect(() => {
    if (!user) {
      setList(new Set([4, 11]))
      return
    }
    setList(new Set(watchlist.map(item => item.movie_id).filter(Boolean)))
  }, [user, watchlist])

  const openPlayer = async (movie = featured) => {
    setSelected(null)
    setSearchParams(params => { params.delete('movie'); return params }, { replace: true })
    if (isDownloaded(movie.id)) {
      const offlineUrl = await getOfflinePlaybackUrl(movie.id)
      if (offlineUrl) {
        setPlayer({ ...movie, videoUrl: offlineUrl, isOffline: true })
        return
      }
    }
    setPlayer(movie)
  }

  const handleDownload = async (item) => {
    if (!isDownloadSupported()) {
      toast('Offline downloads are not supported in this browser')
      return
    }
    if (!item.videoUrl) {
      toast('This title has no published video file yet — nothing to download')
      return
    }
    setDownloadProgress(prev => ({ ...prev, [item.id]: 0 }))
    try {
      await downloadForOffline(item, pct => {
        setDownloadProgress(prev => ({ ...prev, [item.id]: pct }))
      })
      setDownloads(listDownloads())
      toast(`${item.title} downloaded for offline viewing`)
    } catch (error) {
      toast(error.message || 'Download failed')
    } finally {
      setDownloadProgress(prev => { const next = { ...prev }; delete next[item.id]; return next })
    }
  }

  const handleRemoveDownload = async (id) => {
    await deleteDownload(id)
    setDownloads(listDownloads())
    toast('Removed from downloads')
  }

  const openDetail = (movie) => {
    setSelected(movie)
    setSearchParams(params => { params.set('movie', String(movie.id)); return params }, { replace: true })
  }

  const closeDetail = () => {
    setSelected(null)
    setSearchParams(params => { params.delete('movie'); return params }, { replace: true })
  }

  const toggleList = async (movie) => {
    const key = movie.id
    const wasSaved = list.has(key)
    const next = new Set(list)
    if (wasSaved) next.delete(key)
    else next.add(key)
    setList(next)

    if (user && movie.dbId) {
      try {
        if (wasSaved) {
          await removeFromWatchlist(user.id, movie.dbId)
          toast(`${movie.title} removed from My List`)
        } else {
          await addToWatchlist(user.id, movie.dbId)
          toast(`${movie.title} added to My List ❤️`)
        }
        await refreshAccount()
      } catch (error) {
        setList(list)
        toast(error.message || 'Unable to update My List')
      }
      return
    }

    toast(`${movie.title} ${wasSaved ? 'removed from' : 'added to'} My List${wasSaved ? '' : ' ❤️'}`)
  }

  const handleAuth = async (event) => {
    event.preventDefault()
    if (!authEmail.trim() || !authPassword) {
      toast('Enter your email and password to continue.')
      return
    }
    setAuthBusy(true)
    try {
      if (authMode === 'signin') {
        await signInWithPassword(authEmail.trim(), authPassword)
        toast('Welcome back to RwandaFlix 👋')
      } else {
        await signUpWithPassword(authEmail.trim(), authPassword, authEmail.trim().split('@')[0])
        toast('Account created. Check your email if confirmation is required.')
      }
      setLogin(false)
      setAuthEmail('')
      setAuthPassword('')
      await refreshAccount()
    } catch (error) {
      toast(error.message || 'Authentication failed')
    } finally {
      setAuthBusy(false)
    }
  }

  const openAccount = (tab = 'profile') => {
    setProfileOpen(false)
    if (!user) {
      setAuthMode('signin')
      setLogin(true)
      toast('Sign in to access your account')
      return
    }
    setAccountTab(tab)
    setAccountOpen(true)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setProfileOpen(false)
      toast('Signed out of RwandaFlix.')
    } catch (error) {
      toast(error.message || 'Unable to sign out')
    }
  }

  const filteredMovies = useMemo(() => {
    let result = libraryMovies
    if (activeGenre !== 'All') result = result.filter(movie => movie.genre === activeGenre)
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(movie => `${movie.title} ${movie.genre} ${movie.description}`.toLowerCase().includes(q))
    }
    return result
  }, [libraryMovies, query, activeGenre])

  const pageToPath = { home: '/', browse: '/browse', 'my-list': '/my-list' }
  const goTo = (page) => {
    navigate(pageToPath[page] || '/')
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const genres = ['All', ...categories.map(c => c.name)]
  const myListMovies = libraryMovies.filter(movie => list.has(movie.id))
  const historyItems = history
    .map(row => {
      const movie = libraryMovies.find(item => item.dbId === row.movie_id || item.id === row.movie_id)
      if (!movie) return null
      const durationSeconds = (row.movies?.duration_minutes || 0) * 60
      const progress = durationSeconds ? Math.min(100, Math.round((row.progress_seconds / durationSeconds) * 100)) : 0
      return { ...movie, progress }
    })
    .filter(Boolean)
  const continueMovies = historyItems

  const savePlayback = async (item, progressSeconds = 0, completed = false) => {
    if (!user || !item?.dbId) return
    try {
      if (item.kind === 'episode') {
        await upsertEpisodeProgress(user.id, item.dbId, progressSeconds, completed)
        if (activeSeriesId) getEpisodeProgressMap(user.id, activeSeriesId).then(setEpisodeProgress).catch(() => {})
      } else {
        await upsertWatchProgress(user.id, item.dbId, progressSeconds, completed)
      }
      await refreshAccount()
    } catch (error) {
      toast(error.message || 'Unable to save watch progress')
    }
  }

  const lastSaveRef = useRef(0)
  const playerProgressRef = useRef(0)

  const handleTimeUpdate = (event) => {
    const current = event.currentTarget.currentTime
    playerProgressRef.current = current
    if (Math.abs(current - lastSaveRef.current) > 15 && player) {
      lastSaveRef.current = current
      savePlayback(player, current, false)
    }
  }

  const handleLoadedMetadata = (event) => {
    if (!player) return
    if (player.kind === 'episode') {
      const existing = episodeProgress[player.dbId]
      if (existing?.progress && !existing.completed) event.currentTarget.currentTime = existing.progress
      return
    }
    const existing = history.find(row => row.movie_id === player.dbId)
    if (existing?.progress_seconds && !existing.completed) {
      event.currentTarget.currentTime = existing.progress_seconds
    }
  }

  const handleVideoEnded = () => {
    if (!player) return
    savePlayback(player, playerProgressRef.current, true)
  }

  const handleClosePlayer = () => {
    if (player) savePlayback(player, playerProgressRef.current, false)
    if (player?.isOffline) URL.revokeObjectURL(player.videoUrl)
    setPlayer(null)
  }

  return (
    <div className="app">
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <button className="mobile-menu" onClick={() => setMobileOpen(v => !v)} aria-label="Open menu" aria-expanded={mobileOpen}><Menu size={23} /></button>
        <button className="logo" onClick={() => goTo('home')}>RWANDA<span>FLIX</span></button>

        <div className={`nav-links ${mobileOpen ? 'open' : ''}`}>
          <button className={activePage === 'home' ? 'active' : ''} onClick={() => goTo('home')}>Home</button>
          <button className={activePage === 'browse' ? 'active' : ''} onClick={() => goTo('browse')}>Movies</button>
          <button className={activePage === 'series' ? 'active' : ''} onClick={() => navigate('/series')}>Series</button>
          <button onClick={() => { setActiveGenre('Drama'); goTo('browse') }}>Genres</button>
          <button className={activePage === 'my-list' ? 'active' : ''} onClick={() => goTo('my-list')}>My List <span className="nav-count">{list.size}</span></button>
        </div>

        <div className="nav-right">
          <label className="search-box"><Search size={16}/><input value={query} onChange={e => { setQuery(e.target.value); if (e.target.value && activePage !== 'browse') navigate('/browse') }} placeholder="Search RwandaFlix" aria-label="Search RwandaFlix" /></label>
          <div className="notification-wrap">
            <button className="icon-btn" onClick={() => openAccount('notifications')} aria-label="Notifications"><Bell size={18}/><i /></button>
          </div>
          {!user && <Button className="secondary" onClick={() => { setAuthMode('signin'); setLogin(true) }} style={{ marginRight: 4 }}>Sign In</Button>}
          <div className="profile">
            <button className="profile-btn" onClick={() => setProfileOpen(v => !v)} aria-label="Open profile" aria-expanded={profileOpen}>{user ? (user.email?.[0] || 'P').toUpperCase() : 'P'}</button>
            {profileOpen && <div className="profile-menu">
              <div className="profile-heading"><div className="avatar">{user ? (user.email?.[0] || 'P').toUpperCase() : 'P'}</div><div><strong>{user ? (user.email?.split('@')[0] || 'RwandaFlix Member') : 'RwandaFlix Guest'}</strong><small>{user ? 'RwandaFlix Member' : 'Not signed in'}</small></div></div>
              {user ? <button onClick={handleSignOut}><User size={16}/> Sign Out</button> : <><button onClick={() => { setAuthMode('signin'); setLogin(true); setProfileOpen(false) }}><User size={16}/> Sign In</button><button onClick={() => { setAuthMode('signup'); setLogin(true); setProfileOpen(false) }}><Plus size={16}/> Create Account</button></>}
              <button onClick={() => openAccount('creator')}><BarChart3 size={16}/> Creator Studio</button>
              <button onClick={() => openAccount('profile')}><Settings size={16}/> Settings</button>
            </div>}
          </div>
        </div>
      </nav>

      {activePage === 'home' && (
        <>
          <header className="hero" id="home">
            <div className="hero-content">
              <div className="eyebrow">🇷🇼 RwandaFlix Original · Featured</div>
              <h1>Stories from <span>Rwanda.</span></h1>
              <div className="hero-meta"><span>{featured.year}</span><span className="age">16+</span><span>{featured.duration}</span><span>{featured.genre}</span><span className="match">98% Match</span></div>
              <p>{featured.description || 'Discover powerful stories, talented filmmakers and unforgettable characters from Rwanda — all in one premium streaming experience. From Kigali to the world.'}</p>
              <div className="hero-actions"><Button className="primary" onClick={() => openPlayer(featured)}><Play size={18} fill="currentColor"/> Play</Button><Button className="secondary" onClick={() => setSelected(featured)}><Info size={18}/> More Info</Button></div>
            </div>
            <div className="hero-scroll">Scroll to explore <ChevronRight size={14}/></div>
          </header>

          <div className="quick-picks">
            <button onClick={() => goTo('browse')}><Film size={17}/><span><strong>Browse</strong><small>Explore the library</small></span></button>
            <button onClick={() => goTo('my-list')}><Heart size={17}/><span><strong>My List</strong><small>{list.size} saved titles</small></span></button>
            <button onClick={() => navigate('/downloads')}><Download size={17}/><span><strong>Offline</strong><small>{downloads.length ? `${downloads.length} downloaded` : 'Watch on the go'}</small></span></button>
            <button onClick={() => openAccount('creator')}><BarChart3 size={17}/><span><strong>For Creators</strong><small>Publish your stories</small></span></button>
          </div>

          <Row title="🔥 Trending in Rwanda" items={libraryMovies.slice(0, 6)} onInfo={openDetail} onPlay={openPlayer} onToggleList={toggleList} list={list} onSeeAll={() => goTo('browse')} />
          <Row title="⭐ Popular Rwandan Stories" items={libraryMovies.slice(6, 12)} onInfo={openDetail} onPlay={openPlayer} onToggleList={toggleList} list={list} onSeeAll={() => goTo('browse')} />

          {continueMovies.length > 0 && <section className="section" id="continue"><div className="section-header"><h2>▶ Continue Watching</h2><button className="see-all" onClick={() => user ? toast('Your watch history is synced with your RwandaFlix account') : toast('Sign in to sync your watch history')}>Manage <ChevronRight size={15} /></button></div><div className="wide-row">{continueMovies.map((m) => <div className="wide-card" key={m.id} onClick={() => openPlayer(m)}><img src={m.image} alt=""/><div className="watch-progress"><i style={{ width: `${m.progress || 0}%` }} /></div><div className="wide-content"><strong>{m.title}</strong><span><Clock3 size={12}/> Continue watching · {m.duration}</span></div><button className="mini-play" onClick={e => { e.stopPropagation(); openPlayer(m) }} aria-label={`Play ${m.title}`}><Play size={14} fill="currentColor" /></button></div>)}</div></section>}

          <section className="creator-panel"><div><div className="eyebrow">Built for Rwandan creators</div><h2>One platform for Rwanda's cinema industry.</h2><p>RwandaFlix gives filmmakers, producers and studios a dedicated digital home to showcase their work, understand their audience and reach viewers in Rwanda and around the world.</p><Button className="primary" onClick={() => openAccount('creator')}>Open Creator Studio <ChevronRight size={17}/></Button></div><div className="creator-stats"><div><strong>🇷🇼</strong><span>Local Stories</span></div><div><strong>HD</strong><span>Streaming</span></div><div><strong>🌍</strong><span>Global Audience</span></div></div></section>

          <Row title="🎬 RwandaFlix Originals" items={libraryMovies.slice(2, 8)} onInfo={openDetail} onPlay={openPlayer} onToggleList={toggleList} list={list} onSeeAll={() => goTo('browse')} />

          <section className="section" id="categories"><div className="section-header"><h2>Explore by Genre</h2><button className="see-all" onClick={() => goTo('browse')}>View library <ChevronRight size={15}/></button></div><div className="category-row">{categories.map(c => <button className="category" key={c.name} onClick={() => { setActiveGenre(c.name); goTo('browse') }}><img src={c.image} alt=""/><span>{c.name}</span><strong>Explore <ChevronRight size={14}/></strong></button>)}</div></section>
          <Row title="🌍 Made for the Diaspora" items={libraryMovies.slice(10, 16)} onInfo={openDetail} onPlay={openPlayer} onToggleList={toggleList} list={list} onSeeAll={() => goTo('browse')} />

          <section className="pricing"><div className="pricing-header"><div className="eyebrow">Membership</div><h2>Watch Rwanda. Anywhere.</h2><p>Choose a plan that works for you. This prototype shows the future RwandaFlix subscription experience.</p></div><div className="pricing-grid">{[['Free','$0','Selected movies','Standard quality','Ads supported','1 device'],['Premium','$5.99','Full movie library','HD streaming','No ads','2 devices'],['Family','$9.99','Full movie library','4K ready','No ads','5 profiles']].map((p,i)=><div className={`price-card ${i===1?'featured':''}`} key={p[0]}>{i===1 && <span className="popular-badge">Most Popular</span>}<h3>{p[0]}</h3><div className="price">{p[1]} <span>/ month</span></div><ul>{p.slice(2).map(x=><li key={x}><Check size={14}/> {x}</li>)}</ul><Button className={i===1?'primary':'secondary'} onClick={() => openAccount('subscription')}>Choose {p[0]}</Button></div>)}</div></section>
        </>
      )}

      {activePage === 'browse' && (
        <main className="browse-page">
          <div className="page-heading"><div><div className="eyebrow">RwandaFlix Library</div><h1>Movies</h1><p>Explore stories made in Rwanda and stories made for Rwandans everywhere.</p></div><div className="library-count">{filteredMovies.length}<span> titles</span></div></div>
          <div className="filter-bar"><div className="genre-pills">{genres.map(genre => <button key={genre} className={activeGenre === genre ? 'selected' : ''} onClick={() => setActiveGenre(genre)}>{genre}</button>)}</div><label className="browse-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search titles, genres..." aria-label="Search titles and genres" /></label></div>
          {backendLoading && !catalog.length ? <div className="loading-state">Loading catalog…</div> : filteredMovies.length ? <div className="browse-grid">{filteredMovies.map(movie => <MovieCard key={movie.id} movie={movie} onInfo={openDetail} onPlay={openPlayer} onToggleList={toggleList} inList={list.has(movie.id)} />)}</div> : <div className="empty-state"><Search size={40}/><h2>No titles found</h2><p>Try another search or genre.</p><Button className="secondary" onClick={() => { setQuery(''); setActiveGenre('All') }}>Clear filters</Button></div>}
        </main>
      )}

      {activePage === 'series' && !activeSeriesId && (
        <main className="browse-page">
          <div className="page-heading"><div><div className="eyebrow">RwandaFlix Library</div><h1>Series</h1><p>Rwandan stories told across episodes and seasons.</p></div><div className="library-count">{series.length}<span> shows</span></div></div>
          {backendLoading && !series.length ? <div className="loading-state">Loading series…</div> : series.length ? <div className="browse-grid">{series.map(show => <SeriesCard key={show.id} show={show} onClick={s => navigate(`/series/${s.id}`)} />)}</div> : <div className="empty-state"><Tv size={40}/><h2>No series published yet</h2><p>Check back soon — RwandaFlix Originals series are on the way.</p><Button className="secondary" onClick={() => goTo('browse')}>Browse movies instead</Button></div>}
        </main>
      )}

      {activePage === 'series' && activeSeriesId && (
        <main className="browse-page">
          {episodesLoading && !activeSeries ? <div className="loading-state">Loading series…</div> : !activeSeries ? (
            <div className="empty-state"><Tv size={40}/><h2>Series not found</h2><p>This series may have been unpublished.</p><Button className="secondary" onClick={() => navigate('/series')}>Back to Series</Button></div>
          ) : (
            <>
              <div className="page-heading"><div><div className="eyebrow">Series · {activeSeries.release_year || ''}</div><h1>{activeSeries.title}</h1><p>{activeSeries.description}</p></div></div>
              {episodesError && <p className="empty-state" style={{ padding: '12px 0' }}>{episodesError}</p>}
              {episodesLoading ? <div className="loading-state">Loading episodes…</div> : seriesEpisodes.length ? (
                Object.entries(seriesEpisodes.reduce((acc, ep) => {
                  const season = ep.season_number ?? 1
                  acc[season] = acc[season] || []
                  acc[season].push(ep)
                  return acc
                }, {})).map(([season, episodes]) => (
                  <section className="section" key={season}>
                    <div className="section-header"><h2>Season {season}</h2></div>
                    <div className="wide-row wide-row-stacked">{episodes.map(ep => <EpisodeRow key={ep.id} episode={ep} series={activeSeries} progress={episodeProgress[ep.id]} onPlay={openEpisodePlayer} />)}</div>
                  </section>
                ))
              ) : <div className="empty-state"><Tv size={40}/><h2>No episodes published yet</h2><p>Episodes for this series will appear here once published.</p></div>}
            </>
          )}
        </main>
      )}

      {activePage === 'my-list' && (
        <main className="browse-page"><div className="page-heading"><div><div className="eyebrow">Your Library</div><h1>My List</h1><p>Save the Rwandan stories you want to watch next.</p></div><div className="library-count">{list.size}<span> saved</span></div></div>{myListMovies.length ? <div className="browse-grid">{myListMovies.map(movie => <MovieCard key={movie.id} movie={movie} onInfo={openDetail} onPlay={openPlayer} onToggleList={toggleList} inList />)}</div> : <div className="empty-state"><Heart size={40}/><h2>Your list is empty</h2><p>Tap the + button on a title to save it here.</p><Button className="primary" onClick={() => goTo('browse')}>Browse titles</Button></div>}</main>
      )}

      {activePage === 'downloads' && (
        <main className="browse-page">
          <div className="page-heading"><div><div className="eyebrow">RwandaFlix</div><h1>Downloads</h1><p>Titles saved to this device for offline viewing. Downloads live in this browser only and won't follow you to another device.</p></div><div className="library-count">{downloads.length}<span> saved</span></div></div>
          {!isDownloadSupported() && <p className="empty-state" style={{ minHeight: 'auto', padding: '10px 16px', border: '1px solid #333', borderRadius: 8, color: '#e9b949', display: 'block', textAlign: 'left' }}>This browser doesn't support offline downloads.</p>}
          {downloads.length ? (
            <div className="wide-row wide-row-stacked">{downloads.map(d => (
              <div className="wide-card" key={d.id} onClick={() => openPlayer({ id: d.id, title: d.title, image: d.image, videoUrl: d.videoUrl, duration: d.duration })}>
                <img src={d.image} alt="" />
                <div className="wide-content"><strong>{d.title}</strong><span><Clock3 size={12}/> {d.duration} · {(d.sizeBytes / (1024 * 1024)).toFixed(0)} MB</span></div>
                <button className="mini-play" onClick={e => { e.stopPropagation(); handleRemoveDownload(d.id) }} aria-label={`Remove ${d.title} from downloads`}><X size={14} /></button>
              </div>
            ))}</div>
          ) : (
            <div className="empty-state"><Download size={40}/><h2>No downloads yet</h2><p>Open a title and tap Download to watch it offline. Works for titles with a published video file.</p><Button className="secondary" onClick={() => goTo('browse')}>Browse titles</Button></div>
          )}
        </main>
      )}

      {activePage === 'info' && INFO_PAGES[infoSlug] && (
        <main className="browse-page">
          <div className="page-heading"><div><div className="eyebrow">RwandaFlix</div><h1>{INFO_PAGES[infoSlug].title}</h1></div></div>
          {INFO_PAGES[infoSlug].draft && <p className="empty-state" style={{ minHeight: 'auto', padding: '10px 16px', border: '1px solid #333', borderRadius: 8, color: '#e9b949', display: 'block', textAlign: 'left' }}>Draft template — not yet reviewed by a lawyer. Do not treat this as final legal copy.</p>}
          <div style={{ maxWidth: 720, color: '#ccc', lineHeight: 1.8 }}>{INFO_PAGES[infoSlug].body.map((para, i) => <p key={i} style={{ marginBottom: 16 }}>{para}</p>)}</div>
          <Button className="secondary" onClick={() => goTo('home')} style={{ marginTop: 10 }}>Back to Home</Button>
        </main>
      )}

      <footer><div className="footer-grid"><div><button className="logo" onClick={() => goTo('home')}>RWANDA<span>FLIX</span></button><p>A premium streaming platform concept dedicated to Rwandan cinema, filmmakers and audiences around the world.</p><div className="footer-social"><a href="https://www.facebook.com/ingpacific/" target="_blank" rel="noopener noreferrer" aria-label="RwandaFlix on Facebook">f</a><a href="https://www.instagram.com/paccy0/" target="_blank" rel="noopener noreferrer" aria-label="RwandaFlix on Instagram">◎</a><a href="https://www.linkedin.com/in/ingabire-pacifique/" target="_blank" rel="noopener noreferrer" aria-label="RwandaFlix on LinkedIn">in</a></div></div><div><h3>Platform</h3><button onClick={() => goTo('browse')}>Movies</button><button onClick={() => navigate('/series')}>Series</button><button onClick={() => goTo('my-list')}>My List</button><button onClick={() => { goTo('home'); setTimeout(() => document.getElementById('categories')?.scrollIntoView(), 100) }}>Genres</button><button onClick={() => navigate('/downloads')}>Downloads</button></div><div><h3>Creators</h3><button onClick={() => openAccount('creator')}>Creator Studio</button><button onClick={() => openAccount('creator')}>Submit a Film</button><button onClick={() => navigate('/partner')}>Partner With Us</button><button onClick={() => navigate('/guidelines')}>Guidelines</button></div><div><h3>Support</h3><button onClick={() => navigate('/help')}>Help Center</button><button onClick={() => navigate('/terms')}>Terms</button><button onClick={() => navigate('/privacy')}>Privacy</button><button onClick={() => navigate('/contact')}>Contact</button></div></div><div className="copyright">© 2026 RwandaFlix Concept · Built for Rwandan Cinema 🇷🇼 <span>{user ? 'Supabase account connected' : 'Frontend fallback catalog active'}</span></div></footer>

      {selected && <div className="modal" role="dialog" aria-modal="true" aria-label={`${selected.title} details`} onClick={e => e.target === e.currentTarget && closeDetail()}><div className="modal-box"><button className="close" onClick={closeDetail} aria-label="Close details"><X/></button><img className="modal-image" src={selected.image} alt=""/><div className="modal-content"><div className="eyebrow">RwandaFlix</div><h2>{selected.title}</h2><div className="hero-meta"><span>{selected.year}</span><span className="age">HD</span><span>{selected.genre}</span><span>{selected.duration}</span></div><p>{selected.description}</p><div className="detail-tags"><span>🇷🇼 Rwanda</span><span>{selected.ratingAverage ? `${selected.ratingAverage.toFixed(1)}★ (${selected.ratingCount} rating${selected.ratingCount === 1 ? '' : 's'})` : 'Not yet rated'}</span><span>Subtitles</span></div><div className="hero-actions"><Button className="primary" onClick={() => openPlayer(selected)}><Play size={18} fill="currentColor"/> Play</Button><Button className="secondary" onClick={() => toggleList(selected)}>{list.has(selected.id) ? <Check size={18}/> : <Plus size={18}/>} {list.has(selected.id) ? 'In My List' : 'My List'}</Button>{isDownloadSupported() && (isDownloaded(selected.id) ? <Button className="secondary" onClick={() => handleRemoveDownload(selected.id)}><Check size={18}/> Downloaded</Button> : <Button className="secondary" disabled={downloadProgress[selected.id] !== undefined} onClick={() => handleDownload(selected)}><Download size={18}/> {downloadProgress[selected.id] !== undefined ? (downloadProgress[selected.id] === null ? 'Downloading…' : `${downloadProgress[selected.id]}%`) : 'Download'}</Button>)}</div><div className="rate-row" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}><span style={{ fontSize: 13, color: '#999', marginRight: 4 }}>{myRating ? 'Your rating:' : 'Rate this:'}</span>{[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => submitRating(n)} aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><Star size={20} fill={myRating && n <= myRating ? 'currentColor' : 'none'} color={myRating && n <= myRating ? '#e50914' : '#666'} /></button>)}</div></div></div></div>}

      {player && <div className="modal" role="dialog" aria-modal="true" aria-label={`${player.title} player`} onClick={e => e.target === e.currentTarget && handleClosePlayer()}><div className="video-box"><button className="close" onClick={handleClosePlayer} aria-label="Close player"><X/></button><div className="video-screen">{player.videoUrl ? <video className="rwanda-video" src={player.videoUrl} controls playsInline poster={player.image} onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} onPause={() => savePlayback(player, playerProgressRef.current, false)} onEnded={handleVideoEnded} /> : <><div className="player-brand">RWANDA<span>FLIX</span></div><div className="player-center"><button className="big-play" onClick={() => toast('Demo player ready — add a published video URL to stream this title')} aria-label={`Play ${player.title}`}><Play size={34} fill="currentColor"/></button><h3>{player.title}</h3><p>Streaming is ready for published Supabase video URLs.</p></div></>}</div>{!player.videoUrl && <div className="video-controls"><span>▶</span><div className="progress"><i /></div><span>🔊</span><span>CC</span><span>⚙</span><span>⛶</span></div>}</div></div>}

      {login && <div className="modal" role="dialog" aria-modal="true" aria-label={authMode === 'signin' ? 'Sign in' : 'Create account'} onClick={e => e.target === e.currentTarget && setLogin(false)}><form className="auth-box" onSubmit={handleAuth}><button type="button" className="close" onClick={() => setLogin(false)} aria-label="Close authentication"><X/></button><div className="auth-logo">RWANDA<span>FLIX</span></div><h2>{authMode === 'signin' ? 'Welcome back' : 'Join RwandaFlix'}</h2><p>{authMode === 'signin' ? 'Sign in to continue watching RwandaFlix.' : 'Create your RwandaFlix account and sync your library.'}</p><input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email address" type="email" autoComplete="email" required/><input value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" type="password" autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} minLength={6} required/><Button className="primary full" type="submit" disabled={authBusy}>{authBusy ? 'Connecting…' : authMode === 'signin' ? 'Sign In' : 'Create Account'}</Button><div className="or"><span>or</span></div><Button type="button" className="secondary full" onClick={() => setAuthMode(mode => mode === 'signin' ? 'signup' : 'signin')}>{authMode === 'signin' ? 'Create an account' : 'Back to sign in'}</Button><small>Secure authentication is handled by Supabase. Your session stays on this device until you sign out.</small></form></div>}

      {accountOpen && user && <AccountCenter user={user} onClose={() => setAccountOpen(false)} initialTab={accountTab} />}

      {notice && <div className="toast"><Check size={16}/>{notice}</div>}
    </div>
  )
}

export default App
