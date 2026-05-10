import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection, addDoc, getDocs, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = "http://localhost:8000"; // your FastAPI backend

// ─── Risk config ──────────────────────────────────────────────────────────────
const RISK_CONFIG = {
  HIGH:   { color: "#e05252", bg: "#fff5f5", border: "#fca5a5", icon: "🚨", label: "High Risk",   score: 85 },
  MEDIUM: { color: "#e08c52", bg: "#fff7ed", border: "#fed7aa", icon: "⚠️", label: "Medium Risk", score: 55 },
  LOW:    { color: "#2d8a4e", bg: "#f2fdf5", border: "#86efac", icon: "✅", label: "Low Risk",    score: 20 },
};

const ADVICE = {
  HIGH:   [
    "Apply recommended fungicide immediately to affected zones.",
    "Improve soil drainage to reduce waterlogging around roots.",
    "Remove and destroy infected plant material promptly.",
    "Increase inspection frequency to every 2–3 days.",
  ],
  MEDIUM: [
    "Monitor root zones closely over the next 48 hours.",
    "Check soil drainage and correct if waterlogged.",
    "Consider preventive fungicide application as precaution.",
    "Avoid excess irrigation until soil moisture drops below 31% VWC.",
  ],
  LOW: [
    "Conditions are currently safe for your plantation.",
    "Maintain regular weekly monitoring schedule.",
    "Ensure continued good drainage practices.",
    "Record current readings as baseline for comparison.",
  ],
};

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color, height = 40 }) {
  if (!data || data.length < 2) return null;
  const W = 140, H = height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,${H} ` + pts + ` ${W},${H}`;
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline points={area} fill={`url(#grad-${color.replace("#","")})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Latest dot */}
      {(() => {
        const last = data[data.length - 1];
        const x = W;
        const y = H - ((last - min) / range) * (H - 4) - 2;
        return <circle cx={x} cy={y} r="3.5" fill={color} stroke="white" strokeWidth="1.5" />;
      })()}
    </svg>
  );
}

// ─── Gauge ────────────────────────────────────────────────────────────────────
function RiskGauge({ score, riskLevel }) {
  const r = 72, cx = 90, cy = 92;
  const circumference = Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const cfg = RISK_CONFIG[riskLevel] || RISK_CONFIG.LOW;
  return (
    <svg width="180" height="110" viewBox="0 0 180 110">
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
        fill="none" stroke="#e0ede5" strokeWidth="13" strokeLinecap="round" />
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
        fill="none" stroke={cfg.color} strokeWidth="13" strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={circumference * (1 - pct)}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke 0.5s" }}
      />
      <text x={cx} y={cy - 14} textAnchor="middle" fontSize="30" fontWeight="800"
        fontFamily="'Playfair Display',serif" fill={cfg.color}>{score}</text>
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="11" fill="#9cb8a8"
        fontFamily="'Plus Jakarta Sans',sans-serif">/ 100</text>
      <text x={cx} y={cy + 24} textAnchor="middle" fontSize="12" fontWeight="700"
        fill={cfg.color} fontFamily="'Plus Jakarta Sans',sans-serif">{cfg.label}</text>
    </svg>
  );
}

// ─── Sensor Value Card ────────────────────────────────────────────────────────
function SensorCard({ icon, label, value, unit, min, max, optimal, history, color }) {
  const pct = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  const inOptimal = value >= optimal[0] && value <= optimal[1];
  return (
    <div style={{
      background: "white", borderRadius: 18, padding: "20px 22px",
      border: `1px solid ${inOptimal ? "rgba(44,138,78,0.15)" : "rgba(224,140,82,0.25)"}`,
      boxShadow: "0 2px 14px rgba(26,92,46,0.07)", transition: "all 0.3s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(26,92,46,0.13)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 14px rgba(26,92,46,0.07)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9cb8a8", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f2d1a", fontFamily: "'Playfair Display',serif", lineHeight: 1.1 }}>
              {value.toFixed(2)}<span style={{ fontSize: 13, fontWeight: 500, color: "#9cb8a8", marginLeft: 3 }}>{unit}</span>
            </div>
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
          background: inOptimal ? "#e8f5ed" : "#fff7ed",
          color: inOptimal ? "#1a5c2e" : "#e08c52",
          border: `1px solid ${inOptimal ? "#cde4d5" : "#fed7aa"}`,
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>{inOptimal ? "Optimal" : "Watch"}</span>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ height: 6, background: "#f0f7f2", borderRadius: 99, overflow: "hidden", position: "relative" }}>
          {/* Optimal range band */}
          <div style={{
            position: "absolute", top: 0, height: "100%",
            left: `${((optimal[0]-min)/(max-min))*100}%`,
            width: `${((optimal[1]-optimal[0])/(max-min))*100}%`,
            background: "rgba(44,138,78,0.18)", borderRadius: 99,
          }}/>
          {/* Value bar */}
          <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1s ease" }}/>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#b0c8ba" }}>
          <span>{min}{unit}</span>
          <span style={{ color: "#7aaa8a", fontWeight: 600 }}>Optimal: {optimal[0]}–{optimal[1]}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>

      <Sparkline data={history} color={color} height={36} />
    </div>
  );
}

