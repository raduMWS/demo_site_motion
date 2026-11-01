import { useEffect, useRef, useState } from 'react'
import { BRAND } from '../config/brand'
import { INTERESTS } from '../config/content'
import { CHAPTERS } from '../config/chapters'

const ARRIVAL = CHAPTERS[CHAPTERS.length - 1]

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'interest' | 'message' | 'consent', string>>

function validate(f: FormData): Errors {
  const e: Errors = {}
  const name = String(f.get('name') ?? '').trim()
  const email = String(f.get('email') ?? '').trim()
  const phone = String(f.get('phone') ?? '').trim()
  const message = String(f.get('message') ?? '').trim()
  if (name.length < 2) e.name = 'Introdu numele tău (minimum 2 caractere).'
  if (!email) e.email = 'Introdu adresa de email.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = 'Adresa de email nu pare corectă. Exemplu: nume@exemplu.ro'
  if (phone && !/^\+?[0-9 ().-]{7,18}$/.test(phone)) e.phone = 'Numărul de telefon nu pare corect. Poți lăsa câmpul gol.'
  if (!f.get('interest')) e.interest = 'Alege ce te interesează.'
  if (message.length < 10) e.message = 'Scrie câteva cuvinte (minimum 10 caractere).'
  if (!f.get('consent')) e.consent = 'Bifează acordul pentru a continua.'
  return e
}

export function EnquiryForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'demo'>('idle')

  // "Solicită detalii" links preselect the interest field
  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      const a = (ev.target as Element).closest<HTMLElement>('a[data-interest]')
      const sel = formRef.current?.elements.namedItem('interest') as HTMLSelectElement | null
      if (a && sel) sel.value = a.dataset.interest ?? ''
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const onSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const form = ev.currentTarget
    const errs = validate(new FormData(form))
    setErrors(errs)
    const first = Object.keys(errs)[0]
    if (first) {
      setStatus('idle')
      ;(form.elements.namedItem(first) as HTMLElement | null)?.focus()
      return
    }
    // DEMO: there is no backend. Nothing is sent or stored.
    setStatus('demo')
  }

  const field = (id: keyof Errors, label: string, node: React.ReactNode, optional = false) => (
    <div className={`field${errors[id] ? ' field--invalid' : ''}`}>
      <label htmlFor={id}>
        {label}
        {optional && <span className="field__opt"> (opțional)</span>}
      </label>
      {node}
      {errors[id] && (
        <p className="field__error" id={`${id}-err`}>
          {errors[id]}
        </p>
      )}
    </div>
  )
  const aria = (id: keyof Errors) => ({ 'aria-invalid': errors[id] ? true : undefined, 'aria-describedby': errors[id] ? `${id}-err` : undefined })

  const errList = Object.entries(errors)
  return (
    <section className="section section--contact" id="contact" data-stop={CHAPTERS.length - 1} aria-labelledby="contact-title">
      <div className="section__inner section__inner--split">
        <header className="section__head">
          <p className="chart-label section__kicker">{ARRIVAL.kicker} · contact</p>
          <h2 id="contact-title">{ARRIVAL.title}</h2>
          <p>{ARRIVAL.body[0]} Revenim cu detalii despre opțiuni, termene și prețuri.</p>
          <p className="demo-badge chart-label">Formular demonstrativ · nu este conectat la un server</p>
        </header>

        <form ref={formRef} className="form" noValidate onSubmit={onSubmit} aria-describedby="demo-note">
          {errList.length > 0 && (
            <div className="form__summary" role="alert">
              <p>Mai avem nevoie de câteva detalii:</p>
              <ul>
                {errList.map(([k, m]) => (
                  <li key={k}>
                    <a href={`#${k}`} onClick={(e) => { e.preventDefault(); document.getElementById(k)?.focus() }}>
                      {m}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {field('name', 'Nume', <input id="name" name="name" type="text" autoComplete="name" required {...aria('name')} />)}
          {field('email', 'Email', <input id="email" name="email" type="email" autoComplete="email" required {...aria('email')} />)}
          {field('phone', 'Telefon', <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" {...aria('phone')} />, true)}
          {field(
            'interest',
            'Sunt interesat de…',
            <select id="interest" name="interest" required defaultValue="" {...aria('interest')}>
              <option value="" disabled>Alege o variantă</option>
              {INTERESTS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>,
          )}
          {field('message', 'Mesaj', <textarea id="message" name="message" rows={5} required {...aria('message')} />)}
          <div className={`field field--check${errors.consent ? ' field--invalid' : ''}`}>
            <input id="consent" name="consent" type="checkbox" {...aria('consent')} />
            <label htmlFor="consent">
              Am citit <a href={BRAND.privacyUrl}>politica de confidențialitate</a> și sunt de acord ca datele mele să fie folosite pentru a primi un răspuns.
            </label>
            {errors.consent && <p className="field__error" id="consent-err">{errors.consent}</p>}
          </div>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary">Verifică formularul</button>
          </div>
          <p id="demo-note" className="form__demo" role="status">
            {status === 'demo'
              ? 'Mod demonstrativ: câmpurile sunt valide, dar nu s-a trimis nimic și nicio solicitare nu a fost înregistrată. Conectează formularul la un serviciu real înainte de publicare.'
              : 'Acesta este un formular demonstrativ: nu trimite date nicăieri.'}
          </p>
        </form>
      </div>
    </section>
  )
}
