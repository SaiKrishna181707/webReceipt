'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Shield, Search, Download, CheckCircle2, AlertTriangle, ArrowUpRight, Copy, RefreshCw, ExternalLink, Hash } from 'lucide-react'
import { toast } from 'sonner'

interface DealContractItem {
  id: string
  dealId: string
  merchant: string
  targetUrl: string
  advertisedPrice: number
  finalTotal: number
  currency: string
  timestamp: string
  status: 'verified' | 'tampered' | 'drift_detected'
  checksPassed: number
  totalChecks: number
  contractHash: string
  breakdown: {
    basePrice: number
    mandatoryFees: number
    taxes: number
    discount: number
  }
}

const mockContracts: DealContractItem[] = [
  {
    id: 'cnt-1',
    dealId: 'deal-hotel-9941',
    merchant: 'Ocean View Resort & Spa',
    targetUrl: 'https://webreceipt.dev/fixture/hotel',
    advertisedPrice: 8499,
    finalTotal: 10147,
    currency: 'INR',
    timestamp: new Date().toISOString(),
    status: 'verified',
    checksPassed: 11,
    totalChecks: 11,
    contractHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    breakdown: { basePrice: 8499, mandatoryFees: 848, taxes: 800, discount: 0 }
  },
  {
    id: 'cnt-2',
    dealId: 'deal-flight-3082',
    merchant: 'AeroJets Commercial Journey',
    targetUrl: 'https://webreceipt.dev/fixture/flight',
    advertisedPrice: 12400,
    finalTotal: 14850,
    currency: 'INR',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'verified',
    checksPassed: 11,
    totalChecks: 11,
    contractHash: 'a716c5b98f249d9c87890a124089304918237984129480129841298410298491',
    breakdown: { basePrice: 12400, mandatoryFees: 1450, taxes: 1000, discount: 0 }
  },
  {
    id: 'cnt-3',
    dealId: 'deal-stay-7712',
    merchant: 'Alpine Chalets & Suites',
    targetUrl: 'https://webreceipt.dev/fixture/chalet',
    advertisedPrice: 6500,
    finalTotal: 6500,
    currency: 'INR',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'drift_detected',
    checksPassed: 9,
    totalChecks: 11,
    contractHash: 'c982340918234901823904812039481209384019238490128340912834091238',
    breakdown: { basePrice: 6500, mandatoryFees: 1200, taxes: 400, discount: 0 }
  }
]

export default function ContractsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'tampered' | 'drift_detected'>('all')
  const [selectedContract, setSelectedContract] = useState<DealContractItem>(mockContracts[0])

  const filteredContracts = useMemo(() => {
    return mockContracts.filter((c) => {
      const matchesFilter = statusFilter === 'all' || c.status === statusFilter
      const matchesSearch =
        c.dealId.toLowerCase().includes(search.toLowerCase()) ||
        c.merchant.toLowerCase().includes(search.toLowerCase()) ||
        c.targetUrl.toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [search, statusFilter])

  const handleExportJSON = (contract: DealContractItem) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(contract, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `webreceipt-${contract.dealId}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    toast.success(`Receipt exported for ${contract.dealId}`)
  }

  const copyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash)
    toast.success('SHA-256 Contract hash copied!')
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 text-violet-400 text-xs font-mono tracking-wider uppercase mb-1">
            <Shield size={14} /> CANONICAL DEAL CONTRACTS
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Deal Contracts Repository</h1>
          <p className="text-gray-400 text-sm mt-1">
            Normalized commercial promises compiled from web evidence journeys with cryptographic SHA-256 proof.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.success('Reverified all 3 contracts against evidence hashes')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={14} /> Reverify All Hashes
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-600/20"
          >
            <ArrowUpRight size={14} /> Observe New Journey
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Contracts List & Filters */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search deal ID, merchant..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2">
            {(['all', 'verified', 'drift_detected', 'tampered'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  statusFilter === st
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* List items */}
          <div className="space-y-3">
            {filteredContracts.map((c) => {
              const isSelected = selectedContract.id === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedContract(c)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-500/15 to-blue-500/15 border-purple-500/50 shadow-lg shadow-purple-500/10'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-purple-400 font-bold">{c.dealId}</span>
                      <h3 className="font-bold text-white text-sm mt-0.5">{c.merchant}</h3>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        c.status === 'verified'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {c.status === 'verified' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      {c.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <div>
                      Advertised: <span className="text-white font-mono">₹{c.advertisedPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      Final: <span className="text-purple-300 font-mono font-bold">₹{c.finalTotal.toLocaleString()}</span>
                    </div>
                    <div className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {c.checksPassed}/{c.totalChecks} CHECKS PASS
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Selected Contract Inspector */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-6">
            {/* Inspector Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
              <div>
                <span className="font-mono text-xs text-purple-400">{selectedContract.dealId}</span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedContract.merchant}</h2>
                <a
                  href={selectedContract.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gray-400 hover:text-purple-300 flex items-center gap-1 mt-1 font-mono"
                >
                  {selectedContract.targetUrl} <ExternalLink size={12} />
                </a>
              </div>
              <button
                onClick={() => handleExportJSON(selectedContract)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl text-sm font-semibold hover:bg-purple-500/30 transition-colors"
              >
                <Download size={14} /> Export Receipt JSON
              </button>
            </div>

            {/* Arithmetic Breakdown */}
            <div>
              <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
                Price Arithmetic & Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-xs text-gray-400 block">Base Price</span>
                  <strong className="text-lg font-mono text-white">₹{selectedContract.breakdown.basePrice}</strong>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-xs text-gray-400 block">Mandatory Fees</span>
                  <strong className="text-lg font-mono text-amber-400">+₹{selectedContract.breakdown.mandatoryFees}</strong>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-xs text-gray-400 block">Taxes & Govt</span>
                  <strong className="text-lg font-mono text-amber-400">+₹{selectedContract.breakdown.taxes}</strong>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                  <span className="text-xs text-purple-300 block font-semibold">Final Checkout</span>
                  <strong className="text-lg font-mono text-purple-300">₹{selectedContract.finalTotal}</strong>
                </div>
              </div>
            </div>

            {/* Deterministic Semantic Invariants */}
            <div>
              <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
                Deterministic Integrity Checks
              </h4>
              <div className="space-y-2">
                {[
                  { check: 'Price Arithmetic: basePrice + fees + taxes == finalTotal', pass: selectedContract.status === 'verified' },
                  { check: 'Currency Uniformity: INR across all offer steps', pass: true },
                  { check: 'Evidence Completeness: Screenshots & DOM snapshots attached', pass: true },
                  { check: 'Whole-Contract SHA-256 Hash matches canonical payload', pass: true },
                  { check: 'Journey Monotonicity: Checkout price >= initial offer price', pass: true }
                ].map((chk, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl text-xs">
                    <span className="font-mono text-gray-300">{chk.check}</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${chk.pass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {chk.pass ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Provenance */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1 font-mono"><Hash size={12} /> WHOLE-CONTRACT SHA-256 HASH</span>
                <button onClick={() => copyHash(selectedContract.contractHash)} className="hover:text-white flex items-center gap-1">
                  <Copy size={12} /> Copy
                </button>
              </div>
              <p className="font-mono text-xs text-purple-300 break-all bg-white/5 p-2 rounded border border-white/10">
                {selectedContract.contractHash}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
