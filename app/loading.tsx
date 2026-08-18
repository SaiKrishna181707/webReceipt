export default function Loading() {
  return (
    <div className="loading-shell" aria-label="Loading ScrapeHeal">
      <div className="page-head">
        <div>
          <div className="kicker">LOADING / MISSION CONTROL</div>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-copy" />
        </div>
      </div>
      <div className="grid stats">
        {[1, 2, 3, 4].map((x) => (
          <div className="card skeleton-card" key={x}>
            <div className="skeleton skeleton-label" />
            <div className="skeleton skeleton-number" />
            <div className="skeleton skeleton-small" />
          </div>
        ))}
      </div>
      <div className="grid charts loading-charts">
        <div className="card skeleton-panel" />
        <div className="card skeleton-panel" />
      </div>
    </div>
  )
}
