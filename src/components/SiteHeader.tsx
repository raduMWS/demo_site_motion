import { useState } from 'react'
import { BRAND } from '../config/brand'

const LINKS = [
  { href: '#cursuri', label: 'Cursuri' },
  { href: '#experiente', label: 'Experiențe' },
  { href: '#echipaj', label: 'Echipaj' },
  { href: '#contact', label: 'Contact' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="site-header">
      <a className="site-header__brand" href="#top" aria-label={`${BRAND.name} – început`}>
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <circle cx="16" cy="16" r="13" />
          <path d="M16,5 L19,16 L16,27 L13,16Z" />
          <path d="M5,16 H27" />
        </svg>
        <span>{BRAND.name}</span>
      </a>
      <button
        type="button"
        className="site-header__toggle"
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="chart-label">{open ? 'Închide' : 'Meniu'}</span>
      </button>
      <nav id="site-nav" className="site-header__nav" data-open={open} aria-label="Principal">
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a className="btn btn--small btn--primary" href="#contact" onClick={() => setOpen(false)}>
          Solicită detalii
        </a>
      </nav>
    </header>
  )
}
