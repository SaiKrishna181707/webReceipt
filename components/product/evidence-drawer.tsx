'use client'

import { useEffect } from 'react'
import { X, Copy, Hash, Camera, Code2, MapPin, Clock, GitBranch } from 'lucide-react'
import { toast } from 'sonner'
import type { Evidence } from '@/lib/types'
import { formatTime } from '@/lib/api'
import { matrixTones } from '@/components/matrix/matrix-ui'

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
   only surface that stops the construct: full black, one bright tube around it. */

const SEAL = matrixTones.matrix.line

export function EvidenceDrawer({ evidence, onClose }: EvidenceDrawerProps) {
  // A modal that can only be dismissed by mouse is a trap for keyboard users.
  useEffect(() => {
    if (!evidence) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [evidence, onClose])

  if (!evidence) return null

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text)
    toast.success(`${label} copied`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Tamper-evident evidence"
    >
      <button aria-label="Close evidence" onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      <div className="relative max-h-[88vh] w-full animate-fade-in-up overflow-y-auto border-t border-matrix-400/45 bg-void-900 shadow-[0_0_70px_-20px_rgba(51,255,102,.5),inset_0_0_60px_-40px_rgba(51,255,102,.85)] sm:max-w-3xl sm:rounded-[2px] sm:border">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-matrix-400/12 bg-void-900/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div
              className="rounded-[2px] border p-2"
              style={{
                borderColor: SEAL,
                color: SEAL,
                background: `${SEAL}1a`,
                boxShadow: `inset 0 0 18px -8px ${SEAL}, 0 0 18px -8px ${SEAL}`,
              }}
            >
              <Hash size={18} aria-hidden />
            </div>
            <div>
              <div className="sys-label text-matrix-400">Tamper-evident evidence</div>
              <h3 className="mt-0.5 font-mono text-[13px] font-semibold uppercase tracking-[0.08em] text-void-50">
                {FIELD_LABELS[evidence.field] ?? evidence.field}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-[2px] border border-matrix-400/15 p-2 text-void-200 transition-colors hover:border-matrix-400/50 hover:text-matrix-200"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Captured text */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 sys-label">
              <Code2 size={12} aria-hidden /> Captured text
            </div>
            <pre className="whitespace-pre-wrap break-words rounded-[2px] border border-data-500/25 bg-black/70 p-4 font-mono text-[13px] text-data-200 shadow-[inset_0_0_30px_-22px_rgba(47,227,186,.9)]">
              {evidence.capturedText}
            </pre>
          </div>

          {/* Provenance grid */}
          <div className="grid gap-3 text-[13.5px] sm:grid-cols-2">
            <Meta icon={<MapPin size={13} aria-hidden />} label="Source URL" value={evidence.sourceUrl} mono onCopy={() => copy(evidence.sourceUrl, 'Source URL')} />
            <Meta icon={<Code2 size={13} aria-hidden />} label="DOM path" value={evidence.domPath ?? '—'} mono />
            <Meta icon={<GitBranch size={13} aria-hidden />} label="Journey step" value={evidence.journeyStep != null ? `Step ${evidence.journeyStep}` : '—'} />
            <Meta icon={<Clock size={13} aria-hidden />} label="Observed" value={formatTime(evidence.observedAt)} />
            <Meta icon={<Camera size={13} aria-hidden />} label="Screenshot" value={evidence.screenshotRef ?? '—'} mono />
            <Meta icon={<GitBranch size={13} aria-hidden />} label="Collector version" value={evidence.collectorVersion} mono />
          </div>

          {/* SHA-256 — the seal */}
          <div className="rounded-[2px] border border-matrix-500/30 bg-black/60 p-4 shadow-[inset_0_0_34px_-24px_rgba(51,255,102,.9)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 sys-label">
                <Hash size={12} aria-hidden /> SHA-256 evidence hash
              </span>
              <button
                onClick={() => copy(evidence.hash, 'Hash')}
                className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-void-200 transition-colors hover:text-matrix-300"
              >
                <Copy size={12} aria-hidden /> Copy
              </button>
            </div>
            <p className="break-all font-mono text-[12px] text-matrix-300 [text-shadow:0_0_9px_rgba(51,255,102,.45)]">
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
    <div className="rounded-[2px] border border-matrix-400/12 bg-matrix-500/[0.03] p-3">
      <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-void-300">
        {icon} {label}
        {onCopy && (
          <button onClick={onCopy} aria-label={`Copy ${label}`} className="ml-auto text-void-300 hover:text-matrix-300">
            <Copy size={11} aria-hidden />
          </button>
        )}
      </div>
      <div className={`break-all text-void-100 ${mono ? 'font-mono text-[12px]' : 'text-[13.5px]'}`}>{value}</div>
    </div>
  )
}
