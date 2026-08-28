import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ref, onValue } from "firebase/database";

import { useDashboard } from "./DashboardContext";
import { rtdb } from "../../firebase";

const API_BASE_URL = "http://localhost:8000";

// ─── Risk styling (semantic colors, with dark-mode variants) ────────────────
const RISK_CONFIG = {
  critical: {
    color: "#dc2626",
    bg: "#fef2f2",
    bgDark: "linear-gradient(135deg, #2a1414, #241010)",
    border: "#fca5a5",
    borderDark: "#dc262660",
    label: "Critical Risk",
    gradient: "linear-gradient(135deg, #dc2626, #b91c1c)",
  },
  high: {
    color: "#ea580c",
    bg: "#fff7ed",
    bgDark: "linear-gradient(135deg, #2a1a10, #24160c)",
    border: "#fdba74",
    borderDark: "#ea580c60",
    label: "High Risk",
    gradient: "linear-gradient(135deg, #ea580c, #c2410c)",
  },
  moderate: {
    color: "#ca8a04",
    bg: "#fefce8",
    bgDark: "linear-gradient(135deg, #2a2410, #241f0c)",
    border: "#fde047",
    borderDark: "#ca8a0460",
    label: "Moderate Risk",
    gradient: "linear-gradient(135deg, #ca8a04, #a16207)",
  },
  low: {
    color: "#16a34a",
    bg: "#f0fdf4",
    bgDark: "linear-gradient(135deg, #0f2718, #0c2015)",
    border: "#86efac",
    borderDark: "#16a34a60",
    label: "Low Risk",
    gradient: "linear-gradient(135deg, #16a34a, #15803d)",
  },
};

