import { useState, useMemo } from "react";
import { useOutletContext, useLocation, useNavigate } from "react-router-dom";
import { useDashboard } from "./DashboardContext";
import { SensorCard } from "./DashboardComponents";

// Deterministically derives a slightly different reading set per device so
// each device's card looks distinct without needing a real data source yet.
// ─── Wiring this to real hardware ───────────────────────────────────────────
// Each device already has a `rtdbPath` field (set at registration, e.g.
// `/devices/DEV-001/sensorData`) intended for Firebase Realtime Database.
// Once your ESP32/sensor firmware is writing there, replace `deriveReadings`
// below with a `useEffect` that calls `onValue(ref(rtdb, device.rtdbPath), ...)`
// from `firebase/database`, and drop this mock generator entirely.
function deriveReadings(device) {
  const seed = (device?.deviceId || "default").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const wobble = (base, spread) => Math.round((base + (((seed * 37) % 100) / 100 - 0.5) * spread) * 10) / 10;
  return {
    soilPH: wobble(5.9, 0.6),
    soilMoistureVWC: wobble(31.5, 8),
    soilTempC: wobble(27.0, 2.5),
    humidity: wobble(74.2, 10),
    rainfall: Math.max(0, wobble(12.6, 10)),
    windSpeed: Math.max(0, wobble(9.1, 4)),
    uvIndex: Math.max(0, wobble(6.2, 3)),
  };
}

function makeSpark(base, spread, points = 7) {
  const seed = Math.round(base * 100);
  return Array.from({ length: points }, (_, i) => {
    const n = Math.sin(seed + i * 12.9898) * 43758.5453;
    const noise = (n - Math.floor(n)) - 0.5;
    return Math.round((base + noise * spread) * 10) / 10;
  });
}

