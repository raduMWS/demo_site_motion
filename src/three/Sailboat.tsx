import { useMemo, useRef, useSyncExternalStore } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleRoute, voyage } from '../lib/voyage'
import { BOAT_PARTS, boatUI } from './boatParts'
import { Beacon, Holo } from './Holo'
import { COLORS, toWorld } from './world'

/** Half-breadth outline of the hull, bow pointing +x. */
const HULL: [number, number][] = [
  [-0.7, 0.0], [-0.69, 0.14], [-0.6, 0.23], [-0.3, 0.29], [0.05, 0.29], [0.35, 0.24], [0.6, 0.13], [0.8, 0.0],
]

function hullShape(scale = 1) {
  const s = new THREE.Shape()
  const top = HULL.map(([x, y]) => new THREE.Vector2(x * scale, y * scale))
  const bottom = [...HULL].reverse().map(([x, y]) => new THREE.Vector2(x * scale, -y * scale))
  s.setFromPoints([...new THREE.SplineCurve(top).getPoints(24), ...new THREE.SplineCurve(bottom).getPoints(24)])
  return s
}

function extrude(shape: THREE.Shape, depth: number, bevel = 0.03) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 12 })
  g.rotateX(-Math.PI / 2)
  return g
}

/** Triangular sail with billow. a = tack, b = head, c = clew; billow pushes toward +z. */
function sailGeometry(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, billow: number) {
  const seg = 6
  const pos: number[] = []
  const idx: number[] = []
  for (let j = 0; j <= seg; j++) {
    const v = j / seg // 0 foot → 1 head
    for (let i = 0; i <= seg; i++) {
      const u = i / seg // 0 luff → 1 leech
      const luff = a.clone().lerp(b, v)
      const leech = c.clone().lerp(b, v)
      const p = luff.lerp(leech, u)
      p.z += Math.sin(Math.PI * u) * (1 - v) * billow
      pos.push(p.x, p.y, p.z)
    }
  }
  for (let j = 0; j < seg; j++)
    for (let i = 0; i < seg; i++) {
      const k = j * (seg + 1) + i
      idx.push(k, k + 1, k + seg + 1, k + 1, k + seg + 2, k + seg + 1)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export function Sailboat({ scale = 1 }: { scale?: number }) {
  const root = useRef<THREE.Group>(null)
  const heel = useRef<THREE.Group>(null)
  const state = useRef({ heading: 0, init: false, roll: 0, t: 0 })

  const geo = useMemo(() => {
    const mastX = 0.1
    return {
      hull: extrude(hullShape(1), 0.22, 0),
      deck: extrude(hullShape(0.84), 0.02, 0),
      cabin: new THREE.BoxGeometry(0.42, 0.12, 0.3),
      cockpit: new THREE.BoxGeometry(0.3, 0.03, 0.26),
      mast: new THREE.CylinderGeometry(0.014, 0.02, 1.9, 6),
      boom: new THREE.CylinderGeometry(0.012, 0.012, 0.74, 6),
      main: sailGeometry(new THREE.Vector3(mastX - 0.02, 0.36, 0), new THREE.Vector3(mastX - 0.02, 2.0, 0), new THREE.Vector3(-0.6, 0.4, 0), 0.16),
      jib: sailGeometry(new THREE.Vector3(0.76, 0.3, 0), new THREE.Vector3(mastX + 0.03, 1.78, 0), new THREE.Vector3(0.16, 0.36, 0), 0.12),
      mastX,
    }
  }, [])

  useFrame((_, dt) => {
    if (!root.current || !heel.current) return
    const st = state.current
    st.t += Math.min(dt, 0.05)
    const r = sampleRoute(voyage.len)
    const [x, z] = toWorld(r.x, r.y)
    // wrap-safe damped heading
    if (!st.init) {
      st.heading = r.heading
      st.init = true
    }
    let d = r.heading - st.heading
    d = Math.atan2(Math.sin(d), Math.cos(d))
    const k = 1 - Math.exp(-dt * 8)
    st.heading += d * k
    // heel into turns, plus a gentle swell roll
    const targetRoll = THREE.MathUtils.clamp(-d * 2.2, -0.35, 0.35) - 0.08
    st.roll += (targetRoll - st.roll) * (1 - Math.exp(-dt * 3))
    root.current.position.set(x, 0.02 + Math.sin(st.t * 1.3) * 0.025, z)
    root.current.rotation.y = -st.heading
    heel.current.rotation.x = st.roll + Math.sin(st.t * 1.1) * 0.03
    heel.current.rotation.z = Math.sin(st.t * 0.9 + 1) * 0.02
  })

  // which part is under the cursor / pinned – re-renders only when that changes
  useSyncExternalStore(boatUI.subscribe, boatUI.snapshot)
  const act = boatUI.hover ?? boatUI.pinned
  const hi = (ids: string[], base: string) => (act && ids.includes(act) ? COLORS.aegean : base)
  const hitMat = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }), [])

  const over = (id: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    boatUI.set({ hover: id })
    document.body.style.cursor = 'pointer'
  }
  const out = (id: string) => () => {
    if (boatUI.hover === id) boatUI.set({ hover: null })
    document.body.style.cursor = ''
  }
  const click = (id: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    boatUI.set({ pinned: boatUI.pinned === id ? null : id })
  }

  return (
    <group ref={root} scale={scale}>
      <group ref={heel}>
        <Holo geometry={geo.hull} position={[0, -0.02, 0]} edge={hi(['prova', 'pupa', 'babord', 'tribord'], COLORS.navy)} edgeOpacity={1} fill={COLORS.white} fillOpacity={1} threshold={35} />
        <Holo geometry={geo.deck} position={[0, 0.2, 0]} edge={COLORS.blue} edgeOpacity={0.6} fill={COLORS.offwhite} fillOpacity={1} threshold={35} />
        <Holo geometry={geo.cabin} position={[0.02, 0.29, 0]} edge={COLORS.navy} fill={COLORS.white} fillOpacity={1} />
        <Holo geometry={geo.cockpit} position={[-0.42, 0.235, 0]} edge={hi(['cockpit'], COLORS.blue)} fill={COLORS.blue} fillOpacity={0.9} />
        {/* mast + boom */}
        <Holo geometry={geo.mast} position={[geo.mastX, 1.18, 0]} edge={hi(['catarg'], COLORS.navy)} fill={COLORS.navy} threshold={60} />
        <Holo geometry={geo.boom} position={[-0.26, 0.38, 0]} rotation={[0, 0, Math.PI / 2 + 0.03]} edge={hi(['ghiu'], COLORS.navy)} fill={COLORS.navy} threshold={60} />
        <Beacon position={[geo.mastX, 2.16, 0]} size={0.045} intensity={1.6} />
        {/* port (red) / starboard (green) navigation lights */}
        <Beacon position={[0.45, 0.26, 0.24]} color={COLORS.stbdGreen} size={act === 'tribord' ? 0.045 : 0.025} intensity={2.5} />
        <Beacon position={[0.45, 0.26, -0.24]} color={COLORS.portRed} size={act === 'babord' ? 0.045 : 0.025} intensity={2.5} />
        {/* sails eased out to starboard */}
        <group rotation-y={-0.22}>
          <Holo geometry={geo.main} edge={hi(['randa'], COLORS.navy)} edgeOpacity={0.95} fill={act === 'randa' ? COLORS.mist : COLORS.white} fillOpacity={0.85} threshold={12} />
        </group>
        <group rotation-y={-0.12}>
          <Holo geometry={geo.jib} edge={hi(['foc'], COLORS.navy)} edgeOpacity={0.85} fill={act === 'foc' ? COLORS.mist : COLORS.white} fillOpacity={0.8} threshold={12} />
        </group>
        {/* invisible hit volumes for the anatomy hotspots */}
        {BOAT_PARTS.map((p) => (
          <mesh
            key={p.id}
            position={p.at}
            material={hitMat}
            ref={(m) => void (boatUI.objects[p.id] = m)}
            onPointerOver={over(p.id)}
            onPointerOut={out(p.id)}
            onClick={click(p.id)}
          >
            <boxGeometry args={p.size} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
