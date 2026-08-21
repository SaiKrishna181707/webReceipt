'use client'

import { AlertTriangle, Info, TrendingUp } from 'lucide-react'
import type { Anomaly } from '@/lib/types'

/* Anomalies are reported, never judged — so they read as a lit noticeboard,
   not a verdict. Severity only changes the colour of the tube. */

const SEVERITY: Record<string, { tube: string; icon: typeof Info }> = {
  high: { tube: '#ff2d5e', icon: TrendingUp },
  medium: { tube: '#ffc23c', icon: AlertTriangle },
  info: { tube: '#2de2e6', icon: Info },
}

export function AnomaliesPanel({ anomalies }: { anomalies: Anomaly[] }) {
  return (
    <section className="overflow-hidden rounded-[2px] border border-gold-500/25 bg-black/45 shadow-[inset_0_0_40px_-26px_rgba(255,194,60,.9)] backdrop-blur-sm">
      <div className="border-b border-white/10 bg-gradient-to-b from-gold-500/[0.08] to-transparent px-6 py-4">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-night-300">Deal Anomalies</div>
        <h3 className="display text-base italic text-gold-300 [text-shadow:0_0_12px_rgba(255,194,60,.5)]">
          Observed, not adjudicated
        </h3>
      </div>
      {anomalies.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-night-300">No anomalies observed in this contract.</div>
      ) : (
        <ul className="divide-y divide-white/5">
          {anomalies.map((a) => {
            const meta = SEVERITY[a.severity] ?? SEVERITY.info
            const Icon = meta.icon
            return (
              <li key={a.id} className="flex items-start gap-3 px-6 py-4">
                <div
                  className="shrink-0 rounded-[2px] border p-1.5"
                  style={{
                    borderColor: meta.tube,
                    color: meta.tube,
                    background: `${meta.tube}12`,
                    boxShadow: `inset 0 0 16px -8px ${meta.tube}`,
                  }}
                >
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-night-100">{a.label}</span>
                    <span
                      className="display shrink-0 text-base italic"
                      style={{ color: meta.tube, textShadow: `0 0 11px ${meta.tube}77` }}
                    >
                      {a.value}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-night-300">{a.details}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
