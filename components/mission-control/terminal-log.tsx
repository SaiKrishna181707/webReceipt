'use client'

import { useEffect, useRef } from 'react'
import { Terminal, Copy, Trash2, ShieldCheck, Bug } from 'lucide-react'
import { toast } from 'sonner'

export interface LogLine {
  id: string
  timestamp: string
  text: string
  type: 'cmd' | 'info' | 'pass' | 'fail' | 'heal' | 'warn'
}

interface TerminalLogProps {
  logs: LogLine[]
  onClear: () => void
}

export function TerminalLog({ logs, onClear }: TerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const copyTerminalOutput = () => {
    const rawText = logs.map((l) => `[${l.timestamp}] ${l.text}`).join('\n')
    navigator.clipboard?.writeText(rawText)
    toast.success('Terminal log copied to clipboard')
  }

  return (
    <div className="relative w-full h-[440px] bg-[#090d16] border border-white/10 rounded-2xl flex flex-col overflow-hidden font-mono text-xs shadow-2xl">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#131927] border-b border-white/10 select-none">
        <div className="flex items-center gap-2 text-purple-400 font-bold">
          <Terminal size={14} />
          <span>BRIGHT DATA CLI STREAM</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyTerminalOutput}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Copy Output"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Clear Terminal"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div ref={scrollRef} className="relative flex-1 p-4 overflow-y-auto space-y-1.5 text-[11px] leading-relaxed">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-600 select-none">
            Awaiting CLI executions... Click Observe or Run Journey to stream activity.
          </div>
        ) : (
          logs.map((log) => {
            let textColor = 'text-gray-300'
            if (log.type === 'cmd') textColor = 'text-cyan-300 font-bold'
            else if (log.type === 'pass') textColor = 'text-emerald-400 font-bold'
            else if (log.type === 'fail') textColor = 'text-red-400 font-bold'
            else if (log.type === 'heal') textColor = 'text-amber-400 font-bold'
            else if (log.type === 'warn') textColor = 'text-amber-300'

            return (
              <div key={log.id} className="flex items-start gap-2 break-all hover:bg-white/[0.02] px-1 rounded">
                <span className="text-gray-600 select-none flex-shrink-0">[{log.timestamp}]</span>
                <span className={textColor}>{log.text}</span>
              </div>
            )
          })
        )}
      </div>

      {/* Terminal Footer Status Bar */}
      <div className="px-4 py-2 bg-[#131927] border-t border-white/10 flex items-center justify-between text-[10px] text-gray-500 select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>bdata CLI v2.4.0 (Bright Data Scraper Studio)</span>
        </div>
        <span>TTY: 80x24 • UTF-8</span>
      </div>
    </div>
  )
}
