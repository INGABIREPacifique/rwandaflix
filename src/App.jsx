import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3, Bell, Check, ChevronRight, Clock3, Download,
  Film, Heart, Info, List, Menu, Play, Plus, Search, Settings, Star, User, X
} from 'lucide-react'
import { movies, categories } from './data/movies'
import { useRwandaFlix } from './lib/useRwandaFlix'
import {
  addToWatchlist,
  removeFromWatchlist,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  upsertWatchProgress,
} from './lib/platform'
import './App.css'

function Button({ children, className = '', ...props }) {
  return <button className={`btn ${className}`} {...props}>{children}</button>
}

function MovieCard({ movie, onInfo, onPlay, onToggleList, inList }) {
  return (
    <article className="movie-card" onClick={() => onInfo(movie)}>
      <img src={movie.image} alt={movie.title} loading="lazy" />
      <div className="movie-overlay">
        <div className="rating"><Star size={12} fill="currentColor" /> 8.{movie.id + 1}</div>
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
  const { user, catalog, watchlist, history, loading: backendLoading, error: backendError, refreshAccount } = useRwandaFlix()
  const libraryMovies = catalog.length ? catalog : movies
  const featured = libraryMovies[0] || movies[0]

  const [selected, setSelected] = useState(null)
  const [player, setPlayer] = useState(null)
  const [login, setLogin] = useState(false)
  const [dashboard, setDashboard] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [query, setQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('All')
  const [activePage, setActivePage] = useState('home')
  const [list, setList] = useState(new Set([4, 11]))
  const [notice, setNotice] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [authMode, setAuthMode] = useState('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('modal-open', Boolean(selected || player || login || dashboard))
    return () => document.body.classList.remove('modal-open')
  }, [selected, player, login, dashboard])

  useEffect(() => {
    if (!user) {
      setList(new Set([4, 11]))
      return
    }
    setList(new Set(watchlist.map(item => item.movie_id).filter(Boolean)))
  }, [user, watchlist])

  const toast = (message) => {
    setNotice(message)
    window.clearTimeout(window.__rfToast)
    window.__rfToast = window.setTimeout(() => setNotice(''), 2600)
  }

  const openPlayer = (movie = featured) => {
    setSelected(null)
    setPlayer(movie)
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

  const goTo = (page) => {
    setActivePage(page)
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const genres = ['All', ...categories.map(c => c.name), 'Adventure', 'History', 'Romance']
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
  const continueMovies = historyItems.length ? historyItems : libraryMovies.slice(3, 7).map((movie, index) => ({ ...movie, progress: 31 + index * 15 }))

  const savePlayback = async (movie) => {
    if (!user || !movie?.dbId) return
    try {
      await upsertWatchProgress(user.id, movie.dbId, 1, false)
      await refreshAccount()
    } catch (error) {
      toast(error.message || 'Unable to save watch progress')
    }
  }

  return (
    <div className="app">
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <button className="mobile-menu" onClick={() => setMobileOpen(v => !v)} aria-label="Open menu" aria-expanded={mobileOpen}><Menu size={23} /></button>
        <button className="logo" onClick={() => goTo('home')}>RWANDA<span>FLIX</span></button>

        <div className={`nav-links ${mobileOpen ? 'open' : ''}`}>
          <button className={activePage === 'home' ? 'active' : ''} onClick={() => goTo('home')}>Home</button>
          <button className={activePage === 'browse' ? 'active' : ''} onClick={() => goTo('browse')}>Movies & Series</button>
          <button onClick={() => { setActiveGenre('Drama'); goTo('browse') }}>Genres</button>
          <button className={activePage === 'my-list' ? 'active' : ''} onClick={() => goTo('my-list')}>My List <span className="nav-count">{list.size}</span></button>
        </div>

        <div className="nav-right">
          <label className="search-box"><Search size={16}/><input value={query} onChange={e => { setQuery(e.target.value); if (e.target.value) setActivePage('browse') }} placeholder="Search RwandaFlix" aria-label="Search RwandaFlix" /></label>
          <div className="notification-wrap">
            <button className="icon-btn" onClick={() => setNotifications(v => !v)} aria-label="Notifications" aria-expanded={notifications}><Bell size={18}/><i /></button>
            {notifications && <div className="notification-menu"><strong>Notifications</strong><p>{backendLoading ? 'Syncing your RwandaFlix account…' : backendError ? 'Some account services are unavailable right now.' : 'Your RwandaFlix account is connected.'}</p><p>{user ? `You have ${list.size} saved title${list.size !== 1 ? 's' : ''}.` : 'Sign in to sync your library across devices.'}</p></div>}
          </div>
          <div className="profile">
            <button className="profile-btn" onClick={() => setProfileOpen(v => !v)} aria-label="Open profile" aria-expanded={profileOpen}>{user ? (user.email?.[0] || 'P').toUpperCase() : 'P'}</button>
            {profileOpen && <div className="profile-menu">
              <div className="profile-heading"><div className="avatar">{user ? (user.email?.[0] || 'P').toUpperCase() : 'P'}</div><div><strong>{user ? (user.email?.split('@')[0] || 'RwandaFlix Member') : 'Pacifique'}</strong><small>{user ? 'RwandaFlix Member' : 'RwandaFlix Guest'}</small></div></div>
              {user ? <button onClick={handleSignOut}><User size={16}/> Sign Out</button> : <button onClick={() => { setAuthMode('signin'); setLogin(true); setProfileOpen(false) }}><User size={16}/> Sign In</button>}
              <button onClick={() => { setDashboard(true); setProfileOpen(false) }}><BarChart3 size={16}/> Creator Studio</button>
              <button onClick={() => toast('Account settings will connect to your profile services next')}><Settings size={16}/> Settings</button>
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
            <button onClick={() => toast('Offline downloads are planned for the next streaming phase')}><Download size={17}/><span><strong>Offline</strong><small>Watch on the go</small></span></button>
            <button onClick={() => setDashboard(true)}><BarChart3 size={17}/><span><strong>For Creators</strong><small>Publish your stories</small></span></button>
          </div>

          <Row title="🔥 Trending in Rwanda" items={libraryMovies.slice(0, 6)} onInfo={setSelected} onPlay={openPlayer} onToggleList={toggleList} list={list} onSeeAll={() => goTo('browse')} />
          <Row title="⭐ Popular Rwandan Stories" items={libraryMovies.slice(6, 12)} onInfo={setSelected} onPlay={openPlayer} onToggleList={toggleList} list={list} onSeeAll={() => goTo('browse')} />

          <section className="section" id="continue"><div className="section-header"><h2>▶ Continue Watching</h2><button className="see-all" onClick={() => user ? toast('Your watch history is synced with your RwandaFlix account') : toast('Sign in to sync your watch history')}>Manage <ChevronRight size={15} /></button></div><div className="wide-row">{continueMovies.map((m) => <div className="wide-card" key={m.id} onClick={() => openPlayer(m)}><img src={m.image} alt=""/><div className="watch-progress"><i style={{ width: `${m.progress || 0}%` }} /></div><div className="wide-content"><strong>{m.title}</strong><span><Clock3 size={12}/> Continue watching · {m.duration}</span></div><button className="mini-play" onClick={e => { e.stopPropagation(); openPlayer(m) }} aria-label={`Play ${m.title}`}><Play size={14} fill="currentColor" /></button></div>)}</div></section>

          <section className="creator-panel"><div><div className="eyebrow">Built for Rwandan creators</div><h2>One platform for Rwanda's cinema industry.</h2><p>RwandaFlix gives filmmakers, producers and studios a dedicated digital home to showcase their work, understand their audience and reach viewers in Rwanda and around the world.</p><Button className="primary" onClick={() => setDashboard(true)}>Open Creator Studio <ChevronRight size={17}/></Button></div><div className="creator-stats"><div><strong>🇷🇼</strong><span>Local Stories</span></div><div><strong>HD</strong><span>Streaming</span></div><div><strong>🌍</strong><span>Global Audience</span></div></div></section>

          <Row title="🎬 RwandaFlix Originals" items={libraryMovies.slice(2, 8)} onInfo={setSelected} onPlay={openPlayer} onToggleList={toggleList} list={list} onSeeAll={() => goTo('browse')} />

          <section className="section" id="categories"><div className="section-header"><h2>Explore by Genre</h2><button className="see-all" onClick={() => goTo('browse')}>View library <ChevronRight size={15}/></button></div><div className="category-row">{categories.map(c => <button className="category" key={c.name} onClick={() => { setActiveGenre(c.name); goTo('browse') }}><img src={c.image} alt=""/><span>{c.name}</span><strong>Explore <ChevronRight size={14}/></strong></button>)}</div></section>
          <Row title="🌍 Made for the Diaspora" items={libraryMovies.slice(10, 16)} onInfo={setSelected} onPlay={openPlayer} onToggleList={toggleList} list={list} onSeeAll={() => goTo('browse')} />

          <section className="pricing"><div className="pricing-header"><div className="eyebrow">Membership</div><h2>Watch Rwanda. Anywhere.</h2><p>Choose a plan that works for you. This prototype shows the future RwandaFlix subscription experience.</p></div><div className="pricing-grid">{[['Free','$0','Selected movies','Standard quality','Ads supported','1 device'],['Premium','$5.99','Full movie library','HD streaming','No ads','2 devices'],['Family','$9.99','Full movie library','4K ready','No ads','5 profiles']].map((p,i)=><div className={`price-card ${i===1?'featured':''}`} key={p[0]}>{i===1 && <span className="popular-badge">Most Popular</span>}<h3>{p[0]}</h3><div className="price">{p[1]} <span>/ month</span></div><ul>{p.slice(2).map(x=><li key={x}><Check size={14}/> {x}</li>)}</ul><Button className={i===1?'primary':'secondary'} onClick={() => toast(`${p[0]} plan selected — subscription checkout will use Supabase billing data`)}>Choose {p[0]}</Button></div>)}</div></section>
        </>
      )}

      {activePage === 'browse' && (
        <main className="browse-page">
          <div className="page-heading"><div><div className="eyebrow">RwandaFlix Library</div><h1>Movies & Series</h1><p>Explore stories made in Rwanda and stories made for Rwandans everywhere.</p></div><div className="library-count">{filteredMovies.length}<span> titles</span></div></div>
          <div className="filter-bar"><div className="genre-pills">{genres.map(genre => <button key={genre} className={activeGenre === genre ? 'selected' : ''} onClick={() => setActiveGenre(genre)}>{genre}</button>)}</div><label className="browse-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search titles, genres..." aria-label="Search titles and genres" /></label></div>
          {filteredMovies.length ? <div className="browse-grid">{filteredMovies.map(movie => <MovieCard key={movie.id} movie={movie} onInfo={setSelected} onPlay={openPlayer} onToggleList={toggleList} inList={list.has(movie.id)} />)}</div> : <div className="empty-state"><Search size={40}/><h2>No titles found</h2><p>Try another search or genre.</p><Button className="secondary" onClick={() => { setQuery(''); setActiveGenre('All') }}>Clear filters</Button></div>}
        </main>
      )}

      {activePage === 'my-list' && (
        <main className="browse-page"><div className="page-heading"><div><div className="eyebrow">Your Library</div><h1>My List</h1><p>Save the Rwandan stories you want to watch next.</p></div><div className="library-count">{list.size}<span> saved</span></div></div>{myListMovies.length ? <div className="browse-grid">{myListMovies.map(movie => <MovieCard key={movie.id} movie={movie} onInfo={setSelected} onPlay={openPlayer} onToggleList={toggleList} inList />)}</div> : <div className="empty-state"><Heart size={40}/><h2>Your list is empty</h2><p>Tap the + button on a title to save it here.</p><Button className="primary" onClick={() => goTo('browse')}>Browse titles</Button></div>}</main>
      )}

      <footer><div className="footer-grid"><div><button className="logo" onClick={() => goTo('home')}>RWANDA<span>FLIX</span></button><p>A premium streaming platform concept dedicated to Rwandan cinema, filmmakers and audiences around the world.</p><div className="footer-social"><button onClick={() => toast('Social links will be added soon')}>f</button><button onClick={() => toast('Social links will be added soon')}>◎</button><button onClick={() => toast('Social links will be added soon')}>in</button></div></div><div><h3>Platform</h3><button onClick={() => goTo('browse')}>Movies & Series</button><button onClick={() => goTo('my-list')}>My List</button><button onClick={() => { goTo('home'); setTimeout(() => document.getElementById('categories')?.scrollIntoView(), 100) }}>Genres</button><button onClick={() => toast('Downloads are planned for the next streaming phase')}>Downloads</button></div><div><h3>Creators</h3><button onClick={() => setDashboard(true)}>Creator Studio</button><button onClick={() => toast('Film submission services are wired to the creator backend')}>Submit a Film</button><button onClick={() => toast('Partner program coming soon')}>Partner With Us</button><button onClick={() => toast('Creator guidelines coming soon')}>Guidelines</button></div><div><h3>Support</h3><button onClick={() => toast('Help Center coming soon')}>Help Center</button><button onClick={() => toast('Terms coming soon')}>Terms</button><button onClick={() => toast('Privacy page coming soon')}>Privacy</button><button onClick={() => toast('Contact support will be connected later')}>Contact</button></div></div><div className="copyright">© 2026 RwandaFlix Concept · Built for Rwandan Cinema 🇷🇼 <span>{user ? 'Supabase account connected' : 'Frontend fallback catalog active'}</span></div></footer>

      {selected && <div className="modal" role="dialog" aria-modal="true" aria-label={`${selected.title} details`} onClick={e => e.target === e.currentTarget && setSelected(null)}><div className="modal-box"><button className="close" onClick={() => setSelected(null)} aria-label="Close details"><X/></button><img className="modal-image" src={selected.image} alt=""/><div className="modal-content"><div className="eyebrow">RwandaFlix</div><h2>{selected.title}</h2><div className="hero-meta"><span>{selected.year}</span><span className="age">HD</span><span>{selected.genre}</span><span>{selected.duration}</span></div><p>{selected.description}</p><div className="detail-tags"><span>🇷🇼 Rwanda</span><span>98% Match</span><span>Subtitles</span></div><div className="hero-actions"><Button className="primary" onClick={() => openPlayer(selected)}><Play size={18} fill="currentColor"/> Play</Button><Button className="secondary" onClick={() => toggleList(selected)}>{list.has(selected.id) ? <Check size={18}/> : <Plus size={18}/>} {list.has(selected.id) ? 'In My List' : 'My List'}</Button></div></div></div></div>}

      {player && <div className="modal" role="dialog" aria-modal="true" aria-label={`${player.title} player`} onClick={e => e.target === e.currentTarget && setPlayer(null)}><div className="video-box"><button className="close" onClick={() => { setPlayer(null); savePlayback(player) }} aria-label="Close player"><X/></button><div className="video-screen">{player.videoUrl ? <video className="rwanda-video" src={player.videoUrl} controls playsInline poster={player.image} onEnded={() => user && player.dbId && upsertWatchProgress(user.id, player.dbId, 0, true).then(refreshAccount).catch(() => {})} /> : <><div className="player-brand">RWANDA<span>FLIX</span></div><div className="player-center"><button className="big-play" onClick={() => { savePlayback(player); toast('Demo player ready — add a published video URL to stream this title') }} aria-label={`Play ${player.title}`}><Play size={34} fill="currentColor"/></button><h3>{player.title}</h3><p>Streaming is ready for published Supabase video URLs.</p></div></>}</div><div className="video-controls"><span>▶</span><div className="progress"><i /></div><span>🔊</span><span>CC</span><span>⚙</span><span>⛶</span></div></div></div>}

      {login && <div className="modal" role="dialog" aria-modal="true" aria-label={authMode === 'signin' ? 'Sign in' : 'Create account'} onClick={e => e.target === e.currentTarget && setLogin(false)}><form className="auth-box" onSubmit={handleAuth}><button type="button" className="close" onClick={() => setLogin(false)} aria-label="Close authentication"><X/></button><div className="auth-logo">RWANDA<span>FLIX</span></div><h2>{authMode === 'signin' ? 'Welcome back' : 'Join RwandaFlix'}</h2><p>{authMode === 'signin' ? 'Sign in to continue watching RwandaFlix.' : 'Create your RwandaFlix account and sync your library.'}</p><input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email address" type="email" autoComplete="email" required/><input value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" type="password" autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} minLength={6} required/><Button className="primary full" type="submit" disabled={authBusy}>{authBusy ? 'Connecting…' : authMode === 'signin' ? 'Sign In' : 'Create Account'}</Button><div className="or"><span>or</span></div><Button type="button" className="secondary full" onClick={() => setAuthMode(mode => mode === 'signin' ? 'signup' : 'signin')}>{authMode === 'signin' ? 'Create an account' : 'Back to sign in'}</Button><small>Secure authentication is handled by Supabase. Your session stays on this device until you sign out.</small></form></div>}

      {dashboard && <div className="modal" role="dialog" aria-modal="true" aria-label="Creator Studio" onClick={e => e.target === e.currentTarget && setDashboard(false)}><div className="dashboard-box"><button className="close" onClick={() => setDashboard(false)} aria-label="Close creator studio"><X/></button><aside><div className="studio-logo"><Film size={18}/> Creator Studio</div><button className="studio-active"><BarChart3 size={16}/> Overview</button><button><Film size={16}/> My Movies</button><button><Download size={16}/> Upload Film</button><button><BarChart3 size={16}/> Analytics</button><button><Star size={16}/> Audience</button><button><List size={16}/> Payouts</button></aside><section><div className="dashboard-top"><div><div className="eyebrow">Creator workspace</div><h2>Good evening, {user ? (user.email?.split('@')[0] || 'Creator') : 'Pacifique'}.</h2><p>Here is how your Rwandan stories are performing.</p></div><Button className="primary" onClick={() => toast('Upload flow is connected to the creator backend architecture')}>+ Upload Film</Button></div><div className="dashboard-stats">{[['Total Views','124.8K','+18.4%'],['Subscribers','8,492','+9.2%'],['Movies','12','+2 this month'],['Revenue','$4.8K','+14.8%']].map(s=><div key={s[0]}><span>{s[0]}</span><strong>{s[1]}</strong><small>{s[2]}</small></div>)}</div><div className="dashboard-grid"><div className="dashboard-card"><h3>Performance</h3><div className="fake-chart">{[38,52,44,68,58,82,74,91].map((height, i) => <i key={i} style={{height:`${height}%`}} />)}</div><div className="chart-labels"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div></div><div className="dashboard-card"><h3>Recent Content</h3>{libraryMovies.slice(0, 3).map(m=><div className="content-item" key={m.id}><img src={m.image} alt=""/><div><strong>{m.title}</strong><span>{m.isFeatured ? 'Featured' : 'Published'} · RwandaFlix</span></div><ChevronRight size={15}/></div>)}</div></div></section></div></div>}

      {notice && <div className="toast"><Check size={16}/>{notice}</div>}
    </div>
  )
}

export default App
