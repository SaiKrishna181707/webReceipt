/* ============================================================================
   THE CRAWLER

   A small digital arachnid that patrols the area beside the wordmark. It is a
   security process with legs, not a cartoon spider: angular, unlit except for
   two sensor points, and the same phosphor as everything else.

   Behaviour is pure CSS — a long keyframe track with repeated waypoints, which
   is how it gets its pauses and its changes of direction. No JS, no state, no
   re-render, and it stops dead under `prefers-reduced-motion`. Animating an
   element that exists purely as atmosphere should cost nothing.
   ========================================================================== */

export function LogoSpider({
  /** Body size in px. It should always read as small. */
  size = 15,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <span aria-hidden className={`wr-spider-zone ${className}`}>
      <span className="wr-spider" style={{ width: size, height: size }}>
        <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none">
          {/* Gait A — legs 1 and 3 on each side */}
          <g className="wr-spider-legs-a" stroke="#1fa049" strokeWidth="1.1" strokeLinecap="round">
            <path d="M10.1 10.6 6.4 8.1 3.6 10.2" />
            <path d="M10.1 14 6.2 14.8 3.9 17.6" />
            <path d="M13.9 10.6 17.6 8.1 20.4 10.2" />
            <path d="M13.9 14 17.8 14.8 20.1 17.6" />
          </g>

          {/* Gait B — legs 2 and 4, driven in opposite phase */}
          <g className="wr-spider-legs-b" stroke="#12803a" strokeWidth="1.1" strokeLinecap="round">
            <path d="M10 12.3 5.6 11.6 3 13.4" />
            <path d="M10.6 15.2 7.6 17.6 5.8 20.6" />
            <path d="M14 12.3 18.4 11.6 21 13.4" />
            <path d="M13.4 15.2 16.4 17.6 18.2 20.6" />
          </g>

          {/* Abdomen — a hard-edged plate, not a round belly */}
          <path
            d="M12 10.4 15.1 12.6 14.1 16.6 9.9 16.6 8.9 12.6Z"
            fill="#04240f"
            stroke="#1fa049"
            strokeWidth="1"
          />
          {/* Cephalothorax */}
          <path d="M12 6.9 14 8.6 13.4 10.9 10.6 10.9 10 8.6Z" fill="#07401c" stroke="#3fbf66" strokeWidth="0.9" />
          {/* Two sensors. The only lit part of the whole creature. */}
          <circle className="wr-spider-eye" cx="11.1" cy="8.9" r="0.62" fill="#7bffa0" />
          <circle className="wr-spider-eye" cx="12.9" cy="8.9" r="0.62" fill="#7bffa0" />
        </svg>
      </span>
    </span>
  )
}
