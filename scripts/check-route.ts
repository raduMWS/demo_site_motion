/** Verifies that the boat route keeps clear of every island landmass. Run: npm run check:route */
import { ISLANDS, ROUTE_POINTS } from '../src/config/route'
import { islandPoints, inPolygon, distToPolygon } from '../src/lib/shapes'
import { routePath } from '../src/lib/routeMath'

const polys = ISLANDS.map((i) => ({
  id: i.id,
  poly: islandPoints(i).map((p) => ({ x: p.x + i.cx, y: p.y + i.cy })),
}))

// sample the Bézier route analytically
const { segs } = routePath(ROUTE_POINTS)
const pts = ROUTE_POINTS
let min = Infinity
let bad = 0
const re = /C([\d.-]+),([\d.-]+) ([\d.-]+),([\d.-]+) ([\d.-]+),([\d.-]+)/
for (let i = 0; i < segs.length; i++) {
  const m = segs[i].match(re)!.slice(1).map(Number)
  const p0 = pts[i]
  for (let t = 0; t <= 1; t += 0.02) {
    const u = 1 - t
    const x = u ** 3 * p0.x + 3 * u * u * t * m[0] + 3 * u * t * t * m[2] + t ** 3 * m[4]
    const y = u ** 3 * p0.y + 3 * u * u * t * m[1] + 3 * u * t * t * m[3] + t ** 3 * m[5]
    for (const { id, poly } of polys) {
      if (inPolygon({ x, y }, poly)) { bad++; console.log(`INSIDE ${id} at ${x.toFixed(0)},${y.toFixed(0)}`) }
      const dd = distToPolygon({ x, y }, poly)
      if (dd < 70) console.log(`close to ${id}: ${dd.toFixed(0)} at ${x.toFixed(0)},${y.toFixed(0)}`)
      min = Math.min(min, dd)
    }
    if (x < 40 || x > 1560 || y < 90 || y > 840) console.log(`near edge at ${x.toFixed(0)},${y.toFixed(0)}`)
  }
}
console.log(`min clearance to land: ${min.toFixed(0)} units; points inside land: ${bad}`)
process.exit(bad || min < 60 ? 1 : 0)
