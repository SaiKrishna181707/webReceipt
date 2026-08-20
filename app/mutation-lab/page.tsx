'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { FlaskConical, Play, Loader2, Check, X, ShieldCheck, Activity } from 'lucide-react'
import { api } from '@/lib/api'
import type { StressRun, StressResult } from '@/lib/types'

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
      <header className="space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-rose-400">Mutation Lab</div>
        <h1 className="text-3xl font-bold text-white">Chaos Checkout</h1>
        <p className="text-plate-200 max-w-2xl">
          Fire structural and semantic mutations at the collector and watch the Contract Integrity Engine. A robust
          extractor should survive cosmetic changes; the mutations that alter the economics must be caught, verified,
          and healed — never silently accepted.
        </p>
      </header>

      {/* Mutation selection */}
      <div className="glass-card rounded-[8px] border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-sm font-mono uppercase tracking-wider text-plate-200 flex items-center gap-2">
            <FlaskConical size={15} /> Mutations ({selected.length}/{MUTATIONS.length})
          </h2>
          <button
            onClick={runSuite}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-[6px] bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium px-5 py-2.5 transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Run Chaos Suite
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {MUTATIONS.map((m) => {
            const on = selected.includes(m.id)
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`text-left rounded-[6px] border p-3 transition-all ${
                  on ? 'bg-white/[0.05] border-white/20' : 'bg-white/[0.01] border-white/10 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{m.label}</span>
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      on ? 'bg-stud-500 border-stud-500' : 'border-white/20'
                    }`}
                  >
                    {on && <Check size={11} className="text-white" />}
                  </span>
                </div>
                <div className="text-xs text-plate-300 mt-1 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${m.breaks ? 'bg-rose-500' : 'bg-lime-500'}`} />
                  {m.blurb}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Results */}
      {run && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Resilience" value={`${resilience}%`} tone="lime" icon={ShieldCheck} />
            <Stat label="Detected failures" value={`${run.detected}/${run.total}`} tone="rose" icon={Activity} />
            <Stat label="Previews verified" value={`${run.previewVerified}`} tone="azure" icon={Check} />
            <Stat label="Duration" value={`${run.durationMs} ms`} tone="stud" icon={Activity} />
          </div>

          <div className="glass-card rounded-[8px] border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 text-sm font-mono uppercase tracking-wider text-plate-200">
              Per-mutation outcome
            </div>
            <ul className="divide-y divide-white/5">
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

const TONE: Record<string, string> = {
  lime: 'text-lime-400 border-lime-500/30 bg-lime-500/[0.06]',
  rose: 'text-rose-400 border-rose-500/30 bg-rose-500/[0.06]',
  azure: 'text-azure-400 border-azure-500/30 bg-azure-500/[0.06]',
  stud: 'text-stud-400 border-stud-500/30 bg-stud-500/[0.06]',
}

function Stat({ label, value, tone, icon: Icon }: { label: string; value: string; tone: string; icon: typeof Check }) {
  return (
    <div className={`rounded-[8px] border p-4 ${TONE[tone]}`}>
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider opacity-80">
        <Icon size={12} /> {label}
      </div>
      <div className="text-2xl font-bold font-mono text-white mt-1">{value}</div>
    </div>
  )
}

function labelFor(id: string) {
  return MUTATIONS.find((m) => m.id === id)?.label ?? id
}

function ResultRow({ result }: { result: StressResult }) {
  const status = result.initiallyValid
    ? { text: 'Survived', cls: 'text-lime-400 bg-lime-500/10 border-lime-500/30', icon: Check }
    : result.healed
      ? { text: 'Detected → Healed', cls: 'text-lime-400 bg-lime-500/10 border-lime-500/30', icon: ShieldCheck }
      : result.rejected
        ? { text: 'Detected → Rejected', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/30', icon: X }
        : { text: 'Detected → Unresolved', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/30', icon: X }
  const Icon = status.icon

  return (
    <li className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <div className="text-sm font-medium text-white">{labelFor(result.mutation)}</div>
        {result.failedChecks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {result.failedChecks.map((c) => (
              <span key={c} className="text-[10px] font-mono text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-3 py-1 ${status.cls}`}>
        <Icon size={12} /> {status.text}
      </span>
    </li>
  )
}
