const configs = {
  PENDING:     { bg: '#fffbea', color: '#a16207', border: 'rgba(220,168,52,0.3)',   dot: '#dca834' },
  SCHEDULED:   { bg: '#e8f5ec', color: '#2d6a45', border: 'rgba(58,148,96,0.25)',  dot: '#3a9460' },
  IN_PROGRESS: { bg: '#f0ebff', color: '#5b21b6', border: 'rgba(139,92,246,0.3)',  dot: '#7c3aed' },
  COMPLETED:   { bg: '#e8f5ec', color: '#1a4028', border: 'rgba(91,184,126,0.3)',  dot: '#5bb87e' },
  CANCELLED:   { bg: '#fef2f0', color: '#c0392b', border: 'rgba(224,90,74,0.25)',  dot: '#e05a4a' },
  GENERATED:   { bg: '#e0f2fe', color: '#0369a1', border: 'rgba(14,165,233,0.25)', dot: '#0ea5e9' },
  CONFIRMED:   { bg: '#e8f5ec', color: '#2d6a45', border: 'rgba(58,148,96,0.25)',  dot: '#3a9460' },
  ALBA:        { bg: '#fdf3ec', color: '#b05a1a', border: 'rgba(200,119,58,0.25)', dot: '#c8773a' },
  C5_SPECIAL:  { bg: '#fff7ed', color: '#c2410c', border: 'rgba(249,115,22,0.25)', dot: '#ea580c' },
  C5:          { bg: '#fefce8', color: '#a16207', border: 'rgba(234,179,8,0.25)',  dot: '#ca8a04' },
  H1:          { bg: '#f7fee7', color: '#365314', border: 'rgba(132,204,22,0.25)', dot: '#65a30d' },
  H2:          { bg: '#e8f5ec', color: '#14532d', border: 'rgba(34,197,94,0.25)',  dot: '#16a34a' },
  OTHER:       { bg: '#f8faf7', color: '#7a9882', border: 'rgba(58,148,96,0.14)',  dot: '#7a9882' },
  ADMIN:       { bg: '#fdf3ec', color: '#b05a1a', border: 'rgba(200,119,58,0.25)', dot: '#c8773a' },
  FARMER:      { bg: '#e8f5ec', color: '#1a4028', border: 'rgba(91,184,126,0.3)',  dot: '#5bb87e' },
  PEELER:      { bg: '#e0f2fe', color: '#0369a1', border: 'rgba(14,165,233,0.25)', dot: '#0ea5e9' },
}

export default function StatusBadge({ status, label }) {
  const c = configs[status] ?? configs.OTHER
  const display = label ?? status?.replace(/_/g, ' ')
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      borderRadius: 100,
      padding: '3px 9px',
      fontSize: '0.69rem',
      fontWeight: 700,
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0, display: 'inline-block' }} />
      {display}
    </span>
  )
}
