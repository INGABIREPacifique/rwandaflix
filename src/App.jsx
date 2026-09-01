import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3, Bell, Check, ChevronRight, Clock3, Download,
  Film, Heart, Info, List, Menu, Play, Plus, Search, Settings, Star, User, X
} from 'lucide-react'
import { movies, categories } from './data/movies'
import './App.css'

const featured = movies[0]

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

  const toast = (message) => {
    setNotice(message)
    window.clearTimeout(window.__rfToast)
    window.__rfToast = window.setTimeout(() => setNotice(''), 2400)
  }

  const openPlayer = (movie = featured) => {
    setSelected(null)
    setPlayer(movie)
  }

  const toggleList = (movie) => {
    setList(previous => {
      const next = new Set(previous)
      if (next.has(movie.id)) {
        next.delete(movie.id)
        toast(`${movie.title} removed from My List`)
      } else {
        next.add(movie.id)
        toast(`${movie.title} added to My List ❤️`)
      }
      return next
    })
  }

  const filteredMovies = useMemo(() => {
    let result = movies
    if (activeGenre !== 'All') result = result.filter(movie => movie.genre === activeGenre)
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(movie => `${movie.title} ${movie.genre} ${movie.description}`.toLowerCase().includes(q))
    }
    return result
  }, [query, activeGenre])

  const goTo = (page) => {
    setActivePage(page)
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const genres = ['All', ...categories.map(c => c.name), 'Adventure', 'History', 'Romance']
  const myListMovies = movies.filter(movie => list.has(movie.id))

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
            {notifications && <div className="notification-menu"><strong>Notifications</strong><p>New Rwandan stories are coming soon.</p><p>Your My List has {list.size} title{list.size !== 1 ? 's' : ''}.</p></div>}
          </div>
          <div className="profile">
            <button className="profile-btn" onClick={() => setProfileOpen(v => !v)} aria-label="Open profile" aria-expanded={profileOpen}>P</button>
            {profileOpen && <div className="profile-menu">
              <div className="profile-heading"><div className="avatar">P</div><div><strong>Pacifique</strong><small>RwandaFlix Member</small></div></div>
              <button onClick={() => { setLogin(true); setProfileOpen(false) }}><User size={16}/> Sign In</button>
              <button onClick={() => { setDashboard(true); setProfileOpen(false) }}><BarChart3 size={16}/> Creator Studio</button>
              <button onClick={() => toast('Settings will connect in the backend phase')}><Settings size={16}/> Settings</button>
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
              <div className="hero-meta"><span>2026</span><span className="age">16+</span><span>2h 04m</span><span>Drama</span><span className="match">98% Match</span></div>
              <p>Discover powerful stories, talented filmmakers and unforgettable characters from Rwanda — all in one premium streaming experience. From Kigali to the world.</p>
              <div className="hero-actions"><Button className="primary" onClick={() => openPlayer()}><Play size={18} fill="currentColor"/> Play</Button><Button className="secondary" onClick={() => setSelected(featured)}><Info size={18}/> More Info</Button></div>
            </div>
            <div className="hero-scroll">Scroll to explore <ChevronRight size={14}/></div>
          </header>

          <div className="quick-picks">
            <button onClick={() => goTo('browse')}><Film size={17}/><span><strong>Browse</strong><small>Explore the library</small></span></button>
            <button onClick={() => goTo('my-list')}><Heart size={17}/><span><strong>My List</strong><small>{list.size} saved titles</small></span></button>
            <button onClick={() => toast('Download feature will be connected later')}><Download size={17}/><span><strong>Offline</strong><small>Watch on the go</small></span></button>
            <button onClick={() => setDashboard(true)}><BarChart3 size={17}/><span><strong>For Creators</strong><small>Publish your stories</small></span></button>
          </div>

          <Row title="🔥 Trending in Rwanda" items={movies.slice(0, 6)} onInfo={setSelected} onPlay={openPlayer} onToggleList={toggleList} list={list} onSeeAll={() => goTo('browse')} />
          <Row title="⭐ Popular Rwandan Stories" items={movies.slice(6, 12)} onInfo={setSelected} onPlay={openPlayer} onToggleList={toggleList} list={list} onSeeAll={() => goTo('browse')} />

          <section className="section" id="continue"><div className="section-header"><h2>▶ Continue Watching</h2><button className="see-all" onClick={() => toast('Your watch history will sync after account setup')}>Manage <ChevronRight size={15}/></button></div><div className="wide-row">{movies.slice(3, 7).map((m, index) => <div className="wide-card" key={m.id} onClick={() => openPlayer(m)}><img src={m.image} alt=""/><div className="watch-progress"><i style={{ width: `${31 + index * 15}%` }} /></div><div className="wide-content"><strong>{m.title}</strong><span><Clock3 size={12}/> Continue watching · {m.duration}</span></div><button className="mini-play" onClick={e => { e.stopPropagation(); openPlayer(m) }} aria-label={`Play ${m.title}`}><Play size={14} fill="currentColor" /></button></div>)}</div></section>

          <section className="creator-panel"><div><div className="eyebrow">Built for Rwandan creators</div><h2>One platform for Rwanda's cinema industry.</h2><p>RwandaFlix gives filmmakers, producers and studios a dedicated digital home to showcase their work, understand their audience and reach viewers in Rwanda and around the world.</p><Button className="primary" onClick={() => setDashboard(true)}>Open Creator Studio <ChevronRight size={17}/></Button></div><div className="creator-stats"><div><strong>🇷🇼</strong><span>Local Stories</span></div><div><strong>HD</strong><span>Streaming</span></div><div><strong>🌍</strong><span>Global Audience</span></div></div></section>

          <Row title="🎬 RwandaFlix Originals" items={movies.slice(2, 8)} onInfo={setSelected} onPlay={openPlayer} onToggleList={toggleList} list={list} onSeeAll={() => goTo('browse')} />

          <section className="section" id="categories"><div className="section-header"><h2>Explore by Genre</h2><button className="see-all" onClick={() => goTo('browse')}>View library <ChevronRight size={15}/></button></div><div className="category-row">{categories.map(c => <button className="category" key={c.name} onClick={() => { setActiveGenre(c.name); goTo('browse') }}><img src={c.image} alt=""/><span>{c.name}</span><strong>Explore <ChevronRight size={14}/></strong></button>)}</div></section>
          <Row title="🌍 Made for the Diaspora" items={movies.slice(10, 16)} onInfo={setSelected} onPlay={openPlayer} onToggleList={toggleList} list={list} onSeeAll={() => goTo('browse')} />

          <section className="pricing"><div className="pricing-header"><div className="eyebrow">Membership</div><h2>Watch Rwanda. Anywhere.</h2><p>Choose a plan that works for you. This prototype shows the future RwandaFlix subscription experience.</p></div><div className="pricing-grid">{[['Free','$0','Selected movies','Standard quality','Ads supported','1 device'],['Premium','$5.99','Full movie library','HD streaming','No ads','2 devices'],['Family','$9.99','Full movie library','4K ready','No ads','5 profiles']].map((p,i)=><div className={`price-card ${i===1?'featured':''}`} key={p[0]}>{i===1 && <span className="popular-badge">Most Popular</span>}<h3>{p[0]}</h3><div className="price">{p[1]} <span>/ month</span></div><ul>{p.slice(2).map(x=><li key={x}><Check size={14}/> {x}</li>)}</ul><Button className={i===1?'primary':'secondary'} onClick={() => toast(`${p[0]} plan selected — checkout comes in the backend phase`)}>Choose {p[0]}</Button></div>)}</div></section>
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

      <footer><div className="footer-grid"><div><button className="logo" onClick={() => goTo('home')}>RWANDA<span>FLIX</span></button><p>A premium streaming platform concept dedicated to Rwandan cinema, filmmakers and audiences around the world.</p><div className="footer-social"><button onClick={() => toast('Social links will be added soon')}>f</button><button onClick={() => toast('Social links will be added soon')}>◎</button><button onClick={() => toast('Social links will be added soon')}>in</button></div></div><div><h3>Platform</h3><button onClick={() => goTo('browse')}>Movies & Series</button><button onClick={() => goTo('my-list')}>My List</button><button onClick={() => { goTo('home'); setTimeout(() => document.getElementById('categories')?.scrollIntoView(), 100) }}>Genres</button><button onClick={() => toast('Downloads will be connected later')}>Downloads</button></div><div><h3>Creators</h3><button onClick={() => setDashboard(true)}>Creator Studio</button><button onClick={() => toast('Film submission will be connected later')}>Submit a Film</button><button onClick={() => toast('Partner program coming soon')}>Partner With Us</button><button onClick={() => toast('Creator guidelines coming soon')}>Guidelines</button></div><div><h3>Support</h3><button onClick={() => toast('Help Center coming soon')}>Help Center</button><button onClick={() => toast('Terms coming soon')}>Terms</button><button onClick={() => toast('Privacy page coming soon')}>Privacy</button><button onClick={() => toast('Contact support will be connected later')}>Contact</button></div></div><div className="copyright">© 2026 RwandaFlix Concept · Built for Rwandan Cinema 🇷🇼 <span>Frontend prototype · Backend integration next</span></div></footer>

      {selected && <div className="modal" role="dialog" aria-modal="true" aria-label={`${selected.title} details`} onClick={e => e.target === e.currentTarget && setSelected(null)}><div className="modal-box"><button className="close" onClick={() => setSelected(null)} aria-label="Close details"><X/></button><img className="modal-image" src={selected.image} alt=""/><div className="modal-content"><div className="eyebrow">RwandaFlix</div><h2>{selected.title}</h2><div className="hero-meta"><span>{selected.year}</span><span className="age">HD</span><span>{selected.genre}</span><span>{selected.duration}</span></div><p>{selected.description}</p><div className="detail-tags"><span>🇷🇼 Rwanda</span><span>98% Match</span><span>Subtitles</span></div><div className="hero-actions"><Button className="primary" onClick={() => openPlayer(selected)}><Play size={18} fill="currentColor"/> Play</Button><Button className="secondary" onClick={() => toggleList(selected)}>{list.has(selected.id) ? <Check size={18}/> : <Plus size={18}/>} {list.has(selected.id) ? 'In My List' : 'My List'}</Button></div></div></div></div>}

      {player && <div className="modal" role="dialog" aria-modal="true" aria-label={`${player.title} player`} onClick={e => e.target === e.currentTarget && setPlayer(null)}><div className="video-box"><button className="close" onClick={() => setPlayer(null)} aria-label="Close player"><X/></button><div className="video-screen"><div className="player-brand">RWANDA<span>FLIX</span></div><div className="player-center"><button className="big-play" onClick={() => toast('Demo player ready — real streaming comes with the backend')} aria-label={`Play ${player.title}`}><Play size={34} fill="currentColor"/></button><h3>{player.title}</h3><p>Real HLS video streaming will be connected in the backend phase.</p></div></div><div className="video-controls"><span>▶</span><div className="progress"><i /></div><span>🔊</span><span>CC</span><span>⚙</span><span>⛶</span></div></div></div>}

      {login && <div className="modal" role="dialog" aria-modal="true" aria-label="Sign in" onClick={e => e.target === e.currentTarget && setLogin(false)}><div className="auth-box"><button className="close" onClick={() => setLogin(false)} aria-label="Close sign in"><X/></button><div className="auth-logo">RWANDA<span>FLIX</span></div><h2>Welcome back</h2><p>Sign in to continue watching RwandaFlix.</p><input placeholder="Email address" type="email" autoComplete="email"/><input placeholder="Password" type="password" autoComplete="current-password"/><Button className="primary full" onClick={() => { setLogin(false); toast('Demo login successful 👋') }}>Sign In</Button><div className="or"><span>or</span></div><Button className="secondary full" onClick={() => { setLogin(false); toast('Demo account created 👋') }}>Create an account</Button><small>Prototype only — authentication will connect to Supabase in the backend phase.</small></div></div>}

      {dashboard && <div className="modal" role="dialog" aria-modal="true" aria-label="Creator Studio" onClick={e => e.target === e.currentTarget && setDashboard(false)}><div className="dashboard-box"><button className="close" onClick={() => setDashboard(false)} aria-label="Close creator studio"><X/></button><aside><div className="studio-logo"><Film size={18}/> Creator Studio</div><button className="studio-active"><BarChart3 size={16}/> Overview</button><button><Film size={16}/> My Movies</button><button><Download size={16}/> Upload Film</button><button><BarChart3 size={16}/> Analytics</button><button><Star size={16}/> Audience</button><button><List size={16}/> Payouts</button></aside><section><div className="dashboard-top"><div><div className="eyebrow">Creator workspace</div><h2>Good evening, Pacifique.</h2><p>Here is how your Rwandan stories are performing.</p></div><Button className="primary" onClick={() => toast('Upload flow will connect in the backend phase')}>+ Upload Film</Button></div><div className="dashboard-stats">{[['Total Views','124.8K','+18.4%'],['Subscribers','8,492','+9.2%'],['Movies','12','+2 this month'],['Revenue','$4.8K','+14.8%']].map(s=><div key={s[0]}><span>{s[0]}</span><strong>{s[1]}</strong><small>{s[2]}</small></div>)}</div><div className="dashboard-grid"><div className="dashboard-card"><h3>Performance</h3><div className="fake-chart">{[38,52,44,68,58,82,74,91].map((height, i) => <i key={i} style={{height:`${height}%`}} />)}</div><div className="chart-labels"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div></div><div className="dashboard-card"><h3>Recent Content</h3>{movies.slice(0, 3).map(m=><div className="content-item" key={m.id}><img src={m.image} alt=""/><div><strong>{m.title}</strong><span>Published · 32K views</span></div><ChevronRight size={15}/></div>)}</div></div></section></div></div>}

      {notice && <div className="toast"><Check size={16}/>{notice}</div>}
    </div>
  )
}

export default App
