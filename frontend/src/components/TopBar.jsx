import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import { useNavigate } from 'react-router-dom'

const profileRoute = {
  ADMIN:  '/admin/profile',
  FARMER: '/farmer/profile',
  PEELER: '/peeler/account',
}

export default function TopBar({ title, subtitle, onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <header style={{
      height: 64,
      background: 'white',
      borderBottom: '1px solid rgba(58,148,96,0.14)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      width: '100%',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      flexShrink: 0,
      boxSizing: 'border-box',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Hamburger — mobile */}
        <button
          onClick={onMenuClick}
          style={{
            width: 34, height: 34, borderRadius: 8,
            border: '1px solid rgba(58,148,96,0.14)',
            background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 4, padding: 8,
            transition: 'background 0.2s',
          }}
          className="lg:hidden"
          onMouseEnter={e => e.currentTarget.style.background = '#e8f5ec'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          aria-label="Toggle sidebar"
        >
          <div style={{ width: 16, height: 1.5, background: '#3d5c47', borderRadius: 2 }} />
          <div style={{ width: 16, height: 1.5, background: '#3d5c47', borderRadius: 2 }} />
          <div style={{ width: 16, height: 1.5, background: '#3d5c47', borderRadius: 2 }} />
        </button>

        <div>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700, fontSize: '1rem',
            color: '#1a4028',
          }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: '0.78rem', color: '#7a9882', marginTop: 1 }}>{subtitle}</div>
          )}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Live badge — hidden on mobile */}
        <div className="topbar-live-badge" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#e8f5ec', border: '1px solid #d4edd9',
          borderRadius: 100, padding: '5px 12px',
          fontSize: '0.73rem', fontWeight: 600, color: '#3a9460',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: '#5bb87e',
            animation: 'pulse 1.5s infinite',
          }} />
          {user?.role ?? 'Live'}
        </div>

        <NotificationBell />

        {/* Avatar */}
        <div
          onClick={() => navigate(profileRoute[user?.role] ?? '/')}
          title="Profile"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #c8773a, #e8956a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: '0.78rem', color: 'white',
            cursor: 'pointer', transition: 'box-shadow 0.2s',
            userSelect: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,119,58,0.25)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          {initials}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.55;transform:scale(1.5)}
        }
        @media(max-width:640px) {
          .topbar-live-badge { display: none !important; }
        }
      `}</style>
    </header>
  )
}
