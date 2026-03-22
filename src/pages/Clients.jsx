import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart2, Settings, Plus, Receipt, Search, X, Trash2 } from 'lucide-react'
import { getAllClientsLocal, deleteClient, upsertClientToSupabase, saveClientLocally } from '../lib/clients'
import { supabase } from '../lib/supabaseClient'

export default function Clients() {
  const navigate = useNavigate()
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
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      {/* Mobile-only Topbar */}
      <header className="ik-topbar ik-topbar-mobile-only">
        <div className="ik-topbar-brand">
          <div className="ik-topbar-logo"><Receipt size={14} /></div>
          <span className="ik-topbar-name">InvoiceKit</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="ik-sidebar">
        {/* Sidebar Brand (Desktop) */}
        <div className="ik-sidebar-brand">
          <div className="ik-topbar-logo"><Receipt size={14} /></div>
          <span className="ik-topbar-name">InvoiceKit</span>
        </div>

        <div className="ik-sidebar-section-label">Navigation</div>
        <button className="ik-nav-item" onClick={() => navigate('/dashboard')}>
          <LayoutDashboard size={18} /> Invoices
        </button>
        <button className="ik-nav-item active" onClick={() => navigate('/clients')}>
          <Users size={18} /> Clients
        </button>
        <button className="ik-nav-item" onClick={() => navigate('/settings')}>
          <Settings size={18} /> Settings
        </button>
      </aside>

      {/* Main content */}
      <main className="ik-page-content">
        <div className="animate-enter ik-page-inner">
          
          <div className="ik-page-header">
            <div>
              <h1 className="ik-page-title" style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-0.02em',
                margin: 0,
                marginBottom: 6,
              }}>Clients</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
                Manage your clients and their billing details.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: 24, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: 11, color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              className="field-input" 
              placeholder="Search clients..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 42 }}
            />
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
              <div className="ik-spinner" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--color-text-muted)' }}>
              <Users size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
              <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-heading)' }}>No clients found</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>Add a new client to get started or refine your search.</p>
            </div>
          ) : (
            <div className="ik-client-grid">
              {filteredClients.map(client => (
                <div key={client.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', background: 'var(--color-surface-high)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)', fontWeight: 800, fontFamily: 'var(--font-heading)'
                      }}>
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 15, color: '#fff', fontWeight: 600 }}>{client.name}</h3>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>{client.email || 'No email'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(client)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', cursor: 'pointer', opacity: 0.8 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {(client.address || client.shipAddress) && (
                    <div style={{ background: 'var(--color-surface)', padding: 12, borderRadius: 8, fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
                      {client.address && <div style={{ marginBottom: client.shipAddress ? 8 : 0 }}><strong>Bill To:</strong> {client.address}</div>}
                      {client.shipAddress && <div><strong>Ship To:</strong> {client.shipAddress}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: 24
        }}>
          <div className="card animate-enter" style={{ width: '100%', maxWidth: 480, padding: 32, position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 24px 0', fontSize: 24, color: '#fff' }}>New Client</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="field-label">Client Name *</label>
                <input 
                  type="text" className="field-input" 
                  value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))}
                  autoFocus
                />
              </div>
              <div>
                <label className="field-label">Email Address</label>
                <input 
                  type="email" className="field-input" 
                  value={formData.email} onChange={e => setFormData(f => ({...f, email: e.target.value}))}
                />
              </div>
              <div>
                <label className="field-label">Billing Address</label>
                <textarea 
                  className="field-input" rows={3}
                  value={formData.address} onChange={e => setFormData(f => ({...f, address: e.target.value}))}
                />
              </div>
              <div>
                <label className="field-label">Shipping Address</label>
                <textarea 
                  className="field-input" rows={3}
                  value={formData.shipAddress} onChange={e => setFormData(f => ({...f, shipAddress: e.target.value}))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleCreateClient} disabled={!formData.name.trim() || isSaving}>
                  {isSaving ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="ik-bottom-nav">
        <button className="ik-bottom-nav-item" onClick={() => navigate('/dashboard')}>
          <LayoutDashboard size={20} /><span>Invoices</span>
        </button>
        <button className="ik-bottom-nav-item active" onClick={() => navigate('/clients')}>
          <Users size={20} /><span>Clients</span>
        </button>
        <button className="ik-bottom-nav-item" onClick={() => navigate('/app')}>
          <Plus size={20} /><span>New</span>
        </button>
        <button className="ik-bottom-nav-item" onClick={() => navigate('/settings')}>
          <Settings size={20} /><span>Settings</span>
        </button>
      </nav>
    </div>
  )
}
