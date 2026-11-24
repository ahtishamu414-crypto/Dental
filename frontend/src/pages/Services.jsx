import useScrollReveal from '../hooks/useScrollReveal';

const SERVICES = [
  { name: 'General Checkup', price: '$150', duration: '30m', desc: 'Comprehensive oral examination including digital low-radiation X-rays and cavity screening.', popular: true },
  { name: 'Professional Cleaning', price: '$200', duration: '45m', desc: 'Plaque and tartar removal by registered hygienists followed by enamel polishing.', popular: true },
  { name: 'Teeth Whitening', price: '$450', duration: '60m', desc: 'Professional in-office laser whitening treatment for immediate bright results.' },
  { name: 'Dental Fillings', price: '$250', duration: '60m', desc: 'Durable composite resin fillings matched perfectly to your natural enamel color.' },
  { name: 'Root Canal Therapy', price: '$1,200', duration: '90m', desc: 'Gentle treatment to eliminate dental pulp infection and preserve your natural tooth.' },
  { name: 'Tooth Extraction', price: '$300', duration: '60m', desc: 'Safe, comfortable extraction for non-restorable or problematic teeth.' },
  { name: 'Orthodontic Consultation', price: '$180', duration: '45m', desc: 'Initial clinical assessment and digital alignment planning for braces or clear aligners.' },
];

export default function Services({ onOpenModal }) {
  const cardsRef = useScrollReveal('.reveal', { stagger: 90 });

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="pill" style={{ marginBottom: 12 }}>Transparent Healthcare</span>
          <h1>Our Dental Treatments</h1>
          <p>Upfront prices with zero hidden office fees. Covered by most major insurance providers.</p>
        </div>
      </section>

      <section className="section" ref={cardsRef}>
        <div className="container grid-3">
          {SERVICES.map((s) => (
            <article key={s.name} className="card price-card reveal">
              <div className="title-row">
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.name}
                    {s.popular && (
                      <span className="pill" style={{ fontSize: '10px', padding: '2px 8px' }}>
                        Popular
                      </span>
                    )}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Duration: {s.duration}</span>
                </div>
                <span className="badge badge-pending" style={{ fontSize: '13px', fontWeight: 700 }}>
                  {s.price}
                </span>
              </div>
              <p>{s.desc}</p>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => onOpenModal(s.name)}
              >
                Request This Service →
              </button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
