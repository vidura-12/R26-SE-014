import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoImg from '../assets/logo.png'

const css = `
  .sidebar {
    width: 240px;
    min-height: 100vh;
    background: #1a4028;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 50;
    transition: transform 0.28s cubic-bezier(.22,1,.36,1);
  }
  .sidebar.mobile-hidden { transform: translateX(-240px); }

  .sidebar-logo {
    padding: 22px 22px 18px;
    display: flex; align-items: center; gap: 9px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }
  .logo-img {
    width: 22px; height: 22px; object-fit: contain; flex-shrink: 0;
    filter: brightness(0) saturate(100%) invert(65%) sepia(60%) saturate(600%) hue-rotate(340deg) brightness(105%);
  }
  .logo-text {
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 1.05rem;
    color: white; letter-spacing: -0.01em;
  }

  .sidebar-section-label {
    font-size: 0.63rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    padding: 18px 22px 8px;
  }

  .sidebar-nav {
    flex: 1; padding: 8px 12px;
    display: flex; flex-direction: column; gap: 2px;
    overflow-y: auto;
  }
  .sidebar-nav::-webkit-scrollbar { display: none; }
  .sidebar-nav { scrollbar-width: none; }

  .sidebar-footer {
    padding: 14px 12px;
    border-top: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }
  .logout-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px; width: 100%;
    background: none; border: none; cursor: pointer;
    font-size: 0.85rem; font-weight: 500;
    color: rgba(255,255,255,0.4);
    transition: all 0.18s;
    font-family: 'DM Sans', sans-serif;
  }
  .logout-btn:hover { background: rgba(220,80,60,0.12); color: #e05a4a; }

  .sidebar-overlay {
    display: none;
    position: fixed; inset: 0; z-index: 45;
    background: rgba(0,0,0,0.45);
  }
  .sidebar-overlay.visible { display: block; }

  .sidebar.desktop-collapsed { transform: translateX(-240px); }

  @media(max-width: 1023px) {
    .sidebar { transform: translateX(-240px); }
    .sidebar.mobile-open { transform: translateX(0); }
    .sidebar.desktop-collapsed { transform: translateX(-240px); }
  }
`

const adminLinks = [
  { to: '/admin',              label: 'Dashboard',       icon: '🏠', end: true },
  { to: '/admin/farmers',      label: 'Farmers',         icon: '🌾' },
  { to: '/admin/peelers',      label: 'Peeler Groups',   icon: '👥' },
  { to: '/admin/harvests',     label: 'Harvest Requests',icon: '📅' },
  { to: '/admin/optimization', label: 'Optimization',    icon: '⚡' },
  { to: '/admin/schedules',    label: 'Schedules',       icon: '📋' },
  { to: '/admin/users',        label: 'System Users',    icon: '🛡️' },
  { to: '/admin/profile',      label: 'My Account',      icon: '👤', section: 'Account' },
]
const farmerLinks = [
  { to: '/farmer',          label: 'Home',        icon: '🏠', end: true },
  { to: '/farmer/harvests', label: 'My Harvests', icon: '🌿' },
  { to: '/farmer/profile',  label: 'My Profile',  icon: '👤', section: 'Account' },
]
const peelerLinks = [
  { to: '/peeler',          label: 'Home',       icon: '🏠', end: true },
  { to: '/peeler/routes',   label: 'My Routes',  icon: '📍' },
  { to: '/peeler/group',    label: 'My Group',   icon: '👥' },
  { to: '/peeler/account',  label: 'My Account', icon: '👤', section: 'Account' },
]

export default function Sidebar({ mobileOpen, onClose, collapsed }) {
  const { user, logout } = useAuth()
  const links = user?.role === 'ADMIN' ? adminLinks
              : user?.role === 'FARMER' ? farmerLinks
              : peelerLinks

  // Group links by section divider
  const renderLinks = () => {
    let lastSection = null
    return links.map((item) => {
      const sectionHeader = item.section && item.section !== lastSection
        ? (lastSection = item.section, <div key={`sec-${item.section}`} className="sidebar-section-label" style={{ padding: '18px 0 8px', marginLeft: 0 }}>{item.section}</div>)
        : null
      return (
        <span key={item.to}>
          {sectionHeader}
          <NavLink
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
          >
            <span style={{ fontSize: '1rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        </span>
      )
    })
  }

  return (
    <>
      <style>{css}</style>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}${collapsed ? ' desktop-collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <img src={logoImg} alt="logo" className="logo-img" />
          <span className="logo-text">Cinnomon</span>
        </div>

        <div className="sidebar-section-label">Main Menu</div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {renderLinks()}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* User info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', marginBottom: 4,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #c8773a, #e8956a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Syne', sans-serif", fontWeight: 800,
              fontSize: '0.72rem', color: 'white', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.role}
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
