'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  GitCompare,
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
      { chip: 'Observation', color: '#ff6b12', bg: '#fff0e5', text: 'A public purchase journey was captured and normalized.', time: '4h ago' },
      { chip: 'Evidence', color: '#eaaa00', bg: '#fff5cf', text: 'Price, fees and terms were sealed with source evidence.', time: '1d ago' },
    ],
  },
  {
    name: 'Integrity monitor',
    icon: ShieldCheck,
    count: 2,
    width: '100%',
    color: '#27dda1',
    signals: [
      { chip: 'Integrity', color: '#ea2f7d', bg: '#ffe6f1', text: 'A wrong-but-valid checkout total was detected semantically.', time: '4h ago' },
      { chip: 'Contract', color: '#10ad7a', bg: '#dcf7ed', text: 'The healthy rerun produced a valid Deal Contract.', time: '1d ago' },
    ],
  },
  {
    name: 'Self-heal',
    icon: Wrench,
    count: 1,
    width: '50%',
    color: '#27dda1',
    signals: [
      { chip: 'Repair', color: '#6c3cf0', bg: '#eee7ff', text: 'A repair preview passed verification before approval.', time: '2d ago' },
      { chip: 'Verified', color: '#10ad7a', bg: '#dcf7ed', text: 'The repaired collector reran successfully.', time: '2d ago' },
    ],
  },
  {
    name: 'Promise Diff',
    icon: GitCompare,
    count: 1,
    width: '50%',
    color: '#27dda1',
    signals: [
      { chip: 'Diff', color: '#3f78ee', bg: '#e8efff', text: 'Commercial promises were compared across observations.', time: '3d ago' },
      { chip: 'History', color: '#10ad7a', bg: '#dcf7ed', text: 'Stored Deal Contracts remained independently verifiable.', time: '3d ago' },
    ],
  },
]

const demoSteps = [
  { title: 'Observe journey', sub: 'Capture promise + evidence', color: '#ff6b12' },
  { title: 'Detect drift', sub: 'Catch semantic failure', color: '#ea2f7d' },
  { title: 'Verify repair', sub: 'Preview before deploy', color: '#10ad7a' },
  { title: 'Promise Diff', sub: 'Compare what changed', color: '#3f78ee' },
]

export default function HomePage() {
  const [expanded, setExpanded] = useState(1)
  const [demoStep, setDemoStep] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setDemoStep((step) => (step + 1) % demoSteps.length), 1700)
    return () => window.clearInterval(timer)
  }, [playing])

  const chooseWorkflow = (index: number) => {
    setExpanded((current) => (current === index ? -1 : index))
    setDemoStep(index)
    setPlaying(false)
  }

  return (
    <div className="scout-page">
      <header className="scout-page-head">
        <div>
          <h1>Portfolio</h1>
          <p>4 WebReceipt workflows tracked</p>
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
                  <div className="scout-workflow-detail-label">Recent signals</div>
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
            <h2 id="interactive-demo-title">Interactive walkthrough</h2>
            <p>It auto-plays like a product video, but every step is clickable.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="scout-demo-play" onClick={() => setPlaying((value) => !value)}>
              {playing ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <Link href="/console" className="scout-demo-play">
              Open live console
            </Link>
          </div>
        </div>

        <div className="scout-browser">
          <div className="scout-browser-top">
            <div className="scout-traffic" aria-hidden><i /><i /><i /></div>
            <div className="scout-browser-address">app.webreceipt.local/console</div>
            <div className="scout-browser-dots" aria-hidden><i /><i /></div>
          </div>

          <div className="scout-demo-body">
            <aside className="scout-demo-sidebar" aria-hidden>
              <div className="scout-demo-brand">
                <span className="scout-brand-mark"><i /><i /><i /><i /></span>
                WebReceipt
              </div>
              <div className="scout-demo-nav">
                <span>Home</span>
                <span className="is-active">Console</span>
                <span>Mutation Lab</span>
                <span>Receipts</span>
                <span>Docs</span>
              </div>
            </aside>

            <div className="scout-demo-center">
              <div className="scout-demo-kicker">Live workflow</div>
              <h3>Proof of promise, end to end</h3>
              <p>Click any step below. The walkthrough remains interactive while it plays.</p>

              <div className="scout-demo-steps">
                {demoSteps.map((step, index) => (
                  <button
                    type="button"
                    key={step.title}
                    className={`scout-demo-step ${demoStep === index ? 'is-active' : ''}`}
                    onClick={() => {
                      setDemoStep(index)
                      setPlaying(false)
                      setExpanded(index)
                    }}
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

            <aside className="scout-demo-rail" aria-hidden>
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
              <div className="mt-5 flex items-center gap-2 text-[11px] text-[#7f8580]">
                {demoStep >= 2 ? <CheckCircle2 size={14} color="#10ad7a" aria-hidden /> : <RefreshCw size={14} aria-hidden />}
                {demoStep >= 2 ? 'Verified state' : 'Watching changes'}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}