export default function SensorData() {
  const { t } = useOutletContext();
  const nav = useNavigate();
  const location = useLocation();
  const { devices, devicesLoading } = useDashboard();

  const [selectedId, setSelectedId] = useState(
    location.state?.device?.firestoreId || null
  );

  const selectedDevice = useMemo(() => {
    if (selectedId) return devices.find(d => d.firestoreId === selectedId) || devices[0];
    return devices[0];
  }, [selectedId, devices]);

  if (devicesLoading) {
    return (
      <div className="fade-up" style={{ textAlign: "center", padding: "64px 24px", background: t.cardBg, borderRadius: 24, border: `1.5px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
        <div style={{ width: 44, height: 44, border: `3.5px solid ${t.divider}`, borderTop: "3.5px solid #10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
        <p style={{ fontSize: 15, color: t.textSecondary, fontWeight: 700 }}>Loading devices...</p>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="fade-up" style={{ textAlign: "center", padding: "80px 24px", background: t.cardBg, borderRadius: 24, border: `2px dashed ${t.dashedBorder}` }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: t.emptyIconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 20px", border: `2px dashed ${t.blueChipBorder}` }}>📊</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: t.textPrimary, marginBottom: 10 }}>No sensor data yet</div>
        <p style={{ fontSize: 15, color: t.textSecondary, marginBottom: 28, fontWeight: 500 }}>Register a device to start seeing live readings here</p>
        <button onClick={() => nav("/dashboard/devices")} style={{
          background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none",
          padding: "14px 32px", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)",
        }}>
          Go to Devices
        </button>
      </div>
    );
  }

  const readings = deriveReadings(selectedDevice);

  const CARDS = [
    { key: "soilPH",         icon: "🧪",  label: "Soil pH",        unit: "",       color: "#8b5cf6", trend: -1.2 },
    { key: "soilMoistureVWC",icon: "💧",  label: "Soil Moisture",  unit: "% VWC",  color: "#3b82f6", trend: 2.4 },
    { key: "soilTempC",      icon: "🌡️", label: "Soil Temp",      unit: "°C",     color: "#ea580c", trend: 0.8 },
    { key: "humidity",       icon: "💦",  label: "Humidity",       unit: "%",      color: "#06b6d4", trend: 1.6 },
    { key: "rainfall",       icon: "🌧️", label: "Rainfall",       unit: "mm",     color: "#0ea5e9", trend: -3.1 },
    { key: "windSpeed",      icon: "🌬️", label: "Wind Speed",     unit: "km/h",   color: "#64748b", trend: 0.4 },
    { key: "uvIndex",        icon: "☀️",  label: "UV Index",       unit: "",       color: "#eab308", trend: 1.0 },
  ];

  return (
    <div className="fade-up">
      {/* Device selector */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 24,
        padding: "16px 20px", background: t.cardBg, borderRadius: 18,
        border: `1.5px solid ${t.cardBorder}`, boxShadow: t.cardShadow, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 4 }}>Device:</span>
        {devices.map(d => {
          const active = selectedDevice?.firestoreId === d.firestoreId;
          return (
            <button key={d.firestoreId} onClick={() => setSelectedId(d.firestoreId)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: "pointer",
              border: `1.5px solid ${active ? "#10b981" : t.inputBorder}`,
              background: active ? (t.__isDark ? "linear-gradient(135deg, #0f2718, #0c2015)" : "linear-gradient(135deg, #dcfce7, #f0fdf4)") : t.inputBg,
              color: active ? (t.__isDark ? "#4ade80" : "#15803d") : t.textSecondary,
              transition: "all 0.2s",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.status === "online" ? "#22c55e" : "#ef4444" }} />
              {d.name}
            </button>
          );
        })}
      </div>

      {/* Selected device header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20,
        padding: "18px 24px", background: t.cardBg, borderRadius: 18, border: `1.5px solid ${t.cardBorder}`, boxShadow: t.cardShadow,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: selectedDevice.status === "online"
              ? (t.__isDark ? "linear-gradient(135deg, #0f2718, #133420)" : "linear-gradient(135deg, #dcfce7, #bbf7d0)")
              : (t.__isDark ? "linear-gradient(135deg, #2a1414, #331a1a)" : "linear-gradient(135deg, #fef2f2, #fecaca)"),
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            border: `1.5px solid ${selectedDevice.status === "online" ? "#16a34a40" : "#dc262640"}`,
          }}>📡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: t.textPrimary }}>{selectedDevice.name}</div>
            <div style={{ fontSize: 13, color: t.textSecondary, fontWeight: 500 }}>📍 {selectedDevice.location} · {selectedDevice.lastSeen}</div>
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 800, padding: "5px 14px", borderRadius: 99,
          background: selectedDevice.status === "online" ? (t.__isDark ? "#0f2718" : "#dcfce7") : (t.__isDark ? "#2a1414" : "#fef2f2"),
          color: selectedDevice.status === "online" ? (t.__isDark ? "#4ade80" : "#15803d") : (t.__isDark ? "#f87171" : "#b91c1c"),
          border: `1.5px solid ${selectedDevice.status === "online" ? "#16a34a40" : "#dc262640"}`,
          textTransform: "uppercase", letterSpacing: "0.1em",
        }}>{selectedDevice.status}</span>
      </div>

      {/* Sensor readouts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
        {CARDS.map(c => (
          <SensorCard
            key={c.key}
            icon={c.icon}
            label={c.label}
            value={readings[c.key]}
            unit={c.unit}
            sparkData={makeSpark(readings[c.key], Math.max(1, readings[c.key] * 0.15))}
            color={c.color}
            trend={c.trend}
            t={t}
          />
        ))}
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: t.textMuted, lineHeight: 1.6 }}>
        Showing simulated readings until this device's live feed is connected. Once your firmware writes to{" "}
        <code style={{ background: t.divider, padding: "1px 6px", borderRadius: 6 }}>{selectedDevice.rtdbPath || `/devices/${selectedDevice.deviceId}/sensorData`}</code>{" "}
        in Firebase Realtime Database, this page can be switched to stream live values.
      </p>
    </div>
  );
}