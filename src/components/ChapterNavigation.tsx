import { CHAPTERS } from '../config/chapters'

/**
 * Left-hand voyage rail: one diamond per chapter plus the active chapter's name, written
 * vertically. Active state is set by the master timeline (no React state per frame).
 */
export function ChapterNavigation({ onSelect }: { onSelect: (i: number) => void }) {
  return (
    <nav className="voyage-rail" aria-label="Capitolele călătoriei">
      <ol>
        {CHAPTERS.map((c, i) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              data-nav={i}
              onClick={(e) => {
                e.preventDefault()
                onSelect(i)
              }}
            >
              <span className="voyage-rail__diamond" aria-hidden="true" />
              <span className="visually-hidden">
                {String(i).padStart(2, '0')} {c.nav}
              </span>
            </a>
          </li>
        ))}
      </ol>
      <p className="voyage-rail__label chart-label" aria-hidden="true">
        Voiaj <span data-count>00</span> · <span data-rail-label>{CHAPTERS[0].nav}</span>
      </p>
    </nav>
  )
}
