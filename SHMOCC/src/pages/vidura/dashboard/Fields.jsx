import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import axios from "axios";
import { useLanguage } from "../dashboard/context/LanguageContext";
import { useTheme } from "../dashboard/context/ThemeContext";

const API = "https://localhost:44331";

// Nominatim (OpenStreetMap) geocoding endpoint — free, no API key required.
// Bias results toward Sri Lanka since this is a Ceylon cinnamon farm register.
const GEOCODE_API = "https://nominatim.openstreetmap.org/search";

// ═════════════════════════════════════════════════════════════════════════════
// PATCH 1: Fix leaflet-draw readableArea crash (undeclared 'type' in strict mode)
// ═════════════════════════════════════════════════════════════════════════════
if (L.GeometryUtil && L.GeometryUtil.readableArea) {
  L.GeometryUtil.readableArea = function (area, isMetric) {
    var areaStr, units, type;
    type = typeof isMetric;
    if (type === "boolean") {
      units = isMetric ? ["ha", "m"] : ["acres", "ft", "yd"];
    } else {
      units = isMetric;
    }

    if (area >= 1000000 && units.indexOf("km") !== -1) {
      areaStr = L.GeometryUtil.formattedNumber(area * 0.000001, 2) + " km²";
    } else if (area >= 10000 && units.indexOf("ha") !== -1) {
      areaStr = L.GeometryUtil.formattedNumber(area * 0.0001, 2) + " ha";
    } else if (area >= 4046.86 && units.indexOf("acres") !== -1) {
      areaStr = L.GeometryUtil.formattedNumber(area * 0.000247105, 2) + " acres";
    } else if (units.indexOf("yd") !== -1) {
      areaStr = L.GeometryUtil.formattedNumber(area * 1.19599, 0) + " yd²";
    } else if (units.indexOf("ft") !== -1) {
      areaStr = L.GeometryUtil.formattedNumber(area * 10.7639, 0) + " ft²";
    } else if (units.indexOf("m") !== -1) {
      areaStr = L.GeometryUtil.formattedNumber(area, 0) + " m²";
    } else {
      areaStr = L.GeometryUtil.formattedNumber(area, 2);
    }
    return areaStr;
  };
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-white">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c0-5.5-4-10-10-10 5.5 0 10 4 10 10 0-5.5 4-10 10-10S17.5 2 12 2z" />
    </svg>
  );
}

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M22 12h-3M5 12H2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function FarmRegister() {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const mapRef       = useRef(null);
  const drawnRef      = useRef(null);
  const drawCtrlRef   = useRef(null);
  const meMarkerRef   = useRef(null);
  const locateWatchRef = useRef(false);
  const searchMarkerRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const searchAbortRef = useRef(null);
  const searchBoxRef = useRef(null);

  const [checking,     setChecking]     = useState(true);
  const [hasFarm,      setHasFarm]      = useState(null);
  const [existingFarm, setExistingFarm] = useState(null);

  const [farmName,   setFarmName]   = useState("");
  const [hasPolygon, setHasPolygon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState(null);
  const [success,    setSuccess]    = useState(false);

  const [locating,     setLocating]     = useState(false);
  const [locateError,  setLocateError]  = useState(null);

  // Live drawing state
  const [drawPoints,   setDrawPoints]   = useState(0);
  const [isDrawing,    setIsDrawing]    = useState(false);

  // Location search state
  const [searchText,    setSearchText]    = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchActiveIdx, setSearchActiveIdx] = useState(-1);

  const userId = localStorage.getItem("userId");

  // ── Check registration status ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setChecking(false); setHasFarm(false); return; }

    axios.get(`${API}/api/farm/${userId}`)
      .then(({ data }) => {
        if (data && (data.polygon || data.Polygon)) {
          setHasFarm(true);
          setExistingFarm({
            name: data.name ?? data.Name ?? t("register.unnamedFarm"),
          });
        } else {
          setHasFarm(false);
        }
      })
      .catch(() => setHasFarm(false))
      .finally(() => setChecking(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Init map + draw controls ────────────────────────────────────────────────
  useEffect(() => {
    if (checking || hasFarm !== false || mapRef.current) return;

    const map = L.map("register-map", {
      minZoom: 5,
      maxZoom: 20,
      zoomControl: false,
      doubleClickZoom: false, // Prevent accidental double-click from finishing shape
    }).setView([6.9271, 79.8612], 8);
    mapRef.current = map;

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Esri", maxNativeZoom: 19, maxZoom: 22 }
    ).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnRef.current = drawnItems;

    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          showLength: true,
          metric: true,
          feet: false,
          guidelineDistance: 20,
          shapeOptions: {
            color: "#10b981",
            weight: 2,
            fillOpacity: 0.15,
          },
        },
        marker: false,
        circle: false,
        circlemarker: false,
        rectangle: false,
        polyline: false,
      },
      edit: { featureGroup: drawnItems, remove: true },
    });
    map.addControl(drawControl);
    drawCtrlRef.current = drawControl;

    // Track when drawing starts
    map.on(L.Draw.Event.DRAWSTART, (e) => {
      if (e.layerType === "polygon") {
        setIsDrawing(true);
        setDrawPoints(0);
      }
    });

    // Track each new vertex during drawing
    map.on(L.Draw.Event.DRAWVERTEX, () => {
      setDrawPoints((prev) => prev + 1);
    });

    // Drawing cancelled
    map.on(L.Draw.Event.DRAWSTOP, () => {
      setIsDrawing(false);
    });

    map.on(L.Draw.Event.CREATED, (e) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      setHasPolygon(true);
      setFormError(null);
      setIsDrawing(false);
      setDrawPoints(0);
    });

    map.on(L.Draw.Event.EDITED, () => {
      setHasPolygon(drawnItems.getLayers().length > 0);
    });

    map.on(L.Draw.Event.DELETED, () => {
      setHasPolygon(drawnItems.getLayers().length > 0);
    });

    // ── Geolocation handler ───────────────────────────────────────────────
    map.on("locationfound", (e) => {
      setLocating(false);
      setLocateError(null);

      const isManual = locateWatchRef.current;
      if (isManual || e.accuracy <= 100 || !meMarkerRef.current) {
        map.setView(e.latlng, 17);
      }

      if (meMarkerRef.current) map.removeLayer(meMarkerRef.current);

      // PATCH 2: Bind tooltip to circleMarker, not layerGroup (fixes "Unable to get source layer LatLng")
      const marker = L.circleMarker(e.latlng, {
        radius: 7, color: "#10b981", fillColor: "#10b981",
        fillOpacity: 0.9, weight: 2,
      }).bindTooltip(`${t("register.youAreHere")} (±${Math.round(e.accuracy)}m)`, {
        permanent: false,
        direction: "top",
        offset: [0, -10],
      });

      const accuracyCircle = L.circle(e.latlng, {
        radius: e.accuracy, color: "#10b981", fillOpacity: 0.08, weight: 1,
      });

      meMarkerRef.current = L.layerGroup([marker, accuracyCircle]).addTo(map);
    });

    map.on("locationerror", (err) => {
      setLocating(false);
      locateWatchRef.current = false;
      setLocateError(
        err.code === 1
          ? t("register.locationDenied")
          : t("register.locationFailed")
      );
    });

    // Silent auto-locate once on load
    map.locate({ setView: false, maxZoom: 16, enableHighAccuracy: true });

    return () => {
      map.stopLocate();
      map.remove();
      mapRef.current = null;
      locateWatchRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, hasFarm]);

  const clearDrawing = useCallback(() => {
    if (drawnRef.current) drawnRef.current.clearLayers();
    setHasPolygon(false);
    setDrawPoints(0);
  }, []);

  const goToMyLocation = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.stopLocate();
    locateWatchRef.current = true;
    setLocating(true);
    setLocateError(null);
    mapRef.current.locate({
      watch: true,
      setView: false,
      maxZoom: 17,
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  }, []);

  // ── Location search (Nominatim geocoding) ───────────────────────────────
  // Debounced as the user types; biased toward Sri Lanka (viewbox + countrycodes)
  // but falls back to worldwide results if nothing local matches.
  const runSearch = useCallback((query) => {
    if (searchAbortRef.current) searchAbortRef.current.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearching(true);
    axios.get(GEOCODE_API, {
      params: {
        q: query,
        format: "jsonv2",
        addressdetails: 1,
        limit: 6,
        countrycodes: "lk",
      },
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(({ data }) => {
        setSearchResults(Array.isArray(data) ? data : []);
        setSearchActiveIdx(-1);
      })
      .catch((err) => {
        if (axios.isCancel(err) || err.code === "ERR_CANCELED") return;
        setSearchResults([]);
      })
      .finally(() => setSearching(false));
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchText(value);
    setSearchOpen(true);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    searchDebounceRef.current = setTimeout(() => runSearch(trimmed), 400);
  }, [runSearch]);

  const flyToResult = useCallback((result) => {
    if (!mapRef.current || !result) return;
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;

    mapRef.current.setView([lat, lon], 17, { animate: true });

    if (searchMarkerRef.current) mapRef.current.removeLayer(searchMarkerRef.current);
    searchMarkerRef.current = L.marker([lat, lon], { opacity: 0.9 })
      .addTo(mapRef.current)
      .bindTooltip(result.display_name, { direction: "top", offset: [0, -8] })
      .openTooltip();

    setSearchText(result.display_name);
    setSearchOpen(false);
    setSearchResults([]);
  }, []);

  const handleSearchKeyDown = useCallback((e) => {
    if (!searchOpen || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchActiveIdx((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchActiveIdx((prev) => (prev <= 0 ? searchResults.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = searchActiveIdx >= 0 ? searchResults[searchActiveIdx] : searchResults[0];
      flyToResult(pick);
    } else if (e.key === "Escape") {
      setSearchOpen(false);
    }
  }, [searchOpen, searchResults, searchActiveIdx, flyToResult]);

  const clearSearch = useCallback(() => {
    setSearchText("");
    setSearchResults([]);
    setSearchOpen(false);
    if (searchMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }
  }, []);

  // Close the results dropdown when clicking outside the search box
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Submit registration ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    setFormError(null);

    if (!farmName.trim()) {
      setFormError(t("register.errorNoName"));
      return;
    }
    if (!hasPolygon || !drawnRef.current || drawnRef.current.getLayers().length === 0) {
      setFormError(t("register.errorNoPolygon"));
      return;
    }

    const layer = drawnRef.current.getLayers()[0];
    const latlngs = layer.getLatLngs()[0];
    const coords = latlngs.map(ll => [ll.lng, ll.lat]);

    setSubmitting(true);
    try {
      await axios.post(`${API}/api/farm/register`, {
        userId,
        name: farmName.trim(),
        polygon: JSON.stringify(coords),
      });
      setSuccess(true);
      setHasFarm(true);
      setExistingFarm({ name: farmName.trim() });
    } catch (err) {
      console.error("Farm registration error:", err);
      setFormError(t("register.errorSubmit"));
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-400/30 border-t-emerald-500 animate-spin" />
        <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          {t("register.checking")}
        </div>
      </div>
    );
  }

  if (hasFarm) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-slate-50 dark:bg-slate-950 px-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/20">
          <LeafIcon />
        </div>
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("register.alreadyRegisteredTitle")}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          {t("register.alreadyRegisteredBody")}
          {existingFarm?.name ? ` (${existingFarm.name})` : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased">
      <style>{`
        .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 14px rgba(0,0,0,0.25) !important; border-radius: 10px !important; overflow: hidden; }
        .leaflet-control-zoom a { background: rgba(15,23,25,0.9) !important; color: #d1fae5 !important; border: none !important; }
        .leaflet-control-zoom a:hover { background: #10b981 !important; color: #fff !important; }
        .leaflet-draw-toolbar a { background-color: ${isDark ? "#0f172a" : "#fff"} !important; }
        .leaflet-draw-toolbar a:hover { background-color: ${isDark ? "#1e293b" : "#f1f5f9"} !important; }
        .leaflet-draw-tooltip {
          background: rgba(15, 23, 42, 0.9) !important;
          border: 1px solid #334155 !important;
          color: #e2e8f0 !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          padding: 4px 8px !important;
        }
        .leaflet-draw-tooltip-subtext {
          color: #94a3b8 !important;
        }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 shadow-sm">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/20">
          <LeafIcon />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {t("register.title")}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold">
            {t("register.subtitle")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4 flex-1 min-h-0">

        {/* Map */}
        <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 bg-slate-900 min-h-[320px]">
          <div id="register-map" className="absolute inset-0" />

          {/* Location search box */}
          <div
            ref={searchBoxRef}
            className="absolute top-3 left-3 z-[1000] w-[min(320px,calc(100%-5.5rem))]"
          >
            <div className="flex items-center gap-2 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200 dark:border-slate-700 px-3 py-2">
              <span className="text-slate-400 dark:text-slate-500">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t("register.searchPlaceholder") || t("register.locateMe")}
                className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
              {searching && (
                <div className="h-3.5 w-3.5 rounded-full border-2 border-emerald-400/30 border-t-emerald-500 animate-spin shrink-0" />
              )}
              {!searching && searchText && (
                <button
                  onClick={clearSearch}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                  aria-label="Clear search"
                >
                  <ClearIcon />
                </button>
              )}
            </div>

            {searchOpen && searchResults.length > 0 && (
              <div className="mt-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden max-h-64 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <button
                    key={`${result.place_id}-${idx}`}
                    onClick={() => flyToResult(result)}
                    onMouseEnter={() => setSearchActiveIdx(idx)}
                    className={`w-full flex items-start gap-2 px-3 py-2 text-left text-xs transition-colors duration-100 ${
                      idx === searchActiveIdx
                        ? "bg-emerald-50 dark:bg-slate-800"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-emerald-500 mt-0.5">
                      <PinIcon />
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 leading-snug">
                      {result.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {searchOpen && !searching && searchText.trim().length >= 3 && searchResults.length === 0 && (
              <div className="mt-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-400 dark:text-slate-500">
                {t("register.searchNoResults") || "No matches found"}
              </div>
            )}
          </div>

          {/* Live drawing indicator */}
          {isDrawing && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] rounded-lg bg-emerald-600 text-white px-4 py-2 text-xs font-semibold shadow-lg flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-100"></span>
              </span>
              {drawPoints < 3
                ? `Drawing farm boundary… ${drawPoints} point${drawPoints !== 1 ? 's' : ''} placed (need 3+)`
                : `Drawing farm boundary… ${drawPoints} points placed — keep clicking to add more, click first point to finish`}
            </div>
          )}

          {/* Locate-me button */}
          <button
            onClick={goToMyLocation}
            disabled={locating}
            title={t("register.locateMe")}
            className="absolute bottom-4 right-4 z-[1000] h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors duration-150"
          >
            {locating ? (
              <div className="h-4 w-4 rounded-full border-2 border-emerald-400/30 border-t-emerald-500 animate-spin" />
            ) : (
              <LocateIcon />
            )}
          </button>

          {/* Location error toast */}
          {locateError && (
            <div className="absolute top-3 left-3 z-[1000] rounded-lg bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 text-xs text-rose-500 dark:text-rose-400 shadow-sm border border-rose-100 dark:border-rose-900">
              {locateError}
            </div>
          )}
        </div>

        {/* Form panel */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              {t("register.farmDetails")}
            </div>

            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              {t("register.farmName")}
            </label>
            <input
              type="text"
              value={farmName}
              onChange={e => setFarmName(e.target.value)}
              placeholder={t("register.farmNamePlaceholder")}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />

            <div className="flex items-center gap-2 mb-4 text-xs">
              <div className={`h-2 w-2 rounded-full ${hasPolygon ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
              <span className="text-slate-500 dark:text-slate-400">
                {hasPolygon ? t("register.boundaryDrawn") : t("register.boundaryPending")}
              </span>
            </div>

            {formError && (
              <div className="text-xs text-rose-500 dark:text-rose-400 mb-3">{formError}</div>
            )}

            {success && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">
                {t("register.successMessage")}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 shadow-sm shadow-emerald-500/20 transition-colors duration-150"
            >
              {submitting ? t("register.submitting") : t("register.submit")}
            </button>

            {hasPolygon && (
              <button
                onClick={clearDrawing}
                disabled={submitting}
                className="w-full mt-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
              >
                {t("register.clearBoundary")}
              </button>
            )}
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
              {t("register.howToTitle")}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t("register.howToBody")}
              </p>
             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmRegister;