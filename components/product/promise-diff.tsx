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
    <section className="glass-card rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/30">
            <GitCompare size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">Promise Diff</div>
            <h3 className="font-bold text-white">git diff for commercial promises</h3>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500">
          <span title={diff.before.collector.version}>{formatTime(diff.before.observedAt)}</span>
          <ArrowRight size={12} />
          <span title={diff.after.collector.version} className="text-gray-300">{formatTime(diff.after.observedAt)}</span>
        </div>
      </div>

      {diff.changes.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-gray-500">No changes between these two observations.</div>
      ) : (
        <ul className="divide-y divide-white/5">
          {diff.changes.map((c, i) => (
            <li key={`${c.path}-${i}`} className="px-6 py-4">
              <div className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-2">{labelFor(c.path)}</div>
              <ChangeBody change={c} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function DiffLine({ sign, children }: { sign: '+' | '-'; children: React.ReactNode }) {
  const isAdd = sign === '+'
  return (
    <div className={`flex items-start gap-2 font-mono text-sm rounded-md px-3 py-1.5 ${isAdd ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
      <span className="shrink-0 opacity-70 select-none">{sign}</span>
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
            <span className={`ml-1 text-xs font-bold ${change.delta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
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
            <div className="text-sm font-mono text-gray-500">{change.after.join(', ') || '—'}</div>
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
