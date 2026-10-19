import { useState } from 'react';
import { authAPI } from '../services/api';
import Logo from '../components/Logo';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage({ onNavigate }) {
  const [step, setStep] = useState(1); // 1: Email, 2: Reset Code & New Password, 3: Success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword({ email });
      setInfoMessage(res.data.message || 'Verification code sent to your email.');
      if (res.data.reset_code) {
        setDemoCodeHint(res.data.reset_code);
        setCode(res.data.reset_code); // Auto-fill for convenience
      }
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to send reset code. Please check your email and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({
        email,
        token: code,
        new_password: newPassword,
      });
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid or expired code. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Logo size={44} />
        
        {step === 1 && (
          <>
            <h1>Reset your password</h1>
            <p className="lead">Enter your account email to receive a 6-digit verification code.</p>

            {error && <div className="alert-error" role="alert">{error}</div>}

            <form onSubmit={handleRequestCode}>
              <div className="form-group">
                <label className="form-label" htmlFor="fp-email">Email address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="fp-email"
                    type="email"
                    required
                    autoComplete="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary btn-block" disabled={loading}>
                {loading ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>

            <div className="auth-foot">
              <button
                type="button"
                className="btn-link"
                style={{ color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => onNavigate('login')}
              >
                <ArrowLeft size={14} /> Back to Sign in
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <KeyRound size={22} color="var(--teal)" /> Enter verification code
            </h1>
            <p className="lead">We sent a 6-digit code to <strong>{email}</strong></p>

            {infoMessage && <div className="alert-success">{infoMessage}</div>}
            {error && <div className="alert-error" role="alert">{error}</div>}

            {demoCodeHint && (
              <div className="demo-box" style={{ marginBottom: 16 }}>
                <strong>Verification Code:</strong> <code>{demoCodeHint}</code>
                <div className="small-note" style={{ marginTop: 4 }}>
                  (Generated code displayed for your convenience)
                </div>
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label" htmlFor="fp-code">6-digit verification code</label>
                <input
                  id="fp-code"
                  type="text"
                  required
                  maxLength={10}
                  className="form-input"
                  style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px', fontWeight: 'bold' }}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fp-new-password">New password</label>
                <input
                  id="fp-new-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fp-confirm-password">Confirm new password</label>
                <input
                  id="fp-confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>

              <button type="submit" className="btn-primary btn-block" disabled={loading}>
                {loading ? 'Updating password…' : 'Reset password'}
              </button>
            </form>

            <div className="auth-foot" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn-link"
                style={{ color: 'var(--muted)', fontSize: '12.5px' }}
                onClick={() => setStep(1)}
              >
                Change email
              </button>
              <button
                type="button"
                className="btn-link"
                style={{ color: 'var(--teal)', fontSize: '12.5px' }}
                onClick={() => onNavigate('login')}
              >
                Back to Sign in
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div style={{ padding: '16px 0' }}>
            <div style={{ display: 'grid', placeItems: 'center', margin: '0 auto 16px', width: 64, height: 64, borderRadius: '50%', background: '#d6efe8', color: '#0b6b57' }}>
              <CheckCircle2 size={36} />
            </div>
            <h1>Password updated!</h1>
            <p className="lead" style={{ marginTop: 8 }}>
              Your account password has been successfully reset. You can now log in with your new credentials.
            </p>

            <button
              type="button"
              className="btn-primary btn-block"
              style={{ marginTop: 24 }}
              onClick={() => onNavigate('login')}
            >
              Sign in to your account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
