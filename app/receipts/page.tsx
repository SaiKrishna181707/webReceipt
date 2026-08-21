'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Receipt, RefreshCw, Loader2, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'
import { api, money, formatTime, shortHash } from '@/lib/api'
import type { StoreState, Evidence } from '@/lib/types'
import { DealContractCard } from '@/components/product/deal-contract-card'
import { IntegrityPanel } from '@/components/product/integrity-panel'
import { AnomaliesPanel } from '@/components/product/anomalies-panel'
import { EvidenceDrawer } from '@/components/product/evidence-drawer'
import { NeonButton, NeonLink, DecoPanel } from '@/components/vice/vice-ui'

const STATUS_ICON = { valid: ShieldCheck, warning: ShieldAlert, invalid: ShieldX } as const
const STATUS_COLOR = { valid: 'text-mint-400', warning: 'text-gold-400', invalid: 'text-blood-400' } as const
const STATUS_TUBE = { valid: '#35f39a', warning: '#ffc23c', invalid: '#ff2d5e' } as const

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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-aqua-400">Receipts</div>
          <h1 className="display text-3xl italic text-white">Deal Contract history</h1>
          <p className="max-w-2xl text-night-200">
            Every observation is stored as a canonical, hash-sealed Deal Contract. This is the append-only ledger the
            Promise Diff compares across time.
          </p>
        </div>
        <NeonButton onClick={load} disabled={busy} tone="chrome" size="md">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
        </NeonButton>
      </header>

      {receipts.length === 0 ? (
        <DecoPanel tone="aqua" tilt={false} className="p-12 text-center">
          <div
            className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-[2px] border border-aqua-400 bg-black/45 text-aqua-400"
            style={{ boxShadow: 'inset 0 0 22px -10px #2de2e6, 0 0 20px -10px #2de2e6' }}
          >
            <Receipt size={22} />
          </div>
          <h3 className="display text-lg italic text-white">No receipts yet</h3>
          <p className="mx-auto mb-6 mt-1.5 max-w-md text-sm text-night-200">
            Run an observation in the Console to compile your first Deal Contract.
          </p>
          <NeonLink href="/console" tone="aqua" size="lg" variant="solid">
            Open Console
          </NeonLink>
        </DecoPanel>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          {/* The ledger, as a row of lit marquee cards */}
          <ul className="space-y-2 lg:col-span-1">
            {receipts.map((entry, i) => {
              const c = entry.contract
              const Icon = STATUS_ICON[entry.integrity.status]
              const tube = STATUS_TUBE[entry.integrity.status]
              const on = i === active
              return (
                <li key={`${c.contractHash}-${i}`}>
                  <button
                    onClick={() => setActive(i)}
                    aria-current={on}
                    style={{
                      borderColor: on ? tube : 'rgba(255,255,255,.1)',
                      boxShadow: on ? `inset 0 0 28px -18px ${tube}, 0 0 18px -10px ${tube}` : undefined,
                    }}
                    className={`w-full rounded-[2px] border bg-black/40 p-4 text-left transition-all ${
                      on ? '' : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-white">{c.subject}</span>
                      <Icon size={15} className={STATUS_COLOR[entry.integrity.status]} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-mono text-night-300">{formatTime(c.observedAt)}</span>
                      <span className="display text-base italic text-gold-300">
                        {money(c.checkout.finalTotal.amount, c.checkout.finalTotal.currency)}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-night-400">{shortHash(c.contractHash)}</div>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Detail */}
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
