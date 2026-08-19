'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Play, Zap, Wrench, GitCompare, RotateCcw, Loader2, Link2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { ObserveResult, DiffResult, Evidence, WebReceiptEvent, JourneyStep } from '@/lib/types'
import { JourneyReplay } from '@/components/product/journey-replay'
import { DealContractCard } from '@/components/product/deal-contract-card'
import { IntegrityPanel } from '@/components/product/integrity-panel'
import { AnomaliesPanel } from '@/components/product/anomalies-panel'
import { HealConsole } from '@/components/product/heal-console'
import { PromiseDiff } from '@/components/product/promise-diff'
import { EventLog } from '@/components/product/event-log'
import { EvidenceDrawer } from '@/components/product/evidence-drawer'

const DEMO_URL = 'https://demo.webreceipt.dev/hotel/ocean-house'
const MUTATION = 'wrong-valid-total'

type Phase = 'idle' | 'observed' | 'broken' | 'healed'

export default function ConsolePage() {
  const [url, setUrl] = useState(DEMO_URL)
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<ObserveResult | null>(null)
  const [diff, setDiff] = useState<DiffResult | null>(null)
  const [events, setEvents] = useState<WebReceiptEvent[]>([])
  const [evidence, setEvidence] = useState<Evidence | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const refreshEvents = useCallback(async () => {
    try {
      const s = await api.state()
      setEvents(s.events)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    refreshEvents()
  }, [refreshEvents])

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name)
    try {
      await fn()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(null)
      refreshEvents()
    }
  }

  const observe = () =>
    run('observe', async () => {
      const r = await api.observe({ targetUrl: url, mutation: 'healthy', autoHeal: false })
      setResult(r)
      setDiff(null)
      setPhase('observed')
      toast.success('Journey observed — Deal Contract compiled')
    })

  const breakIt = () =>
    run('break', async () => {
      const r = await api.observe({ targetUrl: url, mutation: MUTATION, autoHeal: false })
      setResult(r)
      setPhase('broken')
      toast.error('Contract integrity failure detected')
    })

  const heal = () =>
    run('heal', async () => {
      const r = await api.heal({ targetUrl: url, mutation: MUTATION })
      setResult(r)
      setPhase('healed')
      toast.success('Healed with a verified repair')
    })

  const runDiff = () =>
    run('diff', async () => {
      const d = await api.diff({ simulate: true })
      setDiff(d)
      toast.success(`${d.changes.length} promise changes detected`)
    })

  const reset = () =>
    run('reset', async () => {
      await api.reset()
      setResult(null)
      setDiff(null)
      setPhase('idle')
      toast.success('Engine state cleared')
    })

  const openEvidenceForStep = (step: JourneyStep) => {
    if (!result || !step.evidenceId) return
    const e = result.contract.evidence.find((x) => x.id === step.evidenceId)
    if (e) setEvidence(e)
  }

  const finalState = busy === 'heal' ? 'healing' : phase === 'broken' ? 'failed' : 'ok'

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-violet-400">Live Console</div>
        <h1 className="text-3xl font-bold text-white">Proof of Promise, end to end</h1>
        <p className="text-gray-400 max-w-2xl">
          Observe a public purchase journey, compile a tamper-evident Deal Contract, break the extraction with a
          simulated redesign, heal it with a verified repair, then diff the promise over time.
        </p>
      </header>

      {/* URL bar */}
      <div className="glass-card rounded-2xl border border-white/10 p-4 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5">
          <Link2 size={15} className="text-gray-500 shrink-0" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-transparent outline-none text-sm font-mono text-gray-200 placeholder:text-gray-600"
            placeholder="https://…"
          />
        </div>
        <button
          onClick={reset}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl px-3 py-2.5 transition-colors disabled:opacity-50"
        >
          {busy === 'reset' ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Reset
        </button>
      </div>

      {/* Guided steps */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ActionButton
          n={1}
          label="Observe journey"
          hint="Compile Deal Contract + evidence"
          icon={Play}
          tone="violet"
          onClick={observe}
          busy={busy === 'observe'}
          done={phase !== 'idle'}
          disabled={!!busy}
        />
        <ActionButton
          n={2}
          label="Simulate redesign"
          hint="Inject wrong-but-valid total"
          icon={Zap}
          tone="rose"
          onClick={breakIt}
          busy={busy === 'break'}
          done={phase === 'broken' || phase === 'healed'}
          disabled={!!busy || phase === 'idle'}
        />
        <ActionButton
          n={3}
          label="Heal with Bright Data"
          hint="Verify preview, then deploy"
          icon={Wrench}
          tone="emerald"
          onClick={heal}
          busy={busy === 'heal'}
          done={phase === 'healed'}
          disabled={!!busy || phase !== 'broken'}
        />
        <ActionButton
          n={4}
          label="Promise Diff"
          hint="Diff the promise over time"
          icon={GitCompare}
          tone="cyan"
          onClick={runDiff}
          busy={busy === 'diff'}
          done={!!diff}
          disabled={!!busy || phase === 'idle'}
        />
      </div>

      {/* Results */}
      {!result ? (
        <EmptyState onStart={observe} busy={!!busy} />
      ) : (
        <div className="grid xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2 space-y-6">
            <JourneyReplay
              journey={result.contract.journey}
              currency={result.contract.checkout.finalTotal.currency}
              finalState={finalState}
              onStepClick={openEvidenceForStep}
            />
            <DealContractCard contract={result.contract} onEvidence={setEvidence} />
            {result.anomalies.length > 0 && <AnomaliesPanel anomalies={result.anomalies} />}
            {result.repair && <HealConsole repair={result.repair} healed={result.healed} />}
            {diff && <PromiseDiff diff={diff} />}
          </div>

          <aside className="xl:col-span-1 space-y-6 xl:sticky xl:top-20">
            <IntegrityPanel integrity={result.integrity} />
            <EventLog events={events} />
          </aside>
        </div>
      )}

      <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />
    </div>
  )
}

