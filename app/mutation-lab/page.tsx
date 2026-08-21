'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { FlaskConical, Play, Loader2, Check, X, ShieldCheck, Activity, ArrowDown } from 'lucide-react'
import { api } from '@/lib/api'
import type { StressRun, StressResult } from '@/lib/types'
import { SystemButton, MatrixPanel, Kicker, SystemRail, SystemStatus, matrixTones } from '@/components/matrix/matrix-ui'

const MUTATIONS: { id: string; label: string; blurb: string; breaks: boolean }[] = [
  { id: 'css-rename', label: 'CSS class rename', blurb: 'Selectors renamed, values unchanged', breaks: false },
  { id: 'dom-relocation', label: 'DOM relocation', blurb: 'Price nodes moved in the tree', breaks: false },
  { id: 'split-price-nodes', label: 'Split price nodes', blurb: 'Total split across spans', breaks: false },
  { id: 'currency-format', label: 'Currency reformat', blurb: 'Locale / formatting change', breaks: false },
  { id: 'wrong-valid-total', label: 'Wrong-but-valid total', blurb: 'Plausible but incorrect total', breaks: true },
  { id: 'new-mandatory-fee', label: 'New mandatory fee', blurb: 'Surprise required charge added', breaks: true },
  { id: 'missing-evidence', label: 'Missing evidence', blurb: 'Critical field loses provenance', breaks: true },
]

/** The four bands of the lab, read top to bottom. Labels only — no fake state. */
const FLOW = ['Input', 'Transformation', 'Verification', 'Result'] as const

const OK = matrixTones.matrix.line
const BAD = matrixTones.alarm.line

