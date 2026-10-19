import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function LoginPage({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        onNavigate(res.role === 'admin' ? 'admin' : 'home');
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Logo size={44} />
        <h1>Welcome back</h1>
        <p className="lead">Sign in to your Bright Smile Dental account.</p>

        {error && <div className="alert-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="l-email">Email address</label>
            <input
              id="l-email" type="email" required autoComplete="email" className="form-input"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="l-password">Password</label>
              <button
                type="button"
                className="btn-link"
                style={{ color: 'var(--teal)', fontSize: '12.5px', marginBottom: 4 }}
                onClick={() => onNavigate('forgot-password')}
              >
                Forgot password?
              </button>
            </div>
            <input
              id="l-password" type="password" required autoComplete="current-password" className="form-input"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-foot">
          Don’t have an account?{' '}
          <button type="button" className="btn-link" style={{ color: 'var(--teal)' }} onClick={() => onNavigate('register')}>
            Create account
          </button>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)', textAlign: 'center' }}>
          <button
            type="button"
            className="btn-link"
            style={{ fontSize: '12px', color: 'var(--muted)' }}
            onClick={() => {
              setEmail('admin@brightsmiledental.demo');
              setPassword('adminpassword123');
            }}
          >
            Fill Demo Admin Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
