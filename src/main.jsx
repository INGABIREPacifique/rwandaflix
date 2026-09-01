import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive.css'
import App from './App.jsx'
import { getSession } from './lib/platform'
import { isSupabaseConfigured } from './lib/supabase'

function BackendStatus() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) {
      setStatus('missing-env')
      return undefined
    }
    getSession()
      .then(() => active && setStatus('connected'))
      .catch(() => active && setStatus('error'))
    return () => { active = false }
  }, [])

  if (status === 'checking' || status === 'connected') return null
  return (
    <div style={{ position: 'fixed', bottom: 16, left: 16, zIndex: 9999, maxWidth: 420, padding: '12px 14px', borderRadius: 10, background: '#151515', color: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,.35)', fontSize: 13 }}>
      {status === 'missing-env'
        ? 'RwandaFlix backend is not configured locally. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.'
        : 'RwandaFlix could not connect to Supabase. Check your .env.local values and Supabase project URL.'}
    </div>
  )
}

function Root() {
  return <><App /><BackendStatus /></>
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
