import { useState, useEffect } from 'react';
import { Menu, X, LayoutDashboard, LogOut, Sparkles, Calendar, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const LINKS = [
  ['Home', 'home'],
  ['About', 'about'],
  ['Services', 'services'],
  ['Contact', 'contact'],
];

export default function Navbar({ page, onNavigate, onOpenModal }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // Close on Escape or page change
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (target) => (e) => {
    e?.preventDefault();
    setOpen(false);
    onNavigate(target);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    onNavigate('home');
  };

  const handleOpenAi = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('open-ai-chat'));
  };

  const handleBook = () => {
    setOpen(false);
    onOpenModal();
  };

  return (
    <>
      <header className="navbar">
        <div className="container nav-inner">
          <a href="#home" className="logo" onClick={go('home')}>
            <Logo /> Bright Smile Dental
          </a>

          {/* Desktop Navigation Links */}
          <nav className="nav-links desktop-only" aria-label="Main">
            {LINKS.map(([label, target]) => (
              <a
                key={target}
                href={`#${target}`}
                className={page === target ? 'active' : ''}
                onClick={go(target)}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Header Action Buttons */}
          <div className="nav-actions">
            {user ? (
              <div className="desktop-only" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={go(user.role === 'admin' ? 'admin' : 'dashboard')}
                >
                  <LayoutDashboard size={14} /> {user.role === 'admin' ? 'Admin portal' : 'My portal'}
                </button>
                <button
                  type="button"
                  className="btn-link"
                  onClick={handleLogout}
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="desktop-only" style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                <button type="button" className="btn-link" onClick={go('login')}>Login</button>
                <button type="button" className="btn-link" onClick={go('register')}>Register</button>
              </div>
            )}

            <button
              type="button"
              className="btn-secondary btn-sm desktop-only"
              onClick={handleOpenAi}
              title="Chat with 24/7 AI Receptionist"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Sparkles size={13} color="var(--teal)" /> Ask AI
            </button>

            {/* Direct Booking CTA - always accessible */}
            <button
              type="button"
              className="btn-primary btn-sm nav-book-btn"
              onClick={handleBook}
            >
              <Calendar size={13} className="mobile-only" style={{ display: 'none' }} />
              <span className="book-text-full">Book Appointment</span>
              <span className="book-text-short">Book</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="nav-toggle"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={open}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        <div className={`nav-mobile-drawer ${open ? 'open' : ''}`}>
          <div className="mobile-nav-inner">
            <div className="mobile-links-group">
              {LINKS.map(([label, target]) => (
                <a
                  key={target}
                  href={`#${target}`}
                  className={`mobile-nav-link ${page === target ? 'active' : ''}`}
                  onClick={go(target)}
                >
                  {label}
                  <ArrowRight size={14} className="mobile-link-arrow" />
                </a>
              ))}
            </div>

            <div className="mobile-divider" />

            {/* AI Receptionist Button in Drawer */}
            <button
              type="button"
              className="mobile-ai-btn"
              onClick={handleOpenAi}
            >
              <Sparkles size={16} color="var(--teal)" />
              <div>
                <strong>24/7 AI Dental Receptionist</strong>
                <span>Ask about prices, dentists, and open slots</span>
              </div>
            </button>

            <div className="mobile-divider" />

            {/* Auth / Account State */}
            {user ? (
              <div className="mobile-user-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mobile-user-avatar"><User size={16} /></span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{user.full_name || 'Patient'}</div>
                    <div className="small-note">{user.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={go(user.role === 'admin' ? 'admin' : 'dashboard')}
                  >
                    <LayoutDashboard size={14} /> {user.role === 'admin' ? 'Admin Portal' : 'My Portal'}
                  </button>
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mobile-auth-grid">
                <button type="button" className="btn-secondary btn-block" onClick={go('login')}>
                  Sign In
                </button>
                <button type="button" className="btn-primary btn-block" onClick={go('register')}>
                  Create Account
                </button>
              </div>
            )}

            <button
              type="button"
              className="btn-primary btn-block"
              style={{ marginTop: 14 }}
              onClick={handleBook}
            >
              <Calendar size={15} /> Book Appointment Online
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop overlay for mobile menu */}
      {open && <div className="nav-backdrop" onClick={() => setOpen(false)} />}
    </>
  );
}
