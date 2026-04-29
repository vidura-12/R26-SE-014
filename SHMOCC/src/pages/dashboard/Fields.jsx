import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import axios from "axios";

import "leaflet/dist/leaflet.css";

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  #field-root {
    font-family: 'Syne', sans-serif;
    background: #080f0a;
    min-height: 100vh;
    padding: 14px;
    color: #e2efe8;
  }
  .fld-header {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-bottom: 12px; gap: 12px; flex-wrap: wrap;
  }
  .fld-brand { display: flex; align-items: center; gap: 10px; }
  .fld-brand-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #1a5c30, #2ecc71);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    font-size: 1rem; box-shadow: 0 0 16px #2ecc7133;
  }
  .fld-title { font-size: 1.25rem; font-weight: 800; color: #e2efe8; letter-spacing: -0.3px; line-height: 1; }
  .fld-sub   { font-size: 0.6rem; color: #3a6b4a; font-family: 'Space Mono', monospace; margin-top: 3px; letter-spacing: 2px; }
  .fld-reg-btn {
    padding: 8px 18px; border-radius: 8px;
    background: linear-gradient(135deg, #1a5c30, #2ecc71);
    color: #fff; border: none; font-weight: 700; font-family: 'Syne', sans-serif;
    cursor: pointer; font-size: 0.82rem; box-shadow: 0 0 20px #2ecc7133; transition: all 0.2s;
  }
  .fld-reg-btn:hover { box-shadow: 0 0 30px #2ecc7155; transform: translateY(-1px); }

  .fld-map-wrap {
    position: relative; border-radius: 14px; overflow: hidden;
    box-shadow: 0 0 0 1px #1a3025, 0 20px 60px #000c;
  }
  #map { height: 83vh; width: 100%; display: block; background: #080f0a; }

  .fld-panel {
    position: absolute; top: 12px; right: 12px; z-index: 1000;
    background: rgba(8,15,10,0.94); backdrop-filter: blur(16px);
    border: 1px solid #1e3828; border-radius: 12px; padding: 14px;
    min-width: 210px; box-shadow: 0 8px 32px #0009;
  }
  .fld-section-label {
    font-size: 0.58rem; font-family: 'Space Mono', monospace; color: #2a5a38;
    letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 8px;
    padding-bottom: 6px; border-bottom: 1px solid #12261a;
  }
  .fld-base-btn {
    display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 9px;
    border-radius: 7px; border: 1px solid transparent; background: transparent;
    color: #7aaa8a; font-family: 'Syne', sans-serif; font-size: 0.79rem;
    font-weight: 600; cursor: pointer; transition: all 0.15s; margin-bottom: 3px; text-align: left;
  }
  .fld-base-btn:hover  { background: #111e16; color: #e2efe8; }
  .fld-base-btn.active { background: #162d1f; border-color: #2a6a3a; color: #7fffa0; }
  .fld-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .fld-divider { border: none; border-top: 1px solid #12261a; margin: 10px 0; }
  .fld-toggle {
    display: flex; align-items: center; gap: 9px; padding: 7px 9px;
    border-radius: 7px; cursor: pointer; transition: background 0.15s;
    user-select: none; margin-bottom: 3px;
  }
  .fld-toggle:hover { background: #111e16; }
  .fld-toggle-label { font-size: 0.79rem; font-weight: 600; color: #7aaa8a; flex: 1; line-height: 1; }
  .fld-toggle-sub { font-size: 0.6rem; color: #2a5a38; font-family:'Space Mono',monospace; display:block; margin-top:1px; }
  .fld-pill {
    padding: 2px 8px; border-radius: 100px; font-size: 0.6rem;
    font-family: 'Space Mono', monospace; font-weight: 700; border: 1px solid; flex-shrink: 0;
  }
  .fld-pill.on     { background: #1a3a22; border-color: #2ecc71; color: #2ecc71; }
  .fld-pill.off    { background: #12201a; border-color: #1e3828; color: #2a5a38; }
  .fld-pill.red-on { background: #3a1010; border-color: #e53935; color: #e53935; }

  .fld-opacity-row { padding: 6px 9px 4px; }
  .fld-opacity-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px;
  }
  .fld-opacity-label { font-size: 0.79rem; font-weight: 600; color: #7aaa8a; display: flex; align-items: center; gap: 8px; }
  .fld-opacity-val {
    font-size: 0.6rem; font-family: 'Space Mono', monospace;
    color: #2ecc71; background: #1a3a22; border: 1px solid #2ecc7144;
    padding: 1px 7px; border-radius: 100px;
  }
  .fld-slider {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 4px; border-radius: 2px; outline: none; cursor: pointer;
    background: linear-gradient(to right, #2ecc71 var(--pct, 75%), #1e3828 var(--pct, 75%));
  }
  .fld-slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%;
    background: #2ecc71; border: 2px solid #080f0a; box-shadow: 0 0 6px #2ecc7155; cursor: pointer;
  }
  .fld-slider::-moz-range-thumb {
    width: 13px; height: 13px; border-radius: 50%;
    background: #2ecc71; border: 2px solid #080f0a; box-shadow: 0 0 6px #2ecc7155; cursor: pointer;
  }

  .fld-legend {
    position: absolute; bottom: 14px; right: 12px; z-index: 1000;
    background: rgba(8,15,10,0.94); backdrop-filter: blur(16px);
    border: 1px solid #1e3828; border-radius: 12px; padding: 12px 14px;
    min-width: 160px; box-shadow: 0 8px 32px #0009;
  }
  .fld-legend-title {
    font-size: 0.58rem; font-family: 'Space Mono', monospace; color: #2a5a38;
    letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;
    padding-bottom: 6px; border-bottom: 1px solid #12261a;
  }
  .fld-grad-bar {
    width: 100%; height: 12px; border-radius: 6px;
    background: linear-gradient(to right, #ffffb2, #fecc5c, #fd8d3c, #f03b20, #bd0026);
    margin-bottom: 5px; box-shadow: 0 0 8px #bd002633;
  }
  .fld-grad-labels {
    display: flex; justify-content: space-between; font-size: 0.58rem;
    font-family: 'Space Mono', monospace; color: #3a6b4a; margin-bottom: 10px;
  }
  .fld-legend-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; font-size: 0.7rem; font-family: 'Space Mono', monospace; color: #7aaa8a; }
  .fld-legend-swatch { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }

  .fld-stats-bar {
    position: absolute; bottom: 14px; left: 12px; z-index: 1000;
    display: flex; gap: 7px; flex-wrap: wrap;
  }
  .fld-stat {
    background: rgba(8,15,10,0.94); backdrop-filter: blur(16px);
    border: 1px solid #1e3828; border-radius: 10px; padding: 8px 13px; min-width: 70px;
  }
  .fld-stat-val { font-size: 1.1rem; font-weight: 800; color: #7fffa0; display: block; font-family: 'Space Mono', monospace; line-height: 1; }
  .fld-stat-val.red   { color: #e53935; }
  .fld-stat-val.amber { color: #ff9800; }
  .fld-stat-lbl { color: #2a5a38; font-size: 0.55rem; font-family: 'Space Mono', monospace; letter-spacing: 1px; margin-top: 3px; display: block; text-transform: uppercase; }

  .fld-date-badge {
    position: absolute; top: 12px; left: 12px; z-index: 1000;
    background: rgba(8,15,10,0.94); backdrop-filter: blur(16px);
    border: 1px solid #1e3828; border-radius: 8px; padding: 6px 12px;
    font-size: 0.63rem; font-family: 'Space Mono', monospace; color: #3a6b4a;
    display: flex; align-items: center; gap: 6px;
  }
  .fld-date-dot { width: 6px; height: 6px; border-radius: 50%; background: #2ecc71; animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

  .fld-loading {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(8,15,10,0.88); backdrop-filter: blur(8px); z-index: 2000;
    border-radius: 14px; flex-direction: column; gap: 14px;
    font-family: 'Space Mono', monospace; color: #2a5a38; font-size: 0.72rem; letter-spacing: 2px;
  }
  .fld-spinner { width: 36px; height: 36px; border: 2px solid #12261a; border-top-color: #2ecc71; border-radius: 50%; animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .leaflet-popup-content-wrapper {
    background: #0d1a0f !important; border: 1px solid #1e3828 !important;
    border-radius: 10px !important; box-shadow: 0 8px 24px #0009 !important;
    color: #e2efe8 !important; font-family: 'Space Mono', monospace !important;
  }
  .leaflet-popup-tip { background: #0d1a0f !important; }
  .leaflet-popup-content { margin: 10px 14px !important; font-size: 12px !important; line-height: 1.8 !important; }
  .leaflet-popup-close-button { color: #3a6b4a !important; top: 6px !important; right: 8px !important; }
`;

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
const CELL_DEG    = 0.00009
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
// All polygons use interactive:false — Leaflet's canvas renderer skips
// per-polygon hit-testing entirely.  Click events are resolved by a single
// map.on('click') handler doing O(1) grid-key lookup.
// Returns Map<gridKey, pointData> for the click handler.
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
      interactive:  false,   // ← KEY FIX: no per-polygon hit-testing
    }).addTo(group);

    // Spatial lookup key — same snapping formula used in the click handler
    const key = `${Math.round(p.lat / CELL_DEG)}_${Math.round(p.lon / CELL_DEG)}`;
    cellLookup.set(key, p);
  });

  group.addTo(map);
  layerRef.current = group;
  return cellLookup;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Fields() {
  const mapRef        = useRef(null);
  const rendererRef   = useRef(null);
  const gridRef       = useRef(null);
  const highRef       = useRef(null);
  const farmOutRef    = useRef(null);
  const allPointsRef  = useRef([]);
  const cellLookupRef = useRef(new Map());  // click handler reads this
  const popupRef      = useRef(null);       // single reusable popup
  const navigate      = useNavigate();

  const [hasFarm,    setHasFarm]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeBase, setActiveBase] = useState("satellite");
  const [showGrid,   setShowGrid]   = useState(true);
  const [redOnly,    setRedOnly]    = useState(false);
  const [opacity,    setOpacity]    = useState(DEFAULT_OPA);
  const [stats,      setStats]      = useState({ total: 0, high: 0, medium: 0, avgRisk: 0, maxRisk: 0 });
  const [lastSync,   setLastSync]   = useState(null);

  const baseLayers  = useRef({});

  // Refs so the stable map click handler can always read latest toggle state
  const showGridRef = useRef(showGrid);
  const redOnlyRef  = useRef(redOnly);
  const opacityRef  = useRef(opacity);
  useEffect(() => { showGridRef.current = showGrid; }, [showGrid]);
  useEffect(() => { redOnlyRef.current  = redOnly;  }, [redOnly]);
  useEffect(() => { opacityRef.current  = opacity;  }, [opacity]);

  // ── Base layer switch ──────────────────────────────────────────────────────
  const switchBase = useCallback((key) => {
    const map = mapRef.current;
    if (!map) return;
    Object.entries(baseLayers.current).forEach(([k, lyr]) => {
      if (k === key) { if (!map.hasLayer(lyr)) lyr.addTo(map); }
      else           { if (map.hasLayer(lyr))  map.removeLayer(lyr); }
    });
    setActiveBase(key);
  }, []);

  // ── Opacity change ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map      = mapRef.current;
    const renderer = rendererRef.current;
    if (!map || !renderer || !allPointsRef.current.length) return;

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

  // ── Show/hide grid ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map    = mapRef.current;
    if (!map) return;
    const target = redOnly ? highRef.current : gridRef.current;
    if (!target) return;
    if (showGrid) { if (!map.hasLayer(target)) target.addTo(map); }
    else          { map.removeLayer(target); }
  }, [showGrid, redOnly]);

  // ── High Risk Only toggle ──────────────────────────────────────────────────
  useEffect(() => {
    const map      = mapRef.current;
    const renderer = rendererRef.current;
    if (!map || !renderer || !allPointsRef.current.length) return;

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

  // ── Map init ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const userId = localStorage.getItem("userId");

    const map = L.map("map", { minZoom: 14, maxZoom: 22, zoomControl: false })
                 .setView([6.25, 80.50], 16);
    mapRef.current = map;

    // Canvas renderer — single bitmap, zero inter-cell gaps
    rendererRef.current = L.canvas({ padding: 0.5 });

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

    // ── Single map-level click handler ────────────────────────────────────────
    // Replaces thousands of per-polygon bindPopup calls.
    // Snaps click coordinates to the nearest cell centre using integer division
    // by CELL_DEG — identical key formula to what drawGrid stores.
    popupRef.current = L.popup({ maxWidth: 240 });

    map.on("click", (e) => {
      if (!showGridRef.current) return;   // grid hidden — no popup

      const key = `${Math.round(e.latlng.lat / CELL_DEG)}_${Math.round(e.latlng.lng / CELL_DEG)}`;
      const p   = cellLookupRef.current.get(key);
      if (!p) return;

      popupRef.current
        .setLatLng(e.latlng)
        .setContent(popupHtml(p))
        .openOn(map);
    });

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

        // Initial draw
        const lookup = drawGrid(map, clean, gridRef, rendererRef.current, DEFAULT_OPA);
        cellLookupRef.current = lookup;
        if (farmOutRef.current) farmOutRef.current.bringToFront();

      } catch (err) {
        console.error("Risk API error:", err);
      }
    };

    init();
    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sliderPct = `${Math.round(opacity * 100)}%`;

  return (
    <>
      <style>{css}</style>
      <div id="field-root">

        {/* Header */}
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

        {/* Map */}
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
      </div>
    </>
  );
}

export default Fields;