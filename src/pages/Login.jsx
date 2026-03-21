import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt, AlertCircle } from 'lucide-react'
import { CREDENTIALS } from '../config/credentials'

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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)', padding: '2rem 1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Receipt size={24} color="var(--color-cta)" />
                    <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.3rem', fontWeight: 700 }}>Invoice<span style={{ color: 'var(--color-cta)' }}>Kit</span></span>
                </div>

                <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    Sign in with your administrator credentials to access the dashboard.
                </p>

                {error && (
                    <div style={{ padding: '0.75rem', background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: 'var(--radius-md)', color: 'var(--color-error)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
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

                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem' }}>
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    )
}
