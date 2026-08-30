import { useEffect, useMemo, useState } from "react";
import {
  useOutletContext,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { ref, onValue } from "firebase/database";

import { useDashboard } from "./DashboardContext";
import { SensorCard } from "./DashboardComponents";
import { rtdb } from "../../firebase";
import { addPredictionRecord } from "./predictionHistoryStore";

// ============================================================
// API CONFIG
// ============================================================
const PREDICT_API_URL = "https://wrr-backend.thankfultree-9347156a.southeastasia.azurecontainerapps.io/predict";

// ============================================================
// RISK STYLES
// ============================================================
const RISK_STYLES = {
  Low: {
    color: "#16a34a",
    bg: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
    bgDark: "linear-gradient(135deg, #0f2718, #0c2015)",
    border: "#16a34a40",
    dot: "#22c55e",
  },
  Medium: {
    color: "#ca8a04",
    bg: "linear-gradient(135deg, #fef9c3, #fffbeb)",
    bgDark: "linear-gradient(135deg, #2a2410, #241f0c)",
    border: "#ca8a0440",
    dot: "#eab308",
  },
  High: {
    color: "#dc2626",
    bg: "linear-gradient(135deg, #fee2e2, #fef2f2)",
    bgDark: "linear-gradient(135deg, #2a1414, #241010)",
    border: "#dc262640",
    dot: "#ef4444",
  },
};

function getRiskStyle(level) {
  if (!level) return RISK_STYLES.Medium;
  const key = Object.keys(RISK_STYLES).find((k) =>
    level.toLowerCase().includes(k.toLowerCase())
  );
  return RISK_STYLES[key] || RISK_STYLES.Medium;
}

// ============================================================
// SPARKLINE DATA
// ============================================================

function makeSpark(base) {
  if (base === null || base === undefined || Number.isNaN(Number(base))) {
    return [];
  }

  const value = Number(base);

  return [
    Number((value * 0.96).toFixed(2)),
    Number((value * 0.98).toFixed(2)),
    Number((value * 0.97).toFixed(2)),
    Number(value.toFixed(2)),
    Number((value * 1.02).toFixed(2)),
    Number((value * 0.99).toFixed(2)),
    Number(value.toFixed(2)),
  ];
}

// ============================================================
// MANUAL INPUT ROW
// ============================================================
function ManualField({ label, icon, value, onChange, min, max, step, unit, t }) {
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <label
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: t.textSecondary,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>{icon}</span> {label}
        </label>
        <span style={{ fontSize: 13, fontWeight: 900, color: t.textPrimary }}>
          {value}
          <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 700 }}>
            {" "}
            {unit}
          </span>
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#10b981", marginBottom: 6 }}
      />

      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          padding: "9px 11px",
          borderRadius: 10,
          border: `1.5px solid ${t.inputBorder}`,
          background: t.inputBg,
          color: t.textPrimary,
          fontSize: 13,
          fontWeight: 700,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SensorData() {
  const { t } = useOutletContext();

  const nav = useNavigate();
  const location = useLocation();

  const {
    devices,
    devicesLoading,
  } = useDashboard();


  // ==========================================================
  // SELECTED DEVICE
  // ==========================================================

  const [selectedId, setSelectedId] = useState(
    location.state?.device?.firestoreId || null
  );


  const selectedDevice = useMemo(() => {
    if (selectedId) {
      return (
        devices.find(
          (d) => d.firestoreId === selectedId
        ) || devices[0]
      );
    }

    return devices[0];
  }, [selectedId, devices]);


  // ==========================================================
  // REALTIME FIREBASE DATA
  // ==========================================================

  const [readings, setReadings] = useState({
    soilPH: null,
    soilMoistureVWC: null,
    soilTempC: null,
  });


  const [firebaseLoading, setFirebaseLoading] =
    useState(true);

  const [firebaseError, setFirebaseError] =
    useState(null);


  // ==========================================================
  // AI RISK PREDICTION STATE
  // ==========================================================

  const [predictMode, setPredictMode] = useState("live"); // "live" | "manual"

  const [manualPh, setManualPh] = useState(6.0);
  const [manualMoisture, setManualMoisture] = useState(30);
  const [manualTemp, setManualTemp] = useState(26);

  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState(null);
  const [predResult, setPredResult] = useState(null);

  const liveValuesReady =
    readings.soilPH !== null &&
    readings.soilMoistureVWC !== null &&
    readings.soilTempC !== null;

  async function handlePredict() {
    setPredLoading(true);
    setPredError(null);
    setPredResult(null);

    const payload =
      predictMode === "live"
        ? {
            Soil_pH: readings.soilPH,
            Soil_Moisture_VWC: readings.soilMoistureVWC,
            Soil_Temp_C: readings.soilTempC,
          }
        : {
            Soil_pH: manualPh,
            Soil_Moisture_VWC: manualMoisture,
            Soil_Temp_C: manualTemp,
          };

    try {
      const res = await fetch(PREDICT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
      }

      const data = await res.json();

      const normalized = {
        level: data.White_Root_Disease_Risk,
        confidence: data.confidence,
        probabilities: data.probabilities,
      };

      setPredResult(normalized);

      addPredictionRecord({
        device: selectedDevice?.name || "Unknown device",
        mode: predictMode,
        soilPH: payload.Soil_pH,
        soilMoistureVWC: payload.Soil_Moisture_VWC,
        soilTempC: payload.Soil_Temp_C,
        level: normalized.level,
        confidence: normalized.confidence,
        probabilities: normalized.probabilities,
      });
    } catch (e) {
      setPredError(e.message || "Unable to reach prediction service");
    } finally {
      setPredLoading(false);
    }
  }

  // Reset prediction result when switching device or mode
  useEffect(() => {
    setPredResult(null);
    setPredError(null);
  }, [selectedDevice, predictMode]);


  // ==========================================================
  // FIREBASE REALTIME DATABASE LISTENER
  // ==========================================================

  useEffect(() => {
    if (!selectedDevice) {
      return;
    }

    setFirebaseLoading(true);
    setFirebaseError(null);

    /*
     * IMPORTANT
     *
     * Firestore:
     *
     * deviceId = "device001"
     *
     * Firebase Realtime Database:
     *
     * devices
     *   └── device001
     *       └── sensorData
     *           ├── Soil_Moisture_VWC
     *           ├── Soil_Temp_C
     *           ├── Soil_pH
     *           └── timestamp
     *
     * Therefore we MUST use:
     *
     * /devices/device001/sensorData
     *
     * We intentionally DO NOT use selectedDevice.rtdbPath
     * because your current Firestore rtdbPath contains:
     *
     * /devices/DEV-005/sensorData
     */

    const deviceId = selectedDevice.deviceId;

    const firebasePath =
      `/devices/${deviceId}/sensorData`;


    console.log("========================================");
    console.log("FIREBASE REALTIME DATABASE");
    console.log("========================================");
    console.log("Selected device:", selectedDevice);
    console.log("Device ID:", deviceId);
    console.log("Firebase path:", firebasePath);
    console.log("========================================");


    // Create Firebase reference
    const sensorRef = ref(
      rtdb,
      firebasePath
    );


    // Listen for realtime changes
    const unsubscribe = onValue(
      sensorRef,

      (snapshot) => {
        const data = snapshot.val();

        console.log(
          "Firebase sensor data:",
          data
        );


        // No data found
        if (!data) {
          console.warn(
            "No sensor data found at:",
            firebasePath
          );

          setReadings({
            soilPH: null,
            soilMoistureVWC: null,
            soilTempC: null,
          });

          setFirebaseLoading(false);

          return;
        }


        // ====================================================
        // READ FIREBASE VALUES
        // ====================================================

        const soilPH =
          data.Soil_pH !== undefined &&
          data.Soil_pH !== null
            ? Number(data.Soil_pH)
            : null;


        const soilMoistureVWC =
          data.Soil_Moisture_VWC !== undefined &&
          data.Soil_Moisture_VWC !== null
            ? Number(data.Soil_Moisture_VWC)
            : null;


        const soilTempC =
          data.Soil_Temp_C !== undefined &&
          data.Soil_Temp_C !== null
            ? Number(data.Soil_Temp_C)
            : null;


        // ====================================================
        // UPDATE REACT STATE
        // ====================================================

        setReadings({
          soilPH,
          soilMoistureVWC,
          soilTempC,
        });


        setFirebaseLoading(false);
      },


      // ======================================================
      // FIREBASE ERROR
      // ======================================================

      (error) => {
        console.error(
          "Firebase Realtime Database error:",
          error
        );

        setFirebaseError(
          error.message ||
            "Unable to connect to Firebase"
        );

        setFirebaseLoading(false);
      }
    );


    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      console.log(
        "Removing Firebase listener:",
        firebasePath
      );

      unsubscribe();
    };

  }, [selectedDevice]);


  // ==========================================================
  // DEVICE LOADING
  // ==========================================================

  if (devicesLoading) {
    return (
      <div
        className="fade-up"
        style={{
          textAlign: "center",
          padding: "64px 24px",
          background: t.cardBg,
          borderRadius: 24,
          border: `1.5px solid ${t.cardBorder}`,
          boxShadow: t.cardShadow,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            border: `3.5px solid ${t.divider}`,
            borderTop: "3.5px solid #10b981",
            borderRadius: "50%",
            animation:
              "spin 0.8s linear infinite",
            margin: "0 auto 20px",
          }}
        />

        <p
          style={{
            fontSize: 15,
            color: t.textSecondary,
            fontWeight: 700,
          }}
        >
          Loading devices...
        </p>
      </div>
    );
  }


  // ==========================================================
  // NO DEVICES
  // ==========================================================

  if (!devices || devices.length === 0) {
    return (
      <div
        className="fade-up"
        style={{
          textAlign: "center",
          padding: "80px 24px",
          background: t.cardBg,
          borderRadius: 24,
          border: `2px dashed ${t.dashedBorder}`,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: t.emptyIconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            margin: "0 auto 20px",
            border: `2px dashed ${t.blueChipBorder}`,
          }}
        >
          📊
        </div>

        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: t.textPrimary,
            marginBottom: 10,
          }}
        >
          No sensor data yet
        </div>

        <p
          style={{
            fontSize: 15,
            color: t.textSecondary,
            marginBottom: 28,
            fontWeight: 500,
          }}
        >
          Register a device to start seeing
          live readings here
        </p>

        <button
          onClick={() =>
            nav("/dashboard/devices")
          }
          style={{
            background:
              "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            border: "none",
            padding: "14px 32px",
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow:
              "0 8px 24px rgba(16, 185, 129, 0.35)",
          }}
        >
          Go to Devices
        </button>
      </div>
    );
  }


  // ==========================================================
  // SENSOR CARDS
  // ==========================================================

  const CARDS = [
    {
      key: "soilPH",
      icon: "🧪",
      label: "Soil pH",
      unit: "",
      color: "#8b5cf6",
    },

    {
      key: "soilMoistureVWC",
      icon: "💧",
      label: "Soil Moisture",
      unit: "% VWC",
      color: "#3b82f6",
    },

    {
      key: "soilTempC",
      icon: "🌡️",
      label: "Soil Temperature",
      unit: "°C",
      color: "#ea580c",
    },
  ];


  // ==========================================================
  // FIREBASE PATH
  // ==========================================================

  const firebasePath =
    `/devices/${selectedDevice.deviceId}/sensorData`;

  const predictDisabled =
    predLoading || (predictMode === "live" && !liveValuesReady);

  const riskStyle = predResult ? getRiskStyle(predResult.level) : null;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="fade-up">

      

    


      {/* ====================================================
          SELECTED DEVICE HEADER
      ===================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          padding: "18px 24px",
          background: t.cardBg,
          borderRadius: 18,
          border:
            `1.5px solid ${t.cardBorder}`,
          boxShadow: t.cardShadow,
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >

          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,

              background:
                selectedDevice.status ===
                "online"

                  ? (
                      t.__isDark
                        ? "linear-gradient(135deg, #0f2718, #133420)"
                        : "linear-gradient(135deg, #dcfce7, #bbf7d0)"
                    )

                  : (
                      t.__isDark
                        ? "linear-gradient(135deg, #2a1414, #331a1a)"
                        : "linear-gradient(135deg, #fef2f2, #fecaca)"
                    ),

              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,

              border:
                `1.5px solid ${
                  selectedDevice.status ===
                  "online"
                    ? "#16a34a40"
                    : "#dc262640"
                }`,
            }}
          >
            📡
          </div>


          <div>

            <div
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: t.textPrimary,
              }}
            >
              {selectedDevice.name}
            </div>


            <div
              style={{
                fontSize: 13,
                color: t.textSecondary,
                fontWeight: 500,
              }}
            >
              📍 {selectedDevice.location}
              {" · "}
              {selectedDevice.lastSeen}
            </div>

          </div>

        </div>


        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            padding: "5px 14px",
            borderRadius: 99,

            background:
              selectedDevice.status ===
              "online"

                ? (
                    t.__isDark
                      ? "#0f2718"
                      : "#dcfce7"
                  )

                : (
                    t.__isDark
                      ? "#2a1414"
                      : "#fef2f2"
                  ),

            color:
              selectedDevice.status ===
              "online"

                ? (
                    t.__isDark
                      ? "#4ade80"
                      : "#15803d"
                  )

                : (
                    t.__isDark
                      ? "#f87171"
                      : "#b91c1c"
                  ),

            border:
              `1.5px solid ${
                selectedDevice.status ===
                "online"
                  ? "#16a34a40"
                  : "#dc262640"
              }`,

            textTransform:
              "uppercase",

            letterSpacing:
              "0.1em",
          }}
        >
          {selectedDevice.status}
        </span>

      </div>


      {/* ====================================================
          FIREBASE CONNECTION STATUS
      ===================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
          padding: "11px 16px",
          borderRadius: 12,

          background:
            firebaseError

              ? (
                  t.__isDark
                    ? "#2a1414"
                    : "#fef2f2"
                )

              : firebaseLoading

              ? (
                  t.__isDark
                    ? "#2a2410"
                    : "#fffbeb"
                )

              : (
                  t.__isDark
                    ? "#0f2718"
                    : "#f0fdf4"
                ),

          border:
            `1px solid ${
              firebaseError
                ? "#ef444440"
                : firebaseLoading
                ? "#eab30840"
                : "#22c55e40"
            }`,
        }}
      >

        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",

            background:
              firebaseError
                ? "#ef4444"
                : firebaseLoading
                ? "#eab308"
                : "#22c55e",

            boxShadow:
              !firebaseError &&
              !firebaseLoading
                ? "0 0 8px #22c55e"
                : "none",
          }}
        />


        <span
          style={{
            fontSize: 12,
            fontWeight: 700,

            color:
              firebaseError
                ? "#ef4444"
                : firebaseLoading
                ? "#ca8a04"
                : "#16a34a",
          }}
        >

          {firebaseError
            ? "Firebase connection error"
            : firebaseLoading
            ? "Connecting to Firebase..."
            : "LIVE • Firebase Realtime Database"}

        </span>

      </div>


      {/* ====================================================
          FIREBASE ERROR
      ===================================================== */}

      {firebaseError && (
        <div
          style={{
            marginBottom: 18,
            padding: "14px 18px",
            borderRadius: 12,
            background:
              t.__isDark
                ? "#2a1414"
                : "#fef2f2",
            border:
              "1px solid #ef444440",
            color:
              t.__isDark
                ? "#fca5a5"
                : "#b91c1c",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {firebaseError}
        </div>
      )}


      {/* ====================================================
          SENSOR CARDS
      ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 18,
          marginBottom: 28,
        }}
      >

        {CARDS.map((card) => {

          const value =
            readings[card.key];


          const validValue =
            value !== null &&
            value !== undefined &&
            !Number.isNaN(Number(value));


          return (
            <SensorCard
              key={card.key}

              icon={card.icon}

              label={card.label}

              value={
                validValue
                  ? value
                  : "--"
              }

              unit={card.unit}

              sparkData={
                validValue
                  ? makeSpark(value)
                  : []
              }

              color={card.color}

              trend={0}

              t={t}
            />
          );

        })}

      </div>


      {/* ====================================================
          AI RISK PREDICTION PANEL
      ===================================================== */}

      <div
        style={{
          background: t.cardBg,
          borderRadius: 24,
          border: `1.5px solid ${t.cardBorder}`,
          boxShadow: t.cardShadow,
          padding: "26px 26px 28px",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* subtle background accent */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16,185,129,0.12), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 22,
            flexWrap: "wrap",
            gap: 14,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                boxShadow: "0 8px 20px rgba(16, 185, 129, 0.35)",
                flexShrink: 0,
              }}
            >
              🤖
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: t.textPrimary,
                }}
              >
                AI Risk Prediction
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: t.textSecondary,
                  fontWeight: 500,
                }}
              >
                White root rot risk assessment powered by your trained model
              </div>
            </div>
          </div>

          {/* MODE TOGGLE */}
          <div
            style={{
              display: "flex",
              padding: 4,
              borderRadius: 12,
              background: t.inputBg,
              border: `1.5px solid ${t.inputBorder}`,
            }}
          >
            {[
              { id: "live", label: "📡 Live Data" },
              { id: "manual", label: "✏️ Manual Input" },
            ].map((opt) => {
              const active = predictMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setPredictMode(opt.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 9,
                    border: "none",
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: "pointer",
                    background: active
                      ? "linear-gradient(135deg, #10b981, #059669)"
                      : "transparent",
                    color: active ? "white" : t.textSecondary,
                    boxShadow: active
                      ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                      : "none",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* LIVE MODE: read-only summary of current Firebase readings */}
        {predictMode === "live" && (
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 22,
              position: "relative",
            }}
          >
            {CARDS.map((card) => {
              const value = readings[card.key];
              const valid =
                value !== null &&
                value !== undefined &&
                !Number.isNaN(Number(value));

              return (
                <div
                  key={card.key}
                  style={{
                    flex: 1,
                    minWidth: 150,
                    padding: "14px 16px",
                    borderRadius: 14,
                    background: t.inputBg,
                    border: `1.5px solid ${t.inputBorder}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: t.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{card.icon}</span> {card.label}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: valid ? t.textPrimary : t.textMuted,
                    }}
                  >
                    {valid ? value : "--"}{" "}
                    <span
                      style={{
                        fontSize: 12,
                        color: t.textMuted,
                        fontWeight: 700,
                      }}
                    >
                      {card.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MANUAL MODE: editable inputs */}
        {predictMode === "manual" && (
          <div
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              marginBottom: 22,
              position: "relative",
            }}
          >
            <ManualField
              label="Soil pH"
              icon="🧪"
              value={manualPh}
              onChange={setManualPh}
              min={0}
              max={14}
              step={0.1}
              unit=""
              t={t}
            />
            <ManualField
              label="Soil Moisture"
              icon="💧"
              value={manualMoisture}
              onChange={setManualMoisture}
              min={0}
              max={100}
              step={0.5}
              unit="% VWC"
              t={t}
            />
            <ManualField
              label="Soil Temperature"
              icon="🌡️"
              value={manualTemp}
              onChange={setManualTemp}
              min={0}
              max={50}
              step={0.5}
              unit="°C"
              t={t}
            />
          </div>
        )}

        {predictMode === "live" && !liveValuesReady && (
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: t.textMuted,
              marginBottom: 18,
              position: "relative",
            }}
          >
            Waiting for live sensor readings before prediction is available.
            Switch to manual input to test values now.
          </div>
        )}

        {/* PREDICT BUTTON */}
        <button
          onClick={handlePredict}
          disabled={predictDisabled}
          style={{
            width: "100%",
            padding: "15px 24px",
            borderRadius: 14,
            border: "none",
            fontSize: 14.5,
            fontWeight: 800,
            color: "white",
            cursor: predictDisabled ? "not-allowed" : "pointer",
            opacity: predictDisabled ? 0.55 : 1,
            background: "linear-gradient(135deg, #10b981, #059669)",
            boxShadow: predictDisabled
              ? "none"
              : "0 10px 26px rgba(16, 185, 129, 0.35)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            position: "relative",
          }}
        >
          {predLoading ? (
            <>
              <span
                style={{
                  width: 16,
                  height: 16,
                  border: "2.5px solid rgba(255,255,255,0.4)",
                  borderTop: "2.5px solid white",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Analyzing...
            </>
          ) : (
            <>🔮 Predict Risk Level</>
          )}
        </button>

        {/* PREDICTION ERROR */}
        {predError && (
          <div
            style={{
              marginTop: 16,
              padding: "13px 16px",
              borderRadius: 12,
              background: t.__isDark ? "#2a1414" : "#fef2f2",
              border: "1px solid #ef444440",
              color: t.__isDark ? "#fca5a5" : "#b91c1c",
              fontSize: 12.5,
              fontWeight: 600,
              position: "relative",
            }}
          >
            {predError}
          </div>
        )}

        {/* PREDICTION RESULT */}
        {predResult && riskStyle && (
          <div
            className="fade-up"
            style={{
              marginTop: 22,
              borderRadius: 18,
              border: `1.5px solid ${riskStyle.border}`,
              background: t.__isDark ? riskStyle.bgDark : riskStyle.bg,
              padding: "22px 24px",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 18,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  background: t.__isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(255,255,255,0.6)",
                  border: `1.5px solid ${riskStyle.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  flexShrink: 0,
                }}
              >
                🤖
              </div>

              <div style={{ flex: 1, minWidth: 180 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: t.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 3,
                  }}
                >
                  Predicted Risk Level
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: riskStyle.color,
                  }}
                >
                  {predResult.level}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: t.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 3,
                  }}
                >
                  Confidence
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: t.textPrimary,
                  }}
                >
                  {predResult.confidence}%
                </div>
              </div>
            </div>

            {/* PROBABILITY BREAKDOWN */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: t.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 10,
                }}
              >
                Probability Breakdown
              </div>

              {Object.entries(predResult.probabilities)
                .sort((a, b) => b[1] - a[1])
                .map(([label, prob]) => {
                  const s = getRiskStyle(label);
                  return (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          fontWeight: 700,
                          color: t.textSecondary,
                          marginBottom: 4,
                        }}
                      >
                        <span>{label}</span>
                        <span>{Math.round(prob * 100)}%</span>
                      </div>
                      <div
                        style={{
                          height: 7,
                          borderRadius: 99,
                          background: t.__isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.06)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${prob * 100}%`,
                            height: "100%",
                            borderRadius: 99,
                            background: s.color,
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>


      {/* ====================================================
          FIREBASE SOURCE
      ===================================================== */}

      <div
        style={{
          marginTop: 24,
          padding: "14px 18px",
          borderRadius: 14,
          background: t.cardBg,
          border:
            `1px solid ${t.cardBorder}`,
        }}
      >

        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: t.textMuted,
            textTransform:
              "uppercase",
            letterSpacing:
              "0.08em",
            marginBottom: 6,
          }}
        >
          Live Firebase Source
        </div>


        <code
          style={{
            fontSize: 12,
            color: t.textSecondary,
            wordBreak: "break-all",
          }}
        >
          {firebasePath}
        </code>

      </div>


      {/* ====================================================
          LAST FIREBASE DATA
      ===================================================== */}

      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: t.textMuted,
        }}
      >
        Values are streamed directly from Firebase
        Realtime Database and update automatically
        when the sensor data changes.
      </div>

    </div>
  );
}
