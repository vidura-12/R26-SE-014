import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "../dashboard/context/LanguageContext"; // adjust path to your file location
import { useTheme } from "../dashboard/context/ThemeContext";        // adjust path to your file location

// ─── Colour helpers ───────────────────────────────────────────────────────────
function riskToRGB(risk) {
  const v = Math.max(0, Math.min(100, isNaN(risk) ? 0 : risk));
  const stops = [
    { t: 0,   r: 255, g: 255, b: 178 },
    { t: 25,  r: 254, g: 204, b: 92  },
    { t: 50,  r: 253, g: 141, b: 60  },
    { t: 75,  r: 240, g: 59,  b: 32  },
    { t: 100, r: 189, g: 0,   b: 38  },
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (v >= stops[i].t && v <= stops[i + 1].t) {
      lo = stops[i]; hi = stops[i + 1]; break;
    }
  }
  const f = (v - lo.t) / ((hi.t - lo.t) || 1);
  return {
    R: Math.round(lo.r + f * (hi.r - lo.r)),
    G: Math.round(lo.g + f * (hi.g - lo.g)),
    B: Math.round(lo.b + f * (hi.b - lo.b)),
  };
}

const riskColor = r => {
  const { R, G, B } = riskToRGB(r);
  return `rgb(${R},${G},${B})`;
};

const CELL_DEG = 0.00009;
const API      = "https://localhost:44331";

// ─── Popup HTML (Tailwind classes — project must have Tailwind's JIT scanning this file) ──
// NOTE: labels param added so the Leaflet popup (plain HTML, outside React) can show
// translated text too. Nothing about how the popup is built or triggered has changed.
function popupHtml(p, labels) {
  const col   = riskColor(p.risk);
  const badge = p.risk >= 69.99 ? labels.high : p.risk >= 69.99 ? labels.medium : labels.low;
  return `
    <div class="min-w-[180px] font-sans text-xs text-emerald-50">
      <div class="text-[9px] text-emerald-400 tracking-[0.15em] mb-2 uppercase font-medium">
        ${labels.cell} · ${p.cellId ?? ""}
      </div>
      <div class="flex items-center gap-2.5 mb-2.5">
        <div class="w-7 h-7 rounded-lg flex-shrink-0 shadow-inner" style="background:${col}"></div>
        <div>
          <div class="text-xl font-bold leading-none" style="color:${col}">
            ${(+p.risk).toFixed(1)}<span class="text-[10px] text-emerald-400">%</span>
          </div>
          <div class="text-[9px] text-emerald-400 mt-1 tracking-wide uppercase font-medium">${badge}</div>
        </div>
      </div>
      <div class="border-t border-emerald-900/60 pt-2 grid gap-1">
        <div class="flex justify-between">
          <span class="text-emerald-400/90">${labels.avgNdvi}</span>
          <span class="font-semibold">${isNaN(p.ndvi) ? "—" : (+p.ndvi).toFixed(4)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-emerald-400/90">${labels.avgNdmi}</span>
          <span class="font-semibold">${isNaN(p.ndmi) ? "—" : (+p.ndmi).toFixed(4)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-emerald-400/90">${labels.pixels}</span>
          <span class="font-semibold">${p.pixelCount ?? "—"}</span>
        </div>
        <div class="mt-1.5 text-emerald-500 text-[10px]">${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}</div>
      </div>
    </div>
  `;
}

// ─── Draw grid ────────────────────────────────────────────────────────────────
function drawGrid(map, points, layerRef, renderer, opacity) {
  if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
  if (!points?.length || !renderer) return new Map();

  const group      = L.featureGroup();
  const cellLookup = new Map();
  const h          = CELL_DEG / 2;

  points.forEach(p => {
    if (!isFinite(p.lat) || !isFinite(p.lon)) return;
    const corners = [
      [p.lat - h, p.lon - h], [p.lat - h, p.lon + h],
      [p.lat + h, p.lon + h], [p.lat + h, p.lon - h],
    ];
    const col       = riskColor(p.risk);
    const intensity = 0.6 + (Math.min(100, Math.max(0, p.risk)) / 100) * 0.4;

    L.polygon(corners, {
      renderer, color: col, fillColor: col,
      fillOpacity: opacity * intensity,
      weight: 0, opacity: 0, smoothFactor: 0, interactive: false,
    }).addTo(group);

    const key = `${Math.round(p.lat / CELL_DEG)}_${Math.round(p.lon / CELL_DEG)}`;
    cellLookup.set(key, p);
  });

  group.addTo(map);
  layerRef.current = group;
  return cellLookup;
}

