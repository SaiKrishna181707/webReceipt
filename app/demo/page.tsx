'use client'

import { useState, useEffect } from 'react'
import {
  Search, AlertTriangle, Bug, Code2, HeartPulse, CheckCircle2, ChevronRight, Check, History, Layers
} from 'lucide-react'
import { TerminalLog } from '@/components/mission-control/terminal-log'
import { EvidenceVault } from '@/components/mission-control/evidence-vault'
import { PromiseDiff } from '@/components/mission-control/promise-diff'

export default function DemoPage() {
  const [step, setStep] = useState(0)
  // 0: Initial
  // 1: Journey Replay
  // 2: Break Website (Semantic Failure)
  // 3: Healing
  // 4: Healed
  // 5: Promise Diff

  const [url, setUrl] = useState('https://example-hotel-booking.com/checkout/7f29')
  const [vaultOpen, setVaultOpen] = useState(false)
  const [diffOpen, setDiffOpen] = useState(false)
  const [selectedVaultStage, setSelectedVaultStage] = useState<number>(4)
  const [logs, setLogs] = useState<any[]>([])

  const addLog = (msg: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date().toISOString(), level, message: msg }])
  }

  const runJourney = () => {
    setStep(1)
    addLog('Initializing Bright Data Browser Worker (Scraper Studio)...')
    setTimeout(() => addLog('Journey step 1: Search - Completed'), 500)
    setTimeout(() => addLog('Journey step 2: Property - Completed'), 1000)
    setTimeout(() => addLog('Journey step 3: Room - Completed'), 1500)
    setTimeout(() => addLog('Journey step 4: Checkout - Completed', 'success'), 2000)
    setTimeout(() => addLog('Canonical Deal Contract generated and hashed.', 'success'), 2500)
  }

  const breakWebsite = () => {
    setStep(2)
    addLog('Mutation Lab: Simulating CSS rename and DOM relocation on target site.', 'warn')
    setTimeout(() => {
      addLog('Collector executed successfully without CSS selector errors.', 'info')
      addLog('CONTRACT INTEGRITY FAILURE: Extracted final_total (₹8499) does not match base_price + fees + taxes (₹10147).', 'error')
    }, 800)
  }

  const triggerHeal = () => {
    setStep(3)
    addLog('Agent detecting semantic extraction drift...', 'warn')
    setTimeout(() => addLog('Triggering Bright Data Scraper Studio self-heal API...', 'info'), 1000)
    setTimeout(() => addLog('Evaluating candidate scraper on 6/6 deterministic Deal Contract checks...'), 2500)
    setTimeout(() => {
      addLog('Candidate Passed. Production scraper updated.', 'success')
      setStep(4)
    }, 4000)
  }

  const openEvidence = (stage: number) => {
    setSelectedVaultStage(stage)
    setVaultOpen(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pt-24 min-h-screen bg-black">
      
      {/* Top Controls / URL Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2 flex items-center gap-3">
          <Search size={18} className="text-gray-500 ml-2" />
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-transparent border-none outline-none text-white w-full font-mono text-sm"
          />
          <button 
            onClick={step === 0 ? runJourney : () => setStep(0)}
            className="bg-[#a855f7] hover:bg-[#9333ea] text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap"
          >
            {step === 0 ? 'Run Journey' : 'Reset'}
          </button>
        </div>

        {step > 0 && (
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={breakWebsite}
              disabled={step >= 2}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                step >= 2 ? 'bg-black text-gray-600 border-white/10 opacity-50 cursor-not-allowed' : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              }`}
            >
              <Bug size={14} /> Simulate Redesign
            </button>
            
            {step === 4 && (
              <button 
                onClick={() => setDiffOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all"
              >
                <History size={14} /> 3 Days Later
              </button>
            )}
          </div>
        )}
      </div>

      {step > 0 && (
        <div className="space-y-6 animate-fade-in-up">
          
          {/* Main Deal Summary Banner */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="text-[#a855f7]" size={20} />
                Deal Contract: 7f29
              </h2>
              <p className="text-gray-400 text-sm mt-1">Observed price increase during journey: <span className="text-rose-400 font-bold">+19.4%</span></p>
            </div>
            
            {step === 2 && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg font-mono text-sm font-bold flex items-center gap-2 animate-pulse">
                <AlertTriangle size={18} /> CONTRACT INTEGRITY FAILURE
              </div>
            )}
            {step === 3 && (
              <div className="bg-amber-500/20 border border-amber-500 text-amber-400 px-4 py-2 rounded-lg font-mono text-sm font-bold flex items-center gap-2">
                <HeartPulse size={18} className="animate-spin" /> HEALING SCRAPER...
              </div>
            )}
            {step === 4 && (
              <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-400 px-4 py-2 rounded-lg font-mono text-sm font-bold flex items-center gap-2">
                <CheckCircle2 size={18} /> VERIFIED & HEALED
              </div>
            )}
          </div>

          {/* Journey Replay Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { stage: 1, title: 'SEARCH', val: '₹8,499' },
              { stage: 2, title: 'PROPERTY', val: '₹8,499' },
              { stage: 3, title: 'ROOM', val: '₹8,499' },
            ].map(s => (
              <div key={s.stage} onClick={() => openEvidence(s.stage)} className="bg-white/5 border border-white/10 rounded-2xl p-5 cursor-pointer hover:bg-white/10 transition-all group">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-mono font-bold text-[#a855f7]">{s.title}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="text-2xl font-bold font-mono text-white mb-2">{s.val}</div>
                <div className="flex items-center text-xs font-mono text-gray-500 group-hover:text-[#a855f7] transition-colors gap-1">
                  View evidence <ChevronRight size={12} />
                </div>
              </div>
            ))}

            {/* Checkout Card (Dynamic) */}
            <div onClick={() => openEvidence(4)} className={`border rounded-2xl p-5 cursor-pointer transition-all group ${
              step === 2 ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
              : step === 3 ? 'bg-amber-500/10 border-amber-500/50'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono font-bold text-[#a855f7]">CHECKOUT</span>
                <span className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-red-500 animate-ping' : step === 3 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              </div>
              <div className={`text-2xl font-bold font-mono mb-2 ${step === 2 ? 'text-red-400 line-through' : 'text-white'}`}>
                {step === 2 ? '₹8,499' : '₹10,147'}
              </div>
              {step === 2 && (
                <div className="text-[10px] font-mono text-red-400 mb-2 font-bold uppercase">
                  Semantic Extraction Drift
                </div>
              )}
              <div className="flex items-center text-xs font-mono text-gray-500 group-hover:text-[#a855f7] transition-colors gap-1">
                View evidence <ChevronRight size={12} />
              </div>
            </div>
          </div>

          {/* Integrity Engine Explanation (when broken) */}
          {step === 2 && (
            <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-6 animate-fade-in-up">
              <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2"><Bug size={18} /> Contract Integrity Engine Log</h3>
              <div className="font-mono text-xs text-gray-300 space-y-2">
                <p>{`> Executing rule: total_arithmetic`}</p>
                <p className="text-gray-500">{`> base_price (₹8499) + mandatory_fees (₹848) + taxes (₹800)`}</p>
                <p className="text-red-400 font-bold">{`> EXPECTED: ₹10147 | EXTRACTED: ₹8499`}</p>
                <p className="text-red-400 mt-4">{`[!] Validation Failed. The scraper selector still exists, but the economic reality has mutated.`}</p>
              </div>
              <button 
                onClick={triggerHeal}
                className="mt-6 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-red-500/20"
              >
                Heal with Bright Data
              </button>
            </div>
          )}

          {/* Terminal */}
          <div className="bg-[#111113] border border-white/10 rounded-2xl overflow-hidden mt-8">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
              <Code2 size={16} className="text-[#a855f7]" />
              <span className="text-xs font-mono text-gray-400">WebReceipt Orchestrator Output</span>
            </div>
            <TerminalLog logs={logs} onClear={() => setLogs([])} />
          </div>

        </div>
      )}

      {/* Evidence Drawer */}
      <EvidenceVault 
        isOpen={vaultOpen}
        onClose={() => setVaultOpen(false)}
        selectedStage={selectedVaultStage}
      />

      {/* Promise Diff */}
      <PromiseDiff 
        isOpen={diffOpen}
        onClose={() => setDiffOpen(false)}
      />

    </div>
  )
}
