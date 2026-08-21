'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { FlaskConical, Play, Loader2, Check, X, ShieldCheck, Activity } from 'lucide-react'
import { api } from '@/lib/api'
import type { StressRun, StressResult } from '@/lib/types'
import { NeonButton, DecoPanel, TubeRail } from '@/components/vice/vice-ui'

const MUTATIONS: { id: string; label: string; blurb: string; breaks: boolean }[] = [
  { id: 'css-rename', label: 'CSS class rename', blurb: 'Selectors renamed, values unchanged', breaks: false },
  { id: 'dom-relocation', label: 'DOM relocation', blurb: 'Price nodes moved in the tree', breaks: false },
  { id: 'split-price-nodes', label: 'Split price nodes', blurb: 'Total split across spans', breaks: false },
  { id: 'currency-format', label: 'Currency reformat', blurb: 'Locale / formatting change', breaks: false },
  { id: 'wrong-valid-total', label: 'Wrong-but-valid total', blurb: 'Plausible but incorrect total', breaks: true },
  { id: 'new-mandatory-fee', label: 'New mandatory fee', blurb: 'Surprise required charge added', breaks: true },
  { id: 'missing-evidence', label: 'Missing evidence', blurb: 'Critical field loses provenance', breaks: true },
]

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
      <header className="space-y-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-blood-400">Mutation Lab</div>
        <h1 className="display text-3xl italic text-white">Chaos Checkout</h1>
        <TubeRail count={10} tone="blood" />
        <p className="max-w-2xl text-night-200">
          Fire structural and semantic mutations at the collector and watch the Contract Integrity Engine. A robust
          extractor should survive cosmetic changes; the mutations that alter the economics must be caught, verified,
          and healed — never silently accepted.
        </p>
      </header>

      {/* Mutation selection — the switchboard */}
      <DecoPanel tone="blood" tilt={false} className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.22em] text-night-200">
            <FlaskConical size={15} className="text-blood-400" /> Mutations ({selected.length}/{MUTATIONS.length})
          </h2>
          <NeonButton onClick={runSuite} disabled={busy} tone="blood" size="md" variant="solid">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Run Chaos Suite
          </NeonButton>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MUTATIONS.map((m) => {
            const on = selected.includes(m.id)
            const tube = m.breaks ? '#ff2d5e' : '#35f39a'
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                aria-pressed={on}
                style={{
                  borderColor: on ? tube : 'rgba(255,255,255,.1)',
                  boxShadow: on ? `inset 0 0 22px -14px ${tube}, 0 0 16px -10px ${tube}` : undefined,
                }}
                className={`rounded-[2px] border bg-black/40 p-3 text-left transition-all ${
                  on ? '' : 'opacity-55 hover:opacity-85'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">{m.label}</span>
                  {/* A tube either strikes or it doesn't. */}
                  <span
                    className="grid h-4 w-4 shrink-0 place-items-center rounded-[1px] border transition-all"
                    style={{
                      borderColor: on ? tube : 'rgba(255,255,255,.22)',
                      background: on ? tube : 'transparent',
                      boxShadow: on ? `0 0 12px -2px ${tube}` : undefined,
                    }}
                  >
                    {on && <Check size={11} className="text-[#0a0510]" />}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-night-300">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: tube, boxShadow: `0 0 8px ${tube}` }}
                  />
                  {m.blurb}
                </div>
              </button>
            )
          })}
        </div>
      </DecoPanel>

      {/* Results */}
      {run && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Resilience" value={`${resilience}%`} tone="mint" icon={ShieldCheck} meter={resilience} />
            <Stat
              label="Detected failures"
              value={`${run.detected}/${run.total}`}
              tone="blood"
              icon={Activity}
              meter={Math.round((run.detected / Math.max(1, run.total)) * 100)}
            />
            <Stat
              label="Previews verified"
              value={`${run.previewVerified}`}
              tone="aqua"
              icon={Check}
              meter={Math.round((run.previewVerified / Math.max(1, run.total)) * 100)}
            />
            <Stat label="Duration" value={`${run.durationMs} ms`} tone="gold" icon={Activity} />
          </div>

          <DecoPanel tone="aqua" tilt={false} corner={false} className="overflow-hidden">
            <div className="border-b border-white/10 px-6 py-4 font-mono text-[12px] uppercase tracking-[0.22em] text-night-200">
              Per-mutation outcome
            </div>
            <ul className="divide-y divide-white/5">
              {run.results.map((r) => (
                <ResultRow key={r.mutation} result={r} />
              ))}
            </ul>
          </DecoPanel>
        </div>
      )}
    </div>
  )
}

const TONE: Record<string, string> = {
  mint: '#35f39a',
  blood: '#ff2d5e',
  aqua: '#2de2e6',
  gold: '#ffc23c',
}

function Stat({
  label,
  value,
  tone,
  icon: Icon,
  meter,
}: {
  label: string
  value: string
  tone: keyof typeof TONE | string
  icon: typeof Check
  meter?: number
}) {
  const c = TONE[tone] ?? TONE.gold
  return (
    <div
      className="rounded-[2px] border bg-black/45 p-4"
      style={{ borderColor: `${c}55`, boxShadow: `inset 0 0 26px -18px ${c}` }}
    >
      <div
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]"
        style={{ color: c, textShadow: `0 0 10px ${c}88` }}
      >
        <Icon size={12} /> {label}
      </div>
      <div className="display mt-1 text-2xl italic text-white">{value}</div>
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
    ? { text: 'Survived', c: '#35f39a', icon: Check }
    : result.healed
      ? { text: 'Detected → Healed', c: '#35f39a', icon: ShieldCheck }
      : result.rejected
        ? { text: 'Detected → Rejected', c: '#ff2d5e', icon: X }
        : { text: 'Detected → Unresolved', c: '#ff2d5e', icon: X }
  const Icon = status.icon

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-white">{labelFor(result.mutation)}</div>
        {result.failedChecks.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {result.failedChecks.map((c) => (
              <span
                key={c}
                className="rounded-[1px] border border-blood-500/30 bg-blood-500/10 px-1.5 py-0.5 font-mono text-[10px] text-blood-300"
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
        <Icon size={12} /> {status.text}
      </span>
    </li>
  )
}
