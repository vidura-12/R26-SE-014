import { useEffect, useState } from "react";
import "../../styles/history.css";
import {
  subscribeToPredictionHistory,
  deletePredictionRecord,
} from "../../services/predictionHistory";

export default function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToPredictionHistory((data) => {
      setRecords(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (record) => {
    const confirmed = window.confirm(
      `Delete this prediction from ${formatDate(record.timestamp)}?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(record.id);

      await deletePredictionRecord(record.id);
    } catch (error) {
      console.error("Failed to delete prediction:", error);
      alert("Failed to delete prediction. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleString();
  };

  const getRiskClass = (risk) => {
    const value = String(risk || "Low").toLowerCase();

    if (value.includes("critical")) return "risk-critical";
    if (value.includes("high")) return "risk-high";
    if (value.includes("medium")) return "risk-medium";

    return "risk-low";
  };

  const formatNumber = (value, decimals = 1) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const number = Number(value);

    if (Number.isNaN(number)) return "—";

    return number.toFixed(decimals);
  };

  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <div className="breadcrumb">
            CINNAPREDICT <span>/</span> HISTORY
          </div>

          <h1>Prediction History</h1>

          <p>
            Historical disease-risk predictions stored in Firebase.
          </p>
        </div>

        <div className="header-live-status">
          <span className="live-dot" />
          Live history
        </div>
      </div>

      {/* HISTORY CARD */}
      <section className="history-card">

        <div className="history-card-header">
          <div>
            <span className="eyebrow">
              PREDICTION RECORDS
            </span>

            <h2>Recent Predictions</h2>

            <p>
              {records.length}{" "}
              {records.length === 1
                ? "prediction recorded"
                : "predictions recorded"}
            </p>
          </div>

          <div className="history-count">
            {records.length}
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="history-loading">
            <div className="loading-spinner" />
            <span>Loading prediction history...</span>
          </div>
        ) : records.length === 0 ? (

          /* EMPTY */
          <div className="history-empty">
            <div className="history-empty-icon">
              📊
            </div>

            <h3>No prediction history</h3>

            <p>
              Predictions generated from your sensor
              data will appear here.
            </p>
          </div>

        ) : (

          /* TABLE */
          <div className="history-table-wrapper">

            <table className="history-table">

              <thead>
                <tr>
                  <th>DATE</th>
                  <th>DEVICE</th>
                  <th>SOIL pH</th>
                  <th>MOISTURE</th>
                  <th>TEMPERATURE</th>
                  <th>RISK</th>
                  <th>CONFIDENCE</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => {

                  const risk =
                    record.riskLevel ||
                    record.risk_level ||
                    "Low";

                  const confidence =
                    Number(
                      record.confidence ?? 0
                    );

                  return (
                    <tr key={record.id}>

                      {/* DATE */}
                      <td>
                        <span className="history-date">
                          {formatDate(
                            record.timestamp
                          )}
                        </span>
                      </td>

                      {/* DEVICE */}
                      <td>
                        <div className="history-device">
                          <div className="history-device-icon">
                            📡
                          </div>

                          <div>
                            <strong>
                              {record.device ||
                                record.deviceName ||
                                "Device"}
                            </strong>

                            {record.deviceId && (
                              <span>
                                {record.deviceId}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* PH */}
                      <td>
                        <strong>
                          {formatNumber(
                            record.soilPH ??
                              record.Soil_pH,
                            1
                          )}
                        </strong>
                      </td>

                      {/* MOISTURE */}
                      <td>
                        {formatNumber(
                          record.soilMoistureVWC ??
                            record.Soil_Moisture_VWC,
                          1
                        )}
                        %
                      </td>

                      {/* TEMPERATURE */}
                      <td>
                        {formatNumber(
                          record.soilTempC ??
                            record.Soil_Temp_C,
                          1
                        )}
                        °C
                      </td>

                      {/* RISK */}
                      <td>
                        <span
                          className={`history-risk ${getRiskClass(
                            risk
                          )}`}
                        >
                          <span className="risk-dot" />
                          {risk}
                        </span>
                      </td>

                      {/* CONFIDENCE */}
                      <td>
                        <strong>
                          {confidence}%
                        </strong>
                      </td>

                      {/* DELETE */}
                      <td>
                        <button
                          type="button"
                          className="history-delete-button"
                          onClick={() =>
                            handleDelete(record)
                          }
                          disabled={
                            deletingId ===
                            record.id
                          }
                          title="Delete prediction"
                        >
                          {deletingId ===
                          record.id
                            ? "..."
                            : "🗑"}
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>

          </div>
        )}

      </section>
    </div>
  );
}