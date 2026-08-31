import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useLanguage } from "../dashboard/context/LanguageContext";
import { useTheme } from "../dashboard/context/ThemeContext";

const API = "https://localhost:44331";

// ─── Colour helpers (same as FarmHistory) ───────────────────────────────────
function riskColor(r) {
  if (r >= 60) return "#c0392b";
  if (r >= 30) return "#b7770d";
  return "#0f6e56";
}

function riskLabel(r, t) {
  if (r >= 60) return t("history.badgeHigh");
  if (r >= 30) return t("history.badgeModerate");
  return t("history.badgeHealthy");
}
function fmtDateOnly(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function fmtDate(d) {
  if (!d) return "";
  const s = typeof d === "string" ? d : d.toISOString?.();
  return s?.slice(5, 10) ?? "";
}

// ─── Leaf icon (same as FarmHistory) ────────────────────────────────────────
function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-white">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c0-5.5-4-10-10-10 5.5 0 10 4 10 10 0-5.5 4-10 10-10S17.5 2 12 2z" />
    </svg>
  );
}

// ─── SVG Forecast Chart ─────────────────────────────────────────────────────
function ForecastChart({ history, forecast, isDark }) {
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  const data = useMemo(() => {
    const hist = (history || []).map((h) => ({
      ...h,
      _type: "actual",
      _sort: new Date(h.date).getTime(),
    }));
    const fore = (forecast || []).map((f) => ({
      date: f.forecastDate ?? f.forecastDate,
      risk: f.predictedRisk,
      lower: f.riskLowerBound,
      upper: f.riskUpperBound,
      _type: "forecast",
      _sort: new Date(f.forecastDate).getTime(),
    }));
    return [...hist, ...fore].sort((a, b) => a._sort - b._sort);
  }, [history, forecast]);

  if (data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-3xl opacity-30 mb-2">📉</div>
        <div className="text-xs text-slate-400 dark:text-slate-500">Not enough data to draw chart</div>
      </div>
    );
  }

  const width = 720;
  const height = 280;
  const pad = { top: 16, right: 16, bottom: 36, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const minT = data[0]._sort;
  const maxT = data[data.length - 1]._sort;
  const xScale = (t) => pad.left + ((t - minT) / (maxT - minT || 1)) * innerW;
  const yScale = (v) => pad.top + innerH - (v / 100) * innerH;

  const actualPts = data
    .filter((d) => d._type === "actual")
    .map((d) => [xScale(d._sort), yScale(d.risk)]);
  const forecastPts = data
    .filter((d) => d._type === "forecast")
    .map((d) => [xScale(d._sort), yScale(d.risk)]);

  const toPath = (pts) =>
    pts.length
      ? "M " + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L ")
      : "";

  const bandPts = [];
  const foreData = data.filter((d) => d._type === "forecast");
  foreData.forEach((d) => bandPts.push([xScale(d._sort), yScale(d.upper)]));
  for (let i = foreData.length - 1; i >= 0; i--) {
    const d = foreData[i];
    bandPts.push([xScale(d._sort), yScale(d.lower)]);
  }
  const bandPath = bandPts.length
    ? "M " + bandPts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L ") + " Z"
    : "";

  const hoverData = hoverIdx != null ? data[hoverIdx] : null;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: 360 }}
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          if (!svgRef.current) return;
          const rect = svgRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, (x - pad.left) / innerW));
          const targetT = minT + ratio * (maxT - minT);
          let best = 0, bestDiff = Infinity;
          data.forEach((d, i) => {
            const diff = Math.abs(d._sort - targetT);
            if (diff < bestDiff) { bestDiff = diff; best = i; }
          });
          setHoverIdx(best);
        }}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={pad.left} y1={yScale(v)} x2={width - pad.right} y2={yScale(v)}
              stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeWidth={1}
            />
            <text x={pad.left - 8} y={yScale(v) + 3} textAnchor="end" fontSize={10}
              fill={isDark ? "#64748b" : "#94a3b8"}>
              {v}
            </text>
          </g>
        ))}

        {/* X labels */}
        {data.filter((_, i) => i % Math.max(1, Math.ceil(data.length / 6)) === 0).map((d, i) => (
          <text key={i} x={xScale(d._sort)} y={height - 8} textAnchor="middle" fontSize={10}
            fill={isDark ? "#64748b" : "#94a3b8"}>
            {fmtDateOnly(d.date)}
          </text>
        ))}

        {/* Confidence band */}
        {bandPath && (
          <path d={bandPath}
            fill={isDark ? "rgba(16,185,129,0.10)" : "rgba(16,185,129,0.16)"}
            stroke="none" />
        )}

        {/* Actual line */}
        {actualPts.length > 1 && (
          <path d={toPath(actualPts)} fill="none"
            stroke={isDark ? "#34d399" : "#059669"} strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Forecast line */}
        {forecastPts.length > 1 && (
          <path d={toPath(forecastPts)} fill="none"
            stroke={isDark ? "#fbbf24" : "#d97706"} strokeWidth={2.5}
            strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Hover */}
        {hoverData && (
          <g>
            <line x1={xScale(hoverData._sort)} y1={pad.top}
              x2={xScale(hoverData._sort)} y2={height - pad.bottom}
              stroke={isDark ? "#475569" : "#cbd5e1"} strokeDasharray="4 3" strokeWidth={1} />
            <circle cx={xScale(hoverData._sort)} cy={yScale(hoverData.risk)} r={5}
              fill={hoverData._type === "actual" ? "#34d399" : "#fbbf24"}
              stroke={isDark ? "#0f172a" : "#fff"} strokeWidth={2} />
          </g>
        )}
      </svg>

      {hoverData && (
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {hoverData.date}
            <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
            <span className="font-semibold" style={{ color: riskColor(hoverData.risk) }}>
              {hoverData.risk.toFixed(1)}%
            </span>
            {hoverData._type === "forecast" && (
              <span className="text-slate-400 dark:text-slate-500 ml-1">
                ({(hoverData.lower ?? 0).toFixed(0)}–{(hoverData.upper ?? 0).toFixed(0)})
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded"
            style={{
              background: hoverData.risk >= 60
                ? (isDark ? "rgba(192,57,43,0.15)" : "rgba(192,57,43,0.08)")
                : hoverData.risk >= 30
                ? (isDark ? "rgba(183,119,13,0.15)" : "rgba(183,119,13,0.08)")
                : (isDark ? "rgba(15,110,86,0.15)" : "rgba(15,110,86,0.08)"),
              color: riskColor(hoverData.risk),
            }}>
            {hoverData._type === "actual" ? "Actual" : "Forecast"}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component (full page, self-loading, matches FarmHistory) ──────────
export function FarmForecast() {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // ── Farm selector state (same pattern as FarmHistory) ────────────────────
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);

  // ── Forecast state ───────────────────────────────────────────────────────
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Load farms on mount (same as FarmHistory) ───────────────────────────
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    axios.get(`${API}/api/farm/${userId}`)
      .then(({ data }) => {
        const raw = Array.isArray(data) ? data : [data];
        const list = raw.map(f => ({
          farmId:    f.farmId    ?? f.FarmId,
          name:      f.name      ?? f.Name      ?? "My Farm",
          polygon:   f.polygon   ?? f.Polygon   ?? null,
          latitude:  f.latitude  ?? f.Latitude  ?? null,
          longitude: f.longitude ?? f.Longitude ?? null,
        }));
        setFarms(list);
        if (list.length > 0) setSelectedFarm(list[0]);
      })
      .catch(() => {});
  }, []);

  // ── Fetch forecast when farm changes ─────────────────────────────────────
  useEffect(() => {
    if (!selectedFarm) return;

    const farmId = selectedFarm.farmId ?? selectedFarm.FarmId;
    setLoading(true);
    setError(null);
    setData(null);

    axios.get(`${API}/api/forecast/${farmId}`)
      .then(({ data }) => setData(data))
      .catch((err) => {
        const msg = err.response?.data?.message || t("forecast.loadError");
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [selectedFarm, t]);

  const summary = data?.summary;
  const forecast = data?.forecast;
  const actualHistory = data?.actualHistory;

  return (
    <div id="forecast-root" className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased">

      {/* ── Header (exact same pattern as FarmHistory) ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <LeafIcon />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {t("forecast.title")}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold">
              {data?.snapshotDate
                ? `${t("forecast.basedOn")} ${fmtDateOnly(data.snapshotDate)}`
                : t("forecast.subtitle")}
            </div>
          </div>
        </div>

        <div>
          {farms.length > 1 ? (
            <select
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer transition-colors duration-150 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              value={selectedFarm?.farmId ?? ""}
              onChange={e => {
                const f = farms.find(x => x.farmId === Number(e.target.value));
                if (f) setSelectedFarm(f);
              }}
            >
              {farms.map(f => (
                <option key={f.farmId} value={f.farmId}>{f.name}</option>
              ))}
            </select>
          ) : farms.length === 1 ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {farms[0].name}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 p-4 flex-1 min-h-0">

        {/* LEFT: Chart area */}
        <div className="flex flex-col gap-4 min-h-0">

          {/* Chart card */}
          <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 min-h-[320px]">
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold tracking-[0.2em] uppercase">
                <div className="h-8 w-8 rounded-full border-2 border-emerald-400/30 border-t-emerald-500 animate-spin" />
                {t("forecast.loading")}
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="text-3xl mb-2">⚠️</div>
                <div className="text-xs text-rose-500 dark:text-rose-400 max-w-xs">{error}</div>
              </div>
            )}

            {!loading && !error && data && (
              <>
                <ForecastChart
                  history={actualHistory}
                  forecast={forecast}
                  isDark={isDark}
                />
                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="h-0.5 w-4 rounded bg-emerald-500" />
                    <span>{t("forecast.legendActual")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-0.5 w-4 rounded bg-amber-400" />
                    <span>{t("forecast.legendForecast")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/20" />
                    <span>{t("forecast.legendBand")}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Daily forecast list (scrollable) */}
          {!loading && !error && forecast && forecast.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex-1 overflow-y-auto custom-scrollbar">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                {t("forecast.subtitle")}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {forecast.map((row) => {
                  const col = riskColor(row.predictedRisk);
                  return (
                    <div key={row.horizonDays}
                      className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                        {row.forecastDate?.slice(5, 10)}
                      </div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: col }}>
                        {row.predictedRisk.toFixed(0)}%
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500">
                        {row.riskLowerBound?.toFixed(0)}–{row.riskUpperBound?.toFixed(0)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Side panel stats */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">

          {/* Summary stats */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 transition-shadow duration-200 hover:shadow-md">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              {t("history.stats")}
            </div>
            {summary ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3">
                  <span className="text-xl font-bold tabular-nums" style={{ color: riskColor(summary.peakRisk) }}>
                    {summary.peakRisk.toFixed(1)}%
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">
                    {t("forecast.peakRisk")}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3">
                  <span className="text-xl font-bold tabular-nums" style={{ color: riskColor(summary.averageRisk) }}>
                    {summary.averageRisk.toFixed(1)}%
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">
                    {t("forecast.avg")}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3">
                  <span className="text-xl font-bold tabular-nums" style={{ color: "#c0392b" }}>
                    {summary.highRiskDays}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">
                    {t("forecast.highDays")}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3">
                  <span className="text-xl font-bold tabular-nums" style={{ color: "#0f6e56" }}>
                    {summary.lowRiskDays}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">
                    {t("forecast.lowDays")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                <div className="text-2xl opacity-40">📊</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  {loading ? t("forecast.loading") : t("forecast.loadError")}
                </div>
              </div>
            )}
          </div>

          {/* Risk distribution bars */}
          {summary && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 transition-shadow duration-200 hover:shadow-md">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                {t("history.riskDistribution")}
              </div>
              {[
                { label: t("history.high"), count: summary.highRiskDays, total: 30, color: "#e24b4a" },
                { label: t("history.medium"), count: summary.moderateRiskDays, total: 30, color: "#ef9f27" },
                { label: t("history.low"), count: summary.lowRiskDays, total: 30, color: "#1d9e75" },
              ].map(({ label, count, total, color }) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div className="flex items-center gap-2 py-1.5 text-xs" key={label}>
                    <div className="w-14 text-slate-500 dark:text-slate-400 font-medium">{label}</div>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div className="w-9 text-right font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{pct}%</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Risk legend */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 mb-1">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              {t("history.riskIndex")}
            </div>
            <div className="h-2 rounded-full bg-gradient-to-r from-[#ffffb2] via-[#fd8d3c] to-[#bd0026]" />
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              <span>0 {t("history.lowEnd")}</span><span>25</span><span>50</span><span>75</span><span>100 {t("history.highEnd")}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default FarmForecast;
