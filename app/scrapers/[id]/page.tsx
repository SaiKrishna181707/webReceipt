'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Copy,
  Play,
  HeartPulse,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { scrapers, output } from '@/lib/mock-data'

export default function ScraperDetailPage() {
  const params = useParams<{ id: string }>()
  const s = scrapers.find((x) => x.id === params?.id) || scrapers[0]
  const [tab, setTab] = useState<'Overview' | 'Runs' | 'Healing' | 'API'>('Overview')
  const [status, setStatus] = useState(s.status)

  const handleRun = () => {
    setStatus('Healing')
    toast('Triggering collector run...')
    setTimeout(() => {
      setStatus('Healthy')
      toast.success('Run completed successfully! 3 rows verified & compiled.')
    }, 1400)
  }

  const handleHeal = () => {
    setStatus('Healing')
    toast('Bright Data self-healing process initiated...')
    setTimeout(() => {
      setStatus('Healthy')
      toast.success('Repair preview passed 11/11 checks! Collector recovered.')
    }, 1800)
  }

  const copyCollectorId = () => {
    navigator.clipboard?.writeText(s.collector)
    toast.success('Collector ID copied to clipboard')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Back Link */}
      <Link href="/scrapers" className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={14} /> Back to Collectors Registry
      </Link>

      {/* Hero Banner */}
      <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-purple-400 font-bold uppercase">COLLECTOR / {s.id.toUpperCase()}</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                status === 'Healthy'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : status === 'Broken'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : status === 'Healing'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
              }`}
            >
              {status.toUpperCase()}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-white">{s.name}</h1>

          <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
            <span>{s.url}</span>
            <span>•</span>
            <button onClick={copyCollectorId} className="hover:text-purple-300 flex items-center gap-1">
              <code>{s.collector}</code> <Copy size={12} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            <Play size={14} /> Run Collector
          </button>
          <button
            onClick={handleHeal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <HeartPulse size={14} /> Trigger Self-Heal
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-2">
        {(['Overview', 'Runs', 'Healing', 'API'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
              tab === t
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {tab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#131927] border border-white/10 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-mono text-gray-400 uppercase">Total Runs</span>
              <div className="text-2xl font-black font-mono text-white">184</div>
            </div>
            <div className="bg-[#131927] border border-white/10 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-mono text-gray-400 uppercase">Success Rate</span>
              <div className="text-2xl font-black font-mono text-emerald-400">98.4%</div>
            </div>
            <div className="bg-[#131927] border border-white/10 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-mono text-gray-400 uppercase">Rows Recovered</span>
              <div className="text-2xl font-black font-mono text-purple-300">{s.rows.toLocaleString()}</div>
            </div>
            <div className="bg-[#131927] border border-white/10 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-mono text-gray-400 uppercase">Last Healed</span>
              <div className="text-2xl font-black font-mono text-white">{s.lastHeal}</div>
            </div>
          </div>

          <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Description</h3>
            <p className="text-gray-300 text-sm">{s.description}</p>

            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider pt-4 border-t border-white/10">
              Sample Verified JSON Output
            </h3>
            <pre className="bg-black/50 border border-white/10 p-4 rounded-xl text-xs font-mono text-cyan-200 overflow-x-auto">
              <code>{JSON.stringify(output.slice(0, 2), null, 2)}</code>
            </pre>
          </div>
        </div>
      )}

      {tab === 'Runs' && (
        <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white">Execution History</h3>
          <div className="overflow-x-auto border border-white/10 rounded-xl">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-white/5 text-xs font-mono text-gray-400 border-b border-white/10">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Trigger</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Rows</th>
                  <th className="p-4 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {['2 min ago', '18 min ago', '42 min ago', '1 hr ago', 'Yesterday'].map((t, i) => (
                  <tr key={t} className="hover:bg-white/[0.03]">
                    <td className="p-4 text-xs font-mono text-white">{t}</td>
                    <td className="p-4 text-xs font-mono text-purple-300">{i === 1 ? 'HEALED' : i === 3 ? 'SCHEDULED' : 'MANUAL'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        HEALTHY
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono">{[1842, 1840, 1822, 1764, 1710][i]}</td>
                    <td className="p-4 text-right text-xs font-mono text-gray-400">{[3.2, 4.1, 3.8, 3.4, 4.0][i]}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Healing' && (
        <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white">Self-Healing Log & Timeline</h3>
          <div className="space-y-4">
            {[
              ['Today 14:08', 'Selector drift detected', 'div.product-card → article[data-card]', '492 rows recovered'],
              ['Yesterday 22:41', 'Price node moved', '.price → [data-price]', '1,842 rows verified'],
              ['Aug 12', 'DOM structure changed', '.listing → section.listing-card', '918 rows recovered']
            ].map((e, idx) => (
              <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="font-bold text-white">{e[1]}</span>
                  <span>{e[0]}</span>
                </div>
                <p className="text-emerald-400 font-bold">{e[3]}</p>
                <code className="text-purple-300 font-mono block">{e[2]}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'API' && (
        <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">API Trigger Snippet</h3>
          <pre className="bg-black/50 border border-white/10 p-4 rounded-xl text-xs font-mono text-cyan-200 overflow-x-auto">
            <code>{`curl -X POST https://api.brightdata.com/dca/trigger \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"collector_id":"${s.collector}"}'`}</code>
          </pre>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(
                `curl -X POST https://api.brightdata.com/dca/trigger -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"collector_id":"${s.collector}"}'`
              )
              toast.success('cURL command copied!')
            }}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <Copy size={12} /> Copy Snippet
          </button>
        </div>
      )}
    </div>
  )
}
