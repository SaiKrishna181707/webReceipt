'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ContactShadows, Float } from '@react-three/drei'
import {
  ABS,
  Baseplate,
  Brick,
  BRICK_H,
  Minifig,
  StudioRig,
  clamp01,
  easeOutBack,
  type AbsColor,
} from './lego-kit'

/* ============================================================================
   THE SELF-HEALING BUILD
   The hero is a literal model of the product: a wall of bricks is the Deal
   Contract, a brick going red is a redesign breaking extraction, and the green
   brick that clutches into the gap is a verified repair.
   ========================================================================== */

type Slot = {
  x: number
  y: number
  z: number
  size: [number, number]
  color: AbsColor
  spin: number
  delay: number
}

const ROWS = 7
const ROW_COLORS: AbsColor[] = ['grey', 'white', 'yellow', 'blue', 'white', 'red', 'yellow']

/** Deterministic jitter so the build looks hand-assembled without hydration drift. */
function noise(seed: number) {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function buildLayout(): Slot[] {
  const slots: Slot[] = []
  for (let r = 0; r < ROWS; r++) {
    // Running bond: every other course is offset by one stud, exactly like
    // building a real wall so the seams never line up.
    const course: [number, number][] = r % 2 === 0 ? [[-2, 2], [0, 2], [2, 2]] : [[-2.5, 1], [-1, 2], [1, 2], [2.5, 1]]
    course.forEach(([x, w], i) => {
      const seed = r * 13 + i
      slots.push({
        x,
        y: r * BRICK_H,
        z: 0,
        size: [w, 2],
        color: ROW_COLORS[r % ROW_COLORS.length],
        spin: noise(seed) * 2 - 1,
        delay: 0.25 + r * 0.11 + i * 0.055 + noise(seed + 7) * 0.08,
      })
    })
  }
  return slots
}

const IN_DURATION = 0.62
const OUT_DURATION = 0.78

function WallBrick({ slot, broken, healed }: { slot: Slot; broken: boolean; healed: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const progress = useRef(0)
  const wait = useRef(slot.delay)
  const mode = useRef<'in' | 'out'>('in')

  useEffect(() => {
    mode.current = broken ? 'out' : 'in'
    progress.current = 0
    // A repair is proposed, verified, then deployed — so the new brick lands a
    // beat after the broken one has been ejected.
    wait.current = broken ? 0 : 0.34
  }, [broken])

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return

    if (wait.current > 0) {
      wait.current -= dt
      g.visible = false
      return
    }
    g.visible = true

    const duration = mode.current === 'in' ? IN_DURATION : OUT_DURATION
    progress.current = Math.min(1, progress.current + dt / duration)
    const t = progress.current

    if (mode.current === 'in') {
      const e = easeOutBack(t, 1.95)
      const rise = (1 - e) * 12
      g.position.set(slot.x, slot.y + rise, slot.z)
      g.rotation.set((1 - e) * 0.55 * slot.spin, (1 - e) * 1.1 * slot.spin, (1 - e) * 0.4 * slot.spin)
      // Squash on impact sells the weight of the part
      const squash = t > 0.55 ? 1 + Math.sin((t - 0.55) * 7.2) * 0.06 * (1 - t) : 1
      g.scale.set(1 / squash, squash, 1 / squash)
    } else {
      const e = t * t
      g.position.set(slot.x + e * slot.spin * 6, slot.y + e * 9 - e * e * 3, slot.z + e * slot.spin * 3.5)
      g.rotation.set(e * 8 * slot.spin, e * 10, e * 6 * slot.spin)
      g.scale.setScalar(Math.max(0, 1 - e * 1.15))
    }
  })

  return (
    <group ref={ref} visible={false}>
      <Brick size={slot.size} color={broken ? 'red' : healed ? 'green' : slot.color} />
    </group>
  )
}

