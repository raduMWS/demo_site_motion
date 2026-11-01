/// <reference lib="webworker" />
import { HARBOURS, ISLANDS, VIEWBOX } from '../config/route'
import { distToPolygon, inPolygon, islandPoints, type Pt } from '../lib/shapes'
import { harbourLand } from './world'

/**
 * Off-main-thread bake of the coastline distance field used by the sea shader.
 *  R = surf band at the shore, G = depth falloff (contours + shallow colour).
 * Values are returned as half-floats so the contour lines stay smooth.
 */
function toHalf(v: number) {
  // float32 -> float16 bits (values are in [0,1], no NaN/Inf handling needed)
  const f = new Float32Array(1)
  const i = new Uint32Array(f.buffer)
  f[0] = v
  const x = i[0]
  const e = ((x >> 23) & 0xff) - 127 + 15
  const m = x & 0x7fffff
  if (e <= 0) return 0
  return (e << 10) | (m >> 13)
}

self.onmessage = (ev: MessageEvent<{ width: number }>) => {
  const W = ev.data.width
  const H = Math.round((W * VIEWBOX.h) / VIEWBOX.w)
  const sx = VIEWBOX.w / W
  const polys = [...ISLANDS, ...HARBOURS.map((h, i) => harbourLand(h, i))].map((d) => {
    const poly: Pt[] = islandPoints(d, 48).map((p) => ({ x: d.cx + p.x, y: d.cy + p.y }))
    const xs = poly.map((p) => p.x)
    const ys = poly.map((p) => p.y)
    return { poly, minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
  })
  const data = new Uint16Array(W * H * 4)
  const one = toHalf(1)
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const p = { x: (i + 0.5) * sx, y: (j + 0.5) * sx }
      let d = Infinity
      for (const g of polys) {
        const bx = Math.max(g.minX - p.x, 0, p.x - g.maxX)
        const by = Math.max(g.minY - p.y, 0, p.y - g.maxY)
        if (Math.hypot(bx, by) > Math.min(d, 260)) continue
        d = inPolygon(p, g.poly) ? 0 : Math.min(d, distToPolygon(p, g.poly))
        if (d === 0) break
      }
      const k = (j * W + i) * 4
      data[k] = toHalf(Math.max(0, 1 - d / 22))
      data[k + 1] = toHalf(Math.exp(-d / 85))
      data[k + 3] = one
    }
  }
  ;(self as unknown as Worker).postMessage({ data, W, H }, [data.buffer])
}
