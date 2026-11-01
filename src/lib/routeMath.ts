import type { Waypoint } from '../config/route'

/** Open Catmull-Rom through points → one cubic Bézier path string, plus per-segment strings. */
export function routePath(points: { x: number; y: number }[]) {
  const n = points.length
  const segs: string[] = []
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(n - 1, i + 2)]
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    segs.push(`C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`)
  }
  const head = `M${points[0].x},${points[0].y}`
  return { d: head + segs.join(''), head, segs }
}

/** Length of every waypoint along the path (needs a DOM; used in the browser). */
export function waypointLengths(points: Waypoint[]): number[] {
  const { head, segs } = routePath(points)
  const ns = 'http://www.w3.org/2000/svg'
  const el = document.createElementNS(ns, 'path')
  const out = [0]
  let acc = ''
  for (let i = 0; i < segs.length; i++) {
    acc += segs[i]
    el.setAttribute('d', head + acc)
    out.push(el.getTotalLength())
  }
  return out
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (t: number) => t * t * (3 - 2 * t)

export interface Knot { s: number; l: number }

/** scroll progress s∈[0,1] → length along route. Monotone, piecewise (dwell: slow drift, travel: eased). */
export function scrollToLength(s: number, knots: Knot[]): number {
  if (s <= knots[0].s) return knots[0].l
  for (let i = 0; i < knots.length - 1; i++) {
    const a = knots[i]
    const b = knots[i + 1]
    if (s <= b.s) {
      const t = (s - a.s) / (b.s - a.s || 1)
      const isTravel = i % 2 === 1
      const e = isTravel ? t * 0.45 + smooth(t) * 0.55 : t
      return a.l + (b.l - a.l) * e
    }
  }
  return knots[knots.length - 1].l
}
