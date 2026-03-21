import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import InvoiceApp from "./pages/InvoiceApp.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Settings from './pages/Settings.jsx';
import { getSession } from './lib/db';

function ProtectedRoute({ children }) {
  const [authState, setAuthState] = useState('loading') // 'loading' | 'auth' | 'unauth'

  useEffect(() => {
    getSession().then((val) => {
      setAuthState(val === 'true' ? 'auth' : 'unauth')
    }).catch(() => {
      // Fall back to localStorage for first-run before IndexedDB is seeded
      const fallback = localStorage.getItem('invoicekit_auth')
      setAuthState(fallback === 'true' ? 'auth' : 'unauth')
    })
  }, [])

  if (authState === 'loading') {
    // Return a minimal spinner — reuse existing design tokens
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--color-background)',
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid var(--color-primary)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    )
  }

  if (authState === 'unauth') {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/app" element={<ProtectedRoute><InvoiceApp /></ProtectedRoute>} />
      <Route path="/app/:id" element={<ProtectedRoute><InvoiceApp /></ProtectedRoute>} />
    </Routes>
  );
}
