'use client'

import * as THREE from 'three'
import { RoundedBox, Environment, Lightformer } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

/* ============================================================================
   LEGO UNIT SYSTEM
   Real System-in-Play dimensions, expressed in stud pitches (1 U = 8 mm) so
   every part in the scene clutches onto every other part.
   ========================================================================== */

/** Stud-to-stud pitch. */
export const U = 1
/** Brick height: 9.6 mm / 8 mm. */
export const BRICK_H = 1.2
/** Plate height: 3.2 mm / 8 mm. */
export const PLATE_H = 0.4
/** Stud radius: 4.8 mm diameter / 2 / 8 mm. */
export const STUD_R = 0.3
/** Stud height: 1.8 mm / 8 mm. */
export const STUD_H = 0.225
/** Moulding seam so neighbouring bricks read as separate parts. */
export const SEAM = 0.03

/** ABS colour names straight off the element list. */
export const ABS = {
  red: '#e3000b',
  yellow: '#f6c500',
  blue: '#0057a8',
  green: '#00852b',
  orange: '#ff6a13',
  white: '#f2f3ee',
  black: '#1b1b1b',
  grey: '#6c6e68',
  darkGrey: '#3a3c36',
  slate: '#25261f',
  tan: '#e4cd9e',
  azure: '#3aa7f0',
  lime: '#a5ca18',
} as const

export type AbsColor = keyof typeof ABS | (string & {})

export const absHex = (c: AbsColor) => (c in ABS ? ABS[c as keyof typeof ABS] : (c as string))

/* ============================================================================
   SHARED GEOMETRY + MATERIALS
   One cylinder for every stud on screen, one material per colour. Sharing
   these keeps a 200-part build inside a couple of dozen draw calls.
   ========================================================================== */

export const studGeometry = new THREE.CylinderGeometry(STUD_R, STUD_R * 0.97, STUD_H, 20, 1)

const materials = new Map<string, THREE.MeshPhysicalMaterial>()

/** Glossy injection-moulded ABS: clearcoat over a slightly rough base. */
export function absMaterial(color: AbsColor): THREE.MeshPhysicalMaterial {
  const hex = absHex(color)
  let m = materials.get(hex)
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(hex),
      roughness: 0.36,
      metalness: 0,
      clearcoat: 0.9,
      clearcoatRoughness: 0.24,
      reflectivity: 0.42,
      sheen: 0.3,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color('#ffffff'),
    })
    materials.set(hex, m)
  }
  return m
}

/* ============================================================================
   BRICK
   Origin sits at the bottom-centre of the part, so stacking is just
   `y += BRICK_H` — exactly like building for real.
   ========================================================================== */

type BrickProps = Omit<ThreeElements['group'], 'args'> & {
  /** Footprint in studs: [x, z]. A classic 2x4 is `[4, 2]`. */
  size?: [number, number]
  kind?: 'brick' | 'plate'
  color?: AbsColor
  studs?: boolean
  /** Vertical multiplier for tiles/tall bricks. */
  heightScale?: number
}

export function Brick({
  size = [2, 2],
  kind = 'brick',
  color = 'red',
  studs = true,
  heightScale = 1,
  children,
  ...group
}: BrickProps) {
  const [sx, sz] = size
  const h = (kind === 'plate' ? PLATE_H : BRICK_H) * heightScale
  const w = sx * U - SEAM
  const d = sz * U - SEAM
  const material = absMaterial(color)

  return (
    <group {...group}>
      <RoundedBox
        args={[w, h, d]}
        radius={Math.min(0.06, h * 0.28)}
        smoothness={3}
        steps={1}
        position={[0, h / 2, 0]}
        material={material}
        castShadow
        receiveShadow
      />
      {studs &&
        Array.from({ length: sx }, (_, i) =>
          Array.from({ length: sz }, (_, j) => (
            <mesh
              key={`${i}-${j}`}
              geometry={studGeometry}
              material={material}
              position={[i - (sx - 1) / 2, h + STUD_H / 2 - 0.002, j - (sz - 1) / 2]}
              castShadow
              receiveShadow
            />
          )),
        )}
      {children}
    </group>
  )
}

/* ============================================================================
   BASEPLATE
   A thin plate with an instanced stud field — 32x32 studs costs one draw call.
   ========================================================================== */

