'use client'

import { Wrench, Check, X, ShieldCheck, Sparkles, Rocket, Hash } from 'lucide-react'
import type { RepairResult } from '@/lib/types'
import { shortHash } from '@/lib/api'
import { matrixTones } from '@/components/matrix/matrix-ui'

interface HealConsoleProps {
  repair: RepairResult
  healed: boolean
}

type StepState = 'done' | 'rejected' | 'pending'

const DONE = matrixTones.matrix.line
const REJECTED = matrixTones.alarm.line
const GATE = matrixTones.warn.line

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
      // Kept adapter-neutral on purpose: in this app the collector behind the
      // flow is the simulator, so the step must not claim a cloud AI run.
      detail: `The repair flow returned a candidate collector (${repair.proposalStatus}).`,
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

  const accent = healed ? DONE : GATE

  return (
    <section
      className="panel panel-rail overflow-hidden"
      style={{
        ['--accent' as string]: accent,
        borderColor: `${accent}59`,
        boxShadow: `inset 0 0 44px -28px ${accent}`,
      }}
    >
      <div
        className="border-b border-matrix-400/12 px-6 py-4"
        style={{ background: `linear-gradient(180deg, ${accent}17, transparent)` }}
      >
        <div className="sys-label">Self-Healing Flow</div>
        <h3 className="mt-0.5 font-mono text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>
          {healed ? 'Recovered with verified repair' : 'Verification gate — untrusted preview'}
        </h3>
      </div>

      {/* The repair, told as a run of lamps down one rail. */}
      <ol className="space-y-0 p-6">
        {steps.map((s, i) => {
          const Icon = s.icon
          const tube = s.state === 'done' ? DONE : s.state === 'rejected' ? REJECTED : null
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
                          borderColor: 'rgba(169,201,177,.16)',
                          color: '#6d8a75',
                          background: 'rgba(169,201,177,.04)',
                        }
                  }
                >
                  <Icon size={16} aria-hidden />
                </span>
                {i < steps.length - 1 && (
                  <span
                    className="my-1 w-px flex-1"
                    style={{ background: tube ? `${tube}59` : 'rgba(169,201,177,.12)' }}
                  />
                )}
              </div>
              <div className={i === steps.length - 1 ? 'pb-0' : 'pb-6'}>
                <div className={`text-[13.5px] font-semibold ${tube ? 'text-void-100' : 'text-void-300'}`}>
                  {s.title}
                </div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-void-300">{s.detail}</p>
              </div>
            </li>
          )
        })}
      </ol>

      {repair.previewContractHash && (
        <div className="-mt-1 px-6 pb-5">
          <div className="flex items-center gap-2 rounded-[2px] border border-matrix-400/12 bg-black/60 px-3 py-2 font-mono text-[11px] text-void-300">
            <Hash size={12} aria-hidden /> preview contract hash:{' '}
            <span className="text-void-100">{shortHash(repair.previewContractHash)}</span>
          </div>
        </div>
      )}
    </section>
  )
}
