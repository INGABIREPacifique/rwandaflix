import { useEffect, useState } from 'react'
import { Check, X, Film } from 'lucide-react'
import { isAdmin, getAllSubmissionsForReview, approveSubmission, rejectSubmission } from '../lib/platform'

export default function AdminReview({ user }) {
  const [allowed, setAllowed] = useState(null)
  const [submissions, setSubmissions] = useState([])
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
        return getAllSubmissionsForReview().then((rows) => live && setSubmissions(rows))
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
    } catch (e) {
      setError(e.message)
    }
    setActionBusyId(null)
  }

  const handleReject = async (submission) => {
    const reason = window.prompt(`Reason for rejecting "${submission.title}" (optional):`) || ''
    setActionBusyId(submission.id)
    setError('')
    try {
      await rejectSubmission(submission, reason)
      setSubmissions((subs) => subs.map((s) => (s.id === submission.id ? { ...s, status: 'rejected' } : s)))
    } catch (e) {
      setError(e.message)
    }
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
      <div className="page-heading"><div><div className="eyebrow">RwandaFlix Admin</div><h1>Submission Review</h1><p>Approve a submission to publish it live to the catalog immediately, or reject it with a reason.</p></div><div className="library-count">{pending.length}<span> pending</span></div></div>
      {error && <p className="form-error">{error}</p>}

      <section className="section">
        <div className="section-header"><h2>Pending review</h2></div>
        {pending.length ? (
          <div className="wide-row wide-row-stacked">
            {pending.map((s) => (
              <div className="wide-card" key={s.id} style={{ cursor: 'default' }}>
                <div className="wide-content">
                  <strong>{s.title}</strong>
                  <span>By {s.creator_profiles?.display_name || 'Unknown creator'} · {s.genre || 'No genre'}</span>
                </div>
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
                <div className="wide-content">
                  <strong>{s.title}</strong>
                  <span>{s.status === 'approved' ? '✅ Approved' : '❌ Rejected'} · By {s.creator_profiles?.display_name || 'Unknown creator'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
