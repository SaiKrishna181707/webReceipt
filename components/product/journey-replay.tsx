'use client'

import { ChevronRight, ArrowUpRight } from 'lucide-react'
import type { JourneyStep } from '@/lib/types'
import { money, percent } from '@/lib/api'
import { matrixTones } from '@/components/matrix/matrix-ui'

interface JourneyReplayProps {
  journey: JourneyStep[]
  currency: string
  /** Visual state of the final (checkout) node. */
  finalState?: 'ok' | 'failed' | 'healing'
  onStepClick?: (step: JourneyStep) => void
}

/* The journey is a row of nodes along one track: each reports the price the page
   was displaying at the time, and the last one is the node that lies. */

const OK = matrixTones.phosphor.line
const FAILED = matrixTones.alarm.line
const HEALING = matrixTones.warn.line
const LIVE = matrixTones.matrix.line

export function JourneyReplay({ journey, currency, finalState = 'ok', onStepClick }: JourneyReplayProps) {
  if (!journey.length) return null

  const first = journey[0].displayedPrice.amount
  const last = journey[journey.length - 1].displayedPrice.amount
  const delta = last - first
  const ratio = first > 0 ? delta / first : 0

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="sys-label">Journey Replay</h2>
        {delta > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-alarm-500/45 bg-alarm-500/10 px-3 py-1 font-mono text-[12px] font-semibold text-alarm-300 shadow-[0_0_18px_-8px_#ff4d4d]">
            <ArrowUpRight size={13} aria-hidden />
            Observed increase during journey: {percent(ratio)} ({money(delta, currency)})
          </span>
        )}
      </div>

      <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
        {journey.map((step, i) => {
          const isFinal = i === journey.length - 1
          const state = isFinal ? finalState : 'ok'
          const tube = state === 'failed' ? FAILED : state === 'healing' ? HEALING : OK
          const hot = state !== 'ok'
          const raised = step.displayedPrice.amount > first
          return (
            <div key={step.index} className="flex shrink-0 items-stretch gap-2">
              <button
                onClick={() => onStepClick?.(step)}
                style={{
                  borderColor: hot ? tube : 'rgba(232,255,238,.1)',
                  background: hot ? `${tube}12` : 'rgba(51,255,102,.03)',
                  boxShadow: hot
                    ? `0 0 26px -8px ${tube}, inset 0 0 26px -16px ${tube}`
                    : 'inset 0 1px 0 rgba(51,255,102,.07)',
                }}
                className="group w-40 rounded-[2px] border p-4 text-left transition-all hover:border-matrix-400/60"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-phosphor-400">
                    {String(step.index).padStart(2, '0')} · {step.label}
                  </span>
                  {/* Steady while the node reports honestly, flashing when it doesn't. */}
                  <span
                    className={`h-2 w-2 rounded-full ${
                      state === 'failed' ? 'animate-ping' : state === 'healing' ? 'animate-pulse' : ''
                    }`}
                    style={{ background: hot ? tube : LIVE, boxShadow: `0 0 9px ${hot ? tube : LIVE}` }}
                  />
                </div>
                <div
                  className="font-mono text-xl font-semibold tabular-nums"
                  style={
                    state === 'failed'
                      ? { color: FAILED, textShadow: `0 0 12px ${FAILED}88` }
                      : raised
                        ? { color: '#e8ffee', textShadow: '0 0 14px rgba(51,255,102,.4)' }
                        : { color: '#a9c9b1' }
                  }
                >
                  {money(step.displayedPrice.amount, step.displayedPrice.currency)}
                </div>
                {step.evidenceId && (
                  <div className="mt-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-void-300 transition-colors group-hover:text-matrix-200">
                    View evidence <ChevronRight size={11} aria-hidden />
                  </div>
                )}
              </button>
              {i < journey.length - 1 && (
                /* Two segments of rail carry the eye to the next node. */
                <div className="flex items-center gap-[3px] px-0.5" aria-hidden>
                  <span className="h-[3px] w-2 rounded-full bg-matrix-400/40 shadow-[0_0_7px_-1px_rgba(51,255,102,.8)]" />
                  <span className="h-[3px] w-3 rounded-full bg-matrix-400/75 shadow-[0_0_8px_-1px_rgba(51,255,102,.9)]" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
