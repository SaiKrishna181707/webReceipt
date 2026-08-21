'use client'

import dynamic from 'next/dynamic'
import type { SceneName } from './vice-stage-inner'

/* ============================================================================
   Lazy entry point for everything WebGL. `ssr: false` keeps three.js out of the
   server bundle and out of first paint; the skeleton below is a pure-CSS sunset
   so the layout never jumps while the chunk loads.
   ========================================================================== */

const Inner = dynamic(() => import('./vice-stage-inner'), {
  ssr: false,
  loading: () => <StageSkeleton />,
})

function StageSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="sun-disc h-20 w-20 animate-pulse-glow" />
        <div className="flex flex-col items-center gap-2">
          <div className="neon-rule w-28" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-night-300">
            Tuning the strip…
          </span>
        </div>
      </div>
    </div>
  )
}

export function ViceStage({ scene, className }: { scene: SceneName; className?: string }) {
  return <Inner scene={scene} className={className} />
}
