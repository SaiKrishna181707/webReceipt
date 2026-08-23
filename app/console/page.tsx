'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Play,
  Zap,
  Wrench,
  GitCompare,
  RotateCcw,
  Loader2,
  Link2,
  Check,
  Terminal,
  Globe2,
  ScanSearch,
  FileText,
  ShieldCheck,
  Archive,
  FlaskConical,
} from 'lucide-react'
import { api, money } from '@/lib/api'
import type { ObservationResult, ObserveResult, DiffResult, Evidence, WebReceiptEvent, JourneyStep } from '@/lib/types'
import { JourneyReplay } from '@/components/product/journey-replay'
import { DealContractCard } from '@/components/product/deal-contract-card'
import { IntegrityPanel } from '@/components/product/integrity-panel'
import { AnomaliesPanel } from '@/components/product/anomalies-panel'
import { HealConsole } from '@/components/product/heal-console'
import { PromiseDiff } from '@/components/product/promise-diff'
import { EventLog } from '@/components/product/event-log'
import { EvidenceDrawer } from '@/components/product/evidence-drawer'
import {
  SystemButton,
  MatrixPanel,
  Kicker,
  SystemStatus,
  SystemRail,
  matrixTones,
  type MatrixTone,
} from '@/components/matrix/matrix-ui'

const WEBSITE_REDESIGN = 'wrong-valid-total'

type LabPhase = 'idle' | 'observed' | 'broken' | 'healed'
type PipelineState = 'idle' | 'busy' | 'done' | 'partial'

function controlledLabTarget(): string {
  if (typeof window === 'undefined') throw new Error('The controlled lab target is available in the browser.')
  return new URL('/fixture/product', window.location.origin).toString()
}

function requireSealedResult(result: ObservationResult): ObserveResult {
  if (!result.contract) throw new Error('The controlled fixture did not return a sealed Deal Contract.')
  return result
}

