import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import axios from "axios";
import "./Fields.css";
import "leaflet/dist/leaflet.css";


// ─── Risk colour ramp (YlOrRd 5-stop) ────────────────────────────────────────
function riskToRGB(risk) {
  const v = Math.max(0, Math.min(100, isNaN(risk) ? 0 : risk));
  const stops = [
    { t:   0, r: 255, g: 255, b: 178 },
    { t:  25, r: 254, g: 204, b:  92 },
    { t:  50, r: 253, g: 141, b:  60 },
    { t:  75, r: 240, g:  59, b:  32 },
    { t: 100, r: 189, g:   0, b:  38 },
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (v >= stops[i].t && v <= stops[i + 1].t) { lo = stops[i]; hi = stops[i + 1]; break; }
  }
  const f = (v - lo.t) / ((hi.t - lo.t) || 1);
  return {
    R: Math.round(lo.r + f * (hi.r - lo.r)),
    G: Math.round(lo.g + f * (hi.g - lo.g)),
    B: Math.round(lo.b + f * (hi.b - lo.b)),
  };
}
function riskColor(risk)     { const { R, G, B } = riskToRGB(risk); return `rgb(${R},${G},${B})`; }
function riskColorA(risk, a) { const { R, G, B } = riskToRGB(risk); return `rgba(${R},${G},${B},${a})`; }

// ─── Constants ────────────────────────────────────────────────────────────────
const CELL_DEG    = 0.00009;
const API         = "https://localhost:44331";
const DEFAULT_OPA = 0.75;

// ─── Popup HTML builder ───────────────────────────────────────────────────────
function popupHtml(p) {
  const col = riskColor(p.risk);
  return `
    <div style="min-width:160px">
      <div style="font-size:10px;color:#2a5a38;letter-spacing:1.5px;margin-bottom:8px">CELL · ${p.cellId ?? ""}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:32px;height:32px;border-radius:7px;background:${col};flex-shrink:0;box-shadow:0 0 10px ${riskColorA(p.risk, 0.5)}"></div>
        <div>
          <div style="font-size:1.25rem;font-weight:700;color:${col};line-height:1">
            ${(+p.risk).toFixed(1)}<span style="font-size:0.65rem;color:#3a6b4a">%</span>
          </div>
          <div style="font-size:0.65rem;color:#2a5a38;margin-top:2px">
            ${p.risk >= 60 ? "🔴 HIGH RISK" : p.risk >= 30 ? "🟠 MEDIUM" : "🟢 LOW RISK"}
          </div>
        </div>
      </div>
      <div style="border-top:1px solid #1e3828;padding-top:7px;display:grid;gap:2px">
        <div>NDVI <span style="color:#7fffa0;float:right">${isNaN(p.ndvi) ? "—" : (+p.ndvi).toFixed(4)}</span></div>
        <div>NDMI <span style="color:#7fffa0;float:right">${isNaN(p.ndmi) ? "—" : (+p.ndmi).toFixed(4)}</span></div>
        <div style="margin-top:4px;color:#2a5a38;font-size:0.6rem">${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}</div>
      </div>
    </div>
  `;
}

// ─── Draw grid cells ──────────────────────────────────────────────────────────
function drawGrid(map, points, layerRef, renderer, opacity) {
  if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
  if (!points?.length || !renderer) return new Map();

  const group      = L.featureGroup();
  const cellLookup = new Map();
  const h          = CELL_DEG / 2;

  points.forEach(p => {
    if (!isFinite(p.lat) || !isFinite(p.lon)) return;

    const lats = [
      [p.lat - h, p.lon - h],
      [p.lat - h, p.lon + h],
      [p.lat + h, p.lon + h],
      [p.lat + h, p.lon - h],
    ];
    const col       = riskColor(p.risk);
    const intensity = 0.65 + (Math.min(100, Math.max(0, p.risk)) / 100) * 0.35;

    L.polygon(lats, {
      renderer,
      color:        col,
      fillColor:    col,
      fillOpacity:  opacity * intensity,
      weight:       0,
      opacity:      0,
      smoothFactor: 0,
      interactive:  false,
    }).addTo(group);

    const key = `${Math.round(p.lat / CELL_DEG)}_${Math.round(p.lon / CELL_DEG)}`;
    cellLookup.set(key, p);
  });

  group.addTo(map);
  layerRef.current = group;
  return cellLookup;
}

