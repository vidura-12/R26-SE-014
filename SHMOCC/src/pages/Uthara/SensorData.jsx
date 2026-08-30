import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection, addDoc, getDocs, serverTimestamp,
} from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { db, rtdb } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:8000";

// ── score is removed from here — it comes from the model now ──
const RISK_CONFIG = {
  HIGH:   { color: "#e05252", bg: "#fff5f5", border: "#fca5a5", icon: "🚨", label: "High Risk"   },
  MEDIUM: { color: "#e08c52", bg: "#fff7ed", border: "#fed7aa", icon: "⚠️", label: "Medium Risk" },
  LOW:    { color: "#2d8a4e", bg: "#f2fdf5", border: "#86efac", icon: "✅", label: "Low Risk"    },
};

const ADVICE = {
  HIGH: [
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
  const lastVal = data[data.length - 1];
  const lx = W;
  const ly = H - ((lastVal - min) / range) * (H - 4) - 2;
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline points={area} fill={`url(#grad-${color.replace("#", "")})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3.5" fill={color} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Gauge — score is now a prop passed from model response ───────────────────
function RiskGauge({ score, riskLevel }) {
  const r = 72, cx = 90, cy = 92;
  const circumference = Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const cfg = RISK_CONFIG[riskLevel] || RISK_CONFIG.LOW;
  return (
    <svg width="180" height="110" viewBox="0 0 180 110">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#e0ede5" strokeWidth="13" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={cfg.color} strokeWidth="13" strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={circumference * (1 - pct)}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke 0.5s" }}
      />
      <text x={cx} y={cy - 14} textAnchor="middle" fontSize="30" fontWeight="800"
        fontFamily="'Playfair Display',serif" fill={cfg.color}>{score}</text>
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="11" fill="#9cb8a8">/ 100</text>
      <text x={cx} y={cy + 24} textAnchor="middle" fontSize="12" fontWeight="700"
        fill={cfg.color}>{cfg.label}</text>
    </svg>
  );
}

// ─── Sensor Card ──────────────────────────────────────────────────────────────
function SensorCard({ icon, label, value, unit, min, max, optimal, history, color }) {
  const safe = typeof value === "number" && !isNaN(value);
  const pct = safe ? Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100) : 0;
  const inOptimal = safe && value >= optimal[0] && value <= optimal[1];
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
              {safe ? value.toFixed(2) : "—"}<span style={{ fontSize: 13, fontWeight: 500, color: "#9cb8a8", marginLeft: 3 }}>{unit}</span>
            </div>
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
          background: inOptimal ? "#e8f5ed" : "#fff7ed",
          color: inOptimal ? "#1a5c2e" : "#e08c52",
          border: `1px solid ${inOptimal ? "#cde4d5" : "#fed7aa"}`,
          textTransform: "uppercase",
        }}>{safe ? (inOptimal ? "Optimal" : "Watch") : "No Data"}</span>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ height: 6, background: "#f0f7f2", borderRadius: 99, overflow: "hidden", position: "relative" }}>
          <div style={{
            position: "absolute", top: 0, height: "100%",
            left: `${((optimal[0] - min) / (max - min)) * 100}%`,
            width: `${((optimal[1] - optimal[0]) / (max - min)) * 100}%`,
            background: "rgba(44,138,78,0.18)", borderRadius: 99,
          }} />
          <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#b0c8ba" }}>
          <span>{min}{unit}</span>
          <span style={{ color: "#7aaa8a", fontWeight: 600 }}>Optimal: {optimal[0]}–{optimal[1]}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
      <Sparkline data={history?.length ? history : [value || 0]} color={color} height={36} />
    </div>
  );
}

// ─── History Row — score comes from saved confidence field ────────────────────
function HistoryRow({ row, index }) {
  const cfg = RISK_CONFIG[row.risk_level] || RISK_CONFIG.LOW;
  // Use saved confidence from Firestore; fall back to "—" if old records lack it
  const score = row.confidence ?? null;
  const source = row.source === "manual" ? "✏️" : "📡";
  return (
    <tr className="history-row" style={{ borderBottom: "1px solid #f2faf5", animation: `fadeUp 0.3s ${index * 0.05}s ease both` }}>
      <td style={{ padding: "13px 14px 13px 0", fontSize: 13, color: "#0f2d1a", fontWeight: 600 }}>
        {new Date(row.timestamp?.seconds ? row.timestamp.seconds * 1000 : row.timestamp).toLocaleString("en-LK", { dateStyle: "short", timeStyle: "short" })}
      </td>
      <td style={{ padding: "13px 14px 13px 0" }}>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: row.source === "manual" ? "#f2fdf5" : "#e8f5ed", color: row.source === "manual" ? "#5a8a6a" : "#1a5c2e", border: "1px solid #cde4d5", fontWeight: 600 }}>
          {source} {row.source === "manual" ? "Manual" : "Live"}
        </span>
      </td>
      <td style={{ padding: "13px 14px 13px 0", fontSize: 13, color: "#2a5c3a" }}>{row.soil_ph?.toFixed(2)}</td>
      <td style={{ padding: "13px 14px 13px 0", fontSize: 13, color: "#2a5c3a" }}>{row.soil_moisture?.toFixed(2)}%</td>
      <td style={{ padding: "13px 14px 13px 0", fontSize: 13, color: "#2a5c3a" }}>{row.soil_temp?.toFixed(2)}°C</td>
      <td style={{ padding: "13px 14px 13px 0" }}>
        {score !== null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 72, height: 6, background: "#e0ede5", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${score}%`, height: "100%", background: cfg.color, borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f2d1a" }}>{score}</span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "#b0c8ba" }}>—</span>
        )}
      </td>
      <td style={{ padding: "13px 0" }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          textTransform: "uppercase",
        }}>{cfg.icon} {row.risk_level}</span>
      </td>
    </tr>
  );
}