export function Baseplate({
  size = 24,
  color = 'slate',
  ...group
}: Omit<ThreeElements['group'], 'args'> & { size?: number; color?: AbsColor }) {
  const material = absMaterial(color)
  const count = size * size
  const half = (size - 1) / 2

  return (
    <group {...group}>
      <mesh position={[0, -PLATE_H / 2, 0]} receiveShadow material={material}>
        <boxGeometry args={[size * U, PLATE_H, size * U]} />
      </mesh>
      <instancedMesh
        args={[studGeometry, material, count]}
        receiveShadow
        ref={(inst) => {
          if (!inst) return
          const m = new THREE.Matrix4()
          for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
              m.setPosition(i - half, STUD_H / 2 - 0.002, j - half)
              inst.setMatrixAt(i * size + j, m)
            }
          }
          inst.instanceMatrix.needsUpdate = true
        }}
      />
    </group>
  )
}

/* ============================================================================
   MINIFIG
   Roughly 4 bricks tall, built out of the same primitives. Not licensed
   geometry — just the silhouette everyone recognises.
   ========================================================================== */

export function Minifig({
  torso = 'blue',
  legs = 'black',
  head = 'yellow',
  hands = 'yellow',
  armSwing = 0,
  ...group
}: Omit<ThreeElements['group'], 'args'> & {
  torso?: AbsColor
  legs?: AbsColor
  head?: AbsColor
  hands?: AbsColor
  armSwing?: number
}) {
  const legMat = absMaterial(legs)
  const torsoMat = absMaterial(torso)
  const headMat = absMaterial(head)
  const handMat = absMaterial(hands)
  const faceMat = absMaterial('black')

  return (
    <group {...group}>
      {/* Legs + hips */}
      <mesh position={[-0.34, 0.62, 0]} material={legMat} castShadow receiveShadow>
        <boxGeometry args={[0.6, 1.24, 0.86]} />
      </mesh>
      <mesh position={[0.34, 0.62, 0]} material={legMat} castShadow receiveShadow>
        <boxGeometry args={[0.6, 1.24, 0.86]} />
      </mesh>
      <mesh position={[0, 1.42, 0]} material={legMat} castShadow receiveShadow>
        <boxGeometry args={[1.32, 0.42, 0.9]} />
      </mesh>

      {/* Torso — a 4-sided cylinder gives the real tapered-to-the-neck profile */}
      <mesh position={[0, 2.28, 0]} rotation={[0, Math.PI / 4, 0]} material={torsoMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.66, 0.8, 1.36, 4, 1]} />
      </mesh>
      <mesh position={[0, 2.94, 0]} material={torsoMat} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.22, 16]} />
      </mesh>

      {/* Arms + hands */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.62, 2.66, 0]} rotation={[s * armSwing, 0, s * 0.24]}>
          <mesh position={[0, -0.44, 0.04]} material={torsoMat} castShadow>
            <capsuleGeometry args={[0.24, 0.6, 4, 10]} />
          </mesh>
          <mesh position={[0, -0.96, 0.28]} material={handMat} castShadow>
            <torusGeometry args={[0.17, 0.075, 8, 16]} />
          </mesh>
        </group>
      ))}

      {/* Head + top stud */}
      <mesh position={[0, 3.32, 0]} material={headMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.52, 0.52, 0.94, 24, 1]} />
      </mesh>
      <mesh geometry={studGeometry} material={headMat} position={[0, 3.9, 0]} castShadow />

      {/* Face: two dots and a smile */}
      {[-0.19, 0.19].map((x) => (
        <mesh key={x} position={[x, 3.46, 0.5]} material={faceMat}>
          <sphereGeometry args={[0.062, 10, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 3.3, 0.47]} rotation={[0, 0, Math.PI]} material={faceMat}>
        <torusGeometry args={[0.19, 0.032, 8, 16, Math.PI]} />
      </mesh>
    </group>
  )
}

/* ============================================================================
   STUDIO RIG
   No HDRI download: the environment is assembled from local lightformers, so
   the clearcoat has something real to reflect even offline.
   ========================================================================== */

export function StudioRig({ shadows = true }: { shadows?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.85} />
      {/* Key light — casts the build's shadow onto the plate */}
      <directionalLight
        position={[6, 11, 6]}
        intensity={2.1}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0012}
      >
        <orthographicCamera attach="shadow-camera" args={[-13, 13, 13, -13, 0.1, 44]} />
      </directionalLight>
      {/* Cool fill from the opposite side keeps the dark greys readable */}
      <directionalLight position={[-8, 5, -5]} intensity={0.8} color="#8fc4ff" />
      {/* Warm rim so silhouettes separate from the plate */}
      <pointLight position={[0, 3, -8]} intensity={26} color="#ffd21e" distance={26} decay={2} />

      <Environment resolution={192} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 8, 4]} scale={[12, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.4} position={[-9, 3, 2]} scale={[8, 8, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.1} position={[9, 2, -3]} scale={[8, 8, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={2.4} position={[0, -6, 0]} scale={10} target={[0, 0, 0]} />
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
