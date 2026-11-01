# Content notes (not shown in the UI)

## Corrections
- The reference for the first business is **https://capetan.club** (not capetan.ro).

## Research sources (both reachable when checked on 2026-10-31)
- https://capetan.club — Romanian sailing school / charter ecosystem. Seen: practical modules (beginner to advanced, tidal waters, mile building, refresher, crew training), skipper licences (RYA Day Skipper→Yachtmaster, ICC, GMDSS/VHF radio), online theory, charter, flotillas, "explore" expeditions, private sessions, enquiry/enrolment forms (name, email, phone, number of people).
- https://setsail.ro — Romanian sailing school. Seen: boating-licence courses (C/D/S, intensive, motorboat, B/A), GMDSS radio courses, gift vouchers, expeditions, a school fleet, theory in Bucharest + practice at a Black Sea marina.

These are **separate businesses**. Nothing in the site copies their wording, branding, photos, instructors, prices, schedules or contacts, and nothing from one is attributed to the other.

## What the site claims — and what needs verification before launch
| Item | Status |
|---|---|
| Course categories (theory, practical introduction, improvement/miles, licence preparation, radio, private sessions) | Service *types* seen on the references. Confirm which ones **[BRAND NAME]** actually offers. |
| "Pregătire pentru permise și atestate" | Deliberately generic. Name real certifications (RYA, ICC, national licences) only once confirmed. |
| Experiences (crewed cruises, flotillas, charter, expeditions) | Types seen on the references. Confirm destinations, dates, boats. |
| Crew section | Placeholders only. Needs real names, photos, roles, qualifications. |
| Prices, dates, availability | None shown. All use "Solicită detalii". |
| Reviews, statistics, years in business | None invented. |
| Map coordinates / place names (3D labels) (e.g. `44°10′N 28°38′E`, `28°2x′E` ticks) | **Decorative placeholders** — fictional positions, not real locations. Replace or remove. |
| Contact details, privacy policy URL | Placeholders in `src/config/brand.ts`. |
| Enquiry form | Demo only. No backend; nothing is sent or stored. |

## Brand placeholder
`[BRAND NAME]` lives in `src/config/brand.ts` (+ the `<title>` in `index.html`).
