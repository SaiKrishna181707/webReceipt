'use client'

import { useState } from 'react'
import { Wand2, Play, Bug, HeartPulse, RotateCcw, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ArrowRight, Activity, Zap } from 'lucide-react'
import { toast } from 'sonner'

export default function DemoPage() {
  const [state, setState] = useState<'healthy' | 'broken' | 'healing'>('healthy')

  const handleRun = () => {
    setState('healthy')
    toast.success('Run successful · Collector returned 12 rows passing all contract checks')
  }

  const handleBreak = () => {
    setState('broken')
    toast.error('Target site restructured! Selector matched subtotal node instead of order total.')
  }

  const handleHeal = () => {
    setState('healing')
    toast('Scraper Studio generating candidate repair proposal...')
    setTimeout(() => {
      setState('healthy')
      toast.success('Preview verified against 11 contract rules! Production collector c_prod_8f2a91 recovered.')
    }, 2000)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-mono tracking-wider uppercase mb-1">
            <Wand2 size={14} /> 04 / SELF-HEALING STUDIO
          </div>
          <h1 className="text-3xl font-extrabold text-white">Break it. Heal it. Keep the Collector.</h1>
          <p className="text-gray-400 text-sm mt-1">
            A real-time interactive laboratory demonstrating DOM mutation detection, repair preview verification, and automatic deployment recovery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            <Play size={14} /> Normal Run
          </button>
          <button
            onClick={handleBreak}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/25 transition-colors"
          >
            <Bug size={14} /> Inject Drift
          </button>
          <button
            onClick={handleHeal}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <HeartPulse size={14} /> Trigger Self-Heal
          </button>
        </div>
      </div>

      {/* Collector Status Bar */}
      <div className="bg-[#131927] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              state === 'healthy'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : state === 'broken'
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
            }`}
          >
            {state === 'healthy' && <CheckCircle2 size={14} />}
            {state === 'broken' && <XCircle size={14} />}
            {state === 'healing' && <AlertTriangle size={14} />}
            {state.toUpperCase()}
          </span>
          <span className="font-mono text-xs text-gray-400">Collector ID: <code className="text-purple-300 font-bold">c_prod_8f2a91</code> (Identity preserved)</span>
        </div>
        <span className="font-mono text-xs text-gray-400">{state === 'healthy' ? '12 rows verified' : '0 valid rows'}</span>
      </div>

      {/* Interactive 2-State Visualizer */}
      <div className="grid lg:grid-cols-12 gap-8 items-center">
        {/* State 1: Before / Expected */}
        <div className="lg:col-span-5 bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono text-gray-400">01 / EXPECTED STATE</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">V1 CONTRACT</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-gray-400 block">Selector: <code>.total-price</code></span>
              <span className="text-white font-bold block">Matched ₹10,147</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-gray-400 block">Arithmetic Check</span>
              <span className="text-emerald-400 font-bold block">8499 + 848 + 800 == 10147 (PASS)</span>
            </div>
          </div>
        </div>

        {/* Center Indicator */}
        <div className="lg:col-span-2 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            {state === 'healing' ? (
              <HeartPulse className="animate-spin" size={24} />
            ) : state === 'broken' ? (
              <Bug className="text-red-400" size={24} />
            ) : (
              <ShieldCheck className="text-emerald-400" size={24} />
            )}
          </div>
        </div>

        {/* State 2: After / Drifting */}
        <div className="lg:col-span-5 bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono text-gray-400">02 / DOM DRIFT RECOVERY</span>
            <span className={`text-xs font-mono font-bold ${state === 'broken' ? 'text-red-400' : 'text-emerald-400'}`}>
              {state === 'broken' ? 'DRIFT DETECTED' : 'RECOVERY VERIFIED'}
            </span>
          </div>

          {state === 'broken' ? (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1">
                <span className="text-red-300 block font-bold">Selector matched subtotal node!</span>
                <span className="text-red-400 block">.total-price returned ₹8,499</span>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1">
                <span className="text-red-300 block font-bold font-mono">CONTRACT FAILURE</span>
                <span className="text-red-400 block">8499 + 848 + 800 = 10147 ≠ 8499</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                <span className="text-emerald-300 block font-bold">Repair Preview Passed 11/11 Checks</span>
                <span className="text-emerald-400 block">New selector: <code>[data-testid="order-total"]</code></span>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                <span className="text-emerald-300 block font-bold">Production Collector Recovered</span>
                <span className="text-emerald-400 block">12 rows collected with 100% integrity</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Card */}
      <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-bold text-white">Scraper Studio Self-Healing Pipeline</h3>
          <button onClick={() => setState('healthy')} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-mono">
            <RotateCcw size={12} /> Reset Interactive Lab
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: '01', name: 'Drift Detection', text: 'Semantic & arithmetic invariants identify silent extraction corruption.' },
            { step: '02', name: 'Proposal Generation', text: 'Scraper Studio suggests new DOM selector candidate.' },
            { step: '03', name: 'Untrusted Preview Gate', text: 'Preview is compiled into Deal Contract & run through all 11 integrity checks.' },
            { step: '04', name: 'Auto-Save Recovery', text: 'Only a valid preview is saved, triggering a fresh verified collector run.' }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-xs font-mono text-purple-400 font-bold">{item.step}</span>
              <h4 className="text-sm font-bold text-white">{item.name}</h4>
              <p className="text-xs text-gray-400">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
