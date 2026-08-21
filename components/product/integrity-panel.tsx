'use client'

import { Check, X, ShieldCheck, ShieldAlert, ShieldX, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { Integrity, IntegrityCheck } from '@/lib/types'

/* The integrity engine reads like the status board behind a hotel desk: one lit
   line per check, and the whole board changes colour when the deal is bad. */

const MINT = '#35f39a'
const GOLD = '#ffc23c'
const BLOOD = '#ff2d5e'

const STATUS = {
  valid: { icon: ShieldCheck, tube: MINT, label: 'Contract valid' },
  warning: { icon: ShieldAlert, tube: GOLD, label: 'Contract warnings' },
  invalid: { icon: ShieldX, tube: BLOOD, label: 'Contract integrity failure' },
} as const

export function IntegrityPanel({ integrity }: { integrity: Integrity }) {
  const meta = STATUS[integrity.status]
  const Icon = meta.icon
  const pct = Math.round((integrity.passed / Math.max(1, integrity.total)) * 100)

  return (
    <section
      className="overflow-hidden rounded-[2px] border bg-black/45 backdrop-blur-sm"
      style={{ borderColor: `${meta.tube}55`, boxShadow: `inset 0 0 40px -26px ${meta.tube}` }}
    >
      <div
        className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4"
        style={{ background: `linear-gradient(180deg, ${meta.tube}14, transparent)` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="rounded-[2px] border p-2"
            style={{
              borderColor: meta.tube,
              color: meta.tube,
              background: `${meta.tube}12`,
              boxShadow: `inset 0 0 18px -8px ${meta.tube}, 0 0 18px -8px ${meta.tube}`,
            }}
          >
            <Icon size={18} />
          </div>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-night-300">
              Contract Integrity Engine
            </div>
            <h3 className="display text-base italic" style={{ color: meta.tube, textShadow: `0 0 12px ${meta.tube}88` }}>
              {meta.label}
            </h3>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="display text-2xl italic text-white">
            {integrity.passed}
            <span className="text-night-400">/{integrity.total}</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-night-300">checks passed</div>
        </div>
      </div>

      <div className="px-6 pt-4">
        <div className="hud-meter" style={{ ['--meter' as string]: meta.tube }}>
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ul className="mt-3 divide-y divide-white/5">
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
  const tube = check.pass ? MINT : check.severity === 'critical' ? BLOOD : GOLD

  return (
    <li>
      <button
        onClick={() => hasDetails && setOpen((o) => !o)}
        className={`flex w-full items-center gap-3 px-6 py-3 text-left ${
          hasDetails ? 'hover:bg-white/[0.03]' : 'cursor-default'
        }`}
      >
        {/* A bulb, lit or blown */}
        <span
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
          style={{
            color: '#0a0510',
            background: tube,
            boxShadow: `0 0 12px -1px ${tube}`,
            opacity: check.pass ? 1 : 0.92,
          }}
        >
          {check.pass ? <Check size={12} /> : <X size={12} />}
        </span>
        <span
          className="flex-1 text-sm"
          style={check.pass ? { color: '#e9e5f7' } : { color: tube, fontWeight: 500, textShadow: `0 0 10px ${tube}66` }}
        >
          {check.label}
        </span>
        {!check.pass && (
          <span
            className="rounded-[1px] border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em]"
            style={{ borderColor: `${tube}66`, color: tube, background: `${tube}14` }}
          >
            {check.severity}
          </span>
        )}
        {hasDetails && (
          <ChevronDown size={14} className={`text-night-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>
      {open && hasDetails && (
        <div className="-mt-1 px-6 pb-3">
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-[2px] border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-night-200">
            {JSON.stringify(check.details, null, 2)}
          </pre>
        </div>
      )}
    </li>
  )
}
