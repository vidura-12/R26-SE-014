import { useOutletContext, useNavigate } from "react-router-dom";
import { useDashboard } from "./DashboardContext";
import { getRiskConfig, MOCK_HISTORY } from "./dashboardTheme";
import { RiskGauge, ProbabilityBars, SensorCard, RiskBadge } from "./DashboardComponents";

export default function Overview() {
  const { t } = useOutletContext();
  const nav = useNavigate();
  const {
    devices, sensorData, riskScore, riskLevel, predictionLoading,
    predictionError, probabilities, riskAdvice, fetchPrediction, setShowRegisterModal,
  } = useDashboard();

  const riskCfg = getRiskConfig(t.__isDark);
  const cfg = riskCfg[riskLevel] || riskCfg.Low;

  const sparkPH       = [5.7, 5.8, 5.9, 6.0, 6.1, 5.9, 5.9];
  const sparkMoisture = [28, 30, 32, 31, 33, 31, 31];
  const sparkTemp     = [25.5, 26.2, 26.8, 27.1, 27.5, 27.0, 27.0];

  const goToSensorData = (device) => nav("/dashboard/sensor-data", { state: { device } });

  return (
    <div className="fade-up">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 28 }}>
        {/* Risk gauge card */}
        <div style={{
          background: t.cardBg, borderRadius: 24, padding: 28,
          border: `2px solid ${cfg.border}`, boxShadow: `0 8px 32px ${cfg.color}12, ${t.cardShadow}`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${cfg.color}12, transparent 70%)` }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.14em", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 10px ${cfg.color}60` }} />
              Current Disease Risk
            </div>
            {predictionLoading && <div style={{ width: 18, height: 18, border: `2.5px solid ${t.divider}`, borderTop: "2.5px solid #10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
          </div>
          <RiskGauge score={riskScore} t={t} />
          <ProbabilityBars probabilities={probabilities} t={t} />
          <div style={{ marginTop: 20, padding: "14px 18px", background: cfg.bg, borderRadius: 14, border: `1.5px solid ${cfg.border}`, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 13, color: cfg.color, fontWeight: 700, lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: -1 }}>{riskAdvice.split(" ")[0]}</span>
              <span>{riskAdvice.split(" ").slice(1).join(" ")}</span>
            </div>
          </div>
          {predictionError && (
            <div style={{ marginTop: 12, fontSize: 12, color: "#dc2626", fontWeight: 700, background: t.__isDark ? "#2a1414" : "#fef2f2", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #dc262640" }}>
              ⚠️ {predictionError}
            </div>
          )}
          <button onClick={fetchPrediction} disabled={predictionLoading} style={{
            marginTop: 18, width: "100%", padding: "12px", borderRadius: 14,
            border: `2px solid ${t.inputBorder}`, background: t.inputBg, color: t.textSecondary,
            fontSize: 13, fontWeight: 800, cursor: predictionLoading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s",
          }}>
            {predictionLoading ? <><div style={{ width: 14, height: 14, border: `2px solid ${t.divider}`, borderTop: "2px solid #10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Refreshing...</> : <><span style={{ fontSize: 16 }}>🔄</span> Refresh Prediction</>}
          </button>
        </div>

        {/* Quick stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            { icon: "🧪", label: "Soil pH", val: sensorData.soilPH, sub: "Acidic range", color: "#8b5cf6" },
            { icon: "💧", label: "Soil Moisture", val: `${sensorData.soilMoistureVWC}%`, sub: "Moderately wet", color: "#3b82f6" },
            { icon: "🌡️", label: "Soil Temperature", val: `${sensorData.soilTempC}°C`, sub: "Above optimal", color: "#ea580c" },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{
              background: t.cardBg, borderRadius: 18, padding: "18px 22px", border: `1.5px solid ${t.cardBorder}`,
              boxShadow: t.cardShadow, display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = t.cardShadowHover; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = t.cardShadow; }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: `linear-gradient(135deg, ${s.color}20, ${s.color}10)`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
                border: `1.5px solid ${s.color}25`,
              }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: t.textPrimary, fontFamily: "'Playfair Display',serif", letterSpacing: "-0.02em" }}>{s.val}</div>
                <div style={{ fontSize: 12, color: s.color, fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: s.color }} /> {s.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Device summary */}
        <div style={{ background: t.cardBg, borderRadius: 24, padding: 28, border: `1.5px solid ${t.cardBorder}`, boxShadow: t.cardShadow, position: "relative", overflow: "hidden" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} /> Device Overview
          </div>
          {[
            { label: "Total Devices", val: devices.length, color: t.textPrimary, icon: "📡" },
            { label: "Online", val: devices.filter(d => d.status === "online").length, color: "#16a34a", icon: "🟢" },
            { label: "Offline", val: devices.filter(d => d.status === "offline").length, color: "#dc2626", icon: "🔴" },
            { label: "Low Battery", val: devices.filter(d => d.battery < 20).length, color: "#ca8a04", icon: "🔋" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${t.divider}` }}>
              <span style={{ fontSize: 14, color: t.textSecondary, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>{s.icon}</span> {s.label}
              </span>
              <span style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: "'Playfair Display',serif" }}>{s.val}</span>
            </div>
          ))}
          <button onClick={() => nav("/dashboard/devices")} style={{
            marginTop: 20, width: "100%", padding: "12px", borderRadius: 14, border: `2px solid ${t.inputBorder}`,
            background: t.inputBg, color: t.textPrimary, fontSize: 14, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s",
          }}>
            Manage Devices <span style={{ fontSize: 16 }}>→</span>
          </button>
        </div>
      </div>

      {/* Sensor Data quick-access cards */}
      {devices.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.textPrimary, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 12, background: t.blueChipBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: `1.5px solid ${t.blueChipBorder}` }}>📊</span>
            Live Sensor Monitoring
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
            {devices.map(device => (
              <div key={device.firestoreId} onClick={() => goToSensorData(device)} style={{
                background: t.cardBg, borderRadius: 20, padding: "22px 24px", border: `1.5px solid ${t.cardBorder}`,
                boxShadow: t.cardShadow, cursor: "pointer", transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)", position: "relative", overflow: "hidden",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = t.cardShadowHover; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = t.cardShadow; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: t.__isDark ? "linear-gradient(135deg, #0f2718, #133420)" : "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, position: "relative",
                    border: "1.5px solid #16a34a40",
                  }}>
                    📡
                    <div style={{ position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: "50%", background: device.status === "online" ? "#22c55e" : "#ef4444", border: `3px solid ${t.__isDark ? "#10192b" : "white"}` }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: t.textPrimary }}>{device.name}</div>
                    <div style={{ fontSize: 13, color: t.textSecondary, fontWeight: 500, marginTop: 2 }}>📍 {device.location}</div>
                  </div>
                </div>
                <div style={{
                  padding: "12px 18px", background: t.__isDark ? "linear-gradient(135deg, #0f2718, #0c2015)" : "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                  borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1.5px solid #16a34a30",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: t.__isDark ? "#4ade80" : "#15803d" }}>Open Sensor Data</span>
                  <span style={{ fontSize: 20, color: "#16a34a" }}>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Input Sensor Cards */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: t.textPrimary, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 36, height: 36, borderRadius: 12, background: t.__isDark ? "linear-gradient(135deg, #0f2718, #133420)" : "linear-gradient(135deg, #dcfce7, #bbf7d0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "1.5px solid #16a34a30" }}>🌱</span>
          White Root Rot — Model Inputs
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
          <SensorCard icon="🧪" label="Soil pH" value={sensorData.soilPH} unit="" sparkData={sparkPH} color="#8b5cf6" trend={-1.2} t={t} />
          <SensorCard icon="💧" label="Soil Moisture" value={sensorData.soilMoistureVWC} unit="% VWC" sparkData={sparkMoisture} color="#3b82f6" trend={2.4} t={t} />
          <SensorCard icon="🌡️" label="Soil Temperature" value={sensorData.soilTempC} unit="°C" sparkData={sparkTemp} color="#ea580c" trend={0.8} t={t} />
        </div>
      </div>

      {/* Recent history */}
      <div style={{ background: t.cardBg, borderRadius: 24, padding: 28, border: `1.5px solid ${t.cardBorder}`, boxShadow: t.cardShadow, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.textPrimary, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 12, background: t.__isDark ? "linear-gradient(135deg, #2a2410, #1f1a0a)" : "linear-gradient(135deg, #fefce8, #fef9c3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "1.5px solid #ca8a0440" }}>📋</span>
            Recent Risk History
          </div>
          <button onClick={() => nav("/dashboard/history")} style={{ fontSize: 13, color: "#10b981", fontWeight: 800, background: "none", border: "none", cursor: "pointer", padding: "8px 16px", borderRadius: 10 }}>View All →</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
            <thead>
              <tr>
                {["Date", "Risk Score", "Level", "Temp", "Humidity", "Rainfall"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 800, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 16px 8px 0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_HISTORY.slice(0, 4).map(row => (
                <tr key={row.date} className="history-row" style={{ background: t.tableRowBg, borderRadius: 14, boxShadow: t.tableRowShadow }}>
                  <td style={{ padding: "14px 16px 14px 18px", fontSize: 14, color: t.textPrimary, fontWeight: 700, borderRadius: "14px 0 0 14px" }}>{row.date}</td>
                  <td style={{ padding: "14px 16px 14px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, maxWidth: 90, height: 7, background: t.divider, borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${row.risk}%`, height: "100%", background: row.risk >= 80 ? "linear-gradient(90deg, #dc2626, #ef4444)" : row.risk >= 60 ? "linear-gradient(90deg, #ea580c, #f97316)" : row.risk >= 40 ? "linear-gradient(90deg, #ca8a04, #eab308)" : "linear-gradient(90deg, #16a34a, #22c55e)", borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 900, color: t.textPrimary, fontFamily: "'Playfair Display',serif" }}>{row.risk}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px 14px 0" }}><RiskBadge level={row.level} t={t} /></td>
                  <td style={{ padding: "14px 16px 14px 0", fontSize: 14, color: t.textSecondary, fontWeight: 600 }}>{row.temp}°C</td>
                  <td style={{ padding: "14px 16px 14px 0", fontSize: 14, color: t.textSecondary, fontWeight: 600 }}>{row.humidity}%</td>
                  <td style={{ padding: "14px 18px 14px 0", fontSize: 14, color: t.textSecondary, fontWeight: 600, borderRadius: "0 14px 14px 0" }}>{row.rainfall} mm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}