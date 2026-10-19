import { useState } from 'react';
import { Menu, X, LayoutDashboard, LogOut, Sparkles } from 'lucide-react';
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

  const go = (target) => (e) => {
    e?.preventDefault();
    setOpen(false);
    onNavigate(target);
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <a href="#home" className="logo" onClick={go('home')}>
          <Logo /> Bright Smile Dental
        </a>

        <nav className={`nav-links${open ? ' open' : ''}`} aria-label="Main">
          {LINKS.map(([label, target]) => (
            <a key={target} href={`#${target}`} className={page === target ? 'active' : ''} onClick={go(target)}>
              {label}
            </a>
          ))}
          {!user && (
            <>
              <a href="#login" className="mobile-only" onClick={go('login')}>Login</a>
              <a href="#register" className="mobile-only" onClick={go('register')}>Register</a>
            </>
          )}
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <button type="button" className="btn-secondary btn-sm" onClick={go(user.role === 'admin' ? 'admin' : 'dashboard')}>
                <LayoutDashboard size={14} /> {user.role === 'admin' ? 'Admin portal' : 'My portal'}
              </button>
              <button type="button" className="btn-link" onClick={handleLogout} aria-label="Log out" title="Log out">
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-link nav-auth-text" onClick={go('login')}>Login</button>
              <button type="button" className="btn-link nav-auth-text" onClick={go('register')}>Register</button>
            </>
          )}
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
            title="Chat with 24/7 AI Receptionist"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Sparkles size={13} color="var(--teal)" /> Ask AI
          </button>
          <button type="button" className="btn-primary btn-sm" onClick={onOpenModal}>
            Book Appointment
          </button>
          <button type="button" className="nav-toggle" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
