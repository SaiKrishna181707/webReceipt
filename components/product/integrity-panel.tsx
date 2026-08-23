'use client'

import { Check, X, ShieldCheck, ShieldAlert, ShieldX, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { Integrity, IntegrityCheck, ProductObservationIntegrity } from '@/lib/types'
import { matrixTones } from '@/components/matrix/matrix-ui'

/* The integrity engine is the status board of the whole system: one line per
   check, and the board changes colour when the contract is bad. Pass, warn and
   fail are the three states that must never be confusable — so they are the
   three tones in the system that aren't the same hue. */

const PASS = matrixTones.matrix.line
const WARN = matrixTones.warn.line
const FAIL = matrixTones.alarm.line

const STATUS = {
  valid: { icon: ShieldCheck, tube: PASS, label: 'Contract valid' },
  warning: { icon: ShieldAlert, tube: WARN, label: 'Contract warnings' },
  invalid: { icon: ShieldX, tube: FAIL, label: 'Integrity failure' },
  partial: { icon: ShieldAlert, tube: WARN, label: 'Offer observed · checkout pending' },
} as const

type IntegritySurface = Integrity | ProductObservationIntegrity

export function IntegrityPanel({ integrity }: { integrity: IntegritySurface }) {
  const meta = STATUS[integrity.status]
  const Icon = meta.icon
  const pct = Math.round((integrity.passed / Math.max(1, integrity.total)) * 100)
  const partialReason = 'reason' in integrity ? integrity.reason : null

  return (
    <section
      className="panel overflow-hidden"
      style={{ borderColor: `${meta.tube}55`, boxShadow: `inset 0 0 40px -26px ${meta.tube}` }}
    >
      <div
        className="flex items-center justify-between gap-4 border-b border-matrix-400/12 px-6 py-4"
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
            <Icon size={18} aria-hidden />
          </div>
          <div>
            <div className="sys-label">{integrity.status === 'partial' ? 'Observation Integrity' : 'Contract Integrity Engine'}</div>
            <h3 className="mt-0.5 font-mono text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: meta.tube }}>
              {meta.label}
            </h3>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-2xl font-semibold tabular-nums text-void-100">
            {integrity.passed}
            <span className="text-void-400">/{integrity.total}</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-void-300">checks passed</div>
        </div>
      </div>

      {partialReason && (
        <p className="border-b border-matrix-400/8 px-6 py-3 text-[12.5px] leading-relaxed text-void-300">
          {partialReason}
        </p>
      )}

      <div className="px-6 pt-4">
        <div className="hud-meter" style={{ ['--meter' as string]: meta.tube }}>
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ul className="mt-3 divide-y divide-matrix-400/8">
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
  const tube = check.pass ? PASS : check.severity === 'critical' ? FAIL : WARN

  return (
    <li>
      <button
        onClick={() => hasDetails && setOpen((o) => !o)}
        aria-expanded={hasDetails ? open : undefined}
        className={`flex w-full items-center gap-3 px-6 py-3 text-left ${
          hasDetails ? 'hover:bg-matrix-400/[0.04]' : 'cursor-default'
        }`}
      >
        <span
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
          style={{
            color: '#000',
            background: tube,
            boxShadow: `0 0 12px -1px ${tube}`,
            opacity: check.pass ? 1 : 0.92,
          }}
        >
          {check.pass ? <Check size={12} aria-hidden /> : <X size={12} aria-hidden />}
        </span>
        <span
          className="flex-1 text-[13.5px]"
          style={check.pass ? { color: '#e8ffee' } : { color: tube, fontWeight: 500 }}
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
          <ChevronDown size={14} className={`text-void-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        )}
      </button>
      {open && hasDetails && (
        <div className="-mt-1 px-6 pb-3">
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-[2px] border border-matrix-400/12 bg-black/70 p-3 font-mono text-[11px] text-void-200">
            {JSON.stringify(check.details, null, 2)}
          </pre>
        </div>
      )}
    </li>
  )
}
