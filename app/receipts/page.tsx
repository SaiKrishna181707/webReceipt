'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Receipt, RefreshCw, Loader2, ShieldCheck, ShieldAlert, ShieldX, Archive } from 'lucide-react'
import { api, money, formatTime, shortHash } from '@/lib/api'
import type { StoreState, Evidence } from '@/lib/types'
import { DealContractCard } from '@/components/product/deal-contract-card'
import { IntegrityPanel } from '@/components/product/integrity-panel'
import { AnomaliesPanel } from '@/components/product/anomalies-panel'
import { EvidenceDrawer } from '@/components/product/evidence-drawer'
import { SystemButton, SystemLink, MatrixPanel, Kicker, SystemRail, SystemStatus } from '@/components/matrix/matrix-ui'
import { useScan } from '@/components/matrix/use-scan'
import { ScanOverlay } from '@/components/matrix/matrix-scan'

const STATUS_ICON = { valid: ShieldCheck, warning: ShieldAlert, invalid: ShieldX } as const
const STATUS_COLOR = { valid: 'text-matrix-400', warning: 'text-warn-400', invalid: 'text-alarm-400' } as const
const STATUS_TUBE = { valid: '#33ff66', warning: '#ccbb45', invalid: '#ff4d4d' } as const
const STATUS_WORD = { valid: 'Sealed', warning: 'Flagged', invalid: 'Broken' } as const

/** One entry in the append-only ledger, exactly as the store returns it. */
type StoredContract = StoreState['contracts'][number]

export default function ReceiptsPage() {
  const [state, setState] = useState<StoreState | null>(null)
  const [active, setActive] = useState(0)
  const [evidence, setEvidence] = useState<Evidence | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setBusy(true)
    try {
      const s = await api.state()
      setState(s)
      setActive(0)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load receipts')
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const receipts = state?.contracts ?? []
  const selected = receipts[active]

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* ==================================================================
          HEADER
          ================================================================== */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Kicker tone="data">Receipts</Kicker>
            <SystemRail count={6} tone="data" className="opacity-70" />
            <SystemStatus
              label="Records"
              value={receipts.length === 0 ? 'None stored' : `${receipts.length} sealed`}
              tone="data"
              live={false}
            />
          </div>
          <h1 className="mt-3 font-mono text-[22px] font-semibold uppercase tracking-[0.04em] text-void-100 sm:text-[26px]">
            <span className="sys-prompt">Deal Contract history</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-void-200">
            Every observation is stored as a canonical, hash-sealed Deal Contract. This is the append-only ledger the
            Promise Diff compares across time.
          </p>
        </div>
        <SystemButton onClick={load} disabled={busy} tone="void" size="md">
          {busy ? (
            <Loader2 size={14} className="animate-spin" aria-hidden />
          ) : (
            <RefreshCw size={14} aria-hidden />
          )}{' '}
          Refresh
        </SystemButton>
      </header>

      {receipts.length === 0 ? (
        <MatrixPanel tone="data" tilt={false} className="p-12 text-center">
          <div
            className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-[2px] border border-data-400 bg-black/55 text-data-400"
            style={{ boxShadow: 'inset 0 0 22px -10px #2fe3ba, 0 0 20px -10px #2fe3ba' }}
          >
            <Receipt size={22} aria-hidden />
          </div>
          <h3 className="font-mono text-[15px] uppercase tracking-[0.12em] text-void-100">No records yet</h3>
          <p className="mx-auto mb-6 mt-2 max-w-md text-[13.5px] leading-relaxed text-void-200">
            Run an observation in the Console to compile your first Deal Contract.
          </p>
          <SystemLink href="/console" tone="data" size="lg" variant="solid" scan>
            Open console
          </SystemLink>
        </MatrixPanel>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          {/* ==============================================================
              THE LEDGER — one secure record per row, each scanning open
              ============================================================== */}
          <div className="lg:col-span-1">
            <div className="terminal">
              <div className="terminal-bar">
                <Archive size={12} className="text-matrix-400" aria-hidden />
                <span className="sys-label flex-1">secure records</span>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-void-400">
                  {receipts.length}
                </span>
              </div>
              <ul className="relative z-[1] space-y-2 p-2">
                {receipts.map((entry, i) => (
                  <RecordRow
                    key={`${entry.contract.contractHash}-${i}`}
                    entry={entry}
                    index={i}
                    active={i === active}
                    onSelect={() => setActive(i)}
                  />
                ))}
              </ul>
            </div>
          </div>

          {/* ==============================================================
              DETAIL
              ============================================================== */}
          <div className="space-y-6 lg:col-span-2">
            {selected && (
              <>
                <DealContractCard contract={selected.contract} onEvidence={setEvidence} />
                <IntegrityPanel integrity={selected.integrity} />
                {selected.anomalies.length > 0 && <AnomaliesPanel anomalies={selected.anomalies} />}
              </>
            )}
          </div>
        </div>
      )}

      <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />
    </div>
  )
}

/**
 * One secure record. Opening it runs the standard scan and then selects — the
 * fields shown (id, timestamp, merchant, amount, integrity) all come from the
 * stored contract, so the record can never read as verified when it isn't.
 */
function RecordRow({
  entry,
  index,
  active,
  onSelect,
}: {
  entry: StoredContract
  index: number
  active: boolean
  onSelect: () => void
}) {
  const c = entry.contract
  const status = entry.integrity.status
  const Icon = STATUS_ICON[status]
  const tube = STATUS_TUBE[status]
  const { phase, run, hostProps } = useScan(onSelect, { skip: active })

  return (
    <li>
      <button
        onClick={run}
        aria-current={active ? 'true' : undefined}
        {...hostProps}
        style={{
          borderColor: active ? tube : 'rgba(232,255,238,.1)',
          boxShadow: active ? `inset 0 0 28px -18px ${tube}, 0 0 18px -10px ${tube}` : undefined,
        }}
        className={`scan-host w-full rounded-[2px] border bg-black/50 p-4 text-left transition-all ${
          active ? '' : 'opacity-75 hover:opacity-100'
        }`}
      >
        <ScanOverlay phase={phase} />

        <div className="relative z-[1]">
          <div className="flex items-center justify-between gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-void-400">
            <span>Record {String(index + 1).padStart(2, '0')}</span>
            <span className="inline-flex items-center gap-1" style={{ color: tube }}>
              <Icon size={12} className={STATUS_COLOR[status]} aria-hidden /> {STATUS_WORD[status]}
            </span>
          </div>

          <div className="mt-2 truncate text-[14px] font-medium text-void-100">{c.subject}</div>

          <dl className="mt-3 space-y-1 font-mono text-[10.5px]">
            <Field label="Id" value={shortHash(c.contractHash)} />
            <Field label="Time" value={formatTime(c.observedAt)} />
            <Field
              label="Amount"
              value={money(c.checkout.finalTotal.amount, c.checkout.finalTotal.currency)}
              accent
            />
          </dl>
        </div>
      </button>
    </li>
  )
}

function Field({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="uppercase tracking-[0.18em] text-void-400">{label}</dt>
      <dd className={`truncate tabular-nums ${accent ? 'text-[12.5px] font-semibold text-matrix-300' : 'text-void-200'}`}>
        {value}
      </dd>
    </div>
  )
}
