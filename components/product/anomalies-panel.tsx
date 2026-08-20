'use client'

import { AlertTriangle, Info, TrendingUp } from 'lucide-react'
import type { Anomaly } from '@/lib/types'

const SEVERITY: Record<string, { color: string; icon: typeof Info }> = {
  high: { color: 'rose', icon: TrendingUp },
  medium: { color: 'amber', icon: AlertTriangle },
  info: { color: 'azure', icon: Info },
}

const COLOR: Record<string, string> = {
  rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  azure: 'text-azure-400 bg-azure-500/10 border-azure-500/30',
}

export function AnomaliesPanel({ anomalies }: { anomalies: Anomaly[] }) {
  return (
    <section className="glass-card rounded-[8px] border border-white/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <div className="text-[10px] font-mono uppercase tracking-wider text-plate-300 font-bold">Deal Anomalies</div>
        <h3 className="font-bold text-white">Observed, not adjudicated</h3>
      </div>
      {anomalies.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-plate-300">No anomalies observed in this contract.</div>
      ) : (
        <ul className="divide-y divide-white/5">
          {anomalies.map((a) => {
            const meta = SEVERITY[a.severity] ?? SEVERITY.info
            const Icon = meta.icon
            return (
              <li key={a.id} className="px-6 py-4 flex items-start gap-3">
                <div className={`shrink-0 p-1.5 rounded-lg border ${COLOR[meta.color]}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-plate-100">{a.label}</span>
                    <span className={`shrink-0 text-sm font-mono font-bold ${COLOR[meta.color].split(' ')[0]}`}>{a.value}</span>
                  </div>
                  <p className="text-xs text-plate-300 mt-1 leading-relaxed">{a.details}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
