'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Receipt, RefreshCw, Loader2, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'
import { api, money, formatTime, shortHash } from '@/lib/api'
import type { StoreState, Evidence } from '@/lib/types'
import { DealContractCard } from '@/components/product/deal-contract-card'
import { IntegrityPanel } from '@/components/product/integrity-panel'
import { AnomaliesPanel } from '@/components/product/anomalies-panel'
import { EvidenceDrawer } from '@/components/product/evidence-drawer'

const STATUS_ICON = { valid: ShieldCheck, warning: ShieldAlert, invalid: ShieldX } as const
const STATUS_COLOR = { valid: 'text-emerald-400', warning: 'text-amber-400', invalid: 'text-rose-400' } as const

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
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400">Receipts</div>
          <h1 className="text-3xl font-bold text-white">Deal Contract history</h1>
          <p className="text-gray-400 max-w-2xl">
            Every observation is stored as a canonical, hash-sealed Deal Contract. This is the append-only ledger the
            Promise Diff compares across time.
          </p>
        </div>
        <button
          onClick={load}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl px-3 py-2.5 transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
        </button>
      </header>

      {receipts.length === 0 ? (
        <div className="glass-card rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <Receipt size={22} />
          </div>
          <h3 className="text-lg font-bold text-white">No receipts yet</h3>
          <p className="text-gray-400 text-sm mt-1 mb-5 max-w-md mx-auto">
            Run an observation in the Console to compile your first Deal Contract.
          </p>
          <Link
            href="/console"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-3 transition-colors"
          >
            Open Console
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* List */}
          <ul className="lg:col-span-1 space-y-2">
            {receipts.map((entry, i) => {
              const c = entry.contract
              const Icon = STATUS_ICON[entry.integrity.status]
              return (
                <li key={`${c.contractHash}-${i}`}>
                  <button
                    onClick={() => setActive(i)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      i === active ? 'bg-white/[0.06] border-violet-500/40' : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white truncate">{c.subject}</span>
                      <Icon size={15} className={STATUS_COLOR[entry.integrity.status]} />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="font-mono text-gray-500">{formatTime(c.observedAt)}</span>
                      <span className="font-mono font-bold text-gray-200">
                        {money(c.checkout.finalTotal.amount, c.checkout.finalTotal.currency)}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-gray-600">{shortHash(c.contractHash)}</div>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Detail */}
          <div className="lg:col-span-2 space-y-6">
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
