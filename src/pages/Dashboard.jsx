import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Receipt, Plus, LogOut, ArrowRight, FileText, Clock } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (localStorage.getItem('invoicekit_auth') !== 'true') {
            navigate('/login');
            return;
        }
        fetchInvoices();
    }, [navigate]);

    const fetchInvoices = async () => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setInvoices(data || []);
        } catch (err) {
            console.error('Error fetching invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('invoicekit_auth');
        navigate('/');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
            {/* Top Navbar */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text)' }}>
                    <Receipt size={22} color="var(--color-cta)" />
                    <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Invoice<span style={{ color: 'var(--color-cta)' }}>Kit</span></span>
                </Link>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link to="/app" className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                        <Plus size={14} /> New Invoice
                    </Link>
                    <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '2rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.02em' }}>Recent Invoices</h2>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
                        <Clock size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>Loading invoices...</p>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <FileText size={40} color="var(--color-text-muted)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, marginBottom: '0.5rem' }}>No invoices yet</h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Create your first invoice to get started.</p>
                        <Link to="/app" className="btn-primary" style={{ display: 'inline-flex' }}>
                            Create Invoice <ArrowRight size={16} />
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {invoices.map(inv => (
                            <div
                                key={inv.id}
                                className="card"
                                onClick={() => navigate(`/app?id=${inv.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '0.95rem' }}>
                                        {inv.invoice_number || 'Untitled'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(inv.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                    {inv.client_name || 'No client'}
                                </p>
                                <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-cta)' }}>
                                    {inv.currency || '$'}{Number(inv.total_amount || 0).toLocaleString('en', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
