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

/** Cubic Bézier control points of the open Catmull-Rom curve (same curve as `routePath`). */
function bezierSegments(points: { x: number; y: number }[]) {
  const n = points.length
  const segs: [number, number, number, number, number, number, number, number][] = []
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(n - 1, i + 2)]
    segs.push([p1.x, p1.y, p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6, p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6, p2.x, p2.y])
  }
  return segs
}

export interface RouteLUT {
  xs: Float32Array
  ys: Float32Array
  /** cumulative arc length at each sample */
  ls: Float32Array
  total: number
  /** arc length at every waypoint (index = waypoint index) */
  waypoints: number[]
}

/**
 * Arc-length lookup table for the route, computed analytically from the Bézier segments.
 * Replaces SVGPathElement.getPointAtLength, which is slow (hundreds of ms at startup and a
 * per-frame cost). Pure JS, so it also works in workers and Node.
 */
export function buildRouteLUT(points: { x: number; y: number }[], stepsPerSeg = 160): RouteLUT {
  const segs = bezierSegments(points)
  const count = segs.length * stepsPerSeg + 1
  const xs = new Float32Array(count)
  const ys = new Float32Array(count)
  const ls = new Float32Array(count)
  const waypoints = [0]
  xs[0] = points[0].x
  ys[0] = points[0].y
  let k = 1
  let acc = 0
  for (const [x0, y0, x1, y1, x2, y2, x3, y3] of segs) {
    for (let j = 1; j <= stepsPerSeg; j++) {
      const t = j / stepsPerSeg
      const u = 1 - t
      const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3
      const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3
      acc += Math.hypot(x - xs[k - 1], y - ys[k - 1])
      xs[k] = x
      ys[k] = y
      ls[k] = acc
      k++
    }
    waypoints.push(acc)
  }
  return { xs, ys, ls, total: acc, waypoints }
}

/** Point at a given arc length (binary search + linear interpolation). */
export function pointAtLength(lut: RouteLUT, len: number) {
  const l = Math.max(0, Math.min(lut.total, len))
  let lo = 0
  let hi = lut.ls.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (lut.ls[mid] < l) lo = mid
    else hi = mid
  }
  const span = lut.ls[hi] - lut.ls[lo] || 1
  const t = (l - lut.ls[lo]) / span
  return { x: lut.xs[lo] + (lut.xs[hi] - lut.xs[lo]) * t, y: lut.ys[lo] + (lut.ys[hi] - lut.ys[lo]) * t }
}

/** Arc length of every waypoint along the route. */
export function waypointLengths(points: Waypoint[]): number[] {
  return buildRouteLUT(points).waypoints
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
