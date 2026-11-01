/**
 * ROUTE + MAP GEOMETRY  (single place to edit the voyage)
 * -------------------------------------------------------
 * All coordinates live in one SVG coordinate system: viewBox 0 0 1600 900.
 * The boat, the travelled route and the islands share it, so they cannot drift.
 */

export const VIEWBOX = { w: 1600, h: 900 } as const

export interface IslandDef {
  id: string
  label: string
  /** centre */
  cx: number
  cy: number
  /** approximate radii of the landmass */
  rx: number
  ry: number
  /** deterministic shape seed – change for a different silhouette */
  seed: number
  rotate?: number
  /** label placement relative to the island */
  labelDx?: number
  labelDy?: number
  coord: string
}

export const ISLANDS: IslandDef[] = [
  { id: 'i1', label: 'Primii pași', cx: 800, cy: 235, rx: 140, ry: 88, seed: 3, rotate: -8, labelDy: -130, coord: '44°10′N 28°38′E' },
  { id: 'i2', label: 'La cârmă', cx: 1330, cy: 255, rx: 110, ry: 125, seed: 8, rotate: 12, labelDy: -165, coord: '44°02′N 28°51′E' },
  { id: 'i3', label: 'Dincolo de țărm', cx: 1250, cy: 745, rx: 150, ry: 72, seed: 15, rotate: -6, labelDy: 112, coord: '43°48′N 28°47′E' },
  { id: 'i4', label: 'Echipajul', cx: 900, cy: 752, rx: 100, ry: 60, seed: 21, rotate: 10, labelDy: 92, coord: '43°51′N 28°29′E' },
]

export interface HarbourDef {
  id: string
  label: string
  x: number
  y: number
  coord: string
}

export const HARBOURS: HarbourDef[] = [
  { id: 'h0', label: 'Port de plecare', x: 215, y: 768, coord: '44°12′N 28°35′E' },
  { id: 'h1', label: 'Port de sosire', x: 480, y: 772, coord: '43°55′N 28°21′E' },
]

export interface Waypoint {
  x: number
  y: number
  /** index into CHAPTERS where the boat rests (dwells) */
  stop?: number
}

/**
 * The boat route. A smooth Catmull-Rom curve is drawn through these points.
 * Points flagged with `stop` are the places where a chapter is shown.
 * Keep every point well clear of the islands (run `npm run check:route`).
 */
export const ROUTE_POINTS: Waypoint[] = [
  { x: 325, y: 722, stop: 0 },
  { x: 450, y: 712 },
  { x: 570, y: 660 },
  { x: 650, y: 545 },
  { x: 700, y: 445, stop: 1 },
  { x: 860, y: 450 },
  { x: 1000, y: 452 },
  { x: 1130, y: 435, stop: 2 },
  { x: 1290, y: 460 },
  { x: 1445, y: 480 },
  { x: 1505, y: 545, stop: 3 },
  { x: 1440, y: 610 },
  { x: 1300, y: 600 },
  { x: 1100, y: 590 },
  { x: 880, y: 580, stop: 4 },
  { x: 740, y: 625 },
  { x: 640, y: 705 },
  { x: 545, y: 778, stop: 5 },
]

/** Boat size on the desktop map. */
export const BOAT_SCALE = 1.45

/** Mobile route amplitude (px) – how far the boat wiggles in the left gutter. */
export const MOBILE_ROUTE = { gutterX: 27, amplitude: 6, boatScale: 0.78 }