// ─── History Row ──────────────────────────────────────────────────────────────
function HistoryRow({ row, index }) {
  const cfg = RISK_CONFIG[row.risk_level] || RISK_CONFIG.LOW;
  return (
    <tr style={{ borderBottom: "1px solid #f2faf5", animation: `fadeUp 0.3s ${index * 0.05}s ease both` }}>
      <td style={{ padding: "13px 14px 13px 0", fontSize: 13, color: "#0f2d1a", fontWeight: 600 }}>
        {new Date(row.timestamp?.seconds ? row.timestamp.seconds * 1000 : row.timestamp).toLocaleString("en-LK", { dateStyle: "short", timeStyle: "short" })}
      </td>
      <td style={{ padding: "13px 14px 13px 0", fontSize: 13, color: "#2a5c3a" }}>{row.soil_ph?.toFixed(2)}</td>
      <td style={{ padding: "13px 14px 13px 0", fontSize: 13, color: "#2a5c3a" }}>{row.soil_moisture?.toFixed(2)}%</td>
      <td style={{ padding: "13px 14px 13px 0", fontSize: 13, color: "#2a5c3a" }}>{row.soil_temp?.toFixed(2)}°C</td>
      <td style={{ padding: "13px 14px 13px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 72, height: 6, background: "#e0ede5", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${cfg.score}%`, height: "100%", background: cfg.color, borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0f2d1a" }}>{cfg.score}</span>
        </div>
      </td>
      <td style={{ padding: "13px 0" }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>{cfg.icon} {row.risk_level}</span>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SensorData() {
  const nav = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  // Device passed from dashboard via router state, or pick first device
  const [selectedDevice, setSelectedDevice] = useState(location.state?.device || null);
  const [devices, setDevices] = useState([]);

  // Sensor input values (what user enters / comes from IoT)
  const [inputs, setInputs] = useState({ Soil_pH: 5.8, Soil_Moisture_VWC: 32.0, Soil_Temp_C: 27.0 });
  const [manualMode, setManualMode] = useState(false); // false = live/simulated, true = manual input

  // Prediction state
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState("");

  // History from Firestore
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Sparkline history per sensor
  const [phHistory, setPhHistory]       = useState([5.5, 5.6, 5.7, 5.8, 5.75, 5.82, 5.8]);
  const [moistHistory, setMoistHistory] = useState([28, 29.5, 31, 32.5, 31.8, 33.2, 32.0]);
  const [tempHistory, setTempHistory]   = useState([25.5, 26.2, 27.1, 26.8, 27.5, 27.2, 27.0]);

  // Auto-refresh timer
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown]     = useState(30);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [saving, setSaving]           = useState(false);

  // ── Load devices if none selected ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "users", currentUser.uid, "devices"));
        const devs = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
        setDevices(devs);
        if (!selectedDevice && devs.length > 0) setSelectedDevice(devs[0]);
      } catch (err) { console.error(err); }
    };
    load();
  }, [currentUser]);

  // ── Load history for selected device ───────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!currentUser || !selectedDevice) return;
    setHistoryLoading(true);
    try {
      const snap = await getDocs(
        collection(db, "users", currentUser.uid, "devices", selectedDevice.firestoreId, "readings")
      );
      const rows = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const at = a.timestamp?.seconds || 0;
          const bt = b.timestamp?.seconds || 0;
          return bt - at;
        });
      setHistory(rows);

      // Update sparklines from history
      if (rows.length >= 2) {
        const recent = rows.slice(0, 7).reverse();
        setPhHistory(recent.map(r => r.soil_ph || 5.8));
        setMoistHistory(recent.map(r => r.soil_moisture || 32));
        setTempHistory(recent.map(r => r.soil_temp || 27));
      }
    } catch (err) { console.error("History load error:", err); }
    finally { setHistoryLoading(false); }
  }, [currentUser, selectedDevice]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Simulate live sensor fluctuation ──────────────────────────────────────
  const simulateLive = useCallback(() => {
    if (manualMode) return;
    setInputs(prev => ({
      Soil_pH:           parseFloat((prev.Soil_pH + (Math.random() - 0.5) * 0.06).toFixed(2)),
      Soil_Moisture_VWC: parseFloat((prev.Soil_Moisture_VWC + (Math.random() - 0.5) * 0.8).toFixed(2)),
      Soil_Temp_C:       parseFloat((prev.Soil_Temp_C + (Math.random() - 0.5) * 0.4).toFixed(2)),
    }));
  }, [manualMode]);

  // ── Call FastAPI /predict ──────────────────────────────────────────────────
  const runPrediction = useCallback(async (vals = inputs) => {
    setPredLoading(true);
    setPredError("");
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Soil_pH:          vals.Soil_pH,
          Soil_Moisture_VWC: vals.Soil_Moisture_VWC,
          Soil_Temp_C:      vals.Soil_Temp_C,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const level = data.White_Root_Disease_Risk; // "HIGH" | "MEDIUM" | "LOW"
      setPrediction(level);
      setLastUpdated(new Date());

      // Update sparklines
      setPhHistory(p    => [...p.slice(-6), vals.Soil_pH]);
      setMoistHistory(p => [...p.slice(-6), vals.Soil_Moisture_VWC]);
      setTempHistory(p  => [...p.slice(-6), vals.Soil_Temp_C]);

      // Auto-save reading to Firestore
      if (selectedDevice && currentUser) {
        setSaving(true);
        try {
          await addDoc(
            collection(db, "users", currentUser.uid, "devices", selectedDevice.firestoreId, "readings"),
            {
              soil_ph:       vals.Soil_pH,
              soil_moisture: vals.Soil_Moisture_VWC,
              soil_temp:     vals.Soil_Temp_C,
              risk_level:    level,
              timestamp:     serverTimestamp(),
            }
          );
          await loadHistory();
        } catch (e) { console.error("Save error:", e); }
        finally { setSaving(false); }
      }
    } catch (err) {
      setPredError(`Could not reach backend: ${err.message}`);
    } finally {
      setPredLoading(false);
    }
  }, [inputs, selectedDevice, currentUser, loadHistory]);

  // ── Auto refresh every 30s ─────────────────────────────────────────────────
  useEffect(() => {
    if (!autoRefresh) return;
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          simulateLive();
          runPrediction();
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [autoRefresh, simulateLive, runPrediction]);

  const setInput = (key) => (e) =>
    setInputs(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }));

  const cfg = prediction ? RISK_CONFIG[prediction] : null;

  const inputFieldStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 15,
    border: "1.5px solid #cde4d5", outline: "none", background: "white",
    color: "#0f2d1a", boxSizing: "border-box", fontWeight: 600,
    fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f2faf5; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes pulse  { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
        @keyframes popIn  { 0%{opacity:0;transform:scale(0.8);} 70%{transform:scale(1.04);} 100%{opacity:1;transform:scale(1);} }
        .fade-up   { animation: fadeUp 0.5s ease both; }
        .fade-up-1 { animation: fadeUp 0.5s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.5s 0.2s ease both; }
        .fade-up-3 { animation: fadeUp 0.5s 0.3s ease both; }
        .risk-pop  { animation: popIn 0.5s cubic-bezier(.34,1.56,.64,1) both; }
        .history-row:hover td { background: #f7fdf9; }
        input[type=range] { -webkit-appearance:none; width:100%; height:6px; border-radius:99px; background:#e0ede5; outline:none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:#2d8a4e; cursor:pointer; border:2px solid white; box-shadow:0 2px 8px rgba(44,138,78,0.4); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#cde4d5; border-radius:99px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f2faf5", padding: "32px 36px" }}>

        {/* ── Top Bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }} className="fade-up">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => nav("/dashboard")} style={{ background: "white", border: "1px solid #cde4d5", borderRadius: 10, padding: "8px 14px", fontSize: 13, color: "#1a5c2e", fontWeight: 600, cursor: "pointer" }}>
              ← Dashboard
            </button>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: "#0f2d1a" }}>
                📊 Sensor Data & Risk Prediction
              </h1>
              <p style={{ fontSize: 13, color: "#7aaa8a", marginTop: 2 }}>
                White Root Disease Risk · XGBoost Model · FastAPI Backend
              </p>
            </div>
          </div>

          {/* Device Selector */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {devices.length > 1 && (
              <select
                value={selectedDevice?.firestoreId || ""}
                onChange={e => {
                  const d = devices.find(x => x.firestoreId === e.target.value);
                  setSelectedDevice(d);
                  setPrediction(null);
                }}
                style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #cde4d5", fontSize: 13, color: "#0f2d1a", background: "white", cursor: "pointer", fontWeight: 600 }}
              >
                {devices.map(d => <option key={d.firestoreId} value={d.firestoreId}>{d.name}</option>)}
              </select>
            )}

            {/* Auto-refresh toggle */}
            <button
              onClick={() => { setAutoRefresh(a => !a); setCountdown(30); }}
              style={{
                padding: "9px 16px", borderRadius: 10, border: "1.5px solid",
                borderColor: autoRefresh ? "#2d8a4e" : "#cde4d5",
                background: autoRefresh ? "#e8f5ed" : "white",
                color: autoRefresh ? "#1a5c2e" : "#7aaa8a",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 7,
              }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: autoRefresh ? "#2d8a4e" : "#cde4d5", animation: autoRefresh ? "pulse 1.5s infinite" : "none" }} />
              {autoRefresh ? `Auto · ${countdown}s` : "Auto Refresh"}
            </button>
          </div>
        </div>

        {/* Device info pill */}
        {selectedDevice && (
          <div className="fade-up-1" style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "white", border: "1px solid rgba(44,138,78,0.15)", borderRadius: 12, padding: "10px 18px", marginBottom: 24, boxShadow: "0 2px 8px rgba(26,92,46,0.06)" }}>
            <div style={{ position: "relative" }}>
              <span style={{ fontSize: 22 }}>📡</span>
              <div style={{ position: "absolute", top: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: selectedDevice.status === "online" ? "#2d8a4e" : "#e05252", border: "2px solid white" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f2d1a" }}>{selectedDevice.name}</div>
              <div style={{ fontSize: 12, color: "#7aaa8a" }}>📍 {selectedDevice.location} · {selectedDevice.type}</div>
            </div>
            {lastUpdated && (
              <div style={{ marginLeft: 8, fontSize: 11, color: "#9cb8a8", borderLeft: "1px solid #e0ede5", paddingLeft: 12 }}>
                Last prediction<br/>
                <span style={{ fontWeight: 700, color: "#5a8a6a" }}>{lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
            {saving && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#2d8a4e" }}>
                <div style={{ width: 12, height: 12, border: "2px solid #cde4d5", borderTop: "2px solid #2d8a4e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Saving...
              </div>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, alignItems: "start" }}>

          {/* ── LEFT: Input Panel ── */}
          <div className="fade-up-1">
            {/* Mode toggle */}
            <div style={{ background: "white", borderRadius: 16, padding: "6px", display: "flex", gap: 4, marginBottom: 16, border: "1px solid rgba(44,138,78,0.1)" }}>
              {[
                { val: false, label: "🔴 Live Simulation" },
                { val: true,  label: "✏️ Manual Input" },
              ].map(({ val, label }) => (
                <button key={String(val)} onClick={() => setManualMode(val)} style={{
                  flex: 1, padding: "9px", borderRadius: 10, border: "none",
                  background: manualMode === val ? "linear-gradient(135deg,#2d8a4e,#1a5c2e)" : "transparent",
                  color: manualMode === val ? "white" : "#7aaa8a",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                }}>{label}</button>
              ))}
            </div>

            {/* Input card */}
            <div style={{ background: "white", borderRadius: 18, padding: "24px", border: "1px solid rgba(44,138,78,0.1)", boxShadow: "0 4px 18px rgba(26,92,46,0.08)", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#7aaa8a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>
                🌱 Sensor Readings
              </div>

              {/* Soil pH */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#1a5c2e" }}>🧪 Soil pH</label>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#0f2d1a", fontFamily: "'Playfair Display',serif" }}>{inputs.Soil_pH.toFixed(2)}</span>
                </div>
                {manualMode ? (
                  <input type="number" step="0.01" min="4.2" max="7.0" value={inputs.Soil_pH} onChange={setInput("Soil_pH")} style={inputFieldStyle} />
                ) : (
                  <input type="range" min="4.2" max="7.0" step="0.01" value={inputs.Soil_pH}
                    onChange={e => setInputs(p => ({ ...p, Soil_pH: parseFloat(e.target.value) }))} />
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#b0c8ba", marginTop: 4 }}>
                  <span>4.2 (acidic)</span>
                  <span style={{ color: "#7aaa8a", fontWeight: 600 }}>Optimal: 5.0–6.5</span>
                  <span>7.0 (alkaline)</span>
                </div>
              </div>

              {/* Soil Moisture */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#1a5c2e" }}>💧 Soil Moisture (VWC%)</label>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#0f2d1a", fontFamily: "'Playfair Display',serif" }}>{inputs.Soil_Moisture_VWC.toFixed(2)}%</span>
                </div>
                {manualMode ? (
                  <input type="number" step="0.1" min="15" max="45" value={inputs.Soil_Moisture_VWC} onChange={setInput("Soil_Moisture_VWC")} style={inputFieldStyle} />
                ) : (
                  <input type="range" min="15" max="45" step="0.1" value={inputs.Soil_Moisture_VWC}
                    onChange={e => setInputs(p => ({ ...p, Soil_Moisture_VWC: parseFloat(e.target.value) }))} />
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#b0c8ba", marginTop: 4 }}>
                  <span>15% (dry)</span>
                  <span style={{ color: "#7aaa8a", fontWeight: 600 }}>High risk: &gt;31%</span>
                  <span>45% (saturated)</span>
                </div>
              </div>

              {/* Soil Temperature */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#1a5c2e" }}>🌡️ Soil Temperature</label>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#0f2d1a", fontFamily: "'Playfair Display',serif" }}>{inputs.Soil_Temp_C.toFixed(2)}°C</span>
                </div>
                {manualMode ? (
                  <input type="number" step="0.1" min="18" max="36" value={inputs.Soil_Temp_C} onChange={setInput("Soil_Temp_C")} style={inputFieldStyle} />
                ) : (
                  <input type="range" min="18" max="36" step="0.1" value={inputs.Soil_Temp_C}
                    onChange={e => setInputs(p => ({ ...p, Soil_Temp_C: parseFloat(e.target.value) }))} />
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#b0c8ba", marginTop: 4 }}>
                  <span>18°C</span>
                  <span style={{ color: "#7aaa8a", fontWeight: 600 }}>Peak risk: 25–30°C</span>
                  <span>36°C</span>
                </div>
              </div>

              {/* Predict button */}
              <button
                onClick={() => runPrediction(inputs)}
                disabled={predLoading || !selectedDevice}
                style={{
                  width: "100%", padding: "14px", borderRadius: 12, border: "none",
                  background: predLoading ? "#9cb8a8" : "linear-gradient(135deg,#2d8a4e,#1a5c2e)",
                  color: "white", fontSize: 15, fontWeight: 700,
                  cursor: predLoading || !selectedDevice ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 20px rgba(44,138,78,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  transition: "all 0.3s",
                }}>
                {predLoading
                  ? <><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/> Predicting...</>
                  : "🤖 Run XGBoost Prediction"}
              </button>

              {!selectedDevice && (
                <p style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#e05252" }}>Register a device first to run predictions</p>
              )}
            </div>

            {/* Error */}
            {predError && (
              <div style={{ background: "#fff5f5", border: "1.5px solid #fca5a5", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "#e05252", lineHeight: 1.6 }}>
                <strong>⚠️ Backend Error</strong><br/>
                {predError}<br/>
                <span style={{ fontSize: 11, opacity: 0.8 }}>Make sure FastAPI is running: <code>uvicorn main:app --reload</code></span>
              </div>
            )}
          </div>

          {/* ── RIGHT: Results Panel ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Risk Result Card */}
            {cfg ? (
              <div className="risk-pop" style={{
                background: cfg.bg, borderRadius: 20, padding: "28px 32px",
                border: `2px solid ${cfg.border}`,
                boxShadow: `0 8px 32px ${cfg.color}22`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <RiskGauge score={cfg.score} riskLevel={prediction} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                        XGBoost Prediction Result
                      </div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>
                        {cfg.icon} {prediction}
                      </div>
                      <div style={{ fontSize: 14, color: cfg.color, opacity: 0.8, marginTop: 6, fontWeight: 500 }}>{cfg.label} · White Root Disease</div>
                      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {[
                          { label: "pH", val: inputs.Soil_pH.toFixed(2) },
                          { label: "Moisture", val: `${inputs.Soil_Moisture_VWC.toFixed(1)}%` },
                          { label: "Temp", val: `${inputs.Soil_Temp_C.toFixed(1)}°C` },
                        ].map(({ label, val }) => (
                          <span key={label} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 99, background: "rgba(255,255,255,0.6)", border: `1px solid ${cfg.border}`, color: cfg.color, fontWeight: 600 }}>
                            {label}: {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Advisory */}
                  <div style={{ flex: 1, minWidth: 240, background: "rgba(255,255,255,0.6)", borderRadius: 14, padding: "16px 18px", border: `1px solid ${cfg.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                      📋 Recommended Actions
                    </div>
                    {ADVICE[prediction].map((tip, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: cfg.color, color: "white", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i+1}</div>
                        <span style={{ fontSize: 13, color: "#2a5c3a", lineHeight: 1.5 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: "white", borderRadius: 20, padding: "40px", border: "2px dashed #cde4d5", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f2d1a", marginBottom: 8 }}>No Prediction Yet</div>
                <p style={{ fontSize: 14, color: "#7aaa8a" }}>Set your sensor values and click <strong>Run XGBoost Prediction</strong></p>
              </div>
            )}

            {/* 3 Sensor Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              <SensorCard icon="🧪" label="Soil pH" value={inputs.Soil_pH} unit=""
                min={4.2} max={7.0} optimal={[5.0, 6.5]}
                history={phHistory} color="#7c5c2e" />
              <SensorCard icon="💧" label="Soil Moisture" value={inputs.Soil_Moisture_VWC} unit="%"
                min={15} max={45} optimal={[15, 30]}
                history={moistHistory} color="#3b82f6" />
              <SensorCard icon="🌡️" label="Soil Temp" value={inputs.Soil_Temp_C} unit="°C"
                min={18} max={36} optimal={[18, 24]}
                history={tempHistory} color="#e08c52" />
            </div>
          </div>
        </div>

        {/* ── Reading History Table ── */}
        <div style={{ marginTop: 32, background: "white", borderRadius: 20, padding: "28px 32px", border: "1px solid rgba(44,138,78,0.1)", boxShadow: "0 4px 20px rgba(26,92,46,0.07)" }} className="fade-up-3">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f2d1a" }}>📋 Prediction History</div>
              <div style={{ fontSize: 13, color: "#7aaa8a", marginTop: 3 }}>All readings saved to Firestore for {selectedDevice?.name || "this device"}</div>
            </div>
            <button onClick={loadHistory} disabled={historyLoading} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #cde4d5", background: "white", color: "#1a5c2e", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {historyLoading
                ? <><div style={{ width: 13, height: 13, border: "2px solid #cde4d5", borderTop: "2px solid #2d8a4e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/> Loading</>
                : "🔄 Refresh"}
            </button>
          </div>

          {historyLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#7aaa8a", fontSize: 14 }}>
              <div style={{ width: 32, height: 32, border: "3px solid #cde4d5", borderTop: "3px solid #2d8a4e", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#9cb8a8" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No readings yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Run your first prediction to start recording history</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f2faf5" }}>
                    {["Timestamp", "Soil pH", "Moisture (VWC%)", "Temperature (°C)", "Risk Score", "Risk Level"].map(h => (
                      <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "#7aaa8a", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 12, paddingRight: 14 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, i) => <HistoryRow key={row.id} row={row} index={i} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}