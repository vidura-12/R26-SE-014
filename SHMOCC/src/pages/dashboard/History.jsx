import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  getPredictionHistory,
  clearPredictionHistory,
  subscribeToPredictionHistory,
} from "./predictionHistoryStore";

// ============================================================
// RISK STYLES — kept consistent with the prediction panel on
// the Sensor Data page.
// ============================================================
const RISK_STYLES = {
  Low: { color: "#16a34a", soft: "#16a34a1a", border: "#16a34a40" },
  Medium: { color: "#ca8a04", soft: "#ca8a041a", border: "#ca8a0440" },
  High: { color: "#dc2626", soft: "#dc26261a", border: "#dc262640" },
};
const DEFAULT_STYLE = { color: "#64748b", soft: "#64748b1a", border: "#64748b40" };

function getRiskStyle(level) {
  if (!level) return DEFAULT_STYLE;
  const key = Object.keys(RISK_STYLES).find((k) =>
    level.toLowerCase().includes(k.toLowerCase())
  );
  return key ? RISK_STYLES[key] : DEFAULT_STYLE;
}

function formatDateTime(timestamp) {
  const d = new Date(timestamp);
  return {
    date: d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function RiskPill({ level, t }) {
  const s = getRiskStyle(level);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 99,
        fontSize: 11.5,
        fontWeight: 800,
        color: s.color,
        background: t.__isDark ? `${s.color}22` : s.soft,
        border: `1.5px solid ${s.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.color,
        }}
      />
      {level || "Unknown"}
    </span>
  );
}

function SourcePill({ mode, t }) {
  const isLive = mode === "live";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        color: isLive ? "#0369a1" : t.textSecondary,
        background: isLive
          ? (t.__isDark ? "#0369a122" : "#e0f2fe")
          : t.inputBg,
        border: `1px solid ${isLive ? "#0369a140" : t.inputBorder}`,
      }}
    >
      {isLive ? "📡 Live" : "✏️ Manual"}
    </span>
  );
}

function StatCard({ icon, label, value, color, t }) {
  return (
    <div
      style={{
        background: t.cardBg,
        borderRadius: 20,
        padding: "22px 24px",
        border: `1.5px solid ${color}40`,
        boxShadow: `0 8px 24px ${color}10, ${t.cardShadow}`,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}10, transparent 70%)`,
        }}
      />
      <div style={{ fontSize: 28, marginBottom: 12, position: "relative", zIndex: 1 }}>
        {icon}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 900,
          color,
          fontFamily: "'Playfair Display',serif",
          position: "relative",
          zIndex: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          color: t.textMuted,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginTop: 6,
          position: "relative",
          zIndex: 1,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function History() {
  const { t } = useOutletContext();
  const nav = useNavigate();

  const [records, setRecords] = useState(() => getPredictionHistory());
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const unsubscribe = subscribeToPredictionHistory(setRecords);
    return unsubscribe;
  }, []);

  const levels = useMemo(
    () => Array.from(new Set(records.map((r) => r.level).filter(Boolean))),
    [records]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return records;
    return records.filter(
      (r) => (r.level || "").toLowerCase() === filter.toLowerCase()
    );
  }, [records, filter]);

  const stats = useMemo(() => {
    const total = records.length;
    const avgConfidence = total
      ? Math.round(
          records.reduce((sum, r) => sum + (r.confidence || 0), 0) / total
        )
      : 0;
    const highCount = records.filter((r) =>
      (r.level || "").toLowerCase().includes("high")
    ).length;
    const lowCount = records.filter((r) =>
      (r.level || "").toLowerCase().includes("low")
    ).length;

    return { total, avgConfidence, highCount, lowCount };
  }, [records]);

  function handleClear() {
    if (window.confirm("Clear all prediction history? This can't be undone.")) {
      clearPredictionHistory();
    }
  }

  const filterOptions = ["all", ...levels];

  return (
    <div className="fade-up">
      {/* ====================================================
          STATS
      ===================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 18,
          marginBottom: 28,
        }}
      >
        <StatCard icon="📊" label="Total Predictions" value={stats.total} color="#0891b2" t={t} />
        <StatCard icon="🚨" label="High Risk" value={stats.highCount} color="#dc2626" t={t} />
        <StatCard icon="✅" label="Low Risk" value={stats.lowCount} color="#16a34a" t={t} />
        <StatCard icon="🎯" label="Avg Confidence" value={`${stats.avgConfidence}%`} color="#7c3aed" t={t} />
      </div>

      {/* ====================================================
          TABLE CARD
      ===================================================== */}
      <div
        style={{
          background: t.cardBg,
          borderRadius: 24,
          padding: 32,
          border: `1.5px solid ${t.cardBorder}`,
          boxShadow: t.cardShadow,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {filterOptions.map((f) => {
              const active = filter === f;
              const style = f === "all" ? { color: t.__isDark ? "#94a3b8" : "#0f172a" } : getRiskStyle(f);
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 99,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    border: `2px solid ${style.color}`,
                    background: active ? style.color : t.inputBg,
                    color: active ? "white" : t.textSecondary,
                    transition: "all 0.2s",
                    boxShadow: active ? `0 4px 16px ${style.color}40` : "none",
                    textTransform: "capitalize",
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>

          {records.length > 0 && (
            <button
              onClick={handleClear}
              style={{
                padding: "9px 16px",
                borderRadius: 12,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                border: `1.5px solid ${t.inputBorder}`,
                background: t.inputBg,
                color: t.textSecondary,
              }}
            >
              🗑️ Clear History
            </button>
          )}
        </div>

        {records.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: t.emptyIconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                margin: "0 auto 18px",
                border: `2px dashed ${t.blueChipBorder}`,
              }}
            >
              🤖
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: t.textPrimary, marginBottom: 8 }}>
              No predictions yet
            </div>
            <p style={{ fontSize: 14, color: t.textSecondary, fontWeight: 500, marginBottom: 24 }}>
              Run a risk prediction from the Sensor Data page and it will show up here automatically.
            </p>
            <button
              onClick={() => nav("/dashboard/sensor-data")}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                border: "none",
                padding: "13px 28px",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)",
              }}
            >
              Go to Sensor Data
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${t.divider}` }}>
                {[
                  "Date & Time",
                  "Device",
                  "Source",
                  "Soil pH",
                  "Moisture (%)",
                  "Temp (°C)",
                  "Risk Level",
                  "Confidence",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 800,
                      color: t.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      paddingBottom: 16,
                      paddingRight: 16,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const { date, time } = formatDateTime(row.timestamp);
                const s = getRiskStyle(row.level);

                return (
                  <tr
                    key={row.id}
                    className="history-row"
                    style={{
                      background: t.tableRowBg,
                      borderRadius: 14,
                      boxShadow: t.tableRowShadow,
                    }}
                  >
                    <td
                      style={{
                        padding: "16px 16px 16px 20px",
                        borderRadius: "14px 0 0 14px",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 800, color: t.textPrimary }}>
                        {date}
                      </div>
                      <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 600 }}>
                        {time}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "16px 16px 16px 0",
                        fontSize: 13.5,
                        color: t.textSecondary,
                        fontWeight: 700,
                      }}
                    >
                      {row.device}
                    </td>

                    <td style={{ padding: "16px 16px 16px 0" }}>
                      <SourcePill mode={row.mode} t={t} />
                    </td>

                    <td style={{ padding: "16px 16px 16px 0", fontSize: 14, color: t.textSecondary, fontWeight: 700 }}>
                      {row.soilPH}
                    </td>
                    <td style={{ padding: "16px 16px 16px 0", fontSize: 14, color: t.textSecondary, fontWeight: 700 }}>
                      {row.soilMoistureVWC}
                    </td>
                    <td style={{ padding: "16px 16px 16px 0", fontSize: 14, color: t.textSecondary, fontWeight: 700 }}>
                      {row.soilTempC}
                    </td>

                    <td style={{ padding: "16px 16px 16px 0" }}>
                      <RiskPill level={row.level} t={t} />
                    </td>

                    <td style={{ padding: "16px 20px 16px 0", borderRadius: "0 14px 14px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 70,
                            height: 7,
                            background: t.divider,
                            borderRadius: 99,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${row.confidence}%`,
                              height: "100%",
                              borderRadius: 99,
                              background: s.color,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: t.textPrimary }}>
                          {row.confidence}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: t.textMuted,
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    No records for this risk level
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}