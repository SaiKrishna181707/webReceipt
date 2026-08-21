'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

/* ============================================================================
   VICE CITY KIT
   Every object on the strip, built from primitives — no downloaded assets, no
   licensed geometry, nothing to fetch at runtime. The sky, the sun and the road
   are three shaders; everything else is boxes, cylinders and cones lit by two
   neon rect lights and one low gold sun.
   ========================================================================== */

export const VICE = {
  neon: '#ff2e97',
  neonDeep: '#b0055b',
  aqua: '#2de2e6',
  aquaDeep: '#026e77',
  gold: '#ffc23c',
  sunset: '#ff7418',
  mint: '#35f39a',
  blood: '#ff2d5e',
  violet: '#8b4dff',
  night: '#0a0510',
  asphalt: '#171029',
  chrome: '#d8dced',
  palm: '#06231a',
  /** Pastel Deco stucco — the only non-glowing colour on the beach. */
  stucco: '#f0d8e4',
  stuccoMint: '#cfeee3',
  teal: '#0d4f56',
} as const

export type ViceColor = keyof typeof VICE | (string & {})

export const viceHex = (c: ViceColor) => (c in VICE ? VICE[c as keyof typeof VICE] : (c as string))

/* ============================================================================
   MATERIALS
   One instance per colour+finish, shared across the whole scene.
   ========================================================================== */

const cache = new Map<string, THREE.Material>()

/** Automotive lacquer: deep base, hard clearcoat, so the strip reflects in it. */
export function paint(color: ViceColor, opts: { rough?: number; metal?: number } = {}) {
  const key = `paint:${viceHex(color)}:${opts.rough ?? 0.28}:${opts.metal ?? 0}`
  let m = cache.get(key) as THREE.MeshPhysicalMaterial | undefined
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(viceHex(color)),
      roughness: opts.rough ?? 0.28,
      metalness: opts.metal ?? 0,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      reflectivity: 0.6,
    })
    cache.set(key, m)
  }
  return m
}

/** Brushed chrome — bumpers, railings, sign frames. */
export function chrome(rough = 0.18) {
  const key = `chrome:${rough}`
  let m = cache.get(key) as THREE.MeshStandardMaterial | undefined
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(VICE.chrome),
      roughness: rough,
      metalness: 1,
    })
    cache.set(key, m)
  }
  return m
}

/** Stucco: matte, slightly warm, takes the sunset like a Deco hotel wall. */
export function stucco(color: ViceColor) {
  const key = `stucco:${viceHex(color)}`
  let m = cache.get(key) as THREE.MeshStandardMaterial | undefined
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(viceHex(color)),
      roughness: 0.82,
      metalness: 0,
    })
    cache.set(key, m)
  }
  return m
}

/**
 * A lit gas tube. Basic material so it stays at full brightness regardless of
 * where the lights are — which is exactly how neon behaves on camera.
 */
export function tubeMat(color: ViceColor, dim = 1) {
  const key = `tube:${viceHex(color)}:${dim}`
  let m = cache.get(key) as THREE.MeshBasicMaterial | undefined
  if (!m) {
    const c = new THREE.Color(viceHex(color))
    if (dim !== 1) c.multiplyScalar(dim)
    m = new THREE.MeshBasicMaterial({ color: c, toneMapped: false })
    cache.set(key, m)
  }
  return m
}

/** The halo around a tube. Additive, unlit, never writes depth. */
export function haloMat(color: ViceColor, opacity = 0.16) {
  const key = `halo:${viceHex(color)}:${opacity}`
  let m = cache.get(key) as THREE.MeshBasicMaterial | undefined
  if (!m) {
    m = new THREE.MeshBasicMaterial({
      color: new THREE.Color(viceHex(color)),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    })
    cache.set(key, m)
  }
  return m
}

