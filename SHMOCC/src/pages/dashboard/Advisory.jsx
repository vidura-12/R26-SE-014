
import { useTranslation } from "react-i18next";

import useDevices from "../../hooks/useDevices";
import useSensorData from "../../hooks/useSensorData";
import usePrediction from "../../hooks/usePrediction";

import LanguageSelector from "../../components/LanguageSelector";

import RiskCard from "../../components/dashboard/RiskCard";
import ConfidenceCard from "../../components/dashboard/ConfidenceCard";
import AdvisoryCard from "../../components/dashboard/AdvisoryCard";
import ActionList from "../../components/dashboard/ActionList";
import MonitoringCard from "../../components/dashboard/MonitoringCard";
import KnowledgeSources from "../../components/dashboard/KnowledgeSources";

export default function Advisory() {
  const { t, i18n } = useTranslation();

  const { devices } = useDevices();

  const deviceId =
    localStorage.getItem("selectedDeviceId") ||
    devices[0]?.deviceId;

  const { sensorData } = useSensorData(deviceId);

  const language =
    i18n.resolvedLanguage?.split("-")[0] || "en";

  const {
    prediction,
    advisory,
    loading,
  } = usePrediction(sensorData, language);

  const riskLabels = {
    en: {
      Low: "Low",
      Medium: "Medium",
      High: "High",
    },
    si: {
      Low: "අඩු",
      Medium: "මධ්‍යම",
      High: "ඉහළ",
    },
    ta: {
      Low: "குறைவு",
      Medium: "நடுத்தரம்",
      High: "அதிகம்",
    },
  };

  const riskLevel = prediction?.risk_level || "Low";

  return (
    <div className="dashboard-page">
      <style>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          flex-wrap: wrap;
        }

        .language-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px;
          border: 1px solid #dbe3e8;
          border-radius: 12px;
          background: #ffffff;
          flex-shrink: 0;
        }

        .language-button {
          border: none;
          border-radius: 8px;
          padding: 9px 12px;
          background: transparent;
          color: #334155;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .language-button:hover {
          background: #f1f5f9;
        }

        .language-button.active {
          background: #176b4d;
          color: #ffffff;
        }

        .language-button:focus-visible {
          outline: 2px solid #176b4d;
          outline-offset: 2px;
        }

        @media (max-width: 600px) {
          .dashboard-header {
            align-items: stretch;
          }

          .language-selector {
            width: fit-content;
            max-width: 100%;
            flex-wrap: wrap;
          }

          .language-button {
            padding: 8px 10px;
          }
        }
      `}</style>

      <div className="dashboard-header">
        <div>
          <div className="breadcrumb">
            CINNAPREDICT / {t("advisory")}
          </div>

          <h1>{t("diseaseRisk")}</h1>

          <p>{t("advisoryDescription")}</p>
        </div>

        <LanguageSelector />
      </div>

      <div className="risk-layout">
        <RiskCard
          riskLevel={
            riskLabels[language]?.[riskLevel] || riskLevel
          }
          confidence={prediction?.confidence ?? 0}
          loading={loading}
        />

        <ConfidenceCard
          confidence={prediction?.confidence ?? 0}
        />
      </div>

      <AdvisoryCard advisory={advisory} />

      <div className="two-column">
        <ActionList
          title={t("immediateActions")}
          items={advisory?.immediate_actions || []}
          icon="!"
          type="urgent"
        />

        <ActionList
          title={t("preventiveMeasures")}
          items={advisory?.preventive_measures || []}
          icon="✓"
          type="preventive"
        />
      </div>

      <MonitoringCard
        plan={advisory?.monitoring_plan}
      />

      <KnowledgeSources
        sources={advisory?.sources || []}
        passages={advisory?.retrieved_passages || []}
      />
    </div>
  );
}
