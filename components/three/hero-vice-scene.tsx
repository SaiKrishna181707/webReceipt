'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  VICE,
  NeonRoad,
  SkyDome,
  StripRig,
  DecoTower,
  PalmTree,
  StreetLamp,
  ViceCar,
  MarqueeLights,
  chrome,
  haloMat,
  tubeMat,
  clamp01,
  easeOutBack,
} from './vice-kit'

/* ============================================================================
   OCEAN DRIVE, 19:04
   The hero. A hotel sign on the boulevard advertises a price; one of its tubes
   burns out — the promise stops being true — and a verified repair relights it.
   That is WebReceipt's whole thesis, playing on loop above the traffic.
   ========================================================================== */

const BREAK_EVERY = 4200 // ms between failures
const HEAL_AFTER = 1450 // ms the sign stays dark before the repair lands
const HEAL_TIME = 0.72 // s for the new tube to clutch in
const COOL_TIME = 2.1 // s for the mint repair to settle back to its own colour

type Segment = {
  row: number
  x: number
  len: number
  color: string
  y: number
}

/**
 * Three rows of tube, abstracted lettering: the advertised rate, the fee line,
 * and the cancellation terms. Deterministic, so the sign is the same sign on
 * every reload.
 */
function buildSign(): Segment[] {
  const rows: { y: number; color: string; widths: number[] }[] = [
    { y: 1.5, color: VICE.gold, widths: [1.5, 0.55, 1.9] },
    { y: 0.42, color: VICE.neon, widths: [0.85, 1.35, 0.6, 1.5] },
    { y: -0.62, color: VICE.aqua, widths: [1.15, 2.0, 0.7] },
  ]

  const out: Segment[] = []
  rows.forEach((row, ri) => {
    const gap = 0.34
    const total = row.widths.reduce((a, b) => a + b, 0) + gap * (row.widths.length - 1)
    let cursor = -total / 2
    row.widths.forEach((w) => {
      out.push({ row: ri, x: cursor + w / 2, len: w, color: row.color, y: row.y })
      cursor += w + gap
    })
  })
  return out
}

const SEGMENTS = buildSign()

/* -------------------------------------------------------------------------- */

type Phase = 'lit' | 'dark' | 'healed'

/**
 * One run of tube. Owns its material so it can burn out, flicker and come back
 * a different colour without touching its neighbours.
 */
function SignTube({ seg, phase, at }: { seg: Segment; phase: Phase; at: number }) {
  const group = useRef<THREE.Group>(null)
  const glass = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color(seg.color), toneMapped: false }),
    [seg.color],
  )
  const halo = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(seg.color),
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [seg.color],
  )

  const base = useMemo(() => new THREE.Color(seg.color), [seg.color])
  const dead = useMemo(() => new THREE.Color(VICE.blood), [])
  const fixed = useMemo(() => new THREE.Color(VICE.mint), [])
  const scratch = useMemo(() => new THREE.Color(), [])

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    const since = t - at

    if (phase === 'dark') {
      // A dying ballast: mostly out, with the odd desperate strike.
      const strike = Math.sin(since * 34) > 0.86 ? 1 : 0
      const level = 0.06 + strike * 0.5
      scratch.copy(dead).multiplyScalar(level * 1.6)
      glass.color.copy(scratch)
      halo.opacity = 0.05 + strike * 0.16
      g.scale.set(1, 0.88 + strike * 0.12, 1)
      return
    }

    if (phase === 'healed') {
      // The verified replacement clutches in, mint, then cools to the row colour.
      const k = clamp01(since / HEAL_TIME)
      const pop = easeOutBack(k, 2.4)
      g.scale.set(0.12 + 0.88 * pop, 0.4 + 0.6 * pop, 1)
      const cool = clamp01((since - HEAL_TIME) / COOL_TIME)
      scratch.copy(fixed).lerp(base, cool)
      glass.color.copy(scratch)
      halo.color.copy(scratch)
      halo.opacity = 0.34 - 0.2 * cool
      return
    }

    glass.color.copy(base)
    halo.color.copy(base)
    halo.opacity = 0.14
    g.scale.set(1, 1, 1)
  })

  return (
    <group ref={group} position={[seg.x, seg.y, 0.09]}>
      <mesh material={glass}>
        <boxGeometry args={[seg.len, 0.1, 0.09]} />
      </mesh>
      <mesh material={halo}>
        <boxGeometry args={[seg.len + 0.1, 0.5, 0.5]} />
      </mesh>
    </group>
  )
}

/* -------------------------------------------------------------------------- */

