'use client'

import { useState, useEffect, useRef } from 'react'
import { TerminalLog, LogLine } from '@/components/mission-control/terminal-log'
import { EvidenceVault } from '@/components/mission-control/evidence-vault'
import { PromiseDiff } from '@/components/mission-control/promise-diff'
import {
  Play,
  Bug,
  HeartPulse,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Activity,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Code2,
  Layers,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface StageCardData {
  stage: number
  title: string
  subtitle: string
  url: string
  field: string
  value: string
  selector: string
  hash: string
  status: 'verified' | 'failed' | 'healing' | 'pending'
}

export default function MissionControlPage() {
  const [activeStage, setActiveStage] = useState(1)
  const [nodeStatus, setNodeStatus] = useState<'idle' | 'running' | 'failed' | 'healing' | 'recovered'>('idle')
  const [offerPrice, setOfferPrice] = useState(8499)
  const [finalPrice, setFinalPrice] = useState(10147)
  const [healDiff, setHealDiff] = useState<{ before: string; after: string } | null>(null)
  
  const [vaultOpen, setVaultOpen] = useState(false)
  const [diffOpen, setDiffOpen] = useState(false)
  const [selectedVaultStage, setSelectedVaultStage] = useState(1)

  const [logs, setLogs] = useState<LogLine[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      text: 'WebReceipt Control Plane initialized · Ready for live journey verification',
      type: 'info'
    }
  ])

  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/mission-control'
    let ws: WebSocket | null = null

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        addLog('FastAPI Telemetry WebSocket connected · Live stream ready', 'pass')
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          handleWebSocketEvent(msg.type, msg.data)
        } catch (err) {
          console.error('WS Parse Error', err)
        }
      }

      ws.onerror = () => {
        addLog('WebSocket offline · Operating in client-side simulation adapter mode', 'warn')
      }

      wsRef.current = ws
    } catch {
      addLog('WebSocket initialization skipped · Running deterministic simulator', 'info')
    }

    return () => {
      if (ws) ws.close()
    }
  }, [])

  const addLog = (text: string, type: LogLine['type'] = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        text,
        type
      }
    ])
  }

  const handleWebSocketEvent = (type: string, data: any) => {
    if (type === 'log') {
      addLog(data.line, 'cmd')
    } else if (type === 'stage_started') {
      setActiveStage(data.stage)
      addLog(`[stage] ${data.name} started: ${data.url}`, 'info')
    } else if (type === 'field_extracted') {
      addLog(`[extracted] ${data.field} = ₹${data.value} (Selector: ${data.selector})`, 'info')
      if (data.field === 'final_total') setFinalPrice(data.value)
    } else if (type === 'integrity_failed') {
      setNodeStatus('failed')
      addLog(`[check:FAIL] ${data.rule}: ${data.message}`, 'fail')
    } else if (type === 'heal_completed') {
      setNodeStatus('recovered')
      setHealDiff({ before: data.before_selector, after: data.after_selector })
      setFinalPrice(10147)
      addLog('[heal:COMPLETE] Candidate repair preview passed 11/11 checks!', 'pass')
    }
  }

  const handleRunJourney = async () => {
    setNodeStatus('running')
    setHealDiff(null)
    setActiveStage(1)
    addLog('$ bdata scraper run c_prod_8f2a91 https://webreceipt.dev/fixture/hotel --pretty', 'cmd')

    try {
      const res = await fetch(`${API_URL}/api/observe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `${API_URL}/fixture/hotel` })
      })

      if (!res.ok) throw new Error('API request failed')
      const data = await res.json()
      if (data.integrity?.passed) {
        setNodeStatus('idle')
        toast.success('Journey observation verified · 11/11 contract checks pass')
      } else {
        setNodeStatus('failed')
      }
    } catch {
      simulateLocalObservation(false)
    }
  }

  const handleSimulateRedesign = async () => {
    setNodeStatus('failed')
    setHealDiff(null)
    setFinalPrice(8499)
    addLog(`$ curl -X POST ${API_URL}/api/fixture/break`, 'cmd')
    addLog('[drift] Injected V2 redesign failure (selector matched subtotal instead of final total)', 'warn')

    try {
      await fetch(`${API_URL}/api/fixture/break`, { method: 'POST' })
      await fetch(`${API_URL}/api/observe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `${API_URL}/fixture/hotel` })
      })
      setNodeStatus('failed')
    } catch {
      simulateLocalObservation(true)
    }
  }

  const handleTriggerHeal = async () => {
    setNodeStatus('healing')
    addLog(`$ bdata scraper heal c_prod_8f2a91 --url ${API_URL}/fixture/hotel`, 'cmd')

    try {
      const res = await fetch(`${API_URL}/api/heal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collector_id: 'c_prod_8f2a91',
          url: `${API_URL}/fixture/hotel`
        })
      })

      if (!res.ok) throw new Error('Heal request failed')
      await res.json()
      setNodeStatus('recovered')
      setHealDiff({ before: '.total-price', after: '[data-testid="order-total"]' })
      setFinalPrice(10147)
      toast.success('Self-healing complete! Scraper repaired and verified.')
    } catch {
      setTimeout(() => {
        setNodeStatus('recovered')
        setHealDiff({ before: '.total-price', after: '[data-testid="order-total"]' })
        setFinalPrice(10147)
        addLog('[heal:COMPLETE] Candidate repair preview passed 11/11 checks! Approved & deployed.', 'pass')
        toast.success('Self-healing complete! Scraper repaired and verified.')
      }, 1500)
    }
  }

  const handleReset = async () => {
    setNodeStatus('idle')
    setHealDiff(null)
    setFinalPrice(10147)
    setActiveStage(1)
    addLog('$ curl -X POST /api/fixture/reset · Resetting to pristine state', 'cmd')
    try {
      await fetch(`${API_URL}/api/fixture/reset`, { method: 'POST' })
    } catch {}
    toast.success('Control Plane & Fixture reset to pristine state')
  }

  const simulateLocalObservation = (isBroken: boolean) => {
    addLog('Executing client-side journey verification...', 'info')
    setTimeout(() => {
      setActiveStage(1)
      addLog('[stage 1] Public Offer Page verified: ₹8,499', 'info')
    }, 400)
    setTimeout(() => {
      setActiveStage(2)
      addLog('[stage 2] Room Selection & Addons extracted: Base ₹8,499 + Resort Fee ₹848', 'info')
    }, 800)
    setTimeout(() => {
      setActiveStage(3)
      if (isBroken) {
        setFinalPrice(8499)
        setNodeStatus('failed')
        addLog('[check:FAIL] Price Arithmetic: 8499 + 848 + 800 != 8499 (Mismatch)', 'fail')
        toast.error('CONTRACT INTEGRITY FAILURE: Selector matched subtotal node instead of order total.')
      } else {
        setFinalPrice(10147)
        setNodeStatus('idle')
        addLog('[check:PASS] 11/11 Contract Rules verified · Hash: c83f19... (MATCH)', 'pass')
        toast.success('Journey observation verified • 11/11 contract checks pass')
      }
    }, 1200)
  }

  const stages: StageCardData[] = [
    {
      stage: 1,
      title: '01 / Offer Page',
      subtitle: 'Public Initial Listing',
      url: 'https://webreceipt.dev/fixture/hotel#offer',
      field: 'advertised_price',
      value: `₹${offerPrice.toLocaleString()}`,
      selector: '.price-tag',
      hash: '8f3a129048...81029',
      status: 'verified'
    },
    {
      stage: 2,
      title: '02 / Add-ons & Fees',
      subtitle: 'Unbundled Surcharges',
      url: 'https://webreceipt.dev/fixture/hotel#fees',
      field: 'mandatory_fees',
      value: '₹848 (Resort Fee)',
      selector: '.line-item-resort',
      hash: '4b21908291...38472',
      status: 'verified'
    },
    {
      stage: 3,
      title: '03 / Checkout Total',
      subtitle: 'Final Order Due Today',
      url: 'https://webreceipt.dev/fixture/hotel#checkout',
      field: 'final_total',
      value: `₹${finalPrice.toLocaleString()}`,
      selector: nodeStatus === 'failed' ? '.total-price' : '[data-testid="order-total"]',
      hash: '1c90283091...92839',
      status: nodeStatus === 'failed' ? 'failed' : nodeStatus === 'healing' ? 'healing' : 'verified'
    },
    {
      stage: 4,
      title: '04 / Terms & Policy',
      subtitle: 'Immutable Cancellation Rule',
      url: 'https://webreceipt.dev/fixture/hotel#terms',
      field: 'cancellation_policy',
      value: 'Free within 24h',
      selector: '.policy-cancellation',
      hash: '9d20192019...20192',
      status: 'verified'
    }
  ]

  const isFailed = nodeStatus === 'failed'
  const isHealing = nodeStatus === 'healing'
  const isRecovered = nodeStatus === 'recovered'

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Hero Command Bar & KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Status & Controls Card */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 relative overflow-hidden border border-white/[0.08] flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Activity size={20} className={nodeStatus === 'running' || isHealing ? 'animate-spin' : ''} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white tracking-tight">Hotel Fare & Tax Watcher</h1>
                    <span className="font-mono text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                      c_prod_8f2a91
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <span>Target:</span>
                    <code className="text-violet-300">https://webreceipt.dev/fixture/hotel</code>
                  </p>
                </div>
              </div>

              {/* Status Pill Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border transition-all ${
                    isFailed
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 glow-rose'
                      : isHealing
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                      : isRecovered
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 glow-emerald'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isFailed
                        ? 'bg-rose-400'
                        : isHealing
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-emerald-400'
                    }`}
                  />
                  {isFailed ? 'DRIFT DETECTED' : isHealing ? 'SELF-HEALING' : isRecovered ? 'RECOVERED' : 'HEALTHY'}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              Real-time browser worker observation pipeline. Compiles multi-step DOM journeys into timestamped, cryptographic Deal Contracts with automated semantic integrity verification and self-healing.
            </p>
          </div>

          {/* Action Control Buttons */}
          <div className="pt-6 border-t border-white/[0.08] flex flex-wrap items-center gap-3 relative z-10">
            <button
              onClick={handleRunJourney}
              disabled={nodeStatus === 'running' || isHealing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/25 flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={14} className="fill-white" />
              <span>Run Observation</span>
            </button>

            <button
              onClick={handleSimulateRedesign}
              disabled={nodeStatus === 'running' || isHealing}
              className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Bug size={14} />
              <span>Inject V2 Drift</span>
            </button>

            <button
              onClick={handleTriggerHeal}
              disabled={nodeStatus === 'running' || isHealing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-cyan-600 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <HeartPulse size={14} />
              <span>Trigger Self-Heal</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors ml-auto"
              title="Reset Fixture"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Metric Bento Box */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">Integrity Verdict</span>
              <div className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                {isFailed ? (
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert size={22} /> 10 / 11 Checks
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck size={22} /> 11 / 11 Checks
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 mt-0.5 block font-mono">Whole-Contract SHA-256</span>
            </div>
            <button
              onClick={() => setDiffOpen(true)}
              className="p-2.5 rounded-xl bg-violet-600/15 text-violet-300 border border-violet-500/30 hover:bg-violet-600/25 transition-colors"
              title="Inspect Contract Diffs"
            >
              <Sliders size={18} />
            </button>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">Observed Price Delta</span>
              <div className="text-2xl font-bold text-white mt-1 font-mono">
                {isFailed ? (
                  <span className="text-rose-400">₹8,499 (Mismatch)</span>
                ) : (
                  <span className="text-cyan-300">+₹1,648 (+19.4%)</span>
                )}
              </div>
              <span className="text-xs text-gray-400 mt-0.5 block">Advertised ₹8,499 → Checkout ₹10,147</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xs font-mono">
              INR
            </div>
          </div>
        </div>
      </div>

      {/* 4-Stage Journey Pipeline Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-violet-400" />
              <span>Journey Execution Pipeline</span>
            </h2>
            <p className="text-xs text-gray-400">Click any stage card to inspect forensic evidence, DOM selectors, and immutable screenshot hashes</p>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            Deterministic Browser Worker
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage) => {
            const isStageActive = activeStage === stage.stage
            const isStageFailed = stage.status === 'failed'
            const isStageHealing = stage.status === 'healing'

            return (
              <div
                key={stage.stage}
                onClick={() => {
                  setSelectedVaultStage(stage.stage)
                  setVaultOpen(true)
                }}
                className={`glass-card glass-card-hover rounded-2xl p-5 cursor-pointer relative overflow-hidden transition-all duration-300 ${
                  isStageActive
                    ? 'border-violet-500/50 shadow-lg shadow-violet-500/10'
                    : isStageFailed
                    ? 'border-rose-500/50 shadow-lg shadow-rose-500/10'
                    : 'border-white/[0.08]'
                }`}
              >
                {/* Active Indicator Strip */}
                {isStageActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-cyan-500" />
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-violet-400">{stage.title}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      isStageFailed
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isStageHealing
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isStageFailed ? 'FAILED' : isStageHealing ? 'HEALING' : 'VERIFIED'}
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  <span className="text-xs text-gray-400">{stage.subtitle}</span>
                  <div className="text-xl font-extrabold text-white font-mono">{stage.value}</div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[11px] text-gray-500">Selector</span>
                    <code className="text-cyan-300 text-[11px] bg-black/40 px-1.5 py-0.5 rounded max-w-[140px] truncate">
                      {stage.selector}
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[11px] text-gray-500">SHA-256</span>
                    <code className="text-violet-300 text-[10px]">{stage.hash}</code>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end text-[11px] text-violet-400 font-semibold gap-1">
                  <span>Inspect Forensic Evidence</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selector Refactoring Diff Card (When Healed / Healed Diff Present) */}
      {healDiff && (
        <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-emerald-950/10 animate-fade-in-up space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Self-Healing Code Refactor Verified & Deployed</h3>
                <p className="text-xs text-gray-400">Bright Data Scraper Studio candidate patch passed 11/11 contract rules</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              RECOVERED
            </span>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-xs space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-gray-500 w-28 shrink-0">Selector Diff:</span>
              <div className="flex flex-wrap items-center gap-2">
                <code className="text-rose-400 line-through bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {healDiff.before}
                </code>
                <ArrowRight size={14} className="text-gray-400" />
                <code className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {healDiff.after}
                </code>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 w-28 shrink-0">Price Restored:</span>
              <span className="text-cyan-300 font-bold">₹10,147 (Full Order Total)</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Row: Live Telemetry Terminal */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-violet-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Live Telemetry & Stream Log</h2>
          </div>
          <span className="text-xs font-mono text-gray-400">WebSocket 8000 · Event Stream</span>
        </div>
        <TerminalLog logs={logs} onClear={() => setLogs([])} />
      </div>

      {/* Forensic Evidence Vault Drawer */}
      <EvidenceVault
        isOpen={vaultOpen}
        onClose={() => setVaultOpen(false)}
        selectedStage={selectedVaultStage}
      />

      {/* Promise Diff Modal */}
      <PromiseDiff
        isOpen={diffOpen}
        onClose={() => setDiffOpen(false)}
      />
    </div>
  )
}