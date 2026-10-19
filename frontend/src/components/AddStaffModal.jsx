import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { X, UserPlus } from 'lucide-react';

const EMPTY_FORM = {
  full_name: '',
  email: '',
  password: '',
  phone: '',
  role: 'admin',
};

export default function AddStaffModal({ isOpen, onClose, onRefresh }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && handleClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleClose = () => {
    setError('');
    setFormData(EMPTY_FORM);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authAPI.register(formData);
      onRefresh(); // Refresh the user list
      handleClose(); // Close modal and reset form
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not add the staff member. Check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitLabel = formData.role === 'admin' ? 'Create administrator' : 'Create staff account';

  return (
    <>
      <style>{css}</style>

      <div className="bsd-overlay" onMouseDown={(e) => e.target === e.currentTarget && handleClose()}>
        <div className="bsd-card" role="dialog" aria-modal="true" aria-labelledby="bsd-title">
          <button type="button" className="bsd-close" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>

          <div className="bsd-header">
            <span className="bsd-icon">
              <UserPlus size={20} />
            </span>
            <div>
              <h3 id="bsd-title" className="bsd-title">Add new staff member</h3>
              <p className="bsd-sub">They can sign in with these details right away.</p>
            </div>
          </div>

          {error && (
            <div className="bsd-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="bsd-group">
              <label className="bsd-label" htmlFor="bsd-name">Full name</label>
              <input
                id="bsd-name"
                type="text"
                required
                className="bsd-input"
                value={formData.full_name}
                onChange={update('full_name')}
                placeholder="Dr. New Admin"
              />
            </div>

            <div className="bsd-group">
              <label className="bsd-label" htmlFor="bsd-email">Email address</label>
              <input
                id="bsd-email"
                type="email"
                required
                className="bsd-input"
                value={formData.email}
                onChange={update('email')}
                placeholder="newadmin@brightsmile.demo"
              />
            </div>

            <div className="bsd-row">
              <div className="bsd-group">
                <label className="bsd-label" htmlFor="bsd-phone">Phone (optional)</label>
                <input
                  id="bsd-phone"
                  type="tel"
                  className="bsd-input"
                  value={formData.phone}
                  onChange={update('phone')}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="bsd-group">
                <label className="bsd-label" htmlFor="bsd-password">Temporary password</label>
                <input
                  id="bsd-password"
                  type="password"
                  required
                  minLength={6}
                  className="bsd-input"
                  value={formData.password}
                  onChange={update('password')}
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div className="bsd-group">
              <label className="bsd-label" htmlFor="bsd-role">Role</label>
              <select
                id="bsd-role"
                className="bsd-input"
                value={formData.role}
                onChange={update('role')}
              >
                <option value="admin">Clinic Administrator (full access)</option>
                <option value="staff">Clinic Staff (limited access)</option>
              </select>
            </div>

            <div className="bsd-actions">
              <button type="button" className="bsd-btn bsd-btn-ghost" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="bsd-btn bsd-btn-primary" disabled={loading}>
                {loading ? 'Creating account…' : submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/* Styles are scoped with the "bsd-" prefix so they work without extra global CSS.
   Palette taken from the mockup: teal primary, deep navy text, soft aqua surfaces. */
const css = `
.bsd-overlay {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  background: rgba(11, 42, 74, 0.55);
  backdrop-filter: blur(2px);
}
.bsd-card {
  position: relative;
  width: 100%; max-width: 460px; max-height: 92vh; overflow-y: auto;
  padding: 28px;
  background: #ffffff;
  border-radius: 16px;
  border-top: 4px solid #1597a5;
  box-shadow: 0 20px 50px rgba(11, 42, 74, 0.25);
  font-family: inherit;
}
.bsd-close {
  position: absolute; top: 14px; right: 14px;
  display: grid; place-items: center;
  width: 32px; height: 32px;
  border: 0; border-radius: 50%;
  background: transparent; color: #7a8ca3; cursor: pointer;
}
.bsd-close:hover { background: #e8f6f8; color: #0b2a4a; }
.bsd-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-right: 28px; }
.bsd-icon {
  display: grid; place-items: center; flex: none;
  width: 42px; height: 42px; border-radius: 12px;
  background: #e8f6f8; color: #1597a5;
}
.bsd-title { margin: 0; font-size: 18px; font-weight: 700; color: #0b2a4a; }
.bsd-sub { margin: 2px 0 0; font-size: 13px; color: #5b6f86; }
.bsd-error {
  margin-bottom: 16px; padding: 10px 12px;
  border: 1px solid #f5c2c2; border-radius: 10px;
  background: #fdf0f0; color: #b42323; font-size: 13px;
}
.bsd-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; flex: 1; min-width: 0; }
.bsd-row { display: flex; gap: 12px; }
.bsd-label { font-size: 13px; font-weight: 600; color: #0b2a4a; }
.bsd-input {
  width: 100%; box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #cfe3e8; border-radius: 10px;
  background: #f7fcfd; color: #0b2a4a;
  font: inherit; font-size: 14px;
}
.bsd-input::placeholder { color: #9fb1c2; }
.bsd-input:focus {
  outline: none; border-color: #1597a5; background: #ffffff;
  box-shadow: 0 0 0 3px rgba(21, 151, 165, 0.18);
}
.bsd-actions { display: flex; gap: 10px; margin-top: 8px; }
.bsd-btn {
  padding: 11px 18px; border-radius: 999px;
  font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.bsd-btn-primary { flex: 1; border: 0; background: #1597a5; color: #ffffff; }
.bsd-btn-primary:hover:not(:disabled) { background: #0f7f8b; }
.bsd-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
.bsd-btn-ghost { border: 1px solid #1597a5; background: transparent; color: #1597a5; }
.bsd-btn-ghost:hover { background: #e8f6f8; }
.bsd-btn:focus-visible, .bsd-close:focus-visible { outline: 3px solid rgba(21, 151, 165, 0.4); outline-offset: 2px; }
@media (max-width: 480px) {
  .bsd-row { flex-direction: column; gap: 0; }
  .bsd-card { padding: 22px; }
}
`;
