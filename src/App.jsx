import { useMemo, useState } from 'react'
import { Play, Info, Plus, Search, X, User, BarChart3, Menu, ChevronRight } from 'lucide-react'
import { movies, categories } from './data/movies'
import './App.css'

function MovieCard({ movie, onInfo, onPlay, onAdd }) {
  return (
    <article className="movie-card" onClick={() => onInfo(movie)}>
      <img src={movie.image} alt={movie.title} loading="lazy" />
      <div className="movie-overlay">
        <strong>{movie.title}</strong>
        <span>{movie.year} · {movie.genre} · {movie.duration}</span>
        <div className="card-actions">
          <button aria-label="Play" onClick={(e) => { e.stopPropagation(); onPlay(movie) }}><Play size={15} fill="currentColor" /></button>
          <button aria-label="Add to list" className="dark-action" onClick={(e) => { e.stopPropagation(); onAdd(movie) }}><Plus size={16} /></button>
        </div>
      </div>
    </article>
  )
}

function Row({ title, items, onInfo, onPlay, onAdd }) {
  return (
    <section className="section">
      <div className="section-header"><h2>{title}</h2><button className="see-all">See all <ChevronRight size={15} /></button></div>
      <div className="movie-row">{items.map(movie => <MovieCard key={movie.id} movie={movie} onInfo={onInfo} onPlay={onPlay} onAdd={onAdd} />)}</div>
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
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')

  const searchResults = useMemo(() => query.trim() ? movies.filter(m => `${m.title} ${m.genre}`.toLowerCase().includes(query.toLowerCase())) : [], [query])
  const toast = (message) => { setNotice(message); window.clearTimeout(window.__rfToast); window.__rfToast = window.setTimeout(() => setNotice(''), 2200) }
  const openPlayer = (movie) => { setSelected(null); setPlayer(movie || movies[0]) }

  return (
    <div className="app">
      <nav className="navbar">
        <button className="mobile-menu" onClick={() => setMobileOpen(v => !v)}><Menu size={23} /></button>
        <a className="logo" href="#home">RWANDA<span>FLIX</span></a>
        <div className={`nav-links ${mobileOpen ? 'open' : ''}`}>
          <a href="#home">Home</a><a href="#movies">Movies</a><a href="#series">Series</a><a href="#categories">Genres</a><a href="#my-list">My List</a>
        </div>
        <div className="nav-right">
          <label className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." /></label>
          <div className="profile">
            <button className="profile-btn" onClick={() => setProfileOpen(v => !v)}>P</button>
            {profileOpen && <div className="profile-menu">
              <button onClick={() => {setLogin(true);setProfileOpen(false)}}><User size={16}/> Sign In</button>
              <button onClick={() => {setDashboard(true);setProfileOpen(false)}}><BarChart3 size={16}/> Creator Dashboard</button>
              <button onClick={() => toast('Settings coming in the next version')}>⚙ Settings</button>
            </div>}
          </div>
        </div>
      </nav>

      {query && <div className="search-results"><div className="section-header"><h2>Search results</h2><button onClick={() => setQuery('')}><X size={18}/></button></div>{searchResults.length ? <div className="movie-row">{searchResults.map(m => <MovieCard key={m.id} movie={m} onInfo={setSelected} onPlay={openPlayer} onAdd={() => toast('Added to My List')} />)}</div> : <p className="muted">No movies found for “{query}”.</p>}</div>}

      <header className="hero" id="home">
        <div className="hero-content">
          <div className="eyebrow">🇷🇼 RwandaFlix Original</div>
          <h1>Stories from <span>Rwanda.</span></h1>
          <div className="hero-meta"><span>2026</span><span className="age">16+</span><span>2h 04m</span><span>Drama</span></div>
          <p>Discover powerful stories, talented filmmakers and unforgettable characters from Rwanda — all in one premium streaming experience. Watch Rwandan cinema from Kigali to the world.</p>
          <div className="hero-actions"><button className="btn primary" onClick={() => openPlayer()}><Play size={18} fill="currentColor"/> Play</button><button className="btn secondary" onClick={() => setSelected(movies[0])}><Info size={18}/> More Info</button></div>
        </div>
      </header>

      <main id="movies">
        <Row title="🔥 Trending in Rwanda" items={movies.slice(0,6)} onInfo={setSelected} onPlay={openPlayer} onAdd={() => toast('Added to My List ❤️')} />
        <Row title="⭐ Popular Rwandan Stories" items={movies.slice(6,12)} onInfo={setSelected} onPlay={openPlayer} onAdd={() => toast('Added to My List ❤️')} />
        <section className="section" id="series"><div className="section-header"><h2>▶ Continue Watching</h2></div><div className="wide-row">{movies.slice(3,7).map(m => <div className="wide-card" key={m.id} onClick={() => openPlayer(m)}><img src={m.image} alt=""/><div><strong>{m.title}</strong><span>Continue watching · {m.duration}</span></div></div>)}</div></section>

        <section className="creator-panel"><div><div className="eyebrow">Built for Rwandan creators</div><h2>One platform for Rwanda's cinema industry.</h2><p>RwandaFlix gives filmmakers, producers and studios a dedicated digital home to showcase their work, understand their audience and reach viewers in Rwanda and around the world.</p><button className="btn primary" onClick={() => setDashboard(true)}>Creator Dashboard <ChevronRight size={17}/></button></div><div className="creator-stats"><div><strong>🇷🇼</strong><span>Local Stories</span></div><div><strong>HD</strong><span>Streaming</span></div><div><strong>🌍</strong><span>Global Audience</span></div></div></section>

        <Row title="🎬 RwandaFlix Originals" items={movies.slice(2,8)} onInfo={setSelected} onPlay={openPlayer} onAdd={() => toast('Added to My List ❤️')} />
        <section className="section" id="categories"><div className="section-header"><h2>Explore by Genre</h2></div><div className="category-row">{categories.map(c => <button className="category" key={c.name} onClick={() => setQuery(c.name)}><img src={c.image} alt=""/><strong>{c.name}</strong></button>)}</div></section>
        <Row title="🌍 Made for the Diaspora" items={movies.slice(10,16)} onInfo={setSelected} onPlay={openPlayer} onAdd={() => toast('Added to My List ❤️')} />

        <section className="pricing"><div className="pricing-header"><h2>Watch Rwanda. Anywhere.</h2><p>Choose a plan that works for you. This is a prototype of the future RwandaFlix subscription experience.</p></div><div className="pricing-grid">{[['Free','$0','Selected movies','Standard quality','Ads supported','1 device'],['Premium','$5.99','Full movie library','HD streaming','No ads','2 devices'],['Family','$9.99','Full movie library','4K ready','No ads','5 profiles']].map((p,i)=><div className={`price-card ${i===1?'featured':''}`} key={p[0]}><h3>{p[0]}</h3><div className="price">{p[1]} <span>/ month</span></div><ul>{p.slice(2).map(x=><li key={x}>✓ {x}</li>)}</ul><button className={`btn ${i===1?'primary':'secondary'}`} onClick={() => toast(`${p[0]} plan selected`)}>Choose {p[0]}</button></div>)}</div></section>
      </main>

      <footer><div className="footer-grid"><div><div className="logo">RWANDA<span>FLIX</span></div><p>A premium streaming platform concept dedicated to Rwandan cinema, filmmakers and audiences around the world.</p></div><div><h3>Platform</h3><a href="#movies">Movies</a><a href="#series">Series</a><a href="#categories">Genres</a><a href="#my-list">My List</a></div><div><h3>Creators</h3><button onClick={() => setDashboard(true)}>Creator Dashboard</button><button onClick={() => toast('Film submission will be connected later')}>Submit a Film</button><button onClick={() => toast('Partner program coming soon')}>Partner With Us</button></div><div><h3>Support</h3><button onClick={() => toast('Help Center coming soon')}>Help Center</button><button onClick={() => toast('Terms coming soon')}>Terms</button><button onClick={() => toast('Privacy page coming soon')}>Privacy</button></div></div><div className="copyright">© 2026 RwandaFlix Concept · Built for Rwandan Cinema 🇷🇼</div></footer>

      {selected && <div className="modal" onClick={e => e.target === e.currentTarget && setSelected(null)}><div className="modal-box"><button className="close" onClick={() => setSelected(null)}><X/></button><img className="modal-image" src={selected.image} alt=""/><div className="modal-content"><h2>{selected.title}</h2><div className="hero-meta"><span>{selected.year}</span><span>{selected.genre}</span><span>{selected.duration}</span></div><p>{selected.description}</p><div className="hero-actions"><button className="btn primary" onClick={() => openPlayer(selected)}><Play size={18} fill="currentColor"/> Play</button><button className="btn secondary" onClick={() => toast('Added to My List ❤️')}><Plus size={18}/> My List</button></div></div></div></div>}
      {player && <div className="modal" onClick={e => e.target === e.currentTarget && setPlayer(null)}><div className="video-box"><button className="close" onClick={() => setPlayer(null)}><X/></button><div className="video-screen"><div><Play size={50} fill="currentColor"/><h3>{player.title}</h3><p>Real HLS video streaming will be connected in the backend phase.</p></div></div><div className="video-controls"><span>▶</span><div className="progress"><i/></div><span>🔊</span><span>⚙</span><span>⛶</span></div></div></div>}
      {login && <div className="modal" onClick={e => e.target === e.currentTarget && setLogin(false)}><div className="auth-box"><button className="close" onClick={() => setLogin(false)}><X/></button><h2>Welcome back</h2><p>Sign in to continue watching RwandaFlix.</p><input placeholder="Email address" type="email"/><input placeholder="Password" type="password"/><button className="btn primary full" onClick={() => {setLogin(false);toast('Demo login successful 👋')}}>Sign In</button><small>Prototype only — authentication will be connected later.</small></div></div>}
      {dashboard && <div className="modal" onClick={e => e.target === e.currentTarget && setDashboard(false)}><div className="dashboard-box"><button className="close" onClick={() => setDashboard(false)}><X/></button><aside><h3>Creator Studio</h3><button>📊 Overview</button><button>🎬 My Movies</button><button>⬆ Upload Film</button><button>📈 Analytics</button><button>💰 Revenue</button></aside><section><h2>Creator Dashboard</h2><div className="dashboard-stats">{[['Total Views','124.8K'],['Subscribers','8,492'],['Movies','12'],['Revenue','$4.8K']].map(s=><div key={s[0]}><span>{s[0]}</span><strong>{s[1]}</strong></div>)}</div><h3>Recent Content</h3><div className="wide-row">{movies.slice(0,2).map(m=><div className="wide-card" key={m.id}><img src={m.image} alt=""/><div><strong>{m.title}</strong><span>Published · 32K views</span></div></div>)}</div></section></div></div>}
      {notice && <div className="toast">{notice}</div>}
    </div>
  )
}

export default App
