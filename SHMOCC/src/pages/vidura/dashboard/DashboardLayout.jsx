import { NavLink, Outlet, useNavigate } from "react-router-dom";
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
  const { t, language, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const userName = localStorage.getItem("userName") || "Farmer";

  const NAV_ITEMS = [
    { label: t("nav.register"), to: "fields/register", icon: "📍" },
    { label: t("nav.history"), to: "farmhistory", icon: "🕓" },
    { label: t("nav.predict"), to: "FarmForecast", icon: "📈" },
  ];

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    navigate(LOGIN_PATH, { replace: true });
  };

  const linkClasses = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-out ${
      isActive
        ? "bg-brand-active text-brand-text shadow-sm dark:bg-emerald-900/60 dark:text-emerald-100"
        : "text-brand-textMuted hover:bg-brand-hover hover:translate-x-0.5 dark:text-slate-300 dark:hover:bg-slate-800/70"
    }`;

  const activeLangIndex = LANGUAGES.findIndex((l) => l.code === language);

  return (
    <div className="flex min-h-screen w-full bg-brand-bg dark:bg-slate-950 font-['DM_Sans']">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-brand-border/14 dark:border-slate-800 bg-brand-surface dark:bg-slate-900 px-4 py-6">
        <button
          onClick={() => navigate("")}
          className="flex items-center gap-2 px-2 mb-8 text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-brand-accent shadow-[0_0_10px_rgba(232,149,106,0.85)] animate-pulse" />
          <span className="font-['Syne'] font-extrabold text-brand-text dark:text-emerald-100 tracking-tight">
            {t("appName")}
          </span>
        </button>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClasses}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-accent dark:bg-emerald-400" />
                  )}
                  <span className="text-base transition-transform duration-300 group-hover:scale-110">
                    {item.icon}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-brand-border/14 dark:border-slate-800 space-y-3">
          {/* Language switch — segmented control with sliding indicator */}
          <div className="space-y-1.5">
            <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-brand-textMuted/70 dark:text-slate-500">
              {t("language")}
            </span>
            <div className="relative grid grid-cols-3 rounded-xl border border-brand-border/14 bg-brand-bg p-1 dark:border-slate-700 dark:bg-slate-800">
              {/* Sliding active pill */}
              <span
                className="absolute inset-y-1 left-1 w-[calc(33.333%-0.334rem)] rounded-lg bg-brand-accent shadow-sm transition-transform duration-300 ease-out dark:bg-emerald-500"
                style={{ transform: `translateX(${activeLangIndex * 100}%)` }}
              />
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    if (lang.code !== language) toggleLanguage();
                  }}
                  className={`relative z-10 rounded-lg py-1.5 text-xs font-semibold transition-colors duration-300 ${
                    language === lang.code
                      ? "text-white"
                      : "text-brand-textMuted hover:text-brand-text dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme toggle — animated switch */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between rounded-xl border border-brand-border/14 dark:border-slate-700 bg-brand-bg dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-brand-textMuted dark:text-slate-200 transition-colors duration-300 hover:bg-brand-hover dark:hover:bg-slate-700"
          >
            <span>{isDark ? t("lightMode") : t("darkMode")}</span>
            <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-brand-border/30 transition-colors duration-300 dark:bg-emerald-900">
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] shadow-md transition-transform duration-300 ease-out ${
                  isDark ? "translate-x-4.5" : "translate-x-0.5"
                }`}
              >
                {isDark ? "🌙" : "☀️"}
              </span>
            </span>
          </button>

          <div className="px-2 pt-1 text-sm font-medium text-brand-text dark:text-slate-100">
            {t("greeting")}, <span className="font-semibold">{userName}</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full rounded-xl border border-brand-border/14 dark:border-slate-700 bg-brand-bg dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-brand-textMuted dark:text-slate-200 transition-all duration-300 hover:bg-red-50 hover:text-brand-danger active:scale-[0.98] dark:hover:bg-red-900/30"
          >
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