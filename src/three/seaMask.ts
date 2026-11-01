import * as THREE from 'three'

/** Empty mask: open water everywhere, used until the worker delivers the real one. */
export function emptySeaMask() {
  const t = new THREE.DataTexture(new Uint16Array(4), 1, 1, THREE.RGBAFormat, THREE.HalfFloatType)
  t.needsUpdate = true
  return t
}

/**
 * Bakes the coastline distance field in a Web Worker so the main thread never blocks,
 * then hands back a ready texture.
 */
export function bakeSeaMask(width: number, onReady: (tex: THREE.DataTexture) => void) {
  const worker = new Worker(new URL('./seaMask.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (ev: MessageEvent<{ data: Uint16Array; W: number; H: number }>) => {
    const { data, W, H } = ev.data
    const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType)
    tex.flipY = false
    tex.magFilter = THREE.LinearFilter
    tex.minFilter = THREE.LinearFilter
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
    tex.needsUpdate = true
    worker.terminate()
    onReady(tex)
  }
  worker.postMessage({ width })
  return () => worker.terminate()
}
