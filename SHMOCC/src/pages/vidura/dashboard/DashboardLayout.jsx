import { NavLink, Outlet, useNavigate } from "react-router-dom";

const MapPin = (p) => (
  <svg viewBox="0 0 24 24" width={p.size ?? 17} height={p.size ?? 17} fill="none" stroke="currentColor" strokeWidth={p.strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const History = (p) => (
  <svg viewBox="0 0 24 24" width={p.size ?? 17} height={p.size ?? 17} fill="none" stroke="currentColor" strokeWidth={p.strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" />
  </svg>
);
const TrendingUp = (p) => (
  <svg viewBox="0 0 24 24" width={p.size ?? 17} height={p.size ?? 17} fill="none" stroke="currentColor" strokeWidth={p.strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);
const LogOut = (p) => (
  <svg viewBox="0 0 24 24" width={p.size ?? 17} height={p.size ?? 17} fill="none" stroke="currentColor" strokeWidth={p.strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const Sun = (p) => (
  <svg viewBox="0 0 24 24" width={p.size ?? 10} height={p.size ?? 10} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
const Moon = (p) => (
  <svg viewBox="0 0 24 24" width={p.size ?? 10} height={p.size ?? 10} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
);

import { TOKEN_KEY, LOGIN_PATH } from "../../../App";
import { useLanguage } from "../../../pages/vidura/dashboard/context/LanguageContext";
import { useTheme } from "../../../pages/vidura/dashboard/context/ThemeContext";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "si", label: "සිං" },
  { code: "ta", label: "தமிழ்" },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  // NOTE: assumes your LanguageContext exposes `setLanguage(code)`.
  // toggleLanguage() alone can't target a specific one of 3 languages.
  const { t, language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const userName = localStorage.getItem("userName") || "Farmer";

  const NAV_ITEMS = [
    { label: t("nav.register"), to: "fields/register", icon: MapPin },
    { label: t("nav.history"), to: "farmhistory", icon: History },
    { label: t("nav.predict"), to: "FarmForecast", icon: TrendingUp },
  ];

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    navigate(LOGIN_PATH, { replace: true });
  };

  const linkClasses = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
      isActive
        ? "bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-900/60 dark:text-emerald-100"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 hover:translate-x-0.5 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
    }`;

  const activeLangIndex = LANGUAGES.findIndex((l) => l.code === language);

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 font-['DM_Sans']">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-6">
        <button
          onClick={() => navigate("")}
          className="flex items-center gap-2 px-2 mb-8 text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse" />
          <span className="font-['Syne'] font-extrabold text-slate-900 dark:text-emerald-100 tracking-tight">
            {t("appName")}
          </span>
        </button>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={linkClasses}>
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500 dark:bg-emerald-400" />
                    )}
                    <Icon
                      size={17}
                      strokeWidth={2}
                      className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {/* Language switch — segmented control with sliding indicator */}
          <div className="space-y-1.5">
            <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t("language")}
            </span>
            <div className="relative grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
              {/* Sliding active pill */}
              <span
                className="absolute inset-y-1 left-1 w-[calc(33.333%-0.334rem)] rounded-lg bg-emerald-600 shadow-sm transition-transform duration-300 ease-out dark:bg-emerald-500"
                style={{ transform: `translateX(${activeLangIndex * 100}%)` }}
              />
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`relative z-10 rounded-lg py-1.5 text-xs font-semibold transition-colors duration-200 ${
                    language === lang.code
                      ? "text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme toggle — animated switch */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-200 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <span>{isDark ? t("lightMode") : t("darkMode")}</span>
            <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-slate-300 transition-colors duration-200 dark:bg-emerald-900">
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${
                  isDark ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              >
                {isDark ? (
                  <Moon size={10} className="text-slate-700" />
                ) : (
                  <Sun size={10} className="text-amber-500" />
                )}
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2 px-2 pt-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-100">
              {t("greeting")}, <span className="font-semibold">{userName}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-200 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98] dark:hover:bg-red-900/30 dark:hover:text-red-300"
          >
            <LogOut size={15} />
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}