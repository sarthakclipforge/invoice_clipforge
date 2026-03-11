import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt, AlertCircle } from 'lucide-react'
import { CREDENTIALS } from '../config/credentials'
import '../styles/landing.css'

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Redirect if already logged in
        if (localStorage.getItem('invoicekit_auth') === 'true') {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
            localStorage.setItem('invoicekit_auth', 'true');
            navigate('/dashboard');
        } else {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="landing-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="landing-bg-glow"></div>

            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2rem', position: 'relative', zIndex: 10 }}>
                <div className="landing-logo" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
                    <Receipt size={28} color="var(--accent-primary)" />
                    Invoice<span>Kit</span>
                </div>

                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
                    Sign in with your administrator credentials to access the dashboard.
                </p>

                {error && (
                    <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="field-group">
                        <label className="field-label">Username</label>
                        <input
                            type="text"
                            className="field-input"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="field-group">
                        <label className="field-label">Password</label>
                        <input
                            type="password"
                            className="field-input"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="hero-cta" style={{ width: '100%', marginTop: '1rem', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: '1rem' }}>
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    )
}
