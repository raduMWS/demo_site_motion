import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { BOAT_PARTS, boatUI } from './boatParts'

/** Inside <Canvas>: keeps the reticle + tooltip glued to the active boat part every frame. */
export function PartProjector({ reticle, tip }: { reticle: React.RefObject<HTMLDivElement | null>; tip: React.RefObject<HTMLDivElement | null> }) {
  const { camera, size } = useThree()
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), c: [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => new THREE.Vector3(x, y, z)))) }), [])
  useFrame(() => {
    const id = boatUI.hover ?? boatUI.pinned
    const obj = id ? boatUI.objects[id] : null
    const R = reticle.current
    const T = tip.current
    if (!R || !T) return
    if (!obj) {
      R.style.opacity = '0'
      T.style.opacity = '0'
      return
    }
    const part = BOAT_PARTS.find((b) => b.id === id)!
    // screen-space bounds of the part's 8 box corners → reticle hugs the part
    obj.updateWorldMatrix(true, false)
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const c of tmp.c) {
      tmp.v.set((c.x * part.size[0]) / 2, (c.y * part.size[1]) / 2, (c.z * part.size[2]) / 2).applyMatrix4(obj.matrixWorld).project(camera)
      const x = (tmp.v.x * 0.5 + 0.5) * size.width
      const y = (-tmp.v.y * 0.5 + 0.5) * size.height
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
    }
    const pad = 8
    const w = Math.max(28, x1 - x0 + pad * 2)
    const h = Math.max(28, y1 - y0 + pad * 2)
    const left = (x0 + x1) / 2 - w / 2
    const top = (y0 + y1) / 2 - h / 2
    R.style.opacity = '1'
    R.style.width = `${w.toFixed(0)}px`
    R.style.height = `${h.toFixed(0)}px`
    R.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`
    T.style.opacity = '1'
    // chapter cards sit bottom-right: open the tooltip to the left when space on the right is short
    const flip = left + w + 320 > size.width * (size.width > 860 ? 0.62 : 1)
    T.style.transform = `translate3d(${(flip ? left - 14 : left + w + 14).toFixed(1)}px, ${top.toFixed(1)}px, 0) translateX(${flip ? '-100%' : '0'})`
  })
  return null
}

/** Outside <Canvas>: reticle, tooltip and the accessible "explore the boat" control. */
export function BoatInspector({ reticle, tip }: { reticle: React.RefObject<HTMLDivElement | null>; tip: React.RefObject<HTMLDivElement | null> }) {
  useSyncExternalStore(boatUI.subscribe, boatUI.snapshot)
  const id = boatUI.hover ?? boatUI.pinned
  const part = BOAT_PARTS.find((b) => b.id === id)
  const pinned = !!boatUI.pinned && boatUI.pinned === id
  const announced = BOAT_PARTS.find((b) => b.id === boatUI.pinned)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && boatUI.set({ pinned: null })
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const next = () => {
    const i = BOAT_PARTS.findIndex((b) => b.id === boatUI.pinned)
    boatUI.set({ pinned: BOAT_PARTS[(i + 1) % BOAT_PARTS.length].id, hover: null })
  }

  return (
    <>
      <div ref={reticle} className="part-reticle" aria-hidden="true">
        <i /><i /><i /><i />
      </div>
      <div ref={tip} className={`part-tip${pinned ? ' is-pinned' : ''}`} aria-hidden="true">
        {part && (
          <>
            <p className="part-tip__head">
              <strong>{part.name}</strong>
              <span>{part.en} · termen nautic</span>
            </p>
            <p className="part-tip__line">{part.line}</p>
            {pinned ? <p className="part-tip__detail">{part.detail}</p> : <p className="part-tip__cta">Click pentru detalii</p>}
          </>
        )}
      </div>
      <div className="part-hint">
        <button type="button" className="part-hint__btn" onClick={next} aria-describedby="part-live">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <circle cx="8" cy="8" r="5.5" />
            <path d="M8 0v4M8 12v4M0 8h4M12 8h4" />
          </svg>
          <span>{announced ? `${announced.name} · următoarea parte` : 'Atinge barca pentru a-i descoperi părțile'}</span>
        </button>
        <p id="part-live" className="visually-hidden" aria-live="polite">
          {announced ? `${announced.name}: ${announced.line}. ${announced.detail}` : ''}
        </p>
      </div>
    </>
  )
}