/* ============================================================================
   THE SKY
   One inverted sphere: dusk gradient, stars, streaked cloud, and the banded sun
   sitting just above the water. The dome rides with the camera so the horizon
   never runs out.
   ========================================================================== */

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SKY_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSunDir;
  varying vec3 vDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec3 d = normalize(vDir);
    float t = d.y;

    vec3 below   = vec3(0.030, 0.014, 0.060);
    vec3 horizon = vec3(1.000, 0.640, 0.260);
    vec3 lower   = vec3(0.880, 0.220, 0.400);
    vec3 mid     = vec3(0.430, 0.070, 0.470);
    vec3 upper   = vec3(0.135, 0.030, 0.280);
    vec3 zenith  = vec3(0.030, 0.014, 0.068);

    vec3 col = below;
    col = mix(col, horizon, smoothstep(-0.055, 0.006, t));
    col = mix(col, lower,   smoothstep(0.004, 0.085, t));
    col = mix(col, mid,     smoothstep(0.070, 0.200, t));
    col = mix(col, upper,   smoothstep(0.185, 0.420, t));
    col = mix(col, zenith,  smoothstep(0.400, 0.820, t));

    // Streaked cloud, lit from below by the strip.
    float cl = sin(d.y * 42.0 + sin(d.x * 3.1 + uTime * 0.04) * 1.6);
    cl = smoothstep(0.87, 1.0, cl) * smoothstep(0.01, 0.17, t) * (1.0 - smoothstep(0.2, 0.44, t));
    col += vec3(1.0, 0.46, 0.52) * cl * 0.24;

    // Stars, only once the sky has gone properly violet.
    vec2 cell = floor(d.xz * 240.0 / max(0.34, d.y + 0.15));
    float rnd = hash(cell);
    float star = step(0.9977, rnd) * smoothstep(0.3, 0.62, t);
    col += vec3(0.88, 0.9, 1.0) * star * (0.45 + 0.55 * sin(uTime * 2.2 + rnd * 40.0));

    // The sun: a hard disc, sliced by horizontal bands that crawl upward.
    vec3 s = normalize(uSunDir);
    float dd = distance(d, s);
    float glow = pow(max(0.0, 1.0 - dd / 0.95), 3.4);
    col += vec3(1.0, 0.52, 0.24) * glow * 0.8;

    float disc = 1.0 - smoothstep(0.082, 0.090, dd);
    float dy = d.y - s.y;
    float stripe = step(0.44, fract(dy * 150.0 - uTime * 0.42));
    float belowCentre = 1.0 - smoothstep(-0.022, 0.004, dy);
    float mask = disc * (1.0 - belowCentre * (1.0 - stripe));
    vec3 sunCol = mix(vec3(1.0, 0.72, 0.26), vec3(1.0, 0.97, 0.84), smoothstep(-0.06, 0.06, dy));
    col = mix(col, sunCol, mask);

    gl_FragColor = vec4(col, 1.0);
  }
`

export function SkyDome({ sun = [0, 0.055, -1] as [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uSunDir: { value: new THREE.Vector3(...sun).normalize() },
        },
      }),
    [sun],
  )

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    // Ride with the camera so the dome reads as infinitely far away.
    mesh.current?.position.copy(state.camera.position)
  })

  return (
    <mesh ref={mesh} material={material} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[300, 32, 20]} />
    </mesh>
  )
}

/* ============================================================================
   THE ROAD
   Wet asphalt with a neon survey grid burned into it, plus the sun's reflection
   rippling straight up the middle. `scroll` drives the grid toward the camera,
   so the same shader works for a parked scene and a drive-by.
   ========================================================================== */

const ROAD_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const ROAD_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform vec3 uCam;
  uniform vec3 uLineA;
  uniform vec3 uLineB;
  uniform float uSpacing;
  varying vec3 vWorld;

  void main() {
    vec3 p = vWorld;
    float dist = length(p.xz - uCam.xz);
    float fade = 1.0 - smoothstep(16.0, 130.0, dist);

    float w = 0.05 + dist * 0.022;
    float gx = abs(fract(p.x / uSpacing + 0.5) - 0.5) * uSpacing;
    float gz = abs(fract((p.z + uScroll) / uSpacing + 0.5) - 0.5) * uSpacing;
    float lineX = 1.0 - smoothstep(0.0, w, gx);
    float lineZ = 1.0 - smoothstep(0.0, w, gz);

    vec3 col = mix(vec3(0.022, 0.010, 0.045), vec3(0.085, 0.030, 0.150), fade);
    col += uLineB * lineX * fade * 0.9;
    col += uLineA * lineZ * fade * 0.9;

    // The sun, rippling back off the wet surface.
    float ripple = 0.55 + 0.45 * sin(p.z * 0.75 - uTime * 1.7) * sin(p.z * 0.22 + uTime * 0.55);
    float streak = exp(-abs(p.x) / (1.5 + 2.4 * ripple)) * (1.0 - smoothstep(8.0, 150.0, dist));
    col += vec3(1.0, 0.54, 0.20) * streak * 0.55;

    gl_FragColor = vec4(col, 1.0);
  }
`

