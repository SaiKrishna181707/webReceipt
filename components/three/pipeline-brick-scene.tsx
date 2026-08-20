'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { Baseplate, Brick, BRICK_H, PLATE_H, StudioRig, easeOutBack, type AbsColor } from './lego-kit'

/* ============================================================================
   THE PIPELINE, BUILT BY SCROLL
   Five stacks — Observe, Compile, Verify, Heal, Diff. Scrolling down assembles
   them brick by brick and dollies the camera along the row; scrolling back up
   takes the model apart again.
   ========================================================================== */

const STEPS: { label: string; color: AbsColor; accent: AbsColor }[] = [
  { label: 'Observe', color: 'grey', accent: 'white' },
  { label: 'Compile', color: 'white', accent: 'yellow' },
  { label: 'Verify', color: 'yellow', accent: 'green' },
  { label: 'Heal', color: 'green', accent: 'lime' },
  { label: 'Diff', color: 'blue', accent: 'azure' },
]

const PER_STACK = 5
const STACK_GAP = 5

type Part = {
  x: number
  y: number
  color: AbsColor
  /** Scroll position at which this part clutches into place. */
  threshold: number
  spin: number
}

function layout(): Part[] {
  const parts: Part[] = []
  const total = STEPS.length * PER_STACK
  STEPS.forEach((step, s) => {
    for (let b = 0; b < PER_STACK; b++) {
      const ordinal = s * PER_STACK + b
      parts.push({
        x: (s - (STEPS.length - 1) / 2) * STACK_GAP,
        y: b * BRICK_H,
        color: b === PER_STACK - 1 ? step.accent : step.color,
        // Leave headroom at both ends so the build completes before the
        // section leaves the viewport.
        threshold: 0.12 + (ordinal / total) * 0.74,
        spin: Math.sin(ordinal * 12.9898) * 0.9,
      })
    }
  })
  return parts
}

function PipelinePart({ part, progress }: { part: Part; progress: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null)
  const local = useRef(0)

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return

    const active = progress.current > part.threshold ? 1 : 0
    local.current = THREE.MathUtils.damp(local.current, active, 7.5, dt)
    const e = easeOutBack(Math.min(1, local.current), 1.5)

    g.visible = local.current > 0.002
    g.position.set(part.x, part.y + (1 - e) * 9, (1 - e) * part.spin * 2.4)
    g.rotation.set((1 - e) * 0.8 * part.spin, (1 - e) * 1.6 * part.spin, (1 - e) * 0.5 * part.spin)
    g.scale.setScalar(Math.max(0.001, Math.min(1, local.current * 1.08)))
  })

  return (
    <group ref={ref} visible={false}>
      <Brick size={[2, 2]} color={part.color} />
    </group>
  )
}

function PipelineCamera({ progress }: { progress: React.MutableRefObject<number> }) {
  const look = useRef(new THREE.Vector3())

  useFrame((state, dt) => {
    const p = progress.current
    const x = (p - 0.5) * 13
    const px = state.pointer?.x ?? 0

    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, x + px * 1.6, 3, dt)
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 6.4 - p * 1.4, 3, dt)
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 17.5 - p * 3.4, 3, dt)

    look.current.set(x * 0.55, 2.6, 0)
    state.camera.lookAt(look.current)
  })

  return null
}

export default function PipelineBrickScene({ progress }: { progress: React.MutableRefObject<number> }) {
  const parts = useMemo(layout, [])

  return (
    <>
      <fog attach="fog" args={['#0d0e0b', 24, 52]} />
      <StudioRig />
      <PipelineCamera progress={progress} />

      <group position={[0, -2.2, 0]}>
        <Baseplate size={40} color="slate" />
        {/* One dark plate footprint per step, always present as a build guide */}
        {STEPS.map((_, s) => (
          <Brick
            key={s}
            size={[2, 2]}
            kind="plate"
            color="darkGrey"
            position={[(s - (STEPS.length - 1) / 2) * STACK_GAP, -PLATE_H, 0]}
          />
        ))}
        {parts.map((part, i) => (
          <PipelinePart key={i} part={part} progress={progress} />
        ))}
        <ContactShadows position={[0, 0.012, 0]} opacity={0.6} scale={44} blur={2.8} far={12} resolution={512} />
      </group>
    </>
  )
}

export { STEPS }
