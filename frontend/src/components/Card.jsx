export function Card({ children, className = '', hover = false, style = {} }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, icon, color = 'green' }) {
  const iconColors = {
    green:    { bg: 'var(--mint)',         border: 'var(--green-pale)' },
    cinnamon: { bg: 'var(--cinnamon-bg)',  border: 'rgba(200,119,58,0.22)' },
    amber:    { bg: '#fffbea',             border: 'rgba(220,168,52,0.25)' },
    blue:     { bg: '#e0f2fe',             border: 'rgba(14,165,233,0.2)' },
    purple:   { bg: '#f0ebff',             border: 'rgba(139,92,246,0.2)' },
  }
  const ic = iconColors[color] ?? iconColors.green

  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: ic.bg, border: `1px solid ${ic.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
        }}>
          {icon}
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}
