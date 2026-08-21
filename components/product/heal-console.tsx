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
    <section
      className="overflow-hidden rounded-[2px] border bg-black/45 backdrop-blur-sm"
      style={{
        borderColor: healed ? 'rgba(53,243,154,.35)' : 'rgba(255,116,24,.35)',
        boxShadow: healed
          ? 'inset 0 0 44px -28px rgba(53,243,154,.95)'
          : 'inset 0 0 44px -28px rgba(255,116,24,.95)',
      }}
    >
      <div
        className="border-b border-white/10 px-6 py-4"
        style={{ background: `linear-gradient(180deg, ${healed ? 'rgba(53,243,154,.09)' : 'rgba(255,116,24,.09)'}, transparent)` }}
      >
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-night-300">Self-Healing Flow</div>
        <h3
          className="display text-base italic"
          style={
            healed
              ? { color: '#7dffb0', textShadow: '0 0 12px rgba(53,243,154,.55)' }
              : { color: '#ffbb6b', textShadow: '0 0 12px rgba(255,116,24,.55)' }
          }
        >
          {healed ? 'Recovered with verified repair' : 'Verification gate — untrusted preview'}
        </h3>
      </div>

      {/* The repair, told as a run of bulbs down the side of the sign */}
      <ol className="space-y-0 p-6">
        {steps.map((s, i) => {
          const Icon = s.icon
          const tube = s.state === 'done' ? '#35f39a' : s.state === 'rejected' ? '#ff2d5e' : null
          return (
            <li key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className="grid h-9 w-9 place-items-center rounded-full border"
                  style={
                    tube
                      ? {
                          borderColor: tube,
                          color: tube,
                          background: `${tube}1f`,
                          boxShadow: `0 0 18px -6px ${tube}, inset 0 0 16px -8px ${tube}`,
                        }
                      : {
                          borderColor: 'rgba(255,255,255,.12)',
                          color: '#7d759c',
                          background: 'rgba(255,255,255,.04)',
                        }
                  }
                >
                  <Icon size={16} />
                </span>
                {i < steps.length - 1 && (
                  <span
                    className="my-1 w-px flex-1"
                    style={{ background: tube ? `${tube}59` : 'rgba(255,255,255,.1)' }}
                  />
                )}
              </div>
              <div className={`pb-6 ${i === steps.length - 1 ? 'pb-0' : ''}`}>
                <div className={`text-sm font-semibold ${tube ? 'text-white' : 'text-night-300'}`}>{s.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-night-300">{s.detail}</p>
              </div>
            </li>
          )
        })}
      </ol>

      {repair.previewContractHash && (
        <div className="-mt-1 px-6 pb-5">
          <div className="flex items-center gap-2 rounded-[2px] border border-white/10 bg-black/50 px-3 py-2 font-mono text-[11px] text-night-300">
            <Hash size={12} /> preview contract hash:{' '}
            <span className="text-night-100">{shortHash(repair.previewContractHash)}</span>
          </div>
        </div>
      )}
    </section>
  )
}
