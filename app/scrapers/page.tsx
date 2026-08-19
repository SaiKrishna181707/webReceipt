'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Boxes, Plus, Search, CheckCircle2, XCircle, AlertTriangle, Minus, ArrowUpRight, ExternalLink, RefreshCw, Layers } from 'lucide-react'
import { scrapers, Scraper } from '@/lib/mock-data'
import { toast } from 'sonner'

export default function ScrapersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Healthy' | 'Broken' | 'Stale' | 'Healing'>('All')

  const filteredList = useMemo(() => {
    return scrapers.filter((s) => {
      const matchFilter = statusFilter === 'All' || s.status === statusFilter
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.url.toLowerCase().includes(search.toLowerCase()) ||
        s.collector.toLowerCase().includes(search.toLowerCase())
      return matchFilter && matchSearch
    })
  }, [search, statusFilter])

  const totalRows = scrapers.reduce((acc, s) => acc + s.rows, 0)
  const healthyCount = scrapers.filter((s) => s.status === 'Healthy').length
  const brokenCount = scrapers.filter((s) => s.status === 'Broken').length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-mono tracking-wider uppercase mb-1">
            <Boxes size={14} /> 02 / SCRAPER CONTROL PLANE
          </div>
          <h1 className="text-3xl font-extrabold text-white">Collectors Registry</h1>
          <p className="text-gray-400 text-sm mt-1">
            Every Bright Data Scraper Studio Browser Worker is monitored with real-time health checks & self-healing verification.
          </p>
        </div>
        <Link
          href="/scrapers/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity self-start md:self-auto"
        >
          <Plus size={16} /> Provision New Collector
        </Link>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#131927] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-gray-400 uppercase">Active Collectors</span>
          <div className="text-2xl font-black font-mono text-white">{scrapers.length}</div>
          <span className="text-[11px] text-gray-400 block">Production Browser Workers</span>
        </div>

        <div className="bg-[#131927] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-gray-400 uppercase">Healthy State</span>
          <div className="text-2xl font-black font-mono text-emerald-400">{healthyCount}</div>
          <span className="text-[11px] text-emerald-400/80 block">100% integrity pass</span>
        </div>

        <div className="bg-[#131927] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-gray-400 uppercase">Drift / Repair Needed</span>
          <div className="text-2xl font-black font-mono text-red-400">{brokenCount}</div>
          <span className="text-[11px] text-red-400/80 block">Healing proposal queued</span>
        </div>

        <div className="bg-[#131927] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-gray-400 uppercase">Total Rows Recovered</span>
          <div className="text-2xl font-black font-mono text-purple-300">{totalRows.toLocaleString()}</div>
          <span className="text-[11px] text-gray-400 block">Validated contract rows</span>
        </div>
      </div>

      {/* Filters & Table Card */}
      <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collector name, URL, or ID..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['All', 'Healthy', 'Broken', 'Healing', 'Stale'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  statusFilter === filter
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto border border-white/10 rounded-xl">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 text-xs uppercase font-mono text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-4">Collector Name</th>
                <th className="p-4">Target URL</th>
                <th className="p-4">Collector ID</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Run</th>
                <th className="p-4">Last Heal</th>
                <th className="p-4 text-right">Rows</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredList.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-4 font-bold text-white">
                    <Link href={`/scrapers/${s.id}`} className="hover:text-purple-300 flex items-center gap-1.5">
                      {s.name} <ArrowUpRight size={14} className="text-gray-500" />
                    </Link>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-400 max-w-xs truncate">{s.url}</td>
                  <td className="p-4 font-mono text-xs text-purple-300">{s.collector}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        s.status === 'Healthy'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : s.status === 'Broken'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : s.status === 'Healing'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {s.status === 'Healthy' && <CheckCircle2 size={12} />}
                      {s.status === 'Broken' && <XCircle size={12} />}
                      {s.status === 'Healing' && <AlertTriangle size={12} />}
                      {s.status === 'Stale' && <Minus size={12} />}
                      {s.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-400">{s.lastRun}</td>
                  <td className="p-4 text-xs text-gray-400">{s.lastHeal}</td>
                  <td className="p-4 text-right font-mono text-xs font-bold text-white">{s.rows.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredList.length === 0 && (
            <div className="p-12 text-center text-gray-500 text-sm">No collectors match your search filter.</div>
          )}
        </div>
      </div>
    </div>
  )
}
