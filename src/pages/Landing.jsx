import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, ArrowRight, Sparkles, Palette, Globe, LayoutDashboard, FileText, Zap, Check, ChevronRight } from 'lucide-react';
import '../styles/landing.css';

export default function Landing() {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect logged-in users directly to dashboard
        if (localStorage.getItem('invoicekit_auth') === 'true') {
            navigate('/dashboard');
            return;
        }

        // Setup the intersection observer for scroll reveal animations
        const observerOptions = { threshold: 0.1 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        setTimeout(() => {
            document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        }, 100);

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div className="landing-container">
            {/* Top accent bar */}
            <div className="landing-bg-glow"></div>

            {/* Navigation */}
            <nav className="landing-nav">
                <a href="/" className="landing-logo">
                    <Receipt size={32} color="var(--color-cta)" strokeWidth={2.5} />
                    Invoice<span>Kit</span>
                </a>
                <div className="nav-links">
                    <a className="nav-link" href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</a>
                    <a className="nav-link" href="#pricing" onClick={(e) => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }}>Pricing</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Poppins, sans-serif' }}>Login</button>
                    <button onClick={() => navigate('/login')} className="nav-cta">Get Started</button>
                </div>
            </nav>

            {/* Hero Section - Centered Neumorphic */}
            <section className="hero-section">
                <div className="hero-neumorphic-card">
                    <div className="hero-badge neumorphic-inset">
                        <Sparkles size={16} />
                        Next-Gen AI Billing
                    </div>
                    <h1 className="hero-title">
                        Create invoices <span>in seconds.</span>
                    </h1>
                    <p className="hero-subtitle">
                        The world's most elegant billing tool for creators, agencies, and high-performance teams.
                    </p>
                    <div className="hero-cta-group">
                        <button onClick={() => navigate('/login')} className="hero-cta neumorphic-outset">
                            Start Creating <ArrowRight size={22} />
                        </button>
                        <a onClick={() => { navigate('/login'); }} className="hero-cta-secondary" style={{ cursor: 'pointer' }}>
                            View Dashboard <ChevronRight size={20} />
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section reveal" id="features">
                {[
                    { icon: <FileText size={28} />, title: 'Visual Builder', desc: 'Real-time WYSIWYG editing that feels like magic. What you see is exactly what they pay.' },
                    { icon: <Sparkles size={28} />, title: 'AI Intelligence', desc: 'Leverage GPT-4 to craft professional descriptions and strategy-led billing line items.' },
                    { icon: <Palette size={28} />, title: 'Swiss Design', desc: 'Impeccable typography and layout. Every invoice is a brand statement for your business.' },
                ].map((f, i) => (
                    <div className="feature-card" key={i}>
                        <div className="feature-icon-wrapper">{f.icon}</div>
                        <h4 className="feature-title">{f.title}</h4>
                        <p className="feature-text">{f.desc}</p>
                    </div>
                ))}
            </section>

            {/* AI Callout */}
            <section className="reveal" style={{ padding: '4rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ background: '#0F172A', borderRadius: '40px', padding: 'clamp(3rem, 6vw, 6rem)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center', color: '#fff' }}>
                    <div>
                        <div style={{ display: 'inline-flex', padding: '0.5rem 1rem', borderRadius: '100px', background: 'rgba(249, 115, 22, 0.2)', color: 'var(--color-cta)', fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.5rem' }}>AI Powered</div>
                        <h2 style={{ color: '#fff', fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '2rem' }}>
                            Your billing on <span style={{ color: 'var(--color-cta)' }}>autopilot.</span>
                        </h2>
                        <p style={{ color: '#94A3B8', fontSize: '1.2rem', lineHeight: 1.7, marginBottom: '3rem' }}>
                            Stop wasting hours on formatting and descriptions. Our AI engine understands your work and projects it professionally.
                        </p>
                        <button onClick={() => navigate('/login')} className="hero-cta" style={{ background: '#fff', color: '#0F172A', boxShadow: 'none' }}>
                            Try AI Builder <Sparkles size={20} />
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {[
                            { label: 'Saved per month', val: '12h' },
                            { label: 'Faster payments', val: '40%' },
                            { label: 'Active users', val: '25k+' },
                            { label: 'Countries', val: '180' },
                        ].map((stat, i) => (
                            <div key={i} style={{ padding: '2rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Poppins, sans-serif', marginBottom: '0.5rem' }}>{stat.val}</div>
                                <div style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing-section reveal" id="pricing">
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.04em' }}>Beautifully simple pricing.</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.15rem' }}>Zero hidden fees. Unlimited potential.</p>
                </div>
                <div className="pricing-grid">
                    <div className="pricing-card">
                        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1rem' }}>Starter</h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2.5rem' }}>Perfect for individual creators.</p>
                        <div className="price">$0<span>/mo</span></div>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {['5 Invoices Monthly', 'Standard Templates', 'Basic Support'].map((item, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                                    <Check size={20} color="var(--color-primary)" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => navigate('/login')} className="nav-cta" style={{ width: '100%', padding: '1.25rem' }}>Get Started Free</button>
                    </div>
                    <div className="pricing-card premium">
                        <div className="popular-badge">Most Popular</div>
                        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1rem' }}>Professional</h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2.5rem' }}>For growing agencies & teams.</p>
                        <div className="price">$19<span>/mo</span></div>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {['Unlimited Invoices', 'Advanced AI Engine', 'Custom Branding', 'Priority 24/7 Support'].map((item, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                                    <Check size={20} color="var(--color-cta)" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => navigate('/login')} className="nav-cta" style={{ width: '100%', padding: '1.25rem', background: 'var(--color-cta)' }}>Go Professional</button>
                    </div>
                </div>
            </section>

            {/* Final Call to Action */}
            <section className="reveal" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(3rem, 6vw, 4.5rem)', fontWeight: 800, marginBottom: '2rem', letterSpacing: '-0.05em' }}>Ready to elevate your billing?</h2>
                <button onClick={() => navigate('/login')} className="hero-cta" style={{ margin: '0 auto', fontSize: '1.4rem' }}>
                    Join 25,000+ Founders <ArrowRight size={24} />
                </button>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="landing-logo">
                        <Receipt size={24} color="var(--color-cta)" />
                        Invoice<span>Kit</span>
                    </div>
                    <div style={{ display: 'flex', gap: '3rem' }}>
                        <a href="#" className="nav-link">Twitter</a>
                        <a href="#" className="nav-link">Discord</a>
                        <a href="#" className="nav-link">Changelog</a>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>© 2024 InvoiceKit AI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
