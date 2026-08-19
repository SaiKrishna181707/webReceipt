'use client'

import { ChevronRight, ArrowUpRight } from 'lucide-react'
import type { JourneyStep } from '@/lib/types'
import { money, percent } from '@/lib/api'

interface JourneyReplayProps {
  journey: JourneyStep[]
  currency: string
  /** Visual state of the final (checkout) node. */
  finalState?: 'ok' | 'failed' | 'healing'
  onStepClick?: (step: JourneyStep) => void
}

export function JourneyReplay({ journey, currency, finalState = 'ok', onStepClick }: JourneyReplayProps) {
  if (!journey.length) return null

  const first = journey[0].displayedPrice.amount
  const last = journey[journey.length - 1].displayedPrice.amount
  const delta = last - first
  const ratio = first > 0 ? delta / first : 0

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400">Journey Replay</h2>
        {delta > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-full px-3 py-1">
            <ArrowUpRight size={13} />
            Observed increase during journey: {percent(ratio)} ({money(delta, currency)})
          </span>
        )}
      </div>

      <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
        {journey.map((step, i) => {
          const isFinal = i === journey.length - 1
          const state = isFinal ? finalState : 'ok'
          const raised = step.displayedPrice.amount > first
          return (
            <div key={step.index} className="flex items-stretch gap-2 shrink-0">
              <button
                onClick={() => onStepClick?.(step)}
                className={`group text-left w-40 rounded-2xl border p-4 transition-all ${
                  state === 'failed'
                    ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_24px_-6px_rgba(244,63,94,0.4)]'
                    : state === 'healing'
                      ? 'bg-amber-500/10 border-amber-500/50'
                      : 'bg-white/[0.03] border-white/10 hover:border-violet-500/40 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold text-violet-400">
                    {String(step.index).padStart(2, '0')} · {step.label.toUpperCase()}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      state === 'failed' ? 'bg-rose-500 animate-ping' : state === 'healing' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                    }`}
                  />
                </div>
                <div
                  className={`text-xl font-bold font-mono ${
                    state === 'failed' ? 'text-rose-400' : raised ? 'text-white' : 'text-gray-200'
                  }`}
                >
                  {money(step.displayedPrice.amount, step.displayedPrice.currency)}
                </div>
                {step.evidenceId && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-gray-500 group-hover:text-violet-300 transition-colors">
                    View evidence <ChevronRight size={11} />
                  </div>
                )}
              </button>
              {i < journey.length - 1 && (
                <div className="flex items-center text-gray-600">
                  <ChevronRight size={16} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
