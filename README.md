# [BRAND NAME] — de la țărm la skipper

React + TypeScript + Vite · GSAP ScrollTrigger (+ `@gsap/react`) · three.js via `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` (bloom + vignette) · CSS. No smooth-scroll library — ordinary browser scrolling.

**Art direction:** night navigation on a holographic chart table — dark translucent forms with glowing edges, a coral comet-trail for the course, a compass-bearing ring framing the archipelago. Type: Sora (display), Commissioner (body), IBM Plex Mono (labels); all support Romanian diacritics.

## Run
```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build
npm run check:route  # verifies the boat route never crosses island land
```

## Where to edit
| What | File |
|---|---|
| Brand name, contact, privacy link | `src/config/brand.ts` (+ `<title>` in `index.html`) |
| Chapter copy, CTAs, panel side | `src/config/chapters.ts` |
| Courses / experiences / form interests | `src/config/content.ts` |
| **Boat route** (waypoints, `stop` = chapter rest), islands, harbours, boat size, mobile route | `src/config/route.ts` |
| **Timing**: pinned length, dwell per chapter, drift, fade, easing, scrub | `src/config/timeline.ts` |
| Colours & fonts | `src/styles/tokens.css` |
| 3D scene: sea shader, islands, boat, camera, bloom | `src/three/` (`Sea.tsx`, `Islands.tsx`, `Sailboat.tsx`, `Route.tsx`, `ChartTable.tsx`, `CameraRig.tsx`, `Scene.tsx`, `Holo.tsx`) |
| Night palette used in 3D | `COLORS` in `src/three/world.ts` (mirrors `src/styles/tokens.css`) |
| Stage / panels / mobile layout | `src/styles/journey.css` |

## How the voyage works
The voyage spans the **whole page**. The 3D scene is a fixed backdrop (`SailingJourney.tsx` + `src/three/`); page content scrolls over it. Every element marked `data-stop="n"` is a port of call:

| stop | element | island |
|---|---|---|
| 0 | hero (`Plecare`) | departure harbour |
| 1 | chapter *Primii pași* → followed by the course list | island 01 |
| 2 | chapter *La cârmă* | island 02 |
| 3 | chapter *Dincolo de țărm* → followed by experiences | island 03 |
| 4 | chapter *Echipajul* → followed by the crew section | island 04 |
| 5 | contact section — pinned to the **very end of the scroll** | arrival harbour |

One ScrollTrigger maps document scroll (top → bottom) to a single progress value. That value is turned into a distance along the route and written to `src/lib/voyage.ts`; the scene reads it every frame (boat, heading, camera, comet trail, waypoints, labels). Near each port the boat only drifts (`TIMELINE.dwellVh`); between ports it sails. Scrolling back reverses exactly; React never re-renders during scroll. Page order lives in `src/App.tsx` — move sections freely, the route re-measures itself on resize/font load.

The route itself is defined in chart coordinates (`ROUTE_POINTS`, 1600×900) and converted to world space (`src/three/world.ts`). `npm run check:route` verifies it never crosses land.

## Boat anatomy hotspots
Hovering the boat shows a targeting reticle + tooltip; clicking pins a short explanation (prova, pupa, babord, tribord, catarg, randa, foc, ghiu, cockpit). Edit names, copy and hit volumes in `src/three/boatParts.ts`. Keyboard/touch: the “Atinge barca…” button (visible near each chapter) steps through the parts and announces them via a live region; `Esc` closes. Empty water between cards passes pointer events to the scene (`.page { pointer-events: none }` with panels/sections re-enabled).

## Reduced motion
`prefers-reduced-motion` → still 3D overview of the whole chart (rendered on demand), no travel; all content in normal flow.
