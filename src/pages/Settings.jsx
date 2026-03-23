import { useState } from 'react'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Settings as SettingsIcon, Eye, EyeOff, ExternalLink, Check, LogOut, Plus } from 'lucide-react'
import { clearSession } from '../lib/db'
import { AI_PROVIDERS, loadSettings, saveSettings } from '../lib/settings'
import '../styles/settings.css'

export default function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(loadSettings)
  const [showKeys, setShowKeys] = useState({})
  const [saved, setSaved] = useState(false)
  const location = useLocation()

  const activeProvider = AI_PROVIDERS.find(p => p.id === settings.providerId) || AI_PROVIDERS[0]

  function handleProviderChange(providerId) {
    const provider = AI_PROVIDERS.find(p => p.id === providerId)
    setSettings(prev => ({
      ...prev,
      providerId,
      modelId: provider.models[0].id,
    }))
  }

  function handleModelChange(modelId) {
    setSettings(prev => ({ ...prev, modelId }))
  }

  function handleKeyChange(providerId, value) {
    setSettings(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [providerId]: value },
    }))
  }

  function handleSave() {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    await clearSession()
    localStorage.removeItem('invoicekit_auth')
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#0F1117' }}>

      {/* ── Sidebar — desktop only ── */}
      <aside className="dash-sidebar" style={{
        position: 'fixed',
        left: 0, top: 0,
        width: 200,
        height: '100vh',
        background: '#191b22',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        zIndex: 40,
      }}>
        <div style={{
          padding: '20px 16px 8px',
          fontSize: 10, fontWeight: 700,
          fontFamily: "'Manrope', sans-serif",
          letterSpacing: '0.12em',
          color: '#6B7280',
          textTransform: 'uppercase',
        }}>Navigation</div>

        {[
          { label: 'Invoices', icon: <LayoutDashboard size={16} />, path: '/dashboard' },
          { label: 'Clients',  icon: <Users size={16} />,          path: '/clients'   },
          { label: 'Settings', icon: <SettingsIcon size={16} />,   path: '/settings'  },
        ].map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 14px', margin: '2px 8px',
              borderRadius: 8, border: 'none',
              background: location.pathname === item.path
                ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: location.pathname === item.path
                ? '#c0c1ff' : '#6B7280',
              fontFamily: "'Manrope', sans-serif",
              fontSize: 13, fontWeight: 500,
              cursor: 'pointer', textAlign: 'left',
              width: 'calc(100% - 16px)',
              borderRight: location.pathname === item.path
                ? '2px solid #6366F1' : '2px solid transparent',
              transition: 'all 150ms ease',
            }}
          >
            {item.icon} {item.label}
          </button>
        ))}

        {/* Logout at bottom of sidebar */}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '12px 8px 20px' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 14px',
              borderRadius: 8, border: 'none',
              background: 'transparent',
              color: '#ffb4ab',
              fontFamily: "'Manrope', sans-serif",
              fontSize: 13, fontWeight: 500,
              cursor: 'pointer', textAlign: 'left',
              width: '100%',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,180,171,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dash-main" style={{ marginLeft: 200, minHeight: '100dvh', paddingBottom: 80 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>

          {/* Profile card */}
          <div style={{
            background: '#191b22',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: '24px 24px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48,
                borderRadius: 12,
                background: 'linear-gradient(145deg, #c0c1ff 0%, #8083ff 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Manrope', sans-serif",
                fontSize: 18, fontWeight: 800,
                color: '#0d0096',
                flexShrink: 0, // ADDED: prevents squishing
              }}>
                A
              </div>
              <div>
                <div style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 15, fontWeight: 700,
                  color: '#ffffff', marginBottom: 2,
                }}>Admin</div>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12, color: '#6B7280',
                }}>Local account</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                height: 34, padding: '0 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,180,171,0.25)',
                background: 'rgba(255,180,171,0.08)',
                color: '#ffb4ab',
                fontFamily: "'Manrope', sans-serif",
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 150ms ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,180,171,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,180,171,0.08)'}
            >
              <LogOut size={13} /> Logout
            </button>
          </div>

          {/* AI settings card */}
          <div style={{
            background: '#191b22',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <h2 style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 15, fontWeight: 700,
                color: '#ffffff', margin: 0, marginBottom: 4,
              }}>AI Line-Item Generation</h2>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12, color: '#6B7280', margin: 0,
              }}>API keys are stored only in your browser — never sent to any server.</p>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Provider pills */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Manrope', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 8 }}>Provider</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {AI_PROVIDERS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleProviderChange(p.id)}
                      style={{
                        padding: '9px 14px',
                        borderRadius: 8,
                        border: `1px solid ${settings.providerId === p.id ? '#6366F1' : '#2A2D3A'}`,
                        background: settings.providerId === p.id ? 'rgba(99,102,241,0.12)' : '#1E2130',
                        color: settings.providerId === p.id ? '#c0c1ff' : '#6B7280',
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'all 150ms ease',
                      }}
                    >{p.name}</button>
                  ))}
                </div>
              </div>

              {/* Model */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Manrope', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 8 }}>Model</div>
                <select
                  value={settings.modelId}
                  onChange={e => handleModelChange(e.target.value)}
                  style={{
                    width: '100%', height: 38,
                    background: '#1E2130',
                    border: '1px solid #2A2D3A',
                    borderRadius: 8, padding: '0 12px',
                    color: '#e2e2eb', fontSize: 13,
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none', cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  {activeProvider.models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* API keys */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Manrope', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 8 }}>API Keys</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {AI_PROVIDERS.map(p => (
                    <div
                      key={p.id}
                      style={{
                        background: '#1E2130',
                        border: `1px solid ${settings.providerId === p.id ? '#6366F1' : '#2A2D3A'}`,
                        borderRadius: 10,
                        padding: '12px 14px',
                        transition: 'border-color 150ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          flex: 1,
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: 12, fontWeight: 600,
                          color: settings.providerId === p.id ? '#fff' : '#6B7280',
                        }}>{p.name}</span>
                        {settings.providerId === p.id && (
                          <span style={{
                            fontSize: 9, fontWeight: 700,
                            color: '#6366F1',
                            background: 'rgba(99,102,241,0.12)',
                            padding: '2px 8px', borderRadius: 999,
                            fontFamily: "'Manrope', sans-serif",
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                          }}>Active</span>
                        )}
                        <a
                          href={p.apiKeyUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            fontSize: 11, color: '#6B7280', textDecoration: 'none',
                          }}
                        >
                          Get key <ExternalLink size={10} />
                        </a>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type={showKeys[p.id] ? 'text' : 'password'}
                          placeholder={p.apiKeyPlaceholder}
                          value={settings.apiKeys?.[p.id] || ''}
                          onChange={e => handleKeyChange(p.id, e.target.value)}
                          autoComplete="off"
                          spellCheck={false}
                          style={{
                            flex: 1, height: 36,
                            background: '#0c0e14',
                            border: '1px solid #2A2D3A',
                            borderRadius: 7, padding: '0 10px',
                            color: '#e2e2eb',
                            fontFamily: 'ui-monospace, monospace',
                            fontSize: 12, outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <button
                          onClick={() => setShowKeys(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                          style={{
                            width: 36, height: 36, flexShrink: 0,
                            background: '#282a30',
                            border: '1px solid #2A2D3A',
                            borderRadius: 7, cursor: 'pointer',
                            color: '#6B7280',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'color 150ms ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#e2e2eb'}
                          onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
                        >
                          {showKeys[p.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  onClick={handleSave}
                  style={{
                    height: 34, padding: '0 20px',
                    borderRadius: 8, border: 'none',
                    background: saved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(145deg, #c0c1ff 0%, #8083ff 100%)',
                    color: saved ? '#10B981' : '#0d0096',
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 200ms ease',
                    border: saved ? '1px solid rgba(16,185,129,0.3)' : 'none',
                  }}
                >
                  {saved ? <><Check size={13} /> Saved</> : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '8px 0',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        background: 'rgba(17,19,25,0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }} className="mobile-only">
        {[
          { label: 'Invoices', icon: <LayoutDashboard size={19} />, path: '/dashboard' },
          { label: 'Clients',  icon: <Users size={19} />,           path: '/clients'   },
          { label: 'New',      icon: <Plus size={19} />,            path: '/app'       },
          { label: 'Settings', icon: <SettingsIcon size={19} />,    path: '/settings'  },
        ].map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 12px', border: 'none', background: 'transparent',
              color: location.pathname === item.path ? '#c0c1ff' : '#6B7280',
              fontFamily: "'Manrope', sans-serif",
              fontSize: 9, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'color 150ms ease',
            }}
          >
            {item.icon}<span>{item.label}</span>
          </button>
        ))}
        {/* Logout in mobile bottom area — below the nav */}
      </nav>

      {/* Mobile logout — floating above bottom nav */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(60px + env(safe-area-inset-bottom))',
        left: 0, right: 0,
        padding: '0 24px 12px',
        zIndex: 49,
      }} className="mobile-only">
        <button
          onClick={handleLogout}
          style={{
            width: '100%', height: 44,
            borderRadius: 10,
            border: '1px solid rgba(255,180,171,0.2)',
            background: 'rgba(255,180,171,0.06)',
            color: '#ffb4ab',
            fontFamily: "'Manrope', sans-serif",
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            backdropFilter: 'blur(10px)',
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

    </div>
  )
}
