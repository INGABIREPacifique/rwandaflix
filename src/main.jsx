import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './responsive.css'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {createElement(AppErrorBoundary, null, createElement(App))}
  </StrictMode>
)
