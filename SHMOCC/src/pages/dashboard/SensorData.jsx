import { useEffect, useState } from "react";

import useSensorData from "../../hooks/useSensorData";
import useDevices from "../../hooks/useDevices";

import { predictDiseaseRisk } from "../../services/predictionApi";
import { addPredictionRecord } from "../../services/predictionHistory";

import "../../styles/sensorData.css";

export default function SensorData() {
  /*
   * =========================================================
   * DEVICES
   * =========================================================
   */

  const {
    devices = [],
    loading: devicesLoading,
    error: devicesError,
  } = useDevices();

  /*
   * =========================================================
   * SELECTED DEVICE
   * =========================================================
   */

  const [selectedDeviceId, setSelectedDeviceId] = useState(
    localStorage.getItem("selectedDeviceId") || ""
  );

  const [manualMode, setManualMode] = useState(false);

  /*
   * =========================================================
   * MANUAL INPUT
   * =========================================================
   */

  const [manualData, setManualData] = useState({
    soilPH: "",
    soilMoistureVWC: "",
    soilTempC: "",
    humidity: "",
    rainfall: "",
    windSpeed: "",
  });

  /*
   * =========================================================
   * PREDICTION STATE
   * =========================================================
   */

  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState("");

  /*
   * =========================================================
   * SELECT FIRST DEVICE
   * =========================================================
   */

  useEffect(() => {
    if (!selectedDeviceId && devices.length > 0) {
      const firstDevice = devices[0];

      setSelectedDeviceId(firstDevice.deviceId);

      localStorage.setItem(
        "selectedDeviceId",
        firstDevice.deviceId
      );
    }
  }, [devices, selectedDeviceId]);

  /*
   * =========================================================
   * CURRENT DEVICE
   * =========================================================
   */

  const selectedDevice =
    devices.find(
      (device) =>
        device.deviceId === selectedDeviceId
    ) || devices[0];

  const activeDeviceId =
    selectedDevice?.deviceId ||
    selectedDeviceId ||
    "";

  /*
   * =========================================================
   * REAL-TIME FIREBASE DATA
   *
   * This is only needed for LIVE mode.
   * Manual prediction does not depend on Firebase.
   * =========================================================
   */

  const {
    sensorData,
    loading: sensorLoading,
    error: sensorError,
  } = useSensorData(activeDeviceId);

  /*
   * =========================================================
   * NORMALIZE FIREBASE DATA
   * =========================================================
   */

  const liveData = {
    soilPH: Number(
      sensorData?.soilPH ??
        sensorData?.Soil_pH ??
        sensorData?.ph ??
        sensorData?.pH ??
        0
    ),

    soilMoistureVWC: Number(
      sensorData?.soilMoistureVWC ??
        sensorData?.Soil_Moisture_VWC ??
        sensorData?.soilMoisture ??
        sensorData?.moisture ??
        0
    ),

    soilTempC: Number(
      sensorData?.soilTempC ??
        sensorData?.Soil_Temp_C ??
        sensorData?.soilTemperature ??
        sensorData?.temperature ??
        0
    ),

    humidity: Number(
      sensorData?.humidity ??
        sensorData?.Humidity ??
        0
    ),

    rainfall: Number(
      sensorData?.rainfall ??
        sensorData?.Rainfall ??
        0
    ),

    windSpeed: Number(
      sensorData?.windSpeed ??
        sensorData?.Wind_Speed ??
        0
    ),
  };

  /*
   * =========================================================
   * CHECK LIVE VALUES
   * =========================================================
   */

  const liveValuesReady =
    Number.isFinite(liveData.soilPH) &&
    Number.isFinite(liveData.soilMoistureVWC) &&
    Number.isFinite(liveData.soilTempC) &&
    liveData.soilPH > 0;

  /*
   * =========================================================
   * MANUAL INPUT UPDATE
   * =========================================================
   */

  const updateManualData = (field, value) => {
    setManualData((previous) => ({
      ...previous,
      [field]: value,
    }));

    /*
     * Clear previous result when user changes
     * an input value.
     */
    setPrediction(null);
    setPredictionError("");
  };

  /*
   * =========================================================
   * COPY LIVE VALUES TO MANUAL INPUT
   * =========================================================
   */

  const useLiveValues = () => {
    if (!liveValuesReady) {
      setPredictionError(
        "Live sensor values are not available yet."
      );

      return;
    }

    setManualData({
      soilPH: liveData.soilPH,
      soilMoistureVWC: liveData.soilMoistureVWC,
      soilTempC: liveData.soilTempC,
      humidity: liveData.humidity,
      rainfall: liveData.rainfall,
      windSpeed: liveData.windSpeed,
    });

    setPrediction(null);
    setPredictionError("");
  };

  /*
   * =========================================================
   * FORMAT NUMBER
   * =========================================================
   */

  const formatNumber = (value, decimals = 1) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "0.0";
    }

    return number.toFixed(decimals);
  };

  /*
   * =========================================================
   * RISK CLASS
   * =========================================================
   */

  const getRiskClass = (risk) => {
    const value = String(risk || "")
      .toLowerCase();

    if (value.includes("critical")) {
      return "risk-critical";
    }

    if (value.includes("high")) {
      return "risk-high";
    }

    if (value.includes("medium")) {
      return "risk-medium";
    }

    return "risk-low";
  };

  /*
   * =========================================================
   * PREDICT DISEASE RISK
   * =========================================================
   */

  const handlePrediction = async () => {
    setPredictionError("");
    setPrediction(null);

    /*
     * Manual mode:
     * Use manually entered values.
     *
     * Live mode:
     * Use Firebase values.
     */
    const source = manualMode
      ? manualData
      : liveData;

    const ph = Number(source.soilPH);

    const moisture = Number(
      source.soilMoistureVWC
    );

    const temperature = Number(
      source.soilTempC
    );

    /*
     * =======================================================
     * VALIDATION
     * =======================================================
     */

    if (
      !Number.isFinite(ph) ||
      !Number.isFinite(moisture) ||
      !Number.isFinite(temperature)
    ) {
      setPredictionError(
        "Please enter valid soil pH, soil moisture and soil temperature values."
      );

      return;
    }

    if (ph < 0 || ph > 14) {
      setPredictionError(
        "Soil pH must be between 0 and 14."
      );

      return;
    }

    if (moisture < 0 || moisture > 100) {
      setPredictionError(
        "Soil moisture must be between 0% and 100%."
      );

      return;
    }

    /*
     * =======================================================
     * LIVE MODE CHECK
     * =======================================================
     */

    if (!manualMode && !activeDeviceId) {
      setPredictionError(
        "No device is connected. Switch to Manual Input to test soil conditions."
      );

      return;
    }

    if (!manualMode && sensorLoading) {
      setPredictionError(
        "Waiting for live Firebase sensor readings."
      );

      return;
    }

    try {
      setPredicting(true);

      /*
       * =====================================================
       * SEND TO FASTAPI
       *
       * These names MUST match the backend:
       *
       * Soil_pH
       * Soil_Moisture_VWC
       * Soil_Temp_C
       * =====================================================
       */

      const result = await predictDiseaseRisk({
        Soil_pH: ph,
        Soil_Moisture_VWC: moisture,
        Soil_Temp_C: temperature,
      });

      /*
       * IMPORTANT DEBUG INFORMATION
       *
       * This allows us to see exactly what Azure returned.
       */

      console.log(
        "========== DISEASE PREDICTION =========="
      );

      console.log(
        "Backend result:",
        result
      );

      console.log(
        "Prediction object:",
        result?.prediction
      );

      console.log(
        "Risk level:",
        result?.prediction?.risk_level
      );

      console.log(
        "Confidence:",
        result?.prediction?.confidence
      );

      console.log(
        "========================================="
      );

      /*
       * =====================================================
       * CHECK BACKEND RESPONSE
       * =====================================================
       */

      if (!result) {
        throw new Error(
          "The prediction service returned an empty response."
        );
      }

      if (
        !result.prediction &&
        !result.prediction?.risk_level
      ) {
        console.warn(
          "Unexpected prediction response:",
          result
        );
      }

      /*
       * =====================================================
       * SHOW RESULT IMMEDIATELY
       *
       * This happens BEFORE Firebase history saving.
       *
       * Therefore, if history saving fails, the risk result
       * will still appear on the page.
       * =====================================================
       */

      setPrediction(result);

      /*
       * =====================================================
       * READ PREDICTION DATA
       * =====================================================
       */

      const predictionData =
        result?.prediction || {};

      const advisory =
        result?.advisory || {};

      /*
       * =====================================================
       * RISK
       * =====================================================
       */

      const riskLevel =
        predictionData.risk_level ||
        predictionData.riskLevel ||
        "";

      /*
       * If backend did not return risk level,
       * show a clear error instead of silently showing Low.
       */

      if (!riskLevel) {
        console.warn(
          "Backend did not return prediction.risk_level.",
          result
        );
      }

      /*
       * =====================================================
       * CONFIDENCE
       * =====================================================
       */

      let confidence = Number(
        predictionData.confidence ?? 0
      );

      /*
       * Backend may return:
       *
       * 67
       *
       * OR:
       *
       * 0.67
       *
       * Normalize both to percentage.
       */

      if (
        confidence > 0 &&
        confidence <= 1
      ) {
        confidence *= 100;
      }

      confidence = Math.round(
        confidence
      );

      /*
       * =====================================================
       * SAVE TO PREDICTION HISTORY
       *
       * History failure must NOT hide the prediction result.
       * =====================================================
       */

      try {
        await addPredictionRecord({
          timestamp: Date.now(),

          device:
            selectedDevice?.name ||
            selectedDevice?.deviceId ||
            "Manual Prediction",

          deviceId:
            selectedDevice?.deviceId ||
            "manual",

          mode:
            manualMode
              ? "Manual"
              : "Live",

          soilPH: ph,

          soilMoistureVWC:
            moisture,

          soilTempC:
            temperature,

          humidity:
            Number(source.humidity) || 0,

          rainfall:
            Number(source.rainfall) || 0,

          windSpeed:
            Number(source.windSpeed) || 0,

          riskLevel:
            riskLevel || "Unknown",

          confidence,

          probabilities:
            predictionData.probabilities ||
            {},

          advisory: {
            report:
              advisory.report || "",

            immediate_actions:
              advisory.immediate_actions ||
              [],

            preventive_measures:
              advisory.preventive_measures ||
              [],

            monitoring_plan:
              advisory.monitoring_plan ||
              "",

            sources:
              advisory.sources ||
              [],
          },
        });

        console.log(
          "Prediction saved to history."
        );
      } catch (historyError) {
        /*
         * Do NOT remove the prediction result.
         */
        console.error(
          "Prediction succeeded, but history save failed:",
          historyError
        );
      }
    } catch (error) {
      console.error(
        "Prediction failed:",
        error
      );

      setPredictionError(
        error?.message ||
          "Unable to generate disease-risk prediction."
      );
    } finally {
      setPredicting(false);
    }
  };

  /*
   * =========================================================
   * RESET MANUAL DATA
   * =========================================================
   */

  const resetManualData = () => {
    setManualData({
      soilPH: "",
      soilMoistureVWC: "",
      soilTempC: "",
      humidity: "",
      rainfall: "",
      windSpeed: "",
    });

    setPrediction(null);
    setPredictionError("");
  };

  /*
   * =========================================================
   * LOADING DEVICES
   *
   * We don't completely block the page.
   * Manual input can still be used.
   * =========================================================
   */

  if (devicesLoading) {
    return (
      <div className="dashboard-page">
        <div className="loading-box">
          Loading devices...
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <div className="dashboard-page sensor-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="dashboard-header">

        <div>

          <div className="breadcrumb">
            CINNAPREDICT
            <span>/</span>
            SENSORS
          </div>

          <h1>
            Live Sensor Data
          </h1>

          <p>
            Real-time environmental conditions
            received from Firebase.
          </p>

        </div>

        <div className="header-live-status">

          <span className="live-dot" />

          {manualMode
            ? "Manual input"
            : "Live Firebase"}

        </div>

      </div>


      {/* =====================================================
          DEVICE SELECTOR
      ===================================================== */}

      {devices.length > 0 && (

        <div className="sensor-device-bar">

          <div>

            <span className="eyebrow">
              ACTIVE DEVICE
            </span>

            <strong>
              {selectedDevice?.name ||
                "Device"}
            </strong>

            <span className="sensor-device-id">
              {selectedDevice?.deviceId ||
                "—"}
            </span>

          </div>


          <select
            value={activeDeviceId}
            onChange={(event) => {

              const value =
                event.target.value;

              setSelectedDeviceId(value);

              localStorage.setItem(
                "selectedDeviceId",
                value
              );

              setPrediction(null);
              setPredictionError("");

            }}
          >

            {devices.map((device) => (

              <option
                key={
                  device.firestoreId ||
                  device.deviceId
                }
                value={device.deviceId}
              >
                {device.name ||
                  device.deviceId}
              </option>

            ))}

          </select>

        </div>

      )}


      {/* =====================================================
          DATA SOURCE
      ===================================================== */}

      <section className="sensor-mode-card">

        <div>

          <span className="eyebrow">
            DATA SOURCE
          </span>

          <h2>
            {manualMode
              ? "Manual Prediction"
              : "Live Sensor Monitoring"}
          </h2>

          <p>
            {manualMode
              ? "Enter soil conditions manually and run the White Root Rot risk prediction."
              : "Values below are read directly from the selected Firebase sensor."}
          </p>

        </div>


        <div className="sensor-mode-buttons">

          <button
            type="button"
            className={`mode-button ${
              !manualMode
                ? "active"
                : ""
            }`}
            onClick={() => {
              setManualMode(false);
              setPrediction(null);
              setPredictionError("");
            }}
          >
            Live Data
          </button>


          <button
            type="button"
            className={`mode-button ${
              manualMode
                ? "active"
                : ""
            }`}
            onClick={() => {
              setManualMode(true);
              setPrediction(null);
              setPredictionError("");
            }}
          >
            Manual Input
          </button>

        </div>

      </section>


      {/* =====================================================
          SENSOR ERROR
      ===================================================== */}

      {!manualMode &&
        sensorError && (

          <div className="sensor-page-error">
            ⚠️ {sensorError}
          </div>

        )}


      {/* =====================================================
          DEVICE ERROR
      ===================================================== */}

      {devicesError && (

        <div className="sensor-page-error">
          ⚠️ {devicesError}
        </div>

      )}


      {/* =====================================================
          LIVE SENSOR DATA
      ===================================================== */}

      {!manualMode && (

        <section className="sensor-data-section">

          <div className="sensor-data-heading">

            <div>

              <span className="eyebrow">
                LIVE DATA
              </span>

              <h2>
                Current Sensor Conditions
              </h2>

            </div>

            <span className="sensor-data-live-label">
              REAL-TIME FIREBASE
            </span>

          </div>


          <div className="sensor-grid">

            <SensorCard
              icon="🧪"
              title="Soil pH"
              value={formatNumber(
                liveData.soilPH,
                2
              )}
              description="Current soil acidity"
            />


            <SensorCard
              icon="💧"
              title="Soil Moisture"
              value={formatNumber(
                liveData.soilMoistureVWC,
                1
              )}
              unit="%"
              description="Volumetric water content"
            />


            <SensorCard
              icon="🌡️"
              title="Soil Temperature"
              value={formatNumber(
                liveData.soilTempC,
                1
              )}
              unit="°C"
              description="Current soil temperature"
            />


            <SensorCard
              icon="☁️"
              title="Humidity"
              value={formatNumber(
                liveData.humidity,
                1
              )}
              unit="%"
              description="Environmental humidity"
            />


            <SensorCard
              icon="🌧️"
              title="Rainfall"
              value={formatNumber(
                liveData.rainfall,
                1
              )}
              unit="mm"
              description="Latest rainfall reading"
            />


            <SensorCard
              icon="💨"
              title="Wind Speed"
              value={formatNumber(
                liveData.windSpeed,
                1
              )}
              unit="m/s"
              description="Current wind speed"
            />

          </div>


          {/* =================================================
              LIVE PREDICTION BUTTON
          ================================================= */}

          <section className="prediction-trigger-card">

            <div>

              <span className="eyebrow">
                WHITE ROOT ROT ANALYSIS
              </span>

              <h2>
                Analyze Current Conditions
              </h2>

              <p>
                Send the current Firebase soil
                readings to the XGBoost disease-risk
                model and generate an AI advisory.
              </p>


              <div className="prediction-input-summary">

                <span>
                  pH{" "}
                  <strong>
                    {formatNumber(
                      liveData.soilPH,
                      2
                    )}
                  </strong>
                </span>

                <span>
                  Moisture{" "}
                  <strong>
                    {formatNumber(
                      liveData.soilMoistureVWC,
                      1
                    )}
                    %
                  </strong>
                </span>

                <span>
                  Temperature{" "}
                  <strong>
                    {formatNumber(
                      liveData.soilTempC,
                      1
                    )}
                    °C
                  </strong>
                </span>

              </div>

            </div>


            <button
              type="button"
              className="predict-button"
              onClick={handlePrediction}
              disabled={
                predicting ||
                sensorLoading ||
                !activeDeviceId ||
                !liveValuesReady
              }
            >

              {predicting
                ? "Analysing Conditions..."
                : "🔍 Predict Disease Risk"}

            </button>

          </section>

        </section>

      )}


      {/* =====================================================
          MANUAL INPUT
      ===================================================== */}

      {manualMode && (

        <section className="manual-input-card">

          <div className="manual-input-header">

            <div>

              <span className="eyebrow">
                MANUAL DATA
              </span>

              <h2>
                Enter Soil Conditions
              </h2>

              <p>
                Enter the three required soil
                parameters for disease-risk prediction.
              </p>

            </div>


            <button
              type="button"
              className="secondary-button"
              onClick={useLiveValues}
              disabled={!liveValuesReady}
            >
              Use Live Values
            </button>

          </div>


          <div className="manual-form-grid">

            {/* SOIL PH */}

            <label>

              <span>
                Soil pH *
              </span>

              <input
                type="number"
                min="0"
                max="14"
                step="0.01"
                value={
                  manualData.soilPH
                }
                onChange={(event) =>
                  updateManualData(
                    "soilPH",
                    event.target.value
                  )
                }
                placeholder="e.g. 5.8"
              />

              <small>
                Required for prediction
              </small>

            </label>


            {/* SOIL MOISTURE */}

            <label>

              <span>
                Soil Moisture (%) *
              </span>

              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={
                  manualData.soilMoistureVWC
                }
                onChange={(event) =>
                  updateManualData(
                    "soilMoistureVWC",
                    event.target.value
                  )
                }
                placeholder="e.g. 65"
              />

              <small>
                Volumetric water content
              </small>

            </label>


            {/* SOIL TEMPERATURE */}

            <label>

              <span>
                Soil Temperature (°C) *
              </span>

              <input
                type="number"
                min="-20"
                max="60"
                step="0.1"
                value={
                  manualData.soilTempC
                }
                onChange={(event) =>
                  updateManualData(
                    "soilTempC",
                    event.target.value
                  )
                }
                placeholder="e.g. 28"
              />

              <small>
                Required for prediction
              </small>

            </label>


            {/* HUMIDITY */}

            <label>

              <span>
                Humidity (%)
              </span>

              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={
                  manualData.humidity
                }
                onChange={(event) =>
                  updateManualData(
                    "humidity",
                    event.target.value
                  )
                }
                placeholder="Optional"
              />

            </label>


            {/* RAINFALL */}

            <label>

              <span>
                Rainfall (mm)
              </span>

              <input
                type="number"
                min="0"
                step="0.1"
                value={
                  manualData.rainfall
                }
                onChange={(event) =>
                  updateManualData(
                    "rainfall",
                    event.target.value
                  )
                }
                placeholder="Optional"
              />

            </label>


            {/* WIND SPEED */}

            <label>

              <span>
                Wind Speed (m/s)
              </span>

              <input
                type="number"
                min="0"
                step="0.1"
                value={
                  manualData.windSpeed
                }
                onChange={(event) =>
                  updateManualData(
                    "windSpeed",
                    event.target.value
                  )
                }
                placeholder="Optional"
              />

            </label>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {predictionError && (

            <div className="prediction-error">
              ⚠️ {predictionError}
            </div>

          )}


          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="manual-input-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={resetManualData}
            >
              Clear
            </button>


            <button
              type="button"
              className="predict-button"
              onClick={handlePrediction}
              disabled={predicting}
            >

              {predicting
                ? "Analysing Conditions..."
                : "🔍 Predict Disease Risk"}

            </button>

          </div>

        </section>

      )}


      {/* =====================================================
          PREDICTION RESULT
      ===================================================== */}

      {prediction && (

        <PredictionResult
          prediction={prediction}
        />

      )}

    </div>
  );
}


