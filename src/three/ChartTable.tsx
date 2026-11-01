import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from './world'

const R = 23.5

/** The giant compass-bearing ring that frames the archipelago like a chart table. */
export function CompassRing() {
  const geo = useMemo(() => {
    const pos: number[] = []
    for (let d = 0; d < 360; d += 2) {
      const a = (d * Math.PI) / 180
      const len = d % 30 === 0 ? 1.0 : d % 10 === 0 ? 0.55 : 0.28
      const c = Math.cos(a)
      const s = Math.sin(a)
      pos.push(c * R, 0, s * R, c * (R + len), 0, s * (R + len))
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [])
  const circle = (r: number) => {
    const g = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 257 }, (_, i) => {
        const a = (i / 256) * Math.PI * 2
        return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)
      }),
    )
    return g
  }
  const c1 = useMemo(() => circle(R), [])
  const c2 = useMemo(() => circle(R + 1.35), [])
  const c3 = useMemo(() => circle(R - 0.6), [])
  return (
    <group position-y={0.06}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color={COLORS.white} transparent opacity={0.6} />
      </lineSegments>
      <lineLoop geometry={c1}>
        <lineBasicMaterial color={COLORS.white} transparent opacity={0.65} />
      </lineLoop>
      <lineLoop geometry={c2}>
        <lineBasicMaterial color={COLORS.mist} transparent opacity={0.45} />
      </lineLoop>
      <lineLoop geometry={c3}>
        <lineBasicMaterial color={COLORS.mist} transparent opacity={0.3} />
      </lineLoop>
      {/* north marker */}
      <mesh position={[0, 0.01, -(R + 1.9)]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.45, 3]} />
        <meshBasicMaterial color={COLORS.white} />
      </mesh>
    </group>
  )
}

/** Sparse drifting motes of light above the water. */
export function Motes({ count = 220 }: { count?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    let t = 7
    const rnd = () => ((t = (t * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2
      const r = Math.sqrt(rnd()) * 22
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = 0.3 + rnd() * 3.2
      pos[i * 3 + 2] = Math.sin(a) * r * 0.75
      seed[i] = rnd() * 100
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [count])
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color(COLORS.white) } }), [])
  useFrame((_, dt) => {
    uniforms.uTime.value += Math.min(dt, 0.05)
  })
  return (
    <points geometry={geo}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          uniform float uTime; attribute float aSeed; varying float vA;
          void main(){
            vec3 p = position;
            p.y += sin(uTime * 0.4 + aSeed) * 0.18;
            p.x += sin(uTime * 0.15 + aSeed * 1.7) * 0.25;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (2.2 + 1.6 * fract(aSeed)) * (14.0 / -mv.z);
            vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 0.9 + aSeed * 3.0));
            gl_Position = projectionMatrix * mv;
          }`}
        fragmentShader={`
          uniform vec3 uColor; varying float vA;
          void main(){
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d) * vA;
            gl_FragColor = vec4(uColor * a, a);
          }`}
      />
    </points>
  )
}
