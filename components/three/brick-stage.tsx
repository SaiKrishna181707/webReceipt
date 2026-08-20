'use client'

import dynamic from 'next/dynamic'
import type { SceneName } from './brick-stage-inner'

/* ============================================================================
   Lazy entry point for everything WebGL. `ssr: false` keeps three.js out of the
   server bundle and out of first paint; the skeleton below is a pure-CSS brick
   so the layout never jumps while the chunk loads.
   ========================================================================== */

const Inner = dynamic(() => import('./brick-stage-inner'), {
  ssr: false,
  loading: () => <StageSkeleton />,
})

function StageSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          {['#e3000b', '#f6c500', '#0057a8', '#00852b'].map((c, i) => (
            <span
              key={c}
              className="h-7 w-5 rounded-[3px]"
              style={{
                background: c,
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,.4), inset 0 -3px 0 rgba(0,0,0,.35)',
                animation: `brickBob 1.1s ${i * 0.12}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-plate-300">Opening the box…</span>
      </div>
    </div>
  )
}

export function BrickStage({ scene, className }: { scene: SceneName; className?: string }) {
  return <Inner scene={scene} className={className} />
}