export default function ConsolePage() {
  const [url, setUrl] = useState('')
  const [liveResult, setLiveResult] = useState<ObservationResult | null>(null)
  const [labPhase, setLabPhase] = useState<LabPhase>('idle')
  const [labResult, setLabResult] = useState<ObserveResult | null>(null)
  const [labDiff, setLabDiff] = useState<DiffResult | null>(null)
  const [events, setEvents] = useState<WebReceiptEvent[]>([])
  const [evidence, setEvidence] = useState<Evidence | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const refreshEvents = useCallback(async () => {
    try {
      const s = await api.state()
      setEvents(s.events)
    } catch {
      /* local event history is supplemental */
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

  const observeLive = () => {
    if (!url.trim()) {
      toast.error('Enter a public URL first')
      return
    }
    return run('live-observe', async () => {
      const r = await api.observe({ targetUrl: url, mutation: 'healthy', autoHeal: false })
      setLiveResult(r)
      if (r.contract) toast.success('Public journey observed — Deal Contract compiled and verified')
      else toast.success('Public product offer observed — unavailable checkout fields were not fabricated')
    })
  }

  const observeLab = () =>
    run('lab-observe', async () => {
      const r = requireSealedResult(
        await api.observe({ targetUrl: controlledLabTarget(), mutation: 'healthy', autoHeal: false }),
      )
      setLabResult(r)
      setLabDiff(null)
      setLabPhase('observed')
      toast.success('Controlled fixture V1 observed — contract is valid')
    })

  const breakLab = () =>
    run('lab-break', async () => {
      const r = requireSealedResult(
        await api.observe({ targetUrl: controlledLabTarget(), mutation: WEBSITE_REDESIGN, autoHeal: false }),
      )
      setLabResult(r)
      setLabPhase('broken')
      toast.error('Controlled fixture changed meaning — the same selector now returns the wrong semantic value')
    })

  const healLab = () =>
    run('lab-heal', async () => {
      const r = await api.heal({ targetUrl: controlledLabTarget(), mutation: WEBSITE_REDESIGN })
      setLabResult(r)
      setLabPhase('healed')
      toast.success('Repair preview verified, approved, and confirmed by a fresh scrape')
    })

  const diffLab = () =>
    run('lab-diff', async () => {
      const d = await api.diff({ simulate: false, targetUrl: controlledLabTarget() })
      setLabDiff(d)
      toast.success(`${d.changes.length} stored contract changes detected`)
    })

  const reset = () =>
    run('reset', async () => {
      await api.reset()
      setLiveResult(null)
      setLabResult(null)
      setLabDiff(null)
      setLabPhase('idle')
      setUrl('')
      toast.success('Console state cleared')
    })

  const liveContract = liveResult?.contract ?? null
  const liveProduct = liveResult?.contract === null ? liveResult : null
  const livePriceEvidence = liveProduct?.observation.evidence.find((item) => item.field === 'commercial.productPrice') ?? null
  const liveTotalEvidence = liveContract?.evidence.find((item) => item.field === 'checkout.finalTotal') ?? null
  const liveEvidence = liveTotalEvidence ?? livePriceEvidence
  const liveObserved = Boolean(liveResult)
  const livePartial = Boolean(liveProduct)

  const liveStatus = busy === 'live-observe'
    ? 'Scraping public URL'
    : livePartial
      ? 'Offer observed'
      : liveContract
        ? 'Contract verified'
        : 'Awaiting URL'
  const liveTone: MatrixTone = busy === 'live-observe' ? 'warn' : livePartial ? 'data' : 'matrix'

  const livePipeline = [
    {
      n: 1,
      title: 'Scrape',
      body: busy === 'live-observe' ? 'Fetching the public page now' : liveObserved ? 'Public response captured' : 'Awaiting a public URL',
      icon: Globe2,
      state: (busy === 'live-observe' ? 'busy' : liveObserved ? 'done' : 'idle') as PipelineState,
    },
    {
      n: 2,
      title: 'Extract',
      body: liveObserved ? 'Commercial facts extracted with provenance' : 'Prices, fees and terms when available',
      icon: ScanSearch,
      state: (liveObserved ? 'done' : 'idle') as PipelineState,
    },
    {
      n: 3,
      title: 'Structure',
      body: livePartial ? 'Offer observation structured; checkout remains unavailable' : liveContract ? 'Canonical Deal Contract compiled' : 'No missing checkout values are invented',
      icon: FileText,
      state: (livePartial ? 'partial' : liveContract ? 'done' : 'idle') as PipelineState,
    },
    {
      n: 4,
      title: 'Verify',
      body: liveResult ? `${liveResult.integrity.passed}/${liveResult.integrity.total} integrity checks passed` : 'Semantic and provenance checks',
      icon: ShieldCheck,
      state: (livePartial ? 'partial' : liveResult ? 'done' : 'idle') as PipelineState,
    },
    {
      n: 5,
      title: 'Record',
      body: livePartial ? 'Observation event retained; no fake receipt created' : liveContract ? 'Sealed contract retained in browser history' : 'Store only what was actually observed',
      icon: Archive,
      state: (livePartial ? 'partial' : liveContract ? 'done' : 'idle') as PipelineState,
    },
  ]

  const openLiveEvidenceForStep = (step: JourneyStep) => {
    if (!liveContract || !step.evidenceId) return
    const item = liveContract.evidence.find((entry) => entry.id === step.evidenceId)
    if (item) setEvidence(item)
  }

  const openLabEvidenceForStep = (step: JourneyStep) => {
    if (!labResult || !step.evidenceId) return
    const item = labResult.contract.evidence.find((entry) => entry.id === step.evidenceId)
    if (item) setEvidence(item)
  }

  const labFinalState = busy === 'lab-heal' ? 'healing' : labPhase === 'broken' ? 'failed' : 'ok'
  const labTotalEvidence = labResult?.contract.evidence.find((item) => item.field === 'checkout.finalTotal') ?? null
  const labStatus = busy?.startsWith('lab-')
    ? 'Executing lab step'
    : labPhase === 'broken'
      ? 'Semantic drift detected'
      : labPhase === 'healed'
        ? 'Recovered and verified'
        : labPhase === 'observed'
          ? 'Fixture V1 valid'
          : 'Ready'
  const labTone: MatrixTone = labPhase === 'broken' && !busy ? 'alarm' : busy?.startsWith('lab-') ? 'warn' : 'matrix'

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-9 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Kicker tone="matrix">Console</Kicker>
            <SystemRail count={6} className="opacity-70" />
            <SystemStatus label="Live" value={liveStatus} tone={liveTone} />
          </div>
          <h1 className="mt-3 font-mono text-[24px] font-semibold uppercase tracking-[0.04em] text-void-100 sm:text-[30px]">
            <span className="sys-prompt">Web data integrity console</span>
          </h1>
          <p className="mt-3 max-w-4xl text-[14.5px] leading-relaxed text-void-200">
            Paste a public commerce URL to observe real web data. WebReceipt extracts only what the page proves,
            structures the result, verifies its meaning, and records it without inventing unavailable checkout fields.
            The controlled semantic-drift demonstration is a separate lab below; it never mutates a third-party website.
          </p>
        </div>
        <SystemButton onClick={reset} disabled={!!busy} tone="void" size="md">
          {busy === 'reset' ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <RotateCcw size={14} aria-hidden />} Reset all
        </SystemButton>
      </header>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Kicker tone="data">Live observation</Kicker>
            <h2 className="mt-2 font-mono text-[18px] font-semibold uppercase tracking-[0.05em] text-void-100">Public URL → verified observation</h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-void-400">Real public web · read only</span>
        </div>

        <div className="terminal">
          <div className="terminal-bar">
            <Terminal size={12} className="text-data-400" aria-hidden />
            <span className="sys-label flex-1">public target</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <label className="flex min-w-[280px] flex-1 items-center gap-2 rounded-[2px] border border-data-400/25 bg-black/60 px-3 py-2.5 focus-within:border-data-400/70">
              <Link2 size={15} className="shrink-0 text-data-400" aria-hidden />
              <span className="sr-only">Public target URL</span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                spellCheck={false}
                className="flex-1 bg-transparent font-mono text-[13px] text-void-100 outline-none placeholder:text-void-400"
                placeholder="Enter a public URL..."
              />
            </label>
            <SystemButton onClick={observeLive} disabled={!!busy || !url.trim()} tone="data" size="md" variant="solid">
              {busy === 'live-observe' ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Globe2 size={15} aria-hidden />} Observe URL
            </SystemButton>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {livePipeline.map((stage) => <PipelineStage key={stage.n} {...stage} />)}
        </div>

        {liveResult && (
          <MatrixPanel tone="data" className="p-4">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <Kicker tone="data">Source trace</Kicker>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-void-400">Directly from observation provenance</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TraceCell label="Observed source" value={liveContract?.targetUrl ?? liveProduct?.observation.targetUrl ?? url} />
              <TraceCell
                label="Acquisition path"
                value={liveContract?.collector.version ?? liveProduct?.observation.collectorVersion ?? liveProduct?.observation.collectorId ?? 'public web'}
              />
              <TraceCell label="Observed field" value={liveTotalEvidence ? 'checkout.finalTotal' : livePriceEvidence ? 'commercial.productPrice' : '—'} />
              <TraceCell label="Captured text" value={liveEvidence?.capturedText ?? '—'} />
            </div>
          </MatrixPanel>
        )}

        {liveResult && liveContract ? (
          <div className="grid items-start gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <JourneyReplay
                journey={liveContract.journey}
                currency={liveContract.checkout.finalTotal.currency}
                finalState="ok"
                onStepClick={openLiveEvidenceForStep}
              />
              <DealContractCard contract={liveContract} onEvidence={setEvidence} />
              {liveResult.anomalies.length > 0 && <AnomaliesPanel anomalies={liveResult.anomalies} />}
            </div>
            <aside className="space-y-6 xl:sticky xl:top-20">
              <IntegrityPanel integrity={liveResult.integrity} />
              <EventLog events={events} />
            </aside>
          </div>
        ) : liveProduct ? (
          <div className="grid items-start gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2"><ProductObservationCard result={liveProduct} /></div>
            <aside className="space-y-6 xl:sticky xl:top-20">
              <IntegrityPanel integrity={liveProduct.integrity} />
              <EventLog events={events} />
            </aside>
          </div>
        ) : (
          <MatrixPanel tone="data" className="p-8 text-center">
            <Globe2 size={22} className="mx-auto text-data-400" aria-hidden />
            <h3 className="mt-3 font-mono text-[14px] uppercase tracking-[0.12em] text-void-100">Waiting for a public URL</h3>
            <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-void-300">
              A product page may yield only an offer price. A checkout page may yield a complete Deal Contract. Missing fields remain explicitly unavailable.
            </p>
          </MatrixPanel>
        )}
      </section>

      <section className="space-y-5 border-t border-matrix-400/12 pt-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Kicker tone="alarm">Semantic drift lab</Kicker>
              <SystemStatus label="Lab" value={labStatus} tone={labTone} />
            </div>
            <h2 className="mt-2 font-mono text-[18px] font-semibold uppercase tracking-[0.05em] text-void-100">Controlled website · same scraper · changed meaning</h2>
            <p className="mt-2 max-w-4xl text-[13.5px] leading-relaxed text-void-200">
              This is WebReceipt&apos;s owned commercial fixture on <span className="font-mono text-void-100">/fixture/product</span>.
              Step 2 deliberately changes that fixture&apos;s DOM semantics. It does not claim that a real retailer changed its website.
            </p>
          </div>
          <FlaskConical size={22} className="text-alarm-400" aria-hidden />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ActionButton
            n={1}
            label="Observe fixture V1"
            hint="Baseline contract · valid semantics"
            icon={Play}
            tone="phosphor"
            onClick={observeLab}
            busy={busy === 'lab-observe'}
            done={labPhase !== 'idle'}
            disabled={!!busy}
          />
          <ActionButton
            n={2}
            label="Redesign fixture"
            hint="Same scraper · selector meaning changes"
            icon={Zap}
            tone="alarm"
            onClick={breakLab}
            busy={busy === 'lab-break'}
            done={labPhase === 'broken' || labPhase === 'healed'}
            disabled={!!busy || labPhase === 'idle'}
          />
          <ActionButton
            n={3}
            label="Verify repair"
            hint="Preview → integrity gate → approve → fresh rerun"
            icon={Wrench}
            tone="matrix"
            onClick={healLab}
            busy={busy === 'lab-heal'}
            done={labPhase === 'healed'}
            disabled={!!busy || labPhase !== 'broken'}
          />
          <ActionButton
            n={4}
            label="Promise Diff"
            hint="Compare the stored broken → recovered contracts"
            icon={GitCompare}
            tone="data"
            onClick={diffLab}
            busy={busy === 'lab-diff'}
            done={!!labDiff}
            disabled={!!busy || labPhase !== 'healed'}
          />
        </div>

        {labResult && (
          <>
            <MatrixPanel tone={labPhase === 'broken' ? 'alarm' : 'data'} className="p-4">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Kicker tone={labPhase === 'broken' ? 'alarm' : 'data'}>Controlled source trace</Kicker>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-void-400">Same collector identity across the deterministic replay</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <TraceCell label="Fixture" value="Owned WebReceipt commerce fixture" />
                <TraceCell label="Collector ID" value={labResult.contract.collector.id} />
                <TraceCell label="Final-total selector" value={labTotalEvidence?.domPath ?? '—'} />
                <TraceCell label="Captured text" value={labTotalEvidence?.capturedText ?? '—'} alarm={labPhase === 'broken'} />
              </div>
            </MatrixPanel>

            <div className="grid items-start gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <JourneyReplay
                  journey={labResult.contract.journey}
                  currency={labResult.contract.checkout.finalTotal.currency}
                  finalState={labFinalState}
                  onStepClick={openLabEvidenceForStep}
                />
                <DealContractCard contract={labResult.contract} onEvidence={setEvidence} />
                {labResult.anomalies.length > 0 && <AnomaliesPanel anomalies={labResult.anomalies} />}
                {labResult.repair && <HealConsole repair={labResult.repair} healed={labResult.healed} />}
                {labDiff && <PromiseDiff diff={labDiff} />}
              </div>
              <aside className="space-y-6 xl:sticky xl:top-20">
                <IntegrityPanel integrity={labResult.integrity} />
                <EventLog events={events} />
              </aside>
            </div>
          </>
        )}
      </section>

      <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />
    </div>
  )
}

function PipelineStage({
  n,
  title,
  body,
  icon: Icon,
  state,
}: {
  n: number
  title: string
  body: string
  icon: typeof Globe2
  state: PipelineState
}) {
  const tone = state === 'partial' ? matrixTones.warn.line : state === 'busy' ? matrixTones.data.line : state === 'done' ? matrixTones.matrix.line : 'rgba(232,255,238,.18)'
  return (
    <div
      className="panel panel-rail min-h-[118px] p-4"
      style={{
        ['--deco-accent' as string]: tone,
        borderColor: state === 'idle' ? undefined : tone,
        boxShadow: state === 'idle' ? undefined : `inset 0 0 24px -17px ${tone}`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-void-400">Stage {n}</span>
        <span className="grid h-7 w-7 place-items-center rounded-[2px] border" style={{ borderColor: tone, color: tone }}>
          {state === 'busy' ? <Loader2 size={13} className="animate-spin" aria-hidden /> : state === 'done' || state === 'partial' ? <Check size={13} aria-hidden /> : <Icon size={13} aria-hidden />}
        </span>
      </div>
      <div className="mt-3 font-mono text-[12px] uppercase tracking-[0.08em] text-void-100">{title}</div>
      <div className="mt-1 text-[11.5px] leading-relaxed text-void-300">{body}</div>
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
        <Kicker tone="data">Public product observation</Kicker>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-warn-300">Offer only · not sealed as checkout</span>
      </div>
      <h2 className="mt-4 text-[24px] font-semibold leading-tight text-void-100">{observation.subject}</h2>
      <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-void-200">
        WebReceipt found a semantically credible public product price and preserved its provenance. The page did not prove
        a final payable checkout amount, so unavailable checkout fields remain unavailable rather than being copied from the offer price.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TraceCell label="Product price" value={money(observation.commercial.productPrice, observation.commercial.currency)} />
        <TraceCell label="Currency" value={observation.commercial.currency} />
        <TraceCell label="Acquisition path" value={observation.collectorVersion ?? observation.collectorId} />
        <TraceCell label="Checkout" value="Not observed" />
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
    <div className="min-w-0 rounded-[2px] border border-matrix-400/12 bg-black/45 px-3 py-2.5">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-void-400">{label}</div>
      <div className={`mt-1 break-words font-mono text-[11.5px] ${alarm ? 'text-alarm-300' : 'text-void-100'}`}>{value}</div>
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
      className="panel panel-rail panel-lift group min-h-[126px] p-4 text-left disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: accent }}>Step {n}</span>
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
      <div className="mt-1 text-[12px] leading-relaxed text-void-300">{hint}</div>
    </button>
  )
}
