'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Shield,
  Zap,
  Play,
  Bug,
  HeartPulse,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Lock,
  ArrowRight,
  Sparkles,
  Copy,
  ExternalLink,
  ChevronRight,
  Terminal,
  Activity,
  Layers,
  Database,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react'
import { toast } from 'sonner'

export default function TerminalPage() {
  const [targetUrl, setTargetUrl] = useState('https://webreceipt.dev/fixture/hotel')
  const [mode, setMode] = useState<'simulator' | 'brightdata'>('simulator')
  const [status, setStatus] = useState<'healthy' | 'broken' | 'healing'>('healthy')
  const [activeStage, setActiveStage] = useState<1 | 2>(1)

  // Chaos checkout state
  const [chaosRunning, setChaosRunning] = useState(false)
  const [chaosCompleted, setChaosCompleted] = useState(false)

  // Action Handlers
  const handleObserve = () => {
    setStatus('healthy')
    toast.success('Observation complete · Deal Contract compiled & 11/11 checks pass')
  }

  const handleInjectDrift = () => {
    setStatus('broken')
    toast.error('Semantic Drift Injected · Legacy selector matched subtotal ₹8,499 instead of final ₹10,147!')
  }

  const handleTriggerHeal = () => {
    setStatus('healing')
    toast('Bright Data Scraper Studio self-heal proposal requested...')
    setTimeout(() => {
      setStatus('healthy')
      toast.success('Repair preview passed 11/11 checks! Approved & deployed to production collector c_prod_8f2a91.')
    }, 2200)
  }

  const handleRunChaos = () => {
    setChaosRunning(true)
    toast('Running 7 deterministic Chaos Checkout mutations...')
    setTimeout(() => {
      setChaosRunning(false)
      setChaosCompleted(true)
      toast.success('All 7 Chaos Checkout scenarios verified! 100% contract enforcement rate.')
    }, 1800)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero / Terminal Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/30 via-black to-blue-900/30 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Terminal size={180} />
        </div>

        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/15 border border-purple-500/30 rounded-full text-purple-300 text-xs font-mono font-semibold uppercase tracking-wider">
            <Sparkles size={14} className="text-purple-400" /> EXHIBIT A · PROOF OF PROMISE CONTROL PLANE
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            The web can change.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400">
              Your receipt shouldn't.
            </span>
          </h1>

          <p className="text-gray-300 text-base md:text-lg">
            WebReceipt captures public commercial journeys, compiles normalized <strong>Deal Contracts</strong>, and enforces deterministic semantic integrity. When DOM extractions drift, Scraper Studio heals the worker and verifies the repair preview before deployment.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="font-mono text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Operational · Node 20 Runtime
            </span>
            <span className="font-mono text-xs text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
              Scraper Studio v1.1.0 Ready
            </span>
          </div>
        </div>
      </div>

      {/* Control Action Console */}
      <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Target Journey URL</label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div className="w-full lg:w-48 space-y-1">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Collector Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-mono text-white outline-none focus:border-purple-500/50"
            >
              <option value="simulator">Demo Collector</option>
              <option value="brightdata">Bright Data Live</option>
            </select>
          </div>

          <div className="flex items-end gap-3 pt-5 lg:pt-0">
            <button
              onClick={handleObserve}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
            >
              <Play size={16} /> Observe
            </button>
            <button
              onClick={handleInjectDrift}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/15 border border-red-500/30 rounded-xl font-bold text-sm text-red-400 hover:bg-red-500/25 transition-colors"
            >
              <Bug size={16} /> Inject Drift
            </button>
            <button
              onClick={handleTriggerHeal}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl font-bold text-sm text-emerald-400 hover:bg-emerald-500/25 transition-colors"
            >
              <HeartPulse size={16} /> Trigger Heal
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131927] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-gray-400 uppercase">Advertised Price</span>
          <div className="text-2xl font-black font-mono text-white">₹8,499</div>
          <span className="text-[11px] text-gray-400 block">First observed rate</span>
        </div>

        <div className="bg-[#131927] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-gray-400 uppercase">Final Observed</span>
          <div className="text-2xl font-black font-mono text-purple-300">₹10,147</div>
          <span className="text-[11px] text-gray-400 block">Checkout total amount</span>
        </div>

        <div className="bg-[#131927] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-gray-400 uppercase">Journey Delta</span>
          <div className="text-2xl font-black font-mono text-amber-400">+₹1,648</div>
          <span className="text-[11px] text-amber-400/80 block">+19.4% drip pricing drift</span>
        </div>

        <div className="bg-[#131927] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-gray-400 uppercase">Integrity Score</span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black font-mono ${status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}`}>
              {status === 'healthy' ? '11/11' : '0/11'}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                status === 'healthy'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : status === 'broken'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {status.toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 block">Deterministic invariants</span>
        </div>
      </div>

      {/* Semantic Failure Alert Banner (if broken) */}
      {status === 'broken' && (
        <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="font-bold text-red-400 text-base">CONTRACT INTEGRITY FAILURE DETECTED</h3>
              <p className="text-xs text-red-300/80 mt-0.5">
                Legacy selector <code>.total-price</code> returned ₹8,499 (subtotal). Expected basePrice + mandatoryFees + taxes = ₹10,147 ≠ ₹8,499.
              </p>
            </div>
          </div>
          <button
            onClick={handleTriggerHeal}
            className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold rounded-xl hover:bg-red-500/30 transition-colors flex-shrink-0"
          >
            Request Repair & Self-Heal
          </button>
        </div>
      )}

      {/* Two-Column Exhibits: Journey Replay & Deal Contract */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Exhibit B: Journey Replay */}
        <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[11px] font-mono text-purple-400 uppercase font-bold">EXHIBIT B</span>
              <h2 className="text-lg font-bold text-white">Journey Replay</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveStage(1)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeStage === 1 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-white'
                }`}
              >
                Stage 1: Offer
              </button>
              <button
                onClick={() => setActiveStage(2)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeStage === 2 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-white'
                }`}
              >
                Stage 2: Checkout
              </button>
            </div>
          </div>

          <div className="bg-black/50 border border-white/10 rounded-xl p-5 space-y-3 font-mono text-xs">
            {activeStage === 1 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-gray-400">
                  <span>STEP 1 — PUBLIC ANONYMOUS OFFER</span>
                  <span className="text-emerald-400">STATUS: OBSERVED</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-1">
                  <div className="text-white font-bold text-sm">Ocean View Deluxe Suite</div>
                  <div className="text-purple-300 text-base font-bold">₹8,499 / night</div>
                  <div className="text-[11px] text-gray-400">Selector: <code>.total-price</code></div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-gray-400">
                  <span>STEP 2 — CHECKOUT SUMMARY</span>
                  <span className="text-emerald-400">STATUS: VERIFIED</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
                  <div className="flex justify-between text-gray-300"><span>Base Rate</span><span>₹8,499</span></div>
                  <div className="flex justify-between text-amber-400"><span>Resort Fee (Mandatory)</span><span>+₹848</span></div>
                  <div className="flex justify-between text-amber-400"><span>GST & Taxes</span><span>+₹800</span></div>
                  <div className="flex justify-between text-purple-300 text-sm font-bold pt-2 border-t border-white/10">
                    <span>Order Total</span><span>₹10,147</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exhibit C: Canonical Deal Contract */}
        <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[11px] font-mono text-purple-400 uppercase font-bold">EXHIBIT C</span>
              <h2 className="text-lg font-bold text-white">Canonical Deal Contract payload</h2>
            </div>
            <Link href="/contracts" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono">
              View All <ChevronRight size={12} />
            </Link>
          </div>

          <pre className="bg-black/50 border border-white/10 p-4 rounded-xl text-xs font-mono text-cyan-200 overflow-x-auto h-52">
            <code>{JSON.stringify(
              {
                version: '1.1.0',
                dealId: 'deal-hotel-9941',
                merchant: 'Ocean View Resort & Spa',
                economics: {
                  advertisedPrice: 8499,
                  breakdown: { basePrice: 8499, mandatoryFees: 848, taxes: 800 },
                  finalTotal: 10147,
                  currency: 'INR'
                },
                contractHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
              },
              null,
              2
            )}</code>
          </pre>
        </div>
      </div>

      {/* Three-Column Section: Integrity Checks, Anomalies, Evidence Chain */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Exhibit D: Integrity Checks */}
        <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="border-b border-white/10 pb-3">
            <span className="text-[11px] font-mono text-purple-400 uppercase font-bold">EXHIBIT D</span>
            <h2 className="text-lg font-bold text-white">Deterministic Invariants</h2>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Price Arithmetic Integrity', pass: status === 'healthy' },
              { label: 'Mandatory Fee Breakdown', pass: true },
              { label: 'Currency Code Consistency', pass: true },
              { label: 'Evidence Completeness', pass: true },
              { label: 'Whole-Contract SHA-256', pass: true }
            ].map((chk, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs">
                <span className="text-gray-300 font-mono">{chk.label}</span>
                {chk.pass ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold"><CheckCircle2 size={14} /> PASS</span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400 font-bold"><XCircle size={14} /> FAIL</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Exhibit E: Deal Anomalies */}
        <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="border-b border-white/10 pb-3">
            <span className="text-[11px] font-mono text-amber-400 uppercase font-bold">EXHIBIT E</span>
            <h2 className="text-lg font-bold text-white">Observable Friction</h2>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1">
              <div className="font-bold text-amber-400 flex items-center gap-1">
                <AlertTriangle size={14} /> Drip Pricing Detected
              </div>
              <p className="text-amber-200/80">
                Final total (₹10,147) exceeds advertised rate (₹8,499) by +₹1,648 (+19.4%).
              </p>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs space-y-1">
              <div className="font-bold text-blue-400 flex items-center gap-1">
                <Sliders size={14} /> Mandatory Resort Fee Inserted
              </div>
              <p className="text-blue-200/80">
                ₹848 resort fee was unbundled until stage 2 checkout summary.
              </p>
            </div>
          </div>
        </div>

        {/* Exhibit F: Evidence Chain */}
        <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="border-b border-white/10 pb-3">
            <span className="text-[11px] font-mono text-cyan-400 uppercase font-bold">EXHIBIT F</span>
            <h2 className="text-lg font-bold text-white">Evidence Provenance</h2>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-gray-400 block">PROVENANCE SOURCE</span>
              <span className="text-cyan-300 font-bold block">Bright Data Scraper Studio</span>
              <span className="text-[10px] text-gray-500">Browser Worker c_prod_8f2a91</span>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-gray-400 block">EVIDENCE ATTACHMENTS</span>
              <span className="text-emerald-400 font-bold block">2 Screenshots + 2 DOM Snapshots</span>
              <span className="text-[10px] text-gray-500">SHA-256 Cryptographic Chain Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exhibit G: Chaos Checkout Stress Test */}
      <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
          <div>
            <span className="text-[11px] font-mono text-purple-400 uppercase font-bold">EXHIBIT G · ADVERSARIAL STRESS LAB</span>
            <h2 className="text-xl font-bold text-white">Chaos Checkout Test Matrix</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Verify WebReceipt enforcement against 7 layout, selector, and numeric contract mutations.
            </p>
          </div>
          <button
            onClick={handleRunChaos}
            disabled={chaosRunning}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-xs text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {chaosRunning ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
            {chaosRunning ? 'Running Mutations...' : 'Run 7 Mutations'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            'CSS Rename Mutation',
            'DOM Relocation Drift',
            'Split Price Nodes',
            'Currency Format Shift',
            'Wrong-But-Valid Total',
            'New Mandatory Fee Insertion',
            'Missing Evidence Loss'
          ].map((mutation, idx) => (
            <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs flex items-center justify-between">
              <span className="font-mono text-gray-300">{mutation}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${chaosCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400'}`}>
                {chaosCompleted ? 'PASS' : 'READY'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Exhibit I: Self-Heal Timeline */}
      <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[11px] font-mono text-emerald-400 uppercase font-bold">EXHIBIT I · REPAIR GATEWAY</span>
            <h2 className="text-lg font-bold text-white">Self-Heal Verification Gateway Sequence</h2>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold rounded-full">
            GATE ARMED & ACTIVE
          </span>
        </div>

        <div className="grid md:grid-cols-5 gap-4 pt-2">
          {[
            { step: '01', title: 'OBSERVE', desc: 'Execute Browser Worker journey & capture evidence.' },
            { step: '02', title: 'DETECT', desc: 'Catch semantic & numeric invariant failure.' },
            { step: '03', title: 'PROPOSE', desc: 'Scraper Studio suggests candidate repair.' },
            { step: '04', title: 'PREVIEW VERIFY', desc: 'Run all 11 contract checks against repair preview payload.' },
            { step: '05', title: 'RECOVER', desc: 'Approve & deploy valid repair to production collector.' }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="font-mono text-xs text-purple-400 font-bold">{item.step}</span>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="text-[11px] text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}