const TONES: Record<string, { on: string; ring: string; text: string }> = {
  violet: { on: 'bg-violet-600 hover:bg-violet-500', ring: 'border-violet-500/40', text: 'text-violet-400' },
  rose: { on: 'bg-rose-600 hover:bg-rose-500', ring: 'border-rose-500/40', text: 'text-rose-400' },
  emerald: { on: 'bg-emerald-600 hover:bg-emerald-500', ring: 'border-emerald-500/40', text: 'text-emerald-400' },
  cyan: { on: 'bg-cyan-600 hover:bg-cyan-500', ring: 'border-cyan-500/40', text: 'text-cyan-400' },
}

function ActionButton({
  n,
  label,
  hint,
  icon: Icon,
  tone,
  onClick,
  busy,
  done,
  disabled,
}: {
  n: number
  label: string
  hint: string
  icon: typeof Play
  tone: keyof typeof TONES
  onClick: () => void
  busy: boolean
  done: boolean
  disabled: boolean
}) {
  const t = TONES[tone]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group text-left rounded-2xl border p-4 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
        done ? `bg-white/[0.04] ${t.ring}` : 'bg-white/[0.02] border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-mono font-bold ${t.text}`}>STEP {n}</span>
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${done ? t.on : 'bg-white/5'} text-white`}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
        </span>
      </div>
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="text-xs text-gray-500 mt-0.5">{hint}</div>
    </button>
  )
}

function EmptyState({ onStart, busy }: { onStart: () => void; busy: boolean }) {
  return (
    <div className="glass-card rounded-2xl border border-dashed border-white/15 p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto mb-4">
        <Play size={22} />
      </div>
      <h3 className="text-lg font-bold text-white">Start the demo</h3>
      <p className="text-gray-400 text-sm mt-1 mb-5 max-w-md mx-auto">
        Run <span className="font-mono text-violet-300">Observe journey</span> to compile the first Deal Contract with
        tamper-evident evidence for every claim.
      </p>
      <button
        onClick={onStart}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-3 transition-colors disabled:opacity-50"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Observe journey
      </button>
    </div>
  )
}
