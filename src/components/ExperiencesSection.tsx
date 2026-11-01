import { EXPERIENCES } from '../config/content'

export function ExperiencesSection() {
  return (
    <section className="section section--experiences" id="experiente" aria-labelledby="exp-title">
      <div className="section__inner section__inner--split">
        <header className="section__head">
          <p className="chart-label section__kicker">Experiențe · larg de țărm</p>
          <h2 id="exp-title">Zile întregi pe apă, cu un echipaj pe care te poți baza</h2>
          <p>
            Dacă ai făcut deja primii pași — sau vrei doar să trăiești marea altfel — alege un tip de ieșire. Destinațiile și datele sunt stabilite împreună cu tine.
          </p>
        </header>
        <ul className="exp-list">
          {EXPERIENCES.map((e) => (
            <li key={e.title}>
              <h3>{e.title}</h3>
              <p>{e.text}</p>
              <a href="#contact" data-interest="experiente">
                Solicită detalii<span className="visually-hidden"> despre {e.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
