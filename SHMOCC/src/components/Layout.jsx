import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --white:       #ffffff;
    --off-white:   #f8faf7;
    --cinnamon:    #c8773a;
    --cinnamon-lt: #e8956a;
    --cinnamon-bg: #fdf3ec;
    --green-dark:  #1a4028;
    --green-mid:   #2d6a45;
    --green:       #3a9460;
    --green-lt:    #5bb87e;
    --green-pale:  #d4edd9;
    --mint:        #e8f5ec;
    --text:        #1a2e20;
    --text-mid:    #3d5c47;
    --text-soft:   #7a9882;
    --border:      rgba(58,148,96,0.14);
    --sidebar-w:   240px;
    --header-h:    64px;
  }

  body, #root {
    font-family: 'DM Sans', sans-serif;
    background: var(--off-white);
    color: var(--text);
    margin: 0; padding: 0;
    overflow-x: hidden;
  }

  .dash-shell {
    display: flex;
    min-height: 100vh;
    width: 100%;
    background: var(--off-white);
    overflow-x: hidden;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    width: var(--sidebar-w);
    min-height: 100vh;
    background: var(--green-dark);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 50;
    transition: transform 0.28s cubic-bezier(.22,1,.36,1);
  }
  .sidebar.collapsed { transform: translateX(calc(-1 * var(--sidebar-w))); }

  .sidebar-logo {
    padding: 22px 22px 18px;
    display: flex; align-items: center; gap: 9px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }
  .logo-dot {
    width: 9px; height: 9px; border-radius: 50%;
    background: var(--cinnamon);
    box-shadow: 0 0 10px rgba(200,119,58,0.6);
    animation: pulse 2s ease infinite;
    flex-shrink: 0;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.55;transform:scale(1.5)} }
  .logo-text {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.05rem;
    color: white; letter-spacing: -0.01em;
  }

  .sidebar-section-label {
    font-size: 0.63rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.3); padding: 18px 22px 8px;
  }

  .sidebar-nav { flex: 1; padding: 8px 12px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }

  .nav-item {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 12px; border-radius: 10px;
    font-size: 0.86rem; font-weight: 500; color: rgba(255,255,255,0.55);
    text-decoration: none; transition: all .18s; cursor: pointer;
    border: none; background: none; width: 100%; text-align: left;
  }
  .nav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }
  .nav-item.active {
    background: rgba(91,184,126,0.18); color: white;
    border: 1px solid rgba(91,184,126,0.25);
  }
  .nav-item.active .nav-icon { color: var(--green-lt); }
  .nav-icon { font-size: 1rem; width: 18px; text-align: center; flex-shrink: 0; }

  .sidebar-footer {
    padding: 14px 12px;
    border-top: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }
  .logout-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px; width: 100%;
    background: none; border: none; cursor: pointer;
    font-size: 0.85rem; font-weight: 500; color: rgba(255,255,255,0.4);
    transition: all .18s; font-family: 'DM Sans', sans-serif;
  }
  .logout-btn:hover { background: rgba(220,80,60,0.12); color: #e05a4a; }

  /* AFTER — add width calculation explicitly */
  .dash-main {
    margin-left: var(--sidebar-w);
    width: calc(100% - var(--sidebar-w));   /* ← THIS is the key fix */
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-width: 0;
    transition: margin-left 0.28s, width 0.28s cubic-bezier(.22,1,.36,1);
  }
  .dash-main.expanded {
    margin-left: 0;
    width: 100%;   /* ← also fix the expanded/collapsed state */
  }
  /* ── HEADER ── */
  .dash-header {
    height: var(--header-h);
    background: white;
    border-bottom: 1px solid var(--border);
    display: flex; 
    align-items: center; 
    justify-content: space-between;
    padding: 0 28px;
    width: 100%; /* Ensure header spans full width of dash-main */
    position: sticky; 
    top: 0; 
    z-index: 40;
  }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .toggle-btn {
    width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border);
    background: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 4px; padding: 8px; transition: background .2s;
  }
  .toggle-btn:hover { background: var(--mint); }
  .toggle-bar { width: 16px; height: 1.5px; background: var(--text-mid); border-radius: 2px; transition: all .2s; }

  .page-title {
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem;
    color: var(--green-dark);
  }
  .breadcrumb { font-size: 0.78rem; color: var(--text-soft); margin-top: 1px; }

  .header-right { display: flex; align-items: center; gap: 10px; }
  .header-badge {
    display: flex; align-items: center; gap: 6px;
    background: var(--mint); border: 1px solid var(--green-pale);
    border-radius: 100px; padding: 5px 12px;
    font-size: 0.73rem; font-weight: 600; color: var(--green);
  }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green-lt); animation: pulse 1.5s infinite; }

  .avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, var(--cinnamon), var(--cinnamon-lt));
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 0.78rem; color: white;
    cursor: pointer; transition: box-shadow .2s;
  }
  .avatar:hover { box-shadow: 0 0 0 3px rgba(200,119,58,0.25); }

  /* ── PAGE CONTENT ── */
