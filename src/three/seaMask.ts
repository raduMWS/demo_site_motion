import * as THREE from 'three'
import { HARBOURS, ISLANDS, VIEWBOX } from '../config/route'
import { distToPolygon, inPolygon, islandPoints, type Pt } from '../lib/shapes'
import { harbourLand } from './world'

/**
 * Bakes a smooth (half-float) distance field of every coastline for the sea shader:
 *  R = surf band right at the shore
 *  G = depth falloff → shallow-water colour and bathymetric contour lines
 */
export function bakeSeaMask() {
  const W = 512
  const H = Math.round((W * VIEWBOX.h) / VIEWBOX.w)
  const sx = VIEWBOX.w / W
  const polys: { poly: Pt[]; minX: number; maxX: number; minY: number; maxY: number }[] = [
    ...ISLANDS,
    ...HARBOURS.map((h, i) => harbourLand(h, i)),
  ].map((d) => {
    const poly = islandPoints(d, 48).map((p) => ({ x: d.cx + p.x, y: d.cy + p.y }))
    const xs = poly.map((p) => p.x)
    const ys = poly.map((p) => p.y)
    return { poly, minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
  })

  const data = new Uint16Array(W * H * 4)
  const half = THREE.DataUtils.toHalfFloat
  const one = half(1)
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const p = { x: (i + 0.5) * sx, y: (j + 0.5) * sx }
      let d = Infinity
      for (const g of polys) {
        // cheap bounding reject for far pixels
        const bx = Math.max(g.minX - p.x, 0, p.x - g.maxX)
        const by = Math.max(g.minY - p.y, 0, p.y - g.maxY)
        if (Math.hypot(bx, by) > Math.min(d, 260)) continue
        d = inPolygon(p, g.poly) ? 0 : Math.min(d, distToPolygon(p, g.poly))
        if (d === 0) break
      }
      const shore = Math.max(0, 1 - d / 22)
      const depth = Math.exp(-d / 85)
      const k = (j * W + i) * 4
      data[k] = half(shore)
      data[k + 1] = half(depth)
      data[k + 2] = 0
      data[k + 3] = one
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType)
  tex.flipY = false
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearFilter
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}
