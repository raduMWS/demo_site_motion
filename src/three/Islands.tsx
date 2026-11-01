import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HARBOURS, ISLANDS, type IslandDef } from '../config/route'
import { inPolygon, islandPoints, type Pt } from '../lib/shapes'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Beacon, Holo } from './Holo'
import { COLORS, K, harbourLand, toWorld } from './world'

const LAYERS = 5
const STEP = 0.17
const BASE = -0.12
export const ISLAND_TOP = BASE + LAYERS * STEP

function shapeFrom(pts: Pt[], scale: number) {
  const s = new THREE.Shape()
  pts.forEach((p, i) => {
    // shape lives in XY; after rotateX(-90°) shape-y becomes world -z, so negate
    const x = (p.x * scale) / K
    const y = (-p.y * scale) / K
    if (i) s.lineTo(x, y)
    else s.moveTo(x, y)
  })
  s.closePath()
  return s
}

const layerScale = (i: number) => 1 - i * 0.17

function seeded(seed: number) {
  let t = seed * 9301 + 49297
  return () => {
    t = (t * 9301 + 49297) % 233280
    return t / 233280
  }
}

/* ------------------------------------------------------------------ Cycladic dressing
 * Minimal vegetation and Greek-island buildings, placed on the terraces with a seeded scatter.
 * Every object type is merged into ONE geometry per island → a handful of draw calls in total.
 */
/** Positions of the three harbour houses (also used by <Harbours/>). */
const HARBOUR_HOUSES: [number, number][] = [[-1.2, -0.3], [-0.55, -0.55], [0.2, -0.45]]

export interface Dressing {
  houses?: number
  chapel?: boolean
  windmill?: boolean
  cypress?: number
  olive?: number
  /** spots already occupied (island-local world x, z), e.g. existing harbour houses */
  reserved?: [number, number][]
}

/** What grows / stands on each island (by island id) – edit freely. */
export const DRESSING: Record<string, Dressing> = {
  i1: { chapel: true, cypress: 7, olive: 9 },
  i2: { houses: 4, chapel: true, cypress: 6, olive: 8 },
  i3: { houses: 3, windmill: true, cypress: 5, olive: 10 },
  i4: { houses: 5, chapel: true, cypress: 4, olive: 7 },
  h0: { cypress: 3, olive: 4, reserved: HARBOUR_HOUSES },
  h1: { cypress: 3, olive: 4, reserved: HARBOUR_HOUSES },
}

const topOf = (level: number) => BASE + level * STEP + STEP * 0.92

interface Placed { x: number; z: number; y: number; level: number }

/** Seeded scatter of points on the terraces (island-local world units). */
function scatter(def: IslandDef, pts: Pt[], layers: number, count: number, salt: number, minLevel: number, maxLevel: number, taken: Placed[], spacing: number, avoidCentre = 0): Placed[] {
  const rnd = seeded(def.seed * 7 + salt)
  const out: Placed[] = []
  let guard = 0
  while (out.length < count && guard++ < 900) {
    const p = { x: (rnd() - 0.5) * def.rx * 1.8, y: (rnd() - 0.5) * def.ry * 1.8 }
    let level = -1
    for (let i = layers - 1; i >= 0; i--) {
      if (inPolygon(p, pts.map((q) => ({ x: q.x * layerScale(i) * 0.86, y: q.y * layerScale(i) * 0.86 })))) {
        level = i
        break
      }
    }
    if (level < minLevel || level > maxLevel) continue
    const x = p.x / K
    const z = p.y / K
    if (avoidCentre && Math.hypot(x, z) < avoidCentre) continue
    if ([...taken, ...out].some((o) => Math.hypot(o.x - x, o.z - z) < spacing)) continue
    out.push({ x, z, y: topOf(level), level })
  }
  taken.push(...out)
  return out
}

function merged(parts: THREE.BufferGeometry[]) {
  if (!parts.length) return null
  const g = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  return g
}

