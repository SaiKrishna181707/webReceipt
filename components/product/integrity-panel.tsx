'use client'

import { Check, X, ShieldCheck, ShieldAlert, ShieldX, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { Integrity, IntegrityCheck } from '@/lib/types'

const STATUS = {
  valid: { icon: ShieldCheck, color: 'lime', label: 'Contract valid' },
  warning: { icon: ShieldAlert, color: 'amber', label: 'Contract warnings' },
  invalid: { icon: ShieldX, color: 'rose', label: 'Contract integrity failure' },
} as const

const COLOR: Record<string, string> = {
  lime: 'text-lime-400 bg-lime-500/10 border-lime-500/30',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
}

export function IntegrityPanel({ integrity }: { integrity: Integrity }) {
  const meta = STATUS[integrity.status]
  const Icon = meta.icon

  return (
    <section className="glass-card rounded-[8px] border border-white/10 overflow-hidden">
      <div className={`px-6 py-4 border-b border-white/10 flex items-center justify-between ${integrity.status === 'invalid' ? 'bg-rose-500/[0.07]' : ''}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-[6px] border ${COLOR[meta.color]}`}>
            <Icon size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-plate-300 font-bold">
              Contract Integrity Engine
            </div>
            <h3 className={`font-bold ${COLOR[meta.color].split(' ')[0]}`}>{meta.label}</h3>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-white">
            {integrity.passed}<span className="text-plate-400">/{integrity.total}</span>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-plate-300">checks passed</div>
        </div>
      </div>

      <ul className="divide-y divide-white/5">
        {integrity.checks.map((c) => (
          <CheckRow key={c.id} check={c} />
        ))}
      </ul>
    </section>
  )
}

function CheckRow({ check }: { check: IntegrityCheck }) {
  const [open, setOpen] = useState(!check.pass && check.severity === 'critical')
  const hasDetails = check.details && Object.keys(check.details).length > 0

  return (
    <li>
      <button
        onClick={() => hasDetails && setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-6 py-3 text-left ${hasDetails ? 'hover:bg-white/[0.03]' : 'cursor-default'}`}
      >
        <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${check.pass ? 'bg-lime-500/20 text-lime-400' : 'bg-rose-500/20 text-rose-400'}`}>
          {check.pass ? <Check size={12} /> : <X size={12} />}
        </span>
        <span className={`flex-1 text-sm ${check.pass ? 'text-plate-100' : 'text-rose-300 font-medium'}`}>{check.label}</span>
        {!check.pass && (
          <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${check.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {check.severity}
          </span>
        )}
        {hasDetails && <ChevronDown size={14} className={`text-plate-400 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && hasDetails && (
        <div className="px-6 pb-3 -mt-1">
          <pre className="bg-black/50 border border-white/10 rounded-lg p-3 text-[11px] font-mono text-plate-200 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(check.details, null, 2)}
          </pre>
        </div>
      )}
    </li>
  )
}