export function NeonRoad({
  size = 320,
  spacing = 4,
  scroll,
  lineA = VICE.neon,
  lineB = VICE.aqua,
  ...group
}: Omit<ThreeElements['mesh'], 'args' | 'material'> & {
  size?: number
  spacing?: number
  /** Optional live offset, in world units, for a driving grid. */
  scroll?: React.MutableRefObject<number>
  lineA?: ViceColor
  lineB?: ViceColor
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ROAD_VERT,
        fragmentShader: ROAD_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uScroll: { value: 0 },
          uCam: { value: new THREE.Vector3() },
          uSpacing: { value: spacing },
          uLineA: { value: new THREE.Color(viceHex(lineA)) },
          uLineB: { value: new THREE.Color(viceHex(lineB)) },
        },
      }),
    [spacing, lineA, lineB],
  )

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uCam.value.copy(state.camera.position)
    if (scroll) material.uniforms.uScroll.value = scroll.current
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={material} {...group}>
      <planeGeometry args={[size, size]} />
    </mesh>
  )
}

/* ============================================================================
   NEON HARDWARE
   ========================================================================== */

/** A straight run of tube: the lit glass, plus an additive sleeve around it. */
export function NeonBar({
  len = 2,
  thick = 0.055,
  color = 'neon',
  dim = 1,
  glow = true,
  ...group
}: Omit<ThreeElements['group'], 'args'> & {
  len?: number
  thick?: number
  color?: ViceColor
  dim?: number
  glow?: boolean
}) {
  return (
    <group {...group}>
      <mesh material={tubeMat(color, dim)}>
        <boxGeometry args={[len, thick, thick]} />
      </mesh>
      {glow && dim > 0.25 && (
        <mesh material={haloMat(color, 0.13 * dim)}>
          <boxGeometry args={[len + 0.05, thick * 5.5, thick * 5.5]} />
        </mesh>
      )}
    </group>
  )
}

/** Chasing bulbs — the arrow that points at a motel vacancy sign. */
export function MarqueeLights({
  count = 9,
  spacing = 0.42,
  color = 'gold',
  speed = 3.2,
  ...group
}: Omit<ThreeElements['group'], 'args'> & {
  count?: number
  spacing?: number
  color?: ViceColor
  speed?: number
}) {
  const bulbs = useRef<(THREE.Group | null)[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed
    bulbs.current.forEach((b, i) => {
      if (!b) return
      // A travelling wave, tight enough that only two bulbs are hot at once.
      const phase = Math.sin(t - i * 0.7)
      const on = Math.max(0, phase) ** 4
      b.scale.setScalar(0.55 + on * 0.85)
    })
  })

  return (
    <group {...group}>
      {Array.from({ length: count }, (_, i) => (
        <group key={i} ref={(el) => { bulbs.current[i] = el }} position={[(i - (count - 1) / 2) * spacing, 0, 0]}>
          <mesh material={tubeMat(color)}>
            <sphereGeometry args={[0.075, 10, 8]} />
          </mesh>
          <mesh material={haloMat(color, 0.3)}>
            <sphereGeometry args={[0.2, 10, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ============================================================================
   PALMS
   A drooping trunk swept along a curve, nine cone fronds, three coconuts. At
   dusk a palm is a silhouette, so the geometry can stay cheap.
   ========================================================================== */

const trunkGeom = (() => {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.16, 2.2, 0.05),
    new THREE.Vector3(0.36, 4.4, 0.12),
    new THREE.Vector3(0.72, 6.6, 0.2),
  ])
  return new THREE.TubeGeometry(curve, 14, 0.19, 7, false)
})()

const frondGeom = new THREE.ConeGeometry(0.34, 3.1, 4, 1)
const coconutGeom = new THREE.SphereGeometry(0.12, 8, 6)

export function PalmTree({
  height = 1,
  fronds = 9,
  seed = 0,
  sway = 1,
  ...group
}: Omit<ThreeElements['group'], 'args'> & {
  height?: number
  fronds?: number
  seed?: number
  sway?: number
}) {
  const crown = useRef<THREE.Group>(null)
  const bark = stucco('palm')
  const leaf = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color('#08281c'), roughness: 0.9, side: THREE.DoubleSide }),
    [],
  )

  useFrame((state) => {
    const g = crown.current
    if (!g) return
    const t = state.clock.elapsedTime
    // Offshore breeze: one slow swell with a faster shiver on top.
    g.rotation.z = Math.sin(t * 0.55 + seed) * 0.055 * sway + Math.sin(t * 2.1 + seed * 3) * 0.012 * sway
    g.rotation.x = Math.cos(t * 0.4 + seed * 2) * 0.035 * sway
  })

  return (
    <group {...group} scale={height}>
      <mesh geometry={trunkGeom} material={bark} castShadow />
      <group ref={crown} position={[0.72, 6.6, 0.2]}>
        {Array.from({ length: fronds }, (_, i) => {
          const a = (i / fronds) * Math.PI * 2 + seed
          // Outer fronds hang lower than the ones still reaching for the sky.
          const droop = 0.12 + ((i * 37) % 11) / 19
          return (
            <group key={i} rotation={[0, a, 0]}>
              <group rotation={[0, 0, -droop]}>
                <mesh
                  geometry={frondGeom}
                  material={leaf}
                  position={[1.45, 0, 0]}
                  rotation={[0, 0, -Math.PI / 2]}
                  scale={[1, 1, 0.16]}
                  castShadow
                />
              </group>
            </group>
          )
        })}
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            geometry={coconutGeom}
            material={bark}
            position={[Math.cos(i * 2.3) * 0.2, -0.16, Math.sin(i * 2.3) * 0.2]}
          />
        ))}
      </group>
    </group>
  )
}

