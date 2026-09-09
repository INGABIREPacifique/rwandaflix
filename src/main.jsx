import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './App.css'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import RwandaFlixBackendBridge from './components/RwandaFlixBackendBridge.jsx'
import RwandaFlixProvider from './components/RwandaFlixProvider.jsx'

export function Root() {
  return (
    <AppErrorBoundary>
      <RwandaFlixProvider>
        <RwandaFlixBackendBridge />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </RwandaFlixProvider>
    </AppErrorBoundary>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode><Root /></StrictMode>
)
