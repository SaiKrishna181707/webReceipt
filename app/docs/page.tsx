'use client'

import { useState } from 'react'
import { BookOpen, Copy, Code2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function DocsPage() {
  const [copied, setCopied] = useState(false)

  const handleCopySnippet = (code: string) => {
    navigator.clipboard?.writeText(code)
    setCopied(true)
    toast.success('Snippet copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const triggerSnippet = `curl -X POST https://api.brightdata.com/dca/trigger \\
  -H "Authorization: Bearer $BRIGHT_DATA_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"collector_id": "c_prod_8f2a91", "queue_next": 1}'`

  const verifySnippet = `npm run verify:receipt -- examples/webreceipt.json`

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-purple-400 text-xs font-mono tracking-wider uppercase mb-1">
          <BookOpen size={14} /> 05 / DEVELOPER SURFACE
        </div>
        <h1 className="text-3xl font-extrabold text-white">API Reference & Receipt Verification</h1>
        <p className="text-gray-400 text-sm mt-1">
          Integrate WebReceipt into your data pipelines, trigger Browser Workers via API, and verify receipt artifacts independently.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Endpoints & Quickstart */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quickstart 1: Trigger Collector */}
          <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-purple-400 uppercase font-bold">API ENDPOINT</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Trigger Scraper Studio Worker</h3>
              </div>
              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded font-mono text-xs font-bold">POST</span>
            </div>

            <pre className="bg-black/50 border border-white/10 p-4 rounded-xl text-xs font-mono text-cyan-200 overflow-x-auto">
              <code>{triggerSnippet}</code>
            </pre>

            <button
              onClick={() => handleCopySnippet(triggerSnippet)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors"
            >
              <Copy size={12} /> {copied ? 'Copied!' : 'Copy cURL Command'}
            </button>
          </div>

          {/* Quickstart 2: Receipt Verification CLI */}
          <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase font-bold">CLI RUNBOOK</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Portable Receipt Verifier</h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded font-mono text-xs font-bold">CLI</span>
            </div>

            <p className="text-xs text-gray-300">
              Verify exported <code>webreceipt-*.json</code> files independently without trusting a stored UI verdict:
            </p>

            <pre className="bg-black/50 border border-white/10 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto">
              <code>{verifySnippet}</code>
            </pre>

            <button
              onClick={() => handleCopySnippet(verifySnippet)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors"
            >
              <Copy size={12} /> Copy CLI Command
            </button>
          </div>
        </div>

        {/* Right Column: Key Concepts */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Developer Principles</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">01. Canonical Deal Contract</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Every web journey is compiled into schema v1.1.0 with normalized prices, currency, breakdown, and whole-contract hash.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-500/20 text-cyan-300 rounded-xl">
                  <Code2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">02. Bright Data AI Flow</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Self-healing preview verification gates ensure candidate repairs are only saved if 100% of invariants pass.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">03. Cryptographic Provenance</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Tamper-evident DOM snapshots and viewport screenshots are hashed with SHA-256 and stored in the receipt artifact.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