// ─── Condition Card ───────────────────────────────────────────────────────────
function ConditionCard({ icon, label, value, color, optimal, t }) {
  return (
    <div style={{
      background: t.inputBg, borderRadius: 16, padding: "18px 20px",
      border: `1.5px solid ${t.inputBorder}`,
      display: "flex", alignItems: "center", gap: 14,
      transition: "all 0.2s",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `linear-gradient(135deg, ${color}15, ${color}08)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, border: `1.5px solid ${color}25`, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: t.textPrimary, fontFamily: "'Playfair Display',serif" }}>
          {value}
        </div>
        <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, marginTop: 2 }}>
          Optimal: {optimal}
        </div>
      </div>
    </div>
  );
}

// ─── Action Card ──────────────────────────────────────────────────────────────
function ActionCard({ text, isCritical, t }) {
  return (
    <div style={{
      padding: "14px 18px", borderRadius: 14,
      background: isCritical
        ? (t.__isDark ? "linear-gradient(135deg, #2a1414, #241010)" : "linear-gradient(135deg, #fef2f2, #fff5f5)")
        : t.inputBg,
      border: `1.5px solid ${isCritical ? "#fecaca60" : t.inputBorder}`,
      display: "flex", alignItems: "flex-start", gap: 12,
      boxShadow: isCritical ? "0 4px 16px rgba(220, 38, 38, 0.08)" : "none",
      transition: "all 0.2s",
      cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateX(4px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; }}
    >
      <span style={{
        fontSize: 16, flexShrink: 0, marginTop: 1,
        color: isCritical ? "#dc2626" : "#10b981",
      }}>
        {isCritical ? "🚨" : "→"}
      </span>
      <span style={{
        fontSize: 13, color: isCritical ? (t.__isDark ? "#fca5a5" : "#991b1b") : t.textSecondary,
        fontWeight: isCritical ? 800 : 700, lineHeight: 1.6,
      }}>
        {text}
      </span>
    </div>
  );
}

// ─── Main Advisory Page ───────────────────────────────────────────────────────
export default function Advisory() {
  const { t } = useOutletContext();
  const { devices, devicesLoading } = useDashboard();

  // Device driving the "real-time" reading
  const [selectedId, setSelectedId] = useState(null);
  const selectedDevice = useMemo(() => {
    if (selectedId) {
      return devices.find(d => d.firestoreId === selectedId) || devices[0];
    }
    return devices?.[0];
  }, [selectedId, devices]);

  // ── Live Firebase readings (replaces MOCK_SENSOR) ──────────────────────────
  const [liveReadings, setLiveReadings] = useState({
    soilPH: null,
    soilMoistureVWC: null,
    soilTempC: null,
  });
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(null);

  useEffect(() => {
    if (!selectedDevice) return;

    setFirebaseLoading(true);
    setFirebaseError(null);

    const deviceId = selectedDevice.deviceId;
    const firebasePath = `/devices/${deviceId}/sensorData`;
    const sensorRef = ref(rtdb, firebasePath);

    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setLiveReadings({ soilPH: null, soilMoistureVWC: null, soilTempC: null });
          setFirebaseLoading(false);
          return;
        }

        setLiveReadings({
          soilPH: data.Soil_pH !== undefined && data.Soil_pH !== null ? Number(data.Soil_pH) : null,
          soilMoistureVWC: data.Soil_Moisture_VWC !== undefined && data.Soil_Moisture_VWC !== null ? Number(data.Soil_Moisture_VWC) : null,
          soilTempC: data.Soil_Temp_C !== undefined && data.Soil_Temp_C !== null ? Number(data.Soil_Temp_C) : null,
        });
        setFirebaseLoading(false);
      },
      (error) => {
        console.error("Firebase Realtime Database error:", error);
        setFirebaseError(error.message || "Unable to connect to Firebase");
        setFirebaseLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedDevice]);

  const liveReady =
    liveReadings.soilPH !== null &&
    liveReadings.soilMoistureVWC !== null &&
    liveReadings.soilTempC !== null;

  // Advisory state
  const [advisoryMode, setAdvisoryMode] = useState("realtime");
  const [manualInput, setManualInput] = useState({ soilPH: 5.5, soilMoistureVWC: 45, soilTempC: 28 });
  const [advisoryData, setAdvisoryData] = useState(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryError, setAdvisoryError] = useState("");

  const fetchAdvisory = async (mode) => {
    setAdvisoryLoading(true);
    setAdvisoryError("");

    const payload = mode === "realtime"
      ? {
          Soil_pH: liveReadings.soilPH,
          Soil_Moisture_VWC: liveReadings.soilMoistureVWC,
          Soil_Temp_C: liveReadings.soilTempC,
        }
      : {
          Soil_pH: manualInput.soilPH,
          Soil_Moisture_VWC: manualInput.soilMoistureVWC,
          Soil_Temp_C: manualInput.soilTempC,
        };

    try {
      const res = await fetch(`${API_BASE_URL}/advisory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setAdvisoryData(data.advisory);
    } catch (err) {
      console.error(err);
      setAdvisoryError("Backend unreachable. Ensure FastAPI is running on :8000.");
    } finally {
      setAdvisoryLoading(false);
    }
  };

  // Auto-fetch once live data is ready, if in realtime mode
  useEffect(() => {
    if (advisoryMode === "realtime" && liveReady && !advisoryData && !advisoryLoading) {
      fetchAdvisory("realtime");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveReady]);

  const inputStyle = (disabled) => ({
    width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 15,
    border: `2px solid ${disabled ? t.divider : t.inputBorder}`,
    outline: "none", background: disabled ? t.divider + "22" : t.inputBg,
    color: t.textPrimary, fontWeight: 700, fontFamily: "'Playfair Display',serif",
    boxSizing: "border-box", transition: "all 0.2s",
  });

  const currentRisk = advisoryData?.input_conditions?.risk_level || "low";
  const riskCfg = RISK_CONFIG[currentRisk] || RISK_CONFIG.low;
  const riskBg = t.__isDark ? riskCfg.bgDark : riskCfg.bg;
  const riskBorder = t.__isDark ? riskCfg.borderDark : riskCfg.border;

  // ── Device loading / empty states (mirrors other dashboard pages) ─────────
  if (devicesLoading) {
    return (
      <div className="fade-up" style={{
        textAlign: "center", padding: "64px 24px", background: t.cardBg,
        borderRadius: 24, border: `1.5px solid ${t.cardBorder}`, boxShadow: t.cardShadow,
      }}>
        <div style={{
          width: 44, height: 44, border: `3.5px solid ${t.divider}`,
          borderTop: "3.5px solid #10b981", borderRadius: "50%",
          animation: "spin 0.8s linear infinite", margin: "0 auto 20px",
        }} />
        <p style={{ fontSize: 15, color: t.textSecondary, fontWeight: 700 }}>Loading devices...</p>
      </div>
    );
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="fade-up" style={{
        textAlign: "center", padding: "80px 24px", background: t.cardBg,
        borderRadius: 24, border: `2px dashed ${t.dashedBorder}`,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24, background: t.emptyIconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, margin: "0 auto 20px", border: `2px dashed ${t.blueChipBorder}`,
        }}>🛡️</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: t.textPrimary, marginBottom: 10 }}>
          No devices to advise on yet
        </div>
        <p style={{ fontSize: 15, color: t.textSecondary, fontWeight: 500 }}>
          Register a device to start generating advisory reports
        </p>
      </div>
    );
  }

  return (
    <div className="fade-up">

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{
            fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900,
            color: t.textPrimary, marginBottom: 6, letterSpacing: "-0.02em",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{
              width: 44, height: 44, borderRadius: 14,
              background: t.__isDark ? "linear-gradient(135deg, #0f2718, #133420)" : "linear-gradient(135deg, #dcfce7, #bbf7d0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, border: "1.5px solid #86efac60",
            }}>🛡️</span>
            Disease Advisory
          </h1>
          <p style={{ fontSize: 14, color: t.textSecondary, fontWeight: 500, marginLeft: 56 }}>
            AI-powered RAG advisory for White Root Rot management
          </p>
        </div>
      </div>

      {/* ── Device Selector (drives the real-time reading) ── */}
      {devices.length > 1 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          padding: "14px 20px", background: t.cardBg, borderRadius: 18,
          border: `1.5px solid ${t.cardBorder}`, boxShadow: t.cardShadow, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Device:
          </span>
          {devices.map(d => {
            const active = selectedDevice?.firestoreId === d.firestoreId;
            return (
              <button key={d.firestoreId} onClick={() => setSelectedId(d.firestoreId)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
                borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: "pointer",
                border: `1.5px solid ${active ? "#10b981" : t.inputBorder}`,
                background: active
                  ? (t.__isDark ? "linear-gradient(135deg, #0f2718, #0c2015)" : "linear-gradient(135deg, #dcfce7, #f0fdf4)")
                  : t.inputBg,
                color: active ? (t.__isDark ? "#4ade80" : "#15803d") : t.textSecondary,
                transition: "all 0.2s",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.status === "online" ? "#22c55e" : "#ef4444" }} />
                {d.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ══ INPUT CARD ══ */}
      <div style={{
        background: t.cardBg,
        borderRadius: 24, padding: 28,
        border: `1.5px solid ${t.cardBorder}`,
        boxShadow: t.cardShadow,
        marginBottom: 28, position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40, width: 120, height: 120,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)",
        }} />

        {/* Mode Toggle */}
        <div style={{
          display: "flex", gap: 10, marginBottom: 24,
          padding: 6, background: t.inputBg, borderRadius: 14,
          width: "fit-content", position: "relative", zIndex: 1,
        }}>
          {[
            { id: "realtime", label: "📡 Real-time Sensor" },
            { id: "manual", label: "✏️ Manual Input" },
          ].map(m => (
            <button key={m.id} onClick={() => setAdvisoryMode(m.id)}
              style={{
                padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 800,
                cursor: "pointer", border: "none",
                background: advisoryMode === m.id
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "transparent",
                color: advisoryMode === m.id ? "white" : t.textSecondary,
                boxShadow: advisoryMode === m.id
                  ? "0 4px 16px rgba(16, 185, 129, 0.3)" : "none",
                transition: "all 0.25s",
              }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Firebase connection status (real-time mode only) */}
        {advisoryMode === "realtime" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
            padding: "10px 16px", borderRadius: 12, position: "relative", zIndex: 1,
            background: firebaseError
              ? (t.__isDark ? "#2a1414" : "#fef2f2")
              : firebaseLoading
              ? (t.__isDark ? "#2a2410" : "#fffbeb")
              : (t.__isDark ? "#0f2718" : "#f0fdf4"),
            border: `1px solid ${firebaseError ? "#ef444440" : firebaseLoading ? "#eab30840" : "#22c55e40"}`,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: firebaseError ? "#ef4444" : firebaseLoading ? "#eab308" : "#22c55e",
              boxShadow: !firebaseError && !firebaseLoading ? "0 0 8px #22c55e" : "none",
            }} />
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: firebaseError ? "#ef4444" : firebaseLoading ? "#ca8a04" : "#16a34a",
            }}>
              {firebaseError ? "Firebase connection error" : firebaseLoading ? "Connecting to Firebase..." : `LIVE • ${selectedDevice?.name || "sensor"}`}
            </span>
          </div>
        )}

        {/* Input Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, position: "relative", zIndex: 1 }}>
          {[
            { label: "Soil pH", key: "soilPH", icon: "🧪", min: 3, max: 9, step: 0.1, color: "#8b5cf6" },
            { label: "Soil Moisture", key: "soilMoistureVWC", icon: "💧", min: 0, max: 100, step: 1, color: "#3b82f6", unit: "%" },
            { label: "Soil Temperature", key: "soilTempC", icon: "🌡️", min: 10, max: 50, step: 0.5, color: "#ea580c", unit: "°C" },
          ].map(field => {
            const isRealtime = advisoryMode === "realtime";
            const rawVal = isRealtime ? liveReadings[field.key] : manualInput[field.key];
            const val = rawVal === null || rawVal === undefined ? "" : rawVal;
            return (
              <div key={field.key}>
                <label style={{
                  fontSize: 12, fontWeight: 800, color: t.textSecondary,
                  marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ fontSize: 16 }}>{field.icon}</span> {field.label}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min={field.min} max={field.max} step={field.step}
                    value={val}
                    placeholder={isRealtime ? "Waiting for data..." : undefined}
                    onChange={e => {
                      if (!isRealtime) {
                        setManualInput(p => ({ ...p, [field.key]: parseFloat(e.target.value) }));
                      }
                    }}
                    disabled={isRealtime}
                    style={inputStyle(isRealtime)}
                    onFocus={e => { if (!isRealtime) { e.currentTarget.style.borderColor = field.color; e.currentTarget.style.boxShadow = `0 0 0 4px ${field.color}15`; } }}
                    onBlur={e => { e.currentTarget.style.borderColor = isRealtime ? t.divider : t.inputBorder; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  {field.unit && (
                    <span style={{
                      position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                      fontSize: 13, color: t.textMuted, fontWeight: 700,
                    }}>{field.unit}</span>
                  )}
                </div>
                {isRealtime && liveReady && (
                  <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
                    Live from sensor
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Generate Button */}
        <button
          onClick={() => fetchAdvisory(advisoryMode)}
          disabled={advisoryLoading || (advisoryMode === "realtime" && !liveReady)}
          style={{
            marginTop: 24, width: "100%", padding: "16px", borderRadius: 16,
            border: "none",
            background: (advisoryLoading || (advisoryMode === "realtime" && !liveReady))
              ? t.divider
              : "linear-gradient(135deg, #10b981, #059669)",
            color: "white", fontSize: 15, fontWeight: 800,
            cursor: (advisoryLoading || (advisoryMode === "realtime" && !liveReady)) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: (advisoryLoading || (advisoryMode === "realtime" && !liveReady)) ? "none" : "0 8px 28px rgba(16, 185, 129, 0.35)",
            transition: "all 0.25s",
          }}
        >
          {advisoryLoading ? (
            <><div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTop: "2.5px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Generating Advisory...</>
          ) : advisoryMode === "realtime" && !liveReady ? (
            <>⏳ Waiting for live sensor data...</>
          ) : (
            <><span style={{ fontSize: 20 }}>🛡️</span> Generate Advisory Report</>
          )}
        </button>

        {advisoryError && (
          <div style={{
            marginTop: 16, padding: "12px 16px", borderRadius: 12,
            background: t.__isDark ? "#2a1414" : "#fef2f2", border: "1.5px solid #fecaca60",
            color: t.__isDark ? "#fca5a5" : "#dc2626", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>⚠️</span> {advisoryError}
          </div>
        )}
      </div>

      {/* ══ ADVISORY RESULTS ══ */}
      {advisoryData && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Risk Header */}
          <div style={{
            background: t.cardBg,
            borderRadius: 24, padding: 32,
            border: `2px solid ${riskBorder}`,
            boxShadow: t.cardShadow,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -50, right: -50, width: 180, height: 180,
              borderRadius: "50%", background: `radial-gradient(circle, ${riskCfg.color}10, transparent 70%)`,
            }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, position: "relative", zIndex: 1 }}>
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em",
                  color: riskCfg.color, marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: riskCfg.color, boxShadow: `0 0 12px ${riskCfg.color}60` }} />
                  Advisory Report
                </div>
                <div style={{
                  fontFamily: "'Playfair Display',serif", fontSize: 42, fontWeight: 900,
                  color: riskCfg.color, letterSpacing: "-0.02em", lineHeight: 1.1,
                }}>
                  {riskCfg.label}
                </div>
                <div style={{ fontSize: 15, color: t.textSecondary, fontWeight: 600, marginTop: 8, maxWidth: 500, lineHeight: 1.6 }}>
                  {currentRisk === "critical" ? "URGENT: Critical conditions for White Root Rot detected. Immediate intervention is required to prevent tree loss."
                    : currentRisk === "high" ? "Favorable conditions for White Root Rot have been detected. Preventive measures should be taken immediately."
                    : currentRisk === "moderate" ? "Early warning signs detected. Take preventive action before conditions worsen."
                    : "Soil conditions are favorable. Continue routine monitoring and maintenance practices."}
                </div>
              </div>
              <div style={{
                background: riskBg, border: `2px solid ${riskBorder}`,
                borderRadius: 20, padding: "24px 32px", textAlign: "center", minWidth: 160,
              }}>
                <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  Confidence
                </div>
                <div style={{
                  fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 900, color: riskCfg.color,
                }}>
                  {(advisoryData.input_conditions.model_confidence * 100).toFixed(0)}%
                </div>
                <div style={{ width: "100%", height: 6, background: t.divider, borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
                  <div style={{
                    width: `${advisoryData.input_conditions.model_confidence * 100}%`,
                    height: "100%", background: riskCfg.gradient, borderRadius: 99,
                    transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
                  }} />
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
              marginTop: 28, paddingTop: 28, borderTop: `1.5px solid ${t.divider}`,
            }}>
              <ConditionCard
                icon="🧪" label="Soil pH"
                value={advisoryData.input_conditions.soil_pH}
                color="#8b5cf6" optimal="5.5 – 6.5" t={t}
              />
              <ConditionCard
                icon="💧" label="Moisture"
                value={`${advisoryData.input_conditions.soil_moisture_percent}%`}
                color="#3b82f6" optimal="< 60%" t={t}
              />
              <ConditionCard
                icon="🌡️" label="Temperature"
                value={`${advisoryData.input_conditions.temperature_c}°C`}
                color="#ea580c" optimal="20 – 30°C" t={t}
              />
            </div>
          </div>

          {/* Two Column: Actions + Prevention */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Immediate Actions */}
            <div style={{
              background: t.cardBg,
              borderRadius: 24, padding: 28,
              border: `1.5px solid ${t.cardBorder}`,
              boxShadow: t.cardShadow,
            }}>
              <div style={{
                fontSize: 14, fontWeight: 800, color: t.textPrimary, marginBottom: 20,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: t.__isDark ? "linear-gradient(135deg, #2a1414, #241010)" : "linear-gradient(135deg, #fef2f2, #fecaca)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, border: "1.5px solid #fca5a540",
                }}>⚡</span>
                Immediate Actions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {advisoryData.immediate_actions.map((action, i) => (
                  <ActionCard
                    key={i}
                    text={action}
                    isCritical={action.toLowerCase().includes("critical") || action.toLowerCase().includes("stop") || action.toLowerCase().includes("urgent")}
                    t={t}
                  />
                ))}
              </div>
            </div>

            {/* Preventive Measures */}
            <div style={{
              background: t.cardBg,
              borderRadius: 24, padding: 28,
              border: `1.5px solid ${t.cardBorder}`,
              boxShadow: t.cardShadow,
            }}>
              <div style={{
                fontSize: 14, fontWeight: 800, color: t.textPrimary, marginBottom: 20,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: t.__isDark ? "linear-gradient(135deg, #0f2718, #133420)" : "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, border: "1.5px solid #86efac40",
                }}>🌱</span>
                Preventive Measures
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {advisoryData.preventive_measures.map((measure, i) => (
                  <div key={i} style={{
                    padding: "12px 16px", borderRadius: 12,
                    background: t.inputBg, border: `1.5px solid ${t.inputBorder}`,
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <span style={{ fontSize: 14, color: "#10b981", flexShrink: 0, marginTop: 2 }}>•</span>
                    <span style={{ fontSize: 13, color: t.textSecondary, fontWeight: 600, lineHeight: 1.6 }}>{measure}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monitoring + Disclaimer */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
            <div style={{
              background: t.__isDark ? "linear-gradient(135deg, #0c1a2e, #0f2138)" : "linear-gradient(135deg, #eff6ff, #dbeafe)",
              borderRadius: 24, padding: 28,
              border: "1.5px solid #bfdbfe60",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -30, right: -30, width: 100, height: 100,
                borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.1), transparent 70%)",
              }} />
              <div style={{ fontSize: 14, fontWeight: 800, color: t.__isDark ? "#93c5fd" : "#1e40af", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: t.__isDark ? "rgba(59,130,246,0.15)" : "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, border: "1.5px solid #93c5fd40",
                }}>📅</span>
                Monitoring Plan
              </div>
              <p style={{ fontSize: 15, color: t.__isDark ? "#bfdbfe" : "#1e3a8a", fontWeight: 700, lineHeight: 1.7, position: "relative", zIndex: 1 }}>
                {advisoryData.monitoring_plan}
              </p>
            </div>

            <div style={{
              background: t.cardBg,
              borderRadius: 24, padding: 28,
              border: `1.5px solid ${t.cardBorder}`,
              boxShadow: t.cardShadow,
              display: "flex", flexDirection: "column", justifyContent: "center",
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.textPrimary, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: t.__isDark ? "linear-gradient(135deg, #2a2410, #241f0c)" : "linear-gradient(135deg, #fefce8, #fef9c3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, border: "1.5px solid #fde04740",
                }}>📋</span>
                Disclaimer
              </div>
              <p style={{ fontSize: 13, color: t.textSecondary, fontWeight: 600, lineHeight: 1.7 }}>
                {advisoryData.disclaimer}
              </p>
            </div>
          </div>

          {/* KB Passages */}
          <details style={{
            background: t.cardBg,
            borderRadius: 24, padding: 28,
            border: `1.5px solid ${t.cardBorder}`,
            boxShadow: t.cardShadow,
          }}>
            <summary style={{
              fontSize: 14, fontWeight: 800, color: t.textPrimary,
              display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer", listStyle: "none",
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: 12,
                background: t.__isDark ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, border: "1.5px solid #d1d5db40",
              }}>📚</span>
              Retrieved Knowledge Base Passages
              <span style={{
                marginLeft: "auto", fontSize: 11, color: t.textMuted,
                background: t.inputBg, padding: "4px 12px", borderRadius: 99, fontWeight: 700,
              }}>
                {advisoryData.retrieved_passages.length} passages
              </span>
            </summary>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {advisoryData.retrieved_passages.map((passage, i) => (
                <div key={i} style={{
                  padding: "18px 20px", borderRadius: 16,
                  background: t.inputBg, border: `1.5px solid ${t.inputBorder}`,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 800, color: "#10b981",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                    Passage {i + 1}
                  </div>
                  <p style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.8, fontWeight: 500 }}>
                    {passage}
                  </p>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 16, paddingTop: 16, borderTop: `1.5px solid ${t.divider}`,
              fontSize: 12, color: t.textMuted, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>📄</span> Sources: {advisoryData.sources.join(", ")}
            </div>
          </details>

        </div>
      )}
    </div>
  );
}