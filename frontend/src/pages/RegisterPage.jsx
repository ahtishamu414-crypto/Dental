import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function RegisterPage({ onNavigate }) {
  const { register } = useAuth();
  // Public sign-up always creates a patient. Staff/admin accounts are created
  // from the admin portal (AddStaffModal), so the role is not user-selectable.
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'patient',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await register(formData);
      if (res.success) {
        setSuccess('Account created successfully! Redirecting to login…');
        setTimeout(() => onNavigate('login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card wide">
        <Logo size={44} />
        <h1>Create account</h1>
        <p className="lead">Join the Bright Smile Dental patient portal.</p>

        {error && <div className="alert-error" role="alert">{error}</div>}
        {success && <div className="alert-success" role="status">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="r-name">Full name</label>
              <input id="r-name" type="text" name="full_name" required autoComplete="name" className="form-input" value={formData.full_name} onChange={handleChange} placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="r-phone">Phone</label>
              <input id="r-phone" type="tel" name="phone" autoComplete="tel" className="form-input" value={formData.phone} onChange={handleChange} placeholder="(555) 123-4567" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="r-email">Email address</label>
            <input id="r-email" type="email" name="email" required autoComplete="email" className="form-input" value={formData.email} onChange={handleChange} placeholder="you@example.com" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="r-password">Password</label>
            <input id="r-password" type="password" name="password" required minLength={6} autoComplete="new-password" className="form-input" value={formData.password} onChange={handleChange} placeholder="At least 6 characters" />
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-foot">
          Already have an account?{' '}
          <button type="button" className="btn-link" style={{ color: 'var(--teal)' }} onClick={() => onNavigate('login')}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
