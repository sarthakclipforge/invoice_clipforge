import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { Receipt, FileText, Plus, LogOut, ArrowRight } from 'lucide-react'
import '../styles/landing.css'

function formatMoney(amount, currencyCode) {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat('en-US', { style: "currency", currency: currencyCode, minimumFractionDigits: 2 }).format(amount || 0);
}

export default function Dashboard() {
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    async function fetchInvoices() {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setInvoices(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchInvoices()
    }, [])

    function handleLogout() {
        localStorage.removeItem('invoicekit_auth')
        navigate('/')
    }

    return (
        <div className="landing-container" style={{ display: 'block' }}>
            <nav className="landing-nav" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--surface-border)', background: 'var(--bg-darker)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <Link to="/" className="landing-logo">
                    <Receipt size={24} color="var(--accent-primary)" />
                    Invoice<span>Kit</span>
                </Link>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link to="/app" className="nav-cta" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        <Plus size={14} /> New Invoice
                    </Link>
                    <button
                        onClick={handleLogout}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </nav>

            <main style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '2rem 1rem', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontFamily: 'Outfit', fontWeight: 700, letterSpacing: '-0.02em' }}>Recent Invoices</h2>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading your dashboard...</p>
                ) : invoices.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                            <FileText size={40} color="var(--accent-primary)" />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontFamily: 'Outfit', fontWeight: 600 }}>No invoices yet</h3>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>You haven't saved any invoices to your cloud yet. Create your first premium invoice and it will appear here safely.</p>
                        <Link to="/app" className="hero-cta" style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}>Create Invoice <ArrowRight size={16} /></Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {invoices.map(inv => (
                            <div
                                key={inv.id}
                                className="glass-panel"
                                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', transition: 'all 0.2s ease', cursor: 'pointer' }}
                                onClick={() => navigate(`/app/${inv.id}`)}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: '700', letterSpacing: '0.05em' }}>{inv.invoice_number || 'UNKNOWN'}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {new Date(inv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>{inv.client_name || 'Unnamed Client'}</h4>
                                    <p style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Outfit' }}>{formatMoney(inv.total_amount, inv.currency)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
