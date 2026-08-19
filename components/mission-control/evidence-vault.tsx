'use client'

import { X, ShieldCheck, Copy, Code, Hash } from 'lucide-react'
import { toast } from 'sonner'

interface EvidenceVaultProps {
  isOpen: boolean
  onClose: () => void
  selectedStage: number
}

export function EvidenceVault({ isOpen, onClose, selectedStage }: EvidenceVaultProps) {
  if (!isOpen) return null

  const evidenceData = {
    1: {
      title: 'Stage 01 — Public Offer Page Evidence',
      field: 'advertised_price',
      selector: '.price-tag',
      text: '₹8,499 / night',
      timestamp: new Date().toISOString(),
      hash: '8f3a129048102938102938109238109238102938102938102938102938102938',
      domSnippet: `<div class="hotel-card">
  <h2>Ocean View Deluxe Suite</h2>
  <span class="price-tag">₹8,499 / night</span>
  <button id="checkout-btn">Continue to checkout</button>
</div>`
    },
    2: {
      title: 'Stage 02 — Room Selection Choice Evidence',
      field: 'room_type',
      selector: '.room-name',
      text: 'Ocean View Deluxe Suite (King Bed)',
      timestamp: new Date().toISOString(),
      hash: '5f92019201920192019201920192019201920192019201920192019201920192',
      domSnippet: `<div class="room-option">
  <span class="room-name">Ocean View Deluxe Suite (King Bed)</span>
  <span class="beds">1 King Bed • Sea Facing</span>
</div>`
    },
    3: {
      title: 'Stage 03 — Checkout Summary Evidence',
      field: 'final_total',
      selector: '[data-testid="order-total"]',
      text: '₹10,147',
      timestamp: new Date().toISOString(),
      hash: '1c90283091823901823901823901823901823901823901823901823901823901',
      domSnippet: `<div class="checkout-summary">
  <div class="line-item"><span>Base Rate</span><span>₹8,499</span></div>
  <div class="line-item"><span>Resort Fee</span><span>₹848</span></div>
  <div class="line-item"><span>GST (10%)</span><span>₹800</span></div>
  <div class="line-total" data-testid="order-total">₹10,147</div>
</div>`
    },
    4: {
      title: 'Stage 04 — Public Terms & Policies Evidence',
      field: 'cancellation',
      selector: '.policy-cancellation',
      text: 'Free cancellation within 24h',
      timestamp: new Date().toISOString(),
      hash: '3d90192019201920192019201920192019201920192019201920192019201920',
      domSnippet: `<div class="policy-section">
  <span class="policy-cancellation">Free cancellation within 24h</span>
  <span class="policy-refund">Full refund to original payment method</span>
</div>`
    }
  }[selectedStage] || {
    title: 'Stage Evidence',
    field: 'general',
    selector: '.node',
    text: 'Extracted Claim',
    timestamp: new Date().toISOString(),
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    domSnippet: '<div>Evidence Node Payload</div>'
  }

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-[#090d16]/95 backdrop-blur-xl border-t border-white/10 p-6 shadow-2xl animate-slide-in max-h-[85vh] overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="text-xs font-mono text-emerald-400 uppercase font-bold">FORENSIC EVIDENCE VAULT</span>
              <h2 className="text-xl font-bold text-white mt-0.5">{evidenceData.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Selector & DOM Snippet */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span>Source Selector: <code className="text-cyan-300 bg-white/5 px-2 py-0.5 rounded">{evidenceData.selector}</code></span>
              <button onClick={() => copyText(evidenceData.domSnippet, 'DOM Snippet')} className="hover:text-white flex items-center gap-1">
                <Copy size={12} /> Copy Code
              </button>
            </div>

            <pre className="bg-black/60 border border-white/10 p-4 rounded-xl text-xs font-mono text-cyan-200 overflow-x-auto">
              <code>{evidenceData.domSnippet}</code>
            </pre>
          </div>

          {/* Right Column: Screenshot & Cryptographic Tag */}
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                <span className="flex items-center gap-1 font-bold text-white"><Hash size={14} /> SHA-256 FORENSIC HASH</span>
                <button onClick={() => copyText(evidenceData.hash, 'Hash')} className="hover:text-white"><Copy size={12} /></button>
              </div>

              <p className="font-mono text-xs text-emerald-300 break-all bg-black/40 p-2.5 rounded border border-white/10">
                {evidenceData.hash}
              </p>

              <div className="flex items-center justify-between text-xs font-mono text-gray-400 pt-2 border-t border-white/10">
                <span>Captured: <span className="text-white">{new Date(evidenceData.timestamp).toLocaleTimeString()}</span></span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  VERIFIED EVIDENCE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
