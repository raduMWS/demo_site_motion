import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { ROUTE_POINTS } from '../config/route'
import { waypointLengths } from '../lib/routeMath'
import { routeLength, sampleRoute, voyage } from '../lib/voyage'
import { COLORS, toWorld } from './world'

const N = 520
const Y = 0.1

/** Plotted course: faint dashed line ahead, a glowing coral comet-trail behind the boat. */
export function Route() {
  const total = routeLength()
  const pts = useMemo(
    () =>
      Array.from({ length: N + 1 }, (_, i) => {
        const r = sampleRoute((i / N) * total)
        const [x, z] = toWorld(r.x, r.y)
        return new THREE.Vector3(x, Y, z)
      }),
    [total],
  )
  const stops = useMemo(() => {
    const l = waypointLengths(ROUTE_POINTS)
    return ROUTE_POINTS.map((p, i) => ({ p, len: l[i] }))
      .filter((w) => w.p.stop !== undefined)
      .map((w) => {
        const [x, z] = toWorld(w.p.x, w.p.y)
        return { x, z, len: w.len }
      })
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trail = useRef<any>(null)
  const colors = useMemo(() => new Float32Array((N + 1) * 3), [])
  const wake = useMemo(() => new THREE.Color(COLORS.white), [])
  const glow = useMemo(() => new THREE.Color(COLORS.mist), [])
  const dim = useMemo(() => new THREE.Color(COLORS.mist), [])
  const hot = useMemo(() => new THREE.Color(COLORS.white).multiplyScalar(1.2), [])
  const sea = useMemo(() => new THREE.Color(COLORS.seaShallow), [])
  const rings = useRef<(THREE.Mesh | null)[]>([])
  const last = useRef(-1)

  useFrame(() => {
    const cur = Math.floor((voyage.len / total) * N)
    const g = trail.current?.geometry
    if (g && cur !== last.current) {
      last.current = cur
      for (let i = 0; i <= N; i++) {
        const t = cur > 0 ? i / cur : 0
        const b = i <= cur ? 0.25 + 0.75 * Math.pow(t, 2.2) : 0
        // fades from the sea colour into bright white wake right behind the boat
        colors[i * 3] = sea.r + (wake.r - sea.r) * b
        colors[i * 3 + 1] = sea.g + (wake.g - sea.g) * b
        colors[i * 3 + 2] = sea.b + (wake.b - sea.b) * b
      }
      g.setColors(colors)
      g.instanceCount = Math.max(0, cur)
    }
    rings.current.forEach((m, i) => {
      if (!m) return
      const reached = voyage.len >= stops[i].len - 1
      ;(m.material as THREE.MeshBasicMaterial).color.copy(reached ? hot : glow)
    })
  })

  return (
    <group>
      <Line points={pts} color={dim} lineWidth={1.3} dashed dashSize={0.12} gapSize={0.22} transparent opacity={0.75} depthWrite={false} />
      <Line ref={trail} points={pts} vertexColors={Array.from({ length: N + 1 }, () => [0, 0, 0] as [number, number, number])} lineWidth={3} transparent depthWrite={false} />
      {stops.map((s, i) => (
        <group key={i} position={[s.x, Y + 0.01, s.z]}>
          <mesh rotation-x={-Math.PI / 2} ref={(m) => void (rings.current[i] = m)}>
            <ringGeometry args={[0.2, 0.25, 40]} />
            <meshBasicMaterial color={glow} transparent opacity={0.9} depthWrite={false} />
          </mesh>
          <mesh position-y={0.5}>
            <cylinderGeometry args={[0.006, 0.006, 1, 4]} />
            <meshBasicMaterial color={COLORS.white} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
