export function CrewSection() {
  const slots = ['Instructor', 'Instructor', 'Skipper', 'Echipaj de suport']
  return (
    <section className="section section--crew" id="echipaj" aria-labelledby="crew-title">
      <div className="section__inner">
        <header className="section__head">
          <p className="chart-label section__kicker">Echipajul · în curs de completare</p>
          <h2 id="crew-title">Oamenii de la bord</h2>
          <p>
            Aici vor apărea instructorii și skipperii care te însoțesc: fotografie, nume, experiență reală. Până atunci, spațiile de mai jos rămân rezervate.
          </p>
        </header>
        <ul className="crew-grid">
          {slots.map((r, i) => (
            <li key={i} className="crew-card">
              <svg viewBox="0 0 80 96" aria-hidden="true" focusable="false">
                <circle cx="40" cy="32" r="16" />
                <path d="M10,92 C10,62 70,62 70,92" />
              </svg>
              <p className="chart-label">{r}</p>
              <p className="crew-card__hint">Nume, rol și prezentare — de adăugat</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
