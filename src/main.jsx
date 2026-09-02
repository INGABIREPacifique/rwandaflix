import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './App.css'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import RwandaFlixBackendBridge from './components/RwandaFlixBackendBridge.jsx'

export function Root() {
  return (
    <AppErrorBoundary>
      <RwandaFlixBackendBridge />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode><Root /></StrictMode>
)
