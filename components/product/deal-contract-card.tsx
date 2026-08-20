'use client'

import { Copy, ShieldCheck, ChevronRight, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { DealContract, Evidence } from '@/lib/types'
import { money, signedMoney, shortHash } from '@/lib/api'

interface DealContractCardProps {
  contract: DealContract
  onEvidence?: (evidence: Evidence) => void
}

export function DealContractCard({ contract, onEvidence }: DealContractCardProps) {
  const { checkout, offer, terms } = contract
  const currency = checkout.finalTotal.currency
  const byField = new Map<string, Evidence>()
  for (const e of contract.evidence) if (!byField.has(e.field)) byField.set(e.field, e)

  const openField = (field: string) => {
    const e = byField.get(field)
    if (e && onEvidence) onEvidence(e)
  }

  const delta = checkout.finalTotal.amount - offer.advertisedPrice.amount

  return (
    <section className="glass-card rounded-[8px] border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-stud-500/[0.08] to-transparent">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-stud-400 font-bold mb-1">
              <FileText size={12} /> Deal Contract · v{contract.schemaVersion}
            </div>
            <h2 className="text-lg font-bold text-white">{contract.subject}</h2>
            <a
              href={contract.targetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-plate-300 hover:text-azure-400 transition-colors break-all"
            >
              {contract.targetUrl}
            </a>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(contract.contractHash)
              toast.success('Contract hash copied')
            }}
            className="shrink-0 flex items-center gap-1.5 text-xs font-mono text-lime-300 bg-lime-500/10 border border-lime-500/30 rounded-lg px-3 py-2 hover:bg-lime-500/20 transition-colors"
            title={contract.contractHash}
          >
            <ShieldCheck size={13} /> {shortHash(contract.contractHash)} <Copy size={11} />
          </button>
        </div>

        {/* Advertised vs final */}
        <div className="mt-4 flex items-end gap-6 flex-wrap">
          <Headline label="Advertised" value={money(offer.advertisedPrice.amount, currency)} field="offer.advertisedPrice" onClick={openField} has={byField.has('offer.advertisedPrice')} />
          <ChevronRight className="text-plate-400 mb-2" size={20} />
          <Headline label="Observed final total" value={money(checkout.finalTotal.amount, currency)} accent field="checkout.finalTotal" onClick={openField} has={byField.has('checkout.finalTotal')} />
          {delta !== 0 && (
            <span className="mb-2 text-sm font-mono font-bold text-rose-400">{signedMoney(delta, currency)}</span>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="px-6 py-5 space-y-1">
        <Row label="Base price" value={money(checkout.basePrice.amount, currency)} field="checkout.basePrice" onClick={openField} has={byField.has('checkout.basePrice')} />
        {checkout.feeItems.map((f) => (
          <Row key={f.label} label={f.label} sub={f.required ? 'required' : 'optional'} value={money(f.amount, f.currency)} indent />
        ))}
        <Row label="Mandatory fees" value={money(checkout.mandatoryFees.amount, currency)} field="checkout.mandatoryFees" onClick={openField} has={byField.has('checkout.mandatoryFees')} />
        <Row label="Taxes" value={money(checkout.taxes.amount, currency)} />
        {checkout.optionalAddons.amount > 0 && <Row label="Optional add-ons" value={money(checkout.optionalAddons.amount, currency)} />}
        {checkout.discounts.amount > 0 && <Row label="Discounts" value={`−${money(checkout.discounts.amount, currency)}`} />}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/10">
          <span className="text-sm font-bold text-white">Final total</span>
          <span className="text-lg font-bold font-mono text-white">{money(checkout.finalTotal.amount, currency)}</span>
        </div>
      </div>

      {/* Terms */}
      <div className="px-6 py-5 border-t border-white/10 grid sm:grid-cols-2 gap-3">
        <Term label="Cancellation" value={terms.cancellation} field="terms.cancellation" onClick={openField} has={byField.has('terms.cancellation')} />
        <Term label="Refundability" value={terms.refundability} />
        <Term label="Payment timing" value={terms.paymentTiming} />
        <Term label="Inclusions" value={terms.inclusions.length ? terms.inclusions.join(', ') : '—'} />
        {offer.claims.length > 0 && (
          <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
            {offer.claims.map((c) => (
              <span key={c} className="text-[11px] font-mono text-azure-300 bg-azure-500/10 border border-azure-500/30 rounded-full px-2.5 py-1">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Headline({ label, value, accent, field, has, onClick }: { label: string; value: string; accent?: boolean; field?: string; has?: boolean; onClick?: (f: string) => void }) {
  const clickable = has && field && onClick
  return (
    <button
      disabled={!clickable}
      onClick={() => field && onClick?.(field)}
      className={`text-left ${clickable ? 'group cursor-pointer' : 'cursor-default'}`}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-plate-300 mb-1 flex items-center gap-1">
        {label}
        {clickable && <span className="text-lime-500 opacity-0 group-hover:opacity-100 transition-opacity">· evidence</span>}
      </div>
      <div className={`font-bold font-mono ${accent ? 'text-3xl text-white' : 'text-2xl text-plate-100'} ${clickable ? 'group-hover:text-lime-300 transition-colors' : ''}`}>
        {value}
      </div>
    </button>
  )
}

function Row({ label, sub, value, indent, field, has, onClick }: { label: string; sub?: string; value: string; indent?: boolean; field?: string; has?: boolean; onClick?: (f: string) => void }) {
  const clickable = has && field && onClick
  return (
    <button
      disabled={!clickable}
      onClick={() => field && onClick?.(field)}
      className={`w-full flex items-center justify-between py-1.5 rounded-lg px-2 -mx-2 ${clickable ? 'group hover:bg-lime-500/[0.06] cursor-pointer' : 'cursor-default'} ${indent ? 'pl-5' : ''}`}
    >
      <span className={`text-sm ${indent ? 'text-plate-300' : 'text-plate-100'} flex items-center gap-2`}>
        {label}
        {sub && <span className="text-[10px] font-mono text-plate-400">({sub})</span>}
        {clickable && <span className="text-[10px] font-mono text-lime-500 opacity-0 group-hover:opacity-100 transition-opacity">evidence →</span>}
      </span>
      <span className="text-sm font-mono text-plate-100">{value}</span>
    </button>
  )
}

function Term({ label, value, field, has, onClick }: { label: string; value: string; field?: string; has?: boolean; onClick?: (f: string) => void }) {
  const clickable = has && field && onClick
  return (
    <button
      disabled={!clickable}
      onClick={() => field && onClick?.(field)}
      className={`text-left bg-white/[0.03] border border-white/10 rounded-[6px] p-3 ${clickable ? 'group hover:border-lime-500/40 cursor-pointer' : 'cursor-default'}`}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-plate-300 mb-1 flex items-center gap-1">
        {label}
        {clickable && <span className="text-lime-500 opacity-0 group-hover:opacity-100 transition-opacity">· evidence</span>}
      </div>
      <div className="text-sm text-plate-100">{value}</div>
    </button>
  )
}
