import { useState } from 'react';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import { CLINIC, IMAGES } from '../data/siteData';

const MAP_SRC =
  'https://www.openstreetmap.org/export/embed.html?bbox=-74.0100%2C40.7400%2C-73.9600%2C40.7700&layer=mapnik&marker=40.7527%2C-73.9972';

export default function Contact({ onOpenModal, onNavigate }) {
  const [submitted, setSubmitted] = useState(false);

  // NOTE: this only shows the thank-you message; nothing is sent to a server yet.
  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <section className="page-hero" style={{ backgroundImage: `url(${IMAGES.contactHero})` }}>
        <div className="container">
          <h1>Contact Us</h1>
          <p>We’re here to help. Get in touch with our friendly team for any questions or appointment requests.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            <div>
              <h2>Get in Touch</h2>
              <p className="lead">We’d love to hear from you. Fill out the form below and we’ll get back to you as soon as possible.</p>

              {submitted ? (
                <div className="alert-success" role="status">
                  Thank you! Your message has been sent to our office staff.
                </div>
              ) : (
                <form onSubmit={handleContactSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="c-name">Full name *</label>
                    <input id="c-name" type="text" required className="form-input" placeholder="Enter your full name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="c-email">Email address *</label>
                    <input id="c-email" type="email" required className="form-input" placeholder="Enter your email address" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="c-phone">Phone number</label>
                    <input id="c-phone" type="tel" className="form-input" placeholder="Enter your phone number" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="c-msg">Message *</label>
                    <textarea id="c-msg" required rows="4" className="form-input" placeholder="How can we help you?" />
                  </div>
                  <button type="submit" className="btn-primary btn-block">
                    <Send size={15} /> Send Message
                  </button>
                </form>
              )}
            </div>

            <aside>
              <h2 style={{ marginBottom: 18 }}>Clinic Information</h2>
              <div className="info-item">
                <span className="icon-tile"><MapPin size={18} /></span>
                <div><h4>Address</h4><p>{CLINIC.address.join(', ')}</p></div>
              </div>
              <div className="info-item">
                <span className="icon-tile"><Phone size={18} /></span>
                <div><h4>Phone</h4><p>{CLINIC.phone}</p></div>
              </div>
              <div className="info-item">
                <span className="icon-tile"><Mail size={18} /></span>
                <div><h4>Email</h4><p>{CLINIC.email}</p></div>
              </div>

              <h2 style={{ margin: '26px 0 8px', fontSize: '1.05rem' }}>Opening Hours</h2>
              <table className="hours">
                <tbody>
                  {CLINIC.hours.map(([day, time]) => (
                    <tr key={day}><td>{day}</td><td>{time}</td></tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="btn-secondary btn-block" style={{ marginTop: 18 }} onClick={onOpenModal}>
                Book an Appointment
              </button>
            </aside>
          </div>

          <div className="map-box" style={{ marginTop: 40 }}>
            <iframe title="Clinic location map" src={MAP_SRC} loading="lazy" />
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 64 }}>
        <div className="cta-band">
          <h2>Ready for a Healthier, Brighter Smile?</h2>
          <p>Book your appointment today and take the first step towards better oral health.</p>
          <button type="button" className="btn-primary" onClick={onOpenModal}>Book Appointment</button>
          {' '}
          <a href="#services" className="btn-secondary" onClick={(e) => { e.preventDefault(); onNavigate('services'); }}>View Services</a>
        </div>
      </section>
    </>
  );
}
