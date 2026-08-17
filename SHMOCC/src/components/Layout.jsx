import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";

const css = `

`;

const NAV_ITEMS = [
  { to: "/dashboard",         label: "Home",        icon: "🏠" },
  { to: "/dashboard/fields",  label: "Fields",      icon: "🌾" },
  { to: "/dashboard/Farmhistory",     label: "Farm Health History",    icon: "🗺️" },
  { to: "/dashboard/FarmForecast", label: "Predictions", icon: "📈" },
  { to: "/dashboard/reports", label: "Reports",     icon: "📋" },
];

const PAGE_TITLES = {
  "/dashboard":         { title: "Dashboard",   sub: "Overview of your farm health" },
  "/dashboard/fields":  { title: "Fields",      sub: "Manage and monitor field zones" },
  "/dashboard/Farmhistory":     { title: "Farm Health History",    sub: "Farm Health History visualization" },
  "/dashboard/FarmForecast": { title: "Predictions", sub: "AI-powered health forecasting" },
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