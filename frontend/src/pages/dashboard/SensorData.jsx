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


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="fade-up">

      {/* ====================================================
          DEVICE SELECTOR
      ===================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
          padding: "16px 20px",
          background: t.cardBg,
          borderRadius: 18,
          border: `1.5px solid ${t.cardBorder}`,
          boxShadow: t.cardShadow,
          flexWrap: "wrap",
        }}
      >

        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: t.textSecondary,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginRight: 4,
          }}
        >
          Device:
        </span>


        {devices.map((d) => {

          const active =
            selectedDevice?.firestoreId ===
            d.firestoreId;


          return (
            <button
              key={d.firestoreId}
              onClick={() =>
                setSelectedId(
                  d.firestoreId
                )
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",

                border:
                  `1.5px solid ${
                    active
                      ? "#10b981"
                      : t.inputBorder
                  }`,

                background: active
                  ? (
                      t.__isDark
                        ? "linear-gradient(135deg, #0f2718, #0c2015)"
                        : "linear-gradient(135deg, #dcfce7, #f0fdf4)"
                    )
                  : t.inputBg,

                color: active
                  ? (
                      t.__isDark
                        ? "#4ade80"
                        : "#15803d"
                    )
                  : t.textSecondary,

                transition:
                  "all 0.2s",
              }}
            >

              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background:
                    d.status === "online"
                      ? "#22c55e"
                      : "#ef4444",
                }}
              />

              {d.name}

            </button>
          );
        })}

      </div>


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