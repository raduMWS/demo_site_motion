import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleRoute, voyage } from '../lib/voyage'
import { toWorld } from './world'

const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

/** Follows the boat along the route. All inputs come from `voyage`, written by the scroll timeline. */
export function CameraRig({ animated }: { animated: boolean }) {
  const { camera, size, invalidate, scene } = useThree()
  const st = useRef({ init: false, heading: 0, shift: 0, fw: 0, fx: 0, fz: 0, look: new THREE.Vector3(), pos: new THREE.Vector3() })

  // still overview for reduced motion: the whole chart, slightly oblique
  useEffect(() => {
    if (animated) return
    const cam = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const halfW = 23
    const d = halfW / (Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * aspect)
    const dist = Math.max(d, 24)
    const el = THREE.MathUtils.degToRad(58)
    cam.position.set(0, Math.sin(el) * dist, Math.cos(el) * dist + 1.5)
    cam.lookAt(0, 0, 1.2)
    invalidate()
  }, [animated, camera, size, invalidate])

  useFrame((_, rawDt) => {
    if (!animated) return
    const dt = Math.min(rawDt, 0.05)
    const s = st.current
    const r = sampleRoute(voyage.len)
    const [bx, bz] = toWorld(r.x, r.y)
    if (!s.init) s.heading = r.heading

    let d = r.heading - s.heading
    d = Math.atan2(Math.sin(d), Math.cos(d))
    s.heading += d * (1 - Math.exp(-dt * 1.1))
    s.shift += (voyage.shift - s.shift) * (1 - Math.exp(-dt * 2))

    const aspect = size.width / size.height
    const portrait = aspect < 1 ? 1 + (1 - aspect) * 0.9 : Math.max(1, 1.45 / aspect)
    const zoom = (1 + 1.25 * (1 - smooth(voyage.s / 0.06)) + 0.6 * smooth((voyage.s - 0.93) / 0.07)) * portrait

    // island in focus (smoothed): the camera keeps it ahead of the lens
    const [fx, fz] = toWorld(voyage.focusX, voyage.focusY)
    const kf = 1 - Math.exp(-dt * 1.5)
    s.fw += (voyage.focusW - s.fw) * kf
    s.fx += (fx - s.fx) * kf
    s.fz += (fz - s.fz) * kf

    // camera sits mostly "south" of the boat, a little behind it, and on the far side from the island
    const back = new THREE.Vector2(-Math.cos(s.heading), -Math.sin(s.heading))
    const away = new THREE.Vector2(bx - s.fx, bz - s.fz)
    if (away.lengthSq() > 1e-4) away.normalize()
    const dir = new THREE.Vector2(0, 1)
      .multiplyScalar(0.72 * (1 - s.fw * 0.55))
      .add(back.multiplyScalar(0.28 * (1 - s.fw * 0.5)))
      .add(away.multiplyScalar(0.75 * s.fw))
      .normalize()
    const dist = 10.4 * zoom
    // haze scales with the shot, so wide establishing views stay crisp
    const fog = scene.fog as THREE.Fog | null
    if (fog) {
      fog.near = 16 + dist * 0.75
      fog.far = 46 + dist * 1.6
    }
    const intro = 1 - smooth(voyage.s / 0.06)
    const height = 4.9 * zoom * (1 - 0.1 * intro)
    const desired = new THREE.Vector3(bx + dir.x * dist, height, bz + dir.y * dist)

    // frame the boat away from the copy panel
    const fwd = new THREE.Vector3(bx - desired.x, 0, bz - desired.z).normalize()
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize()
    const look = new THREE.Vector3(bx + Math.cos(s.heading) * 1.2, 0.3 + intro * 0.9, bz + Math.sin(s.heading) * 1.2).lerp(new THREE.Vector3(s.fx, 0.4, s.fz), 0.38 * s.fw)
    // portrait screens: cards sit low, so frame the boat in the upper part of the view
    if (aspect < 1) look.addScaledVector(new THREE.Vector3(dir.x, 0, dir.y), (1 - aspect) * 6 * zoom).addScaledVector(right, -s.shift * 2.1 * zoom * (aspect < 1 ? 0 : 1))

    if (!s.init) {
      s.fx = fx
      s.fz = fz
      s.pos.copy(desired)
      s.look.copy(look)
      s.init = true
    }
    const k = 1 - Math.exp(-dt * 3.2)
    s.pos.lerp(desired, k)
    s.look.lerp(look, k)
    camera.position.copy(s.pos)
    camera.lookAt(s.look)
  })
  return null
}
