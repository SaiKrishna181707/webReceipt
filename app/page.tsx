'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  GitCompare,
  MousePointer2,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from 'lucide-react'

const workflows = [
  {
    name: 'Observation feed',
    icon: Eye,
    count: 2,
    width: '100%',
    color: '#27dda1',
    signals: [
      { chip: 'Observation', color: '#ff6b12', bg: '#fff0e5', text: 'Journey captured and normalized.', time: '4h' },
      { chip: 'Evidence', color: '#eaaa00', bg: '#fff5cf', text: 'Promise sealed with evidence.', time: '1d' },
    ],
  },
  {
    name: 'Integrity monitor',
    icon: ShieldCheck,
    count: 2,
    width: '100%',
    color: '#27dda1',
    signals: [
      { chip: 'Integrity', color: '#ea2f7d', bg: '#ffe6f1', text: 'Semantic drift detected.', time: '4h' },
      { chip: 'Contract', color: '#10ad7a', bg: '#dcf7ed', text: 'Healthy contract verified.', time: '1d' },
    ],
  },
  {
    name: 'Self-heal',
    icon: Wrench,
    count: 1,
    width: '50%',
    color: '#27dda1',
    signals: [
      { chip: 'Repair', color: '#6c3cf0', bg: '#eee7ff', text: 'Repair preview verified.', time: '2d' },
      { chip: 'Verified', color: '#10ad7a', bg: '#dcf7ed', text: 'Collector rerun passed.', time: '2d' },
    ],
  },
  {
    name: 'Promise Diff',
    icon: GitCompare,
    count: 1,
    width: '50%',
    color: '#27dda1',
    signals: [
      { chip: 'Diff', color: '#3f78ee', bg: '#e8efff', text: 'Promise changes compared.', time: '3d' },
      { chip: 'History', color: '#10ad7a', bg: '#dcf7ed', text: 'History remains verifiable.', time: '3d' },
    ],
  },
]

const demoSteps = [
  { title: 'Observe journey', sub: 'Capture promise + evidence', color: '#ff6b12' },
  { title: 'Detect drift', sub: 'Catch semantic failure', color: '#ea2f7d' },
  { title: 'Verify repair', sub: 'Preview before deploy', color: '#10ad7a' },
  { title: 'Promise Diff', sub: 'Compare what changed', color: '#3f78ee' },
]

const demoRoutes = [
  { label: 'Home', href: '/' },
  { label: 'Console', href: '/console' },
  { label: 'Mutation Lab', href: '/mutation-lab' },
  { label: 'Receipts', href: '/receipts' },
  { label: 'Docs', href: '/docs' },
]

