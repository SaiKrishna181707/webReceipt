'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
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
  chrome,
  clamp01,
} from './vice-kit'

/* ============================================================================
   THE BOULEVARD
   The pipeline, driven rather than read. Five billboards line the strip —
   Observe, Compile, Verify, Heal, Diff — and each one strikes its tubes as you
   reach it. Scroll position is the throttle.
   ========================================================================== */

type Stop = {
  z: number
  side: -1 | 1
  tone: string
  digit: number
}

const SPACING = 19
const START_Z = 4
const STOPS: Stop[] = [
  { z: -10, side: -1, tone: VICE.aqua, digit: 1 },
  { z: -10 - SPACING, side: 1, tone: VICE.gold, digit: 2 },
  { z: -10 - SPACING * 2, side: -1, tone: VICE.mint, digit: 3 },
  { z: -10 - SPACING * 3, side: 1, tone: VICE.neon, digit: 4 },
  { z: -10 - SPACING * 4, side: -1, tone: VICE.violet, digit: 5 },
]

const END_Z = STOPS[STOPS.length - 1].z - 16

/* -------------------------------------------------------------------------- */

/* Seven-segment digits, because a numbered sign on Ocean Drive is a bent tube
   and nothing else. [x, y, length, vertical] in board units. */
type Bar = [number, number, number, boolean]

const SEG: Record<string, Bar> = {
  a: [0, 0.92, 0.78, false],
  g: [0, 0, 0.78, false],
  d: [0, -0.92, 0.78, false],
  f: [-0.4, 0.46, 0.88, true],
  b: [0.4, 0.46, 0.88, true],
  e: [-0.4, -0.46, 0.88, true],
  c: [0.4, -0.46, 0.88, true],
}

const DIGITS: Record<number, string[]> = {
  1: ['b', 'c'],
  2: ['a', 'b', 'g', 'e', 'd'],
  3: ['a', 'b', 'g', 'c', 'd'],
  4: ['f', 'g', 'b', 'c'],
  5: ['a', 'f', 'g', 'c', 'd'],
}

/** Abstract lettering: three rows of tube, deterministic per stop. */
function rowsFor(seed: number): Bar[] {
  const widths = [
    [0.9, 0.5, 1.25],
    [1.4, 0.7, 0.45],
    [0.6, 1.1, 0.8],
  ]
  const out: Bar[] = []
  widths.forEach((row, ri) => {
    const shifted = seed % 2 === 0 ? row : [...row].reverse()
    let cursor = 0
    shifted.forEach((w) => {
      out.push([cursor + w / 2, 0.78 - ri * 0.78, w, false])
      cursor += w + 0.26
    })
  })
  return out
}

/* -------------------------------------------------------------------------- */

const BOARD_MAT = new THREE.MeshStandardMaterial({ color: '#0c0618', roughness: 0.65, metalness: 0.25 })

/**
 * One billboard. Strikes its tubes as the camera closes on it, with the
 * half-second of stutter a cold tube always gives before it holds.
 */
function Billboard({ stop, index }: { stop: Stop; index: number }) {
  const lit = useRef(0)
  const board = useRef<THREE.Group>(null)

  const base = useMemo(() => new THREE.Color(stop.tone), [stop.tone])
  const glass = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color('#241634'), toneMapped: false }),
    [],
  )
  const halo = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(stop.tone),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [stop.tone],
  )
  const wash = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(stop.tone),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [stop.tone],
  )
  const scratch = useMemo(() => new THREE.Color(), [])

  const rows = useMemo(() => rowsFor(index), [index])
  const digit = DIGITS[stop.digit] ?? []

  useFrame((state, dt) => {
    // Ignite a little before the sign is level with the camera.
    const on = state.camera.position.z < stop.z + 24 ? 1 : 0
    lit.current = THREE.MathUtils.damp(lit.current, on, 3.4, dt)

    const striking = on === 1 && lit.current < 0.94
    const stutter = striking ? (Math.sin(state.clock.elapsedTime * 46) > 0.1 ? 1 : 0.3) : 1
    const level = clamp01(lit.current) * stutter

    scratch.copy(base).multiplyScalar(0.06 + level * 1.5)
    glass.color.copy(scratch)
    halo.opacity = level * 0.2
    wash.opacity = level * 0.1

    // The board leans in as it lights, then settles.
    const g = board.current
    if (g) g.rotation.y = -stop.side * (0.34 - level * 0.1)
  })

  return (
    <group ref={board} position={[stop.side * 7.4, 4.7, stop.z]}>
      {/* Backing board + chrome frame */}
      <mesh material={BOARD_MAT}>
        <boxGeometry args={[6.4, 3.9, 0.18]} />
      </mesh>
      {[
        { a: [6.7, 0.15, 0.32], p: [0, 1.98, 0] },
        { a: [6.7, 0.15, 0.32], p: [0, -1.98, 0] },
        { a: [0.15, 4.1, 0.32], p: [3.26, 0, 0] },
        { a: [0.15, 4.1, 0.32], p: [-3.26, 0, 0] },
      ].map((b, i) => (
        <mesh key={i} position={b.p as [number, number, number]} material={chrome(0.26)} castShadow>
          <boxGeometry args={b.a as [number, number, number]} />
        </mesh>
      ))}

      {/* Soft wash of colour thrown forward off the board */}
      <mesh position={[0, 0, 0.5]} material={wash}>
        <planeGeometry args={[6.2, 3.7]} />
      </mesh>

      {/* The stage number, in seven segments */}
      <group position={[-2.15, 0.05, 0.14]} scale={1.32}>
        {digit.map((k) => {
          const [x, y, len, vert] = SEG[k]
          return (
            <group key={k} position={[x, y, 0]} rotation={[0, 0, vert ? Math.PI / 2 : 0]}>
              <mesh material={glass}>
                <boxGeometry args={[len, 0.11, 0.1]} />
              </mesh>
              <mesh material={halo}>
                <boxGeometry args={[len + 0.12, 0.46, 0.46]} />
              </mesh>
            </group>
          )
        })}
      </group>

      {/* Abstract copy, three rows of tube */}
      <group position={[-0.9, 0.05, 0.14]}>
        {rows.map(([x, y, len], i) => (
          <mesh key={i} position={[x, y, 0]} material={glass}>
            <boxGeometry args={[len, 0.1, 0.09]} />
          </mesh>
        ))}
      </group>

      {/* Post down to the pavement */}
      <mesh position={[0, -3.2, 0]} material={chrome(0.3)} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 2.6, 10]} />
      </mesh>
    </group>
  )
}