// ─── Sensor Input Row ─────────────────────────────────────────────────────────
function SensorInput({ label, fieldKey, value, min, max, step, unit, hint, onChange }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#1a5c2e" }}>{label}</label>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#0f2d1a", fontFamily: "'Playfair Display',serif" }}>
          {value.toFixed(2)}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(fieldKey, parseFloat(e.target.value))}
        style={{ marginBottom: 8 }}
      />
      <input
        type="number" min={min} max={max} step={step} value={value}
        onChange={e => onChange(fieldKey, parseFloat(e.target.value) || min)}
        style={{
          width: "100%", padding: "9px 14px", borderRadius: 10, fontSize: 14,
          border: "1.5px solid #cde4d5", outline: "none", background: "white",
          color: "#0f2d1a", boxSizing: "border-box", fontWeight: 600,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#b0c8ba", marginTop: 4 }}>
        {hint.map((h, i) => (
          <span key={i} style={i === 1 ? { color: "#7aaa8a", fontWeight: 600 } : {}}>{h}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Live Sensor Display Row ──────────────────────────────────────────────────
function LiveSensorRow({ label, value, unit, min, max, color, optimalLabel }) {
  const pct = value != null ? Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100) : 0;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#1a5c2e" }}>{label}</label>
        <span style={{ fontSize: 18, fontWeight: 800, color: "#0f2d1a", fontFamily: "'Playfair Display',serif" }}>
          {value != null ? `${value.toFixed(2)}${unit}` : "—"}
        </span>
      </div>
      <div style={{ height: 8, background: "#f0f7f2", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#b0c8ba", marginTop: 3 }}>
        <span>{min}{unit}</span>
        <span style={{ color: "#7aaa8a", fontWeight: 600 }}>{optimalLabel}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SensorData() {
  const nav = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [selectedDevice, setSelectedDevice] = useState(location.state?.device || null);
  const [devices, setDevices] = useState([]);

  const [liveData, setLiveData]             = useState(null);
  const [rtdbConnected, setRtdbConnected]   = useState(false);
  const [lastLiveUpdate, setLastLiveUpdate] = useState(null);

  const [mode, setMode] = useState("live");

  const [manualInputs, setManualInputs] = useState({
    Soil_pH: 5.8,
    Soil_Moisture_VWC: 32.0,
    Soil_Temp_C: 27.0,
  });

  const activeInputs = mode === "live" && liveData
    ? { Soil_pH: liveData.Soil_pH, Soil_Moisture_VWC: liveData.Soil_Moisture_VWC, Soil_Temp_C: liveData.Soil_Temp_C }
    : mode === "manual"
      ? manualInputs
      : null;

  // ── prediction now stores { level, confidence } ──────────────────────────
  const [prediction, setPrediction]     = useState(null); // { level: "HIGH"|"MEDIUM"|"LOW", confidence: 0-100 }
  const [predLoading, setPredLoading]   = useState(false);
  const [predError, setPredError]       = useState("");
  const [lastPredicted, setLastPredicted] = useState(null);

  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving]                 = useState(false);

  const [phHistory, setPhHistory]       = useState([]);
  const [moistHistory, setMoistHistory] = useState([]);
  const [tempHistory, setTempHistory]   = useState([]);

  const [autoPredict, setAutoPredict] = useState(false);
  const [countdown, setCountdown]     = useState(30);

  useEffect(() => {
    if (!currentUser) return;
    getDocs(collection(db, "users", currentUser.uid, "devices"))
      .then(snap => {
        const devs = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
        setDevices(devs);
        if (!selectedDevice && devs.length > 0) setSelectedDevice(devs[0]);
      })
      .catch(console.error);
  }, [currentUser]);

  useEffect(() => {
    if (!selectedDevice) return;
    const path = selectedDevice.rtdbPath || `/devices/${selectedDevice.deviceId}/sensorData`;
    const unsubscribe = onValue(ref(rtdb, path), (snap) => {
      if (snap.exists()) {
        const d = snap.val();
        setLiveData(d);
        setRtdbConnected(true);
        setLastLiveUpdate(new Date());
        setPhHistory(p    => [...p.slice(-6), d.Soil_pH]);
        setMoistHistory(p => [...p.slice(-6), d.Soil_Moisture_VWC]);
        setTempHistory(p  => [...p.slice(-6), d.Soil_Temp_C]);
      } else {
        setRtdbConnected(false);
      }
    }, () => setRtdbConnected(false));
    return () => unsubscribe();
  }, [selectedDevice]);

  const loadHistory = useCallback(async () => {
    if (!currentUser || !selectedDevice) return;
    setHistoryLoading(true);
    try {
      const snap = await getDocs(
        collection(db, "users", currentUser.uid, "devices", selectedDevice.firestoreId, "readings")
      );
      const rows = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setHistory(rows);
      if (rows.length >= 2) {
        const recent = rows.slice(0, 7).reverse();
        setPhHistory(recent.map(r => r.soil_ph));
        setMoistHistory(recent.map(r => r.soil_moisture));
        setTempHistory(recent.map(r => r.soil_temp));
      }
    } catch (e) { console.error(e); }
    finally { setHistoryLoading(false); }
  }, [currentUser, selectedDevice]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── runPrediction — reads confidence from API response ───────────────────
  const runPrediction = useCallback(async (vals) => {
    if (!vals) return;
    setPredLoading(true);
    setPredError("");
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Soil_pH:           vals.Soil_pH,
          Soil_Moisture_VWC: vals.Soil_Moisture_VWC,
          Soil_Temp_C:       vals.Soil_Temp_C,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      const level      = data.White_Root_Disease_Risk;
      const confidence = data.confidence ?? null; // integer 0–100 from backend

      setPrediction({ level, confidence });
      setLastPredicted(new Date());

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
              confidence,                // ← saved to Firestore so history shows real score
              source:        mode,
              timestamp:     serverTimestamp(),
            }
          );
          await loadHistory();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
      }
    } catch (err) {
      setPredError(`Could not reach backend: ${err.message}`);
    } finally {
      setPredLoading(false);
    }
  }, [selectedDevice, currentUser, loadHistory, mode]);

  useEffect(() => {
    if (!autoPredict) return;
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { runPrediction(activeInputs); return 30; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [autoPredict, activeInputs, runPrediction]);

  const updateManual = (key, val) =>
    setManualInputs(p => ({ ...p, [key]: val }));

  const cfg   = prediction ? RISK_CONFIG[prediction.level] : null;
  const score = prediction?.confidence ?? null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family:'Plus Jakarta Sans',sans-serif; box-sizing:border-box; margin:0; padding:0; }
        body { background:#f2faf5; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        @keyframes spin   { to{transform:rotate(360deg);} }
        @keyframes pulse  { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
        @keyframes popIn  { 0%{opacity:0;transform:scale(0.8);} 70%{transform:scale(1.04);} 100%{opacity:1;transform:scale(1);} }
        .fade-up   { animation:fadeUp 0.5s ease both; }
        .fade-up-1 { animation:fadeUp 0.5s 0.1s ease both; }
        .fade-up-2 { animation:fadeUp 0.5s 0.2s ease both; }
        .fade-up-3 { animation:fadeUp 0.5s 0.3s ease both; }
        .risk-pop  { animation:popIn 0.5s cubic-bezier(.34,1.56,.64,1) both; }
        .history-row:hover td { background:#f7fdf9; }
        input[type=range] { -webkit-appearance:none; width:100%; height:6px; border-radius:99px; background:#e0ede5; outline:none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:#2d8a4e; cursor:pointer; border:2px solid white; box-shadow:0 2px 8px rgba(44,138,78,0.4); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#cde4d5; border-radius:99px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f2faf5", padding: "32px 36px" }}>

        {/* ── Top Bar ── */}
        <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => nav("/dashboard")} style={{ background: "white", border: "1px solid #cde4d5", borderRadius: 10, padding: "8px 14px", fontSize: 13, color: "#1a5c2e", fontWeight: 600, cursor: "pointer" }}>
              ← Dashboard
            </button>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: "#0f2d1a" }}>
                📊 Sensor Data & Risk Prediction
              </h1>
              <p style={{ fontSize: 13, color: "#7aaa8a", marginTop: 2 }}>
                White Root Disease · XGBoost Model · {mode === "live" ? "Live ESP32 Feed" : "Manual Entry"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {devices.length > 1 && (
              <select value={selectedDevice?.firestoreId || ""} onChange={e => {
                const d = devices.find(x => x.firestoreId === e.target.value);
                setSelectedDevice(d); setPrediction(null); setLiveData(null); setRtdbConnected(false);
              }} style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #cde4d5", fontSize: 13, color: "#0f2d1a", background: "white", fontWeight: 600, cursor: "pointer" }}>
                {devices.map(d => <option key={d.firestoreId} value={d.firestoreId}>{d.name}</option>)}
              </select>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", padding: "8px 14px", borderRadius: 10, border: `1px solid ${rtdbConnected ? "#cde4d5" : "#fca5a5"}` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: rtdbConnected ? "#2d8a4e" : "#e05252", animation: rtdbConnected ? "pulse 1.5s infinite" : "none" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: rtdbConnected ? "#2d8a4e" : "#9cb8a8" }}>
                {rtdbConnected ? "ESP32 Live" : "No Signal"}
              </span>
            </div>

            <button onClick={() => { setAutoPredict(a => !a); setCountdown(30); }} style={{
              padding: "9px 16px", borderRadius: 10, border: "1.5px solid",
              borderColor: autoPredict ? "#2d8a4e" : "#cde4d5",
              background: autoPredict ? "#e8f5ed" : "white",
              color: autoPredict ? "#1a5c2e" : "#7aaa8a",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 7,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: autoPredict ? "#2d8a4e" : "#cde4d5", animation: autoPredict ? "pulse 1.5s infinite" : "none" }} />
              {autoPredict ? `Auto · ${countdown}s` : "Auto Predict"}
            </button>
          </div>
        </div>

        {/* Device pill */}
        {selectedDevice && (
          <div className="fade-up-1" style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "white", border: "1px solid rgba(44,138,78,0.15)", borderRadius: 12, padding: "10px 18px", marginBottom: 24, boxShadow: "0 2px 8px rgba(26,92,46,0.06)" }}>
            <div style={{ position: "relative" }}>
              <span style={{ fontSize: 22 }}>📡</span>
              <div style={{ position: "absolute", top: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: rtdbConnected ? "#2d8a4e" : "#e05252", border: "2px solid white" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f2d1a" }}>{selectedDevice.name}</div>
              <div style={{ fontSize: 12, color: "#7aaa8a" }}>📍 {selectedDevice.location} · ID: {selectedDevice.deviceId}</div>
            </div>
            {lastLiveUpdate && (
              <div style={{ marginLeft: 8, fontSize: 11, color: "#9cb8a8", borderLeft: "1px solid #e0ede5", paddingLeft: 12 }}>
                ESP32 last seen<br />
                <span style={{ fontWeight: 700, color: "#5a8a6a" }}>{lastLiveUpdate.toLocaleTimeString()}</span>
              </div>
            )}
            {lastPredicted && (
              <div style={{ marginLeft: 8, fontSize: 11, color: "#9cb8a8", borderLeft: "1px solid #e0ede5", paddingLeft: 12 }}>
                Last predicted<br />
                <span style={{ fontWeight: 700, color: "#5a8a6a" }}>{lastPredicted.toLocaleTimeString()}</span>
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

        <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 24, alignItems: "start" }}>

          {/* ══ LEFT PANEL ══ */}
          <div className="fade-up-1">

            {/* Mode Tabs */}
            <div style={{ background: "white", borderRadius: 16, padding: 6, display: "flex", gap: 4, marginBottom: 16, border: "1px solid rgba(44,138,78,0.1)", boxShadow: "0 2px 8px rgba(26,92,46,0.06)" }}>
              {[
                { val: "live",   icon: "📡", label: "Live ESP32 Data" },
                { val: "manual", icon: "✏️", label: "Manual Entry" },
              ].map(({ val, icon, label }) => (
                <button key={val} onClick={() => { setMode(val); setPrediction(null); }} style={{
                  flex: 1, padding: "11px 8px", borderRadius: 11, border: "none",
                  background: mode === val ? "linear-gradient(135deg,#2d8a4e,#1a5c2e)" : "transparent",
                  color: mode === val ? "white" : "#7aaa8a",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.25s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                }}>
                  <span>{icon}</span> {label}
                </button>
              ))}
            </div>

            {/* Input Card */}
            <div style={{ background: "white", borderRadius: 18, padding: "24px", border: "1px solid rgba(44,138,78,0.1)", boxShadow: "0 4px 18px rgba(26,92,46,0.08)", marginBottom: 16 }}>

              {mode === "live" && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#7aaa8a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                    📡 Real-Time ESP32 Readings
                  </div>

                  {!rtdbConnected && (
                    <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "14px 16px", marginBottom: 18, fontSize: 13, color: "#e08c52", lineHeight: 1.6 }}>
                      <strong>⏳ Waiting for ESP32...</strong><br />
                      Make sure your device is powered on and connected to WiFi.<br />
                      <span style={{ fontSize: 11, opacity: 0.8 }}>Data path: /devices/{selectedDevice?.deviceId}/sensorData</span>
                    </div>
                  )}

                  {rtdbConnected && liveData && (
                    <div style={{ background: "#e8f5ed", border: "1px solid #cde4d5", borderRadius: 10, padding: "10px 14px", marginBottom: 18, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1a5c2e", fontWeight: 600 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d8a4e", animation: "pulse 1.5s infinite" }} />
                      Live data streaming from ESP32
                    </div>
                  )}

                  <LiveSensorRow label="🧪 Soil pH" value={liveData?.Soil_pH} unit="" min={4.2} max={7.0} color="#7c5c2e" optimalLabel="Optimal: 5.0–6.5" />
                  <LiveSensorRow label="💧 Soil Moisture" value={liveData?.Soil_Moisture_VWC} unit="%" min={15} max={45} color="#3b82f6" optimalLabel="High risk: >31%" />
                  <LiveSensorRow label="🌡️ Soil Temperature" value={liveData?.Soil_Temp_C} unit="°C" min={18} max={36} color="#e08c52" optimalLabel="Peak risk: 25–30°C" />

                  <div style={{ marginTop: 20, padding: "12px 14px", background: "#f2fdf5", borderRadius: 10, border: "1px solid #cde4d5", fontSize: 12, color: "#2a5c3a", lineHeight: 1.6 }}>
                    💡 Values update automatically every time ESP32 sends data. Click <strong>Predict</strong> to run the model on the latest reading.
                  </div>
                </>
              )}

              {mode === "manual" && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#7aaa8a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                    ✏️ Enter Sensor Values Manually
                  </div>

                  <div style={{ padding: "10px 14px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, marginBottom: 18, fontSize: 12, color: "#e08c52", lineHeight: 1.6 }}>
                    📋 Use this mode to test specific values or enter readings from an offline sensor. Results are saved with a <strong>Manual</strong> tag in history.
                  </div>

                  <SensorInput
                    label="🧪 Soil pH" fieldKey="Soil_pH"
                    value={manualInputs.Soil_pH} min={4.2} max={7.0} step={0.01} unit=""
                    hint={["4.2 (acidic)", "Optimal: 5.0–6.5", "7.0 (alkaline)"]}
                    onChange={updateManual}
                  />
                  <SensorInput
                    label="💧 Soil Moisture (VWC%)" fieldKey="Soil_Moisture_VWC"
                    value={manualInputs.Soil_Moisture_VWC} min={15} max={45} step={0.1} unit="%"
                    hint={["15% (dry)", "High risk: >31%", "45% (saturated)"]}
                    onChange={updateManual}
                  />
                  <SensorInput
                    label="🌡️ Soil Temperature" fieldKey="Soil_Temp_C"
                    value={manualInputs.Soil_Temp_C} min={18} max={36} step={0.1} unit="°C"
                    hint={["18°C", "Peak risk: 25–30°C", "36°C"]}
                    onChange={updateManual}
                  />
                </>
              )}

              <button
                onClick={() => runPrediction(activeInputs)}
                disabled={predLoading || !selectedDevice || (mode === "live" && !liveData)}
                style={{
                  width: "100%", padding: "14px", borderRadius: 12, border: "none", marginTop: 8,
                  background: (predLoading || (mode === "live" && !liveData))
                    ? "#9cb8a8"
                    : "linear-gradient(135deg,#2d8a4e,#1a5c2e)",
                  color: "white", fontSize: 15, fontWeight: 700,
                  cursor: (predLoading || !selectedDevice || (mode === "live" && !liveData)) ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 20px rgba(44,138,78,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  transition: "all 0.3s",
                }}>
                {predLoading
                  ? <><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Predicting...</>
                  : `🤖 Run Prediction on ${mode === "live" ? "Live" : "Manual"} Data`}
              </button>

              {!selectedDevice && (
                <p style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#e05252" }}>Register a device first to save predictions</p>
              )}
              {mode === "live" && !liveData && (
                <p style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#e08c52" }}>Waiting for ESP32 to send data...</p>
              )}
            </div>

            {predError && (
              <div style={{ background: "#fff5f5", border: "1.5px solid #fca5a5", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "#e05252", lineHeight: 1.6 }}>
                <strong>⚠️ Backend Error</strong><br />
                {predError}<br />
                <span style={{ fontSize: 11, opacity: 0.8 }}>Run: <code>uvicorn main:app --reload</code></span>
              </div>
            )}
          </div>

          {/* ══ RIGHT PANEL ══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Risk Result */}
            {cfg ? (
              <div className="risk-pop" style={{ background: cfg.bg, borderRadius: 20, padding: "28px 32px", border: `2px solid ${cfg.border}`, boxShadow: `0 8px 32px ${cfg.color}22` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    XGBoost Prediction · {mode === "live" ? "📡 Live Data" : "✏️ Manual Entry"}
                  </div>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,0.6)", border: `1px solid ${cfg.border}`, color: cfg.color, fontWeight: 600 }}>
                    {lastPredicted?.toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    {/* Gauge now receives real confidence score from model */}
                    <RiskGauge score={score ?? 0} riskLevel={prediction.level} />
                    <div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>
                        {cfg.icon} {prediction.level}
                      </div>
                      <div style={{ fontSize: 14, color: cfg.color, opacity: 0.8, marginTop: 6, fontWeight: 500 }}>{cfg.label} · White Root Disease</div>
                      {/* Confidence label below risk level */}
                      {score !== null && (
                        <div style={{ fontSize: 12, color: cfg.color, opacity: 0.7, marginTop: 4 }}>
                          Model confidence: <strong>{score}%</strong>
                        </div>
                      )}
                      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {activeInputs && [
                          { label: "pH",       val: activeInputs.Soil_pH?.toFixed(2) },
                          { label: "Moisture", val: `${activeInputs.Soil_Moisture_VWC?.toFixed(1)}%` },
                          { label: "Temp",     val: `${activeInputs.Soil_Temp_C?.toFixed(1)}°C` },
                        ].map(({ label, val }) => (
                          <span key={label} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 99, background: "rgba(255,255,255,0.6)", border: `1px solid ${cfg.border}`, color: cfg.color, fontWeight: 600 }}>
                            {label}: {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Advisory */}
                  <div style={{ flex: 1, minWidth: 240, background: "rgba(255,255,255,0.65)", borderRadius: 14, padding: "16px 18px", border: `1px solid ${cfg.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>📋 Recommended Actions</div>
                    {ADVICE[prediction.level].map((tip, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: cfg.color, color: "white", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                        <span style={{ fontSize: 13, color: "#2a5c3a", lineHeight: 1.5 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", border: "2px dashed #cde4d5", textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🤖</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f2d1a", marginBottom: 8 }}>No Prediction Yet</div>
                <p style={{ fontSize: 14, color: "#7aaa8a", lineHeight: 1.6 }}>
                  {mode === "live"
                    ? rtdbConnected
                      ? "Live data is flowing ✅ — click Run Prediction to analyse it"
                      : "Switch to Manual Entry or wait for your ESP32 to connect"
                    : "Set your values using the sliders and click Run Prediction"}
                </p>
              </div>
            )}

            {/* Sensor Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              <SensorCard icon="🧪" label="Soil pH"
                value={activeInputs?.Soil_pH ?? NaN} unit=""
                min={4.2} max={7.0} optimal={[5.0, 6.5]}
                history={phHistory} color="#7c5c2e" />
              <SensorCard icon="💧" label="Soil Moisture"
                value={activeInputs?.Soil_Moisture_VWC ?? NaN} unit="%"
                min={15} max={45} optimal={[15, 30]}
                history={moistHistory} color="#3b82f6" />
              <SensorCard icon="🌡️" label="Soil Temp"
                value={activeInputs?.Soil_Temp_C ?? NaN} unit="°C"
                min={18} max={36} optimal={[18, 24]}
                history={tempHistory} color="#e08c52" />
            </div>
          </div>
        </div>

        {/* ── History Table ── */}
        <div className="fade-up-3" style={{ marginTop: 32, background: "white", borderRadius: 20, padding: "28px 32px", border: "1px solid rgba(44,138,78,0.1)", boxShadow: "0 4px 20px rgba(26,92,46,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f2d1a" }}>📋 Prediction History</div>
              <div style={{ fontSize: 13, color: "#7aaa8a", marginTop: 3 }}>
                All predictions saved for {selectedDevice?.name || "this device"} — Live & Manual entries tagged separately
              </div>
            </div>
            <button onClick={loadHistory} disabled={historyLoading} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #cde4d5", background: "white", color: "#1a5c2e", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {historyLoading
                ? <><div style={{ width: 13, height: 13, border: "2px solid #cde4d5", borderTop: "2px solid #2d8a4e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Loading</>
                : "🔄 Refresh"}
            </button>
          </div>

          {historyLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#7aaa8a" }}>
              <div style={{ width: 32, height: 32, border: "3px solid #cde4d5", borderTop: "3px solid #2d8a4e", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "#9cb8a8" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No predictions recorded yet</div>
              <div style={{ fontSize: 13 }}>Run your first prediction above to start building history</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f2faf5" }}>
                    {["Timestamp", "Source", "Soil pH", "Moisture (VWC%)", "Temperature (°C)", "Risk Score", "Risk Level"].map(h => (
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