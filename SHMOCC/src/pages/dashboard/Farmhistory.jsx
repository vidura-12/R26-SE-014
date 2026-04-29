import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  #hist-root {
    font-family: 'Outfit', sans-serif;
    background: #060d09;
    min-height: 100vh;
    color: #d4e8d8;
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 14px;
  }

  /* ── Header ── */
  .hist-header {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
  }
  .hist-brand { display: flex; align-items: center; gap: 11px; }
  .hist-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: #0d2517; border: 1px solid #1a3d26;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px;
  }
  .hist-title { font-size: 1.2rem; font-weight: 700; color: #e4f2e8; letter-spacing: -0.3px; line-height: 1.1; }
  .hist-sub { font-family: 'DM Mono', monospace; font-size: 0.58rem; color: #2e5c3e; letter-spacing: 2px; margin-top: 2px; }

  /* ── Farm selector ── */
  .hist-farm-bar {
    display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  }
  .hist-select {
    background: #0a1a0e; border: 1px solid #1a3426;
    color: #8fc89e; font-family: 'DM Mono', monospace; font-size: 0.72rem;
    padding: 7px 12px; border-radius: 8px; outline: none; cursor: pointer;
    transition: border-color 0.15s;
  }
  .hist-select:hover { border-color: #2a6a3a; }
  .hist-select:focus { border-color: #2ecc71; color: #e4f2e8; }

  /* ── Timeline strip ── */
  .hist-timeline-wrap {
    background: #090f0b; border: 1px solid #122018; border-radius: 12px;
    padding: 12px 14px; overflow-x: auto;
  }
  .hist-timeline-label {
    font-family: 'DM Mono', monospace; font-size: 0.56rem; color: #2e5c3e; letter-spacing: 2px;
    text-transform: uppercase; margin-bottom: 10px;
  }
  .hist-dates {
    display: flex; gap: 6px; min-width: max-content;
  }
  .hist-date-chip {
    padding: 5px 11px; border-radius: 20px; border: 1px solid #1a3426;
    font-family: 'DM Mono', monospace; font-size: 0.62rem; color: #4a7a5a;
    cursor: pointer; transition: all 0.15s; white-space: nowrap; background: transparent;
    display: flex; align-items: center; gap: 5px;
  }
  .hist-date-chip:hover { border-color: #2a6a3a; color: #8fc89e; }
  .hist-date-chip.active {
    background: #0d2517; border-color: #2ecc71; color: #2ecc71;
  }
  .hist-date-chip .chip-dot {
    width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0;
  }

  /* ── Main layout ── */
  .hist-main {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 14px;
    flex: 1;
    min-height: 0;
  }
  @media (max-width: 860px) {
    .hist-main { grid-template-columns: 1fr; }
  }

  /* ── Map ── */
  .hist-map-wrap {
    position: relative; border-radius: 14px; overflow: hidden;
    border: 1px solid #122018;
    box-shadow: 0 20px 60px #000a;
    min-height: 520px;
  }
  #hist-map { height: 100%; min-height: 520px; width: 100%; background: #060d09; display: block; }

  .hist-map-overlay {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; z-index: 1000;
    background: rgba(6,13,9,0.88); backdrop-filter: blur(8px);
    border-radius: 14px; gap: 12px;
    font-family: 'DM Mono', monospace; color: #2e5c3e; font-size: 0.7rem; letter-spacing: 1.5px;
  }
  .hist-spinner {
    width: 34px; height: 34px; border: 2px solid #0d2517; border-top-color: #2ecc71;
    border-radius: 50%; animation: spin 0.85s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Side panel ── */
  .hist-side { display: flex; flex-direction: column; gap: 12px; }

  .hist-card {
    background: #090f0b; border: 1px solid #122018; border-radius: 12px; padding: 14px;
  }
  .hist-card-title {
    font-family: 'DM Mono', monospace; font-size: 0.56rem; color: #2e5c3e; letter-spacing: 2.5px;
    text-transform: uppercase; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #0d1a10;
  }

  /* Stats grid */
  .hist-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .hist-stat-item { padding: 10px; background: #060d09; border-radius: 8px; border: 1px solid #0d1a10; }
  .hist-stat-val { font-family: 'DM Mono', monospace; font-size: 1.2rem; font-weight: 500; line-height: 1; display: block; }
  .hist-stat-val.green  { color: #2ecc71; }
  .hist-stat-val.amber  { color: #f0a500; }
  .hist-stat-val.red    { color: #e05252; }
  .hist-stat-val.blue   { color: #5aabdf; }
  .hist-stat-lbl { font-family: 'DM Mono', monospace; font-size: 0.52rem; color: #2e5c3e; letter-spacing: 1px; margin-top: 4px; display: block; text-transform: uppercase; }

  /* Risk distribution bar */
  .hist-risk-bar-wrap { margin-top: 4px; }
  .hist-risk-row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
  .hist-risk-label { font-family: 'DM Mono', monospace; font-size: 0.6rem; color: #4a7a5a; width: 50px; flex-shrink: 0; }
  .hist-risk-track { flex: 1; height: 6px; background: #0d1a10; border-radius: 3px; overflow: hidden; }
  .hist-risk-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
  .hist-risk-count { font-family: 'DM Mono', monospace; font-size: 0.6rem; color: #4a7a5a; width: 28px; text-align: right; flex-shrink: 0; }

  /* Indices */
  .hist-index-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #0d1a10; }
  .hist-index-row:last-child { border-bottom: none; }
  .hist-index-name { font-family: 'DM Mono', monospace; font-size: 0.66rem; color: #4a7a5a; }
  .hist-index-val { font-family: 'DM Mono', monospace; font-size: 0.72rem; color: #8fc89e; }

  /* Legend */
  .hist-legend-bar {
    width: 100%; height: 10px; border-radius: 5px;
    background: linear-gradient(to right, #ffffb2, #fecc5c, #fd8d3c, #f03b20, #bd0026);
    margin-bottom: 6px;
  }
  .hist-legend-labels { display: flex; justify-content: space-between; font-family: 'DM Mono', monospace; font-size: 0.58rem; color: #2e5c3e; }

  /* Map badges */
  .hist-map-badge {
    position: absolute; z-index: 1000;
    background: rgba(6,13,9,0.92); backdrop-filter: blur(12px);
    border: 1px solid #122018; border-radius: 8px;
    font-family: 'DM Mono', monospace;
  }
  .hist-date-badge {
    top: 12px; left: 12px; padding: 6px 11px; font-size: 0.62rem; color: #3a6b4a;
    display: flex; align-items: center; gap: 6px;
  }
  .hist-date-dot { width: 5px; height: 5px; border-radius: 50%; background: #2ecc71; animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.25;} }

  /* Popup */
  .leaflet-popup-content-wrapper {
    background: #0a1510 !important; border: 1px solid #1a3426 !important;
    border-radius: 10px !important; box-shadow: 0 8px 28px #000a !important;
    color: #d4e8d8 !important; font-family: 'DM Mono', monospace !important;
  }
  .leaflet-popup-tip { background: #0a1510 !important; }
  .leaflet-popup-content { margin: 10px 13px !important; font-size: 11px !important; line-height: 1.85 !important; }
  .leaflet-popup-close-button { color: #2e5c3e !important; top: 5px !important; right: 7px !important; }

  /* Empty states */
  .hist-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; padding: 40px 20px; text-align: center;
    font-family: 'DM Mono', monospace; color: #2e5c3e;
  }
  .hist-empty-icon { font-size: 2rem; opacity: 0.5; }
  .hist-empty-text { font-size: 0.7rem; letter-spacing: 1px; }

  /* Zoom controls override */
  .leaflet-control-zoom a {
    background: #090f0b !important; border-color: #1a3426 !important;
    color: #4a7a5a !important; font-family: 'DM Mono', monospace !important;
  }
  .leaflet-control-zoom a:hover { background: #0d1a10 !important; color: #8fc89e !important; }
`;

// ─── Colour helpers ───────────────────────────────────────────────────────────
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
const riskColor  = r => { const { R, G, B } = riskToRGB(r); return `rgb(${R},${G},${B})`; };
const riskColorA = (r, a) => { const { R, G, B } = riskToRGB(r); return `rgba(${R},${G},${B},${a})`; };

// ─── Constants ────────────────────────────────────────────────────────────────
const CELL_DEG = 0.00009;   // match your farm_sync_grid.py CELL_DEG
const API      = "https://localhost:44331";

// ─── Popup HTML ───────────────────────────────────────────────────────────────
function popupHtml(p) {
  const col = riskColor(p.risk);
  const badge = p.risk >= 60 ? "HIGH RISK" : p.risk >= 30 ? "MEDIUM" : "LOW RISK";
  return `
    <div style="min-width:170px">
      <div style="font-size:9px;color:#2a5a38;letter-spacing:1.5px;margin-bottom:8px">CELL · ${p.cellId ?? ""}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
        <div style="width:30px;height:30px;border-radius:7px;background:${col};flex-shrink:0"></div>
        <div>
          <div style="font-size:1.2rem;font-weight:500;color:${col};line-height:1">
            ${(+p.risk).toFixed(1)}<span style="font-size:10px;color:#2a5a38">%</span>
          </div>
          <div style="font-size:9px;color:#2a5a38;margin-top:1px">${badge}</div>
        </div>
      </div>
      <div style="border-top:1px solid #1a3426;padding-top:7px;display:grid;gap:2px">
        <div>NDVI <span style="color:#8fc89e;float:right">${isNaN(p.ndvi) ? "—" : (+p.ndvi).toFixed(4)}</span></div>
        <div>NDMI <span style="color:#8fc89e;float:right">${isNaN(p.ndmi) ? "—" : (+p.ndmi).toFixed(4)}</span></div>
        <div>Pixels <span style="color:#8fc89e;float:right">${p.pixelCount ?? "—"}</span></div>
        <div style="margin-top:3px;color:#2a5a38;font-size:9px">${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}</div>
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

// ─── Component ────────────────────────────────────────────────────────────────
export function FarmHistory() {
  const mapRef        = useRef(null);
  const rendererRef   = useRef(null);
  const gridRef       = useRef(null);
  const farmOutRef    = useRef(null);
  const cellLookupRef = useRef(new Map());
  const popupRef      = useRef(null);
  const baseLayers    = useRef({});

  const [farms,        setFarms]        = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [dates,        setDates]        = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [summary,      setSummary]      = useState(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingPixels,setLoadingPixels]= useState(false);
  const [mapReady,     setMapReady]     = useState(false);

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("hist-map", { minZoom: 10, maxZoom: 22, zoomControl: false })
                 .setView([6.25, 80.50], 14);
    mapRef.current = map;
    rendererRef.current = L.canvas({ padding: 0.5 });
    L.control.zoom({ position: "bottomleft" }).addTo(map);

    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Esri", maxNativeZoom: 19, maxZoom: 22 }
    );
    baseLayers.current = { satellite };
    satellite.addTo(map);

    popupRef.current = L.popup({ maxWidth: 240 });
    map.on("click", (e) => {
      const key = `${Math.round(e.latlng.lat / CELL_DEG)}_${Math.round(e.latlng.lng / CELL_DEG)}`;
      const p   = cellLookupRef.current.get(key);
      if (!p) return;
      popupRef.current.setLatLng(e.latlng).setContent(popupHtml(p)).openOn(map);
    });

    setMapReady(true);

    // Load farms list
    const userId = localStorage.getItem("userId");
    if (userId) {
      axios.get(`${API}/api/farm/${userId}`)
        .then(({ data }) => {
          // Treat as array or single farm
          const list = Array.isArray(data) ? data : [data];
          setFarms(list);
          if (list.length > 0) setSelectedFarm(list[0]);
        })
        .catch(() => {});
    }

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ── Draw farm outline on map ─────────────────────────────────────────────
  const drawFarmOutline = useCallback((farm) => {
    const map = mapRef.current;
    if (!map || !farm?.polygon) return;

    if (farmOutRef.current) { map.removeLayer(farmOutRef.current); farmOutRef.current = null; }

    try {
      const coords  = JSON.parse(farm.polygon);
      const latLngs = coords.map(c => [parseFloat(c[1]), parseFloat(c[0])]);
      const outline = L.polygon(latLngs, {
        color: "#2ecc71", weight: 1.5, fillOpacity: 0, dashArray: "5 5",
      }).addTo(map);
      farmOutRef.current = outline;
      map.fitBounds(outline.getBounds(), { padding: [40, 40] });
    } catch (_) {}
  }, []);

  // ── Fetch dates when farm changes ────────────────────────────────────────
  useEffect(() => {
    if (!selectedFarm) return;

    setDates([]);
    setSelectedDate(null);
    setSummary(null);
    if (gridRef.current && mapRef.current) { mapRef.current.removeLayer(gridRef.current); gridRef.current = null; }
    cellLookupRef.current = new Map();

    drawFarmOutline(selectedFarm);
    setLoadingDates(true);

    axios.get(`${API}/api/farmhistory/${selectedFarm.farmId}/dates`)
      .then(({ data }) => {
        setDates(data);
        if (data.length > 0) setSelectedDate(data[0]); // default to latest
      })
      .catch(() => setDates([]))
      .finally(() => setLoadingDates(false));
  }, [selectedFarm, drawFarmOutline]);

  // ── Fetch pixels when date changes ───────────────────────────────────────
  useEffect(() => {
    if (!selectedFarm || !selectedDate || !mapReady) return;

    setLoadingPixels(true);
    setSummary(null);

    axios.get(`${API}/api/farmhistory/${selectedFarm.farmId}/pixels`, {
      params: { date: selectedDate }
    })
      .then(({ data }) => {
        setSummary(data);

        const pixels = (data.pixels ?? []).map(p => ({
          lat:        parseFloat(p.latitude  || 0),
          lon:        parseFloat(p.longitude || 0),
          risk:       parseFloat(p.risk)      || 0,
          ndvi:       parseFloat(p.ndvi),
          ndmi:       parseFloat(p.ndmi),
          cellId:     p.cellId ?? "",
          pixelCount: p.pixelCount,
        })).filter(p => isFinite(p.lat) && isFinite(p.lon) && p.lat !== 0);

        const map = mapRef.current;
        if (map) {
          const lookup = drawGrid(map, pixels, gridRef, rendererRef.current, 0.78);
          cellLookupRef.current = lookup;
          if (farmOutRef.current) farmOutRef.current.bringToFront();
        }
      })
      .catch(() => setSummary(null))
      .finally(() => setLoadingPixels(false));
  }, [selectedFarm, selectedDate, mapReady]);

  const riskPct = (count) => summary?.totalCells ? Math.round((count / summary.totalCells) * 100) : 0;

  return (
    <>
      <style>{css}</style>
      <div id="hist-root">

        {/* Header */}
        <div className="hist-header">
          <div className="hist-brand">
            <div className="hist-icon">📅</div>
            <div>
              <div className="hist-title">Farm History</div>
              <div className="hist-sub">TEMPORAL · NDVI · RISK TIMELINE</div>
            </div>
          </div>

          {/* Farm selector */}
          <div className="hist-farm-bar">
            {farms.length > 1 && (
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
            )}
            {farms.length === 1 && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#4a7a5a" }}>
                {farms[0].name}
              </span>
            )}
          </div>
        </div>

        {/* Timeline strip */}
        <div className="hist-timeline-wrap">
          <div className="hist-timeline-label">
            {loadingDates ? "Loading dates…" : dates.length > 0 ? `${dates.length} Snapshots` : "No data available"}
          </div>
          {dates.length > 0 && (
            <div className="hist-dates">
              {dates.map(d => (
                <button
                  key={d}
                  className={`hist-date-chip${selectedDate === d ? " active" : ""}`}
                  onClick={() => setSelectedDate(d)}
                >
                  <span className="chip-dot" />
                  {String(d).slice(0, 10)}
                </button>
              ))}
            </div>
          )}
          {!loadingDates && dates.length === 0 && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "#2e5c3e" }}>
              Select a farm to view available dates
            </div>
          )}
        </div>

        {/* Main content */}
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
              <div className="hist-map-badge hist-date-badge">
                <div className="hist-date-dot" />
                {String(selectedDate).slice(0, 10)}
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="hist-side">

            {/* Stats */}
            <div className="hist-card">
              <div className="hist-card-title">Snapshot Stats</div>
              {summary ? (
                <div className="hist-stats-grid">
                  <div className="hist-stat-item">
                    <span className="hist-stat-val blue">{summary.totalCells}</span>
                    <span className="hist-stat-lbl">Total Cells</span>
                  </div>
                  <div className="hist-stat-item">
                    <span className="hist-stat-val" style={{ color: riskColor(summary.avgRisk) }}>
                      {summary.avgRisk}%
                    </span>
                    <span className="hist-stat-lbl">Avg Risk</span>
                  </div>
                  <div className="hist-stat-item">
                    <span className="hist-stat-val red">{summary.maxRisk?.toFixed(1)}%</span>
                    <span className="hist-stat-lbl">Peak Risk</span>
                  </div>
                  <div className="hist-stat-item">
                    <span className="hist-stat-val red">{summary.highRisk}</span>
                    <span className="hist-stat-lbl">High Risk</span>
                  </div>
                </div>
              ) : (
                <div className="hist-empty">
                  <div className="hist-empty-icon">📊</div>
                  <div className="hist-empty-text">
                    {selectedDate ? "Loading…" : "Select a date"}
                  </div>
                </div>
              )}
            </div>

            {/* Risk distribution */}
            {summary && (
              <div className="hist-card">
                <div className="hist-card-title">Risk Distribution</div>
                <div className="hist-risk-bar-wrap">
                  {[
                    { label: "High",   count: summary.highRisk,   color: "#e05252", pct: riskPct(summary.highRisk) },
                    { label: "Medium", count: summary.mediumRisk, color: "#f0a500", pct: riskPct(summary.mediumRisk) },
                    { label: "Low",    count: summary.lowRisk,    color: "#2ecc71", pct: riskPct(summary.lowRisk) },
                  ].map(({ label, count, color, pct }) => (
                    <div className="hist-risk-row" key={label}>
                      <div className="hist-risk-label">{label}</div>
                      <div className="hist-risk-track">
                        <div className="hist-risk-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <div className="hist-risk-count">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vegetation indices */}
            {summary && (
              <div className="hist-card">
                <div className="hist-card-title">Vegetation Indices</div>
                {[
                  { name: "Avg NDVI",  val: summary.avgNDVI?.toFixed(4) },
                  { name: "Avg NDMI",  val: summary.avgNDMI?.toFixed(4) },
                  { name: "Date",      val: String(selectedDate).slice(0, 10) },
                  { name: "Cells",     val: summary.totalCells },
                ].map(({ name, val }) => (
                  <div className="hist-index-row" key={name}>
                    <span className="hist-index-name">{name}</span>
                    <span className="hist-index-val">{val ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="hist-card">
              <div className="hist-card-title">Risk Index</div>
              <div className="hist-legend-bar" />
              <div className="hist-legend-labels">
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FarmHistory;