/* =============================================================
   SENSOR CARD
   ============================================================= */

function SensorCard({
  icon,
  title,
  value,
  unit,
  description,
}) {
  return (
    <div className="sensor-card">

      <div className="sensor-card-top">

        <div className="sensor-icon">
          {icon}
        </div>

        <span className="sensor-live">

          <span className="live-dot" />

          LIVE

        </span>

      </div>


      <span className="sensor-card-title">
        {title}
      </span>


      <div className="sensor-card-value">

        {value}

        {unit && (
          <small>
            {unit}
          </small>
        )}

      </div>


      <span className="sensor-card-description">
        • {description}
      </span>

    </div>
  );
}


/* =============================================================
   PREDICTION RESULT
   ============================================================= */

function PredictionResult({
  prediction,
}) {
  /*
   * Backend response:
   *
   * {
   *   prediction: {
   *     risk_level: "Medium",
   *     confidence: 67,
   *     probabilities: {...}
   *   },
   *
   *   advisory: {
   *     report: "...",
   *     immediate_actions: [],
   *     preventive_measures: [],
   *     monitoring_plan: "...",
   *     sources: []
   *   }
   * }
   */

  const data =
    prediction?.prediction || {};

  const advisory =
    prediction?.advisory || {};

  /*
   * =========================================================
   * RISK LEVEL
   * =========================================================
   */

  const risk =
    data.risk_level ||
    data.riskLevel ||
    "Unknown";

  /*
   * =========================================================
   * CONFIDENCE
   * =========================================================
   */

  let confidence = Number(
    data.confidence ?? 0
  );

  if (
    confidence > 0 &&
    confidence <= 1
  ) {
    confidence *= 100;
  }

  confidence = Math.max(
    0,
    Math.min(
      100,
      confidence
    )
  );

  /*
   * =========================================================
   * ADVISORY
   * =========================================================
   */

  const report =
    advisory.report || "";

  const actions =
    Array.isArray(
      advisory.immediate_actions
    )
      ? advisory.immediate_actions
      : [];

  const preventive =
    Array.isArray(
      advisory.preventive_measures
    )
      ? advisory.preventive_measures
      : [];

  const sources =
    Array.isArray(
      advisory.sources
    )
      ? advisory.sources
      : [];

  const monitoringPlan =
    advisory.monitoring_plan || "";

  /*
   * =========================================================
   * RISK CLASS
   * =========================================================
   */

  const riskClass =
    getResultRiskClass(risk);

  return (
    <section className="prediction-result">

      {/* =====================================================
          RESULT HEADER
      ===================================================== */}

      <div className="prediction-result-header">

        <div>

          <span className="eyebrow">
            PREDICTION RESULT
          </span>

          <h2>
            White Root Rot Risk Assessment
          </h2>

          <p>
            Prediction generated from the
            supplied soil conditions.
          </p>

        </div>


        <span className="prediction-complete">
          ✓ Analysis complete
        </span>

      </div>


      {/* =====================================================
          RISK + CONFIDENCE
      ===================================================== */}

      <div className="prediction-summary-grid">

        {/* RISK */}

        <div
          className={`risk-result-card ${riskClass}`}
        >

          <span className="result-label">
            DISEASE RISK
          </span>


          <div className="risk-result-value">

            <span className="risk-result-dot" />

            {risk}

          </div>


          <p>
            White Root Rot risk based on
            the supplied soil conditions.
          </p>

        </div>


        {/* CONFIDENCE */}

        <div className="confidence-result-card">

          <span className="result-label">
            MODEL CONFIDENCE
          </span>


          <strong>
            {Math.round(confidence)}%
          </strong>


          <div className="confidence-bar">

            <div
              style={{
                width: `${confidence}%`,
              }}
            />

          </div>


          <p>
            Confidence reported by the
            disease-risk prediction model.
          </p>

        </div>

      </div>


      {/* =====================================================
          AI ADVISORY REPORT
      ===================================================== */}

      {report && (

        <section className="advisory-result-card">

          <div className="result-section-header">

            <div className="result-icon">
              🤖
            </div>

            <div>

              <span className="result-label">
                AI ADVISORY
              </span>

              <h3>
                Advisory Report
              </h3>

            </div>

          </div>


          <div className="advisory-report">
            {report}
          </div>

        </section>

      )}


      {/* =====================================================
          IMMEDIATE ACTIONS
      ===================================================== */}

      {actions.length > 0 && (

        <section className="result-list-card">

          <div className="result-section-header">

            <div className="result-icon">
              🚨
            </div>

            <div>

              <span className="result-label">
                IMMEDIATE ACTIONS
              </span>

              <h3>
                What to do now
              </h3>

            </div>

          </div>


          <div className="result-list">

            {actions.map(
              (action, index) => (

                <div
                  className="result-list-item"
                  key={`action-${index}`}
                >

                  <span>
                    {index + 1}.
                  </span>

                  <span>
                    {action}
                  </span>

                </div>

              )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          PREVENTIVE MEASURES
      ===================================================== */}

      {preventive.length > 0 && (

        <section className="result-list-card">

          <div className="result-section-header">

            <div className="result-icon">
              🛡️
            </div>

            <div>

              <span className="result-label">
                PREVENTIVE MEASURES
              </span>

              <h3>
                Prevention
              </h3>

            </div>

          </div>


          <div className="result-list">

            {preventive.map(
              (item, index) => (

                <div
                  className="result-list-item"
                  key={`preventive-${index}`}
                >

                  <span>
                    ✓
                  </span>

                  <span>
                    {item}
                  </span>

                </div>

              )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          MONITORING PLAN
      ===================================================== */}

      {monitoringPlan && (

        <section className="result-list-card">

          <div className="result-section-header">

            <div className="result-icon">
              📅
            </div>

            <div>

              <span className="result-label">
                MONITORING PLAN
              </span>

              <h3>
                Monitoring
              </h3>

            </div>

          </div>


          <div className="advisory-report">
            {monitoringPlan}
          </div>

        </section>

      )}


      {/* =====================================================
          KNOWLEDGE SOURCES
      ===================================================== */}

      {sources.length > 0 && (

        <section className="result-list-card">

          <div className="result-section-header">

            <div className="result-icon">
              📚
            </div>

            <div>

              <span className="result-label">
                KNOWLEDGE SOURCES
              </span>

              <h3>
                Retrieved Sources
              </h3>

            </div>

          </div>


          <div className="result-list">

            {sources.map(
              (source, index) => (

                <div
                  className="result-list-item"
                  key={`source-${index}`}
                >

                  <span>
                    📖
                  </span>

                  <span>
                    {source}
                  </span>

                </div>

              )
            )}

          </div>

        </section>

      )}

    </section>
  );
}


/* =============================================================
   RESULT RISK CLASS
   ============================================================= */

function getResultRiskClass(risk) {
  const value = String(risk || "")
    .toLowerCase();

  if (value.includes("critical")) {
    return "risk-critical";
  }

  if (value.includes("high")) {
    return "risk-high";
  }

  if (value.includes("medium")) {
    return "risk-medium";
  }

  return "risk-low";
}