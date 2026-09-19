export function GaugeVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'gauge gauge-compact' : 'gauge'} aria-hidden="true">
      <div className="gauge-shell">
        <div className="gauge-face">
          <div className="gauge-ticks" />
          <span className="gauge-unit">bar</span>
          <span className="gauge-name">UNIPRESS</span>
          <span className="gauge-needle" />
          <span className="gauge-center" />
        </div>
      </div>
      <div className="gauge-connector" />
    </div>
  )
}