function TheBuild() {
  const slots = useMemo(buildLayout, [])
  const [brokenIndex, setBrokenIndex] = useState<number | null>(null)
  const [healed, setHealed] = useState<Set<number>>(() => new Set())

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = []
    let cycle = 0

    const tick = () => {
      // Walk the wall predictably rather than randomly, so every visitor sees
      // the same choreography.
      const index = (cycle * 7 + 3) % slots.length
      cycle++
      setBrokenIndex(index)
      timers.push(
        setTimeout(() => {
          setHealed((prev) => {
            const next = new Set(prev)
            next.add(index)
            return next
          })
          setBrokenIndex(null)
        }, 1150),
      )
      timers.push(setTimeout(tick, 3900))
    }

    const boot = setTimeout(tick, 3400)
    timers.push(boot)
    return () => timers.forEach(clearTimeout)
  }, [slots.length])

  return (
    <group position={[0, 0, 0]}>
      {slots.map((slot, i) => (
        <WallBrick key={i} slot={slot} broken={brokenIndex === i} healed={healed.has(i)} />
      ))}
      {/* Yellow capping plate — the contract seal */}
      <Brick size={[6, 2]} kind="plate" color="yellow" position={[0, ROWS * BRICK_H, 0]} />
    </group>
  )
}

/** Loose parts drifting around the build, like a table mid-session. */
function LooseParts() {
  const parts: { pos: [number, number, number]; size: [number, number]; color: AbsColor; speed: number }[] = [
    { pos: [-7.2, 4.4, 2.6], size: [2, 2], color: 'red', speed: 1.1 },
    { pos: [7.4, 6.2, -1.4], size: [4, 2], color: 'blue', speed: 0.8 },
    { pos: [-6.4, 8.4, -2.8], size: [2, 2], color: 'yellow', speed: 1.35 },
    { pos: [6.2, 2.4, 3.4], size: [2, 2], color: 'green', speed: 1.2 },
    { pos: [-8.4, 1.6, -0.6], size: [4, 2], color: 'orange', speed: 0.95 },
    { pos: [8.2, 9.4, 1.2], size: [2, 2], color: 'white', speed: 1.05 },
  ]

  return (
    <>
      {parts.map((p, i) => (
        <Float key={i} speed={p.speed} rotationIntensity={0.85} floatIntensity={1.5} floatingRange={[-0.4, 0.5]}>
          <group position={p.pos} rotation={[noise(i) * 0.9, noise(i + 3) * Math.PI, noise(i + 9) * 0.6]}>
            <Brick size={p.size} color={p.color} />
          </group>
        </Float>
      ))}
    </>
  )
}

/** The inspector: watches the build, arms swinging gently. */
function Inspector() {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    const g = ref.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.position.y = Math.sin(t * 1.6) * 0.06
    g.rotation.y = 0.42 + Math.sin(t * 0.5) * 0.16
  })

  return (
    <group position={[-4.9, 0, 4.2]}>
      <group ref={ref}>
        <Minifig torso="red" legs="blue" head="yellow" armSwing={0.35} />
      </group>
      <Brick size={[2, 2]} kind="plate" color="darkGrey" position={[0, -0.4, 0]} />
    </group>
  )
}

/** Slow orbit plus pointer parallax — the camera never fully settles. */
function CameraDirector() {
  const target = useRef(new THREE.Vector3(0, 4.1, 0))

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const px = state.pointer?.x ?? 0
    const py = state.pointer?.y ?? 0

    const drift = Math.sin(t * 0.16) * 0.13
    const x = Math.sin(drift + px * 0.34) * 13.5
    const z = Math.cos(drift + px * 0.34) * 13.5
    const y = 7.2 + py * 1.9

    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, x, 2.4, dt)
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, y, 2.4, dt)
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, z, 2.4, dt)
    state.camera.lookAt(target.current)
  })

  return null
}

export default function HeroBrickScene() {
  return (
    <>
      <color attach="background" args={['#0d0e0b']} />
      <fog attach="fog" args={['#0d0e0b', 20, 42]} />

      <StudioRig />
      <CameraDirector />

      <group position={[0, -2.6, 0]}>
        <Baseplate size={26} color="slate" />
        <TheBuild />
        <Inspector />
        <LooseParts />
        <ContactShadows
          position={[0, 0.012, 0]}
          opacity={0.72}
          scale={30}
          blur={2.6}
          far={11}
          resolution={512}
          color="#000000"
        />
      </group>
    </>
  )
}

export { clamp01, ABS }
