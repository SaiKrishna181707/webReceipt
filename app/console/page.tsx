'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Play, Zap, Wrench, GitCompare, RotateCcw, Loader2, Link2, Check, Terminal, Globe2 } from 'lucide-react'
import { api, money } from '@/lib/api'
import type { ObservationResult, DiffResult, Evidence, WebReceiptEvent, JourneyStep } from '@/lib/types'
import { JourneyReplay } from '@/components/product/journey-replay'
import { DealContractCard } from '@/components/product/deal-contract-card'
import { IntegrityPanel } from '@/components/product/integrity-panel'
import { AnomaliesPanel } from '@/components/product/anomalies-panel'
import { HealConsole } from '@/components/product/heal-console'
import { PromiseDiff } from '@/components/product/promise-diff'
import { EventLog } from '@/components/product/event-log'
import { EvidenceDrawer } from '@/components/product/evidence-drawer'
import { SystemButton, MatrixPanel, Kicker, SystemStatus, SystemRail, matrixTones, type MatrixTone } from '@/components/matrix/matrix-ui'

const WEBSITE_REDESIGN = 'wrong-valid-total'
const CONTROLLED_COLLECTOR_ID = 'c_webreceipt_demo'

type Phase = 'idle' | 'observed' | 'broken' | 'healed'

export default function ConsolePage() {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<ObservationResult | null>(null)
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

  const observe = () => {
    if (!url.trim()) {
      toast.error('Enter a public URL first')
      return
    }
    return run('observe', async () => {
      const r = await api.observe({ targetUrl: url, mutation: 'healthy', autoHeal: false })
      setResult(r)
      setDiff(null)
      setPhase('observed')
      if (r.contract) toast.success('Commerce journey observed — Deal Contract compiled')
      else toast.success('Public product offer observed — checkout was not fabricated')
    })
  }

  const breakIt = () =>
    run('break', async () => {
      const r = await api.observe({ targetUrl: url, mutation: WEBSITE_REDESIGN, autoHeal: false })
      setResult(r)
      setPhase('broken')
      toast.error('Controlled replay changed semantic meaning while the selector still returned a valid value')
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
      setUrl('')
      toast.success('Engine state cleared')
    })

  const contract = result?.contract ?? null
  const productResult = result?.contract === null ? result : null

  const openEvidenceForStep = (step: JourneyStep) => {
    if (!contract || !step.evidenceId) return
    const e = contract.evidence.find((x) => x.id === step.evidenceId)
    if (e) setEvidence(e)
  }

  const finalState = busy === 'heal' ? 'healing' : phase === 'broken' ? 'failed' : 'ok'
  const totalEvidence = contract?.evidence.find((item) => item.field === 'checkout.finalTotal') ?? null
  const productPriceEvidence = productResult?.observation.evidence.find((item) => item.field === 'commercial.productPrice') ?? null
  const traceEvidence = totalEvidence ?? productPriceEvidence
  const isControlledDemo = contract?.collector.id === CONTROLLED_COLLECTOR_ID
  const semanticControlsEnabled = isControlledDemo === true
  const isPartial = Boolean(productResult)

  const statusValue = busy
    ? 'Executing'
    : phase === 'broken'
      ? 'Integrity failure'
      : isPartial
        ? 'Offer observed'
        : phase === 'idle'
          ? 'Awaiting URL'
          : 'Contract sealed'
  const statusTone: MatrixTone = phase === 'broken' && !busy ? 'alarm' : busy ? 'warn' : isPartial ? 'data' : 'matrix'

  const observedSource = contract?.targetUrl ?? productResult?.observation.targetUrl ?? url
  const collectorId = contract?.collector.id ?? productResult?.observation.collectorId ?? '—'
  const observedField = totalEvidence ? 'checkout.finalTotal' : productPriceEvidence ? 'commercial.productPrice' : '—'

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-10 sm:px-6 lg:px-8">
      <header>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Kicker tone="matrix">Console</Kicker>
          <SystemRail count={5} className="opacity-70" />
          <SystemStatus label="State" value={statusValue} tone={statusTone} />
        </div>
        <h1 className="mt-3 font-mono text-[22px] font-semibold uppercase tracking-[0.04em] text-void-100 sm:text-[26px]">
          <span className="sys-prompt">Observe any public commerce URL</span>
        </h1>
        <p className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-void-200">
          Paste a public product or commerce URL. WebReceipt extracts the commercial meaning it can actually prove,
          attaches provenance, and refuses to invent checkout totals that were never observed. A complete checkout can
          become a sealed Deal Contract; an offer-only product page stays clearly marked as a partial observation.
        </p>
        <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-void-400">
          Real URLs are read-only observations · controlled drift and repair controls activate only on the WebReceipt replay target
        </p>
      </header>

      <div className="terminal">
        <div className="terminal-bar">
          <Terminal size={12} className="text-matrix-400" aria-hidden />
          <span className="sys-label flex-1">public target</span>
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
              placeholder="https://store.example.com/product/..."
            />
          </label>
          <SystemButton onClick={reset} disabled={!!busy} tone="void" size="md">
            {busy === 'reset' ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <RotateCcw size={14} aria-hidden />} Reset
          </SystemButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionButton
          n={1}
          label="Observe URL"
          hint="Extract only what the page proves"
          icon={Globe2}
          tone="phosphor"
          onClick={observe}
          busy={busy === 'observe'}
          done={phase !== 'idle'}
          disabled={!!busy || !url.trim()}
        />
        <ActionButton
          n={2}
          label="Replay semantic drift"
          hint="Controlled WebReceipt target only"
          icon={Zap}
          tone="alarm"
          onClick={breakIt}
          busy={busy === 'break'}
          done={phase === 'broken' || phase === 'healed'}
          disabled={!!busy || phase === 'idle' || !semanticControlsEnabled}
        />
        <ActionButton
          n={3}
          label="Verify repair"
          hint="Preview → checks → approve → rerun"
          icon={Wrench}
          tone="matrix"
          onClick={heal}
          busy={busy === 'heal'}
          done={phase === 'healed'}
          disabled={!!busy || phase !== 'broken' || !semanticControlsEnabled}
        />
        <ActionButton
          n={4}
          label="Promise Diff"
          hint="Compare sealed contract history"
          icon={GitCompare}
          tone="data"
          onClick={runDiff}
          busy={busy === 'diff'}
          done={!!diff}
          disabled={!!busy || phase === 'idle' || !semanticControlsEnabled}
        />
      </div>

      {result && (
        <MatrixPanel tone={phase === 'broken' ? 'alarm' : isPartial ? 'data' : 'data'} className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <Kicker tone={phase === 'broken' ? 'alarm' : 'data'}>Source trace</Kicker>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-void-400">
              Read directly from the observation provenance
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TraceCell label="Observed source" value={observedSource} />
            <TraceCell label="Collector" value={collectorId} />
            <TraceCell label="Observed field" value={observedField} />
            <TraceCell label="Captured text" value={traceEvidence?.capturedText ?? '—'} alarm={phase === 'broken'} />
          </div>
        </MatrixPanel>
      )}

      {!result ? (
        <EmptyState onStart={observe} busy={!!busy} canStart={Boolean(url.trim())} />
      ) : contract ? (
        <div className="grid items-start gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <JourneyReplay
              journey={contract.journey}
              currency={contract.checkout.finalTotal.currency}
              finalState={finalState}
              onStepClick={openEvidenceForStep}
            />
            <DealContractCard contract={contract} onEvidence={setEvidence} />
            {result.anomalies.length > 0 && <AnomaliesPanel anomalies={result.anomalies} />}
            {result.repair && <HealConsole repair={result.repair} healed={result.healed} />}
            {diff && <PromiseDiff diff={diff} />}
          </div>

          <aside className="space-y-6 xl:col-span-1 xl:sticky xl:top-20">
            <IntegrityPanel integrity={result.integrity} />
            <EventLog events={events} />
          </aside>
        </div>
      ) : productResult ? (
        <div className="grid items-start gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ProductObservationCard result={productResult} />
          </div>
          <aside className="space-y-6 xl:col-span-1 xl:sticky xl:top-20">
            <IntegrityPanel integrity={productResult.integrity} />
            <EventLog events={events} />
          </aside>
        </div>
      ) : null}

      <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />
    </div>
  )
}

