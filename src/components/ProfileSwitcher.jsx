import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { getViewingProfiles, createViewingProfile, deleteViewingProfile } from '../lib/platform'

const COLORS = ['#e50914', '#0071eb', '#00a86b', '#f5a623', '#8e44ad']

export default function ProfileSwitcher({ user, activeProfile, onSelect, onClose, maxProfiles = 5 }) {
  const [profiles, setProfiles] = useState([])
  const [busy, setBusy] = useState(true)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    getViewingProfiles(user.id).then((rows) => live && setProfiles(rows)).catch((e) => live && setError(e.message)).finally(() => live && setBusy(false))
    return () => { live = false }
  }, [user.id])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    try {
      const created = await createViewingProfile(user.id, name.trim())
      setProfiles((p) => [...p, created])
      setName('')
      setAdding(false)
    } catch (err) { setError(err.message) }
  }

  const handleDelete = async (profile, e) => {
    e.stopPropagation()
    if (!window.confirm(`Remove profile "${profile.name}"?`)) return
    try {
      await deleteViewingProfile(profile.id)
      setProfiles((p) => p.filter((x) => x.id !== profile.id))
      if (activeProfile?.id === profile.id) onSelect(null)
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Who's watching">
      <div className="profile-switcher">
        {onClose && <button className="close" onClick={onClose} aria-label="Close"><X /></button>}
        <h2>Who's watching?</h2>
        {error && <p className="form-error">{error}</p>}
        {busy ? <p>Loading profiles…</p> : (
          <div className="profile-grid">
            {profiles.map((p, i) => (
              <button key={p.id} className={`profile-tile ${activeProfile?.id === p.id ? 'active' : ''}`} onClick={() => onSelect(p)}>
                <span className="profile-avatar" style={{ background: COLORS[i % COLORS.length] }}>{p.name[0]?.toUpperCase()}</span>
                <span>{p.name}</span>
                {p.is_kids && <small>Kids</small>}
                <span className="profile-remove" onClick={(e) => handleDelete(p, e)} role="button" aria-label={`Remove ${p.name}`}><X size={13} /></span>
              </button>
            ))}
            {profiles.length < maxProfiles && !adding && (
              <button className="profile-tile add" onClick={() => setAdding(true)}>
                <span className="profile-avatar add"><Plus size={22} /></span>
                <span>Add Profile</span>
              </button>
            )}
            {adding && (
              <form className="profile-tile add" onSubmit={handleAdd}>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" maxLength={20} />
                <button type="submit" className="btn primary" style={{ padding: '6px 10px', fontSize: 12 }}>Save</button>
              </form>
            )}
          </div>
        )}
        <p style={{ fontSize: 12, color: '#777', marginTop: 20 }}>Profiles personalize who's watching but currently share the same watchlist, history, and ratings as your account.</p>
      </div>
    </div>
  )
}
