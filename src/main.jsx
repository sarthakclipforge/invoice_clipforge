import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/global.css'
import { pushPendingToSupabase, pullFromSupabase } from './lib/sync'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// Sync on app boot if online
if (navigator.onLine) {
  pushPendingToSupabase()
    .then(() => pullFromSupabase())
    .catch(() => {
      // Silently fail — app works offline without sync
    })
}

// Sync whenever connectivity is restored
window.addEventListener('online', () => {
  pushPendingToSupabase()
    .then(() => pullFromSupabase())
    .catch(() => {})
})
