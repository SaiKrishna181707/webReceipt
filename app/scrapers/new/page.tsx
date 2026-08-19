'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ArrowRight, CheckCircle2, Globe, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NewScraperPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [desc, setDesc] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !url || !desc) {
      toast.error('Please complete all form fields')
      return
    }

    try {
      new URL(url)
    } catch {
      toast.error('Please enter a valid HTTP/HTTPS URL')
      return
    }

    setBusy(true)
    toast('Compiling Bright Data Scraper Studio schema & interaction script...')
    await new Promise((r) => setTimeout(r, 2000))
    toast.success('Collector provisioned! Registered ID c_prod_new892')
    router.push('/scrapers/products')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-purple-400 text-xs font-mono tracking-wider uppercase mb-1">
          <Plus size={14} /> 03 / PROVISIONING WIZARD
        </div>
        <h1 className="text-3xl font-extrabold text-white">Create Browser Worker Collector</h1>
        <p className="text-gray-400 text-sm mt-1">
          Specify target URL & extraction thesis. WebReceipt compiles candidate JSON schemas and Scraper Studio scripts.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block">Collector Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hotel Fare & Tax Watcher"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block">Target Public URL</label>
            <div className="relative">
              <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/checkout-journey"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
            <span className="text-[11px] text-gray-500 block">Public anonymous journey URLs only (no logins or payment inputs).</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block">Extraction Thesis</label>
            <textarea
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Extract item title, advertised price, mandatory resort fees, taxes, and final order total."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Provisioning Scraper Studio Worker...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Compile & Provision Collector <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Live Schema Preview Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#131927] border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <span className="text-[11px] font-mono text-cyan-400 uppercase font-bold">EXPECTED COMPILER OUTPUT</span>
              <h3 className="text-lg font-bold text-white mt-0.5">Canonical Output Schema</h3>
            </div>

            <pre className="bg-black/50 border border-white/10 p-4 rounded-xl text-xs font-mono text-cyan-200 overflow-x-auto">
              <code>{JSON.stringify(
                {
                  $schema: 'http://json-schema.org/draft-07/schema#',
                  type: 'object',
                  properties: {
                    basePrice: { type: 'number' },
                    mandatoryFees: { type: 'number' },
                    taxes: { type: 'number' },
                    finalTotal: { type: 'number' },
                    currency: { type: 'string', default: 'INR' }
                  },
                  required: ['basePrice', 'finalTotal', 'currency']
                },
                null,
                2
              )}</code>
            </pre>

            <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Deterministic arithmetic validation enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>SHA-256 evidence chain verification step</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
