/**
 * CHAPTER COPY  (single place to edit text)
 * Original Romanian copy. Anything that states facts about the business is
 * deliberately generic until verified – see docs/content-notes.md.
 */
export interface ChapterCta {
  label: string
  href: string
}

export interface Chapter {
  id: string
  /** anchor / chapter-nav label */
  nav: string
  kicker: string
  title: string
  /** which side of the pinned stage the copy sits on (desktop) */
  side: 'left' | 'right'
  body: string[]
  /** short list, rendered per-chapter in an editorial way */
  points?: { label: string; text: string }[]
  cta?: ChapterCta
  secondaryCta?: ChapterCta
  /** island id from ISLANDS (illustrated on mobile / static layouts) */
  island?: string
  variant?: 'hero' | 'plain' | 'editorial' | 'crew' | 'arrival'
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'plecare',
    nav: 'Plecare',
    kicker: 'Școală de navigație · de la țărm la skipper',
    title: 'Începe aventura. Învață să navighezi.',
    side: 'left',
    variant: 'hero',
    body: [
      'De la prima ieșire din port până la încrederea de a lua cârma: un drum clar, pas cu pas, alături de oameni care îți explică totul pe înțelesul tău.',
    ],
    cta: { label: 'Descoperă cursurile', href: '#cursuri' },
    secondaryCta: { label: 'Explorează experiențele', href: '#experiente' },
  },
  {
    id: 'primii-pasi',
    nav: 'Primii pași',
    kicker: 'Insula 01 · Teorie și practică',
    title: 'Primii pași',
    side: 'right',
    island: 'i1',
    variant: 'plain',
    body: [
      'Nu trebuie să știi nimic despre vele ca să începi. Îmbinăm teoria — cum lucrează vântul, cum se citește o hartă, ce spun regulile mării — cu ore petrecute pe apă, ca fiecare noțiune să capete sens.',
    ],
    points: [
      { label: 'Teorie', text: 'navigație, meteo și reguli de bază' },
      { label: 'Practică', text: 'prima ieșire pe mare, pe înțelesul tuturor' },
      { label: 'Radio', text: 'comunicații maritime, acolo unde sunt necesare' },
    ],
    cta: { label: 'Găsește cursul potrivit', href: '#cursuri' },
  },
  {
    id: 'la-carma',
    nav: 'La cârmă',
    kicker: 'Insula 02 · Practică',
    title: 'Cârma devine a ta',
    side: 'right',
    island: 'i2',
    variant: 'editorial',
    body: [
      'Aici cunoștințele devin gesturi. Exersezi pe rând fiecare abilitate, până când manevrele nu te mai sperie, ci te bucură.',
    ],
    points: [
      { label: 'Manevre în port', text: 'acostare, plecare, spațiu strâmt' },
      { label: 'Lucrul cu velele', text: 'reglaj, viraje, schimbări de vânt' },
      { label: 'Navigație', text: 'planificarea traseului și poziția pe hartă' },
      { label: 'Decizii la bord', text: 'comunicare și sarcini în echipaj' },
    ],
    cta: { label: 'Descoperă practica', href: '#cursuri' },
  },
  {
    id: 'dincolo-de-tarm',
    nav: 'Dincolo de țărm',
    kicker: 'Insula 03 · Experiențe',
    title: 'Dincolo de țărm',
    side: 'right',
    island: 'i3',
    variant: 'plain',
    body: [
      'Marea se învață cel mai bine departe de mal. Croaziere, expediții și zile petrecute la bord, cu ritmul lor: dimineți liniștite, ancorări, seri lungi în echipaj.',
      'Destinațiile și datele se stabilesc împreună cu tine — scrie-ne și îți spunem ce se potrivește.',
    ],
    cta: { label: 'Vezi experiențele', href: '#experiente' },
  },
  {
    id: 'echipajul',
    nav: 'Echipajul',
    kicker: 'Insula 04 · Oameni',
    title: 'Echipajul',
    side: 'right',
    island: 'i4',
    variant: 'crew',
    body: [
      'Oamenii fac diferența între o lecție și o amintire. Aici vei cunoaște instructorii și skipperii care te însoțesc la bord.',
    ],
    cta: { label: 'Cunoaște echipajul', href: '#echipaj' },
  },
  {
    id: 'contact',
    nav: 'Sosire',
    kicker: 'Port de sosire',
    title: 'Următoarea destinație începe cu tine.',
    side: 'right',
    variant: 'arrival',
    body: [
      'Spune-ne de unde pornești și încotro vrei să ajungi. Te ajutăm să alegi primul pas.',
    ],
    cta: { label: 'Scrie-ne', href: '#contact' },
  },
]
