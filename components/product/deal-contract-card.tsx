'use client'

import { Copy, ShieldCheck, ChevronRight, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { DealContract, Evidence } from '@/lib/types'
import { money, signedMoney, shortHash } from '@/lib/api'

interface DealContractCardProps {
  contract: DealContract
  onEvidence?: (evidence: Evidence) => void
}

/* The contract is the price board of the system: the two numbers that matter are
   lit, everything under them is the fine print. */

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
    <section className="panel panel-rail overflow-hidden">
      {/* Header */}
      <div className="border-b border-matrix-400/12 bg-gradient-to-r from-matrix-500/[0.08] via-matrix-500/[0.03] to-transparent px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-phosphor-400">
              <FileText size={12} aria-hidden /> Deal Contract · v{contract.schemaVersion}
            </div>
            <h2 className="text-[17px] font-semibold text-void-100">{contract.subject}</h2>
            <a
              href={contract.targetUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all font-mono text-[12px] text-void-300 transition-colors hover:text-data-300"
            >
              {contract.targetUrl}
            </a>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(contract.contractHash)
              toast.success('Contract hash copied')
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-[2px] border border-matrix-500/35 bg-matrix-500/10 px-3 py-2 font-mono text-[12px] text-matrix-300 shadow-[inset_0_0_20px_-12px_#33ff66] transition-colors hover:bg-matrix-500/20"
            title={contract.contractHash}
          >
            <ShieldCheck size={13} aria-hidden /> {shortHash(contract.contractHash)} <Copy size={11} aria-hidden />
          </button>
        </div>

        {/* Advertised vs final — what was promised, and what you actually pay */}
        <div className="mt-4 flex flex-wrap items-end gap-6">
          <Headline label="Advertised" value={money(offer.advertisedPrice.amount, currency)} field="offer.advertisedPrice" onClick={openField} has={byField.has('offer.advertisedPrice')} />
          <ChevronRight className="mb-2 text-void-400" size={20} aria-hidden />
          <Headline label="Observed final total" value={money(checkout.finalTotal.amount, currency)} accent field="checkout.finalTotal" onClick={openField} has={byField.has('checkout.finalTotal')} />
          {delta !== 0 && (
            <span className="mb-2 font-mono text-[15px] font-semibold text-alarm-400">
              {signedMoney(delta, currency)}
            </span>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-1 px-6 py-5">
        <Row label="Base price" value={money(checkout.basePrice.amount, currency)} field="checkout.basePrice" onClick={openField} has={byField.has('checkout.basePrice')} />
        {checkout.feeItems.map((f) => (
          <Row key={f.label} label={f.label} sub={f.required ? 'required' : 'optional'} value={money(f.amount, f.currency)} indent />
        ))}
        <Row label="Mandatory fees" value={money(checkout.mandatoryFees.amount, currency)} field="checkout.mandatoryFees" onClick={openField} has={byField.has('checkout.mandatoryFees')} />
        <Row label="Taxes" value={money(checkout.taxes.amount, currency)} />
        {checkout.optionalAddons.amount > 0 && <Row label="Optional add-ons" value={money(checkout.optionalAddons.amount, currency)} />}
        {checkout.discounts.amount > 0 && <Row label="Discounts" value={`−${money(checkout.discounts.amount, currency)}`} />}
        <div className="mt-2 flex items-center justify-between border-t border-matrix-400/12 pt-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-void-200">Final total</span>
          <span className="font-mono text-xl font-semibold tabular-nums text-void-100 [text-shadow:0_0_16px_rgba(51,255,102,.35)]">
            {money(checkout.finalTotal.amount, currency)}
          </span>
        </div>
      </div>

      {/* Terms */}
      <div className="grid gap-3 border-t border-matrix-400/12 px-6 py-5 sm:grid-cols-2">
        <Term label="Cancellation" value={terms.cancellation} field="terms.cancellation" onClick={openField} has={byField.has('terms.cancellation')} />
        <Term label="Refundability" value={terms.refundability} />
        <Term label="Payment timing" value={terms.paymentTiming} />
        <Term label="Inclusions" value={terms.inclusions.length ? terms.inclusions.join(', ') : '—'} />
        {offer.claims.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 sm:col-span-2">
            {offer.claims.map((c) => (
              <span
                key={c}
                className="rounded-full border border-data-500/35 bg-data-500/10 px-2.5 py-1 font-mono text-[11px] text-data-300 shadow-[0_0_14px_-8px_#2fe3ba]"
              >
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
      <div className="mb-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-void-300">
        {label}
        {clickable && <span className="text-matrix-400 opacity-0 transition-opacity group-hover:opacity-100">· evidence</span>}
      </div>
      <div
        className={`font-mono font-semibold tabular-nums transition-colors ${
          accent ? 'text-3xl text-void-100' : 'text-2xl text-void-200'
        } ${clickable ? 'group-hover:text-matrix-300' : ''}`}
        style={accent ? { textShadow: '0 0 18px rgba(51,255,102,.4)' } : undefined}
      >
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
      className={`-mx-2 flex w-full items-center justify-between rounded-[2px] px-2 py-1.5 ${
        clickable ? 'group cursor-pointer hover:bg-matrix-500/[0.07]' : 'cursor-default'
      } ${indent ? 'pl-5' : ''}`}
    >
      <span className={`flex items-center gap-2 text-[13.5px] ${indent ? 'text-void-300' : 'text-void-100'}`}>
        {label}
        {sub && <span className="font-mono text-[10px] text-void-400">({sub})</span>}
        {clickable && (
          <span className="font-mono text-[10px] text-matrix-400 opacity-0 transition-opacity group-hover:opacity-100">
            evidence →
          </span>
        )}
      </span>
      <span className="font-mono text-[13.5px] tabular-nums text-void-100">{value}</span>
    </button>
  )
}

function Term({ label, value, field, has, onClick }: { label: string; value: string; field?: string; has?: boolean; onClick?: (f: string) => void }) {
  const clickable = has && field && onClick
  return (
    <button
      disabled={!clickable}
      onClick={() => field && onClick?.(field)}
      className={`rounded-[2px] border border-matrix-400/12 bg-matrix-400/[0.03] p-3 text-left ${
        clickable ? 'group cursor-pointer hover:border-matrix-500/45' : 'cursor-default'
      }`}
    >
      <div className="mb-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-void-300">
        {label}
        {clickable && <span className="text-matrix-400 opacity-0 transition-opacity group-hover:opacity-100">· evidence</span>}
      </div>
      <div className="text-[13.5px] text-void-100">{value}</div>
    </button>
  )
}
