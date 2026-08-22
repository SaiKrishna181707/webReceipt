import { FileCheck2 } from 'lucide-react'

const signals = [
  { label: 'Observation', count: 1, width: '18%', color: '#ff6b12' },
  { label: 'Integrity', count: 1, width: '18%', color: '#ea2f7d' },
  { label: 'Evidence', count: 1, width: '18%', color: '#eaaa00' },
  { label: 'Promise Diff', count: 1, width: '18%', color: '#3f78ee' },
  { label: 'Self-heal', count: 2, width: '34%', color: '#10ad7a' },
]

export function ScoutRightRail() {
  return (
    <aside className="scout-right-rail" aria-label="Session summary">
      <div className="scout-rail-label">This week</div>

      <div className="scout-rail-summary">
        <div className="scout-rail-number">6</div>
        <div className="scout-rail-caption">signals detected</div>
      </div>

      <div className="scout-signal-list">
        {signals.map((signal) => (
          <div key={signal.label} className="scout-signal-line">
            <div className="scout-signal-head" style={{ color: signal.color }}>
              <span>{signal.label}</span>
              <span>{signal.count}</span>
            </div>
            <div className="scout-signal-track" aria-hidden>
              <span className="scout-signal-fill" style={{ width: signal.width, background: signal.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="scout-rail-card">
        <div className="scout-rail-label">Most active</div>
        <div className="scout-rail-company">
          <span className="scout-rail-company-icon"><FileCheck2 size={17} aria-hidden /></span>
          <span>Console</span>
          <span className="scout-rail-company-count">2</span>
        </div>
      </div>
    </aside>
  )
}
