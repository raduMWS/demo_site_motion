import { ROUTE_POINTS } from '../config/route'
import { buildRouteLUT, pointAtLength, type RouteLUT } from './routeMath'

/**
 * Shared, mutable voyage state. The GSAP master timeline WRITES it (once per scroll update),
 * the 3D scene READS it every frame. No React state is involved, so nothing re-renders.
 */
export const voyage = {
  /** scroll progress of the master timeline, 0..1 */
  s: 0,
  /** distance travelled along the route, in chart units (same units as ROUTE_POINTS) */
  len: 0,
  /** -1..1 – which side the copy sits on, so the camera frames the boat on the other side */
  shift: 0,
  /** chart position of the island the active chapter is about, and how strongly to frame it (0..1) */
  focusX: 0,
  focusY: 0,
  focusW: 0,
  /** true when the scene should travel; false = still overview (reduced motion) */
  animated: true,
}

let lut: RouteLUT | null = null
const getLUT = () => (lut ??= buildRouteLUT(ROUTE_POINTS))

/** Total route length in chart units. */
export function routeLength() {
  return getLUT().total
}

/** Position + heading (radians, chart space) at a distance along the route. */
export function sampleRoute(len: number) {
  const t = getLUT()
  const l = Math.max(0, Math.min(t.total, len))
  const pt = pointAtLength(t, l)
  const a = pointAtLength(t, Math.min(t.total, l + 4))
  const b = pointAtLength(t, Math.max(0, l - 4))
  return { x: pt.x, y: pt.y, heading: Math.atan2(a.y - b.y, a.x - b.x) }
}
