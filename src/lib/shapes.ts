import type { IslandDef } from '../config/route'

export interface Pt { x: number; y: number }

/** Deterministic pseudo-random in [0,1). */
function rand(seed: number) {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** Organic coastline polygon centred on (0,0), derived from the island seed. */
export function islandPoints(def: Pick<IslandDef, 'rx' | 'ry' | 'seed' | 'rotate'>, n = 28): Pt[] {
  const pts: Pt[] = []
  const rot = ((def.rotate ?? 0) * Math.PI) / 180
  const p1 = rand(def.seed) * 6.28
  const p2 = rand(def.seed + 1) * 6.28
  const p3 = rand(def.seed + 2) * 6.28
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const wob =
      1 +
      0.16 * Math.sin(2 * a + p1) +
      0.11 * Math.sin(3 * a + p2) +
      0.06 * Math.sin(5 * a + p3) +
      (rand(def.seed * 31 + i) - 0.5) * 0.07
    const x = Math.cos(a) * def.rx * wob
    const y = Math.sin(a) * def.ry * wob
    pts.push({ x: x * Math.cos(rot) - y * Math.sin(rot), y: x * Math.sin(rot) + y * Math.cos(rot) })
  }
  return pts
}

/** Closed Catmull-Rom spline → cubic Bézier path string. */
export function closedSpline(pts: Pt[]): string {
  const n = pts.length
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += `C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  return d + 'Z'
}

export function islandPath(def: IslandDef): string {
  return closedSpline(islandPoints(def))
}

/** Ray-casting point-in-polygon. */
export function inPolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

export function distToPolygon(p: Pt, poly: Pt[]): number {
  let best = Infinity
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)))
    best = Math.min(best, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)))
  }
  return best
}
