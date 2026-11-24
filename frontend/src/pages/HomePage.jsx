import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Smile, ShieldCheck, Crown, Stethoscope, Cpu, Armchair,
  HeartHandshake, CalendarCheck, Building2, ArrowRight,
} from 'lucide-react';
import heroDentalImg from '../assets/images/hero-dental.jpg';
import { IMAGES } from '../data/siteData';
import useScrollReveal from '../hooks/useScrollReveal';

const SERVICES = [
  { title: 'Teeth Cleaning', desc: 'Keep your teeth healthy and your smile bright.', icon: Sparkles, img: IMAGES.cleaning },
  { title: 'Teeth Whitening', desc: 'A brighter, more confident smile.', icon: Smile, img: IMAGES.whitening },
  { title: 'Dental Fillings', desc: 'Restore your teeth and protect your smile.', icon: ShieldCheck, img: IMAGES.fillings },
  { title: 'Dental Crowns', desc: 'Strengthen and protect damaged teeth.', icon: Crown, img: IMAGES.crowns },
];

const FEATURES = [
  { title: 'Experienced Team', desc: 'Skilled and caring dental professionals.', icon: Stethoscope },
  { title: 'Modern Technology', desc: 'Advanced technology for better care.', icon: Cpu },
  { title: 'Comfortable Environment', desc: 'A relaxing and welcoming atmosphere.', icon: Armchair },
  { title: 'Patient Focused', desc: 'Your comfort and health are our priority.', icon: HeartHandshake },
];

const STEPS = [
  { title: 'Book Appointment', desc: 'Schedule your visit online or by phone.', icon: CalendarCheck },
  { title: 'Visit Our Clinic', desc: 'Meet our friendly team and get your checkup.', icon: Building2 },
  { title: 'Get Treatment', desc: 'Receive personalized care and treatment.', icon: Stethoscope },
  { title: 'Maintain Your Smile', desc: 'Regular visits keep your smile healthy.', icon: Smile },
];

const REVIEWS = [
  { name: 'Sarah Johnson', text: 'The staff is amazing and so professional. My whole experience was great!' },
  { name: 'Michael Davis', text: 'I never felt more comfortable at a dental clinic. Highly recommended!' },
  { name: 'Emily Brooks', text: 'Excellent care and friendly service. My smile has never looked better!' },
];

const initials = (name) => name.split(' ').map((p) => p[0]).join('');