/** Glass shards thrown out when a tube goes. Six cubes, gone in a second. */
function Shards({ origin, at }: { origin: [number, number, number]; at: number }) {
  const group = useRef<THREE.Group>(null)
  const bits = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        vx: Math.cos(i * 1.7) * (1.6 + (i % 3) * 0.5),
        vy: 2.2 + (i % 4) * 0.5,
        vz: 0.8 + (i % 2) * 0.7,
        spin: (i % 2 ? 1 : -1) * (3 + i),
      })),
    [],
  )
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(VICE.blood),
        transparent: true,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const s = state.clock.elapsedTime - at
    if (s > 1.4) {
      g.visible = false
      return
    }
    g.visible = true
    mat.opacity = Math.max(0, 1 - s / 1.4) * 0.85
    g.children.forEach((c, i) => {
      const b = bits[i]
      c.position.set(b.vx * s, b.vy * s - 5.2 * s * s, b.vz * s)
      c.rotation.set(b.spin * s, b.spin * s * 0.6, 0)
    })
  })

  return (
    <group ref={group} position={origin}>
      {bits.map((_, i) => (
        <mesh key={i} material={mat}>
          <boxGeometry args={[0.07, 0.07, 0.07]} />
        </mesh>
      ))}
    </group>
  )
}

/* -------------------------------------------------------------------------- */

/** The hotel sign: chrome frame, mounting poles, marquee bulbs, three rows. */
function HotelSign() {
  const [broken, setBroken] = useState<number | null>(null)
  const [healed, setHealed] = useState<number | null>(null)
  const [stamp, setStamp] = useState(0)
  const clock = useRef(0)

  // A deterministic walk through the sign so every tube eventually fails.
  useEffect(() => {
    let cycle = 0
    let healTimer: ReturnType<typeof setTimeout>

    const tick = () => {
      const idx = (cycle * 5 + 2) % SEGMENTS.length
      cycle += 1
      setBroken(idx)
      setHealed(null)
      setStamp(clock.current)
      healTimer = setTimeout(() => {
        setBroken(null)
        setHealed(idx)
        setStamp(clock.current)
      }, HEAL_AFTER)
    }

    const interval = setInterval(tick, BREAK_EVERY)
    const kick = setTimeout(tick, 1600)
    return () => {
      clearInterval(interval)
      clearTimeout(kick)
      clearTimeout(healTimer)
    }
  }, [])

  useFrame((state) => {
    clock.current = state.clock.elapsedTime
  })

  const frame = chrome(0.24)
  const brokenSeg = broken != null ? SEGMENTS[broken] : null

  return (
    <group position={[0, 4.5, 0]}>
      {/* Backing board */}
      <mesh material={new THREE.MeshStandardMaterial({ color: '#0d0718', roughness: 0.6, metalness: 0.3 })}>
        <boxGeometry args={[6.6, 4.6, 0.16]} />
      </mesh>

      {/* Chrome frame */}
      {[
        { a: [6.9, 0.16, 0.3] as const, p: [0, 2.32, 0] as const },
        { a: [6.9, 0.16, 0.3] as const, p: [0, -2.32, 0] as const },
        { a: [0.16, 4.8, 0.3] as const, p: [3.38, 0, 0] as const },
        { a: [0.16, 4.8, 0.3] as const, p: [-3.38, 0, 0] as const },
      ].map((b, i) => (
        <mesh key={i} position={b.p as unknown as [number, number, number]} material={frame} castShadow>
          <boxGeometry args={b.a as unknown as [number, number, number]} />
        </mesh>
      ))}

      {/* Deco crown: stepped chrome fins and a tube arch */}
      {[0.9, 0.62, 0.34].map((w, i) => (
        <mesh key={i} position={[0, 2.5 + i * 0.24, 0]} material={frame} castShadow>
          <boxGeometry args={[w * 3.4, 0.14, 0.34]} />
        </mesh>
      ))}
      <mesh position={[0, 3.42, 0]} material={tubeMat('aqua')}>
        <torusGeometry args={[0.42, 0.045, 8, 20, Math.PI]} />
      </mesh>
      <mesh position={[0, 3.42, 0]} material={haloMat('aqua', 0.2)}>
        <sphereGeometry args={[0.62, 12, 10]} />
      </mesh>

      {/* Chasing bulbs top and bottom */}
      <MarqueeLights count={11} spacing={0.6} color="gold" position={[0, 2.62, 0.24]} />
      <MarqueeLights count={11} spacing={0.6} color="gold" speed={-3.2} position={[0, -2.62, 0.24]} />

      {/* The claim itself */}
      {SEGMENTS.map((seg, i) => (
        <SignTube
          key={i}
          seg={seg}
          at={stamp}
          phase={broken === i ? 'dark' : healed === i ? 'healed' : 'lit'}
        />
      ))}

      {brokenSeg && <Shards origin={[brokenSeg.x, brokenSeg.y, 0.2]} at={stamp} />}

      {/* Mounting poles down to the pavement */}
      {[-2.2, 2.2].map((x) => (
        <mesh key={x} position={[x, -3.55, 0]} material={frame} castShadow>
          <cylinderGeometry args={[0.11, 0.13, 2.6, 10]} />
        </mesh>
      ))}
    </group>
  )
}

