import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "./Farmhistory.css";

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

// ─── Popup HTML ───────────────────────────────────────────────────────────────
function popupHtml(p) {
  const col   = riskColor(p.risk);
  const badge = p.risk >= 60 ? "HIGH RISK" : p.risk >= 30 ? "MEDIUM" : "LOW RISK";
  return `
    <div style="min-width:175px;font-family:'DM Sans',system-ui,sans-serif;font-size:12px;color:#d1fae5">
      <div style="font-size:9px;color:#6ee7b7;letter-spacing:1.5px;margin-bottom:8px;text-transform:uppercase">
        Cell · ${p.cellId ?? ""}
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="width:30px;height:30px;border-radius:7px;background:${col};flex-shrink:0"></div>
        <div>
          <div style="font-size:1.25rem;font-weight:700;color:${col};line-height:1">
            ${(+p.risk).toFixed(1)}<span style="font-size:10px;color:#6ee7b7">%</span>
          </div>
          <div style="font-size:9px;color:#6ee7b7;margin-top:2px;letter-spacing:1px;text-transform:uppercase">${badge}</div>
        </div>
      </div>
      <div style="border-top:1px solid #1e3d28;padding-top:8px;display:grid;gap:4px">
        <div style="display:flex;justify-content:space-between">
          <span style="color:#6ee7b7">NDVI</span>
          <span style="font-weight:600">${isNaN(p.ndvi) ? "—" : (+p.ndvi).toFixed(4)}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#6ee7b7">NDMI</span>
          <span style="font-weight:600">${isNaN(p.ndmi) ? "—" : (+p.ndmi).toFixed(4)}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#6ee7b7">Pixels</span>
          <span style="font-weight:600">${p.pixelCount ?? "—"}</span>
        </div>
        <div style="margin-top:4px;color:#4ade80;font-size:10px">${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}</div>
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
function Calendar({ availableDates, selectedDate, onSelect }) {
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

  const selStr  = selectedDate ? String(selectedDate).slice(0, 10) : null;
  const todayIso = today.toISOString().slice(0, 10);

  return (
    <>
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={goPrev} aria-label="Previous month">‹</button>
        <span className="cal-month-label">{MONTHS[viewMonth]} {viewYear}</span>
        <button className="cal-nav-btn" onClick={goNext} aria-label="Next month">›</button>
      </div>

      <div className="cal-weekdays">
        {WDAYS.map(w => <div key={w} className="cal-wday">{w}</div>)}
      </div>

      <div className="cal-grid">
        {cells.map((c, i) => {
          const isSel   = !c.otherMonth && c.iso === selStr;
          const isToday = !c.otherMonth && c.iso === todayIso;
          const cls = [
            "cal-day",
            c.otherMonth  ? "other-month" : "",
            c.hasData     ? "has-data"    : "",
            isSel         ? "selected"    : "",
            isToday       ? "today"       : "",
          ].filter(Boolean).join(" ");
          return (
            <div
              key={i}
              className={cls}
              onClick={() => c.hasData && onSelect(c.iso)}
              title={c.hasData ? `Snapshot: ${c.iso}` : undefined}
            >
              {c.day}
            </div>
          );
        })}
      </div>

      <div className="cal-avail-note">
        {availableDates?.length
          ? `${availableDates.length} snapshot${availableDates.length !== 1 ? "s" : ""} available`
          : "No data for this farm"}
      </div>
      <div className="cal-avail-legend">
        <div className="cal-legend-dot" />
        <span className="cal-legend-text">Date has satellite data</span>
      </div>
    </>
  );
}

// ─── AI Analysis Panel ────────────────────────────────────────────────────────
function AiPanel({ data, loading, error }) {
  if (loading) {
    return (
      <div className="hist-section hist-ai-card">
        <div className="hist-section-label">AI analysis</div>
        <div className="hist-ai-loading">
          <div className="hist-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          <span>Running satellite intelligence…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hist-section hist-ai-card">
        <div className="hist-section-label">AI analysis</div>
        <div className="hist-ai-error">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const statusMap = {
    "HIGH RISK": { color: "#c0392b", bg: "rgba(224,74,74,0.1)",  label: "High Risk"  },
    "MODERATE":  { color: "#b7770d", bg: "rgba(239,159,39,0.1)", label: "Moderate"   },
    "UNCERTAIN": { color: "#6b7280", bg: "rgba(107,114,128,0.1)",label: "Uncertain"  },
    "HEALTHY":   { color: "#0f6e56", bg: "rgba(29,158,117,0.1)", label: "Healthy"    },
  };
  const s = statusMap[data.healthStatus] ?? statusMap["UNCERTAIN"];

  const metrics = [
    { label: "NDVI",   value: data.avgNdvi  != null ? (+data.avgNdvi).toFixed(3)  : null },
    { label: "NDMI",   value: data.avgNdmi  != null ? (+data.avgNdmi).toFixed(3)  : null },
    { label: "Risk",   value: data.avgRisk  != null ? `${(+data.avgRisk).toFixed(1)}%` : null,
      color: data.avgRisk >= 60 ? "#c0392b" : data.avgRisk >= 30 ? "#b7770d" : "#0f6e56" },
    { label: "NDVI Δ", value: data.ndviTrend != null
        ? `${data.ndviTrend >= 0 ? "+" : ""}${(+data.ndviTrend).toFixed(3)}` : null,
      color: data.ndviTrend < 0 ? "#c0392b" : "#0f6e56" },
    { label: "Risk Δ", value: data.riskTrend != null
        ? `${data.riskTrend >= 0 ? "+" : ""}${(+data.riskTrend).toFixed(1)}` : null,
      color: data.riskTrend > 0 ? "#c0392b" : "#0f6e56" },
    { label: "Cloud",  value: data.cloudCoverPct != null ? `${(+data.cloudCoverPct).toFixed(1)}%` : null },
  ];

  return (
    <div className="hist-section hist-ai-card">
      <div className="hist-section-label">AI analysis</div>

      {/* Status badge */}
      <div className="hist-ai-status" style={{ background: s.bg, color: s.color }}>
        {s.label}
        <span className="hist-ai-conf">· {Math.round(data.confidenceScore * 100)}% confidence</span>
      </div>

      {/* Narrative */}
      {(data.aiExplanation || data.recommendation) && (
        <p className="hist-ai-text">
          {data.aiExplanation || data.recommendation}
        </p>
      )}

      {/* Flags */}
      {(data.isCloudAffected || data.isWeatherAffected || data.isTemporaryAnomaly || data.isSuspectSpike) && (
        <div className="hist-ai-flags">
          {data.isCloudAffected && (
            <span className="hist-ai-flag" style={{ color: "#185fa5", borderColor: "#b5d4f4", background: "#e6f1fb" }}>
              ☁ Cloud
            </span>
          )}
          {data.isWeatherAffected && (
            <span className="hist-ai-flag" style={{ color: "#0f6e56", borderColor: "#9fe1cb", background: "#e1f5ee" }}>
              🌧 Weather
            </span>
          )}
          {data.isTemporaryAnomaly && (
            <span className="hist-ai-flag" style={{ color: "#854f0b", borderColor: "#fac775", background: "#faeeda" }}>
              ⚡ Anomaly
            </span>
          )}
          {data.isSuspectSpike && (
            <span className="hist-ai-flag" style={{ color: "#993c1d", borderColor: "#f5c4b3", background: "#faece7" }}>
              ⚠ Spike
            </span>
          )}
        </div>
      )}

      {/* Metrics grid */}
      <div className="hist-ai-metrics">
        {metrics.map(({ label, value, color }) => (
          <div className="hist-ai-metric" key={label}>
            <div className="hist-ai-metric-lbl">{label}</div>
            <div className="hist-ai-metric-val" style={{ color: color ?? "#111" }}>
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
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c0-5.5-4-10-10-10 5.5 0 10 4 10 10 0-5.5 4-10 10-10S17.5 2 12 2z" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function FarmHistory() {
  const mapRef        = useRef(null);
  const rendererRef   = useRef(null);
  const gridRef       = useRef(null);
  const farmOutRef    = useRef(null);
  const cellLookupRef = useRef(new Map());
  const popupRef      = useRef(null);
  const farmBoundsRef = useRef(null);

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

    popupRef.current = L.popup({ maxWidth: 220 });
    map.on("click", (e) => {
      const key = `${Math.round(e.latlng.lat / CELL_DEG)}_${Math.round(e.latlng.lng / CELL_DEG)}`;
      const p   = cellLookupRef.current.get(key);
      if (!p) return;
      popupRef.current.setLatLng(e.latlng).setContent(popupHtml(p)).openOn(map);
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

    axios.get(`${API}/api/farmhistory/${farmId}/ai-analysis`, { params: { date: dateParam } })
      .then(({ data }) => setAiData(data))
      .catch(() => setAiError("AI analysis unavailable for this snapshot."))
      .finally(() => setAiLoading(false));

  }, [selectedFarm, selectedDate, mapReady]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const riskPct      = (count) => summary?.totalCells ? Math.round((count / summary.totalCells) * 100) : 0;
  const avgRiskColor = summary
    ? (summary.avgRisk >= 60 ? "#c0392b" : summary.avgRisk >= 30 ? "#b7770d" : "#0f6e56")
    : "#0f6e56";

  return (
    <div id="hist-root">

      {/* ── Header ── */}
      <div className="hist-header">
        <div className="hist-brand">
          <div className="hist-logo">
            <LeafIcon />
          </div>
          <div>
            <div className="hist-title">Farm History</div>
            <div className="hist-sub">Satellite · NDVI · Risk Analysis</div>
          </div>
        </div>

        <div>
          {farms.length > 1 ? (
            <select
              className="hist-select"
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
            <div className="hist-farm-pill">
              <div className="hist-farm-dot" />
              {farms[0].name}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Main ── */}
      <div className="hist-main">

        {/* Map */}
        <div className="hist-map-wrap">
          {loadingPixels && (
            <div className="hist-map-overlay">
              <div className="hist-spinner" />
              LOADING SNAPSHOT
            </div>
          )}
          <div id="hist-map" />
          {selectedDate && !loadingPixels && (
            <div className="hist-date-badge">
              <div className="hist-badge-dot" />
              {String(selectedDate).slice(0, 10)}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="hist-side">

          {/* Calendar */}
          <div className="hist-section">
            <div className="hist-section-label">
              {loadingDates ? "Loading dates…" : "Snapshot date"}
            </div>
            {!loadingDates ? (
              <Calendar
                availableDates={dates}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
            ) : (
              <div className="hist-empty">
                <div className="hist-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              </div>
            )}
          </div>

          {/* Snapshot stats */}
          <div className="hist-section">
            <div className="hist-section-label">Snapshot stats</div>
            {summary ? (
              <div className="hist-stats-grid">
                <div className="hist-stat-item">
                  <span className="hist-stat-val" style={{ color: "#185fa5" }}>{summary.totalCells}</span>
                  <span className="hist-stat-lbl">Total cells</span>
                </div>
                <div className="hist-stat-item">
                  <span className="hist-stat-val" style={{ color: avgRiskColor }}>{(+summary.avgRisk).toFixed(1)}%</span>
                  <span className="hist-stat-lbl">Avg risk</span>
                </div>
                <div className="hist-stat-item">
                  <span className="hist-stat-val" style={{ color: "#c0392b" }}>{(+summary.maxRisk).toFixed(1)}%</span>
                  <span className="hist-stat-lbl">Peak risk</span>
                </div>
                <div className="hist-stat-item">
                  <span className="hist-stat-val" style={{ color: "#c0392b" }}>{summary.highRisk}</span>
                  <span className="hist-stat-lbl">High risk cells</span>
                </div>
              </div>
            ) : (
              <div className="hist-empty">
                <div className="hist-empty-icon">📊</div>
                <div className="hist-empty-text">
                  {selectedDate ? "Loading…" : "Pick a date on the\ncalendar above"}
                </div>
              </div>
            )}
          </div>

          {/* Risk distribution */}
          {summary && (
            <div className="hist-section">
              <div className="hist-section-label">Risk distribution</div>
              {[
                { label: "High",   count: summary.highRisk,   color: "#e24b4a" },
                { label: "Medium", count: summary.mediumRisk, color: "#ef9f27" },
                { label: "Low",    count: summary.lowRisk,    color: "#1d9e75" },
              ].map(({ label, count, color }) => {
                const pct = riskPct(count);
                return (
                  <div className="hist-risk-row" key={label}>
                    <div className="hist-risk-label">{label}</div>
                    <div className="hist-risk-track">
                      <div className="hist-risk-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div className="hist-risk-pct">{pct}%</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Vegetation indices */}
          {summary && (
            <div className="hist-section">
              <div className="hist-section-label">Vegetation indices</div>
              {[
                { name: "Avg NDVI", val: summary.avgNDVI != null ? (+summary.avgNDVI).toFixed(4) : "—" },
                { name: "Avg NDMI", val: summary.avgNDMI != null ? (+summary.avgNDMI).toFixed(4) : "—" },
                { name: "Snapshot", val: String(selectedDate).slice(0, 10) },
                { name: "Total cells", val: summary.totalCells },
              ].map(({ name, val }) => (
                <div className="hist-index-row" key={name}>
                  <span className="hist-index-name">{name}</span>
                  <span className="hist-index-val">{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI Analysis */}
          {selectedDate && (
            <AiPanel data={aiData} loading={aiLoading} error={aiError} />
          )}

          {/* Risk legend */}
          <div className="hist-section">
            <div className="hist-section-label">Risk index</div>
            <div className="hist-legend-bar" />
            <div className="hist-legend-labels">
              <span>0 Low</span><span>25</span><span>50</span><span>75</span><span>100 High</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default FarmHistory;