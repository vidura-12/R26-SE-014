import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const pageTitles = {
  '/admin':              { title: 'Dashboard',        sub: 'Overview of your operations' },
  '/admin/farmers':      { title: 'Farmers',          sub: 'Manage registered farmers' },
  '/admin/peelers':      { title: 'Peeler Groups',    sub: 'Manage peeler groups' },
  '/admin/harvests':     { title: 'Harvest Requests', sub: 'Review and manage harvest requests' },
  '/admin/optimization': { title: 'Optimization',     sub: 'AI-powered route optimization' },
  '/admin/schedules':    { title: 'Schedules',        sub: 'View and manage schedules' },
  '/admin/users':        { title: 'System Users',     sub: 'Manage system access' },
  '/admin/profile':      { title: 'My Account',       sub: 'Account settings' },
  '/farmer':             { title: 'Farmer Dashboard', sub: 'Overview of your farm activity' },
  '/farmer/harvests':    { title: 'My Harvests',      sub: 'Track your harvest requests' },
  '/farmer/profile':     { title: 'My Profile',       sub: 'Account settings' },
  '/peeler':             { title: 'Peeler Dashboard', sub: 'Your peeling assignments' },
  '/peeler/routes':      { title: 'My Routes',        sub: 'View assigned routes' },
  '/peeler/group':       { title: 'My Group',         sub: 'Your peeler group details' },
  '/peeler/account':     { title: 'My Account',       sub: 'Account settings' },
}

const SIDEBAR_W = 240

export default function Layout() {
  const location = useLocation()
  const pageInfo = pageTitles[location.pathname] ?? { title: 'Cinnomon', sub: '' }
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const effectiveSidebarW = collapsed ? 0 : SIDEBAR_W

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      background: '#f8faf7',
      overflow: 'hidden',
    }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
      />

      {/* Main — offset by sidebar width on desktop */}
      <div style={{
        marginLeft: effectiveSidebarW,
        width: `calc(100% - ${effectiveSidebarW}px)`,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        minWidth: 0,
        overflowY: 'auto',
        transition: 'margin-left 0.28s cubic-bezier(.22,1,.36,1), width 0.28s cubic-bezier(.22,1,.36,1)',
      }}
        className="cs-main"
      >
        <TopBar
          title={pageInfo.title}
          subtitle={pageInfo.sub}
          onMenuClick={() => {
            if (window.innerWidth >= 1024) setCollapsed(v => !v)
            else setMobileOpen(true)
          }}
        />
        <main style={{
          flex: 1,
          padding: '28px 32px',
          width: '100%',
          boxSizing: 'border-box',
        }}
          className="cs-content"
        >
          <Outlet />
        </main>
      </div>

      <style>{`
        @media(max-width: 1023px) {
          .cs-main {
            margin-left: 0 !important;
            width: 100% !important;
          }
          .cs-content {
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
