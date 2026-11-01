import { COURSES } from '../config/content'

export function CourseOverview() {
  return (
    <section className="section section--courses" id="cursuri" aria-labelledby="cursuri-title">
      <div className="section__inner">
        <header className="section__head">
          <p className="chart-label section__kicker">Cursuri · tabel de adâncimi</p>
          <h2 id="cursuri-title">Alege adâncimea cu care vrei să începi</h2>
          <p>
            Fiecare traseu are propriul ritm. Dacă nu știi de unde să pornești, spune-ne cât ai navigat până acum și îți recomandăm primul pas.
          </p>
        </header>
        <ol className="course-list">
          {COURSES.map((c, i) => (
            <li key={c.title} className="course">
              <span className="course__num chart-label" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <div className="course__main">
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
              <p className="course__level chart-label">
                <span className="visually-hidden">Nivel: </span>
                {c.level}
              </p>
              <a className="course__link" href="#contact" data-interest={c.interest}>
                Solicită detalii<span className="visually-hidden"> despre {c.title}</span>
              </a>
            </li>
          ))}
        </ol>
        <p className="section__note chart-label">Prețurile și datele se comunică la cerere.</p>
      </div>
    </section>
  )
}
