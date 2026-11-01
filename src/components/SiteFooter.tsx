import { BRAND } from '../config/brand'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <svg className="site-footer__waves" viewBox="0 0 1600 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0,20 C100,4 200,36 300,20 S500,4 600,20 S800,36 900,20 S1100,4 1200,20 S1400,36 1500,20 L1600,20" />
      </svg>
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__brand">{BRAND.name}</p>
          <p>{BRAND.tagline}</p>
        </div>
        <div>
          <p className="chart-label">Contact</p>
          <p>{BRAND.email || 'Date de contact — de completat'}</p>
          {BRAND.phone && <p>{BRAND.phone}</p>}
          {BRAND.address && <p>{BRAND.address}</p>}
        </div>
        <nav aria-label="Subsol">
          <p className="chart-label">Hartă</p>
          <ul>
            <li><a href="#cursuri">Cursuri</a></li>
            <li><a href="#experiente">Experiențe</a></li>
            <li><a href="#echipaj">Echipaj</a></li>
            <li><a href={BRAND.privacyUrl}>Politica de confidențialitate</a></li>
          </ul>
        </nav>
      </div>
      <p className="site-footer__fine chart-label">© {new Date().getFullYear()} {BRAND.name} · Concept demonstrativ</p>
    </footer>
  )
}
