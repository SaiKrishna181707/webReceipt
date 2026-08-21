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

/* The journey is a row of motel signs down one block: each shows the price it
   was advertising at the time, and the last one is the sign that lies. */

const OK = '#ffc23c'
const FAILED = '#ff2d5e'
const HEALING = '#ff7418'

export function JourneyReplay({ journey, currency, finalState = 'ok', onStepClick }: JourneyReplayProps) {
  if (!journey.length) return null

  const first = journey[0].displayedPrice.amount
  const last = journey[journey.length - 1].displayedPrice.amount
  const delta = last - first
  const ratio = first > 0 ? delta / first : 0

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-[12px] uppercase tracking-[0.24em] text-night-200">Journey Replay</h2>
        {delta > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-blood-500/45 bg-blood-500/10 px-3 py-1 font-mono text-xs font-bold text-blood-300 shadow-[0_0_18px_-8px_#ff2d5e] [text-shadow:0_0_9px_rgba(255,45,94,.6)]">
            <ArrowUpRight size={13} />
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
                  borderColor: hot ? tube : 'rgba(255,255,255,.1)',
                  background: hot ? `${tube}12` : 'rgba(255,255,255,.03)',
                  boxShadow: hot
                    ? `0 0 26px -8px ${tube}, inset 0 0 26px -16px ${tube}`
                    : 'inset 0 1px 0 rgba(255,255,255,.06)',
                }}
                className="group w-40 rounded-[2px] border p-4 text-left transition-all hover:border-gold-400/60"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-gold-400">
                    {String(step.index).padStart(2, '0')} · {step.label}
                  </span>
                  {/* Bulb: steady when the sign is honest, flashing when it isn't */}
                  <span
                    className={`h-2 w-2 rounded-full ${
                      state === 'failed' ? 'animate-ping' : state === 'healing' ? 'animate-pulse' : ''
                    }`}
                    style={{ background: hot ? tube : '#35f39a', boxShadow: `0 0 9px ${hot ? tube : '#35f39a'}` }}
                  />
                </div>
                <div
                  className="display text-xl italic"
                  style={
                    state === 'failed'
                      ? { color: FAILED, textShadow: `0 0 12px ${FAILED}88` }
                      : raised
                        ? { color: '#fff', textShadow: '0 0 14px rgba(255,255,255,.35)' }
                        : { color: '#dcd6f2' }
                  }
                >
                  {money(step.displayedPrice.amount, step.displayedPrice.currency)}
                </div>
                {step.evidenceId && (
                  <div className="mt-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-night-300 transition-colors group-hover:text-gold-200">
                    View evidence <ChevronRight size={11} />
                  </div>
                )}
              </button>
              {i < journey.length - 1 && (
                /* Two blocks of tube carry the eye to the next sign */
                <div className="flex items-center gap-[3px] px-0.5" aria-hidden>
                  <span className="h-[3px] w-2 rounded-full bg-gold-400/45 shadow-[0_0_7px_-1px_rgba(255,194,60,.8)]" />
                  <span className="h-[3px] w-3 rounded-full bg-gold-400/80 shadow-[0_0_8px_-1px_rgba(255,194,60,.9)]" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
