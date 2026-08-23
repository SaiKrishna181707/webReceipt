'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Play, Zap, Wrench, GitCompare, RotateCcw, Loader2, Link2, Check, Terminal } from 'lucide-react'
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
import { SystemButton, MatrixPanel, Kicker, SystemStatus, SystemRail, matrixTones, type MatrixTone } from '@/components/matrix/matrix-ui'

const DEMO_URL = 'https://web-receipt-tawny.vercel.app/fixture/product?version=v1'
const WEBSITE_REDESIGN = 'wrong-valid-total'

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
      toast.success('Nike Fixture V1 observed — ₹13,499 Deal Contract compiled')
    })

  const breakIt = () =>
    run('break', async () => {
      const r = await api.observe({ targetUrl: url, mutation: WEBSITE_REDESIGN, autoHeal: false })
      setResult(r)
      setPhase('broken')
      toast.error('Website V2 changed meaning — .total-price now returns the ₹12,999 product price')
    })

  const heal = () =>
    run('heal', async () => {
      const r = await api.heal({ targetUrl: url, mutation: WEBSITE_REDESIGN })
      setResult(r)
      setPhase('healed')
      toast.success('Repair verified, approved, and confirmed by a fresh scrape')
    })

  const runDiff = () =>
    run('diff', async () => {
      const d = await api.diff({ simulate: true, targetUrl: url })
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
  const totalEvidence = result?.contract.evidence.find((item) => item.field === 'checkout.finalTotal') ?? null
  const fixtureVersion = phase === 'broken' || phase === 'healed' ? 'Nike product · Fixture V2' : 'Nike product · Fixture V1'

  /** What the console reports about itself, driven by real state — not decoration. */
  const statusValue =
    busy ? 'Executing' : phase === 'broken' ? 'Integrity failure' : phase === 'idle' ? 'Awaiting command' : 'Contract sealed'
  const statusTone: MatrixTone = phase === 'broken' && !busy ? 'alarm' : busy ? 'warn' : 'matrix'

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-10 sm:px-6 lg:px-8">
      {/* ==================================================================
          HEADER
          ================================================================== */}
      <header>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Kicker tone="matrix">Console</Kicker>
          <SystemRail count={5} className="opacity-70" />
          <SystemStatus label="State" value={statusValue} tone={statusTone} />
        </div>
        <h1 className="mt-3 font-mono text-[22px] font-semibold uppercase tracking-[0.04em] text-void-100 sm:text-[26px]">
          <span className="sys-prompt">Nike product semantic drift, end to end</span>
        </h1>
        <p className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-void-200">
          Fixture V1 is a controlled Nike Pegasus 41 product journey: product price ₹12,999 plus ₹500 shipping equals
          a ₹13,499 final total. Then the website redesigns to Fixture V2 while the scraper keeps the same
          <span className="font-mono text-void-100"> .total-price</span> selector. That selector still returns a valid
          ₹12,999 number — but it now means <span className="font-semibold text-void-100">product price</span>, while the
          real final total moved to <span className="font-mono text-void-100">[data-testid=&quot;order-total&quot;]</span>. WebReceipt
          catches the semantic contradiction, verifies the repair preview, approves it, and trusts the result only after a fresh scrape passes again.
        </p>
        <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-void-400">
          Deterministic controlled-product replay · wrong values come from changed markup, never field injection
        </p>
      </header>

      {/* ==================================================================
          COMMAND LINE
          ================================================================== */}
      <div className="terminal">
        <div className="terminal-bar">
          <Terminal size={12} className="text-matrix-400" aria-hidden />
          <span className="sys-label flex-1">target</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-[2px] border border-data-400/25 bg-black/60 px-3 py-2.5 focus-within:border-data-400/70">
            <Link2 size={15} className="shrink-0 text-data-400" aria-hidden />
            <span className="sr-only">Target URL</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              spellCheck={false}
              className="flex-1 bg-transparent font-mono text-[13px] text-void-100 outline-none placeholder:text-void-400"
              placeholder="https://…"
            />
          </label>
          <SystemButton onClick={reset} disabled={!!busy} tone="void" size="md">
            {busy === 'reset' ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : (
              <RotateCcw size={14} aria-hidden />
            )}{' '}
            Reset
          </SystemButton>
        </div>
      </div>

      {/* ==================================================================
          COMMAND KEYS
          ================================================================== */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionButton
          n={1}
          label="Observe Nike V1"
          hint="₹12,999 + ₹500 = ₹13,499"
          icon={Play}
          tone="phosphor"
          onClick={observe}
          busy={busy === 'observe'}
          done={phase !== 'idle'}
          disabled={!!busy}
        />
        <ActionButton
          n={2}
          label="Redesign the product page"
          hint=".total-price now means product price"
          icon={Zap}
          tone="alarm"
          onClick={breakIt}
          busy={busy === 'break'}
          done={phase === 'broken' || phase === 'healed'}
          disabled={!!busy || phase === 'idle'}
        />
        <ActionButton
          n={3}
          label="Repair the scraper"
          hint="Preview → 11/11 → approve → rerun"
          icon={Wrench}
          tone="matrix"
          onClick={heal}
          busy={busy === 'heal'}
          done={phase === 'healed'}
          disabled={!!busy || phase !== 'broken'}
        />
        <ActionButton
          n={4}
          label="Promise Diff"
          hint="Diff the product promise over time"
          icon={GitCompare}
          tone="data"
          onClick={runDiff}
          busy={busy === 'diff'}
          done={!!diff}
          disabled={!!busy || phase === 'idle'}
        />
      </div>

      {result && (
        <MatrixPanel tone={phase === 'broken' ? 'alarm' : 'data'} className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <Kicker tone={phase === 'broken' ? 'alarm' : 'data'}>Source trace</Kicker>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-void-400">
              Read directly from the compiled evidence
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TraceCell label="Product fixture" value={fixtureVersion} />
            <TraceCell label="Collector ID" value={result.contract.collector.id} />
            <TraceCell label="Final-total selector" value={totalEvidence?.domPath ?? '—'} />
            <TraceCell label="Captured text" value={totalEvidence?.capturedText ?? '—'} alarm={phase === 'broken'} />
          </div>
        </MatrixPanel>
      )}

      {/* ==================================================================
          RESULTS
          ================================================================== */}
      {!result ? (
        <EmptyState onStart={observe} busy={!!busy} />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
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

          <aside className="space-y-6 xl:col-span-1 xl:sticky xl:top-20">
            <IntegrityPanel integrity={result.integrity} />
            <EventLog events={events} />
          </aside>
        </div>
      )}

      <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />
    </div>
  )
}

function TraceCell({ label, value, alarm = false }: { label: string; value: string; alarm?: boolean }) {
  return (
    <div className="rounded-[2px] border border-matrix-400/12 bg-black/45 px-3 py-2.5">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-void-400">{label}</div>
      <div className={`mt-1 break-words font-mono text-[11.5px] ${alarm ? 'text-alarm-300' : 'text-void-100'}`}>
        {value}
      </div>
    </div>
  )
}

/**
 * A command key. Unlit until it has run; the indicator fills and turns to a
 * check once it has. State comes from the real phase, so the interface can't
 * claim a step succeeded when it didn't.
 */
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
  tone: MatrixTone
  onClick: () => void
  busy: boolean
  done: boolean
  disabled: boolean
}) {
  const accent = matrixTones[tone].line
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={done}
      style={{
        ['--accent' as string]: accent,
        ['--deco-accent' as string]: accent,
        borderColor: done ? accent : undefined,
        boxShadow: done ? `0 0 26px -16px ${accent}, inset 0 1px 0 rgba(51,255,102,.12)` : undefined,
      }}
      className="panel panel-rail panel-lift group p-4 text-left disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: accent }}>
          Step {n}
        </span>
        <span
          className="grid h-8 w-8 place-items-center rounded-[2px] border transition-all duration-500"
          style={{
            borderColor: accent,
            color: done ? '#000' : accent,
            background: done ? accent : 'rgba(0,0,0,.55)',
            boxShadow: done ? `0 0 18px -6px ${accent}` : `inset 0 0 16px -9px ${accent}`,
          }}
        >
          {busy ? (
            <Loader2 size={15} className="animate-spin" aria-hidden />
          ) : done ? (
            <Check size={15} aria-hidden />
          ) : (
            <Icon size={15} aria-hidden />
          )}
        </span>
      </div>
      <div className="font-mono text-[12.5px] uppercase tracking-[0.08em] text-void-100">{label}</div>
      <div className="mt-1 text-[12px] text-void-300">{hint}</div>
    </button>
  )
}

function EmptyState({ onStart, busy }: { onStart: () => void; busy: boolean }) {
  return (
    <MatrixPanel tone="matrix" className="p-12 text-center">
      <div className="sun-disc mx-auto mb-5 grid h-14 w-14 place-items-center text-matrix-300">
        <Play size={20} aria-hidden />
      </div>
      <h3 className="font-mono text-[15px] uppercase tracking-[0.12em] text-void-100">Awaiting command</h3>
      <p className="mx-auto mb-6 mt-2 max-w-md text-[13.5px] leading-relaxed text-void-200">
        Run <span className="font-mono text-matrix-300">Observe Nike V1</span> to compile the ₹13,499 Deal Contract for
        the controlled Pegasus 41 journey with tamper-evident evidence for every claim.
      </p>
      <SystemButton onClick={onStart} disabled={busy} tone="matrix" size="lg" variant="solid">
        {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Play size={16} aria-hidden />} Observe
        Nike V1
      </SystemButton>
    </MatrixPanel>
  )
}
