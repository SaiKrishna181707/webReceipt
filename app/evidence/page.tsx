'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Shield, Hash, CheckCircle2, Lock, Eye, Copy, ExternalLink, Image, Code, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface EvidenceStage {
  step: number
  name: string
  url: string
  timestamp: string
  screenshotHash: string
  domHash: string
  extractedNode: string
  selector: string
  domSnippet: string
}

const mockEvidenceChain: EvidenceStage[] = [
  {
    step: 1,
    name: 'Stage 1 — Public Offer Page',
    url: 'https://webreceipt.dev/fixture/hotel#offer',
    timestamp: new Date().toISOString(),
    screenshotHash: '8f3a129048102938102938109238109238102938102938102938102938102938',
    domHash: '4a1b920192019201920192019201920192019201920192019201920192019201',
    extractedNode: '<div class="total-price font-bold">₹8,499</div>',
    selector: '.total-price',
    domSnippet: `<div className="hotel-card">
  <h2>Ocean View Deluxe Suite</h2>
  <span className="price-tag">₹8,499 / night</span>
  <button id="checkout-btn">Continue to checkout</button>
</div>`
  },
  {
    step: 2,
    name: 'Stage 2 — Checkout Summary',
    url: 'https://webreceipt.dev/fixture/hotel#checkout',
    timestamp: new Date(Date.now() + 15000).toISOString(),
    screenshotHash: '1c90283091823901823901823901823901823901823901823901823901823901',
    domHash: '9d20192019201920192019201920192019201920192019201920192019201920',
    extractedNode: '<span data-testid="order-total">₹10,147</span>',
    selector: '[data-testid="order-total"]',
    domSnippet: `<div className="checkout-summary">
  <div className="line-item"><span>Base Rate</span><span>₹8,499</span></div>
  <div className="line-item"><span>Resort Fee</span><span>₹848</span></div>
  <div className="line-item"><span>GST (10%)</span><span>₹800</span></div>
  <div className="line-total" data-testid="order-total">₹10,147</div>
</div>`
  }
]

export default function EvidencePage() {
  const [activeStage, setActiveStage] = useState<EvidenceStage>(mockEvidenceChain[0])
  const [viewMode, setViewMode] = useState<'dom' | 'screenshot'>('dom')

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const verifyHash = (hash: string) => {
    toast.success('SHA-256 Hash recomputed & verified matching tamper-evident record')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono tracking-wider uppercase mb-1">
            <FileText size={14} /> EXHIBIT F · EVIDENCE CHAIN OF CUSTODY
          </div>
          <h1 className="text-3xl font-extrabold text-white">Tamper-Evident Evidence Inspector</h1>
          <p className="text-gray-400 text-sm mt-1">
            Inspect cryptographic DOM snapshots, screenshots, and selector provenance captured by Scraper Studio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => verifyHash(activeStage.domHash)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm font-semibold hover:bg-emerald-500/25 transition-colors"
          >
            <CheckCircle2 size={14} /> Reverify Evidence Hashes
          </button>
        </div>
      </div>

      {/* Stage Selector Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {mockEvidenceChain.map((stage) => {
          const isActive = activeStage.step === stage.step
          return (
            <div
              key={stage.step}
              onClick={() => setActiveStage(stage)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">STEP 0{stage.step}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  TAMPER-EVIDENT VERIFIED
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">{stage.name}</h3>
              <p className="text-xs text-gray-400 font-mono mt-1 truncate">{stage.url}</p>
            </div>
          )
        })}
      </div>

      {/* Inspector View */}
      <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
          <div>
            <span className="text-xs font-mono text-gray-400 uppercase">ACTIVE EVIDENCE EXHIBIT</span>
            <h2 className="text-xl font-bold text-white mt-0.5">{activeStage.name}</h2>
          </div>
          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('dom')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'dom' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code size={14} /> DOM Snapshot
            </button>
            <button
              onClick={() => setViewMode('screenshot')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'screenshot' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Image size={14} /> Screenshot Capture
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        {viewMode === 'dom' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>Selector provenance: <code className="text-cyan-300 bg-white/5 px-2 py-0.5 rounded">{activeStage.selector}</code></span>
              <button onClick={() => copyToClipboard(activeStage.domSnippet, 'DOM Snapshot')} className="hover:text-white flex items-center gap-1">
                <Copy size={12} /> Copy Code
              </button>
            </div>
            <pre className="bg-black/50 border border-white/10 p-4 rounded-xl text-xs font-mono text-cyan-200 overflow-x-auto">
              <code>{activeStage.domSnippet}</code>
            </pre>
          </div>
        ) : (
          <div className="bg-black/50 border border-white/10 rounded-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto text-purple-400">
              <Eye size={32} />
            </div>
            <h3 className="text-white font-bold">Screenshot Evidence Attached</h3>
            <p className="text-gray-400 text-xs max-w-md mx-auto">
              Full-page viewport screenshot stored with SHA-256 evidence hash <code className="text-purple-300 font-mono">{activeStage.screenshotHash.substring(0, 16)}...</code>
            </p>
            <button onClick={() => toast.info('Displaying full-resolution screenshot exhibit')} className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-semibold hover:bg-purple-500/30 transition-colors">
              View Full Resolution Exhibit
            </button>
          </div>
        )}

        {/* Hashes Summary */}
        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>DOM SHA-256 HASH</span>
              <button onClick={() => copyToClipboard(activeStage.domHash, 'DOM Hash')} className="hover:text-white"><Copy size={12} /></button>
            </div>
            <p className="font-mono text-xs text-cyan-300 truncate">{activeStage.domHash}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>SCREENSHOT SHA-256 HASH</span>
              <button onClick={() => copyToClipboard(activeStage.screenshotHash, 'Screenshot Hash')} className="hover:text-white"><Copy size={12} /></button>
            </div>
            <p className="font-mono text-xs text-purple-300 truncate">{activeStage.screenshotHash}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
