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
import { NeonButton, DecoPanel } from '@/components/vice/vice-ui'

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
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-gold-400">Live Console</div>
        <h1 className="display text-3xl italic text-white">Proof of Promise, end to end</h1>
        <p className="max-w-2xl text-night-200">
          Observe a public purchase journey, compile a tamper-evident Deal Contract, break the extraction with a
          simulated redesign, heal it with a verified repair, then diff the promise over time.
        </p>
      </header>

      {/* URL bar */}
      <div className="deco-panel flex flex-wrap items-center gap-3 p-4" style={{ ['--deco-accent' as string]: '#2de2e6' }}>
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-[2px] border border-aqua-400/25 bg-black/50 px-3 py-2.5 shadow-[inset_0_0_20px_-12px_rgba(45,226,230,.9)]">
          <Link2 size={15} className="shrink-0 text-aqua-400" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-transparent font-mono text-sm text-night-100 outline-none placeholder:text-night-400"
            placeholder="https://…"
          />
        </div>
        <NeonButton onClick={reset} disabled={!!busy} tone="chrome" size="md">
          {busy === 'reset' ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Reset
        </NeonButton>
      </div>

      {/* Guided steps */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionButton
          n={1}
          label="Observe journey"
          hint="Compile Deal Contract + evidence"
          icon={Play}
          tone="gold"
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
          tone="blood"
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
          tone="mint"
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
          tone="aqua"
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

/** Each step is its own little marquee: dark until it fires, then the tube holds. */
const TONES = {
  gold: { accent: '#ffc23c', text: 'text-gold-300' },
  blood: { accent: '#ff2d5e', text: 'text-blood-300' },
  mint: { accent: '#35f39a', text: 'text-mint-300' },
  aqua: { accent: '#2de2e6', text: 'text-aqua-300' },
} as const

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
      style={{
        ['--deco-accent' as string]: t.accent,
        borderColor: done ? t.accent : undefined,
        boxShadow: done ? `0 0 26px -14px ${t.accent}, inset 0 1px 0 rgba(255,255,255,.1)` : undefined,
      }}
      className="deco-panel deco-lift group p-4 text-left disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${t.text}`}>Step {n}</span>
        <span
          className="grid h-8 w-8 place-items-center rounded-[2px] border transition-all duration-500"
          style={{
            borderColor: t.accent,
            color: done ? '#0a0510' : t.accent,
            background: done ? t.accent : 'rgba(0,0,0,.45)',
            boxShadow: done ? `0 0 18px -4px ${t.accent}` : `inset 0 0 16px -8px ${t.accent}`,
          }}
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
        </span>
      </div>
      <div className="display text-sm italic text-white">{label}</div>
      <div className="mt-0.5 text-xs text-night-300">{hint}</div>
    </button>
  )
}

function EmptyState({ onStart, busy }: { onStart: () => void; busy: boolean }) {
  return (
    <DecoPanel tone="gold" tilt={false} className="p-12 text-center">
      <div className="sun-disc mx-auto mb-5 grid h-14 w-14 place-items-center text-[#2b0716]">
        <Play size={22} />
      </div>
      <h3 className="display text-lg italic text-white">Start the demo</h3>
      <p className="mx-auto mb-6 mt-1.5 max-w-md text-sm text-night-200">
        Run <span className="font-mono text-gold-300">Observe journey</span> to compile the first Deal Contract with
        tamper-evident evidence for every claim.
      </p>
      <NeonButton onClick={onStart} disabled={busy} tone="gold" size="lg" variant="solid">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Observe journey
      </NeonButton>
    </DecoPanel>
  )
}
