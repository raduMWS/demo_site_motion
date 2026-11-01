# [BRAND NAME] — de la țărm la skipper

React + TypeScript + Vite · GSAP ScrollTrigger (+ `@gsap/react`) · three.js via `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` (bloom + vignette) · CSS. No smooth-scroll library — ordinary browser scrolling.

**Art direction:** a sunlit Aegean chart table — whitewashed line-art islands with Cycladic blue roofs, a white yacht and wake on deep-to-turquoise blue water, white depth contours, a compass-bearing ring framing the archipelago. Palette: white, off-white, Aegean blue, navy, with a sparing warm accent — terracotta (markers, active states, a few roofs, hover/pin highlight) and sun-yellow (lights only) (`src/styles/tokens.css` for the UI, `COLORS` in `src/three/world.ts` for the 3D scene). Type: Sora (display), Commissioner (body), IBM Plex Mono (labels); all support Romanian diacritics.

## Run
```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build
npm run check:route  # verifies the boat route never crosses island land

# with `npm run preview` running in another terminal:
npm run check:safari # WebKit smoke test as iPhone 14 + desktop Safari (screenshots + errors)
npm run check:a11y   # axe-core WCAG 2.1 AA audit, desktop + iPhone
```

> **Note:** builds always run in production mode (`vite.config.ts`). A shell that exports
> `NODE_ENV=test` (as this machine's `~/.zshrc` does) would otherwise bundle React's
> development runtime and make the site much heavier.

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
| 3D palette | `COLORS` in `src/three/world.ts` (mirrors `src/styles/tokens.css`) |
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

## Performance notes
- **No main-thread freeze at load.** The route is sampled from a precomputed arc-length table (`buildRouteLUT` in `src/lib/routeMath.ts`) instead of `SVGPathElement.getPointAtLength`, and the sea's coastline distance field is baked in a Web Worker (`src/three/seaMask.worker.ts`). Longest startup task: ~90 ms (was ~660 ms).
- **Render on demand.** Full frame rate only while scrolling / pointing (+2.5 s to let the camera settle); a calm 24 fps idle otherwise (`Ticker` in `src/three/Scene.tsx`).
- **Device tiers.** Phones and modest hardware get lower pixel ratio, a lighter sea mesh and fewer motes (`deviceTier`).
- **No post-processing.** The vignette is CSS; bloom was removed.
- **Materials own their uniforms.** Shader materials are created in `useMemo` and passed via `material={…}` so per-frame updates always reach the GPU.
- **Fallback.** No WebGL (or any 3D error) → static chart image (`public/chart-fallback.jpg`, regenerate from the reduced-motion view if the scene changes).

## Sharing the demo
`index.html` has Open Graph / Twitter tags with `public/og-image.jpg` (1200×630). Once the demo is hosted, change `og:image` / `twitter:image` to the absolute URL so WhatsApp / LinkedIn show the preview.
