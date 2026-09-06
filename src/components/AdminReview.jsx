import { useEffect, useState } from 'react'
import { Check, X, Film, Eye, EyeOff, Trash2 } from 'lucide-react'
import {
  isAdmin,
  getAllSubmissionsForReview,
  approveSubmission,
  rejectSubmission,
  getAllMoviesForAdmin,
  toggleMoviePublish,
  deleteMovie,
  getAllProfilesForAdmin,
  updateUserRole,
} from '../lib/platform'

export default function AdminReview({ user }) {
  const [allowed, setAllowed] = useState(null)
  const [tab, setTab] = useState('submissions')
  const [submissions, setSubmissions] = useState([])
  const [movies, setMovies] = useState([])
  const [profiles, setProfiles] = useState([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [actionBusyId, setActionBusyId] = useState(null)

  useEffect(() => {
    let live = true
    isAdmin(user.id)
      .then((ok) => {
        if (!live) return
        setAllowed(ok)
        if (!ok) { setBusy(false); return }
        return Promise.all([
          getAllSubmissionsForReview(),
          getAllMoviesForAdmin(),
          getAllProfilesForAdmin(),
        ]).then(([subs, movs, profs]) => {
          if (!live) return
          setSubmissions(subs)
          setMovies(movs)
          setProfiles(profs)
        })
      })
      .catch((e) => live && setError(e.message))
      .finally(() => live && setBusy(false))
    return () => { live = false }
  }, [user.id])

  const handleApprove = async (submission) => {
    setActionBusyId(submission.id)
    setError('')
    try {
      await approveSubmission(submission)
      setSubmissions((subs) => subs.map((s) => (s.id === submission.id ? { ...s, status: 'approved' } : s)))
      setMovies(await getAllMoviesForAdmin())
    } catch (e) { setError(e.message) }
    setActionBusyId(null)
  }

  const handleReject = async (submission) => {
    const reason = window.prompt(`Reason for rejecting "${submission.title}" (optional):`) || ''
    setActionBusyId(submission.id)
    setError('')
    try {
      await rejectSubmission(submission, reason)
      setSubmissions((subs) => subs.map((s) => (s.id === submission.id ? { ...s, status: 'rejected' } : s)))
    } catch (e) { setError(e.message) }
    setActionBusyId(null)
  }

  const handleTogglePublish = async (movie) => {
    setActionBusyId(movie.id)
    setError('')
    try {
      await toggleMoviePublish(movie.id, !movie.is_published)
      setMovies((rows) => rows.map((m) => (m.id === movie.id ? { ...m, is_published: !m.is_published } : m)))
    } catch (e) { setError(e.message) }
    setActionBusyId(null)
  }

  const handleDeleteMovie = async (movie) => {
    if (!window.confirm(`Permanently delete "${movie.title}"? This cannot be undone.`)) return
    setActionBusyId(movie.id)
    setError('')
    try {
      await deleteMovie(movie.id)
      setMovies((rows) => rows.filter((m) => m.id !== movie.id))
    } catch (e) { setError(e.message) }
    setActionBusyId(null)
  }

  const handleRoleChange = async (profile, role) => {
    setActionBusyId(profile.id)
    setError('')
    try {
      await updateUserRole(profile.id, role)
      setProfiles((rows) => rows.map((p) => (p.id === profile.id ? { ...p, role } : p)))
    } catch (e) { setError(e.message) }
    setActionBusyId(null)
  }

  if (busy) return <main className="browse-page"><p>Checking access…</p></main>
  if (!allowed) return (
    <main className="browse-page">
      <div className="empty-state"><Film size={40} /><h2>Admin access only</h2><p>Your account doesn't have the admin role. Ask a project owner to grant it via the profiles table.</p></div>
    </main>
  )

  const pending = submissions.filter((s) => s.status === 'pending')
  const reviewed = submissions.filter((s) => s.status !== 'pending')

  return (
    <main className="browse-page">
      <div className="page-heading"><div><div className="eyebrow">RwandaFlix Admin</div><h1>Admin</h1></div></div>
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <div className="genre-pills">
          <button className={tab === 'submissions' ? 'selected' : ''} onClick={() => setTab('submissions')}>Submissions {pending.length > 0 && `(${pending.length})`}</button>
          <button className={tab === 'movies' ? 'selected' : ''} onClick={() => setTab('movies')}>Movies ({movies.length})</button>
          <button className={tab === 'users' ? 'selected' : ''} onClick={() => setTab('users')}>Users ({profiles.length})</button>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}

      {tab === 'submissions' && (
        <>
          <section className="section">
            <div className="section-header"><h2>Pending review</h2></div>
            {pending.length ? (
              <div className="wide-row wide-row-stacked">
                {pending.map((s) => (
                  <div className="wide-card" key={s.id} style={{ cursor: 'default' }}>
                    <div className="wide-content"><strong>{s.title}</strong><span>By {s.creator_profiles?.display_name || 'Unknown creator'} · {s.genre || 'No genre'}</span></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {s.video_url && <a href={s.video_url} target="_blank" rel="noopener noreferrer" className="btn secondary" style={{ padding: '8px 12px', fontSize: 13 }}>Preview</a>}
                      <button className="btn primary" style={{ padding: '8px 12px', fontSize: 13 }} disabled={actionBusyId === s.id} onClick={() => handleApprove(s)}><Check size={14} /> Approve</button>
                      <button className="btn secondary" style={{ padding: '8px 12px', fontSize: 13 }} disabled={actionBusyId === s.id} onClick={() => handleReject(s)}><X size={14} /> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p style={{ color: '#888' }}>No pending submissions.</p>}
          </section>
          {reviewed.length > 0 && (
            <section className="section">
              <div className="section-header"><h2>Already reviewed</h2></div>
              <div className="wide-row wide-row-stacked">
                {reviewed.map((s) => (
                  <div className="wide-card" key={s.id} style={{ cursor: 'default' }}>
                    <div className="wide-content"><strong>{s.title}</strong><span>{s.status === 'approved' ? '✅ Approved' : '❌ Rejected'} · By {s.creator_profiles?.display_name || 'Unknown creator'}</span></div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {tab === 'movies' && (
        <section className="section">
          <div className="section-header"><h2>All movies</h2></div>
          <div className="wide-row wide-row-stacked">
            {movies.map((m) => (
              <div className="wide-card" key={m.id} style={{ cursor: 'default' }}>
                <div className="wide-content"><strong>{m.title}</strong><span>{m.genre || 'No genre'} · {m.is_published ? 'Published' : 'Unpublished'}{m.creator_id ? ' · Creator submission' : ''}</span></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn secondary" style={{ padding: '8px 12px', fontSize: 13 }} disabled={actionBusyId === m.id} onClick={() => handleTogglePublish(m)}>{m.is_published ? <EyeOff size={14} /> : <Eye size={14} />} {m.is_published ? 'Unpublish' : 'Publish'}</button>
                  <button className="btn secondary" style={{ padding: '8px 12px', fontSize: 13, color: '#f5a3a3' }} disabled={actionBusyId === m.id} onClick={() => handleDeleteMovie(m)}><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'users' && (
        <section className="section">
          <div className="section-header"><h2>All users</h2></div>
          <div className="wide-row wide-row-stacked">
            {profiles.map((p) => (
              <div className="wide-card" key={p.id} style={{ cursor: 'default' }}>
                <div className="wide-content"><strong>{p.full_name || 'Unnamed user'}</strong><span>Role: {p.role}</span></div>
                <select value={p.role} disabled={actionBusyId === p.id} onChange={(e) => handleRoleChange(p, e.target.value)} style={{ background: '#161616', color: '#fff', border: '1px solid #333', borderRadius: 6, padding: '6px 10px' }}>
                  <option value="viewer">Viewer</option>
                  <option value="creator">Creator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
