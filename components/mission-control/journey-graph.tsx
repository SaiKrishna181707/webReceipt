'use client'

import { useState } from 'react'
import { CheckCircle2, ShieldCheck, Zap } from 'lucide-react'

interface JourneyGraphProps {
  activeStage: number
  nodeStatus: 'idle' | 'running' | 'failed' | 'healing' | 'recovered'
  offerPrice: number
  finalPrice: number
  healDiff: { before: string; after: string } | null
  onNodeClick: (stage: number) => void
}

export function JourneyGraph({
  activeStage,
  nodeStatus,
  offerPrice,
  finalPrice,
  healDiff,
  onNodeClick
}: JourneyGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null)

  const isFailed = nodeStatus === 'failed'
  const isHealing = nodeStatus === 'healing'
  const isRecovered = nodeStatus === 'recovered'

  return (
    <div className="relative w-full h-[440px] bg-[#0d1320] border border-white/10 rounded-2xl p-6 overflow-hidden flex flex-col justify-between select-none">
      {/* Background Matrix Grid & Scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f293d_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Zap size={14} className="text-cyan-400 animate-pulse" /> MISSION CONTROL · JOURNEY GRAPH
          </div>
          <h2 className="text-xl font-bold text-white mt-0.5">Live Journey Topology</h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isFailed
                  ? 'bg-red-400 animate-ping'
                  : isHealing
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            {isFailed
              ? 'INTEGRITY DRIFT DETECTED'
              : isHealing
              ? 'REPAIR BEAM ENGAGED'
              : 'REAL-TIME STREAMING'}
          </span>
        </div>
      </div>

      {/* Main SVG Canvas */}
      <div className="relative flex-1 my-4 flex items-center justify-center">
        <svg className="w-full h-full max-w-2xl overflow-visible" viewBox="0 0 600 200">
          <defs>
            {/* Gradient Line */}
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
            </linearGradient>

            {/* Glowing Lasers */}
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connecting Track Paths */}
          <path
            d="M 80 100 L 220 100 L 380 100 L 520 100"
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="3"
            strokeDasharray="6 6"
            className="animate-pulse"
          />

          {/* REPAIR BEAM ANIMATION (Laser beam during healing) */}
          {isHealing && (
            <path
              d="M 380 100 L 550 -40"
              fill="none"
              stroke="#a855f7"
              strokeWidth="4"
              filter="url(#neonGlow)"
              className="animate-pulse"
            />
          )}

          {/* STAGE 1 NODE: Public Offer */}
          <g
            transform="translate(80, 100)"
            className="cursor-pointer transition-transform hover:scale-110"
            onClick={() => onNodeClick(1)}
            onMouseEnter={() => setHoveredNode(1)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <circle
              r="24"
              className="fill-[#131927] stroke-cyan-400 stroke-2"
              filter="url(#neonGlow)"
            />
            <circle r="8" className="fill-cyan-400 animate-pulse" />
            <text y="42" textAnchor="middle" className="fill-gray-300 font-mono text-[11px] font-bold">
              01 / Offer Page
            </text>

            {/* Floating Price Tag */}
            <g transform="translate(0, -36)">
              <rect x="-35" y="-12" width="70" height="22" rx="6" className="fill-cyan-500/20 stroke-cyan-500/40" />
              <text textAnchor="middle" y="3" className="fill-cyan-300 font-mono text-[11px] font-bold">
                ₹{offerPrice}
              </text>
            </g>
          </g>

          {/* STAGE 2 NODE: Room Selection */}
          <g
            transform="translate(230, 100)"
            className="cursor-pointer transition-transform hover:scale-110"
            onClick={() => onNodeClick(2)}
          >
            <circle r="20" className="fill-[#131927] stroke-purple-400 stroke-2" />
            <circle r="6" className="fill-purple-400" />
            <text y="42" textAnchor="middle" className="fill-gray-300 font-mono text-[11px] font-bold">
              02 / Room Choice
            </text>
          </g>

          {/* STAGE 3 NODE: Checkout Summary (THE NODE THAT FRACTURES / HEALS) */}
          <g
            transform="translate(380, 100)"
            className="cursor-pointer transition-transform hover:scale-110"
            onClick={() => onNodeClick(3)}
          >
            {/* Outer Glow Ring */}
            <circle
              r="30"
              className={`${
                isFailed
                  ? 'fill-red-500/20 stroke-red-500 stroke-2 animate-ping'
                  : isHealing
                  ? 'fill-amber-500/20 stroke-amber-400 stroke-2 animate-pulse'
                  : 'fill-emerald-500/20 stroke-emerald-400 stroke-2'
              }`}
              filter="url(#neonGlow)"
            />

            {/* Glitch Fracture Effect when Failed */}
            {isFailed ? (
              <g className="animate-bounce">
                <circle r="22" className="fill-red-900/80 stroke-red-500 stroke-2" />
                <text textAnchor="middle" y="5" className="fill-red-400 font-black text-sm">
                  !
                </text>
              </g>
            ) : (
              <circle r="12" className={isHealing ? 'fill-amber-400 animate-spin' : 'fill-emerald-400'} />
            )}

            <text y="48" textAnchor="middle" className="fill-gray-300 font-mono text-[11px] font-bold">
              03 / Checkout Summary
            </text>

            {/* Floating Price & Status Badge */}
            <g transform="translate(0, -42)">
              <rect
                x="-45"
                y="-14"
                width="90"
                height="26"
                rx="6"
                className={
                  isFailed
                    ? 'fill-red-500/30 stroke-red-500/60'
                    : isHealing
                    ? 'fill-amber-500/30 stroke-amber-500/60'
                    : 'fill-emerald-500/30 stroke-emerald-500/60'
                }
              />
              <text
                textAnchor="middle"
                y="3"
                className={
                  isFailed
                    ? 'fill-red-300 font-mono text-[11px] font-black'
                    : isHealing
                    ? 'fill-amber-300 font-mono text-[11px] font-black'
                    : 'fill-emerald-300 font-mono text-[11px] font-black'
                }
              >
                ₹{finalPrice}
              </text>
            </g>
          </g>

          {/* STAGE 4 NODE: Public Terms */}
          <g transform="translate(520, 100)" className="cursor-pointer transition-transform hover:scale-110" onClick={() => onNodeClick(4)}>
            <circle r="20" className="fill-[#131927] stroke-gray-500 stroke-2" />
            <circle r="6" className="fill-gray-400" />
            <text y="42" textAnchor="middle" className="fill-gray-400 font-mono text-[11px] font-bold">
              04 / Terms
            </text>
          </g>
        </svg>
      </div>

      {/* Selector Diff Tooltip (when healed) */}
      {healDiff && (
        <div className="relative z-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs font-mono animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>
              Selector Refactored:{' '}
              <code className="text-red-400 line-through bg-black/40 px-1.5 py-0.5 rounded">{healDiff.before}</code>
              {' → '}
              <code className="text-emerald-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">{healDiff.after}</code>
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase px-2 py-0.5 bg-emerald-500/20 rounded">
            RECOVERED
          </span>
        </div>
      )}

      {/* Footer Info */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-gray-500 pt-2 border-t border-white/10">
        <span>CLICK ANY NODE FOR FORENSIC EVIDENCE VAULT</span>
        <span>BRIGHT DATA BROWSER WORKER TELEMETRY</span>
      </div>
    </div>
  )
}
