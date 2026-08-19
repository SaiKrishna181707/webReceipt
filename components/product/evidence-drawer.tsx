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

export function EvidenceDrawer({ evidence, onClose }: EvidenceDrawerProps) {
  if (!evidence) return null

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text)
    toast.success(`${label} copied`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <button aria-label="Close evidence" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-3xl bg-[#0b0e17] border-t sm:border border-emerald-500/30 sm:rounded-2xl shadow-2xl max-h-[88vh] overflow-y-auto animate-fade-in-up">
        {/* Header */}
        <div className="sticky top-0 bg-[#0b0e17] border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Hash size={18} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Tamper-evident evidence
              </div>
              <h3 className="text-white font-bold">{FIELD_LABELS[evidence.field] ?? evidence.field}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Captured text */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <Code2 size={12} /> Captured text
            </div>
            <pre className="bg-black/50 border border-white/10 rounded-xl p-4 text-sm font-mono text-cyan-200 whitespace-pre-wrap break-words">
              {evidence.capturedText}
            </pre>
          </div>

          {/* Provenance grid */}
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Meta icon={<MapPin size={13} />} label="Source URL" value={evidence.sourceUrl} mono onCopy={() => copy(evidence.sourceUrl, 'Source URL')} />
            <Meta icon={<Code2 size={13} />} label="DOM path" value={evidence.domPath ?? '—'} mono />
            <Meta icon={<GitBranch size={13} />} label="Journey step" value={evidence.journeyStep != null ? `Step ${evidence.journeyStep}` : '—'} />
            <Meta icon={<Clock size={13} />} label="Observed" value={formatTime(evidence.observedAt)} />
            <Meta icon={<Camera size={13} />} label="Screenshot" value={evidence.screenshotRef ?? '—'} mono />
            <Meta icon={<GitBranch size={13} />} label="Collector version" value={evidence.collectorVersion} mono />
          </div>

          {/* SHA-256 */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Hash size={12} /> SHA-256 evidence hash
              </span>
              <button onClick={() => copy(evidence.hash, 'Hash')} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs">
                <Copy size={12} /> Copy
              </button>
            </div>
            <p className="font-mono text-xs text-emerald-300 break-all">{evidence.hash}</p>
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
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1.5">
        {icon} {label}
        {onCopy && (
          <button onClick={onCopy} className="ml-auto text-gray-500 hover:text-white">
            <Copy size={11} />
          </button>
        )}
      </div>
      <div className={`text-gray-200 break-all ${mono ? 'font-mono text-xs' : 'text-sm'}`}>{value}</div>
    </div>
  )
}
