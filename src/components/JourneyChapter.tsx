import type { Chapter } from '../config/chapters'

interface Props {
  chapter: Chapter
  index: number
  total?: number
}

function CrewSlots() {
  return (
    <ul className="crew-slots" aria-label="Spații rezervate pentru prezentarea echipajului">
      {['Instructor', 'Skipper', 'Echipaj'].map((r) => (
        <li key={r} className="crew-slot">
          <svg viewBox="0 0 60 70" aria-hidden="true" focusable="false">
            <circle cx="30" cy="24" r="12" />
            <path d="M8,66 C8,46 52,46 52,66" />
          </svg>
          <span className="chart-label">{r}</span>
          <span className="crew-slot__hint">nume și prezentare reale</span>
        </li>
      ))}
    </ul>
  )
}

export function JourneyChapter({ chapter: c, index, total = 6 }: Props) {
  const Heading = c.variant === 'hero' ? 'h1' : 'h2'
  return (
    <article
      id={c.id}
      className={`chapter chapter--${c.variant ?? 'plain'} chapter--${c.side}`}
      data-index={index}
      data-stop={index}
      aria-labelledby={`${c.id}-title`}
    >
      <div className="chapter__panel">
        {c.variant === 'hero' ? (
          <p className="chapter__kicker chart-label">
            <span className="chapter__dash" aria-hidden="true" />
            {c.kicker}
          </p>
        ) : (
          <p className="chapter__meta chart-label">
            <span className="chapter__count">
              <span className="chapter__marker" aria-hidden="true" />
              <strong>{String(index).padStart(2, '0')}</strong> / {String(total - 1).padStart(2, '0')}
            </span>
            <span>{c.kicker}</span>
          </p>
        )}
        <Heading id={`${c.id}-title`} className="chapter__title">
          {c.title}
        </Heading>
        {c.body.map((p) => (
          <p key={p} className="chapter__body">
            {p}
          </p>
        ))}
        {c.points && (
          <ul className="chapter__points">
            {c.points.map((pt, i) => (
              <li key={pt.label}>
                <span className="chapter__point-n chart-label" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{pt.label}</strong>
                  <span className="chapter__point-sep"> — </span>
                  {pt.text}
                </span>
              </li>
            ))}
          </ul>
        )}
        {c.variant === 'crew' && <CrewSlots />}
        {(c.cta || c.secondaryCta) && (
          <p className="chapter__actions">
            {c.cta && (
              <a className={c.variant === 'hero' || c.variant === 'arrival' ? 'btn btn--primary' : 'link-arrow'} href={c.cta.href}>
                {c.cta.label}
                {c.variant === 'hero' && <span aria-hidden="true"> →</span>}
              </a>
            )}
            {c.secondaryCta && (
              <a className="btn btn--ghost" href={c.secondaryCta.href}>
                {c.secondaryCta.label}
              </a>
            )}
          </p>
        )}
      </div>
      {c.variant === 'hero' && (
        <p className="scroll-cue chart-label" aria-hidden="true">
          <i />
          <span>Derulează pentru a naviga</span>
        </p>
      )}
    </article>
  )
}
