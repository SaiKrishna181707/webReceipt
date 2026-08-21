export default function Loading() {
  return (
    <div className="space-y-6 p-6" aria-label="Loading WebReceipt">
      <div className="flex items-center gap-4">
        <div className="sun-disc h-12 w-12 animate-pulse-glow" />
        <div className="space-y-2">
          <div className="h-3 w-40 rounded-[1px] bg-neon-500/30 shadow-[0_0_12px_-2px_rgba(255,46,151,.7)]" />
          <div className="h-8 w-64 rounded-[2px] bg-white/10" />
          <div className="h-4 w-96 max-w-full rounded-[1px] bg-white/5" />
        </div>
      </div>

      <div className="neon-rule w-full opacity-40" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          '#ff2e97',
          '#2de2e6',
          '#ffc23c',
          '#35f39a',
        ].map((c) => (
          <div key={c} className="deco-panel space-y-3 p-4">
            <div className="h-3 w-24 rounded-[1px]" style={{ background: `${c}44` }} />
            <div className="h-8 w-16 rounded-[2px] bg-white/15" />
            <div className="hud-meter" style={{ ['--meter' as string]: c }}>
              <span className="animate-shimmer" style={{ width: '62%' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="deco-panel h-72 p-6" />
        <div className="deco-panel h-72 p-6" />
      </div>

      <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-night-300">Tuning the strip…</div>
    </div>
  )
}
