import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart2, Settings, Plus, Receipt, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getAllInvoicesLocal, clearSession } from '../lib/db'

export default function Dashboard() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

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
  <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>

    {/* Mobile-only Topbar */}
    <header className="ik-topbar ik-topbar-mobile-only">
      <div className="ik-topbar-brand">
        <div className="ik-topbar-logo">
          <Receipt size={14} />
        </div>
        <span className="ik-topbar-name">InvoiceKit</span>
      </div>
    </header>

    {/* Sidebar */}
    <aside className="ik-sidebar">
      {/* Sidebar Brand (Desktop) */}
      <div className="ik-sidebar-brand">
        <div className="ik-topbar-logo">
          <Receipt size={14} />
        </div>
        <span className="ik-topbar-name">InvoiceKit</span>
      </div>

      <div className="ik-sidebar-section-label">Navigation</div>
      <button className="ik-nav-item active" onClick={() => navigate('/dashboard')}>
        <LayoutDashboard size={18} /> Invoices
      </button>
      <button className="ik-nav-item" onClick={() => navigate('/clients')}>
        <Users size={18} /> Clients
      </button>
      <button className="ik-nav-item" onClick={() => navigate('/settings')}>
        <Settings size={18} /> Settings
      </button>
    </aside>

    {/* Offline banner */}
    {!isOnline && (
      <div className="offline-banner">
        Offline — showing locally cached invoices. Changes will sync when reconnected.
      </div>
    )}

    {/* Main content */}
    <main className="ik-page-content">
      <div className="animate-enter ik-page-inner">

        {/* Page header */}
        <div className="ik-page-header">
          <div>
            <h1 className="ik-page-title" style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.02em',
              margin: 0,
              marginBottom: 6,
            }}>Dashboard</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
              Manage your billing and track payments.
            </p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/app')}>
            <Plus size={15} /> New Invoice
          </button>
        </div>

        {/* Invoice list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div className="ik-spinner" />
          </div>
        ) : invoices.length === 0 ? (
          <div style={{
            textAlign: 'center',
            paddingTop: 80,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-heading)',
          }}>
            <Receipt size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontSize: 16, fontWeight: 600 }}>No invoices yet</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Create your first invoice to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 180px 120px 100px',
              padding: '0 20px',
              marginBottom: 4,
            }}>
              {['Invoice', 'Client', 'Amount', 'Date'].map(h => (
                <span key={h} style={{
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}>{h}</span>
              ))}
            </div>
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="card"
                onClick={() => navigate(`/app/${inv.id}`)}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'grid',
                  gridTemplateColumns: '1fr 180px 120px 100px',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'var(--color-surface-high)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    flexShrink: 0,
                  }}>
                    <Receipt size={16} />
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    color: '#fff',
                    letterSpacing: '-0.01em',
                  }}>
                    #{inv.invoice_number}
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>
                  {inv.client_name || '—'}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency || 'USD' }).format(inv.total_amount || 0)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </span>
                  <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>

    {/* Mobile bottom nav */}
    <nav className="ik-bottom-nav">
      <button className="ik-bottom-nav-item active" onClick={() => navigate('/dashboard')}>
        <LayoutDashboard size={20} /><span>Invoices</span>
      </button>
      <button className="ik-bottom-nav-item" onClick={() => navigate('/clients')}>
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
  );
}
