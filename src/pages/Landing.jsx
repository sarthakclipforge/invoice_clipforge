import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
    const navigate = useNavigate();

    useEffect(() => {
        // Inject Tailwind Config
        if (!document.getElementById('tailwind-config-script')) {
            const configScript = document.createElement('script');
            configScript.id = 'tailwind-config-script';
            configScript.innerHTML = `
                window.tailwind = window.tailwind || {};
                window.tailwind.config = {
                    darkMode: "class",
                    theme: {
                        extend: {
                            colors: {
                                "primary": "#ff8c00",
                                "background-light": "#f5f6f8",
                                "background-dark": "#0a0a14",
                            },
                            fontFamily: {
                                "display": ["Inter", "sans-serif"]
                            },
                            borderRadius: {"DEFAULT": "0.5rem", "lg": "1rem", "xl": "1.5rem", "full": "9999px"},
                        },
                    },
                };
            `;
            document.head.appendChild(configScript);
        }

        // Inject Tailwind CDN
        if (!document.getElementById('tailwind-cdn-script')) {
            const script = document.createElement('script');
            script.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
            script.id = 'tailwind-cdn-script';
            document.head.appendChild(script);
        }

        // Inject Icons
        const links = [
            "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300;400;500;600;700&display=swap",
            "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        ];
        
        links.forEach(href => {
            if (!document.querySelector(`link[href="${href}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.className = 'landing-injected-link';
                document.head.appendChild(link);
            }
        });

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
        }, 500);

        // Enforce dark mode on the whole document while on landing page
        document.documentElement.classList.add('dark');
        document.body.style.backgroundColor = '#0a0a14';
        document.body.style.color = '#ffffff';

        return () => {
            // Cleanup when leaving landing page to not affect InvoiceApp
            document.documentElement.classList.remove('dark');
            document.body.style.backgroundColor = '';
            document.body.style.color = '';
            
            const tailwindScript = document.getElementById('tailwind-cdn-script');
            if (tailwindScript) tailwindScript.remove();
            
            const configScript = document.getElementById('tailwind-config-script');
            if (configScript) configScript.remove();
            
            // Tailwind adds its styles with this ID
            document.querySelectorAll('style[data-custom-cdn], style#tailwindcss-play-cdn, style[id*="tailwind"]').forEach(el => el.remove());
            
            document.querySelectorAll('.landing-injected-link').forEach(el => el.remove());
            delete window.tailwind;
            observer.disconnect();
        };
    }, []);

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased font-display min-h-screen relative overflow-x-hidden">
            <style>{`
                .glass {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .glass-primary {
                    background: rgba(255, 140, 0, 0.1);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 140, 0, 0.2);
                }
                .reveal {
                    opacity: 0;
                    transform: translateY(30px);
                    transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
                }
                .reveal.active {
                    opacity: 1;
                    transform: translateY(0);
                }
            `}</style>

            {/* Navigation */}
            <nav className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary rounded-lg text-white">
                            <span className="material-symbols-outlined block">description</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight">InvoiceKit</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a className="hover:text-primary transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</a>
                        <a className="hover:text-primary transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}>How it Works</a>
                        <a className="hover:text-primary transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }}>Pricing</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/login')} className="text-sm font-semibold hover:text-primary transition-colors">Login</button>
                        <button onClick={() => navigate('/login')} className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all">
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="reveal py-24 md:py-32">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="relative z-10 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            NEW: AI-POWERED BILLING IS HERE
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-6 tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Create beautiful invoices in <span className="text-primary">seconds.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Lightning-fast invoice generation for modern freelancers and agencies with our glassmorphism-inspired editor. Look professional, get paid faster.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button onClick={() => navigate('/login')} className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl shadow-primary/30 transition-all">
                                Start Creating Invoices
                            </button>
                            <button onClick={() => navigate('/login')} className="glass px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/5 transition-all">
                                View Dashboard
                            </button>
                        </div>
                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-slate-500 text-sm">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full border-2 border-background-dark bg-slate-800"></div>
                                <div className="w-8 h-8 rounded-full border-2 border-background-dark bg-slate-700"></div>
                                <div className="w-8 h-8 rounded-full border-2 border-background-dark bg-slate-600"></div>
                            </div>
                            <span>Joined by 10k+ freelancers</span>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="glass-primary p-4 rounded-2xl shadow-2xl relative z-10">
                            <div className="bg-background-dark/80 rounded-xl overflow-hidden aspect-[4/3] border border-white/5 relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
                                <img className="w-full h-full object-cover mix-blend-overlay opacity-60" alt="Screenshot of professional glassmorphism invoice editor dashboard" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdbN3BhXR5QgbcfYOBTMN-qqK8C3z93zgmRTXCpAgCvSmputxBs-mr2jEyCJldNWWcT-9v1UUtLZe_najy7Xc1EWvbK-u1-L95Sh5eEtZsmMFO98jJofx01Fg_T1IWIfCkJqaZAsku4TyCjZ5AuG3Ge3kmLEUFl1yVd3o0XREZCeT4_i02P96odgDX1dQqbi7U27rX8Gfoy3-wXVuKAzbqIx5bje8oqqBN-9QhSP2tSSr_3ho2ncEgvTt7JwVtKlsjyv4HdreeKsW1"/>
                                {/* Floating Glass UI Elements */}
                                <div className="absolute top-10 left-10 glass p-4 rounded-lg w-48 shadow-2xl">
                                    <div className="h-2 w-12 bg-primary rounded mb-3"></div>
                                    <div className="space-y-2">
                                        <div className="h-1.5 w-full bg-slate-700 rounded"></div>
                                        <div className="h-1.5 w-3/4 bg-slate-700 rounded"></div>
                                    </div>
                                </div>
                                <div className="absolute bottom-10 right-10 glass p-4 rounded-lg w-56 shadow-2xl border-primary/30">
                                    <div className="flex justify-between mb-4">
                                        <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                                        <div className="h-4 w-20 bg-slate-700 rounded"></div>
                                    </div>
                                    <div className="h-8 w-full bg-primary/20 rounded border border-primary/30 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-primary">PAID: $4,250.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decor Elements */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/40 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(255, 140, 0, 0.2)' }}></div>
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <section className="reveal py-24 md:py-32">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
                        Invoicing shouldn't feel like <br className="hidden md:block"/>
                        <span className="text-primary italic">accounting software.</span>
                    </h2>
                    <p className="text-xl text-slate-400 leading-relaxed">
                        Most billing tools are built for accountants. InvoiceKit is built for creators. We stripped away the bloat and kept the beauty, so you can focus on your work, not your paperwork.
                    </p>
                </div>
            </section>

            {/* Features Section */}
            <section className="reveal py-24 md:py-32 max-w-7xl mx-auto md:px-16 lg:px-24" id="features">
                <div className="mb-16">
                    <h3 className="text-primary font-bold tracking-widest text-sm uppercase mb-3">Powerful Features</h3>
                    <h2 className="text-4xl font-bold">Everything you need to get paid.</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="glass p-8 rounded-2xl hover:bg-white/5 transition-all group">
                        <span className="material-symbols-outlined text-primary text-4xl mb-6 group-hover:scale-110 transition-transform">edit_document</span>
                        <h4 className="text-xl font-bold mb-3">Real-Time Builder</h4>
                        <p className="text-slate-400 leading-relaxed">See changes as you type with our instant preview. No more "Generate PDF" to see how it looks.</p>
                    </div>
                    <div className="glass p-8 rounded-2xl hover:bg-white/5 transition-all group">
                        <span className="material-symbols-outlined text-primary text-4xl mb-6 group-hover:scale-110 transition-transform">auto_awesome</span>
                        <h4 className="text-xl font-bold mb-3">AI Line Items</h4>
                        <p className="text-slate-400 leading-relaxed">Let AI suggest professional descriptions and market-rate prices for your creative services.</p>
                    </div>
                    <div className="glass p-8 rounded-2xl hover:bg-white/5 transition-all group">
                        <span className="material-symbols-outlined text-primary text-4xl mb-6 group-hover:scale-110 transition-transform">palette</span>
                        <h4 className="text-xl font-bold mb-3">Custom Branding</h4>
                        <p className="text-slate-400 leading-relaxed">Add your logo, custom fonts, and brand colors. Make every document a reflection of your quality.</p>
                    </div>
                    <div className="glass p-8 rounded-2xl hover:bg-white/5 transition-all group">
                        <span className="material-symbols-outlined text-primary text-4xl mb-6 group-hover:scale-110 transition-transform">payments</span>
                        <h4 className="text-xl font-bold mb-3">Multi-Currency</h4>
                        <p className="text-slate-400 leading-relaxed">Working with international clients? We support over 150 currencies with live exchange rates.</p>
                    </div>
                    <div className="glass p-8 rounded-2xl hover:bg-white/5 transition-all group">
                        <span className="material-symbols-outlined text-primary text-4xl mb-6 group-hover:scale-110 transition-transform">dashboard</span>
                        <h4 className="text-xl font-bold mb-3">Cloud Dashboard</h4>
                        <p className="text-slate-400 leading-relaxed">Manage clients, track payments, and view your revenue stats in one beautiful, unified view.</p>
                    </div>
                    <div className="glass p-8 rounded-2xl hover:bg-white/5 transition-all group">
                        <span className="material-symbols-outlined text-primary text-4xl mb-6 group-hover:scale-110 transition-transform">picture_as_pdf</span>
                        <h4 className="text-xl font-bold mb-3">PDF Export</h4>
                        <p className="text-slate-400 leading-relaxed">High-quality, vector PDF generation ensures your invoices look crisp on screens and paper.</p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="reveal py-24 md:py-32" id="how-it-works">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center mb-16">Four steps to professional billing.</h2>
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="text-center relative">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary font-bold border border-primary/30">1</div>
                            <h5 className="font-bold mb-2">Enter Details</h5>
                            <p className="text-sm text-slate-400">Type in your client info and hours worked.</p>
                        </div>
                        <div className="text-center relative">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary font-bold border border-primary/30">2</div>
                            <h5 className="font-bold mb-2">AI Generation</h5>
                            <p className="text-sm text-slate-400">Our AI polishes your line item descriptions.</p>
                        </div>
                        <div className="text-center relative">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary font-bold border border-primary/30">3</div>
                            <h5 className="font-bold mb-2">Customize</h5>
                            <p className="text-sm text-slate-400">Apply your brand colors and logo with one click.</p>
                        </div>
                        <div className="text-center relative">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary font-bold border border-primary/30">4</div>
                            <h5 className="font-bold mb-2">Export</h5>
                            <p className="text-sm text-slate-400">Send via link or download as a high-res PDF.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Feature Section */}
            <section className="reveal py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="glass-primary rounded-3xl p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 relative">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <span className="material-symbols-outlined text-[160px]">smart_toy</span>
                        </div>
                        <div className="flex-1">
                            <div className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-sm font-bold mb-6 italic">Magic Assist™</div>
                            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Let AI write your invoice items.</h2>
                            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                                Never worry about how to phrase "Backend Infrastructure Optimization" again. Describe your work in plain English, and our AI converts it into professional, billable line items that justify your rates.
                            </p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-slate-200">
                                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                                    Professional phrasing automatically
                                </li>
                                <li className="flex items-center gap-3 text-slate-200">
                                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                                    Suggested pricing based on industry data
                                </li>
                                <li className="flex items-center gap-3 text-slate-200">
                                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                                    Tax categorization assistance
                                </li>
                            </ul>
                            <button onClick={() => navigate('/login')} className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-bold transition-all">Try AI Builder</button>
                        </div>
                        <div className="flex-1 glass border-white/20 p-6 rounded-2xl w-full max-w-md">
                            <div className="flex gap-4 mb-6">
                                <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-2 w-20 bg-slate-600 rounded"></div>
                                    <div className="h-10 w-full bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400">"I built a login system and some dashboards"</div>
                                </div>
                            </div>
                            <div className="flex gap-4 flex-row-reverse">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="h-2 w-20 bg-primary/40 rounded self-end"></div>
                                    <div className="glass-primary rounded-lg p-4 text-xs space-y-2">
                                        <p className="font-bold text-primary">Generated Item:</p>
                                        <p className="text-slate-300">"Implementation of Secure Authentication Protocols &amp; Advanced Data Visualization Dashboards"</p>
                                        <p className="text-primary font-bold text-[14px]">$1,850.00</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="reveal py-24 md:py-32 px-6" id="pricing">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black mb-4">Simple, transparent pricing.</h2>
                    <p className="text-slate-400">Scale your business with the plan that fits you.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="glass p-10 rounded-3xl border-white/5 relative flex flex-col">
                        <h3 className="text-2xl font-bold mb-2">Free</h3>
                        <p className="text-slate-400 mb-6">For solo creators starting out.</p>
                        <div className="mb-8">
                            <span className="text-5xl font-black">$0</span>
                            <span className="text-slate-500">/mo</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            <li className="flex items-center gap-3 text-slate-300">
                                <span className="material-symbols-outlined text-primary">done</span>
                                Up to 3 Invoices / Month
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <span className="material-symbols-outlined text-primary">done</span>
                                Basic Branding
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <span className="material-symbols-outlined text-primary">done</span>
                                Standard PDF Export
                            </li>
                        </ul>
                        <button onClick={() => navigate('/login')} className="w-full py-4 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all">Get Started</button>
                    </div>
                    <div className="glass p-10 rounded-3xl border-primary/50 relative flex flex-col bg-primary/5 overflow-hidden">
                        <div className="absolute top-5 right-5 px-3 py-1 bg-primary text-white text-[10px] font-black rounded-full uppercase tracking-widest">Most Popular</div>
                        <h3 className="text-2xl font-bold mb-2">Pro</h3>
                        <p className="text-slate-400 mb-6">For professional agencies and power users.</p>
                        <div className="mb-8">
                            <span className="text-5xl font-black">$19</span>
                            <span className="text-slate-500">/mo</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            <li className="flex items-center gap-3 text-slate-300">
                                <span className="material-symbols-outlined text-primary">done</span>
                                Unlimited Invoices
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <span className="material-symbols-outlined text-primary">done</span>
                                Full AI Item Generation
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <span className="material-symbols-outlined text-primary">done</span>
                                Custom Domains &amp; White-label
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <span className="material-symbols-outlined text-primary">done</span>
                                Priority Support
                            </li>
                        </ul>
                        <button onClick={() => navigate('/login')} className="w-full py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Go Pro Now</button>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="reveal py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-16">Loved by founders worldwide.</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="glass p-8 rounded-2xl italic text-slate-300">
                            "InvoiceKit changed how I bill my clients. The glassmorphism design isn't just eye candy—it actually makes the workflow more intuitive."
                            <div className="mt-6 flex items-center gap-4 not-italic">
                                <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                                <div>
                                    <p className="font-bold text-white text-sm">Sarah Jenkins</p>
                                    <p className="text-xs text-slate-500">Product Designer</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass p-8 rounded-2xl italic text-slate-300">
                            "The AI descriptions are scary good. It saves me at least 2 hours of writing every month. Worth every penny of the Pro plan."
                            <div className="mt-6 flex items-center gap-4 not-italic">
                                <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                                <div>
                                    <p className="font-bold text-white text-sm">Alex Rivera</p>
                                    <p className="text-xs text-slate-500">Fullstack Developer</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass p-8 rounded-2xl italic text-slate-300">
                            "Professional, clean, and fast. My clients often comment on how great my invoices look. It truly levels up my brand perception."
                            <div className="mt-6 flex items-center gap-4 not-italic">
                                <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                                <div>
                                    <p className="font-bold text-white text-sm">Marcus Chen</p>
                                    <p className="text-xs text-slate-500">Brand Strategist</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="reveal py-24 md:py-32">
                <div className="absolute inset-0 blur-[150px] rounded-full translate-y-1/2" style={{ backgroundColor: 'rgba(255, 140, 0, 0.15)' }}></div>
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-5xl md:text-6xl font-black mb-8">Ready to get paid?</h2>
                    <p className="text-xl text-slate-400 mb-12">Join thousands of professionals who trust InvoiceKit for their billing.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={() => navigate('/login')} className="bg-primary hover:bg-primary/90 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl shadow-primary/30 transition-all">
                            Start Creating Now
                        </button>
                        <button onClick={() => navigate('/login')} className="glass px-10 py-5 rounded-2xl text-xl font-bold transition-all">
                            Contact Sales
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 border-t border-white/5 text-slate-500 relative z-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/20 rounded-md text-primary">
                            <span className="material-symbols-outlined block text-sm">description</span>
                        </div>
                        <span className="text-white font-bold tracking-tight">InvoiceKit</span>
                    </div>
                    <div className="flex gap-8 text-sm">
                        <a className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</a>
                        <a className="hover:text-primary transition-colors cursor-pointer">Terms of Service</a>
                        <a className="hover:text-primary transition-colors cursor-pointer">Twitter</a>
                        <a className="hover:text-primary transition-colors cursor-pointer">Support</a>
                    </div>
                    <p className="text-sm">© 2024 InvoiceKit AI Inc.</p>
                </div>
            </footer>
        </div>
    );
}