function IslandDressing({ def, pts, layers, dressing, animated, avoidCentre = 0 }: { def: IslandDef; pts: Pt[]; layers: number; dressing: Dressing; animated: boolean; avoidCentre?: number }) {
  const geo = useMemo(() => {
    const taken: Placed[] = (dressing.reserved ?? []).map(([x, z]) => ({ x, z, y: 0, level: 0 }))
    const rnd = seeded(def.seed * 13 + 5)
    const top = layers - 1
    // buildings first, on the upper terraces
    const houseSpots = scatter(def, pts, layers, dressing.houses ?? 0, 1, Math.max(1, top - 1), top, taken, 0.36, avoidCentre)
    const chapelSpot = dressing.chapel ? scatter(def, pts, layers, 1, 2, Math.max(1, top - 1), top, taken, 0.44, avoidCentre) : []
    const millSpot = dressing.windmill ? scatter(def, pts, layers, 1, 3, top, top, taken, 0.5, avoidCentre) : []
    // vegetation on the slopes
    const cypressSpots = scatter(def, pts, layers, dressing.cypress ?? 0, 4, 1, top, taken, 0.2, avoidCentre)
    const oliveSpots = scatter(def, pts, layers, dressing.olive ?? 0, 5, 0, Math.max(0, top - 1), taken, 0.22, avoidCentre)

    const walls: THREE.BufferGeometry[] = []
    const domes: THREE.BufferGeometry[] = []
    houseSpots.forEach((s) => {
      const w = 0.2 + rnd() * 0.14
      const d = 0.16 + rnd() * 0.12
      const h = 0.15 + rnd() * 0.12
      const g = new THREE.BoxGeometry(w, h, d)
      g.rotateY(rnd() * Math.PI)
      g.translate(s.x, s.y + h / 2, s.z)
      walls.push(g)
      // a few houses get a small stacked cube, the Cycladic silhouette
      if (rnd() > 0.5) {
        const g2 = new THREE.BoxGeometry(w * 0.55, h * 0.6, d * 0.6)
        g2.translate(s.x + w * 0.18, s.y + h + h * 0.3, s.z)
        walls.push(g2)
      }
    })
    chapelSpot.forEach((s) => {
      const g = new THREE.BoxGeometry(0.32, 0.24, 0.32)
      g.translate(s.x, s.y + 0.12, s.z)
      walls.push(g)
      const dome = new THREE.SphereGeometry(0.135, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)
      dome.translate(s.x, s.y + 0.24, s.z)
      domes.push(dome)
    })
    const cyp: THREE.BufferGeometry[] = cypressSpots.map((s) => {
      const h = 0.42 + rnd() * 0.22
      const g = new THREE.ConeGeometry(0.072, h, 7)
      g.translate(s.x, s.y + h / 2, s.z)
      return g
    })
    const oli: THREE.BufferGeometry[] = oliveSpots.map((s) => {
      const r = 0.1 + rnd() * 0.05
      const g = new THREE.IcosahedronGeometry(r, 0)
      g.scale(1, 0.8, 1)
      g.translate(s.x, s.y + r * 0.8, s.z)
      return g
    })
    return { walls: merged(walls), domes: merged(domes), cypress: merged(cyp), olive: merged(oli), mill: millSpot[0] ?? null }
  }, [def, pts, layers, dressing, avoidCentre])

  return (
    <group>
      {geo.walls && <Holo geometry={geo.walls} edge={COLORS.blue} edgeOpacity={0.75} fill={COLORS.white} fillOpacity={1} threshold={30} />}
      {geo.domes && <Holo geometry={geo.domes} edge={COLORS.navy} edgeOpacity={0.6} fill={COLORS.blue} fillOpacity={1} threshold={60} />}
      {geo.cypress && <Holo geometry={geo.cypress} edge={COLORS.cypressEdge} edgeOpacity={0.9} fill={COLORS.cypress} fillOpacity={1} threshold={40} />}
      {geo.olive && <Holo geometry={geo.olive} edge={COLORS.oliveEdge} edgeOpacity={0.8} fill={COLORS.olive} fillOpacity={1} threshold={20} />}
      {geo.mill && <Windmill position={[geo.mill.x, geo.mill.y, geo.mill.z]} animated={animated} />}
    </group>
  )
}

