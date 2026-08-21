'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import HeroViceScene from './hero-vice-scene'
import BoulevardScene from './boulevard-scene'

/* ============================================================================
   CANVAS STAGE
   Everything WebGL lives behind this one lazy chunk. The stage pauses its
   frameloop the moment it scrolls out of view, so a long page never keeps a
   render loop alive off-screen.
   ========================================================================== */

export type SceneName = 'hero' | 'boulevard'

/**
 * Tracks how far the element travels through the viewport, 0 → 1.
 * A sticky canvas can't measure itself (its rect stops moving once pinned), so
 * we measure the nearest `[data-scroll-root]` ancestor when there is one.
 */
function useSectionProgress(target: React.RefObject<HTMLElement>) {
  const progress = useRef(0)

  useEffect(() => {
    const el = target.current
    if (!el) return
    const measured = (el.closest('[data-scroll-root]') as HTMLElement | null) ?? el

    const update = () => {
      const rect = measured.getBoundingClientRect()
      const span = rect.height + window.innerHeight
      const travelled = window.innerHeight - rect.top
      progress.current = Math.max(0, Math.min(1, travelled / span))
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [target])

  return progress
}

export default function ViceStageInner({ scene, className = '' }: { scene: SceneName; className?: string }) {
  const host = useRef<HTMLDivElement>(null)
  const progress = useSectionProgress(host)
  const [visible, setVisible] = useState(true)
  const [still, setStill] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setStill(query.matches)
    const onChange = () => setStill(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={host} className={className} style={{ touchAction: 'pan-y' }}>
      <Canvas
        // A reduced-motion visitor still gets the city — it simply stops moving.
        frameloop={still ? 'demand' : visible ? 'always' : 'never'}
        shadows="soft"
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        camera={{
          position: scene === 'hero' ? [0, 5.4, 15.4] : [0, 3.1, 4],
          fov: scene === 'hero' ? 38 : 46,
          far: 400,
        }}
      >
        {scene === 'hero' ? <HeroViceScene /> : <BoulevardScene progress={progress} />}
      </Canvas>
    </div>
  )
}
