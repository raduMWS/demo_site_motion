import { ROUTE_POINTS } from '../config/route'
import { routePath } from './routeMath'

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

let pathEl: SVGPathElement | null = null
let total = 0

/** A hidden SVG path is the single geometric source for the route (boat, line, camera). */
export function routeElement() {
  if (pathEl) return pathEl
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
  pathEl = document.createElementNS(ns, 'path')
  pathEl.setAttribute('d', routePath(ROUTE_POINTS).d)
  svg.appendChild(pathEl)
  document.body.appendChild(svg)
  total = pathEl.getTotalLength()
  return pathEl
}

export function routeLength() {
  routeElement()
  return total
}

/** Position + heading (radians, chart space) at a distance along the route. */
export function sampleRoute(len: number) {
  const p = routeElement()
  const l = Math.max(0, Math.min(total, len))
  const pt = p.getPointAtLength(l)
  const a = p.getPointAtLength(Math.min(total, l + 4))
  const b = p.getPointAtLength(Math.max(0, l - 4))
  return { x: pt.x, y: pt.y, heading: Math.atan2(a.y - b.y, a.x - b.x) }
}
