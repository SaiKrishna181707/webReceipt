'use client'

import { X, Copy, Hash, Camera, Code2, MapPin, Clock, GitBranch } from 'lucide-react'
import { toast } from 'sonner'
import type { Evidence } from '@/lib/types'
import { formatTime } from '@/lib/api'

interface EvidenceDrawerProps {
  evidence: Evidence | null
  onClose: () => void
}

const FIELD_LABELS: Record<string, string> = {
  'offer.advertisedPrice': 'Advertised price',
  'checkout.basePrice': 'Base price',
  'checkout.mandatoryFees': 'Mandatory fees',
  'checkout.finalTotal': 'Final total',
  'terms.cancellation': 'Cancellation policy',
}

/* Evidence is the safe-deposit box of the whole product, so the drawer is the
   only surface that stops the boulevard: full black, one mint tube around it. */

export function EvidenceDrawer({ evidence, onClose }: EvidenceDrawerProps) {
  if (!evidence) return null

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text)
    toast.success(`${label} copied`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button aria-label="Close evidence" onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative max-h-[88vh] w-full animate-fade-in-up overflow-y-auto border-t border-mint-400/45 bg-night-900 shadow-[0_0_70px_-20px_rgba(53,243,154,.55),inset_0_0_60px_-40px_rgba(53,243,154,.9)] sm:max-w-3xl sm:rounded-[2px] sm:border">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-night-900/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-[2px] border border-mint-400 bg-mint-500/10 p-2 text-mint-400 shadow-[inset_0_0_18px_-8px_#35f39a,0_0_18px_-8px_#35f39a]">
              <Hash size={18} />
            </div>
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-mint-400">
                Tamper-evident evidence
              </div>
              <h3 className="display text-base italic text-white">{FIELD_LABELS[evidence.field] ?? evidence.field}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-[2px] border border-white/12 p-2 text-night-200 transition-colors hover:border-white/30 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Captured text */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-night-300">
              <Code2 size={12} /> Captured text
            </div>
            <pre className="whitespace-pre-wrap break-words rounded-[2px] border border-aqua-500/25 bg-black/60 p-4 font-mono text-sm text-aqua-200 shadow-[inset_0_0_30px_-22px_rgba(45,226,230,.9)]">
              {evidence.capturedText}
            </pre>
          </div>

          {/* Provenance grid */}
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Meta icon={<MapPin size={13} />} label="Source URL" value={evidence.sourceUrl} mono onCopy={() => copy(evidence.sourceUrl, 'Source URL')} />
            <Meta icon={<Code2 size={13} />} label="DOM path" value={evidence.domPath ?? '—'} mono />
            <Meta icon={<GitBranch size={13} />} label="Journey step" value={evidence.journeyStep != null ? `Step ${evidence.journeyStep}` : '—'} />
            <Meta icon={<Clock size={13} />} label="Observed" value={formatTime(evidence.observedAt)} />
            <Meta icon={<Camera size={13} />} label="Screenshot" value={evidence.screenshotRef ?? '—'} mono />
            <Meta icon={<GitBranch size={13} />} label="Collector version" value={evidence.collectorVersion} mono />
          </div>

          {/* SHA-256 — the seal */}
          <div className="rounded-[2px] border border-mint-500/30 bg-black/55 p-4 shadow-[inset_0_0_34px_-24px_rgba(53,243,154,.9)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-night-300">
                <Hash size={12} /> SHA-256 evidence hash
              </span>
              <button
                onClick={() => copy(evidence.hash, 'Hash')}
                className="flex items-center gap-1 font-mono text-xs uppercase tracking-[0.14em] text-night-200 transition-colors hover:text-mint-300"
              >
                <Copy size={12} /> Copy
              </button>
            </div>
            <p className="break-all font-mono text-xs text-mint-300 [text-shadow:0_0_9px_rgba(53,243,154,.5)]">
              {evidence.hash}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Meta({
  icon,
  label,
  value,
  mono,
  onCopy,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
  onCopy?: () => void
}) {
  return (
    <div className="rounded-[2px] border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-night-300">
        {icon} {label}
        {onCopy && (
          <button onClick={onCopy} aria-label={`Copy ${label}`} className="ml-auto text-night-300 hover:text-white">
            <Copy size={11} />
          </button>
        )}
      </div>
      <div className={`break-all text-night-100 ${mono ? 'font-mono text-xs' : 'text-sm'}`}>{value}</div>
    </div>
  )
}
