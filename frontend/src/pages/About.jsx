import { Heart, Scale, Award, Users, Target, Eye, Check } from 'lucide-react';
import { IMAGES } from '../data/siteData';
import drSarah from '../assets/images/dr-sarah-jenkins.jpg';
import drMichael from '../assets/images/dr-michael-chen.jpg';
import drEmily from '../assets/images/dr-emily-rodriguez.jpg';

const VALUES = [
  { title: 'Compassion', desc: 'We treat every patient like family.', icon: Heart },
  { title: 'Integrity', desc: 'We are honest, transparent and ethical.', icon: Scale },
  { title: 'Excellence', desc: 'We strive for the highest quality in everything we do.', icon: Award },
  { title: 'Community', desc: 'We support healthier communities through education and care.', icon: Users },
];

const WHY = [
  'Experienced and caring dental professionals',
  'State-of-the-art technology and modern facilities',
  'Personalized treatment plans',
  'Comfortable and relaxing environment',
  'Convenient appointment scheduling',
];

const TEAM = [
  {
    name: 'Dr. Sarah Jenkins, DDS',
    role: 'Lead Preventative & General Dentist',
    experience: '14+ years experience',
    doctorId: 'Dr. Sarah Jenkins (General & Preventative)',
    image: drSarah,
  },
  {
    name: 'Dr. Michael Chen, DMD',
    role: 'Orthodontist & Cosmetic Smile Specialist',
    experience: '10+ years experience',
    doctorId: 'Dr. Michael Chen (Orthodontics & Cosmetic)',
    image: drMichael,
  },
  {
    name: 'Dr. Emily Rodriguez, DDS',
    role: 'Oral Surgery & Endodontics Specialist',
    experience: '10+ years experience',
    doctorId: 'Dr. Emily Rodriguez (Oral Surgery & Endodontics)',
    image: drEmily,
  },
];

export default function About({ onOpenModal }) {
  return (
    <>
      <section className="page-hero" style={{ backgroundImage: `url(${IMAGES.aboutHero})` }}>
        <div className="container">
          <h1>About Bright Smile Dental</h1>
          <p>Compassionate care. Modern dentistry. A healthier tomorrow.</p>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="split-photo" style={{ backgroundImage: `url(${IMAGES.story})` }} role="img" aria-label="Dentist treating a patient" />
          <div>
            <h2>Our Story</h2>
            <p>
              Bright Smile Dental was founded with a simple mission: to provide high-quality, compassionate dental
              care in a comfortable and welcoming environment. We believe that everyone deserves a healthy smile
              and the confidence that comes with it.
            </p>
            <p>
              Our modern clinic in Midtown Manhattan combines advanced technology with a personalized approach to
              ensure the best possible care for every patient.
            </p>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 64 }}>
        <div className="grid-2">
          <div className="mv-card">
            <span className="icon-tile"><Target size={20} /></span>
            <h3>Our Mission</h3>
            <p>To improve oral health and transform lives through exceptional dental care, education, and lasting relationships with our patients.</p>
          </div>
          <div className="mv-card">
            <span className="icon-tile"><Eye size={20} /></span>
            <h3>Our Vision</h3>
            <p>To be the most trusted and preferred dental clinic, known for our excellence in care, innovation, and patient satisfaction.</p>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 64 }}>
        <div className="section-head" style={{ textAlign: 'left', margin: '0 0 28px' }}>
          <h2>Our Values</h2>
          <p>The principles that guide everything we do.</p>
        </div>
        <div className="grid-4">
          {VALUES.map(({ title, desc, icon: Icon }) => (
            <div key={title} className="value feature">
              <div className="feature-icon"><Icon size={26} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>Meet Our Clinical Specialists</h2>
            <p>Board-certified dentists and hygienists dedicated to your comfort.</p>
          </div>
          <div className="grid-3">
            {TEAM.map((m) => (
              <article key={m.name} className="service-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="service-photo tall" style={{ backgroundImage: `url(${m.image})` }} role="img" aria-label={m.name} />
                <div className="team-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span className="badge badge-pending" style={{ alignSelf: 'flex-start' }}>{m.experience}</span>
                  <h3 style={{ marginTop: 8 }}>{m.name}</h3>
                  <p style={{ marginBottom: 16 }}>{m.role}</p>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    style={{ marginTop: 'auto', width: '100%' }}
                    onClick={() => onOpenModal(null, m.doctorId)}
                  >
                    Book with {m.name.split(',')[0]} →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '64px 20px 0' }}>
        <div className="why-panel">
          <div className="split-photo" style={{ backgroundImage: `url(${IMAGES.whyUs})` }} role="img" aria-label="Smiling dentist" />
          <div className="why-body">
            <h3>Why Choose Us?</h3>
            <ul className="check-list">
              {WHY.map((item) => (
                <li key={item}><Check size={16} /> {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '64px 20px 0' }}>
        <div className="cta-band">
          <h2>Ready to Experience Better Dental Care?</h2>
          <p>Book your consultation online or talk with our 24/7 AI receptionist directly.</p>
          <button type="button" className="btn-primary" onClick={onOpenModal}>Schedule Your Appointment</button>
        </div>
      </section>
    </>
  );
}