/* ============================================================================
   ART DECO FACADE
   Three setbacks, a neon parapet on each, porthole windows, and a lit window
   grid painted into a canvas texture so a whole tower costs a handful of draws.
   ========================================================================== */

function makeWindowTexture(cols = 8, rows = 14, lit = 0.55, warm = true) {
  const cell = 16
  const c = document.createElement('canvas')
  c.width = cols * cell
  c.height = rows * cell
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#05030a'
  ctx.fillRect(0, 0, c.width, c.height)

  // Deterministic so every reload gives the same skyline.
  let s = 1337
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const on = rnd() < lit
      if (!on) continue
      const warmth = rnd()
      ctx.fillStyle = warm
        ? warmth > 0.7
          ? '#ffd98a'
          : warmth > 0.4
            ? '#ff9ec9'
            : '#fff2cf'
        : warmth > 0.6
          ? '#a9f4ff'
          : '#dffbff'
      ctx.fillRect(x * cell + 4, y * cell + 4, cell - 8, cell - 7)
    }
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function DecoTower({
  width = 4,
  depth = 3,
  floors = 9,
  color = 'stucco',
  trim = 'aqua',
  warmWindows = true,
  ...group
}: Omit<ThreeElements['group'], 'args'> & {
  width?: number
  depth?: number
  floors?: number
  color?: ViceColor
  trim?: ViceColor
  warmWindows?: boolean
}) {
  const floorH = 1.15
  const wall = stucco(color)

  const glassMat = useMemo(() => {
    const tex = makeWindowTexture(8, 14, 0.5, warmWindows)
    tex.repeat.set(Math.max(1, Math.round(width / 2)), Math.max(1, Math.round(floors / 2)))
    return new THREE.MeshStandardMaterial({
      color: '#0a0614',
      roughness: 0.25,
      metalness: 0.15,
      emissiveMap: tex,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 1.25,
    })
  }, [width, floors, warmWindows])

  // Three setbacks, each narrower than the last — the Deco stepped massing.
  const tiers = [
    { h: floors * floorH * 0.6, w: width, d: depth, y: 0 },
    { h: floors * floorH * 0.26, w: width * 0.72, d: depth * 0.82, y: floors * floorH * 0.6 },
    { h: floors * floorH * 0.14, w: width * 0.4, d: depth * 0.6, y: floors * floorH * 0.86 },
  ]

  return (
    <group {...group}>
      {tiers.map((t, i) => (
        <group key={i} position={[0, t.y, 0]}>
          <mesh position={[0, t.h / 2, 0]} material={wall} castShadow receiveShadow>
            <boxGeometry args={[t.w, t.h, t.d]} />
          </mesh>
          {/* Lit window band on the street-facing face */}
          <mesh position={[0, t.h / 2, t.d / 2 + 0.012]} material={glassMat}>
            <planeGeometry args={[t.w * 0.86, t.h * 0.84]} />
          </mesh>
          {/* Neon parapet, front and sides */}
          <NeonBar len={t.w + 0.08} thick={0.06} color={trim} position={[0, t.h + 0.05, t.d / 2]} />
          <NeonBar
            len={t.d + 0.08}
            thick={0.06}
            color={trim}
            rotation={[0, Math.PI / 2, 0]}
            position={[t.w / 2, t.h + 0.05, 0]}
          />
          <NeonBar
            len={t.d + 0.08}
            thick={0.06}
            color={trim}
            rotation={[0, Math.PI / 2, 0]}
            position={[-t.w / 2, t.h + 0.05, 0]}
          />
        </group>
      ))}

      {/* Vertical corner tubes — the "hotel" spine */}
      {[-1, 1].map((s) => (
        <NeonBar
          key={s}
          len={tiers[0].h}
          thick={0.05}
          color={trim}
          dim={0.9}
          rotation={[0, 0, Math.PI / 2]}
          position={[s * (width / 2 + 0.02), tiers[0].h / 2, depth / 2]}
        />
      ))}

      {/* Ground-floor awning + porthole windows, straight off Collins Avenue */}
      <mesh position={[0, 2.5, depth / 2 + 0.4]} material={stucco('stuccoMint')} castShadow>
        <boxGeometry args={[width * 1.02, 0.12, 0.8]} />
      </mesh>
      {[-1, 0, 1].map((i) => (
        <mesh
          key={i}
          position={[i * (width / 4), 1.5, depth / 2 + 0.02]}
          rotation={[0, 0, 0]}
          material={tubeMat('gold', 0.55)}
        >
          <circleGeometry args={[0.22, 16]} />
        </mesh>
      ))}
    </group>
  )
}

