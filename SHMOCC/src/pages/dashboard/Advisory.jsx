import useDevices from "../../hooks/useDevices";
import useSensorData from "../../hooks/useSensorData";
import usePrediction from "../../hooks/usePrediction";

import RiskCard from "../../components/dashboard/RiskCard";
import ConfidenceCard from "../../components/dashboard/ConfidenceCard";
import AdvisoryCard from "../../components/dashboard/AdvisoryCard";
import ActionList from "../../components/dashboard/ActionList";
import MonitoringCard from "../../components/dashboard/MonitoringCard";
import KnowledgeSources from "../../components/dashboard/KnowledgeSources";

export default function Advisory() {
  const { devices } = useDevices();

  const deviceId =
    localStorage.getItem(
      "selectedDeviceId"
    ) ||
    devices[0]?.deviceId;

  const { sensorData } =
    useSensorData(deviceId);

  const {
    prediction,
    advisory,
    loading,
  } = usePrediction(sensorData);

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">
        <div>
          <div className="breadcrumb">
            CINNAPREDICT / ADVISORY
          </div>

          <h1>
            Disease Advisory
          </h1>

          <p>
            AI-assisted White Root Rot
            assessment and recommended actions.
          </p>
        </div>
      </div>

      <div className="risk-layout">
        <RiskCard
          riskLevel={
            prediction?.risk_level ||
            "Low"
          }
          confidence={
            prediction?.confidence ||
            0
          }
          loading={loading}
        />

        <ConfidenceCard
          confidence={
            prediction?.confidence ||
            0
          }
        />
      </div>

      <AdvisoryCard
        advisory={advisory}
      />

      <div className="two-column">
        <ActionList
          title="Immediate Actions"
          items={
            advisory?.immediate_actions ||
            []
          }
          icon="!"
          type="urgent"
        />

        <ActionList
          title="Preventive Measures"
          items={
            advisory?.preventive_measures ||
            []
          }
          icon="✓"
          type="preventive"
        />
      </div>

      <MonitoringCard
        plan={
          advisory?.monitoring_plan
        }
      />

      <KnowledgeSources
        sources={
          advisory?.sources || []
        }
        passages={
          advisory?.retrieved_passages ||
          []
        }
      />

    </div>
  );
}