const SERVICES = [
  { name: 'General Checkup', price: '$150', desc: 'Comprehensive oral examination including digital low-radiation X-rays and cavity screening.' },
  { name: 'Professional Cleaning', price: '$200', desc: 'Plaque and tartar removal by registered hygienists followed by enamel polishing.' },
  { name: 'Teeth Whitening', price: '$450', desc: 'Professional in-office laser whitening treatment for immediate bright results.' },
  { name: 'Dental Fillings', price: '$250 per tooth', desc: 'Durable composite resin fillings matched perfectly to your natural enamel color.' },
  { name: 'Root Canal Therapy', price: '$1,200', desc: 'Gentle treatment to eliminate dental pulp infection and preserve your natural tooth.' },
  { name: 'Tooth Extraction', price: '$300', desc: 'Safe, comfortable extraction for non-restorable or problematic teeth.' },
  { name: 'Orthodontic Consultation', price: '$100', desc: 'Initial clinical assessment and digital alignment planning for braces or clear aligners.' },
];

export default function Services({ onOpenModal }) {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Our Dental Treatments</h1>
          <p>Upfront prices with zero hidden office fees. Covered by most major insurance providers.</p>
        </div>
      </section>

      <section className="section">
        <div className="container grid-3">
          {SERVICES.map((s) => (
            <article key={s.name} className="card price-card">
              <div className="title-row">
                <h3>{s.name}</h3>
                <span className="badge badge-pending">{s.price}</span>
              </div>
              <p>{s.desc}</p>
              <button type="button" className="btn-secondary btn-sm" onClick={onOpenModal}>
                Request This Service
              </button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
