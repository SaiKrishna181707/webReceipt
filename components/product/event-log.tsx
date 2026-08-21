'use client'

import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'
import type { WebReceiptEvent } from '@/lib/types'
import { matrixTones } from '@/components/matrix/matrix-ui'

/* The engine stream is the one screen in the room that only ever reports what
   actually happened. Phosphor, scanlines, and no editorialising. */

const FAIL = matrixTones.alarm.line
const HEAL = matrixTones.warn.line
const PASS = matrixTones.matrix.line
const INFO = matrixTones.data.line
const IDLE = matrixTones.phosphor.line

function toneFor(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('error') || t.includes('reject') || t.includes('integrity') || t.includes('fail') || t.includes('invalid')) return FAIL
  if (t.includes('heal') || t.includes('repair') || t.includes('propos')) return HEAL
  if (t.includes('success') || t.includes('approve') || t.includes('verif') || t.includes('valid') || t.includes('deploy') || t.includes('recover')) return PASS
  if (t.includes('run') || t.includes('observe') || t.includes('contract') || t.includes('diff') || t.includes('stress')) return INFO
  return IDLE
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
    <section className="terminal terminal-phosphor">
      <div className="terminal-bar">
        <Terminal size={13} className="text-matrix-400" aria-hidden />
        <span className="sys-label flex-1">{title}</span>
        {/* Channel indicator lamps: fail, heal, pass. */}
        <span className="flex gap-1.5" aria-hidden>
          {[FAIL, HEAL, PASS].map((c) => (
            <span key={c} className="h-2 w-2 rounded-full" style={{ background: c, boxShadow: `0 0 9px ${c}` }} />
          ))}
        </span>
      </div>

      <div
        className="relative z-[1] max-h-72 space-y-1 overflow-y-auto p-4 font-mono text-[11.5px] leading-relaxed"
        role="log"
        aria-live="polite"
      >
        {events.length === 0 ? (
          <div className="text-void-400">
            <span className="sys-prompt">waiting for engine activity</span>
            <span className="caret" />
          </div>
        ) : (
          events.map((e) => {
            const c = toneFor(e.type)
            return (
              <div key={e.id} className="flex gap-3">
                <span className="shrink-0 tabular-nums text-void-500">{clock(e.at)}</span>
                <span className="w-24 shrink-0" style={{ color: c }}>
                  {e.type}
                </span>
                <span className="break-words text-void-100">{e.message}</span>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>
    </section>
  )
}