/* ============================================================================
   STREET LAMP
   A chrome shepherd's crook with a sodium head and a puddle of light under it.
   ========================================================================== */

const armCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 3.6, 0),
  new THREE.Vector3(0.28, 4.5, 0),
  new THREE.Vector3(1.1, 4.72, 0),
])
const lampGeom = new THREE.TubeGeometry(armCurve, 16, 0.06, 6, false)

export function StreetLamp({
  color = 'gold',
  flip = false,
  ...group
}: Omit<ThreeElements['group'], 'args'> & { color?: ViceColor; flip?: boolean }) {
  return (
    <group {...group} scale={[flip ? -1 : 1, 1, 1]}>
      <mesh geometry={lampGeom} material={chrome(0.3)} castShadow />
      <mesh position={[1.12, 4.66, 0]} material={tubeMat(color)}>
        <capsuleGeometry args={[0.1, 0.34, 4, 8]} />
      </mesh>
      <mesh position={[1.12, 4.66, 0]} material={haloMat(color, 0.22)}>
        <sphereGeometry args={[0.42, 10, 8]} />
      </mesh>
      {/* The light it actually throws — a soft additive disc on the asphalt */}
      <mesh position={[1.12, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={haloMat(color, 0.08)}>
        <circleGeometry args={[2.4, 20]} />
      </mesh>
    </group>
  )
}

/* ============================================================================
   THE CAR
   A low-poly convertible: wedge hull, chrome trim, headlight cones and a
   taillight bar. Pointed down -Z so it drives away from the camera by default.
   ========================================================================== */

const wheelGeom = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 14)

export function ViceCar({
  body = 'neon',
  seats = 'stucco',
  headlights = true,
  spin,
  ...group
}: Omit<ThreeElements['group'], 'args'> & {
  body?: ViceColor
  seats?: ViceColor
  headlights?: boolean
  /** Wheel rotation speed, radians/second. */
  spin?: number
}) {
  const wheels = useRef<(THREE.Mesh | null)[]>([])

  useFrame((_, dt) => {
    if (!spin) return
    wheels.current.forEach((w) => w && (w.rotation.x += spin * dt))
  })

  const shell = paint(body, { rough: 0.2 })

  return (
    <group {...group}>
      {/* Hull */}
      <RoundedBox
        args={[1.9, 0.46, 4.2]}
        radius={0.16}
        smoothness={3}
        position={[0, 0.58, 0]}
        material={shell}
        castShadow
      />
      {/* Bonnet + boot deck, slightly lower so the waistline reads */}
      <mesh position={[0, 0.82, -1.15]} material={shell} castShadow>
        <boxGeometry args={[1.76, 0.16, 1.7]} />
      </mesh>
      <mesh position={[0, 0.82, 1.5]} material={shell} castShadow>
        <boxGeometry args={[1.76, 0.16, 1.1]} />
      </mesh>
      {/* Cockpit + seats */}
      <mesh position={[0, 0.86, 0.35]} material={paint('night')}>
        <boxGeometry args={[1.6, 0.1, 1.5]} />
      </mesh>
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 1.02, 0.62]} material={stucco(seats)} castShadow>
          <boxGeometry args={[0.56, 0.42, 0.18]} />
        </mesh>
      ))}
      {/* Windscreen */}
      <mesh position={[0, 1.12, -0.42]} rotation={[-0.42, 0, 0]} material={haloMat('aqua', 0.14)}>
        <planeGeometry args={[1.4, 0.5]} />
      </mesh>
      {/* Chrome bumpers + side strake */}
      {[-2.06, 2.06].map((z) => (
        <mesh key={z} position={[0, 0.52, z]} material={chrome()} castShadow>
          <boxGeometry args={[1.82, 0.16, 0.14]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.96, 0.62, 0]} material={chrome(0.25)}>
          <boxGeometry args={[0.04, 0.07, 3.7]} />
        </mesh>
      ))}
      {/* Wheels */}
      {[
        [-0.92, -1.35],
        [0.92, -1.35],
        [-0.92, 1.45],
        [0.92, 1.45],
      ].map(([x, z], i) => (
        <mesh
          key={i}
          ref={(el) => { wheels.current[i] = el }}
          geometry={wheelGeom}
          material={paint('night', { rough: 0.7 })}
          position={[x, 0.34, z]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        />
      ))}
      {/* Lights */}
      {headlights &&
        [-0.62, 0.62].map((x) => (
          <group key={x} position={[x, 0.7, -2.08]}>
            <mesh material={tubeMat('#fff6e2')}>
              <boxGeometry args={[0.34, 0.14, 0.06]} />
            </mesh>
            <mesh position={[0, 0, -2.4]} rotation={[Math.PI / 2, 0, 0]} material={haloMat('#ffe9b8', 0.07)}>
              <coneGeometry args={[0.9, 4.8, 12, 1, true]} />
            </mesh>
          </group>
        ))}
      <mesh position={[0, 0.72, 2.1]} material={tubeMat('blood')}>
        <boxGeometry args={[1.5, 0.1, 0.05]} />
      </mesh>
      <mesh position={[0, 0.72, 2.16]} material={haloMat('blood', 0.24)}>
        <boxGeometry args={[1.7, 0.4, 0.08]} />
      </mesh>
    </group>
  )
}

