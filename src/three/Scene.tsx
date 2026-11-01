import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { HARBOURS, ISLANDS } from '../config/route'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { BoatInspector, PartProjector } from './BoatInspector'
import { boatUI } from './boatParts'
import { CameraRig } from './CameraRig'
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

/** Stops rendering while the canvas is off-screen. */
function OffscreenPause({ animated }: { animated: boolean }) {
  const { gl, setFrameloop } = useThree()
  useEffect(() => {
    if (!animated) return
    const io = new IntersectionObserver(([e]) => setFrameloop(e.isIntersecting ? 'always' : 'never'))
    io.observe(gl.domElement)
    return () => io.disconnect()
  }, [gl, setFrameloop, animated])
  return null
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
  const els = useRef<(HTMLDivElement | null)[]>([])
  const reticle = useRef<HTMLDivElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  return (
    <>
      <Canvas
        flat
        dpr={[1, 1.75]}
        frameloop={animated ? 'always' : 'demand'}
        camera={{ fov: 38, near: 0.1, far: 220, position: [0, 12, 18] }}
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
        aria-hidden="true"
        onPointerMissed={() => boatUI.set({ pinned: null })}
      >
        <color attach="background" args={[COLORS.sky]} />
        <fog attach="fog" args={[COLORS.sky, fog[0], fog[1]]} />
        <Sea fogNear={fog[0]} fogFar={fog[1]} />
        <CompassRing />
        <Islands />
        <Harbours />
        <Route />
        <Sailboat />
        <Motes />
        <CameraRig animated={animated} />
        <TagProjector tags={tags} els={els} />
        <PartProjector reticle={reticle} tip={tip} />
        <OffscreenPause animated={animated} />
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.86} luminanceSmoothing={0.12} radius={0.6} />
          <Vignette offset={0.35} darkness={0.32} />
        </EffectComposer>
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