// ─── Calendar ────────────────────────────────────────────────────────────────
function Calendar({ availableDates, selectedDate, onSelect, t }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(() => {
    if (availableDates?.length) {
      return new Date(availableDates[availableDates.length - 1]).getFullYear();
    }
    return today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (availableDates?.length) {
      return new Date(availableDates[availableDates.length - 1]).getMonth();
    }
    return today.getMonth();
  });

  const dateSet     = new Set((availableDates || []).map(d => String(d).slice(0, 10)));
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevDays    = new Date(viewYear, viewMonth, 0).getDate();

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const WDAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDay + 1;
    if (dayNum < 1) {
      cells.push({ day: prevDays + dayNum, otherMonth: true });
    } else if (dayNum > daysInMonth) {
      cells.push({ day: dayNum - daysInMonth, otherMonth: true });
    } else {
      const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push({ day: dayNum, otherMonth: false, iso, hasData: dateSet.has(iso) });
    }
  }

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selStr   = selectedDate ? String(selectedDate).slice(0, 10) : null;
  const todayIso = today.toISOString().slice(0, 10);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button
          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors duration-150"
          onClick={goPrev}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors duration-150"
          onClick={goNext}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WDAYS.map(w => (
          <div key={w} className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          const isSel   = !c.otherMonth && c.iso === selStr;
          const isToday = !c.otherMonth && c.iso === todayIso;
          const base = "aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-150 select-none";
          const state = c.otherMonth
            ? "text-slate-300 dark:text-slate-700"
            : isSel
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 cursor-pointer"
              : c.hasData
                ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 hover:scale-105 cursor-pointer"
                : "text-slate-400 dark:text-slate-600 cursor-default";
          const ring = isToday && !isSel ? "ring-1 ring-inset ring-emerald-400" : "";
          return (
            <div
              key={i}
              className={`${base} ${state} ${ring}`}
              onClick={() => c.hasData && onSelect(c.iso)}
              title={c.hasData ? t("history.dateHasData") : undefined}
            >
              {c.day}
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 text-center font-medium">
        {availableDates?.length
          ? `${availableDates.length} ${availableDates.length !== 1 ? t("history.snapshotsAvailable") : t("history.snapshotAvailable")}`
          : t("history.noDataFarm")}
      </div>
      <div className="flex items-center gap-1.5 justify-center mt-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="text-[10px] text-slate-400 dark:text-slate-500">{t("history.dateHasData")}</span>
      </div>
    </>
  );
}

// ─── AI Analysis Panel ────────────────────────────────────────────────────────
function AiPanel({ data, loading, error, t }) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
          {t("history.aiAnalysis")}
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-400 dark:text-slate-500 py-2">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-emerald-400/30 border-t-emerald-500 animate-spin" />
          <span>{t("history.aiRunning")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
          {t("history.aiAnalysis")}
        </div>
        <div className="text-xs text-rose-500 dark:text-rose-400 py-1">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const statusMap = {
    "HIGH RISK": { color: "#c0392b", bg: "rgba(224,74,74,0.1)",   label: t("history.badgeHigh") },
    "MODERATE":  { color: "#b7770d", bg: "rgba(239,159,39,0.1)",  label: t("history.badgeModerate") },
    "UNCERTAIN": { color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: t("history.badgeUncertain") },
    "HEALTHY":   { color: "#0f6e56", bg: "rgba(29,158,117,0.1)",  label: t("history.badgeHealthy") },
  };
  const s = statusMap[data.healthStatus] ?? statusMap["UNCERTAIN"];

  const metrics = [
    { label: t("history.avgNdvi"), value: data.avgNdvi  != null ? (+data.avgNdvi).toFixed(3)  : null },
    { label: t("history.avgNdmi"), value: data.avgNdmi  != null ? (+data.avgNdmi).toFixed(3)  : null },
    { label: t("history.high"),   value: data.avgRisk  != null ? `${(+data.avgRisk).toFixed(1)}%` : null,
      color: data.avgRisk >= 60 ? "#c0392b" : data.avgRisk >= 30 ? "#b7770d" : "#0f6e56" },
    { label: `${t("history.avgNdvi")} Δ`, value: data.ndviTrend != null
        ? `${data.ndviTrend >= 0 ? "+" : ""}${(+data.ndviTrend).toFixed(3)}` : null,
      color: data.ndviTrend < 0 ? "#c0392b" : "#0f6e56" },
    { label: `${t("history.high")} Δ`, value: data.riskTrend != null
        ? `${data.riskTrend >= 0 ? "+" : ""}${(+data.riskTrend).toFixed(1)}` : null,
      color: data.riskTrend > 0 ? "#c0392b" : "#0f6e56" },
    { label: "Cloud",  value: data.cloudCoverPct != null ? `${(+data.cloudCoverPct).toFixed(1)}%` : null },
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 transition-shadow duration-200 hover:shadow-md">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
        {t("history.aiAnalysis")}
      </div>

      {/* Status badge */}
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold mb-2.5"
        style={{ background: s.bg, color: s.color }}
      >
        {s.label}
        <span className="font-normal opacity-70">· {Math.round(data.confidenceScore * 100)}% {t("history.confidence")}</span>
      </div>

      {/* Narrative */}
      {(data.aiExplanation || data.recommendation) && (
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mb-3">
          {data.aiExplanation || data.recommendation}
        </p>
      )}

      {/* Flags */}
      {(data.isCloudAffected || data.isWeatherAffected || data.isTemporaryAnomaly || data.isSuspectSpike) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {data.isCloudAffected && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  style={{ color: "#185fa5", borderColor: "#b5d4f4", background: "#e6f1fb" }}>
              ☁ {t("history.flagCloud")}
            </span>
          )}
          {data.isWeatherAffected && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  style={{ color: "#0f6e56", borderColor: "#9fe1cb", background: "#e1f5ee" }}>
              🌧 {t("history.flagWeather")}
            </span>
          )}
          {data.isTemporaryAnomaly && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  style={{ color: "#854f0b", borderColor: "#fac775", background: "#faeeda" }}>
              ⚡ {t("history.flagAnomaly")}
            </span>
          )}
          {data.isSuspectSpike && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  style={{ color: "#993c1d", borderColor: "#f5c4b3", background: "#faece7" }}>
              ⚠ {t("history.flagSpike")}
            </span>
          )}
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2">
        {metrics.map(({ label, value, color }) => (
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 py-2" key={label}>
            <div className="text-[9px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">{label}</div>
            <div className="text-sm font-bold tabular-nums" style={{ color: color ?? "#111" }}>
              {value ?? "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Logo SVG ─────────────────────────────────────────────────────────────────
function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-white">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c0-5.5-4-10-10-10 5.5 0 10 4 10 10 0-5.5 4-10 10-10S17.5 2 12 2z" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function FarmHistory() {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();

  const mapRef        = useRef(null);
  const rendererRef   = useRef(null);
  const gridRef       = useRef(null);
  const farmOutRef    = useRef(null);
  const cellLookupRef = useRef(new Map());
  const popupRef      = useRef(null);
  const farmBoundsRef = useRef(null);

  // Keeps translated popup labels fresh for the Leaflet click handler,
  // which is attached once on mount (see init effect below).
  const popupLabelsRef = useRef({});
  popupLabelsRef.current = {
    high: t("history.high"),
    medium: t("history.medium"),
    low: t("history.low"),
    cell: t("history.cell"),
    avgNdvi: t("history.avgNdvi"),
    avgNdmi: t("history.avgNdmi"),
    pixels: t("history.pixels"),
  };

  const [farms,         setFarms]         = useState([]);
  const [selectedFarm,  setSelectedFarm]  = useState(null);
  const [dates,         setDates]         = useState([]);
  const [selectedDate,  setSelectedDate]  = useState(null);
  const [summary,       setSummary]       = useState(null);
  const [loadingDates,  setLoadingDates]  = useState(false);
  const [loadingPixels, setLoadingPixels] = useState(false);
  const [mapReady,      setMapReady]      = useState(false);

  const [aiData,    setAiData]    = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState(null);

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("hist-map", {
      minZoom: 13, maxZoom: 22, zoomControl: false, zoomSnap: 0.5,
    }).setView([6.25, 80.50], 15);

    mapRef.current = map;
    L.control.zoom({ position: "bottomleft" }).addTo(map);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Esri", maxNativeZoom: 19, maxZoom: 22 }
    ).addTo(map);

    popupRef.current = L.popup({ maxWidth: 220, className: "farm-popup" });
    map.on("click", (e) => {
      const key = `${Math.round(e.latlng.lat / CELL_DEG)}_${Math.round(e.latlng.lng / CELL_DEG)}`;
      const p   = cellLookupRef.current.get(key);
      if (!p) return;
      popupRef.current.setLatLng(e.latlng).setContent(popupHtml(p, popupLabelsRef.current)).openOn(map);
    });

    map.whenReady(() => {
      rendererRef.current = L.canvas({ padding: 0.5 });
      setMapReady(true);
    });

    const userId = localStorage.getItem("userId");
    if (userId) {
      axios.get(`${API}/api/farm/${userId}`)
        .then(({ data }) => {
          const raw  = Array.isArray(data) ? data : [data];
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
    }

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ── Draw farm outline ─────────────────────────────────────────────────────
  const drawFarmOutline = useCallback((farm) => {
    const map     = mapRef.current;
    const polygon = farm.polygon ?? farm.Polygon;
    if (!map || !polygon) return;

    if (farmOutRef.current) { map.removeLayer(farmOutRef.current); farmOutRef.current = null; }

    try {
      const coords  = JSON.parse(polygon);
      const latLngs = coords.map(c => [parseFloat(c[1]), parseFloat(c[0])]);
      const outline = L.polygon(latLngs, {
        color: "#1d9e75", weight: 2, fillOpacity: 0, dashArray: "6 4",
      }).addTo(map);
      farmOutRef.current  = outline;
      const bounds        = outline.getBounds();
      farmBoundsRef.current = bounds;
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 18 });
      const expanded = bounds.pad(0.5);
      map.setMaxBounds(expanded);
      map.options.minZoom = map.getZoom() - 1;
    } catch (_) {}
  }, []);

  // ── Fetch dates when farm changes ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedFarm) return;

    setDates([]);
    setSelectedDate(null);
    setSummary(null);
    setAiData(null);
    if (gridRef.current && mapRef.current) {
      mapRef.current.removeLayer(gridRef.current);
      gridRef.current = null;
    }
    cellLookupRef.current = new Map();
    drawFarmOutline(selectedFarm);
    setLoadingDates(true);

    const farmId = selectedFarm.farmId ?? selectedFarm.FarmId;
    axios.get(`${API}/api/farmhistory/${farmId}/dates`)
      .then(({ data }) => {
        const normalized = (Array.isArray(data) ? data : [])
          .map(d =>
            typeof d === "string" ? d.slice(0, 10)
            : String(d.captureDate ?? d.CaptureDate ?? d).slice(0, 10)
          )
          .filter(Boolean)
          .sort();
        setDates(normalized);
        if (normalized.length > 0) setSelectedDate(normalized[normalized.length - 1]);
      })
      .catch(() => setDates([]))
      .finally(() => setLoadingDates(false));
  }, [selectedFarm, drawFarmOutline]);

  // ── Fetch pixels + AI when date changes ──────────────────────────────────
  useEffect(() => {
    if (!selectedFarm || !selectedDate || !mapReady) return;

    const farmId    = selectedFarm.farmId ?? selectedFarm.FarmId;
    const dateParam = String(selectedDate).slice(0, 10);

    setLoadingPixels(true);
    setSummary(null);

    axios.get(`${API}/api/farmhistory/${farmId}/pixels`, { params: { date: dateParam } })
      .then(({ data }) => {
        const norm = {
          totalCells: data.totalCells  ?? data.TotalCells  ?? 0,
          avgRisk:    data.avgRisk     ?? data.AvgRisk     ?? 0,
          maxRisk:    data.maxRisk     ?? data.MaxRisk     ?? 0,
          highRisk:   data.highRisk    ?? data.HighRisk    ?? 0,
          mediumRisk: data.mediumRisk  ?? data.MediumRisk  ?? 0,
          lowRisk:    data.lowRisk     ?? data.LowRisk     ?? 0,
          avgNDVI:    data.avgNDVI     ?? data.AvgNDVI     ?? null,
          avgNDMI:    data.avgNDMI     ?? data.AvgNDMI     ?? null,
          pixels:     data.pixels      ?? data.Pixels      ?? [],
        };
        setSummary(norm);

        const pixels = norm.pixels.map(p => ({
          lat:        parseFloat(p.latitude   ?? p.Latitude   ?? 0),
          lon:        parseFloat(p.longitude  ?? p.Longitude  ?? 0),
          risk:       parseFloat(p.risk       ?? p.Risk       ?? 0),
          ndvi:       parseFloat(p.ndvi       ?? p.NDVI),
          ndmi:       parseFloat(p.ndmi       ?? p.NDMI),
          cellId:     p.cellId     ?? p.CellId     ?? "",
          pixelCount: p.pixelCount ?? p.PixelCount,
        })).filter(p => isFinite(p.lat) && isFinite(p.lon) && p.lat !== 0);

        const map = mapRef.current;
        if (map) {
          const lookup = drawGrid(map, pixels, gridRef, rendererRef.current, 0.80);
          cellLookupRef.current = lookup;
          if (farmOutRef.current) farmOutRef.current.bringToFront();
        }
      })
      .catch(() => setSummary(null))
      .finally(() => setLoadingPixels(false));

    setAiData(null);
    setAiError(null);
    setAiLoading(true);

    axios.get(`${API}/api/farmhistory/${farmId}/ai-analysis`, {
        params: {
          date: dateParam,
          language: language
        }
      })
      .then(({ data }) => setAiData(data))
      .catch(() => setAiError(t("history.aiUnavailable")))
      .finally(() => setAiLoading(false));

  }, [selectedFarm, selectedDate, mapReady, language]);
  
  // ── Helpers ───────────────────────────────────────────────────────────────
  const riskPct      = (count) => summary?.totalCells ? Math.round((count / summary.totalCells) * 100) : 0;
  const avgRiskColor = summary
    ? (summary.avgRisk >= 60 ? "#c0392b" : summary.avgRisk >= 30 ? "#b7770d" : "#0f6e56")
    : "#0f6e56";

  return (
    <div id="hist-root" className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased">

      {/* Scoped extras Tailwind can't express: leaflet chrome + scrollbar + spin timing */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? "#334155" : "#cbd5e1"}; border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDark ? "#475569" : "#94a3b8"}; }

        .farm-popup .leaflet-popup-content-wrapper {
          background: #0b1f16;
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 14px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.45);
        }
        .farm-popup .leaflet-popup-content { margin: 14px 16px; }
        .farm-popup .leaflet-popup-tip { background: #0b1f16; border: 1px solid rgba(16,185,129,0.25); }
        .farm-popup .leaflet-popup-close-button { color: #6ee7b7 !important; }

        .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 14px rgba(0,0,0,0.25) !important; border-radius: 10px !important; overflow: hidden; }
        .leaflet-control-zoom a { background: rgba(15,23,25,0.9) !important; color: #d1fae5 !important; border: none !important; }
        .leaflet-control-zoom a:hover { background: #10b981 !important; color: #fff !important; }
      `}</style>

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <LeafIcon />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {t("history.title")}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold">
              {t("history.subtitle")}
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

      {/* ── Main ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 p-4 flex-1 min-h-0">

        {/* Map */}
        <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 bg-slate-900 min-h-[320px]">
          {loadingPixels && (
            <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 bg-slate-900/70 backdrop-blur-sm text-emerald-300 text-[11px] font-semibold tracking-[0.2em] uppercase transition-opacity duration-200">
              <div className="h-8 w-8 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
              {t("history.loadingSnapshot")}
            </div>
          )}
          <div id="hist-map" className="absolute inset-0" />
          {selectedDate && !loadingPixels && (
            <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-emerald-200 shadow-lg border border-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {String(selectedDate).slice(0, 10)}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">

          {/* Calendar */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 transition-shadow duration-200 hover:shadow-md">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              {loadingDates ? t("history.loadingDates") : t("history.snapshotDate")}
            </div>
            {!loadingDates ? (
              <Calendar
                availableDates={dates}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                t={t}
              />
            ) : (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 rounded-full border-2 border-emerald-400/30 border-t-emerald-500 animate-spin" />
              </div>
            )}
          </div>

          {/* Snapshot stats */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 transition-shadow duration-200 hover:shadow-md">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              {t("history.stats")}
            </div>
            {summary ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3">
                  <span className="text-xl font-bold tabular-nums" style={{ color: "#185fa5" }}>{summary.totalCells}</span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">{t("history.totalCells")}</span>
                </div>
                <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3">
                  <span className="text-xl font-bold tabular-nums" style={{ color: avgRiskColor }}>{(+summary.avgRisk).toFixed(1)}%</span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">{t("history.avgRisk")}</span>
                </div>
                <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3">
                  <span className="text-xl font-bold tabular-nums" style={{ color: "#c0392b" }}>{(+summary.maxRisk).toFixed(1)}%</span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">{t("history.peakRisk")}</span>
                </div>
                <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3">
                  <span className="text-xl font-bold tabular-nums" style={{ color: "#c0392b" }}>{summary.highRisk}</span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">{t("history.highRiskCells")}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                <div className="text-2xl opacity-40">📊</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 whitespace-pre-line">
                  {selectedDate ? t("history.loading") : t("history.pickDatePrompt")}
                </div>
              </div>
            )}
          </div>

          {/* Risk distribution */}
          {summary && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 transition-shadow duration-200 hover:shadow-md">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                {t("history.riskDistribution")}
              </div>
              {[
                { label: t("history.high"),   count: summary.highRisk,   color: "#e24b4a" },
                { label: t("history.medium"), count: summary.mediumRisk, color: "#ef9f27" },
                { label: t("history.low"),    count: summary.lowRisk,    color: "#1d9e75" },
              ].map(({ label, count, color }) => {
                const pct = riskPct(count);
                return (
                  <div className="flex items-center gap-2 py-1.5 text-xs" key={label}>
                    <div className="w-14 text-slate-500 dark:text-slate-400 font-medium">{label}</div>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <div className="w-9 text-right font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{pct}%</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Vegetation indices */}
          {summary && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 transition-shadow duration-200 hover:shadow-md">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                {t("history.vegetation")}
              </div>
              {[
                { name: t("history.avgNdvi"), val: summary.avgNDVI != null ? (+summary.avgNDVI).toFixed(4) : "—" },
                { name: t("history.avgNdmi"), val: summary.avgNDMI != null ? (+summary.avgNDMI).toFixed(4) : "—" },
                { name: t("history.snapshotLabel"), val: String(selectedDate).slice(0, 10) },
                { name: t("history.totalCells"), val: summary.totalCells },
              ].map(({ name, val }) => (
                <div className="flex items-center justify-between py-1.5 text-xs border-b border-slate-50 dark:border-slate-800 last:border-0" key={name}>
                  <span className="text-slate-500 dark:text-slate-400">{name}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI Analysis */}
          {selectedDate && (
            <AiPanel data={aiData} loading={aiLoading} error={aiError} t={t} />
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

export default FarmHistory;