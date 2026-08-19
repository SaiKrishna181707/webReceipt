'use client'

import { Wrench, Check, X, ShieldCheck, Sparkles, Rocket, Hash } from 'lucide-react'
import type { RepairResult } from '@/lib/types'
import { shortHash } from '@/lib/api'

interface HealConsoleProps {
  repair: RepairResult
  healed: boolean
}

type StepState = 'done' | 'rejected' | 'pending'

export function HealConsole({ repair, healed }: HealConsoleProps) {
  const preview = repair.previewIntegrity
  const previewValid = preview?.status === 'valid'

  const steps: { icon: typeof Check; title: string; detail: string; state: StepState }[] = [
    {
      icon: Wrench,
      title: 'Integrity failure detected',
      detail: 'The Contract Integrity Engine flagged the extraction as wrong-but-valid.',
      state: 'done',
    },
    {
      icon: Sparkles,
      title: 'Repair proposal received',
      detail: `Bright Data AI Flow returned a candidate collector (${repair.proposalStatus}).`,
      state: repair.requested ? 'done' : 'pending',
    },
    {
      icon: ShieldCheck,
      title: 'Preview verified against contract invariants',
      detail: preview
        ? preview.total != null
          ? `Untrusted preview re-scored: ${preview.passed}/${preview.total} checks — ${preview.status}.`
          : `Untrusted preview failed verification — ${preview.status}.`
        : 'Awaiting preview.',
      state: preview ? (previewValid ? 'done' : 'rejected') : 'pending',
    },
    {
      icon: repair.rejected ? X : Check,
      title: repair.rejected ? 'Repair rejected at the gate' : 'Repair approved',
      detail: repair.rejected
        ? 'Preview did not satisfy invariants — the untrusted patch was refused, not deployed.'
        : `Approval: ${repair.approval}.`,
      state: repair.rejected ? 'rejected' : repair.approved ? 'done' : 'pending',
    },
    {
      icon: Rocket,
      title: healed ? 'Healed collector deployed & re-verified' : 'Deployment blocked',
      detail: healed
        ? 'The verified collector is live; the contract now passes integrity.'
        : 'No patch was deployed because the preview failed verification.',
      state: healed ? 'done' : repair.rejected ? 'rejected' : 'pending',
    },
  ]

  return (
    <section className="glass-card rounded-2xl border border-white/10 overflow-hidden">
      <div className={`px-6 py-4 border-b border-white/10 ${healed ? 'bg-emerald-500/[0.06]' : 'bg-amber-500/[0.06]'}`}>
        <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">Self-Healing Flow</div>
        <h3 className="font-bold text-white">
          {healed ? 'Recovered with verified repair' : 'Verification gate — untrusted preview'}
        </h3>
      </div>

      <ol className="p-6 space-y-0">
        {steps.map((s, i) => {
          const Icon = s.icon
          const color = s.state === 'done' ? 'emerald' : s.state === 'rejected' ? 'rose' : 'gray'
          const dot =
            color === 'emerald'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : color === 'rose'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-white/5 text-gray-600 border-white/10'
          return (
            <li key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className={`w-9 h-9 rounded-full border flex items-center justify-center ${dot}`}>
                  <Icon size={16} />
                </span>
                {i < steps.length - 1 && <span className="w-px flex-1 my-1 bg-white/10" />}
              </div>
              <div className={`pb-6 ${i === steps.length - 1 ? 'pb-0' : ''}`}>
                <div className={`text-sm font-semibold ${color === 'gray' ? 'text-gray-500' : 'text-white'}`}>{s.title}</div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.detail}</p>
              </div>
            </li>
          )
        })}
      </ol>

      {repair.previewContractHash && (
        <div className="px-6 pb-5 -mt-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
            <Hash size={12} /> preview contract hash: <span className="text-gray-300">{shortHash(repair.previewContractHash)}</span>
          </div>
        </div>
      )}
    </section>
  )
}
