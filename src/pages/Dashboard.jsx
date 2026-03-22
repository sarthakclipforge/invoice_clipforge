import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart2, Settings, Plus, Receipt, ChevronRight, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getAllInvoicesLocal, clearSession } from '../lib/db'

export default function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    async function handleDeleteInvoice(e, id) {
      e.stopPropagation() // prevent navigating to the invoice
      if (!window.confirm('Delete this invoice? This cannot be undone.')) return
      try {
        await supabase.from('invoices').delete().eq('id', id)
        setInvoices(prev => prev.filter(inv => inv.id !== id))
      } catch (err) {
        console.error('Delete failed:', err)
      }
    }

    useEffect(() => {
        const goOnline = () => setIsOnline(true)
        const goOffline = () => setIsOnline(false)
        window.addEventListener('online', goOnline)
        window.addEventListener('offline', goOffline)
        return () => {
            window.removeEventListener('online', goOnline)
            window.removeEventListener('offline', goOffline)
        }
    }, [])

    useEffect(() => {
        let cancelled = false;

        async function loadInvoices() {
            setLoading(true);

            // Step 1 — try IndexedDB first (instant, works offline)
            try {
                const local = await getAllInvoicesLocal();
                if (!cancelled && local.length > 0) {
                    setInvoices(local.map(inv => ({
                        id: inv.supabaseId,
                        invoice_number: inv.invoiceNumber,
                        client_name: inv.clientName,
                        total_amount: inv.totalAmount,
                        currency: inv.currency,
                        created_at: inv.updatedAt,
                        updated_at: inv.updatedAt,
                    })));
                    setLoading(false);
                }
            } catch {
                // IndexedDB unavailable — continue to Supabase
            }

            // Step 2 — always attempt Supabase if online, regardless of local results
            if (navigator.onLine) {
                try {
                    const { data, error } = await supabase
                        .from('invoices')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (!cancelled) {
                        if (!error && data) {
                            setInvoices(data);
                        }
                        // Always stop loading here — Supabase is the source of truth when online
                        setLoading(false);
                    }
                } catch {
                    if (!cancelled) setLoading(false);
                }
            } else {
                // Offline and IndexedDB was empty
                if (!cancelled) setLoading(false);
            }
        }

        loadInvoices();
        return () => { cancelled = true; };
    }, []);

    const handleLogout = async () => {
        await clearSession();
        localStorage.removeItem('invoicekit_auth');
        navigate('/');
    };

    return (
  <div style={{ minHeight: '100dvh', background: '#0F1117' }}>



    {/* ── Sidebar ── */}
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

    {/* ── Offline banner ── */}
    {!isOnline && (
      <div style={{
        position: 'fixed', top: 56, left: 200, right: 0, zIndex: 39,
        background: 'rgba(249,115,22,0.12)',
        borderBottom: '1px solid rgba(249,115,22,0.25)',
        padding: '6px 24px',
        fontSize: 12, color: '#ffb783',
        textAlign: 'center',
        fontFamily: "'Inter', sans-serif",
      }}>
        Offline — showing locally cached invoices. Changes will sync when reconnected.
      </div>
    )}

    {/* ── Main content ── */}
    <main className="dash-main" style={{
      marginLeft: 200,
      paddingTop: 0,
      minHeight: '100dvh',
      paddingBottom: 40,
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px' }}>

        {/* Page header row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 36,
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 28, fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              margin: 0, marginBottom: 4,
            }}>Dashboard</h1>
            <p style={{
              color: '#6B7280', fontSize: 13,
              margin: 0, fontFamily: "'Inter', sans-serif",
            }}>Manage your billing and track payments.</p>
          </div>
          <button
            onClick={() => navigate('/app')}
            style={{
              height: 36, padding: '0 16px',
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
            <Plus size={14} />
            <span className="dash-new-label">New Invoice</span>
          </button>
        </div>

        {/* Invoice list */}
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
        ) : invoices.length === 0 ? (
          <div style={{
            textAlign: 'center', paddingTop: 80,
            color: '#6B7280',
            fontFamily: "'Manrope', sans-serif",
          }}>
            <Receipt size={36} style={{ marginBottom: 14, opacity: 0.25 }} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 6 }}>No invoices yet</p>
            <p style={{ fontSize: 13, margin: 0 }}>Create your first invoice to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {invoices.map(inv => (
              <div
                key={inv.id}
                onClick={() => navigate(`/app/${inv.id}`)}
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
                  width: 36, height: 36, flexShrink: 0,
                  borderRadius: 8,
                  background: '#282a30',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Receipt size={16} color="#c0c1ff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 13, color: '#ffffff',
                    marginBottom: 2,
                  }}>#{inv.invoice_number}</div>
                  <div style={{
                    fontSize: 12, color: '#6B7280',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontFamily: "'Inter', sans-serif",
                  }}>{inv.client_name || '—'}</div>
                </div>
                <div style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 15, fontWeight: 700, color: '#ffffff',
                  flexShrink: 0,
                }}>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: inv.currency || 'USD',
                  }).format(inv.total_amount || 0)}
                </div>
                <div style={{
                  fontSize: 11, color: '#6B7280', flexShrink: 0,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {inv.created_at
                    ? new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '—'}
                </div>
                
                {/* Delete button */}
                <button
                  onClick={e => handleDeleteInvoice(e, inv.id)}
                  style={{
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: '#6B7280',
                    padding: 6, borderRadius: 6,
                    display: 'flex', flexShrink: 0,
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ffb4ab'}
                  onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
                  title="Delete invoice"
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

  </div>
)
}
