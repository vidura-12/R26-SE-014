import { useMemo } from "react";

import SensorCard from "../../components/dashboard/SensorCard";
import RiskCard from "../../components/dashboard/RiskCard";
import ConfidenceCard from "../../components/dashboard/ConfidenceCard";
import AdvisoryCard from "../../components/dashboard/AdvisoryCard";
import ActionList from "../../components/dashboard/ActionList";
import MonitoringCard from "../../components/dashboard/MonitoringCard";
import KnowledgeSources from "../../components/dashboard/KnowledgeSources";

import useDevices from "../../hooks/useDevices";
import useSensorData from "../../hooks/useSensorData";
import usePrediction from "../../hooks/usePrediction";

export default function Overview() {
  const { devices } = useDevices();

  const selectedDeviceId =
    localStorage.getItem(
      "selectedDeviceId"
    ) ||
    devices[0]?.deviceId;

  const selectedDevice = useMemo(
    () =>
      devices.find(
        (device) =>
          device.deviceId ===
          selectedDeviceId
      ) || devices[0],
    [devices, selectedDeviceId]
  );

  const {
    sensorData,
    loading: sensorLoading,
  } = useSensorData(
    selectedDevice?.deviceId
  );

  const {
    prediction,
    advisory,
    loading: predictionLoading,
    error: predictionError,
    refresh,
  } = usePrediction(sensorData);

  const riskLevel =
    prediction?.risk_level ||
    "Low";

  const confidence =
    Number(
      prediction?.confidence || 0
    );

  const immediateActions =
    advisory?.immediate_actions || [];

  const preventiveMeasures =
    advisory?.preventive_measures || [];

  const monitoringPlan =
    advisory?.monitoring_plan || "";

  const sources =
    advisory?.sources || [];

  const passages =
    advisory?.retrieved_passages || [];

  return (
    <div className="dashboard-page">

      {/* HERO */}
      <div className="dashboard-header">
        <div>
          <div className="breadcrumb">
            CINNAPREDICT
            <span> / </span>
            OVERVIEW
          </div>

          <h1>
            Plantation Intelligence
          </h1>

          <p>
            Real-time soil monitoring and
            AI-powered White Root Rot
            advisory.
          </p>
        </div>

        <div className="header-device">
          <span className="live-dot" />

          {selectedDevice
            ? `${selectedDevice.name} online`
            : "No device selected"}
        </div>
      </div>

      {/* SENSOR SECTION */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              LIVE DATA
            </span>

            <h2>
              Current Sensor Conditions
            </h2>
          </div>

          <span className="live-label">
            ● REAL-TIME FIREBASE
          </span>
        </div>

        <div className="sensor-grid">

          <SensorCard
            icon="🧪"
            title="Soil pH"
            value={
              sensorLoading
                ? "..."
                : sensorData?.soilPH?.toFixed(
                    1
                  ) ?? "—"
            }
            unit=""
            description={
              sensorData?.soilPH < 5.5
                ? "Acidic"
                : sensorData?.soilPH <= 6.5
                ? "Optimal range"
                : "Above optimal"
            }
          />

          <SensorCard
            icon="💧"
            title="Soil Moisture"
            value={
              sensorLoading
                ? "..."
                : sensorData?.soilMoistureVWC?.toFixed(
                    1
                  ) ?? "—"
            }
            unit="%"
            description={
              sensorData?.soilMoistureVWC > 60
                ? "High moisture"
                : "Moderate moisture"
            }
          />

          <SensorCard
            icon="🌡️"
            title="Soil Temperature"
            value={
              sensorLoading
                ? "..."
                : sensorData?.soilTempC?.toFixed(
                    1
                  ) ?? "—"
            }
            unit="°C"
            description={
              sensorData?.soilTempC >= 25
                ? "High disease-risk range"
                : "Normal range"
            }
          />

          <SensorCard
            icon="🌿"
            title="Humidity"
            value={
              sensorLoading
                ? "..."
                : sensorData?.humidity?.toFixed(
                    1
                  ) ?? "—"
            }
            unit="%"
            description="Live environmental reading"
          />
        </div>
      </section>

      {/* RISK */}
      <section className="risk-layout">

        <RiskCard
          riskLevel={riskLevel}
          confidence={confidence}
          loading={predictionLoading}
        />

        <ConfidenceCard
          confidence={confidence}
        />

        <div className="prediction-status-card">
          <span className="eyebrow">
            MODEL STATUS
          </span>

          <div className="status-main">
            <span className="status-dot" />

            {predictionLoading
              ? "Analysing conditions..."
              : "Prediction service active"}
          </div>

          <p>
            XGBoost disease-risk prediction
            combined with the advisory
            knowledge base.
          </p>

          <button
            className="refresh-button"
            onClick={refresh}
            disabled={predictionLoading}
          >
            {predictionLoading
              ? "Refreshing..."
              : "Refresh Prediction ↻"}
          </button>

          {predictionError && (
            <div className="prediction-error">
              {predictionError}
            </div>
          )}
        </div>
      </section>

      {/* AI ADVISORY */}
      <AdvisoryCard
        advisory={advisory}
      />

      {/* ACTIONS */}
      <div className="two-column">

        <ActionList
          title="Immediate Actions"
          items={immediateActions}
          icon="!"
          type="urgent"
        />

        <ActionList
          title="Preventive Measures"
          items={preventiveMeasures}
          icon="✓"
          type="preventive"
        />

      </div>

      {/* MONITORING */}
      <MonitoringCard
        plan={monitoringPlan}
      />

      {/* SOURCES */}
      <KnowledgeSources
        sources={sources}
        passages={passages}
      />

    </div>
  );
}