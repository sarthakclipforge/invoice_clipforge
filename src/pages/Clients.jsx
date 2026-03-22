import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart2, Settings, Plus, Receipt, Search, X, Trash2, ChevronRight } from 'lucide-react'
import { getAllClientsLocal, deleteClient, upsertClientToSupabase, saveClientLocally } from '../lib/clients'
import { supabase } from '../lib/supabaseClient'

export default function Clients() {
  const navigate = useNavigate()
  const location = useLocation()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    shipAddress: ''
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function loadClients() {
    setLoading(true)
    try {
      // Load local clients
      const local = await getAllClientsLocal()
      setClients(local)
      
      // If online, sync from Supabase
      if (navigator.onLine) {
        const { data, error } = await supabase.from('clients').select('*').order('name')
        if (!error && data) {
          // Update local with remote data
          for (let row of data) {
            await saveClientLocally({
              id: row.id, // For dexie we can use a generated id or supabase id, wait, in db.js id is auto-increment for clients? No, let's just dump the list.
              supabaseId: row.id,
              name: row.name,
              email: row.email,
              address: row.address,
              shipAddress: row.ship_address,
              updatedAt: row.updated_at
            })
          }
          // Reload from local to get updated IDs if any
          const freshLocal = await getAllClientsLocal()
          setClients(freshLocal)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    loadClients()
    return () => cancelled = true
  }, [])

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCreateClient = async () => {
    if (!formData.name.trim()) return
    setIsSaving(true)
    try {
      // Insert locally first
      const newLocalClient = {
        name: formData.name,
        email: formData.email,
        address: formData.address,
        shipAddress: formData.shipAddress,
        updatedAt: new Date().toISOString()
      }
      const localId = await saveClientLocally(newLocalClient)
      newLocalClient.id = localId

      if (navigator.onLine) {
        const { data, error } = await upsertClientToSupabase(newLocalClient)
        if (!error && data) {
          newLocalClient.supabaseId = data.id
          await saveClientLocally(newLocalClient)
        }
      }
      setIsModalOpen(false)
      setFormData({ name: '', email: '', address: '', shipAddress: '' })
      loadClients()
    } catch (err) {
      console.error(err)
      alert("Failed to save client")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (client) => {
    if (!confirm(`Are you sure you want to delete ${client.name}?`)) return
    try {
      await deleteClient(client.supabaseId, client.id)
      loadClients()
    } catch (err) {
      console.error(err)
      alert("Failed to delete client")
    }
  }

  return (
  <div style={{ minHeight: '100dvh', background: '#0F1117' }}>

    {/* ── Topbar ── */}
    <header style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 56,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      background: '#111319',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26,
          borderRadius: 6,
          background: 'linear-gradient(145deg, #c0c1ff 0%, #8083ff 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Receipt size={13} color="#0d0096" />
        </div>
        <span style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 16, fontWeight: 700,
          color: '#ffffff', letterSpacing: '-0.02em',
        }}>InvoiceKit</span>
      </div>
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          height: 34, padding: '0 14px',
          borderRadius: 10, border: 'none',
          background: 'linear-gradient(145deg, #c0c1ff 0%, #8083ff 100%)',
          color: '#0d0096',
          fontFamily: "'Manrope', sans-serif",
          fontSize: 12, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <Plus size={13} /> New Client
      </button>
    </header>

    {/* ── Sidebar ── */}
    <aside style={{
      position: 'fixed',
      left: 0, top: 56,
      width: 200,
      height: 'calc(100vh - 56px)',
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
        { label: 'Settings', icon: <Settings size={16} />,       path: '/settings'  },
      ].map(item => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 14px',
            margin: '2px 8px',
            borderRadius: 8,
            border: 'none',
            background: location.pathname === item.path
              ? 'rgba(99,102,241,0.12)' : 'transparent',
            color: location.pathname === item.path
              ? '#c0c1ff' : '#6B7280',
            fontFamily: "'Manrope', sans-serif",
            fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            width: 'calc(100% - 16px)',
            borderRight: location.pathname === item.path
              ? '2px solid #6366F1' : '2px solid transparent',
            transition: 'all 150ms ease',
          }}
        >
          {item.icon} {item.label}
        </button>
      ))}
    </aside>

    {/* ── Main content ── */}
    <main style={{
      marginLeft: 200,
      paddingTop: 56,
      minHeight: '100dvh',
      paddingBottom: 40,
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px' }}>

        {/* Page header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32,
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 28, fontWeight: 800,
              color: '#ffffff', letterSpacing: '-0.02em',
              margin: 0, marginBottom: 4,
            }}>Clients</h1>
            <p style={{
              color: '#6B7280', fontSize: 13, margin: 0,
              fontFamily: "'Inter', sans-serif",
            }}>
              {clients.length} client{clients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{
                position: 'absolute', left: 10,
                top: '50%', transform: 'translateY(-50%)',
                color: '#6B7280', pointerEvents: 'none',
              }} />
              <input
                placeholder="Search clients…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  height: 34,
                  paddingLeft: 30, paddingRight: 12,
                  background: '#1E2130',
                  border: '1px solid #2A2D3A',
                  borderRadius: 8,
                  color: '#e2e2eb',
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  outline: 'none',
                  width: 200,
                }}
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                height: 34, padding: '0 14px',
                borderRadius: 10, border: 'none',
                background: 'linear-gradient(145deg, #c0c1ff 0%, #8083ff 100%)',
                color: '#0d0096',
                fontFamily: "'Manrope', sans-serif",
                fontSize: 12, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Plus size={13} /> New Client
            </button>
          </div>
        </div>

        {/* Client list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div style={{
              width: 28, height: 28,
              border: '2px solid rgba(99,102,241,0.2)',
              borderTopColor: '#6366F1',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        ) : filteredClients.length === 0 ? (
          <div style={{
            textAlign: 'center', paddingTop: 80,
            color: '#6B7280',
            fontFamily: "'Manrope', sans-serif",
          }}>
            <Users size={36} style={{ marginBottom: 14, opacity: 0.25 }} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 6 }}>
              {searchTerm ? 'No clients found' : 'No clients yet'}
            </p>
            <p style={{ fontSize: 13, margin: 0 }}>
              {searchTerm ? 'Try a different search.' : 'Add your first client to get started.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredClients.map(client => (
              <div
                key={client.id || client.name}
                onClick={() => navigate('/app', { state: { prefillClient: client } })}
                style={{
                  background: '#1A1D27',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 12,
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease, transform 150ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  width: 40, height: 40, flexShrink: 0,
                  borderRadius: 10,
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 700, fontSize: 14,
                  color: '#c0c1ff',
                }}>
                  {client.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 700, fontSize: 14,
                    color: '#ffffff', marginBottom: 2,
                  }}>{client.name}</div>
                  {client.email && (
                    <div style={{
                      fontSize: 12, color: '#6B7280',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontFamily: "'Inter', sans-serif",
                    }}>{client.email}</div>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(client) }}
                  style={{
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: '#6B7280',
                    padding: 6, borderRadius: 6,
                    display: 'flex', flexShrink: 0,
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ffb4ab'}
                  onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
                >
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={15} color="#464554" style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>

    {/* ── Mobile bottom nav ── */}
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 50,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 0',
      paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      background: 'rgba(17,19,25,0.9)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }} className="mobile-only">
      {[
        { label: 'Invoices', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { label: 'Clients',  icon: <Users size={20} />,           path: '/clients'   },
        { label: 'New',      icon: <Plus size={20} />,            path: '/app'       },
        { label: 'Settings', icon: <Settings size={20} />,        path: '/settings'  },
      ].map(item => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3,
            padding: '4px 16px',
            border: 'none', background: 'transparent',
            color: location.pathname === item.path ? '#c0c1ff' : '#6B7280',
            fontFamily: "'Manrope', sans-serif",
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'color 150ms ease',
          }}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>

    {/* ── Add Client Modal ── */}
    {isModalOpen && (
      <div
        onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{
          background: '#191b22',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: 32,
          width: '100%', maxWidth: 460,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 24,
          }}>
            <h2 style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 18, fontWeight: 700,
              color: '#ffffff', margin: 0,
            }}>New Client</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer', color: '#6B7280',
                display: 'flex', padding: 4,
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Name *', key: 'name', placeholder: 'Client or company name', type: 'text' },
              { label: 'Email',  key: 'email', placeholder: 'billing@client.com',    type: 'email' },
            ].map(f => (
              <div key={f.key}>
                <label style={{
                  display: 'block', fontSize: 10, fontWeight: 700,
                  fontFamily: "'Manrope', sans-serif",
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#6B7280', marginBottom: 6,
                }}>{f.label}</label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={formData[f.key]}
                  onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{
                    width: '100%', height: 38,
                    background: '#1E2130',
                    border: '1px solid #2A2D3A',
                    borderRadius: 8, padding: '0 12px',
                    color: '#e2e2eb', fontSize: 13,
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
            {[
              { label: 'Billing Address', key: 'address',     placeholder: 'Street, City, ZIP, Country' },
              { label: 'Ship To',         key: 'shipAddress', placeholder: 'Leave blank to use billing address' },
            ].map(f => (
              <div key={f.key}>
                <label style={{
                  display: 'block', fontSize: 10, fontWeight: 700,
                  fontFamily: "'Manrope', sans-serif",
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#6B7280', marginBottom: 6,
                }}>{f.label}</label>
                <textarea
                  rows={3}
                  placeholder={f.placeholder}
                  value={formData[f.key]}
                  onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#1E2130',
                    border: '1px solid #2A2D3A',
                    borderRadius: 8, padding: '8px 12px',
                    color: '#e2e2eb', fontSize: 13,
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none', resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex', gap: 10, justifyContent: 'flex-end',
            marginTop: 24,
          }}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                height: 34, padding: '0 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent', color: '#e2e2eb',
                fontFamily: "'Manrope', sans-serif",
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
              }}
            >Cancel</button>
            <button
              onClick={handleCreateClient}
              disabled={isSaving || !formData.name.trim()}
              style={{
                height: 34, padding: '0 16px',
                borderRadius: 10, border: 'none',
                background: 'linear-gradient(145deg, #c0c1ff 0%, #8083ff 100%)',
                color: '#0d0096',
                fontFamily: "'Manrope', sans-serif",
                fontSize: 12, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: isSaving || !formData.name.trim() ? 'not-allowed' : 'pointer',
                opacity: isSaving || !formData.name.trim() ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {isSaving ? 'Saving…' : 'Add Client'}
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
  )
}