function AnimatedStat({ value, suffix = '', label, isFloat = false }) {
  const [count, setCount] = useState(0);
  const statRef = useRef(null);

  useEffect(() => {
    const el = statRef.current;
    if (!el) return;

    let started = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          const startTime = performance.now();
          const duration = 1600;
          const target = isFloat ? Math.round(value * 10) : value;

          const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, isFloat]);

  const display = isFloat ? (count / 10).toFixed(1) : count.toLocaleString();

  return (
    <div ref={statRef}>
      <div className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--teal)' }}>
        {display}{suffix}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default function HomePage({ onOpenModal, onNavigate }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Scroll reveal refs for each section
  const servicesRef = useScrollReveal('.reveal');
  const featuresRef = useScrollReveal('.reveal', { stagger: 120 });
  const aiRef = useScrollReveal('.reveal-scale');
  const stepsRef = useScrollReveal('.reveal');
  const reviewsRef = useScrollReveal('.reveal');
  const ctaRef = useScrollReveal('.reveal-scale');

  const go = (page) => (e) => {
    e.preventDefault();
    onNavigate(page);
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="pill hero-welcome-pill">
              <Sparkles size={14} className="hero-welcome-sparkle" /> Welcome to Bright Smile Dental
            </span>
            <h1 className="hero-title-reveal">Your Smile Deserves the Best Care.</h1>
            <p className="lead hero-lead-reveal">
              Professional dental care, a welcoming experience, and convenient appointment requests.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn-primary" onClick={onOpenModal}>Book Appointment</button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
              >
                <Sparkles size={16} /> Ask AI Receptionist
              </button>
              <a href="#services" className="btn-link" onClick={go('services')} style={{ marginLeft: 6 }}>
                Explore Services →
              </a>
            </div>

            {/* Animated Trust Stats */}
            <div style={{ display: 'flex', gap: 28, marginTop: 28, flexWrap: 'wrap' }}>
              <AnimatedStat value={2400} suffix="+" label="Smiles Restored" />
              <AnimatedStat value={4.9} suffix=" ★" label="Patient Rating" isFloat />
              <AnimatedStat value={14} suffix="+" label="Years Experience" />
            </div>
          </div>
          <div className="hero-photo-wrap">
            <div
              className="hero-photo-container"
              style={{
                backgroundImage: imgError ? `url(${IMAGES.hero})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!imgLoaded && !imgError && (
                <div className="hero-photo-skeleton" aria-hidden="true" />
              )}
              {!imgError ? (
                <img
                  src={heroDentalImg}
                  alt="Modern Bright Smile Dental clinic room with dentist and smiling patient receiving gentle, professional dental care"
                  className={`hero-photo-img ${imgLoaded ? 'loaded' : ''}`}
                  loading="eager"
                  fetchPriority="high"
                  onLoad={() => setImgLoaded(true)}
                  onError={() => {
                    setImgError(true);
                    setImgLoaded(true);
                  }}
                />
              ) : (
                <div
                  className="hero-photo-fallback"
                  role="img"
                  aria-label="Bright Smile Dental modern clinic interior"
                >
                  <Sparkles size={40} style={{ marginBottom: 12, opacity: 0.9 }} />
                  <strong style={{ fontSize: '1.25rem', marginBottom: 6 }}>Bright Smile Dental</strong>
                  <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Over 2,400+ Smiles Restored in Midtown Manhattan</span>
                </div>
              )}
            </div>
            <div className="hero-trust-badge">
              <span className="hero-trust-star">★ 4.9</span>
              <div>
                <strong>Over 2,400+ Smiles Restored</strong>
                <span>Top-rated clinic in Midtown Manhattan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" ref={servicesRef}>
        <div className="container">
          <div className="section-head reveal">
            <h2>Our Dental Services</h2>
            <p>Comprehensive dental care for a healthier, brighter smile.</p>
          </div>
          <div className="grid-4">
            {SERVICES.map(({ title, desc, icon: Icon, img }) => (
              <article key={title} className="service-card reveal">
                <div className="service-photo" style={{ backgroundImage: `url(${img})` }} />
                <div className="service-body">
                  <span className="service-icon"><Icon size={18} /></span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <button
                      type="button"
                      className="link-arrow"
                      style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }}
                      onClick={() => onOpenModal(title)}
                    >
                      Book this <ArrowRight size={13} />
                    </button>
                    <a href="#services" className="small-note" onClick={go('services')} style={{ color: 'var(--muted)' }}>
                      Details
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-band" ref={featuresRef}>
        <div className="container">
          <div className="section-head reveal">
            <h2>Why Choose Bright Smile Dental?</h2>
            <p>We're committed to providing exceptional dental care and a positive experience.</p>
          </div>
          <div className="grid-4">
            {FEATURES.map(({ title, desc, icon: Icon }) => (
              <div key={title} className="feature reveal">
                <div className="feature-icon"><Icon size={28} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 24/7 AI Receptionist Showcase */}
      <section className="section" ref={aiRef} style={{ background: '#ffffff', paddingTop: 40, paddingBottom: 40 }}>
        <div className="container">
          <div className="ai-showcase-panel reveal-scale">
            <div>
              <span className="pill" style={{ background: '#1597a5', color: '#fff', marginBottom: 12 }}>
                ✨ 24/7 AI Dental Receptionist
              </span>
              <h2 style={{ fontSize: '1.7rem', color: '#0b2a4a', margin: '10px 0' }}>
                Instant Answers & Scheduling Assistance
              </h2>
              <p style={{ color: '#5b6f86', fontSize: '14.5px', lineHeight: 1.6, marginBottom: 20 }}>
                Never wait on hold. Ask our 24/7 AI receptionist about service prices, insurance acceptance, dentist specialties, or available appointment slots.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
                >
                  <Sparkles size={16} /> Chat with AI Helper
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onOpenModal}
                >
                  <CalendarCheck size={16} /> Book Appointment
                </button>
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: 14,
              padding: 20,
              border: '1px solid #d6e8ec',
              boxShadow: '0 8px 24px rgba(11, 42, 74, 0.05)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1597a5', textTransform: 'uppercase', marginBottom: 10 }}>
                💡 Try asking our AI helper:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'How much does a teeth cleaning cost?',
                  'Who are your dentists and their specialties?',
                  'Do you accept Delta Dental or MetLife?',
                  'What are your Saturday or evening hours?'
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: '#f8fcfe',
                      color: '#0b2a4a',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" ref={stepsRef}>
        <div className="container">
          <div className="section-head reveal">
            <h2>How It Works</h2>
            <p>Getting started is easy. Here's how it works.</p>
          </div>
          <div className="steps steps-animated">
            {STEPS.map(({ title, desc, icon: Icon }, i) => (
              <div key={title} className="step reveal">
                <span className="step-num">{i + 1}</span>
                <div>
                  <div className="step-icon"><Icon size={26} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container" ref={reviewsRef} style={{ paddingBottom: 64 }}>
        <div className="panel-dark reveal-scale">
          <h2>What Our Patients Say</h2>
          <p className="sub">Real stories from real patients. (Fictional demo content)</p>
          <div className="grid-3">
            {REVIEWS.map(({ name, text }) => (
              <figure key={name} className="quote-card reveal" style={{ margin: 0 }}>
                <span className="avatar">{initials(name)}</span>
                <figcaption>
                  <p>"{text}"</p>
                  <strong>{name}</strong>
                  <span>Patient</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="container" ref={ctaRef} style={{ paddingBottom: 64 }}>
        <div className="cta-band reveal-scale">
          <h2>Have questions? We're here to help.</h2>
          <p>Reach out to our friendly team or chat with our AI receptionist any time.</p>
          <a href="#contact" className="btn-primary" onClick={go('contact')}>Get in Touch</a>
        </div>
      </section>
    </>
  );
}
