'use client'

import { AlertTriangle, Info, TrendingUp } from 'lucide-react'
import type { Anomaly } from '@/lib/types'
import { matrixTones } from '@/components/matrix/matrix-ui'

/* Anomalies are reported, never judged — so they read as a noticeboard, not a
   verdict. Severity only changes the colour of the lamp. */

const SEVERITY: Record<string, { tube: string; icon: typeof Info }> = {
  high: { tube: matrixTones.alarm.line, icon: TrendingUp },
  medium: { tube: matrixTones.warn.line, icon: AlertTriangle },
  info: { tube: matrixTones.data.line, icon: Info },
}

export function AnomaliesPanel({ anomalies }: { anomalies: Anomaly[] }) {
  return (
    <section className="panel panel-rail overflow-hidden" style={{ ['--accent' as string]: matrixTones.warn.line }}>
      <div className="border-b border-matrix-400/12 bg-gradient-to-b from-warn-500/[0.07] to-transparent px-6 py-4">
        <div className="sys-label">Deal Anomalies</div>
        <h3 className="mt-0.5 font-mono text-[13px] font-semibold uppercase tracking-[0.08em] text-warn-300">
          Observed, not adjudicated
        </h3>
      </div>
      {anomalies.length === 0 ? (
        <div className="px-6 py-8 text-center text-[13.5px] text-void-300">
          No anomalies observed in this contract.
        </div>
      ) : (
        <ul className="divide-y divide-matrix-400/8">
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
                  <Icon size={14} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13.5px] font-medium text-void-100">{a.label}</span>
                    <span
                      className="shrink-0 font-mono text-[15px] font-semibold tabular-nums"
                      style={{ color: meta.tube }}
                    >
                      {a.value}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-void-300">{a.details}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
