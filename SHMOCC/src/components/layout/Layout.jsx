import {
  NavLink,
  Outlet,
} from "react-router-dom";

export default function Layout() {
  const links = [
  {
    path: "/disease-prediction/dashboard",
    label: "Overview",
    icon: "⌂",
  },
  {
    path: "/disease-prediction/dashboard/devices",
    label: "Devices",
    icon: "⌁",
  },
  {
    path: "/disease-prediction/dashboard/sensor-data",
    label: "Sensors",
    icon: "◈",
  },
  {
    path: "/disease-prediction/dashboard/advisory",
    label: "Disease Advisory",
    icon: "✦",
  }, 
  {
    path: "/disease-prediction/dashboard/history",
    label: "Prediction History",
    icon: "▤",
  },

  ];

  return (
    <div className="app-shell">

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-logo">
            🌿
          </div>

          <div>
            <strong>
              CinnaPredict
            </strong>

            <span>
              PLANTATION INTELLIGENCE
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-heading">
            MONITORING
          </span>

          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={
                link.path ===
                "/dashboard"
              }
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              <span className="nav-icon">
                {link.icon}
              </span>

              <span>
                {link.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span />
            System operational
          </div>
        </div>

      </aside>

      <main className="main-content">

        <header className="topbar">

          <div>
            <span className="topbar-title">
              Ceylon Cinnamon
            </span>

            <span className="topbar-separator">
              ·
            </span>

            <span className="topbar-intelligence">
              Intelligence
            </span>
          </div>

          <div className="topbar-right">
            <span>
              ● Live monitoring
            </span>
          </div>

        </header>

        <div className="page-container">
          <Outlet />
        </div>

      </main>

    </div>
  );
}