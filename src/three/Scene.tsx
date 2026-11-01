import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { HARBOURS, ISLANDS } from '../config/route'
import { BoatInspector, PartProjector } from './BoatInspector'
import { boatUI } from './boatParts'
import { CameraRig } from './CameraRig'
import { loaderStep } from '../lib/loader'
import { CompassRing, Motes } from './ChartTable'
import { Harbours, ISLAND_TOP, Islands } from './Islands'
import { Route } from './Route'
import { Sailboat } from './Sailboat'
import { Sea } from './Sea'
import { COLORS, toWorld } from './world'

interface Tag {
  key: string
  attr: Record<string, string>
  name: string
  coord: string
  pos: THREE.Vector3
}

function buildTags(): Tag[] {
  const islands = ISLANDS.map((d, i) => {
    const [x, z] = toWorld(d.cx, d.cy)
    return { key: d.id, attr: { 'data-island': d.id }, name: `${String(i + 1).padStart(2, '0')} · ${d.label}`, coord: d.coord, pos: new THREE.Vector3(x, ISLAND_TOP + 1.05, z) }
  })
  const harbours = HARBOURS.map((h) => {
    const [x, z] = toWorld(h.x - 120, h.y + 80)
    return { key: h.id, attr: { 'data-harbour': h.id }, name: h.label, coord: h.coord, pos: new THREE.Vector3(x, 0.95, z) }
  })
  return [...islands, ...harbours]
}

/** Projects DOM labels onto their 3D anchors every rendered frame (no extra React roots). */
function TagProjector({ tags, els }: { tags: Tag[]; els: React.RefObject<(HTMLDivElement | null)[]> }) {
  const { camera, size } = useThree()
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    camera.updateMatrixWorld()
    tags.forEach((t, i) => {
      const el = els.current?.[i]
      if (!el) return
      const near = THREE.MathUtils.clamp((30 - camera.position.distanceTo(t.pos)) / 10, 0, 1)
      el.style.setProperty('--near', near.toFixed(2))
      v.copy(t.pos).project(camera)
      const hidden = v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2
      el.style.visibility = hidden ? 'hidden' : 'visible'
      const x = (v.x * 0.5 + 0.5) * size.width
      const y = (-v.y * 0.5 + 0.5) * size.height
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`
    })
  })
  return null
}

/**
 * Render on demand: full frame rate while the visitor scrolls or moves the pointer (and while the
 * camera settles), a calm 24 fps idle otherwise so the water keeps breathing. Pauses with the tab.
 */
function Ticker({ animated }: { animated: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  // hover / pin changes always need a fresh frame (also in the still, reduced-motion view)
  useEffect(() => boatUI.subscribe(() => invalidate()), [invalidate])
  useEffect(() => {
    if (!animated) return
    let raf = 0
    let last = 0
    let lastInput = performance.now()
    const bump = () => {
      lastInput = performance.now()
    }
    const opts = { passive: true } as const
    window.addEventListener('scroll', bump, opts)
    window.addEventListener('pointermove', bump, opts)
    window.addEventListener('touchmove', bump, opts)
    window.addEventListener('resize', bump)
    const loop = (t: number) => {
      const busy = t - lastInput < 2500
      if (busy || t - last >= 1000 / 24) {
        invalidate()
        last = t
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', bump)
      window.removeEventListener('pointermove', bump)
      window.removeEventListener('touchmove', bump)
      window.removeEventListener('resize', bump)
    }
  }, [animated, invalidate])
  return null
}

/** Tells the loader once the first frame has been drawn. */
function FirstFrame() {
  const sent = useRef(false)
  useFrame(() => {
    if (sent.current) return
    sent.current = true
    requestAnimationFrame(() => loaderStep('frame'))
  })
  return null
}

/** Device tier: phones and modest hardware get fewer pixels and a lighter sea mesh. */
function deviceTier() {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const weak = (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4
  const small = window.matchMedia('(max-width: 860px), (pointer: coarse)').matches
  if (weak) return { dpr: [1, 1] as [number, number], sea: [140, 100] as [number, number], mask: 256, motes: 80 }
  if (small) return { dpr: [1, 1.5] as [number, number], sea: [200, 150] as [number, number], mask: 320, motes: 140 }
  return { dpr: [1, 1.75] as [number, number], sea: [300, 220] as [number, number], mask: 384, motes: 220 }
}

export default function Scene({ animated }: { animated: boolean }) {
  const [portrait, setPortrait] = useState(() => window.innerWidth < window.innerHeight)
  useEffect(() => {
    const on = () => setPortrait(window.innerWidth < window.innerHeight)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  const fog: [number, number] = !animated ? [45, 120] : portrait ? [24, 72] : [18, 58]
  // the canvas is a fixed backdrop, always on screen
  const tags = useMemo(buildTags, [])
  const tier = useMemo(deviceTier, [])
  const els = useRef<(HTMLDivElement | null)[]>([])
  const reticle = useRef<HTMLDivElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  return (
    <>
      <Canvas
        flat
        dpr={tier.dpr}
        frameloop="demand"
        camera={{ fov: 38, near: 0.1, far: 220, position: [0, 12, 18] }}
        gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
        aria-hidden="true"
        onPointerMissed={() => boatUI.set({ pinned: null })}
      >
        <color attach="background" args={[COLORS.sky]} />
        <fog attach="fog" args={[COLORS.sky, fog[0], fog[1]]} />
        <Sea fogNear={fog[0]} fogFar={fog[1]} segments={tier.sea} maskWidth={tier.mask} />
        <CompassRing />
        <Islands animated={animated} />
        <Harbours />
        <Route />
        <Sailboat />
        <Motes count={tier.motes} />
        <CameraRig animated={animated} />
        <TagProjector tags={tags} els={els} />
        <PartProjector reticle={reticle} tip={tip} />
        <Ticker animated={animated} />
        <FirstFrame />
      </Canvas>
      <BoatInspector reticle={reticle} tip={tip} />
      <div className="scene-tags" aria-hidden="true">
        {tags.map((t, i) => (
          <div key={t.key} ref={(el) => void (els.current[i] = el)} className="island-tag" {...t.attr} style={t.key === 'h1' ? { opacity: 0.3 } : undefined}>
            <span className="island-tag__name">{t.name}</span>
            <span className="island-tag__coord">{t.coord}</span>
          </div>
        ))}
      </div>
    </>
  )
}