.dash-content {
  flex: 1;
  padding: 28px 32px;
  width: 100%;
  box-sizing: border-box;  /* ← ensures padding doesn't cause overflow */
}
  /* ── OVERLAY for mobile ── */
  .sidebar-overlay {
    display: none;
    position: fixed; inset: 0; z-index: 45;
    background: rgba(0,0,0,0.4);
  }

  @media(max-width: 768px) {
    .sidebar { transform: translateX(calc(-1 * var(--sidebar-w))); }
    .sidebar.open { transform: translateX(0); }
    .dash-main { margin-left: 0 !important; }
    .sidebar-overlay.visible { display: block; }
    .dash-content { padding: 20px 16px; }
  }
`;

const NAV_ITEMS = [
  { to: "/dashboard",         label: "Home",        icon: "🏠" },
  { to: "/dashboard/fields",  label: "Fields",      icon: "🌾" },
  { to: "/dashboard/Farmhistory",     label: "Farm Health History",    icon: "🗺️" },
  { to: "/dashboard/predict", label: "Predictions", icon: "📈" },
  { to: "/dashboard/reports", label: "Reports",     icon: "📋" },
];

const PAGE_TITLES = {
  "/dashboard":         { title: "Dashboard",   sub: "Overview of your farm health" },
  "/dashboard/fields":  { title: "Fields",      sub: "Manage and monitor field zones" },
  "/dashboard/Farmhistory":     { title: "Farm Health History",    sub: "Farm Health History visualization" },
  "/dashboard/predict": { title: "Predictions", sub: "AI-powered health forecasting" },
  "/dashboard/reports": { title: "Reports",     sub: "Export & analyze data" },
  "/dashboard/profile": { title: "Profile",     sub: "Account settings" },
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const pageInfo = PAGE_TITLES[location.pathname] || { title: "Dashboard", sub: "" };

  // Get user initials from stored name or fallback
  const userName = localStorage.getItem("userName") || "U";
  const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    navigate("/login");
  }

  return (
    <>
      <style>{css}</style>
      <div className="dash-shell">

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
          <div className="sidebar-logo">
            <div className="logo-dot" />
            <span className="logo-text">Cinnamon</span>
          </div>

          <div className="sidebar-section-label">Main Menu</div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}

            <div className="sidebar-section-label" style={{ padding: "18px 0 8px", marginLeft: 0 }}>Account</div>

            <NavLink
              to="/dashboard/profile"
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              <span className="nav-icon">👤</span>
              Profile
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <span>🚪</span> Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        <div
          className={`sidebar-overlay${!collapsed ? " visible" : ""}`}
          onClick={() => setCollapsed(true)}
        />

        {/* ── MAIN ── */}
        <div className={`dash-main${collapsed ? " expanded" : ""}`}>

          {/* Header */}
          <header className="dash-header">
            <div className="header-left">
            <button className="toggle-btn" onClick={() => setCollapsed(c => !c)} aria-label="Toggle sidebar">
                <div className="toggle-bar" />
                <div className="toggle-bar" />
                <div className="toggle-bar" />
              </button>
              <div>
                <div className="page-title">{pageInfo.title}</div>
                <div className="breadcrumb">{pageInfo.sub}</div>
              </div>
            </div>

            <div className="header-right">
              <div className="header-badge">
                <div className="live-dot" />
                Sentinel-2 Live
              </div>
              <div className="avatar" onClick={() => navigate("/dashboard/profile")} title="Profile">
                {initials}
              </div>
            </div>
          </header>

          {/* Page content injected here */}
          <main className="dash-content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}