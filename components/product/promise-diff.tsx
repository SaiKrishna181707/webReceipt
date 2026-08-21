'use client'

import { GitCompare, ArrowRight } from 'lucide-react'
import type { DiffResult, DiffChange } from '@/lib/types'
import { money, signedMoney, formatTime } from '@/lib/api'

const PATH_LABELS: Record<string, string> = {
  'offer.advertisedPrice': 'Advertised price',
  'offer.claims': 'Marketing claims',
  'checkout.basePrice': 'Base price',
  'checkout.mandatoryFees': 'Mandatory fees',
  'checkout.taxes': 'Taxes',
  'checkout.optionalAddons': 'Optional add-ons',
  'checkout.discounts': 'Discounts',
  'checkout.finalTotal': 'Final total',
  'terms.cancellation': 'Cancellation policy',
  'terms.refundability': 'Refundability',
  'terms.paymentTiming': 'Payment timing',
  'terms.inclusions': 'Inclusions',
}

function labelFor(path: string): string {
  if (PATH_LABELS[path]) return PATH_LABELS[path]
  if (path.startsWith('checkout.feeItems.')) return `Fee · ${path.slice('checkout.feeItems.'.length)}`
  return path
}

export function PromiseDiff({ diff }: { diff: DiffResult }) {
  return (
    <section className="overflow-hidden rounded-[2px] border border-violet-400/30 bg-black/45 shadow-[inset_0_0_44px_-28px_rgba(177,132,255,.95)] backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-r from-violet-400/[0.1] to-transparent px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-[2px] border border-violet-300 bg-violet-400/12 p-2 text-violet-300 shadow-[inset_0_0_18px_-8px_#b184ff,0_0_18px_-8px_#b184ff]">
            <GitCompare size={18} />
          </div>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-night-300">Promise Diff</div>
            <h3 className="display text-base italic text-violet-200 [text-shadow:0_0_12px_rgba(177,132,255,.5)]">
              git diff for commercial promises
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-night-300">
          <span title={diff.before.collector.version}>{formatTime(diff.before.observedAt)}</span>
          <ArrowRight size={12} className="text-violet-300" />
          <span title={diff.after.collector.version} className="text-night-100">
            {formatTime(diff.after.observedAt)}
          </span>
        </div>
      </div>

      {diff.changes.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-night-300">No changes between these two observations.</div>
      ) : (
        <ul className="divide-y divide-white/5">
          {diff.changes.map((c, i) => (
            <li key={`${c.path}-${i}`} className="px-6 py-4">
              <div className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-night-300">{labelFor(c.path)}</div>
              <ChangeBody change={c} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Removed lines burn red, added lines run mint — the two tubes of the strip. */
function DiffLine({ sign, children }: { sign: '+' | '-'; children: React.ReactNode }) {
  const isAdd = sign === '+'
  const c = isAdd ? '#35f39a' : '#ff2d5e'
  return (
    <div
      className="flex items-start gap-2 rounded-[2px] border-l-2 px-3 py-1.5 font-mono text-sm"
      style={{
        borderLeftColor: c,
        background: `${c}12`,
        color: isAdd ? '#7dffb0' : '#ff8fa9',
        boxShadow: `inset 12px 0 22px -20px ${c}`,
      }}
    >
      <span className="shrink-0 select-none opacity-70">{sign}</span>
      <span className="break-words">{children}</span>
    </div>
  )
}

function ChangeBody({ change }: { change: DiffChange }) {
  switch (change.kind) {
    case 'money':
      return (
        <div className="space-y-1">
          <DiffLine sign="-">{money(change.before, change.currency)}</DiffLine>
          <DiffLine sign="+">
            {money(change.after, change.currency)}{' '}
            <span className={`ml-1 text-xs font-bold ${change.delta > 0 ? 'text-blood-400' : 'text-mint-400'}`}>
              ({signedMoney(change.delta, change.currency)})
            </span>
          </DiffLine>
        </div>
      )
    case 'text':
      return (
        <div className="space-y-1">
          <DiffLine sign="-">{change.before}</DiffLine>
          <DiffLine sign="+">{change.after}</DiffLine>
        </div>
      )
    case 'list': {
      const removed = change.before.filter((x) => !change.after.includes(x))
      const added = change.after.filter((x) => !change.before.includes(x))
      return (
        <div className="space-y-1">
          {removed.map((x) => <DiffLine key={`r-${x}`} sign="-">{x}</DiffLine>)}
          {added.map((x) => <DiffLine key={`a-${x}`} sign="+">{x}</DiffLine>)}
          {removed.length === 0 && added.length === 0 && (
            <div className="font-mono text-sm text-night-300">{change.after.join(', ') || '—'}</div>
          )}
        </div>
      )
    }
    case 'fee_added':
      return <DiffLine sign="+">New fee: {money(change.after, change.currency)}</DiffLine>
    case 'fee_removed':
      return <DiffLine sign="-">Removed fee: {money(change.before, change.currency)}</DiffLine>
    default:
      return null
  }
}