/* -------------------------------------------------------------------------- */

/** The evidence tape: a cassette turning slowly in the sign's glow. */
function EvidenceTape({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null)
  const shell = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1b1030', roughness: 0.42, metalness: 0.2 }),
    [],
  )
  const label = useMemo(
    () => new THREE.MeshStandardMaterial({ color: VICE.stucco, roughness: 0.8, emissive: new THREE.Color(VICE.neon), emissiveIntensity: 0.22 }),
    [],
  )

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.rotation.y = t * 0.42
    g.rotation.z = Math.sin(t * 0.6) * 0.14
    g.position.y = position[1] + Math.sin(t * 0.8) * 0.16
  })

  return (
    <group ref={group} position={position} scale={0.9}>
      <mesh material={shell} castShadow>
        <boxGeometry args={[1.1, 0.7, 0.14]} />
      </mesh>
      <mesh position={[0, 0.12, 0.08]} material={label}>
        <planeGeometry args={[0.92, 0.34]} />
      </mesh>
      {[-0.24, 0.24].map((x) => (
        <mesh key={x} position={[x, -0.1, 0.08]} material={tubeMat('aqua', 0.7)}>
          <circleGeometry args={[0.11, 14]} />
        </mesh>
      ))}
      <mesh material={haloMat('neon', 0.1)}>
        <boxGeometry args={[1.5, 1.1, 0.5]} />
      </mesh>
    </group>
  )
}

/* -------------------------------------------------------------------------- */

/** Traffic. Crosses the frame every few seconds, headlights first. */
function Traffic() {
  const car = useRef<THREE.Group>(null)
  const SPAN = 46

  useFrame((state) => {
    const g = car.current
    if (!g) return
    const t = state.clock.elapsedTime * 7.4
    g.position.x = ((t % SPAN) + SPAN) % SPAN - SPAN / 2
  })

  return (
    <group ref={car} position={[0, 0, 5.6]} rotation={[0, -Math.PI / 2, 0]}>
      <ViceCar body="aqua" spin={-11} />
    </group>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * Slow orbit with pointer parallax — a helicopter shot holding on the sign.
 */
function StripCamera() {
  const target = useMemo(() => new THREE.Vector3(0, 4.4, 0), [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const px = state.pointer.x
    const py = state.pointer.y

    const radius = 15.4
    const angle = Math.sin(t * 0.075) * 0.42 + px * 0.28
    const x = Math.sin(angle) * radius
    const z = Math.cos(angle) * radius
    const y = 5.4 + Math.sin(t * 0.11) * 0.7 - py * 1.5

    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, x, 2.4, dt)
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, y, 2.4, dt)
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, z, 2.4, dt)
    state.camera.lookAt(target)
  })

  return null
}

/* -------------------------------------------------------------------------- */

export default function HeroViceScene() {
  return (
    <>
      <fog attach="fog" args={['#2c0b52', 26, 118]} />
      <SkyDome sun={[0.02, 0.05, -1]} />
      <StripRig />
      <StripCamera />

      <NeonRoad position={[0, 0, 0]} />

      <HotelSign />
      <EvidenceTape position={[5.6, 3.4, 3.1]} />
      <Traffic />

      {/* Hotels either side, stepping back toward the horizon */}
      <DecoTower position={[-9.4, 0, -6]} width={5} depth={4.4} floors={9} trim="aqua" color="stucco" />
      <DecoTower position={[9.4, 0, -6]} width={5} depth={4.4} floors={8} trim="neon" color="stuccoMint" warmWindows={false} />
      <DecoTower position={[-16.5, 0, -14]} width={6} depth={5} floors={12} trim="gold" color="stuccoMint" />
      <DecoTower position={[16.5, 0, -14]} width={6} depth={5} floors={11} trim="violet" color="stucco" warmWindows={false} />
      <DecoTower position={[-25, 0, -24]} width={7} depth={6} floors={15} trim="neon" color="stucco" />
      <DecoTower position={[25, 0, -24]} width={7} depth={6} floors={14} trim="aqua" color="stuccoMint" warmWindows={false} />

      {/* Palms on the median */}
      <PalmTree position={[-5.6, 0, 4.2]} height={0.95} seed={0.4} />
      <PalmTree position={[6.4, 0, 1.4]} height={1.08} seed={2.1} />
      <PalmTree position={[-12.5, 0, 1.2]} height={0.86} seed={4.4} />
      <PalmTree position={[12.8, 0, 5.2]} height={1} seed={1.3} />

      {/* Street lighting */}
      <StreetLamp position={[-7.2, 0, 7.4]} />
      <StreetLamp position={[7.2, 0, 7.4]} flip />
      <StreetLamp position={[-7.2, 0, -1.6]} color="neon" />
      <StreetLamp position={[7.2, 0, -1.6]} color="aqua" flip />
    </>
  )
}
