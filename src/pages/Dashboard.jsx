import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart2, Settings, Plus, Receipt, ChevronRight, Trash2, Search, ArrowUpDown, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getAllInvoicesLocal, clearSession, deleteInvoiceBySupabaseId, deleteInvoiceByLocalId, db } from '../lib/db'
import { formatMoney } from '../lib/currency'

export default function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);

    // Search, sort, filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date-desc');  // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'name-asc' | 'name-desc'
    const [showSortMenu, setShowSortMenu] = useState(false);

    async function confirmDelete() {
      if (invoiceToDelete === null || invoiceToDelete === undefined) return
      const inv = invoices.find(v => (v.id || `local-${v.localId}`) === invoiceToDelete)
      try {
        // Delete from Supabase if it has a real ID
        if (inv?.id) {
          try {
            const { error } = await supabase.from('invoices').delete().eq('id', inv.id)
            if (error) console.error('Supabase delete error:', error)
          } catch {
            // Supabase unreachable — still delete locally
          }
        }
        // Delete from IndexedDB
        if (inv?.id) {
          await deleteInvoiceBySupabaseId(inv.id)
        } else if (inv?.localId) {
          await deleteInvoiceByLocalId(inv.localId)
        }
        // Remove from React state
        setInvoices(prev => prev.filter(v => (v.id || `local-${v.localId}`) !== invoiceToDelete))
      } catch (err) {
        console.error('Delete failed:', err)
      } finally {
        setInvoiceToDelete(null)
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

            // Step 1 — load IndexedDB first (instant, works offline)
            let localData = [];
            try {
                localData = await getAllInvoicesLocal();
                if (!cancelled && localData.length > 0) {
                    setInvoices(localData.map(inv => ({
                        id: inv.supabaseId,
                        localId: inv.localId,
                        invoice_number: inv.invoiceNumber,
                        client_name: inv.clientName,
                        total_amount: inv.totalAmount,
                        currency: inv.currency,
                        created_at: inv.updatedAt,
                        updated_at: inv.updatedAt,
                        _synced: inv.synced === 1,
                    })));
                    setLoading(false);
                }
            } catch {
                // IndexedDB unavailable — continue to Supabase
            }

            // Step 2 — fetch from Supabase if online, MERGE with local
            if (navigator.onLine) {
                try {
                    const { data, error } = await supabase
                        .from('invoices')
                        .select('*')
                        .order('created_at', { ascending: false });

                    console.log('[Dashboard Sync]', { data: data?.length, error });

                    if (!cancelled && !error && data) {
                        // Sync Supabase records into IndexedDB so other pages can load them
                        for (const inv of data) {
                            try {
                                const existing = await db.invoices.where('supabaseId').equals(inv.id).first();
                                if (!existing) {
                                    // This invoice exists in Supabase but not locally — pull it in
                                    await db.invoices.put({
                                        supabaseId: inv.id,
                                        invoiceNumber: inv.invoice_number || '',
                                        clientName: inv.client_name || '',
                                        totalAmount: inv.total_amount || 0,
                                        currency: inv.currency || 'USD',
                                        invoice_data: inv.invoice_data || {},
                                        updatedAt: inv.updated_at || inv.created_at,
                                        synced: 1,
                                    });
                                } else {
                                    // Update local record with latest Supabase data
                                    const supaDate = new Date(inv.updated_at || inv.created_at || 0).getTime();
                                    const localDate = new Date(existing.updatedAt || 0).getTime();
                                    if (supaDate > localDate) {
                                        await db.invoices.update(existing.localId, {
                                            invoiceNumber: inv.invoice_number || existing.invoiceNumber,
                                            clientName: inv.client_name || existing.clientName,
                                            totalAmount: inv.total_amount ?? existing.totalAmount,
                                            currency: inv.currency || existing.currency,
                                            invoice_data: inv.invoice_data || existing.invoice_data,
                                            updatedAt: inv.updated_at || inv.created_at,
                                            synced: 1,
                                        });
                                    }
                                }
                            } catch (syncErr) {
                                console.warn('[Dashboard Sync] IndexedDB sync error for', inv.id, syncErr);
                            }
                        }

                        // Push any unsynced local invoices to Supabase
                        try {
                            const pending = localData.filter(l => l.synced === 0 && !l.supabaseId);
                            for (const p of pending) {
                                const { data: inserted, error: insErr } = await supabase
                                    .from('invoices')
                                    .insert({
                                        invoice_number: p.invoiceNumber || '',
                                        client_name: p.clientName || '',
                                        total_amount: p.totalAmount || 0,
                                        currency: p.currency || 'USD',
                                        invoice_data: p.invoice_data || {},
                                        updated_at: p.updatedAt,
                                    })
                                    .select('id')
                                    .single();
                                if (!insErr && inserted?.id) {
                                    await db.invoices.update(p.localId, { synced: 1, supabaseId: inserted.id });
                                    console.log('[Dashboard Sync] Pushed local invoice to Supabase:', inserted.id);
                                }
                            }
                        } catch (pushErr) {
                            console.warn('[Dashboard Sync] Push pending error:', pushErr);
                        }

                        // Merge: Supabase data + any local-only invoices
                        const supabaseIds = new Set(data.map(d => d.id));
                        const localOnly = localData
                            .filter(l => !l.supabaseId || !supabaseIds.has(l.supabaseId))
                            .map(inv => ({
                                id: inv.supabaseId,
                                localId: inv.localId,
                                invoice_number: inv.invoiceNumber,
                                client_name: inv.clientName,
                                total_amount: inv.totalAmount,
                                currency: inv.currency,
                                created_at: inv.updatedAt,
                                updated_at: inv.updatedAt,
                                _synced: false,
                            }));

                        const merged = [
                            ...data.map(inv => ({ ...inv, _synced: true })),
                            ...localOnly,
                        ];
                        setInvoices(merged);
                        setLoading(false);
                    } else if (error) {
                        console.error('[Dashboard Sync] Supabase error:', error);
                        if (!cancelled) setLoading(false);
                    }
                } catch (err) {
                    console.error('[Dashboard Sync] Network error:', err);
                    if (!cancelled) setLoading(false);
                }
            } else {
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

    // ── Filtered + sorted invoices ──────────────────────────────────────────
    const displayedInvoices = useMemo(() => {
        let list = [...invoices];

        // Search
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(inv =>
                (inv.invoice_number || '').toLowerCase().includes(q) ||
                (inv.client_name || '').toLowerCase().includes(q)
            );
        }

        // Sort
        list.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc':
                    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                case 'date-desc':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'amount-desc':
                    return (b.total_amount || 0) - (a.total_amount || 0);
                case 'amount-asc':
                    return (a.total_amount || 0) - (b.total_amount || 0);
                case 'name-asc':
                    return (a.client_name || '').localeCompare(b.client_name || '');
                case 'name-desc':
                    return (b.client_name || '').localeCompare(a.client_name || '');
                default:
                    return 0;
            }
        });

        return list;
    }, [invoices, searchTerm, sortBy]);

    const sortLabels = {
        'date-desc': 'Newest first',
        'date-asc': 'Oldest first',
        'amount-desc': 'Highest amount',
        'amount-asc': 'Lowest amount',
        'name-asc': 'Client A→Z',
        'name-desc': 'Client Z→A',
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
        position: 'fixed', top: 0, left: 200, right: 0, zIndex: 39,
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
          marginBottom: 20,
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

        {/* ── Search + Sort controls ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 20, width: '100%',
          flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={14} style={{
              position: 'absolute', left: 10,
              top: '50%', transform: 'translateY(-50%)',
              color: '#6B7280', pointerEvents: 'none',
            }} />
            <input
              placeholder="Search invoices…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 32, paddingRight: 12,
                background: '#1E2130',
                border: '1px solid #2A2D3A',
                borderRadius: 8,
                color: '#e2e2eb', fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                transition: 'border-color 150ms ease',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
              onBlur={e => e.target.style.borderColor = '#2A2D3A'}
            />
          </div>

          {/* Sort dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              style={{
                height: 38, padding: '0 12px',
                borderRadius: 8,
                border: '1px solid #2A2D3A',
                background: '#1E2130',
                color: '#e2e2eb',
                fontFamily: "'Inter', sans-serif",
                fontSize: 12, fontWeight: 500,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                whiteSpace: 'nowrap',
                transition: 'border-color 150ms ease',
              }}
            >
              <ArrowUpDown size={13} color="#6B7280" />
              {sortLabels[sortBy]}
              <ChevronDown size={12} color="#6B7280" />
            </button>

            {showSortMenu && (
              <>
                <div
                  onClick={() => setShowSortMenu(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                />
                <div style={{
                  position: 'absolute', top: 42, right: 0, zIndex: 100,
                  background: '#191b22',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '4px 0',
                  minWidth: 170,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                  {Object.entries(sortLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                      style={{
                        display: 'block', width: '100%',
                        padding: '8px 14px',
                        border: 'none', background: sortBy === key ? 'rgba(99,102,241,0.12)' : 'transparent',
                        color: sortBy === key ? '#c0c1ff' : '#e2e2eb',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 12, fontWeight: sortBy === key ? 600 : 400,
                        textAlign: 'left', cursor: 'pointer',
                        transition: 'background 100ms ease',
                      }}
                      onMouseEnter={e => { if (sortBy !== key) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                      onMouseLeave={e => { if (sortBy !== key) e.currentTarget.style.background = 'transparent' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Invoice count ── */}
        {!loading && invoices.length > 0 && (
          <div style={{
            fontSize: 12, color: '#6B7280', marginBottom: 12,
            fontFamily: "'Inter', sans-serif",
          }}>
            {searchTerm ? `${displayedInvoices.length} of ${invoices.length} invoices` : `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`}
          </div>
        )}

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
        ) : displayedInvoices.length === 0 ? (
          <div style={{
            textAlign: 'center', paddingTop: 80,
            color: '#6B7280',
            fontFamily: "'Manrope', sans-serif",
          }}>
            <Receipt size={36} style={{ marginBottom: 14, opacity: 0.25 }} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 6 }}>
              {searchTerm ? 'No invoices match your search' : 'No invoices yet'}
            </p>
            <p style={{ fontSize: 13, margin: 0 }}>
              {searchTerm ? 'Try a different search term.' : 'Create your first invoice to get started.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayedInvoices.map((inv, idx) => (
              <div
                key={inv.id || inv.invoice_number || idx}
                onClick={() => {
                  if (inv.id) navigate(`/app/${inv.id}`)
                  else if (inv.localId) navigate(`/app/local_${inv.localId}`)
                  else alert('Cannot open invoice. Please try refreshing the page.')
                }}
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
                {/* Icon + sync dot */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: 8,
                    background: '#282a30',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Receipt size={16} color="#c0c1ff" />
                  </div>
                  {/* Sync status dot */}
                  <div
                    title={inv._synced ? 'Synced' : 'Pending sync'}
                    style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 8, height: 8,
                      borderRadius: '50%',
                      background: inv._synced ? '#10B981' : '#F59E0B',
                      border: '2px solid #1A1D27',
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 13, color: '#ffffff',
                    marginBottom: 2,
                  }}>#{inv.invoice_number || '—'}</div>
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
                  {formatMoney(inv.total_amount, inv.currency)}
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
                  onClick={e => {
                    e.stopPropagation()
                    e.preventDefault()
                    const identifier = inv.id || `local-${inv.localId}`
                    setInvoiceToDelete(identifier)
                  }}
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

    {/* ── Delete confirmation modal ── */}
    {invoiceToDelete && (
      <div
        onClick={() => setInvoiceToDelete(null)}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#191b22',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 28,
            width: '100%', maxWidth: 380,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}
        >
          <div>
            <h2 style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 17, fontWeight: 700,
              color: '#ffffff', margin: 0, marginBottom: 6,
            }}>Delete invoice?</h2>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13, color: '#6B7280', margin: 0,
            }}>
              This cannot be undone. The invoice will be permanently removed.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setInvoiceToDelete(null)}
              style={{
                height: 34, padding: '0 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent', color: '#e2e2eb',
                fontFamily: "'Manrope', sans-serif",
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              style={{
                height: 34, padding: '0 16px',
                borderRadius: 8, border: 'none',
                background: '#93000a',
                color: '#ffdad6',
                fontFamily: "'Manrope', sans-serif",
                fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
)
}
