import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS } from './world'

interface HoloProps {
  geometry: THREE.BufferGeometry
  edge?: string
  edgeOpacity?: number
  fill?: string
  fillOpacity?: number
  threshold?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
}

/**
 * Line-art primitive: a whitewashed body with crisp coloured edges (Mediterranean chart style).
 */
export function Holo({ geometry, edge = COLORS.blue, edgeOpacity = 0.9, fill = COLORS.offwhite, fillOpacity = 0.92, threshold = 28, position, rotation }: HoloProps) {
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, threshold), [geometry, threshold])
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} renderOrder={1}>
        <meshBasicMaterial color={fill} transparent opacity={fillOpacity} depthWrite={fillOpacity > 0.5} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <lineSegments geometry={edges} renderOrder={2}>
        <lineBasicMaterial color={edge} transparent opacity={edgeOpacity} toneMapped={false} />
      </lineSegments>
    </group>
  )
}

/** Small glowing light (bloom picks it up). */
export function Beacon({ color = COLORS.lamp, size = 0.06, intensity = 1.6, position }: { color?: string; size?: number; intensity?: number; position?: [number, number, number] }) {
  const c = useMemo(() => new THREE.Color(color).multiplyScalar(intensity), [color, intensity])
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 12, 8]} />
      <meshBasicMaterial color={c} toneMapped={false} />
    </mesh>
  )
}
