'use client'

import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'
import type { WebReceiptEvent } from '@/lib/types'

function toneFor(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('error') || t.includes('reject') || t.includes('integrity') || t.includes('fail') || t.includes('invalid')) return 'text-rose-400'
  if (t.includes('heal') || t.includes('repair') || t.includes('propos')) return 'text-amber-400'
  if (t.includes('success') || t.includes('approve') || t.includes('verif') || t.includes('valid') || t.includes('deploy') || t.includes('recover')) return 'text-lime-400'
  if (t.includes('run') || t.includes('observe') || t.includes('contract') || t.includes('diff') || t.includes('stress')) return 'text-azure-400'
  return 'text-stud-400'
}

function clock(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour12: false })
  } catch {
    return '--:--:--'
  }
}

export function EventLog({ events, title = 'Engine event stream' }: { events: WebReceiptEvent[]; title?: string }) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [events.length])

  return (
    <section className="rounded-[8px] border border-white/10 bg-black/60 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2 bg-white/[0.02]">
        <Terminal size={14} className="text-plate-300" />
        <span className="text-[11px] font-mono uppercase tracking-wider text-plate-300">{title}</span>
        <span className="ml-auto flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-lime-500/60" />
        </span>
      </div>
      <div className="p-4 font-mono text-xs leading-relaxed max-h-72 overflow-y-auto space-y-1">
        {events.length === 0 ? (
          <div className="text-plate-400">$ waiting for engine activity…</div>
        ) : (
          events.map((e) => (
            <div key={e.id} className="flex gap-3">
              <span className="shrink-0 text-plate-400">{clock(e.at)}</span>
              <span className={`shrink-0 w-24 ${toneFor(e.type)}`}>{e.type}</span>
              <span className="text-plate-100 break-words">{e.message}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </section>
  )
}