export default function HomePage() {
  const [expanded, setExpanded] = useState(1)
  const [demoStep, setDemoStep] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [cursorClicking, setCursorClicking] = useState(false)
  const [cursor, setCursor] = useState({ x: 0, y: 0, ready: false })
  const browserRef = useRef<HTMLDivElement | null>(null)
  const stepRefs = useRef<Array<HTMLButtonElement | null>>([])

  const moveCursor = useCallback((index: number) => {
    const browser = browserRef.current
    const target = stepRefs.current[index]
    if (!browser || !target) return

    const root = browser.getBoundingClientRect()
    const box = target.getBoundingClientRect()
    setCursor({
      x: box.left - root.left + Math.min(box.width - 34, box.width * 0.78),
      y: box.top - root.top + box.height * 0.52,
      ready: true,
    })
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => moveCursor(demoStep))
    const onResize = () => moveCursor(demoStep)
    window.addEventListener('resize', onResize)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [demoStep, moveCursor])

  useEffect(() => {
    if (!playing) return

    const next = (demoStep + 1) % demoSteps.length
    const move = window.setTimeout(() => moveCursor(next), 620)
    const press = window.setTimeout(() => setCursorClicking(true), 1320)
    const select = window.setTimeout(() => {
      setDemoStep(next)
      setExpanded(next)
      setCursorClicking(false)
    }, 1510)

    return () => {
      window.clearTimeout(move)
      window.clearTimeout(press)
      window.clearTimeout(select)
    }
  }, [demoStep, moveCursor, playing])

  const chooseWorkflow = (index: number) => {
    setExpanded((current) => (current === index ? -1 : index))
    setDemoStep(index)
    setPlaying(false)
  }

  const chooseDemoStep = (index: number) => {
    setPlaying(false)
    setCursorClicking(false)
    setDemoStep(index)
    setExpanded(index)
    moveCursor(index)
  }

  return (
    <div className="scout-page">
      <header className="scout-page-head">
        <div>
          <h1>Portfolio</h1>
          <p>4 live workflows</p>
        </div>
        <div className="scout-signal-pill">
          <span className="scout-signal-pill-dot" aria-hidden />
          6 signals
        </div>
      </header>

      <section className="scout-portfolio" aria-label="WebReceipt workflow portfolio">
        {workflows.map((workflow, index) => {
          const Icon = workflow.icon
          const open = expanded === index
          return (
            <article key={workflow.name} className={`scout-workflow-card ${open ? 'is-open' : ''}`}>
              <button
                type="button"
                className="scout-workflow-row"
                aria-expanded={open}
                onClick={() => chooseWorkflow(index)}
              >
                <span className="scout-workflow-main">
                  <span className="scout-workflow-icon"><Icon size={19} strokeWidth={2} aria-hidden /></span>
                  <span className="scout-workflow-name">{workflow.name}</span>
                </span>
                <span className="scout-workflow-meta">
                  <span className="scout-mini-track" aria-hidden>
                    <span className="scout-mini-fill" style={{ width: workflow.width, background: workflow.color }} />
                  </span>
                  <span className="scout-workflow-count">{workflow.count}</span>
                  <ChevronDown className="scout-workflow-chevron" size={15} aria-hidden />
                </span>
              </button>

              {open && (
                <div className="scout-workflow-detail">
                  <div className="scout-workflow-detail-label">Recent</div>
                  {workflow.signals.map((signal) => (
                    <div key={signal.text} className="scout-recent-signal">
                      <span className="scout-chip" style={{ color: signal.color, background: signal.bg }}>
                        <span className="scout-chip-dot" aria-hidden />
                        {signal.chip}
                      </span>
                      <span>{signal.text}</span>
                      <span className="scout-recent-time">{signal.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </section>

      <section className="scout-demo-section" aria-labelledby="interactive-demo-title">
        <div className="scout-demo-head">
          <div>
            <h2 id="interactive-demo-title">Live walkthrough</h2>
            <p>Auto-play. Click anywhere to take control.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="scout-demo-play" onClick={() => setPlaying((value) => !value)}>
              {playing ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <Link href="/console" className="scout-demo-play scout-demo-primary">
              Open Console
            </Link>
          </div>
        </div>

        <div
          ref={browserRef}
          className="scout-browser"
          onPointerDownCapture={() => {
            if (playing) setPlaying(false)
          }}
        >
          <div className="scout-browser-top">
            <div className="scout-traffic" aria-hidden><i /><i /><i /></div>
            <div className="scout-browser-address">app.webreceipt.local/console</div>
            <div className="scout-browser-dots" aria-hidden><i /><i /></div>
          </div>

          <div className="scout-demo-body">
            <aside className="scout-demo-sidebar" aria-label="Walkthrough navigation">
              <Link href="/" className="scout-demo-brand" aria-label="WebReceipt home">
                <span className="scout-brand-mark"><i /><i /><i /><i /></span>
                WebReceipt
              </Link>
              <nav className="scout-demo-nav" aria-label="Walkthrough routes">
                {demoRoutes.map((route) => (
                  <Link key={route.href} href={route.href} className={route.href === '/console' ? 'is-active' : ''}>
                    {route.label}
                  </Link>
                ))}
              </nav>
            </aside>

            <div className="scout-demo-center">
              <div className="scout-demo-kicker">Live workflow</div>
              <h3>Proof of promise</h3>

              <div className="scout-demo-steps">
                {demoSteps.map((step, index) => (
                  <button
                    ref={(node) => { stepRefs.current[index] = node }}
                    type="button"
                    key={step.title}
                    className={`scout-demo-step ${demoStep === index ? 'is-active' : ''}`}
                    onClick={() => chooseDemoStep(index)}
                  >
                    <span className="scout-demo-step-num">{String(index + 1).padStart(2, '0')}</span>
                    <span>
                      <strong>{step.title}</strong>
                      <small>{step.sub}</small>
                    </span>
                    <span className="scout-demo-status" style={{ background: step.color }} aria-hidden />
                  </button>
                ))}
              </div>
            </div>

            <aside className="scout-demo-rail" aria-live="polite">
              <div className="scout-demo-kicker">Current state</div>
              <div className="scout-demo-rail-card">
                <b>{demoStep + 1}/4</b>
                <span>{demoSteps[demoStep].title}</span>
              </div>
              <div className="scout-demo-progress">
                {demoSteps.map((step, index) => (
                  <div key={step.title} className="scout-demo-progress-line">
                    <span>{step.title}</span>
                    <i
                      style={{
                        ['--width' as string]: index <= demoStep ? '100%' : '18%',
                        ['--color' as string]: index === demoStep ? step.color : '#b9d8d3',
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="scout-demo-state">
                {demoStep >= 2 ? <CheckCircle2 size={14} color="#10ad7a" aria-hidden /> : <RefreshCw size={14} aria-hidden />}
                {demoStep >= 2 ? 'Verified' : 'Watching'}
              </div>
            </aside>
          </div>

          <div
            className={`scout-demo-cursor ${cursor.ready && playing ? 'is-visible' : ''} ${cursorClicking ? 'is-clicking' : ''}`}
            style={{ transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)` }}
            aria-hidden
          >
            <span className="scout-demo-cursor-ring" />
            <MousePointer2 size={22} strokeWidth={2.3} fill="white" />
          </div>
        </div>
      </section>
    </div>
  )
}