/** A small Cycladic windmill: white tower, terracotta cap, four slowly turning sails. */
function Windmill({ position, animated }: { position: [number, number, number]; animated: boolean }) {
  const sails = useRef<THREE.Group>(null)
  const g = useMemo(() => {
    const tower = new THREE.CylinderGeometry(0.075, 0.095, 0.3, 12)
    const cap = new THREE.ConeGeometry(0.095, 0.11, 12)
    const blades = merged(
      [0, 1, 2, 3].map((k) => {
        const b = new THREE.BoxGeometry(0.012, 0.2, 0.005)
        b.translate(0, 0.1, 0)
        b.rotateZ((k * Math.PI) / 2 + Math.PI / 4)
        return b
      }),
    )!
    return { tower, cap, blades }
  }, [])
  useFrame((_, dt) => {
    if (animated && sails.current) sails.current.rotation.z += Math.min(dt, 0.05) * 0.6
  })
  return (
    <group position={position} scale={1.6}>
      <Holo geometry={g.tower} position={[0, 0.15, 0]} edge={COLORS.blue} fill={COLORS.white} fillOpacity={1} threshold={30} />
      <Holo geometry={g.cap} position={[0, 0.355, 0]} edge={COLORS.navy} fill={COLORS.terracotta} fillOpacity={1} threshold={30} />
      <group ref={sails} position={[0, 0.27, 0.1]}>
        <Holo geometry={g.blades} edge={COLORS.navy} fill={COLORS.offwhite} fillOpacity={1} threshold={30} />
      </group>
    </group>
  )
}

function Terraces({ def, layerCount = LAYERS, dressing, animated = true, avoidCentre = 0 }: { def: IslandDef; layerCount?: number; dressing?: Dressing; animated?: boolean; avoidCentre?: number }) {
  const pts = useMemo(() => islandPoints(def, 64), [def])
  const layers = useMemo(
    () =>
      Array.from({ length: layerCount }, (_, i) => {
        const g = new THREE.ExtrudeGeometry(shapeFrom(pts, layerScale(i)), { depth: STEP * 0.92, bevelEnabled: false, curveSegments: 4 })
        g.rotateX(-Math.PI / 2)
        return { g, y: BASE + i * STEP, top: i === layerCount - 1 }
      }),
    [pts, layerCount],
  )
  return (
    <group>
      {layers.map((l, i) => (
        <Holo
          key={i}
          geometry={l.g}
          position={[0, l.y, 0]}
          edge={i === 0 ? COLORS.blue : COLORS.navy}
          edgeOpacity={0.4 + (i / layerCount) * 0.5}
          fill={i === 0 ? COLORS.mist : COLORS.offwhite}
          fillOpacity={0.97}
          threshold={40}
        />
      ))}
      {dressing && <IslandDressing def={def} pts={pts} layers={layerCount} dressing={dressing} animated={animated} avoidCentre={avoidCentre} />}
    </group>
  )
}

