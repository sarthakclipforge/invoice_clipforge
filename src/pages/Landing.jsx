import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, ArrowRight, Sparkles, Palette, Globe, LayoutDashboard, FileText, Zap, Check, ChevronRight } from 'lucide-react';
import '../styles/landing.css';

export default function Landing() {
    const navigate = useNavigate();

    useEffect(() => {
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
        }, 300);

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
                    <Receipt size={24} color="var(--color-cta)" />
                    Invoice<span>Kit</span>
                </a>
                <div className="nav-links">
                    <a className="nav-link" href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</a>
                    <a className="nav-link" href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}>How it Works</a>
                    <a className="nav-link" href="#pricing" onClick={(e) => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }}>Pricing</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'Poppins, sans-serif' }}>Login</button>
                    <button onClick={() => navigate('/login')} className="nav-cta">Get Started</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section animate-fade-in">
                <div className="hero-badge">
                    <Sparkles size={14} />
                    AI-POWERED BILLING
                </div>
                <h1 className="hero-title">
                    Create beautiful invoices in <span style={{ color: 'var(--color-cta)' }}>seconds.</span>
                </h1>
                <p className="hero-subtitle">
                    Lightning-fast invoice generation for modern freelancers and agencies. Look professional, get paid faster.
                </p>
                <div className="hero-cta-group">
                    <button onClick={() => navigate('/login')} className="hero-cta">
                        Start Creating Invoices <ArrowRight size={18} />
                    </button>
                    <a onClick={() => navigate('/login')} className="hero-cta-secondary" style={{ cursor: 'pointer' }}>
                        View Dashboard <ChevronRight size={16} style={{ verticalAlign: 'middle' }} />
                    </a>
                </div>
            </section>

            {/* Showcase Image */}
            <section className="showcase-section reveal">
                <div className="showcase-content">
                    <div className="showcase-image-wrapper">
                        <img className="showcase-img" alt="InvoiceKit editor preview" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdbN3BhXR5QgbcfYOBTMN-qqK8C3z93zgmRTXCpAgCvSmputxBs-mr2jEyCJldNWWcT-9v1UUtLZe_najy7Xc1EWvbK-u1-L95Sh5eEtZsmMFO98jJofx01Fg_T1IWIfCkJqaZAsku4TyCjZ5AuG3Ge3kmLEUFl1yVd3o0XREZCeT4_i02P96odgDX1dQqbi7U27rX8Gfoy3-wXVuKAzbqIx5bje8oqqBN-9QhSP2tSSr_3ho2ncEgvTt7JwVtKlsjyv4HdreeKsW1"/>
                    </div>
                </div>
            </section>

            {/* Problem Statement */}
            <section className="reveal" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                    Invoicing shouldn't feel like <span style={{ color: 'var(--color-cta)', fontStyle: 'italic' }}>accounting software.</span>
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>
                    Most billing tools are built for accountants. InvoiceKit is built for creators. We stripped away the bloat and kept the beauty.
                </p>
            </section>

            {/* Features Section */}
            <section className="features-section reveal" id="features">
                {[
                    { icon: <FileText size={22} />, title: 'Real-Time Builder', desc: 'See changes as you type with our instant preview. No more "Generate PDF" to see how it looks.' },
                    { icon: <Sparkles size={22} />, title: 'AI Line Items', desc: 'Let AI suggest professional descriptions and market-rate prices for your creative services.' },
                    { icon: <Palette size={22} />, title: 'Custom Branding', desc: 'Add your logo, custom fonts, and brand colors. Make every document a reflection of your quality.' },
                    { icon: <Globe size={22} />, title: 'Multi-Currency', desc: 'Working with international clients? We support over 150 currencies with live exchange rates.' },
                    { icon: <LayoutDashboard size={22} />, title: 'Cloud Dashboard', desc: 'Manage clients, track payments, and view your revenue stats in one unified view.' },
                    { icon: <Zap size={22} />, title: 'PDF Export', desc: 'High-quality, vector PDF generation ensures your invoices look crisp on screens and paper.' },
                ].map((f, i) => (
                    <div className="feature-card" key={i}>
                        <div className="feature-icon-wrapper">{f.icon}</div>
                        <h4 className="feature-title">{f.title}</h4>
                        <p className="feature-text">{f.desc}</p>
                    </div>
                ))}
            </section>

            {/* How It Works */}
            <section className="reveal" id="how-it-works" style={{ padding: '4rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, textAlign: 'center', marginBottom: '3rem', letterSpacing: '-0.02em' }}>
                    Four steps to professional billing.
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                    {[
                        { num: '1', title: 'Enter Details', desc: 'Type in your client info and hours worked.' },
                        { num: '2', title: 'AI Generation', desc: 'Our AI polishes your line item descriptions.' },
                        { num: '3', title: 'Customize', desc: 'Apply your brand colors and logo.' },
                        { num: '4', title: 'Export', desc: 'Send via link or download as a PDF.' },
                    ].map((step, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>{step.num}</div>
                            <h5 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, marginBottom: '0.4rem' }}>{step.title}</h5>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* AI Feature Highlight */}
            <section className="reveal" style={{ padding: '4rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', padding: 'clamp(2rem, 4vw, 4rem)', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'flex-start', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'inline-flex', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-sm)', background: 'rgba(249, 115, 22, 0.08)', color: 'var(--color-cta)', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI-Powered</div>
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                        Let AI write your invoice items.
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '600px' }}>
                        Describe your work in plain English, and our AI converts it into professional, billable line items that justify your rates.
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {['Professional phrasing automatically', 'Suggested pricing based on industry data', 'Tax categorization assistance'].map((item, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 500, fontSize: '0.95rem' }}>
                                <Check size={18} color="var(--color-success)" /> {item}
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => navigate('/login')} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                        Try AI Builder <ArrowRight size={16} />
                    </button>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="reveal" id="pricing" style={{ padding: '4rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Simple, transparent pricing.</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Scale your business with the plan that fits you.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {/* Free Plan */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '1.15rem', marginBottom: '0.5rem' }}>Free</h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>For solo creators starting out.</p>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '2.5rem', fontWeight: 700 }}>$0</span>
                            <span style={{ color: 'var(--color-text-muted)', marginLeft: 4 }}>/mo</span>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                            {['Up to 3 Invoices / Month', 'Basic Branding', 'Standard PDF Export'].map((item, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                                    <Check size={16} color="var(--color-primary)" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => navigate('/login')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Get Started</button>
                    </div>
                    {/* Pro Plan */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', border: '2px solid var(--color-cta)', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-cta)', color: '#fff', padding: '0.2rem 0.9rem', borderRadius: 'var(--radius-sm)', fontFamily: 'Poppins, sans-serif', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Popular</div>
                        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '1.15rem', marginBottom: '0.5rem' }}>Pro</h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>For professional agencies and power users.</p>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '2.5rem', fontWeight: 700 }}>$19</span>
                            <span style={{ color: 'var(--color-text-muted)', marginLeft: 4 }}>/mo</span>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                            {['Unlimited Invoices', 'Full AI Item Generation', 'Custom Domains & White-label', 'Priority Support'].map((item, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                                    <Check size={16} color="var(--color-cta)" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => navigate('/login')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Go Pro Now</button>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="reveal" style={{ padding: '4rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, textAlign: 'center', marginBottom: '2.5rem', letterSpacing: '-0.02em' }}>Loved by founders worldwide.</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {[
                        { text: '"InvoiceKit changed how I bill my clients. The clean design makes the workflow more intuitive."', name: 'Sarah Jenkins', role: 'Product Designer' },
                        { text: '"The AI descriptions are scary good. It saves me at least 2 hours of writing every month."', name: 'Alex Rivera', role: 'Fullstack Developer' },
                        { text: '"Professional, clean, and fast. My clients often comment on how great my invoices look."', name: 'Marcus Chen', role: 'Brand Strategist' },
                    ].map((t, i) => (
                        <div key={i} className="card" style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                            <p>{t.text}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem', fontStyle: 'normal' }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-border)', flexShrink: 0 }}></div>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{t.name}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="reveal" style={{ padding: '5rem 2rem', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Ready to get paid?</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', marginBottom: '2rem' }}>Join thousands of professionals who trust InvoiceKit for their billing.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/login')} className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>Start Creating Now <ArrowRight size={18} /></button>
                    <button onClick={() => navigate('/login')} className="btn-secondary">Contact Sales</button>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <Receipt size={18} color="var(--color-cta)" />
                        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>InvoiceKit</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                        <a href="#" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Privacy</a>
                        <a href="#" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Terms</a>
                        <a href="#" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Support</a>
                    </div>
                    <p className="footer-copyright">© 2024 InvoiceKit AI Inc.</p>
                </div>
            </footer>
        </div>
    );
}