// ─── AI Panel component ───────────────────────────────────────────────────────
function AiPanel({ data, loading, error }) {
  if (loading) {
    return (
      <div className="fld-ai-card">
        <div className="fld-ai-loading">
          <div className="fld-ai-spinner" />
          RUNNING SATELLITE INTELLIGENCE…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fld-ai-card">
        <div className="fld-ai-label">AI ANALYSIS</div>
        <div style={{ fontSize: "0.75rem", color: "#e24b4a" }}>{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const statusMap = {
    "HIGH RISK": { bg: "#2a1010", text: "#e24b4a", icon: "⚠️" },
    "MODERATE":  { bg: "#2a1e10", text: "#ef9f27", icon: "🟠" },
    "UNCERTAIN": { bg: "#1a1a1a", text: "#888780", icon: "❓" },
    "HEALTHY":   { bg: "#0d2010", text: "#1d9e75", icon: "✅" },
  };
  const statusStyle = statusMap[data.healthStatus] ?? { bg: "#12261a", text: "#3a6b4a", icon: "—" };

  const ndviTrendBad = data.ndviTrend < 0;
  const riskTrendBad = data.riskTrend > 0;

  const metrics = [
    { label: "AVG NDVI",   value: data.avgNdvi?.toFixed(3) },
    { label: "AVG NDMI",   value: data.avgNdmi?.toFixed(3) },
    {
      label: "AVG RISK",
      value: `${data.avgRisk?.toFixed(1)}%`,
      color: data.avgRisk >= 60 ? "#e24b4a" : data.avgRisk >= 30 ? "#ef9f27" : "#1d9e75",
    },
    {
      label: "NDVI TREND",
      value: `${data.ndviTrend >= 0 ? "+" : ""}${data.ndviTrend?.toFixed(3)}`,
      color: ndviTrendBad ? "#e24b4a" : "#1d9e75",
    },
    {
      label: "RISK TREND",
      value: `${data.riskTrend >= 0 ? "+" : ""}${data.riskTrend?.toFixed(1)}`,
      color: riskTrendBad ? "#e24b4a" : "#1d9e75",
    },
    { label: "CLOUD COVER", value: `${data.cloudCoverPct?.toFixed(1)}%` },
    {
      label: "CONFIDENCE",
      value: `${(data.confidenceScore * 100).toFixed(0)}%`,
      color: data.confidenceScore < 0.4 ? "#e24b4a" : data.confidenceScore < 0.7 ? "#ef9f27" : "#1d9e75",
    },
    { label: "DATA QUALITY", value: data.dataQuality ?? "—" },
  ];

  return (
    <div className="fld-ai-wrap">
      {/* ── Header / narrative card ── */}
      <div className="fld-ai-card">
        <div className="fld-ai-label">🛰 AI FARM ANALYSIS · SATELLITE INTELLIGENCE</div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <span
            className="fld-ai-status"
            style={{ background: statusStyle.bg, color: statusStyle.text }}
          >
            {statusStyle.icon}&nbsp;{data.healthStatus}
          </span>
          <span className="fld-ai-meta">
            Confidence: {(data.confidenceScore * 100).toFixed(0)}%
            {data.date ? ` · ${String(data.date).slice(0, 10)}` : ""}
          </span>
        </div>

        {/* OpenAI explanation (primary) */}
        {data.aiExplanation && (
          <p className="fld-ai-text">{data.aiExplanation}</p>
        )}

        {/* System recommendation fallback */}
        {!data.aiExplanation && data.recommendation && (
          <p className="fld-ai-text">{data.recommendation}</p>
        )}

        {/* Situation type badge */}
        {data.situationType && (
          <div style={{ marginBottom: 10 }}>
            <span className="fld-ai-flag quality">
              SITUATION · {data.situationType.replace(/_/g, " ")}
            </span>
          </div>
        )}

        {/* Flag pills */}
        <div className="fld-ai-flags">
          {data.isCloudAffected   && <span className="fld-ai-flag cloud">☁ Cloud affected</span>}
          {data.isWeatherAffected && <span className="fld-ai-flag weather">🌧 Weather affected</span>}
          {data.isTemporaryAnomaly && <span className="fld-ai-flag anomaly">⚡ Possible anomaly</span>}
          {data.isSuspectSpike    && <span className="fld-ai-flag spike">⚠ Suspect spike</span>}
        </div>
      </div>

      {/* ── Metric grid ── */}
      <div className="fld-ai-metrics">
        {metrics.map(({ label, value, color }) => (
          <div className="fld-ai-metric" key={label}>
            <div className="fld-ai-metric-lbl">{label}</div>
            <div className="fld-ai-metric-val" style={{ color: color ?? "#7fffa0" }}>
              {value ?? "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Fields component ────────────────────────────────────────────────────
export function Fields() {
  const mapRef        = useRef(null);
  const rendererRef   = useRef(null);
  const gridRef       = useRef(null);
  const highRef       = useRef(null);
  const farmOutRef    = useRef(null);
  const allPointsRef  = useRef([]);
  const cellLookupRef = useRef(new Map());
  const popupRef      = useRef(null);
  const navigate      = useNavigate();

  const [hasFarm,    setHasFarm]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeBase, setActiveBase] = useState("satellite");
  const [showGrid,   setShowGrid]   = useState(true);
  const [redOnly,    setRedOnly]    = useState(false);
  const [opacity,    setOpacity]    = useState(DEFAULT_OPA);
  const [stats,      setStats]      = useState({ total: 0, high: 0, medium: 0, avgRisk: 0, maxRisk: 0 });
  const [lastSync,   setLastSync]   = useState(null);

  // ── AI state ──
  const [aiData,    setAiData]    = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState(null);

  const baseLayers = useRef({});

  const showGridRef = useRef(showGrid);
  const redOnlyRef  = useRef(redOnly);
  const opacityRef  = useRef(opacity);
  useEffect(() => { showGridRef.current = showGrid; }, [showGrid]);
  useEffect(() => { redOnlyRef.current  = redOnly;  }, [redOnly]);
  useEffect(() => { opacityRef.current  = opacity;  }, [opacity]);

  // ── Base layer switch ──
  const switchBase = useCallback((key) => {
    const map = mapRef.current;
    if (!map) return;
    Object.entries(baseLayers.current).forEach(([k, lyr]) => {
      if (k === key) { if (!map.hasLayer(lyr)) lyr.addTo(map); }
      else           { if (map.hasLayer(lyr))  map.removeLayer(lyr); }
    });
    setActiveBase(key);
  }, []);

  // ── Opacity change ──
  useEffect(() => {
    const map      = mapRef.current;
    const renderer = rendererRef.current;
    if (!map || !renderer || !map.getContainer() || !allPointsRef.current.length) return;

    if (redOnlyRef.current) {
      const filtered = allPointsRef.current.filter(p => p.risk >= 60);
      const lookup   = drawGrid(map, filtered, highRef, renderer, opacity);
      cellLookupRef.current = lookup;
      if (!showGridRef.current && highRef.current) map.removeLayer(highRef.current);
    } else {
      const lookup = drawGrid(map, allPointsRef.current, gridRef, renderer, opacity);
      cellLookupRef.current = lookup;
      if (!showGridRef.current && gridRef.current) map.removeLayer(gridRef.current);
    }
    if (farmOutRef.current) farmOutRef.current.bringToFront();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opacity]);

  // ── Show/hide grid ──
  useEffect(() => {
    const map    = mapRef.current;
    if (!map) return;
    const target = redOnly ? highRef.current : gridRef.current;
    if (!target) return;
    if (showGrid) { if (!map.hasLayer(target)) target.addTo(map); }
    else          { map.removeLayer(target); }
  }, [showGrid, redOnly]);

  // ── High Risk Only toggle ──
  useEffect(() => {
    const map      = mapRef.current;
    const renderer = rendererRef.current;
    if (!map || !renderer || !map.getContainer() || !allPointsRef.current.length) return;

    if (redOnly) {
      if (gridRef.current && map.hasLayer(gridRef.current)) map.removeLayer(gridRef.current);
      const filtered = allPointsRef.current.filter(p => p.risk >= 60);
      const lookup   = drawGrid(map, filtered, highRef, renderer, opacityRef.current);
      cellLookupRef.current = lookup;
      if (!showGrid && highRef.current) map.removeLayer(highRef.current);
    } else {
      if (highRef.current) { map.removeLayer(highRef.current); highRef.current = null; }
      const lookup = drawGrid(map, allPointsRef.current, gridRef, renderer, opacityRef.current);
      cellLookupRef.current = lookup;
      if (showGrid && gridRef.current && !map.hasLayer(gridRef.current)) gridRef.current.addTo(map);
    }
    if (farmOutRef.current) farmOutRef.current.bringToFront();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redOnly]);

  // ── Map init ──
  useEffect(() => {
    if (mapRef.current) return;

    const userId = localStorage.getItem("userId");

    const map = L.map("map", { minZoom: 14, maxZoom: 22, zoomControl: false })
                 .setView([6.25, 80.50], 16);
    mapRef.current = map;

    map.whenReady(() => {
  rendererRef.current = L.canvas({ padding: 0.5 });
  });

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Esri", maxNativeZoom: 19, maxZoom: 22 }
    );
    const street = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { attribution: "CartoDB", maxNativeZoom: 20, maxZoom: 22 }
    );
    baseLayers.current = { satellite, street };
    satellite.addTo(map);

    popupRef.current = L.popup({ maxWidth: 240 });

    map.on("click", (e) => {
      if (!showGridRef.current) return;
      const key = `${Math.round(e.latlng.lat / CELL_DEG)}_${Math.round(e.latlng.lng / CELL_DEG)}`;
      const p   = cellLookupRef.current.get(key);
      if (!p) return;
      popupRef.current
        .setLatLng(e.latlng)
        .setContent(popupHtml(p))
        .openOn(map);
    });

    // ── Fetch AI analysis ─────────────────────────────────────────────────────
    const fetchAi = async (uid) => {
      setAiLoading(true);
      setAiError(null);
      try {
        const { data: ai } = await axios.get(`${API}/api/farm/ai-analysis/${uid}`);
        setAiData(ai);
      } catch (err) {
        setAiError("AI analysis unavailable.");
        console.error("AI analysis error:", err);
      } finally {
        setAiLoading(false);
      }
    };

    // ── Fetch farm outline + risk data ────────────────────────────────────────
    const init = async () => {
      try {
        const { data: farm } = await axios.get(`${API}/api/farm/${userId}`);
        if (farm?.polygon) {
          const coords  = JSON.parse(farm.polygon);
          const latLngs = coords.map(c => [parseFloat(c[1]), parseFloat(c[0])]);
          const outline = L.polygon(latLngs, {
            color: "#7fffa0", weight: 1.5, fillOpacity: 0, dashArray: "5 5",
          }).addTo(map);
          farmOutRef.current = outline;
          map.fitBounds(outline.getBounds(), { padding: [40, 40] });
          setHasFarm(true);
        } else {
          setHasFarm(false);
        }
      } catch {
        setHasFarm(false);
      } finally {
        setLoading(false);
      }

      try {
        const { data } = await axios.get(`${API}/api/farm/user-risk/${userId}`);

        const clean = (data ?? []).map(p => ({
          lat:    parseFloat(p.latitude  ?? p.Latitude  ?? 0),
          lon:    parseFloat(p.longitude ?? p.Longitude ?? 0),
          risk:   parseFloat(p.risk      ?? p.Risk)     || 0,
          ndvi:   parseFloat(p.ndvi      ?? p.NDVI),
          ndmi:   parseFloat(p.ndmi      ?? p.NDMI),
          cellId: p.cellId ?? p.CellId ?? "",
          date:   p.date   ?? p.Date   ?? "",
        })).filter(p => isFinite(p.lat) && isFinite(p.lon) && p.lat !== 0);

        if (!clean.length) {
          setStats({ total: 0, high: 0, medium: 0, avgRisk: 0, maxRisk: 0 });
          setLastSync(null);
          return;
        }

        allPointsRef.current = clean;

        const total   = clean.length;
        const high    = clean.filter(p => p.risk >= 60).length;
        const medium  = clean.filter(p => p.risk >= 30 && p.risk < 60).length;
        const avgRisk = (clean.reduce((s, p) => s + p.risk, 0) / total).toFixed(1);
        const maxRisk = Math.max(...clean.map(p => p.risk)).toFixed(1);
        setStats({ total, high, medium, avgRisk, maxRisk });

        const dates = clean.map(p => p.date).filter(Boolean).sort();
        if (dates.length) setLastSync(String(dates[dates.length - 1]).slice(0, 10));

        map.whenReady(() => {
  if (!rendererRef.current) {
    rendererRef.current = L.canvas({ padding: 0.5 });
  }
  const lookup = drawGrid(map, clean, gridRef, rendererRef.current, DEFAULT_OPA);
  cellLookupRef.current = lookup;
  if (farmOutRef.current) farmOutRef.current.bringToFront();
});
        cellLookupRef.current = lookup;
        if (farmOutRef.current) farmOutRef.current.bringToFront();

      } catch (err) {
        console.error("Risk API error:", err);
      }

      // Fire AI fetch after risk data is loaded
      fetchAi(userId);
    };

    init();
    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sliderPct = `${Math.round(opacity * 100)}%`;

  return (
    <>
      <style></style>
      <div id="field-root">

        {/* ── Header ── */}
        <div className="fld-header">
          <div className="fld-brand">
            <div className="fld-brand-icon">🛰</div>
            <div>
              <div className="fld-title">Field Intelligence</div>
              <div className="fld-sub">SATELLITE · NDVI · RISK ANALYSIS</div>
            </div>
          </div>
          {!loading && hasFarm === false && (
            <button className="fld-reg-btn" onClick={() => navigate("/dashboard/fields/farm")}>
              + Register Field
            </button>
          )}
        </div>

        {/* ── Map ── */}
        <div className="fld-map-wrap">
          {loading && (
            <div className="fld-loading">
              <div className="fld-spinner" />
              LOADING SATELLITE DATA
            </div>
          )}

          {!loading && hasFarm && stats.total === 0 && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", zIndex: 1000,
              background: "rgba(8,15,10,0.7)", backdropFilter: "blur(6px)",
              fontFamily: "'Space Mono',monospace", color: "#3a6b4a", gap: 12,
            }}>
              <div style={{ fontSize: "2rem" }}>🛰</div>
              <div style={{ fontSize: "0.85rem", color: "#7fffa0" }}>Farm Registered</div>
              <div style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Awaiting first satellite pass…</div>
              <div style={{ fontSize: "0.62rem", color: "#2a5a38" }}>Data syncs automatically every hour</div>
            </div>
          )}

          <div id="map" />

          {lastSync && (
            <div className="fld-date-badge">
              <div className="fld-date-dot" />
              SYNCED {lastSync}
            </div>
          )}

          {!loading && (
            <div className="fld-panel">
              <div className="fld-section-label">Base Layer</div>
              {[
                { key: "satellite", label: "Satellite", dot: "#5b9bd5" },
                { key: "street",    label: "Dark Map",  dot: "#9b8bd5" },
              ].map(({ key, label, dot }) => (
                <button
                  key={key}
                  className={`fld-base-btn${activeBase === key ? " active" : ""}`}
                  onClick={() => switchBase(key)}
                >
                  <span className="fld-dot" style={{ background: dot }} />
                  {label}
                </button>
              ))}

              <div className="fld-divider" />
              <div className="fld-section-label">Overlays</div>

              <div className="fld-toggle" onClick={() => setShowGrid(v => !v)}>
                <span className="fld-dot" style={{ background: "#fd8d3c" }} />
                <span className="fld-toggle-label">
                  Risk Grid
                  <span className="fld-toggle-sub">Pixel heat overlay</span>
                </span>
                <span className={`fld-pill ${showGrid ? "on" : "off"}`}>{showGrid ? "ON" : "OFF"}</span>
              </div>

              {showGrid && (
                <div className="fld-opacity-row">
                  <div className="fld-opacity-header">
                    <span className="fld-opacity-label">
                      <span className="fld-dot" style={{ background: "#2ecc71" }} />
                      Transparency
                    </span>
                    <span className="fld-opacity-val">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    className="fld-slider"
                    min={0} max={100} step={1}
                    value={Math.round(opacity * 100)}
                    style={{ "--pct": sliderPct }}
                    onChange={e => setOpacity(Number(e.target.value) / 100)}
                  />
                </div>
              )}

              <div className="fld-divider" />
              <div className="fld-section-label">Filter</div>

              <div className="fld-toggle" onClick={() => setRedOnly(v => !v)}>
                <span className="fld-dot" style={{ background: "#e53935" }} />
                <span className="fld-toggle-label">
                  High Risk Only
                  <span className="fld-toggle-sub">Risk ≥ 60%</span>
                </span>
                <span className={`fld-pill ${redOnly ? "red-on" : "off"}`}>{redOnly ? "ON" : "OFF"}</span>
              </div>
            </div>
          )}

          {!loading && stats.total > 0 && (
            <div className="fld-stats-bar">
              <div className="fld-stat">
                <span className="fld-stat-val">{stats.total}</span>
                <span className="fld-stat-lbl">Cells</span>
              </div>
              <div className="fld-stat">
                <span className="fld-stat-val red">{stats.high}</span>
                <span className="fld-stat-lbl">High Risk</span>
              </div>
              <div className="fld-stat">
                <span className="fld-stat-val amber">{stats.medium}</span>
                <span className="fld-stat-lbl">Medium</span>
              </div>
              <div className="fld-stat">
                <span className="fld-stat-val">{stats.avgRisk}%</span>
                <span className="fld-stat-lbl">Avg Risk</span>
              </div>
              <div className="fld-stat">
                <span className="fld-stat-val red">{stats.maxRisk}%</span>
                <span className="fld-stat-lbl">Peak</span>
              </div>
            </div>
          )}

          {!loading && (
            <div className="fld-legend">
              <div className="fld-legend-title">Risk Index</div>
              <div className="fld-grad-bar" />
              <div className="fld-grad-labels">
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
              {[
                { swatch: "#bd0026", label: "High  ≥ 60" },
                { swatch: "#fd8d3c", label: "Med  30–59" },
                { swatch: "#ffffb2", label: "Low   < 30" },
              ].map(({ swatch, label }) => (
                <div className="fld-legend-row" key={label}>
                  <div className="fld-legend-swatch" style={{ background: swatch }} />
                  {label}
                </div>
              ))}
              <div style={{
                borderTop: "1px solid #12261a", marginTop: 8, paddingTop: 8,
                fontSize: "0.58rem", fontFamily: "'Space Mono',monospace",
                color: "#2a5a38", lineHeight: 1.6,
              }}>
                Opacity ∝ risk intensity<br />Sentinel-2 · 10 m/px
              </div>
            </div>
          )}
        </div>

        {/* ── AI Analysis Panel (below map) ── */}
        {!loading && hasFarm && (
          <AiPanel
            data={aiData}
            loading={aiLoading}
            error={aiError}
          />
        )}

      </div>
    </>
  );
}

export default Fields;