export default function MutationLabPage() {
  const [selected, setSelected] = useState<string[]>(MUTATIONS.map((m) => m.id))
  const [run, setRun] = useState<StressRun | null>(null)
  const [busy, setBusy] = useState(false)

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const runSuite = async () => {
    if (selected.length === 0) {
      toast.error('Select at least one mutation')
      return
    }
    setBusy(true)
    try {
      const r = await api.stress({ mutations: selected })
      setRun(r)
      toast.success(`${r.recovered}/${r.total} mutations survived or recovered`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Chaos suite failed')
    } finally {
      setBusy(false)
    }
  }

  const resilience = run ? Math.round((run.recovered / run.total) * 100) : 0

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* ==================================================================
          HEADER
          ================================================================== */}
      <header>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Kicker tone="alarm">Mutation Lab</Kicker>
          <SystemRail count={7} tone="alarm" className="opacity-70" />
          <SystemStatus
            label="System"
            value={busy ? 'Running suite' : 'Ready'}
            tone={busy ? 'warn' : 'matrix'}
          />
        </div>
        <h1 className="mt-3 font-mono text-[22px] font-semibold uppercase tracking-[0.04em] text-void-100 sm:text-[26px]">
          <span className="sys-prompt">Chaos checkout</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-void-200">
          Fire structural and semantic mutations at the collector and watch the Contract Integrity Engine. A robust
          extractor should survive cosmetic changes; the mutations that alter the economics must be caught, verified,
          and healed — never silently accepted.
        </p>

        {/* The lab flow, stated once so the panels below need no captions. */}
        <ol className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-void-300">
          {FLOW.map((f, i) => (
            <li key={f} className="flex items-center gap-3">
              <span className={i === 0 ? 'text-matrix-300' : undefined}>{f}</span>
              {i < FLOW.length - 1 && (
                <ArrowDown size={11} className="-rotate-90 text-matrix-500 sm:rotate-0" aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </header>

      {/* ==================================================================
          SWITCHBOARD — input
          ================================================================== */}
      <MatrixPanel tone="alarm" tilt={false} className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-void-200">
            <FlaskConical size={15} className="text-alarm-400" aria-hidden /> Mutations ({selected.length}/
            {MUTATIONS.length})
          </h2>
          <SystemButton onClick={runSuite} disabled={busy} tone="alarm" size="md" variant="solid">
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Play size={16} aria-hidden />} Run
            chaos suite
          </SystemButton>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MUTATIONS.map((m) => {
            const on = selected.includes(m.id)
            const accent = m.breaks ? BAD : OK
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                aria-pressed={on}
                style={{
                  borderColor: on ? accent : 'rgba(232,255,238,.1)',
                  boxShadow: on ? `inset 0 0 22px -14px ${accent}, 0 0 16px -10px ${accent}` : undefined,
                }}
                className={`rounded-[2px] border bg-black/50 p-3 text-left transition-all ${
                  on ? '' : 'opacity-55 hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-void-100">{m.label}</span>
                  {/* A channel is either armed or it isn't. */}
                  <span
                    className="grid h-4 w-4 shrink-0 place-items-center rounded-[1px] border transition-all"
                    style={{
                      borderColor: on ? accent : 'rgba(232,255,238,.22)',
                      background: on ? accent : 'transparent',
                      boxShadow: on ? `0 0 12px -2px ${accent}` : undefined,
                    }}
                  >
                    {on && <Check size={11} className="text-black" aria-hidden />}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[12px] text-void-300">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                  />
                  {m.blurb}
                </div>
              </button>
            )
          })}
        </div>
      </MatrixPanel>

      {/* ==================================================================
          READOUT — verification + result
          ================================================================== */}
      {run && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Resilience" value={`${resilience}%`} tone="matrix" icon={ShieldCheck} meter={resilience} />
            <Stat
              label="Detected failures"
              value={`${run.detected}/${run.total}`}
              tone="alarm"
              icon={Activity}
              meter={Math.round((run.detected / Math.max(1, run.total)) * 100)}
            />
            <Stat
              label="Previews verified"
              value={`${run.previewVerified}`}
              tone="data"
              icon={Check}
              meter={Math.round((run.previewVerified / Math.max(1, run.total)) * 100)}
            />
            <Stat label="Duration" value={`${run.durationMs} ms`} tone="phosphor" icon={Activity} />
          </div>

          <div className="terminal">
            <div className="terminal-bar">
              <Activity size={12} className="text-matrix-400" aria-hidden />
              <span className="sys-label flex-1">per-mutation outcome</span>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-void-400">
                {run.results.length} rows
              </span>
            </div>
            <ul className="relative z-[1] divide-y divide-matrix-400/8">
              {run.results.map((r) => (
                <ResultRow key={r.mutation} result={r} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

/** Instrument tile. One hue per reading, and the meter never exceeds 100%. */
function Stat({
  label,
  value,
  tone,
  icon: Icon,
  meter,
}: {
  label: string
  value: string
  tone: keyof typeof matrixTones
  icon: typeof Check
  meter?: number
}) {
  const c = matrixTones[tone].line
  return (
    <div
      className="rounded-[2px] border bg-black/55 p-4"
      style={{ borderColor: `${c}55`, boxShadow: `inset 0 0 26px -18px ${c}` }}
    >
      <div
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]"
        style={{ color: c, textShadow: `0 0 10px ${c}88` }}
      >
        <Icon size={12} aria-hidden /> {label}
      </div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-void-100">{value}</div>
      {meter !== undefined && (
        <div className="hud-meter mt-3" style={{ ['--meter' as string]: c }}>
          <span style={{ width: `${Math.max(0, Math.min(100, meter))}%` }} />
        </div>
      )}
    </div>
  )
}

function labelFor(id: string) {
  return MUTATIONS.find((m) => m.id === id)?.label ?? id
}

function ResultRow({ result }: { result: StressResult }) {
  const status = result.initiallyValid
    ? { text: 'Survived', c: OK, icon: Check }
    : result.healed
      ? { text: 'Detected → Healed', c: OK, icon: ShieldCheck }
      : result.rejected
        ? { text: 'Detected → Rejected', c: BAD, icon: X }
        : { text: 'Detected → Unresolved', c: BAD, icon: X }
  const Icon = status.icon

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <div className="font-mono text-[12.5px] text-void-100">{labelFor(result.mutation)}</div>
        {result.failedChecks.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {result.failedChecks.map((c) => (
              <span
                key={c}
                className="rounded-[1px] border border-alarm-500/30 bg-alarm-500/10 px-1.5 py-0.5 font-mono text-[10px] text-alarm-300"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-[2px] border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em]"
        style={{
          borderColor: status.c,
          color: status.c,
          background: `${status.c}14`,
          boxShadow: `0 0 16px -8px ${status.c}`,
          textShadow: `0 0 10px ${status.c}88`,
        }}
      >
        <Icon size={12} aria-hidden /> {status.text}
      </span>
    </li>
  )
}
