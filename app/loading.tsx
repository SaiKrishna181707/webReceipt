/**
 * Route-level fallback. Reads as the system establishing a channel rather than
 * as a spinner — same surfaces as the real pages, nothing lit that isn't loading.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8" aria-label="Loading WebReceipt">
      <div className="space-y-2">
        <div className="h-2.5 w-32 rounded-[1px] bg-matrix-500/30 shadow-[0_0_12px_-4px_rgba(51,255,102,.7)]" />
        <div className="h-7 w-64 rounded-[2px] bg-matrix-400/10" />
        <div className="h-4 w-96 max-w-full rounded-[1px] bg-matrix-400/[0.06]" />
      </div>

      <div className="sys-rule w-full opacity-40" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {['#33ff66', '#2fe3ba', '#3fbf66', '#ccbb45'].map((c) => (
          <div key={c} className="panel panel-rail space-y-3 p-4">
            <div className="h-2.5 w-24 rounded-[1px]" style={{ background: `${c}40` }} />
            <div className="h-7 w-16 rounded-[2px] bg-matrix-400/10" />
            <div className="hud-meter" style={{ ['--meter' as string]: c }}>
              <span className="animate-shimmer" style={{ width: '62%' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="panel panel-rail h-72 p-6" />
        <div className="panel panel-rail h-72 p-6" />
      </div>

      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-void-300">
        <span className="sys-prompt">Establishing secure channel</span>
        <span className="caret" />
      </div>
    </div>
  )
}
