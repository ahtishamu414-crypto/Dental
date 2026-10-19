import { MapPin, Phone, Mail } from 'lucide-react';
import { CLINIC } from '../data/siteData';
import Logo from './Logo';

const QUICK_LINKS = [
  ['Home', 'home'],
  ['About', 'about'],
  ['Services', 'services'],
  ['Contact', 'contact'],
];

// Text badges instead of brand icons (newer lucide-react versions no longer ship them)
const SOCIAL = [
  ['f', 'Facebook'],
  ['ig', 'Instagram'],
  ['x', 'X (Twitter)'],
  ['in', 'LinkedIn'],
];

export default function Footer({ onNavigate }) {
  const go = (target) => (e) => {
    e.preventDefault();
    onNavigate(target);
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <a href="#home" className="logo" onClick={go('home')}>
              <Logo color="#5fd0dc" /> Bright Smile Dental
            </a>
            <p className="footer-note">Healthy smiles, brighter futures.</p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <ul>
              {QUICK_LINKS.map(([label, target]) => (
                <li key={target}><a href={`#${target}`} onClick={go(target)}>{label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Contact Info</h4>
            <ul>
              <li><MapPin size={15} /> {CLINIC.address.join(', ')}</li>
              <li><Phone size={15} /> {CLINIC.phone}</li>
              <li><Mail size={15} /> {CLINIC.email}</li>
            </ul>
          </div>

          <div>
            <h4>Follow Us</h4>
            <div className="social">
              {SOCIAL.map(([text, label]) => (
                <a key={label} href="#" aria-label={label} onClick={(e) => e.preventDefault()} style={{ fontSize: 12, fontWeight: 700 }}>{text}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Bright Smile Dental. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
