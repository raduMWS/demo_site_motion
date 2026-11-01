import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HARBOURS, ISLANDS, type IslandDef } from '../config/route'
import { inPolygon, islandPoints, type Pt } from '../lib/shapes'
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

/** Glowing point-lights scattered on the upper terraces. */
function TerraceLights({ def, pts, layers, count }: { def: IslandDef; pts: Pt[]; layers: number; count: number }) {
  const geo = useMemo(() => {
    const rnd = seeded(def.seed + 11)
    const out: number[] = []
    let guard = 0
    while (out.length / 3 < count && guard++ < 600) {
      const p = { x: (rnd() - 0.5) * def.rx * 1.7, y: (rnd() - 0.5) * def.ry * 1.7 }
      let level = -1
      for (let i = layers - 1; i >= 1; i--) {
        if (inPolygon(p, pts.map((q) => ({ x: q.x * layerScale(i) * 0.9, y: q.y * layerScale(i) * 0.9 })))) {
          level = i
          break
        }
      }
      if (level < 1) continue
      out.push(p.x / K, BASE + (level + 1) * STEP + 0.04, p.y / K)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3))
    return g
  }, [def, pts, layers, count])
  return (
    <points geometry={geo}>
      <pointsMaterial color={COLORS.aegean} size={0.06} sizeAttenuation transparent opacity={0.85} />
    </points>
  )
}

function Terraces({ def, layerCount = LAYERS, lights = 14 }: { def: IslandDef; layerCount?: number; lights?: number }) {
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
      <TerraceLights def={def} pts={pts} layers={layerCount} count={lights} />
    </group>
  )
}

function Lighthouse() {
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
      <group ref={beam} position={[0, 0.76, 0]}>
        <mesh geometry={cone} material={beamMat} />
      </group>
    </group>
  )
}

export function Islands() {
  return (
    <>
      {ISLANDS.map((def, i) => {
        const [x, z] = toWorld(def.cx, def.cy)
        return (
          <group key={def.id} position={[x, 0, z]}>
            <Terraces def={def} />
            {i === 0 && (
              <group position={[0, ISLAND_TOP, 0]}>
                <Lighthouse />
              </group>
            )}
          </group>
        )
      })}
    </>
  )
}

function House({ x, z, rot = 0, s = 1 }: { x: number; z: number; rot?: number; s?: number }) {
  const body = useMemo(() => new THREE.BoxGeometry(0.32, 0.2, 0.22), [])
  const roof = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.13, 0.13, 0.34, 3)
    g.rotateZ(Math.PI / 2)
    return g
  }, [])
  return (
    <group position={[x, 0, z]} rotation-y={rot} scale={s}>
      <Holo geometry={body} position={[0, 0.1, 0]} edge={COLORS.blue} fill={COLORS.white} fillOpacity={1} />
      <Holo geometry={roof} position={[0, 0.25, 0]} edge={COLORS.navy} fill={COLORS.blue} fillOpacity={1} threshold={10} />
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
              <Terraces def={land} layerCount={3} lights={8} />
              <group position-y={top}>
                <House x={-1.2} z={-0.3} rot={0.2} />
                <House x={-0.55} z={-0.55} rot={-0.15} s={0.85} />
                <House x={0.2} z={-0.45} rot={0.1} s={0.95} />
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
