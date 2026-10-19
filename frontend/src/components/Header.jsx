import { Link, useLocation } from 'react-router-dom'; // Or use simple state navigation
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation(); // To highlight active link

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #e0f2fe',
      padding: '12px 0'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>🦷</span>
          <span style={{ fontWeight: '800', fontSize: '20px', color: '#0284c7', letterSpacing: '-0.5px' }}>
            Bright Smile Dental
          </span>
        </div>

        {/* Navigation Links (Desktop) */}
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {['Home', 'About', 'Services', 'Contact'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              style={{ 
                textDecoration: 'none', 
                color: location.pathname === `/${item.toLowerCase()}` ? '#0284c7' : '#475569',
                fontWeight: '600', 
                fontSize: '14px',
                transition: 'color 0.2s'
              }}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Auth Section / CTA Button */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                👤 {user.full_name}
              </span>
              <button 
                onClick={logout}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <button style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                Login
              </button>
              <button className="btn-primary" style={{ padding: '10px 20px' }}>
                Book Appointment
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}