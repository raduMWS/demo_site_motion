/**
 * Normal-flow section content. Category names are based on service types seen on the
 * reference sites (see docs/content-notes.md); descriptions are original and generic.
 * No prices, dates, certifications or claims – everything is "Solicită detalii".
 */
export const COURSES = [
  { title: 'Teorie de navigație', level: 'Începător', interest: 'cursuri', text: 'Meteo, hărți, reguli de drum pe apă și planificarea unui traseu — explicate pe exemple, la sală sau online.' },
  { title: 'Inițiere practică pe velier', level: 'Începător', interest: 'practica', text: 'Primele ore la bord: cum se ridică velele, cum simți vântul și cum te miști în siguranță pe punte.' },
  { title: 'Perfecționare și mile de navigație', level: 'Intermediar', interest: 'practica', text: 'Pentru cei care au deja baza și vor să adune ore pe apă, să-și reîmprospăteze cunoștințele sau să navigheze în condiții noi.' },
  { title: 'Pregătire pentru permise și atestate', level: 'Toate nivelurile', interest: 'cursuri', text: 'Orientare către atestatele de navigație recunoscute. Tipurile exacte și condițiile se confirmă la înscriere.' },
  { title: 'Radiocomunicații maritime', level: 'Începător', interest: 'cursuri', text: 'Cum se folosește stația radio de la bord, ce se spune și când — pregătire pentru certificatele de radio.' },
  { title: 'Sesiuni private', level: 'La alegere', interest: 'practica', text: 'Ore individuale sau în grup mic, construite în jurul obiectivului tău.' },
] as const

export const EXPERIENCES = [
  { title: 'Croaziere în echipaj', text: 'O săptămână la bord, cu program relaxat și sarcini împărțite între toți.' },
  { title: 'Flotile', text: 'Mai multe bărci navighează împreună, pe un traseu comun, cu sprijin de la un echipaj-ghid.' },
  { title: 'Charter cu sau fără skipper', text: 'Pleci cu prietenii sau cu familia, iar noi te ajutăm să alegi barca și traseul.' },
  { title: 'Expediții', text: 'Trasee mai îndepărtate, pentru cei care vor să-și testeze abilitățile în locuri noi.' },
] as const

export const INTERESTS = [
  { value: 'cursuri', label: 'Cursuri de navigație' },
  { value: 'practica', label: 'Practică pe mare' },
  { value: 'experiente', label: 'Croaziere și experiențe' },
  { value: 'echipaj', label: 'Echipaj și cariera de skipper' },
  { value: 'altceva', label: 'Altceva' },
] as const
