import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import axios from "axios";
import { useLanguage } from "../dashboard/context/LanguageContext"; // adjust path to your file location
import { useTheme } from "../dashboard/context/ThemeContext";       // adjust path to your file location

const API = "https://localhost:44331";

// ─── Logo SVG (reused from FarmHistory) ────────────────────────────────────
function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-white">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c0-5.5-4-10-10-10 5.5 0 10 4 10 10 0-5.5 4-10 10-10S17.5 2 12 2z" />
    </svg>
  );
}

export function FarmRegister() {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const mapRef      = useRef(null);
  const drawnRef    = useRef(null); // FeatureGroup holding the drawn polygon
  const drawCtrlRef = useRef(null);

  const [checking,     setChecking]     = useState(true);
  const [hasFarm,      setHasFarm]      = useState(null);
  const [existingFarm, setExistingFarm] = useState(null);

  const [farmName,   setFarmName]   = useState("");
  const [hasPolygon, setHasPolygon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState(null);
  const [success,    setSuccess]    = useState(false);

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

  // ── Init map + draw controls (only once we know the farm doesn't exist) ───
  useEffect(() => {
    if (checking || hasFarm !== false || mapRef.current) return;

    const map = L.map("register-map", { minZoom: 5, maxZoom: 20, zoomControl: false })
                 .setView([6.9271, 79.8612], 8); // Sri Lanka default view
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
          shapeOptions: { color: "#10b981", weight: 2 },
        },
        marker: false, circle: false, circlemarker: false,
        rectangle: false, polyline: false,
      },
      edit: { featureGroup: drawnItems, remove: true },
    });
    map.addControl(drawControl);
    drawCtrlRef.current = drawControl;

    map.on(L.Draw.Event.CREATED, (e) => {
      drawnItems.clearLayers(); // only one farm boundary at a time
      drawnItems.addLayer(e.layer);
      setHasPolygon(true);
      setFormError(null);
    });

    map.on(L.Draw.Event.EDITED, () => {
      setHasPolygon(drawnItems.getLayers().length > 0);
    });

    map.on(L.Draw.Event.DELETED, () => {
      setHasPolygon(drawnItems.getLayers().length > 0);
    });

    // Try to center on the user's location for convenience
    map.locate({ setView: false, maxZoom: 16 });
    map.on("locationfound", (e) => map.setView(e.latlng, 15));

    return () => { map.remove(); mapRef.current = null; };
  }, [checking, hasFarm]);

  const clearDrawing = useCallback(() => {
    if (drawnRef.current) drawnRef.current.clearLayers();
    setHasPolygon(false);
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
    const latlngs = layer.getLatLngs()[0]; // outer ring
    // Stored as [lng, lat] pairs to match how FarmHistory/Fields parse polygons
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

  // ── Render: loading ────────────────────────────────────────────────────────
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

  // ── Render: already registered ─────────────────────────────────────────────
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

  // ── Render: registration form ───────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased">
      <style>{`
        .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 14px rgba(0,0,0,0.25) !important; border-radius: 10px !important; overflow: hidden; }
        .leaflet-control-zoom a { background: rgba(15,23,25,0.9) !important; color: #d1fae5 !important; border: none !important; }
        .leaflet-control-zoom a:hover { background: #10b981 !important; color: #fff !important; }
        .leaflet-draw-toolbar a { background-color: ${isDark ? "#0f172a" : "#fff"} !important; }
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
        </div>

        {/* Form panel */}
        <div className="flex flex-col gap-4">
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
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t("register.howToBody")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmRegister;