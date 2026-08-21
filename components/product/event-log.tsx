'use client'

import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'
import type { WebReceiptEvent } from '@/lib/types'

/* The engine stream is the one honest screen in the room: a 1986 CRT monitor
   bolted under the desk, phosphor scanlines and all. */

function toneFor(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('error') || t.includes('reject') || t.includes('integrity') || t.includes('fail') || t.includes('invalid')) return '#ff2d5e'
  if (t.includes('heal') || t.includes('repair') || t.includes('propos')) return '#ffc23c'
  if (t.includes('success') || t.includes('approve') || t.includes('verif') || t.includes('valid') || t.includes('deploy') || t.includes('recover')) return '#35f39a'
  if (t.includes('run') || t.includes('observe') || t.includes('contract') || t.includes('diff') || t.includes('stress')) return '#2de2e6'
  return '#ff2e97'
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
    <section className="relative overflow-hidden rounded-[2px] border border-aqua-500/25 bg-black/75 shadow-[inset_0_0_44px_-26px_rgba(45,226,230,.9)]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-gradient-to-b from-aqua-500/[0.07] to-transparent px-4 py-2.5">
        <Terminal size={14} className="text-aqua-400" />
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-night-200">{title}</span>
        {/* Channel indicator lamps */}
        <span className="ml-auto flex gap-1.5">
          {['#ff2d5e', '#ffc23c', '#35f39a'].map((c) => (
            <span
              key={c}
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: c, boxShadow: `0 0 9px ${c}` }}
            />
          ))}
        </span>
      </div>

      <div className="relative max-h-72 space-y-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
        {events.length === 0 ? (
          <div className="text-night-400">$ waiting for engine activity…</div>
        ) : (
          events.map((e) => {
            const c = toneFor(e.type)
            return (
              <div key={e.id} className="flex gap-3">
                <span className="shrink-0 text-night-500">{clock(e.at)}</span>
                <span className="w-24 shrink-0" style={{ color: c, textShadow: `0 0 8px ${c}66` }}>
                  {e.type}
                </span>
                <span className="break-words text-night-100">{e.message}</span>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Phosphor lines. Decorative, and cheap — one gradient, no animation. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay"
        aria-hidden
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.5) 0 1px, transparent 1px 3px)',
        }}
      />
    </section>
  )
}