function ProductObservationCard({ result }: { result: Extract<ObservationResult, { contract: null }> }) {
  const observation = result.observation
  const priceEvidence = observation.evidence.find((item) => item.field === 'commercial.productPrice')
  const product = observation.product

  return (
    <MatrixPanel tone="data" className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Kicker tone="data">Live product observation</Kicker>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-warn-300">Offer only · not sealed</span>
      </div>
      <h2 className="mt-4 text-[24px] font-semibold leading-tight text-void-100">{observation.subject}</h2>
      <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-void-200">
        WebReceipt found a semantically credible public product price and kept its source evidence. This page did not
        prove a final checkout amount, so WebReceipt intentionally did not copy the offer price into a fake final total.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TraceCell label="Product price" value={money(observation.commercial.productPrice, observation.commercial.currency)} />
        <TraceCell label="Currency" value={observation.commercial.currency} />
        <TraceCell label="Collector version" value={observation.collectorVersion ?? observation.collectorId} />
        {product.brand && <TraceCell label="Brand" value={product.brand} />}
        {product.model && <TraceCell label="Model" value={product.model} />}
        {product.sku && <TraceCell label="SKU" value={product.sku} />}
      </div>

      <div className="mt-5 rounded-[2px] border border-data-400/20 bg-black/45 p-4">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-void-400">Price evidence</div>
        <div className="mt-2 text-[13px] text-void-100">{priceEvidence?.capturedText ?? 'Captured from public product page'}</div>
        <div className="mt-2 break-all font-mono text-[10.5px] text-void-400">{priceEvidence?.sourceUrl ?? observation.targetUrl}</div>
      </div>
    </MatrixPanel>
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
          {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : done ? <Check size={15} aria-hidden /> : <Icon size={15} aria-hidden />}
        </span>
      </div>
      <div className="font-mono text-[12.5px] uppercase tracking-[0.08em] text-void-100">{label}</div>
      <div className="mt-1 text-[12px] text-void-300">{hint}</div>
    </button>
  )
}

function EmptyState({ onStart, busy, canStart }: { onStart: () => void; busy: boolean; canStart: boolean }) {
  return (
    <MatrixPanel tone="matrix" className="p-12 text-center">
      <div className="sun-disc mx-auto mb-5 grid h-14 w-14 place-items-center text-matrix-300">
        <Globe2 size={20} aria-hidden />
      </div>
      <h3 className="font-mono text-[15px] uppercase tracking-[0.12em] text-void-100">Ready for a public URL</h3>
      <p className="mx-auto mb-6 mt-2 max-w-md text-[13.5px] leading-relaxed text-void-200">
        Paste a product or commerce URL above. WebReceipt will return a sealed contract only when the page actually
        provides checkout evidence; otherwise you will see a truthful offer-only observation.
      </p>
      <SystemButton onClick={onStart} disabled={busy || !canStart} tone="matrix" size="lg" variant="solid">
        {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Globe2 size={16} aria-hidden />} Observe URL
      </SystemButton>
    </MatrixPanel>
  )
}
