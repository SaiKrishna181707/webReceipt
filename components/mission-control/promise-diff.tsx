'use client'

import { useState } from 'react'
import { Sliders, X } from 'lucide-react'
import { toast } from 'sonner'

interface PromiseDiffProps {
  isOpen: boolean
  onClose: () => void
}

export function PromiseDiff({ isOpen, onClose }: PromiseDiffProps) {
  const [selectedDiff, setSelectedDiff] = useState<number | null>(null)

  if (!isOpen) return null

  const diffItems = [
    {
      id: 1,
      field: 'Advertised Rate vs Final Total',
      stage: 'Offer → Checkout',
      oldVal: '₹8,499 (Initial Offer)',
      newVal: '₹10,147 (Checkout Total)',
      type: 'drip_pricing',
      severity: 'high',
      desc: '+₹1,648 (+19.4%) mandatory resort fee and tax unbundled until stage 3.'
    },
    {
      id: 2,
      field: 'Mandatory Resort Fee',
      stage: 'Checkout Summary',
      oldVal: '₹0 (Unlisted on Offer)',
      newVal: '₹848 (Added at Checkout)',
      type: 'unbundled_fee',
      severity: 'high',
      desc: 'Mandatory fee item inserted during room checkout flow.'
    },
    {
      id: 3,
      field: 'Cancellation Policy',
      stage: 'Terms & Conditions',
      oldVal: 'Free cancellation within 24h',
      newVal: 'Non-refundable rate',
      type: 'term_change',
      severity: 'medium',
      desc: 'Cancellation terms modified between run #1 and run #2.'
    }
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-[#090d16] border border-amber-500/40 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
              <Sliders size={20} />
            </div>
            <div>
              <span className="text-xs font-mono text-amber-400 uppercase font-bold">HISTORICAL COMPARISON OVERLAY</span>
              <h2 className="text-xl font-bold text-white mt-0.5">Promise Diff — Observed Changes</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Diff Cards List */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {diffItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedDiff(item.id)}
              className="p-4 rounded-2xl bg-white/5 border border-amber-500/30 hover:border-amber-500/60 transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-amber-400 font-bold uppercase">{item.field}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.stage}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-3 bg-black/40 rounded-xl border border-white/10">
                  <span className="text-[10px] text-gray-500 block">OBSERVATION #1 (PREVIOUS)</span>
                  <span className="text-gray-300 font-bold block mt-0.5">{item.oldVal}</span>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                  <span className="text-[10px] text-amber-400/80 block">OBSERVATION #2 (CURRENT)</span>
                  <span className="text-amber-300 font-bold block mt-0.5">{item.newVal}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