function Lighthouse({ beam: showBeam = true }: { beam?: boolean }) {
  const beam = useRef<THREE.Group>(null)
  const tower = useMemo(() => new THREE.CylinderGeometry(0.055, 0.1, 0.7, 8, 3), [])
  const cone = useMemo(() => {
    const g = new THREE.ConeGeometry(0.55, 6, 32, 8, true)
    g.translate(0, -3, 0)
    g.rotateZ(Math.PI / 2)
    return g
  }, [])
  const beamMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color(COLORS.lamp) } },
        vertexShader: 'varying float vX; void main(){ vX = position.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 uColor; varying float vX; void main(){ float t = clamp(vX / 6.0, 0.0, 1.0); float a = pow(1.0 - t, 2.6) * 0.12; gl_FragColor = vec4(uColor * a, a); }',
      }),
    [],
  )
  useFrame((_, dt) => {
    if (beam.current) beam.current.rotation.y += Math.min(dt, 0.05) * 0.5
  })
  return (
    <group>
      <Holo geometry={tower} position={[0, 0.35, 0]} edge={COLORS.navy} fill={COLORS.white} threshold={10} />
      <Beacon position={[0, 0.76, 0]} size={0.07} intensity={1.6} />
      {showBeam && (
        <group ref={beam} position={[0, 0.76, 0]}>
          <mesh geometry={cone} material={beamMat} />
        </group>
      )}
    </group>
  )
}

export function Islands({ animated = true }: { animated?: boolean }) {
  return (
    <>
      {ISLANDS.map((def, i) => {
        const [x, z] = toWorld(def.cx, def.cy)
        return (
          <group key={def.id} position={[x, 0, z]}>
            <Terraces def={def} dressing={DRESSING[def.id]} animated={animated} avoidCentre={i === 0 ? 0.42 : 0} />
            {i === 0 && (
              <group position={[0, ISLAND_TOP, 0]}>
                <Lighthouse beam={animated} />
              </group>
            )}
          </group>
        )
      })}
    </>
  )
}

function House({ x, z, rot = 0, s = 1, roof: roofColor = COLORS.blue }: { x: number; z: number; rot?: number; s?: number; roof?: string }) {
  const body = useMemo(() => new THREE.BoxGeometry(0.32, 0.2, 0.22), [])
  const roof = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.13, 0.13, 0.34, 3)
    g.rotateZ(Math.PI / 2)
    return g
  }, [])
  return (
    <group position={[x, 0, z]} rotation-y={rot} scale={s}>
      <Holo geometry={body} position={[0, 0.1, 0]} edge={COLORS.blue} fill={COLORS.white} fillOpacity={1} />
      <Holo geometry={roof} position={[0, 0.25, 0]} edge={COLORS.navy} fill={roofColor} fillOpacity={1} threshold={10} />
    </group>
  )
}

/** Harbours: a low headland, a few houses, a jetty and a coral harbour light. */
export function Harbours() {
  const jetty = useMemo(() => new THREE.BoxGeometry(1, 0.14, 0.24), [])
  return (
    <>
      {HARBOURS.map((h, i) => {
        const land = harbourLand(h, i)
        const [lx, lz] = toWorld(land.cx, land.cy)
        const [ax, az] = toWorld(h.x - 25, h.y + 58)
        const [bx, bz] = toWorld(h.x + 34, h.y + 26)
        const len = Math.hypot(bx - ax, bz - az)
        const ang = Math.atan2(bz - az, bx - ax)
        const top = BASE + 3 * STEP
        return (
          <group key={h.id}>
            <group position={[lx, 0, lz]}>
              <Terraces def={land} layerCount={3} dressing={DRESSING[h.id]} />
              <group position-y={top}>
                <House x={HARBOUR_HOUSES[0][0]} z={HARBOUR_HOUSES[0][1]} rot={0.2} />
                <House x={HARBOUR_HOUSES[1][0]} z={HARBOUR_HOUSES[1][1]} rot={-0.15} s={0.85} roof={COLORS.terracotta} />
                <House x={HARBOUR_HOUSES[2][0]} z={HARBOUR_HOUSES[2][1]} rot={0.1} s={0.95} />
              </group>
            </group>
            <group position={[(ax + bx) / 2, 0.1, (az + bz) / 2]} rotation-y={-ang} scale={[len, 1, 1]}>
              <Holo geometry={jetty} edge={COLORS.blue} fill={COLORS.white} />
            </group>
            <Beacon position={[bx, 0.45, bz]} size={0.06} intensity={1.6} />
          </group>
        )
      })}
    </>
  )
}
