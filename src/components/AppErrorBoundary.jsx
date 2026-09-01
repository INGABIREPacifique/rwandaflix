import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error) {
    console.error('RwandaFlix UI error:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#070707', color: '#fff', textAlign: 'center', fontFamily: 'system-ui' }}>
        <section style={{ maxWidth: 520 }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>🇷🇼</div>
          <h1>RwandaFlix needs a refresh</h1>
          <p style={{ color: '#aaa', lineHeight: 1.6 }}>Something unexpected happened while loading this page. Your account and saved data are safe.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '11px 20px', border: 0, borderRadius: 7, fontWeight: 700, cursor: 'pointer' }}>Refresh RwandaFlix</button>
          {import.meta.env.DEV && this.state.error && <pre style={{ marginTop: 20, padding: 12, textAlign: 'left', overflow: 'auto', color: '#f99', background: '#111', borderRadius: 8 }}>{this.state.error.message}</pre>}
        </section>
      </main>
    )
  }
}
