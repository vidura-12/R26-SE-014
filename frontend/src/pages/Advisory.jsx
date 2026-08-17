import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:8000";

// ─── Sensor Mock (matches your dashboard) ────────────────────────────────────
const MOCK_SENSOR = {
  soilPH: 5.9,
  soilMoistureVWC: 31.5,
  soilTempC: 27.0,
};

const RISK_CONFIG = {
  critical: { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", label: "Critical Risk", gradient: "linear-gradient(135deg, #dc2626, #b91c1c)" },
  high:     { color: "#ea580c", bg: "#fff7ed", border: "#fdba74", label: "High Risk",     gradient: "linear-gradient(135deg, #ea580c, #c2410c)" },
  moderate: { color: "#ca8a04", bg: "#fefce8", border: "#fde047", label: "Moderate Risk",   gradient: "linear-gradient(135deg, #ca8a04, #a16207)" },
  low:      { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", label: "Low Risk",      gradient: "linear-gradient(135deg, #16a34a, #15803d)" },
};

const NAV_ITEMS = [
  { id: "overview",  icon: "🏠", label: "Overview", path: "/dashboard" },
  { id: "devices",   icon: "📡", label: "Devices",  path: "/dashboard?tab=devices" },
  { id: "history",   icon: "📋", label: "History",  path: "/dashboard?tab=history" },
  { id: "advisory",  icon: "🛡️", label: "Advisory", path: "/advisory" },
];

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────
function NavItem({ item, active, onClick, sidebarOpen }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "13px 14px", borderRadius: 12, marginBottom: 6,
        width: "100%", textAlign: "left", border: "none", cursor: "pointer",
        background: active
          ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))"
          : "transparent",
        borderLeft: active ? "3px solid #10b981" : "3px solid transparent",
        position: "relative",
        transition: "all 0.25s",
      }}
    >
      {active && (
        <div style={{
          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
          width: 6, height: 6, borderRadius: "50%", background: "#10b981",
          boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)",
        }} />
      )}
      <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
      {sidebarOpen && (
        <span style={{
          fontSize: 14, fontWeight: active ? 800 : 600,
          color: active ? "#fff" : "#94a3b8", whiteSpace: "nowrap",
        }}>
          {item.label}
        </span>
      )}
    </button>
  );
}