/* -------------------------------------------------------------------------- */

/** Scroll is the throttle: 0 parks at the kerb, 1 is the far end of the strip. */
function DriveCamera({ progress }: { progress: React.MutableRefObject<number> }) {
  const look = useMemo(() => new THREE.Vector3(0, 3.6, START_Z - 20), [])
  const want = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    const p = clamp01(progress.current)
    const z = START_Z + (END_Z - START_Z) * p
    const t = state.clock.elapsedTime

    // Which sign are we alongside? The camera leans toward it.
    let nearest = 0
    let best = Infinity
    STOPS.forEach((s, i) => {
      const d = Math.abs(s.z - z)
      if (d < best) {
        best = d
        nearest = i
      }
    })
    const attention = clamp01(1 - best / 22)
    const side = STOPS[nearest].side

    state.camera.position.x = THREE.MathUtils.damp(
      state.camera.position.x,
      Math.sin(t * 0.4) * 0.35 + side * attention * 1.1,
      2.6,
      dt,
    )
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 3.1 + Math.sin(t * 0.7) * 0.1, 2.6, dt)
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, z, 3.2, dt)

    want.set(side * attention * 6.6, 4.2, z - 20)
    look.lerp(want, 1 - Math.exp(-2.2 * dt))
    state.camera.lookAt(look)
  })

  return null
}

/** The car you're following, always the same distance up the road. */
function LeadCar({ progress }: { progress: React.MutableRefObject<number> }) {
  const car = useRef<THREE.Group>(null)

  useFrame((state, dt) => {
    const g = car.current
    if (!g) return
    const z = START_Z + (END_Z - START_Z) * clamp01(progress.current) - 13
    g.position.z = THREE.MathUtils.damp(g.position.z, z, 3.2, dt)
    g.position.x = THREE.MathUtils.damp(g.position.x, 1.6 + Math.sin(state.clock.elapsedTime * 0.55) * 0.5, 2, dt)
  })

  return (
    <group ref={car} position={[1.6, 0, START_Z - 13]}>
      <ViceCar body="neon" spin={-13} />
    </group>
  )
}

/* -------------------------------------------------------------------------- */

export default function BoulevardScene({ progress }: { progress: React.MutableRefObject<number> }) {
  return (
    <>
      <fog attach="fog" args={['#2c0b52', 22, 96]} />
      <SkyDome sun={[0.04, 0.05, -1]} />
      <StripRig shadows={false} />
      <DriveCamera progress={progress} />

      <NeonRoad position={[0, 0, START_Z - 100]} size={340} />

      {STOPS.map((stop, i) => (
        <Billboard key={i} stop={stop} index={i} />
      ))}

      <LeadCar progress={progress} />

      {/* Skyline running the length of the strip */}
      {STOPS.map((stop, i) => (
        <DecoTower
          key={`t${i}`}
          position={[-stop.side * 15, 0, stop.z - 6]}
          width={5.6}
          depth={5}
          floors={9 + ((i * 3) % 6)}
          trim={i % 2 ? 'neon' : 'aqua'}
          color={i % 2 ? 'stucco' : 'stuccoMint'}
          warmWindows={i % 2 === 0}
        />
      ))}

      {/* Palms and lamps, alternating down both kerbs */}
      {Array.from({ length: 9 }, (_, i) => {
        const z = START_Z - 4 - i * 11.5
        const side = i % 2 ? 1 : -1
        return (
          <group key={`k${i}`}>
            <PalmTree position={[side * 4.6, 0, z]} height={0.88 + ((i * 7) % 5) / 16} seed={i * 1.7} />
            <StreetLamp
              position={[-side * 5.2, 0, z - 5]}
              color={i % 3 === 0 ? 'neon' : i % 3 === 1 ? 'aqua' : 'gold'}
              flip={side < 0}
            />
          </group>
        )
      })}
    </>
  )
}
