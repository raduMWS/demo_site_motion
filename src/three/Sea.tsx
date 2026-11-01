import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleRoute, voyage } from '../lib/voyage'
import { bakeSeaMask } from './seaMask'
import { COLORS, SEA_H, SEA_W, toWorld } from './world'

const vertex = /* glsl */ `
uniform float uTime;
varying vec3 vWorld;
varying vec3 vN;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec2 p = wp.xz;
  float h = 0.0; vec2 g = vec2(0.0);
  vec2 D[4]; D[0]=normalize(vec2(1.0,0.35)); D[1]=normalize(vec2(-0.4,1.0)); D[2]=normalize(vec2(0.8,-0.6)); D[3]=normalize(vec2(-1.0,-0.2));
  float F[4]; F[0]=0.55; F[1]=1.05; F[2]=2.2; F[3]=3.6;
  float A[4]; A[0]=0.04; A[1]=0.025; A[2]=0.012; A[3]=0.007;
  float S[4]; S[0]=0.7; S[1]=0.9; S[2]=1.4; S[3]=1.9;
  for (int i = 0; i < 4; i++) {
    float k = dot(p, D[i]) * F[i] + uTime * S[i];
    h += A[i] * sin(k);
    g += A[i] * F[i] * cos(k) * D[i];
  }
  wp.y += h;
  vWorld = wp.xyz;
  vN = normalize(vec3(-g.x, 1.0, -g.y));
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

const fragment = /* glsl */ `
uniform float uTime;
uniform sampler2D uMask;
uniform vec2 uSea;
uniform vec3 uBoat;      // x, z, strength
uniform vec2 uBoatDir;
uniform vec3 uDeep, uShallow, uWhite, uMist, uFog, uSun;
uniform float uFogNear, uFogFar;
varying vec3 vWorld;
varying vec3 vN;

float lineAA(float v, float w) { return 1.0 - min(abs(fract(v - 0.5) - 0.5) / max(fwidth(v) * w, 1e-4), 1.0); }

void main() {
  vec2 uv = (vWorld.xz + uSea * 0.5) / uSea;
  vec2 e = smoothstep(vec2(0.0), vec2(0.04), uv) * (1.0 - smoothstep(vec2(0.96), vec2(1.0), uv));
  float inside = e.x * e.y;
  vec4 m = texture2D(uMask, clamp(uv, 0.0, 1.0)) * inside;
  float shore = m.r;
  float depth = m.g;

  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 L = normalize(uSun);
  vec2 rel = vWorld.xz - uBoat.xy;
  float dBoat = length(rel);

  // Aegean water: deep blue offshore, clear turquoise-blue over the shallows
  vec3 col = mix(uDeep, uShallow, smoothstep(0.08, 1.0, depth));

  // depth contour lines, drawn in white like a printed chart
  float cl = lineAA(depth * 8.0, 1.2) * smoothstep(0.03, 0.12, depth) * (1.0 - smoothstep(0.9, 0.99, depth));
  col = mix(col, uWhite, cl * 0.38);

  // faint chart dot grid
  vec2 g = vWorld.xz * 1.25;
  vec2 f = abs(fract(g) - 0.5);
  float dotg = 1.0 - smoothstep(0.0, max(fwidth(g.x) * 1.4, 0.03), length(f) - 0.025);
  col = mix(col, uMist, dotg * 0.18 * inside);

  // sunlight: soft diffuse, sparkling glints, sky reflection at grazing angles
  col *= 0.9 + 0.14 * clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(max(dot(reflect(-L, n), V), 0.0), 180.0);
  col += vec3(1.0) * spec * 0.7;
  float fres = pow(1.0 - max(dot(n, V), 0.0), 4.0);
  col = mix(col, uFog, fres * 0.45);

  // white surf on the coastline
  float coast = smoothstep(0.5, 0.88, shore) * (1.0 - smoothstep(0.97, 1.0, shore));
  col = mix(col, uWhite, coast * (0.75 + 0.2 * sin(uTime * 1.4 + depth * 20.0)));

  // gentle ripple ring from the boat
  float r = mod(uTime * 1.3, 8.0);
  float ping = (1.0 - smoothstep(0.0, 0.06 + r * 0.01, abs(dBoat - r))) * (1.0 - r / 8.0);
  col = mix(col, uWhite, ping * 0.22 * uBoat.z);

  // white wake: V arms + churned centre trail + bow foam
  float a = dot(rel, -uBoatDir);
  float b = dot(rel, vec2(-uBoatDir.y, uBoatDir.x));
  float arm = abs(abs(b) - (a * 0.3 + 0.1));
  float wake = (1.0 - smoothstep(0.0, 0.05 + a * 0.03, arm)) * step(0.0, a) * (1.0 - smoothstep(0.2, 2.6, a));
  float trail = (1.0 - smoothstep(0.0, 0.1 + a * 0.04, abs(b))) * step(0.25, a) * (1.0 - smoothstep(0.4, 2.2, a));
  float bow = (1.0 - smoothstep(0.2, 0.7, dBoat)) * 0.35;
  col = mix(col, uWhite, clamp((wake * 0.55 + trail * 0.5 + bow) * uBoat.z, 0.0, 1.0));

  float dist = length(cameraPosition - vWorld);
  col = mix(col, uFog, smoothstep(uFogNear, uFogFar, dist));

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`

export function Sea({ fogNear, fogFar }: { fogNear: number; fogFar: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMask: { value: bakeSeaMask() },
      uSea: { value: new THREE.Vector2(SEA_W, SEA_H) },
      uBoat: { value: new THREE.Vector3(0, 0, 1) },
      uBoatDir: { value: new THREE.Vector2(1, 0) },
      uDeep: { value: new THREE.Color(COLORS.seaDeep) },
      uShallow: { value: new THREE.Color(COLORS.seaShallow) },
      uWhite: { value: new THREE.Color(COLORS.white) },
      uMist: { value: new THREE.Color(COLORS.mist) },
      uFog: { value: new THREE.Color(COLORS.sky) },
      uSun: { value: new THREE.Vector3(-0.4, 0.75, -0.55) },
      uFogNear: { value: fogNear },
      uFogFar: { value: fogFar },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useFrame((state, dt) => {
    uniforms.uTime.value += Math.min(dt, 0.05)
    const fog = state.scene.fog as THREE.Fog | null
    if (fog) {
      uniforms.uFogNear.value = fog.near
      uniforms.uFogFar.value = fog.far
    }
    const r = sampleRoute(voyage.len)
    const [x, z] = toWorld(r.x, r.y)
    uniforms.uBoat.value.set(x, z, 1)
    uniforms.uBoatDir.value.set(Math.cos(r.heading), Math.sin(r.heading))
  })

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
      <planeGeometry args={[150, 110, 300, 220]} />
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} />
    </mesh>
  )
}