/* ============================================================================
   LIGHTING RIG
   Gold key from the sun's direction, flamingo rim from the left, pool-aqua fill
   from the right. The environment is assembled locally so chrome and lacquer
   have the strip to reflect without fetching an HDRI.
   ========================================================================== */

export function StripRig({ shadows = true }: { shadows?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.34} color="#b98bff" />
      {/* The sun, low and behind the skyline */}
      <directionalLight
        position={[-2, 5.5, -26]}
        intensity={2.5}
        color="#ffb066"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0014}
      >
        <orthographicCamera attach="shadow-camera" args={[-22, 22, 22, -22, 0.1, 70]} />
      </directionalLight>
      {/* Flamingo rim, camera left */}
      <directionalLight position={[-11, 6, 8]} intensity={1.5} color={VICE.neon} />
      {/* Pool aqua fill, camera right */}
      <directionalLight position={[12, 4, 6]} intensity={1.1} color={VICE.aqua} />
      {/* Sodium bounce off the asphalt */}
      <pointLight position={[0, 1.2, 6]} intensity={22} color="#ff9a3c" distance={30} decay={2} />

      <Environment resolution={192} frames={1}>
        <Lightformer form="rect" intensity={2.2} color={VICE.neon} position={[-9, 4, 4]} scale={[9, 7, 1]} target={[0, 2, 0]} />
        <Lightformer form="rect" intensity={2} color={VICE.aqua} position={[9, 3, 3]} scale={[9, 7, 1]} target={[0, 2, 0]} />
        <Lightformer form="rect" intensity={3.4} color="#ffb066" position={[0, 1.2, -14]} scale={[26, 4, 1]} target={[0, 2, 0]} />
        <Lightformer form="circle" intensity={1.1} color="#6a1fd0" position={[0, 12, 0]} scale={14} target={[0, 0, 0]} />
      </Environment>
    </>
  )
}

/* ============================================================================
   EASING
   ========================================================================== */

export function easeOutBack(t: number, overshoot = 1.7) {
  const c = overshoot
  const p = t - 1
  return 1 + (c + 1) * p * p * p + c * p * p
}

export function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t
}

export function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(current, target, lambda, dt)
}