// ─── Condition Card ───────────────────────────────────────────────────────────
function ConditionCard({ icon, label, value, color, optimal }) {
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: "18px 20px",
      border: "1.5px solid #f1f5f9",
      display: "flex", alignItems: "center", gap: 14,
      boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
      transition: "all 0.2s",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `linear-gradient(135deg, ${color}15, ${color}08)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, border: `1.5px solid ${color}25`,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", fontFamily: "'Playfair Display',serif" }}>
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
function ActionCard({ text, index, isCritical }) {
  return (
    <div style={{
      padding: "14px 18px", borderRadius: 14,
      background: isCritical ? "linear-gradient(135deg, #fef2f2, #fff5f5)" : "white",
      border: `1.5px solid ${isCritical ? "#fecaca" : "#f1f5f9"}`,
      display: "flex", alignItems: "flex-start", gap: 12,
      boxShadow: isCritical ? "0 4px 16px rgba(220, 38, 38, 0.08)" : "0 2px 8px rgba(15, 23, 42, 0.02)",
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
        fontSize: 13, color: isCritical ? "#991b1b" : "#334155",
        fontWeight: isCritical ? 800 : 700, lineHeight: 1.6,
      }}>
        {text}
      </span>
    </div>
  );
}

// ─── Main Advisory Page ───────────────────────────────────────────────────────
export default function Advisory() {
  const nav = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Advisory state
  const [advisoryMode, setAdvisoryMode] = useState("realtime");
  const [manualInput, setManualInput] = useState({ soilPH: 5.5, soilMoistureVWC: 45, soilTempC: 28 });
  const [advisoryData, setAdvisoryData] = useState(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryError, setAdvisoryError] = useState("");

  // Auto-fetch on mount if realtime
  useEffect(() => {
    if (advisoryMode === "realtime") {
      fetchAdvisory("realtime");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdvisory = async (mode) => {
    setAdvisoryLoading(true);
    setAdvisoryError("");

    const payload = mode === "realtime"
      ? {
          Soil_pH: MOCK_SENSOR.soilPH,
          Soil_Moisture_VWC: MOCK_SENSOR.soilMoistureVWC,
          Soil_Temp_C: MOCK_SENSOR.soilTempC,
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

  const handleSignOut = async () => {
    await signOut(auth);
    nav("/login");
  };

  const inputStyle = (disabled) => ({
    width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 15,
    border: `2px solid ${disabled ? "#e2e8f0" : "#cbd5e1"}`,
    outline: "none", background: disabled ? "#f8fafc" : "white",
    color: "#0f172a", fontWeight: 700, fontFamily: "'Playfair Display',serif",
    boxSizing: "border-box", transition: "all 0.2s",
  });

  const currentRisk = advisoryData?.input_conditions?.risk_level || "low";
  const riskCfg = RISK_CONFIG[currentRisk] || RISK_CONFIG.low;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f1f5f9; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.5);opacity:0.4;} }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:99px; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #f0f9ff 0%, #f1f5f9 50%, #f0fdf4 100%)" }}>

        {/* ══ SIDEBAR ══ */}
        <aside style={{
          width: sidebarOpen ? 260 : 76, flexShrink: 0,
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          display: "flex", flexDirection: "column",
          transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden",
          position: "sticky", top: 0, height: "100vh",
          boxShadow: "4px 0 24px rgba(15, 23, 42, 0.15)",
        }}>
          {/* Logo */}
          <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
                boxShadow: "0 4px 16px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                cursor: "pointer",
              }} onClick={() => nav("/dashboard")}>🌿</div>
              {sidebarOpen && (
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 17, color: "white", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>CinnaPredict</div>
                  <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginTop: 2 }}>Advisory</div>
                </div>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "20px 12px" }}>
            {NAV_ITEMS.map(item => (
              <NavItem
                key={item.id}
                item={item}
                active={item.id === "advisory"}
                sidebarOpen={sidebarOpen}
                onClick={() => nav(item.path)}
              />
            ))}
          </nav>

          {/* Toggle + logout */}
          <div style={{ padding: "14px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => setSidebarOpen(s => !s)} style={{
              background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", color: "#64748b",
              fontSize: 18, padding: "10px", borderRadius: 10, textAlign: sidebarOpen ? "right" : "center",
            }}>
              {sidebarOpen ? "◀" : "▶"}
            </button>
            <button onClick={handleSignOut} style={{
              background: "none", border: "none", cursor: "pointer", color: "#64748b",
              fontSize: 13, fontWeight: 700, padding: "10px 14px", borderRadius: 10,
              textAlign: "left", display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>🚪</span>{sidebarOpen && "Sign Out"}
            </button>
          </div>
        </aside>

        {/* ══ MAIN CONTENT ══ */}
        <main style={{ flex: 1, overflowY: "auto", padding: "36px 40px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 900,
                color: "#0f172a", marginBottom: 6, letterSpacing: "-0.02em",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, border: "1.5px solid #86efac60",
                  boxShadow: "0 4px 16px rgba(22, 163, 74, 0.12)",
                }}>🛡️</span>
                Disease Advisory
              </h1>
              <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500, marginLeft: 56 }}>
                AI-powered RAG advisory for White Root Rot management
              </p>
            </div>
            <button onClick={() => nav("/dashboard")} style={{
              background: "linear-gradient(145deg, #ffffff, #f8fafc)", color: "#334155",
              border: "2px solid #e2e8f0", padding: "11px 22px", borderRadius: 14, fontSize: 14,
              fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
            }}>
              ← Back to Dashboard
            </button>
          </div>

          <div className="fade-up">

            {/* ══ INPUT CARD ══ */}
            <div style={{
              background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
              borderRadius: 24, padding: 28,
              border: "1.5px solid rgba(226, 232, 240, 0.8)",
              boxShadow: "0 8px 32px rgba(15, 23, 42, 0.06)",
              marginBottom: 28, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -40, right: -40, width: 120, height: 120,
                borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.05), transparent 70%)",
              }} />

              {/* Mode Toggle */}
              <div style={{
                display: "flex", gap: 10, marginBottom: 24,
                padding: 6, background: "#f1f5f9", borderRadius: 14,
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
                      color: advisoryMode === m.id ? "white" : "#64748b",
                      boxShadow: advisoryMode === m.id
                        ? "0 4px 16px rgba(16, 185, 129, 0.3)" : "none",
                      transition: "all 0.25s",
                    }}>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Input Fields */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, position: "relative", zIndex: 1 }}>
                {[
                  { label: "Soil pH", key: "soilPH", icon: "🧪", min: 3, max: 9, step: 0.1, color: "#8b5cf6" },
                  { label: "Soil Moisture", key: "soilMoistureVWC", icon: "💧", min: 0, max: 100, step: 1, color: "#3b82f6", unit: "%" },
                  { label: "Soil Temperature", key: "soilTempC", icon: "🌡️", min: 10, max: 50, step: 0.5, color: "#ea580c", unit: "°C" },
                ].map(field => {
                  const isRealtime = advisoryMode === "realtime";
                  const val = isRealtime ? MOCK_SENSOR[field.key] : manualInput[field.key];
                  return (
                    <div key={field.key}>
                      <label style={{
                        fontSize: 12, fontWeight: 800, color: "#334155", display: "block",
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
                          onChange={e => {
                            if (!isRealtime) {
                              setManualInput(p => ({ ...p, [field.key]: parseFloat(e.target.value) }));
                            }
                          }}
                          disabled={isRealtime}
                          style={inputStyle(isRealtime)}
                          onFocus={e => { if (!isRealtime) { e.currentTarget.style.borderColor = field.color; e.currentTarget.style.boxShadow = `0 0 0 4px ${field.color}15`; } }}
                          onBlur={e => { e.currentTarget.style.borderColor = isRealtime ? "#e2e8f0" : "#cbd5e1"; e.currentTarget.style.boxShadow = "none"; }}
                        />
                        {field.unit && (
                          <span style={{
                            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                            fontSize: 13, color: "#94a3b8", fontWeight: 700,
                          }}>{field.unit}</span>
                        )}
                      </div>
                      {isRealtime && (
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
                disabled={advisoryLoading}
                style={{
                  marginTop: 24, width: "100%", padding: "16px", borderRadius: 16,
                  border: "none",
                  background: advisoryLoading ? "#cbd5e1" : "linear-gradient(135deg, #10b981, #059669)",
                  color: "white", fontSize: 15, fontWeight: 800,
                  cursor: advisoryLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  boxShadow: advisoryLoading ? "none" : "0 8px 28px rgba(16, 185, 129, 0.35)",
                  transition: "all 0.25s",
                }}
              >
                {advisoryLoading ? (
                  <><div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTop: "2.5px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Generating Advisory...</>
                ) : (
                  <><span style={{ fontSize: 20 }}>🛡️</span> Generate Advisory Report</>
                )}
              </button>

              {advisoryError && (
                <div style={{
                  marginTop: 16, padding: "12px 16px", borderRadius: 12,
                  background: "#fef2f2", border: "1.5px solid #fecaca",
                  color: "#dc2626", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8,
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
                  background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                  borderRadius: 24, padding: 32,
                  border: `2px solid ${riskCfg.border}`,
                  boxShadow: `0 8px 32px ${riskCfg.color}12`,
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
                      <div style={{ fontSize: 15, color: "#475569", fontWeight: 600, marginTop: 8, maxWidth: 500, lineHeight: 1.6 }}>
                        {currentRisk === "critical" ? "URGENT: Critical conditions for White Root Rot detected. Immediate intervention is required to prevent tree loss."
                          : currentRisk === "high" ? "Favorable conditions for White Root Rot have been detected. Preventive measures should be taken immediately."
                          : currentRisk === "moderate" ? "Early warning signs detected. Take preventive action before conditions worsen."
                          : "Soil conditions are favorable. Continue routine monitoring and maintenance practices."}
                      </div>
                    </div>
                    <div style={{
                      background: riskCfg.bg, border: `2px solid ${riskCfg.border}`,
                      borderRadius: 20, padding: "24px 32px", textAlign: "center", minWidth: 160,
                      boxShadow: `0 4px 16px ${riskCfg.color}10`,
                    }}>
                      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                        Confidence
                      </div>
                      <div style={{
                        fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 900, color: riskCfg.color,
                      }}>
                        {(advisoryData.input_conditions.model_confidence * 100).toFixed(0)}%
                      </div>
                      <div style={{ width: "100%", height: 6, background: "#e2e8f0", borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
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
                    marginTop: 28, paddingTop: 28, borderTop: "1.5px solid #f1f5f9",
                  }}>
                    <ConditionCard
                      icon="🧪" label="Soil pH"
                      value={advisoryData.input_conditions.soil_pH}
                      color="#8b5cf6" optimal="5.5 – 6.5"
                    />
                    <ConditionCard
                      icon="💧" label="Moisture"
                      value={`${advisoryData.input_conditions.soil_moisture_percent}%`}
                      color="#3b82f6" optimal="< 60%"
                    />
                    <ConditionCard
                      icon="🌡️" label="Temperature"
                      value={`${advisoryData.input_conditions.temperature_c}°C`}
                      color="#ea580c" optimal="20 – 30°C"
                    />
                  </div>
                </div>

                {/* Two Column: Actions + Prevention */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* Immediate Actions */}
                  <div style={{
                    background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                    borderRadius: 24, padding: 28,
                    border: "1.5px solid rgba(226, 232, 240, 0.8)",
                    boxShadow: "0 8px 32px rgba(15, 23, 42, 0.06)",
                  }}>
                    <div style={{
                      fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 20,
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{
                        width: 36, height: 36, borderRadius: 12,
                        background: "linear-gradient(135deg, #fef2f2, #fecaca)",
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
                          index={i}
                          isCritical={action.toLowerCase().includes("critical") || action.toLowerCase().includes("stop") || action.toLowerCase().includes("urgent")}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preventive Measures */}
                  <div style={{
                    background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                    borderRadius: 24, padding: 28,
                    border: "1.5px solid rgba(226, 232, 240, 0.8)",
                    boxShadow: "0 8px 32px rgba(15, 23, 42, 0.06)",
                  }}>
                    <div style={{
                      fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 20,
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{
                        width: 36, height: 36, borderRadius: 12,
                        background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, border: "1.5px solid #86efac40",
                      }}>🌱</span>
                      Preventive Measures
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {advisoryData.preventive_measures.map((measure, i) => (
                        <div key={i} style={{
                          padding: "12px 16px", borderRadius: 12,
                          background: "white", border: "1.5px solid #f1f5f9",
                          display: "flex", alignItems: "flex-start", gap: 10,
                        }}>
                          <span style={{ fontSize: 14, color: "#10b981", flexShrink: 0, marginTop: 2 }}>•</span>
                          <span style={{ fontSize: 13, color: "#475569", fontWeight: 600, lineHeight: 1.6 }}>{measure}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Monitoring + Disclaimer */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
                  <div style={{
                    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                    borderRadius: 24, padding: 28,
                    border: "1.5px solid #bfdbfe60",
                    boxShadow: "0 8px 32px rgba(59, 130, 246, 0.08)",
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute", top: -30, right: -30, width: 100, height: 100,
                      borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)",
                    }} />
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1e40af", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
                      <span style={{
                        width: 36, height: 36, borderRadius: 12,
                        background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, border: "1.5px solid #93c5fd40",
                      }}>📅</span>
                      Monitoring Plan
                    </div>
                    <p style={{ fontSize: 15, color: "#1e3a8a", fontWeight: 700, lineHeight: 1.7, position: "relative", zIndex: 1 }}>
                      {advisoryData.monitoring_plan}
                    </p>
                  </div>

                  <div style={{
                    background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                    borderRadius: 24, padding: 28,
                    border: "1.5px solid rgba(226, 232, 240, 0.8)",
                    boxShadow: "0 8px 32px rgba(15, 23, 42, 0.06)",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        width: 36, height: 36, borderRadius: 12,
                        background: "linear-gradient(135deg, #fefce8, #fef9c3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, border: "1.5px solid #fde04740",
                      }}>📋</span>
                      Disclaimer
                    </div>
                    <p style={{ fontSize: 13, color: "#64748b", fontWeight: 600, lineHeight: 1.7 }}>
                      {advisoryData.disclaimer}
                    </p>
                  </div>
                </div>

                {/* KB Passages */}
                <details style={{
                  background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                  borderRadius: 24, padding: 28,
                  border: "1.5px solid rgba(226, 232, 240, 0.8)",
                  boxShadow: "0 8px 32px rgba(15, 23, 42, 0.06)",
                }}>
                  <summary style={{
                    fontSize: 14, fontWeight: 800, color: "#0f172a",
                    display: "flex", alignItems: "center", gap: 10,
                    cursor: "pointer", listStyle: "none",
                  }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 12,
                      background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, border: "1.5px solid #d1d5db40",
                    }}>📚</span>
                    Retrieved Knowledge Base Passages
                    <span style={{
                      marginLeft: "auto", fontSize: 11, color: "#94a3b8",
                      background: "#f1f5f9", padding: "4px 12px", borderRadius: 99, fontWeight: 700,
                    }}>
                      {advisoryData.retrieved_passages.length} passages
                    </span>
                  </summary>
                  <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                    {advisoryData.retrieved_passages.map((passage, i) => (
                      <div key={i} style={{
                        padding: "18px 20px", borderRadius: 16,
                        background: "white", border: "1.5px solid #f1f5f9",
                        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
                      }}>
                        <div style={{
                          fontSize: 11, fontWeight: 800, color: "#10b981",
                          textTransform: "uppercase", letterSpacing: "0.1em",
                          marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                          Passage {i + 1}
                        </div>
                        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.8, fontWeight: 500 }}>
                          {passage}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    marginTop: 16, paddingTop: 16, borderTop: "1.5px solid #f1f5f9",
                    fontSize: 12, color: "#94a3b8", fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span>📄</span> Sources: {advisoryData.sources.join(", ")}
                  </div>
                </details>

              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}