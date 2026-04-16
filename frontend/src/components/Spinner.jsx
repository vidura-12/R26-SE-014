export default function Spinner({ size = 'md', className = '' }) {
  const px = { sm: 16, md: 32, lg: 44 }[size] ?? 32
  const border = { sm: 2, md: 3, lg: 4 }[size] ?? 3
  return (
    <>
      <div
        className={className}
        style={{
          width: px, height: px, borderRadius: '50%',
          border: `${border}px solid rgba(58,148,96,0.15)`,
          borderTopColor: '#3a9460',
          animation: 'spinnerRotate 0.85s linear infinite',
          flexShrink: 0,
        }}
      />
      <style>{`@keyframes spinnerRotate{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}

export function FullPageSpinner() {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'rgba(248,250,247,0.85)',
      backdropFilter: 'blur(4px)', zIndex: 50,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <Spinner size="lg" />
        <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: 'var(--green-mid)' }}>
          Loading…
        </p>
      </div>
      <style>{`@keyframes spinnerRotate{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
