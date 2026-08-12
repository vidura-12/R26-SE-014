import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

// ─── Sensor data that matches your FastAPI model inputs ─────────────────────
const MOCK_SENSOR = {
  soilPH: 5.9,
  soilMoistureVWC: 31.5,
  soilTempC: 27.0,
  humidity: 74.2,
  rainfall: 12.6,
  windSpeed: 9.1,
  uvIndex: 6.2,
};

const MOCK_HISTORY = [
  { date: "2025-05-08", risk: 82, temp: 29.1, humidity: 78, rainfall: 18.2, level: "High" },
  { date: "2025-05-07", risk: 67, temp: 27.8, humidity: 71, rainfall: 9.4,  level: "Medium" },
  { date: "2025-05-06", risk: 45, temp: 26.4, humidity: 65, rainfall: 3.1,  level: "Low" },
  { date: "2025-05-05", risk: 91, temp: 30.2, humidity: 83, rainfall: 24.7, level: "Critical" },
  { date: "2025-05-04", risk: 38, temp: 25.9, humidity: 60, rainfall: 1.2,  level: "Low" },
  { date: "2025-05-03", risk: 74, temp: 28.7, humidity: 76, rainfall: 14.5, level: "High" },
  { date: "2025-05-02", risk: 55, temp: 27.3, humidity: 68, rainfall: 6.8,  level: "Medium" },
];

const RISK_CONFIG = {
  Critical: { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", label: "Critical Risk", gradient: "linear-gradient(135deg, #dc2626, #b91c1c)" },
  High:     { color: "#ea580c", bg: "#fff7ed", border: "#fdba74", label: "High Risk",     gradient: "linear-gradient(135deg, #ea580c, #c2410c)" },
  Medium:   { color: "#ca8a04", bg: "#fefce8", border: "#fde047", label: "Medium Risk",   gradient: "linear-gradient(135deg, #ca8a04, #a16207)" },
  Low:      { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", label: "Low Risk",      gradient: "linear-gradient(135deg, #16a34a, #15803d)" },
};

const DISTRICTS = [
  "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha",
  "Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Kurunegala","Matara","Ratnapura",
];

const API_BASE_URL = "http://localhost:8000";

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  const W = 120, H = 36;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min || 1)) * H;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,${H} ` + pts + ` ${W},${H}`;
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline points={area} fill={`url(#grad-${color.replace('#','')})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Gauge ────────────────────────────────────────────────────────────────────
function RiskGauge({ score }) {
  const r = 70, cx = 90, cy = 90;
  const circumference = Math.PI * r;
  const pct = score / 100;
  const color = score >= 80 ? "#dc2626" : score >= 60 ? "#ea580c" : score >= 40 ? "#ca8a04" : "#16a34a";
  const label = score >= 80 ? "Critical" : score >= 60 ? "High" : score >= 40 ? "Medium" : "Low";
  const dashOffset = circumference * (1 - pct);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      <svg width="200" height="120" viewBox="0 0 200 120">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="40%" stopColor="#ca8a04" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s" }}
        />
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="36" fontWeight="900"
          fontFamily="'Playfair Display',serif" fill={color} style={{ textShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>{score}</text>
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="12" fill="#94a3b8"
          fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="600">/ 100</text>
        <text x={cx} y={cy + 28} textAnchor="middle" fontSize="14" fontWeight="800"
          fill={color} fontFamily="'Plus Jakarta Sans',sans-serif">{label}</text>
      </svg>
    </div>
  );
}

// ─── Probability Bars ─────────────────────────────────────────────────────────
function ProbabilityBars({ probabilities }) {
  if (!probabilities || Object.keys(probabilities).length === 0) return null;
  const levelOrder = ["Critical Risk", "High Risk", "Medium Risk", "Low Risk"];
  const levelShort = { "Critical Risk": "Critical", "High Risk": "High", "Medium Risk": "Medium", "Low Risk": "Low" };
  const levelColor = { "Critical Risk": "#dc2626", "High Risk": "#ea580c", "Medium Risk": "#ca8a04", "Low Risk": "#16a34a" };
  const levelBg    = { "Critical Risk": "#fef2f2", "High Risk": "#fff7ed", "Medium Risk": "#fefce8", "Low Risk": "#f0fdf4" };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
        Model Confidence Distribution
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {levelOrder.map(lvl => {
          const prob = probabilities[lvl] || 0;
          return (
            <div key={lvl} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", width: 56, textAlign: "right", letterSpacing: "0.02em" }}>{levelShort[lvl]}</span>
              <div style={{ flex: 1, height: 10, background: "#f1f5f9", borderRadius: 99, overflow: "hidden", position: "relative" }}>
                <div style={{
                  width: `${prob * 100}%`, height: "100%",
                  background: levelColor[lvl],
                  borderRadius: 99,
                  transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: prob > 0.3 ? `0 0 12px ${levelColor[lvl]}40` : "none",
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: levelColor[lvl], width: 44, textAlign: "right" }}>{(prob * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sensor Card ──────────────────────────────────────────────────────────────
function SensorCard({ icon, label, value, unit, sparkData, color, trend }) {
  return (
    <div style={{
      background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
      borderRadius: 20,
      padding: "22px 24px",
      border: "1px solid rgba(226, 232, 240, 0.8)",
      boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)",
      transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      overflow: "hidden",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(15, 23, 42, 0.1), 0 4px 12px rgba(15, 23, 42, 0.04)";
        e.currentTarget.style.borderColor = "rgba(203, 213, 225, 1)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)";
        e.currentTarget.style.borderColor = "rgba(226, 232, 240, 0.8)";
      }}
    >
      <div style={{
        position: "absolute", top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle at top right, ${color}12, transparent 70%)`,
        borderRadius: "0 20px 0 80px",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, position: "relative", zIndex: 1 }}>
        <div>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: `linear-gradient(135deg, ${color}18, ${color}08)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, marginBottom: 10,
            border: `1px solid ${color}20`,
          }}>{icon}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 800,
          color: trend >= 0 ? "#16a34a" : "#dc2626",
          background: trend >= 0 ? "#dcfce7" : "#fef2f2",
          padding: "4px 10px", borderRadius: 99,
          border: `1px solid ${trend >= 0 ? "#bbf7d0" : "#fecaca"}`,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {trend >= 0 ? "↗" : "↘"} {Math.abs(trend)}%
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", fontFamily: "'Playfair Display',serif", lineHeight: 1, position: "relative", zIndex: 1 }}>
        {value}<span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", marginLeft: 5 }}>{unit}</span>
      </div>
      <div style={{ marginTop: 14, position: "relative", zIndex: 1 }}>
        <Sparkline data={sparkData} color={color} />
      </div>
    </div>
  );
}

// ─── Device Card ──────────────────────────────────────────────────────────────
function DeviceCard({ device, onRemove, removeLoading, onEdit, onViewSensor }) {
  const isOnline = device.status === "online";
  const battColor = device.battery > 50 ? "#16a34a" : device.battery > 20 ? "#ca8a04" : "#dc2626";
  const battBg    = device.battery > 50 ? "#dcfce7" : device.battery > 20 ? "#fefce8" : "#fef2f2";
  return (
    <div style={{
      background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
      borderRadius: 20,
      padding: "22px 26px",
      border: `1.5px solid ${isOnline ? "rgba(22, 163, 74, 0.15)" : "rgba(220, 38, 38, 0.15)"}`,
      boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)",
      display: "flex", alignItems: "center", gap: 20,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      overflow: "hidden",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.03)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)";
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, width: 4, height: "100%",
        background: isOnline ? "linear-gradient(180deg, #16a34a, #22c55e)" : "linear-gradient(180deg, #dc2626, #ef4444)",
        borderRadius: "20px 0 0 20px",
      }} />
      <div style={{
        width: 52, height: 52, borderRadius: 16, flexShrink: 0,
        background: isOnline
          ? "linear-gradient(135deg, #dcfce7, #bbf7d0)"
          : "linear-gradient(135deg, #fef2f2, #fecaca)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
        position: "relative",
        border: `1.5px solid ${isOnline ? "#bbf7d0" : "#fecaca"}`,
        boxShadow: isOnline ? "0 4px 12px rgba(22, 163, 74, 0.15)" : "0 4px 12px rgba(220, 38, 38, 0.1)",
      }}>
        📡
        <div style={{
          position: "absolute", top: -3, right: -3, width: 14, height: 14,
          borderRadius: "50%", background: isOnline ? "#22c55e" : "#ef4444",
          border: "3px solid white",
          boxShadow: isOnline ? "0 0 0 3px rgba(34, 197, 94, 0.25), 0 2px 8px rgba(34, 197, 94, 0.3)" : "0 2px 8px rgba(239, 68, 68, 0.3)",
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.01em" }}>{device.name}</div>
        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>📍</span> {device.location} · <span style={{ color: "#94a3b8" }}>{device.lastSeen}</span>
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              width: `${device.battery}%`, height: "100%",
              background: `linear-gradient(90deg, ${battColor}, ${battColor}cc)`,
              borderRadius: 99,
              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: device.battery < 20 ? "0 0 8px rgba(220, 38, 38, 0.3)" : "none",
            }} />
          </div>
          <span style={{ fontSize: 12, color: battColor, fontWeight: 800, minWidth: 36, background: battBg, padding: "2px 8px", borderRadius: 99, border: `1px solid ${battColor}30` }}>{device.battery}%</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 800, padding: "5px 14px", borderRadius: 99,
          background: isOnline ? "#dcfce7" : "#fef2f2",
          color: isOnline ? "#15803d" : "#b91c1c",
          border: `1.5px solid ${isOnline ? "#bbf7d0" : "#fecaca"}`,
          textTransform: "uppercase", letterSpacing: "0.1em",
          textAlign: "center",
          boxShadow: isOnline ? "0 2px 8px rgba(22, 163, 74, 0.1)" : "0 2px 8px rgba(220, 38, 38, 0.08)",
        }}>{device.status}</span>
        <button
          onClick={() => onViewSensor(device)}
          style={{
            fontSize: 12, padding: "6px 14px", borderRadius: 10, cursor: "pointer",
            border: "1.5px solid #16a34a", background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
            color: "#15803d", fontWeight: 700,
            transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.1)",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, #bbf7d0, #dcfce7)"; e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, #dcfce7, #f0fdf4)"; e.currentTarget.style.transform = "scale(1)"; }}
        >📊 Sensor Data</button>
        <button
          onClick={() => onEdit(device)}
          style={{
            fontSize: 12, padding: "6px 14px", borderRadius: 10, cursor: "pointer",
            border: "1.5px solid #cbd5e1", background: "white",
            color: "#475569", fontWeight: 700,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.background = "#f8fafc"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "white"; }}
        >✏️ Edit</button>
        <button
          onClick={() => onRemove(device.firestoreId)}
          disabled={removeLoading}
          style={{
            fontSize: 12, padding: "6px 14px", borderRadius: 10,
            cursor: removeLoading ? "not-allowed" : "pointer",
            border: "1.5px solid #fecaca", background: "white", color: "#dc2626", fontWeight: 700,
            display: "flex", alignItems: "center", gap: 5, justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { if (!removeLoading) { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#fca5a5"; } }}
          onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#fecaca"; }}
        >
          {removeLoading
            ? <><div style={{ width:12,height:12,border:"2px solid #fecaca",borderTop:"2px solid #dc2626",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/> Removing</>
            : "🗑 Remove"}
        </button>
      </div>
    </div>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────
function RiskBadge({ level }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.Low;
  return (
    <span style={{
      fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 99,
      background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`,
      textTransform: "uppercase", letterSpacing: "0.08em",
      boxShadow: `0 2px 8px ${cfg.color}18`,
    }}>{level}</span>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const nav = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devicesError, setDevicesError] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [sensorData] = useState(MOCK_SENSOR);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [newDevice, setNewDevice] = useState({ name: "", deviceId: "", location: "", district: "", type: "Temperature & Humidity" });
  const [regErrors, setRegErrors] = useState({});
  const [regSuccess, setRegSuccess] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [removeLoadingId, setRemoveLoadingId] = useState(null);
  const [editDevice, setEditDevice] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState("Low");
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState("");
  const [probabilities, setProbabilities] = useState({});
  const [riskAdvice, setRiskAdvice] = useState("");

  const sparkPH       = [5.7, 5.8, 5.9, 6.0, 6.1, 5.9, 5.9];
  const sparkMoisture = [28, 30, 32, 31, 33, 31, 31];
  const sparkTemp     = [25.5, 26.2, 26.8, 27.1, 27.5, 27.0, 27.0];

  const currentRiskLevel = riskLevel;
  const riskCfg = RISK_CONFIG[currentRiskLevel] || RISK_CONFIG.Low;

  const filteredHistory = historyFilter === "all"
    ? MOCK_HISTORY
    : MOCK_HISTORY.filter(h => h.level.toLowerCase() === historyFilter);

  const fetchPrediction = async () => {
    setPredictionLoading(true);
    setPredictionError("");
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Soil_pH: sensorData.soilPH,
          Soil_Moisture_VWC: sensorData.soilMoistureVWC,
          Soil_Temp_C: sensorData.soilTempC,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const apiLevel = data.White_Root_Disease_Risk || "Low Risk";
      const shortLevel = apiLevel.replace(" Risk", "");
      const levelBase = { Low: 20, Medium: 45, High: 70, Critical: 90 };
      const base = levelBase[shortLevel] || 50;
      const conf = (data.confidence || 0) / 100;
      const score = Math.round(base + (conf * 15));

      setRiskScore(Math.min(100, Math.max(0, score)));
      setRiskLevel(shortLevel);
      setProbabilities(data.probabilities || {});

      const adviceMap = {
        Low:      "✅ Soil conditions are optimal. Continue routine monitoring.",
        Medium:   "⚠️ Slight stress detected. Monitor closely and consider early preventive measures.",
        High:     "⚠️ High humidity and temperature favor White Root Rot. Apply preventive fungicide.",
        Critical: "🚨 Critical conditions! Immediate intervention required — apply fungicide and improve drainage.",
      };
      setRiskAdvice(adviceMap[shortLevel] || adviceMap.Low);

    } catch (err) {
      console.error("Prediction error:", err);
      setPredictionError("Backend unreachable — showing fallback estimate.");
      setRiskScore(73);
      setRiskLevel("High");
      setProbabilities({ "High Risk": 0.73, "Medium Risk": 0.15, "Low Risk": 0.08, "Critical Risk": 0.04 });
      setRiskAdvice("⚠️ High humidity combined with recent rainfall increases Leaf Spot risk. Consider preventive fungicide application.");
    } finally {
      setPredictionLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchDevices = async () => {
      setDevicesLoading(true);
      setDevicesError("");
      try {
        const devicesRef = collection(db, "users", currentUser.uid, "devices");
        const snapshot = await getDocs(devicesRef);
        const fetched = snapshot.docs
          .map(d => ({ firestoreId: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setDevices(fetched);
      } catch (err) {
        console.error("Failed to load devices:", err);
        setDevicesError("Failed to load devices. Please refresh.");
      } finally {
        setDevicesLoading(false);
      }
    };
    fetchDevices();
  }, [currentUser]);

  const registerDevice = async () => {
    const errs = {};
    if (!newDevice.name.trim())     errs.name     = "Device name is required";
    if (!newDevice.deviceId.trim()) errs.deviceId = "Device ID is required";
    if (!newDevice.district)        errs.district = "Select a district";
    if (Object.keys(errs).length)   { setRegErrors(errs); return; }
    const duplicate = devices.find(d => d.deviceId === newDevice.deviceId.trim());
    if (duplicate) { setRegErrors({ deviceId: "A device with this ID is already registered." }); return; }
    setRegLoading(true);
    try {
      const deviceData = {
        name:          newDevice.name.trim(),
        deviceId:      newDevice.deviceId.trim(),
        rtdbPath:      `/devices/${newDevice.deviceId.trim()}/sensorData`,
        location:      newDevice.district + (newDevice.location ? " — " + newDevice.location : ""),
        district:      newDevice.district,
        fieldLocation: newDevice.location.trim(),
        type:          newDevice.type,
        status:        "online",
        battery:       100,
        lastSeen:      "just now",
        createdAt:     serverTimestamp(),
      };
      const devicesRef = collection(db, "users", currentUser.uid, "devices");
      const docRef = await addDoc(devicesRef, deviceData);
      setDevices(prev => [{ firestoreId: docRef.id, ...deviceData, createdAt: new Date() }, ...prev]);
      setRegSuccess(true);
      setTimeout(() => {
        setRegSuccess(false);
        setShowRegisterModal(false);
        setNewDevice({ name: "", deviceId: "", location: "", district: "", type: "Temperature & Humidity" });
        setActiveTab("devices");
      }, 1800);
    } catch (err) {
      console.error("Register error:", err);
      setRegErrors({ deviceId: "Failed to save. Check your connection and try again." });
    } finally {
      setRegLoading(false);
    }
  };

  const removeDevice = async (firestoreId) => {
    setRemoveLoadingId(firestoreId);
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "devices", firestoreId));
      setDevices(prev => prev.filter(d => d.firestoreId !== firestoreId));
    } catch (err) {
      console.error("Remove error:", err);
      alert("Failed to remove device. Please try again.");
    } finally {
      setRemoveLoadingId(null);
    }
  };

  const openEdit = (device) => {
    setEditDevice(device);
    setEditForm({
      name:          device.name || "",
      deviceId:      device.deviceId || "",
      district:      device.district || "",
      fieldLocation: device.fieldLocation || "",
      type:          device.type || "Temperature & Humidity",
      status:        device.status || "online",
    });
    setEditErrors({});
    setEditSuccess(false);
  };

  const saveEdit = async () => {
    const errs = {};
    if (!editForm.name.trim())     errs.name     = "Device name is required";
    if (!editForm.deviceId.trim()) errs.deviceId = "Device ID is required";
    if (!editForm.district)        errs.district = "Please select a district";
    if (Object.keys(errs).length)  { setEditErrors(errs); return; }
    setEditLoading(true);
    try {
      const deviceRef = doc(db, "users", currentUser.uid, "devices", editDevice.firestoreId);
      const updates = {
        name:          editForm.name.trim(),
        deviceId:      editForm.deviceId.trim(),
        district:      editForm.district,
        fieldLocation: editForm.fieldLocation.trim(),
        location:      editForm.district + (editForm.fieldLocation ? " — " + editForm.fieldLocation : ""),
        type:          editForm.type,
        status:        editForm.status,
        updatedAt:     serverTimestamp(),
      };
      await updateDoc(deviceRef, updates);
      setDevices(prev => prev.map(d =>
        d.firestoreId === editDevice.firestoreId ? { ...d, ...updates, updatedAt: new Date() } : d
      ));
      setEditSuccess(true);
      setTimeout(() => { setEditDevice(null); setEditSuccess(false); }, 1600);
    } catch (err) {
      console.error("Edit error:", err);
      setEditErrors({ name: "Failed to update. Please try again." });
    } finally {
      setEditLoading(false);
    }
  };

  const goToSensorData = (device) => {
    nav("/sensor-data", { state: { device } });
  };

  const handleSignOut = async () => {
    await signOut(auth);
    nav("/login");
  };

  const NAV_ITEMS = [
    { id: "overview",  icon: "🏠", label: "Overview" },
    { id: "devices",   icon: "📡", label: "Devices" },
    { id: "history",   icon: "📋", label: "History" },
  ];

  const inputStyle = (err) => ({
    width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14,
    border: `2px solid ${err ? "#fca5a5" : "#e2e8f0"}`, outline: "none",
    background: "#fafafa", color: "#0f172a", boxSizing: "border-box",
    fontFamily: "'Plus Jakarta Sans',sans-serif",
    transition: "all 0.2s",
  });

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
        @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .tab-btn { border:none; background:none; cursor:pointer; transition:all 0.25s; width:100%; text-align:left; }
        .tab-btn:hover { background:rgba(255,255,255,0.08); }
        .stat-card { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
        .modal-overlay { animation: fadeIn 0.25s ease; }
        select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:40px !important; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:99px; }
        .history-row:hover { background:#f8fafc !important; }
        .glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #f0f9ff 0%, #f1f5f9 50%, #f0fdf4 100%)" }}>

        {/* ── SIDEBAR ── */}
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
              }}>🌿</div>
              {sidebarOpen && (
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 17, color: "white", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>CinnaPredict</div>
                  <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginTop: 2 }}>Dashboard</div>
                </div>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "20px 12px" }}>
            {NAV_ITEMS.map((item, idx) => (
              <button key={item.id} className="tab-btn" onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 14px", borderRadius: 12, marginBottom: 6,
                  background: activeTab === item.id
                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))"
                    : "transparent",
                  borderLeft: activeTab === item.id ? "3px solid #10b981" : "3px solid transparent",
                  position: "relative",
                }}>
                {activeTab === item.id && (
                  <div style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    width: 6, height: 6, borderRadius: "50%", background: "#10b981",
                    boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)",
                  }} />
                )}
                <span style={{ fontSize: 20, flexShrink: 0, filter: activeTab === item.id ? "drop-shadow(0 2px 4px rgba(16,185,129,0.3))" : "none" }}>{item.icon}</span>
                {sidebarOpen && <span style={{ fontSize: 14, fontWeight: activeTab === item.id ? 800 : 600, color: activeTab === item.id ? "#fff" : "#94a3b8", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{item.label}</span>}
              </button>
            ))}

            <button className="tab-btn"
              onClick={() => {
                if (devices.length > 0) goToSensorData(devices[0]);
                else { setActiveTab("devices"); setShowRegisterModal(true); }
              }}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "13px 14px", borderRadius: 12, marginBottom: 6,
                background: "transparent",
                borderLeft: "3px solid transparent",
              }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>📊</span>
              {sidebarOpen && <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b", whiteSpace: "nowrap" }}>Sensor Data</span>}
            </button>
          </nav>

          {/* Register device button */}
          <div style={{ padding: "20px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={() => setShowRegisterModal(true)} style={{
              width: "100%", padding: "13px 14px", borderRadius: 12,
              border: "1.5px solid rgba(16, 185, 129, 0.4)",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08))",
              color: "#34d399", fontWeight: 800, fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              justifyContent: sidebarOpen ? "flex-start" : "center",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15))"; e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08))"; e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.4)"; }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>➕</span>
              {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>Register Device</span>}
            </button>
          </div>

          {/* Toggle + logout */}
          <div style={{ padding: "14px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => setSidebarOpen(s => !s)} style={{
              background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", color: "#64748b",
              fontSize: 18, padding: "10px", borderRadius: 10, textAlign: sidebarOpen ? "right" : "center",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94a3b8"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#64748b"; }}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
            <button onClick={handleSignOut} style={{
              background: "none", border: "none", cursor: "pointer", color: "#64748b",
              fontSize: 13, fontWeight: 700, padding: "10px 14px", borderRadius: 10,
              textAlign: "left", display: "flex", alignItems: "center", gap: 10,
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(220, 38, 38, 0.1)"; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#64748b"; }}
            >
              <span style={{ fontSize: 18 }}>🚪</span>{sidebarOpen && "Sign Out"}
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, overflowY: "auto", padding: "36px 40px" }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 900,
                color: "#0f172a", marginBottom: 6, letterSpacing: "-0.02em",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 28 }}>{NAV_ITEMS.find(n => n.id === activeTab)?.icon}</span>
                {NAV_ITEMS.find(n => n.id === activeTab)?.label}
              </h1>
              <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "linear-gradient(135deg, #ffffff, #f8fafc)",
                padding: "10px 18px", borderRadius: 14,
                border: "1.5px solid rgba(226, 232, 240, 0.8)",
                fontSize: 14, color: "#334155", fontWeight: 700,
                boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", animation: "pulse 2.5s infinite", boxShadow: "0 0 8px rgba(34, 197, 94, 0.4)" }} />
                {devices.filter(d => d.status === "online").length} devices online
              </div>
              <button onClick={() => setShowRegisterModal(true)} style={{
                background: "linear-gradient(135deg, #10b981, #059669)", color: "white",
                border: "none", padding: "11px 22px", borderRadius: 14, fontSize: 14,
                fontWeight: 800, cursor: "pointer",
                boxShadow: "0 6px 20px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                transition: "all 0.25s",
                display: "flex", alignItems: "center", gap: 8,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(16, 185, 129, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
              >
                <span style={{ fontSize: 18 }}>+</span> Register Device
              </button>
            </div>
          </div>

          {/* ══ OVERVIEW ══ */}
          {activeTab === "overview" && (
            <div className="fade-up">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 28 }}>
                {/* Risk gauge card */}
                <div style={{
                  background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                  borderRadius: 24, padding: 28,
                  border: `2px solid ${riskCfg.border}`,
                  boxShadow: `0 8px 32px ${riskCfg.color}12, 0 2px 8px rgba(15, 23, 42, 0.04)`,
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: -40, right: -40, width: 120, height: 120,
                    borderRadius: "50%", background: `radial-gradient(circle, ${riskCfg.color}12, transparent 70%)`,
                  }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, position: "relative", zIndex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.14em", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: riskCfg.color, boxShadow: `0 0 10px ${riskCfg.color}60` }} />
                      Current Disease Risk
                    </div>
                    {predictionLoading && (
                      <div style={{ width: 18, height: 18, border: "2.5px solid #e2e8f0", borderTop: "2.5px solid #10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    )}
                  </div>
                  <RiskGauge score={riskScore} />
                  <ProbabilityBars probabilities={probabilities} />
                  <div style={{
                    marginTop: 20, padding: "14px 18px",
                    background: riskCfg.bg, borderRadius: 14,
                    border: `1.5px solid ${riskCfg.border}`,
                    position: "relative", zIndex: 1,
                    boxShadow: `0 4px 16px ${riskCfg.color}10`,
                  }}>
                    <div style={{ fontSize: 13, color: riskCfg.color, fontWeight: 700, lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: -1 }}>{riskAdvice.split(" ")[0]}</span>
                      <span>{riskAdvice.split(" ").slice(1).join(" ")}</span>
                    </div>
                  </div>
                  {predictionError && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "#dc2626", fontWeight: 700, background: "#fef2f2", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #fecaca", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>⚠️</span> {predictionError}
                    </div>
                  )}
                  <button
                    onClick={fetchPrediction}
                    disabled={predictionLoading}
                    style={{
                      marginTop: 18, width: "100%", padding: "12px", borderRadius: 14,
                      border: "2px solid #e2e8f0", background: "linear-gradient(145deg, #ffffff, #f8fafc)", color: "#475569",
                      fontSize: 13, fontWeight: 800, cursor: predictionLoading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "all 0.2s",
                      boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                    }}
                    onMouseEnter={e => { if (!predictionLoading) { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#ffffff"; } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "linear-gradient(145deg, #ffffff, #f8fafc)"; }}
                  >
                    {predictionLoading ? (
                      <><div style={{ width: 14, height: 14, border: "2px solid #e2e8f0", borderTop: "2px solid #10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Refreshing...</>
                    ) : (
                      <><span style={{ fontSize: 16 }}>🔄</span> Refresh Prediction</>
                    )}
                  </button>
                </div>

                {/* Quick stats */}
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {[
                    { icon: "🧪", label: "Soil pH", val: sensorData.soilPH, unit: "", sub: "Acidic range", color: "#8b5cf6", bg: "#ede9fe" },
                    { icon: "💧", label: "Soil Moisture", val: `${sensorData.soilMoistureVWC}%`, unit: "VWC", sub: "Moderately wet", color: "#3b82f6", bg: "#dbeafe" },
                    { icon: "🌡️", label: "Soil Temperature", val: `${sensorData.soilTempC}°C`, unit: "", sub: "Above optimal", color: "#ea580c", bg: "#ffedd5" },
                  ].map(s => (
                    <div key={s.label} className="stat-card" style={{
                      background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                      borderRadius: 18, padding: "18px 22px",
                      border: "1.5px solid rgba(226, 232, 240, 0.8)",
                      boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)",
                      display: "flex", alignItems: "center", gap: 16,
                      transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative", overflow: "hidden",
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.boxShadow = "0 12px 40px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.03)";
                        e.currentTarget.style.borderColor = `${s.color}30`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 20px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)";
                        e.currentTarget.style.borderColor = "rgba(226, 232, 240, 0.8)";
                      }}
                    >
                      <div style={{
                        width: 52, height: 52, borderRadius: 16,
                        background: `linear-gradient(135deg, ${s.bg}, ${s.color}10)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24, flexShrink: 0,
                        border: `1.5px solid ${s.color}25`,
                        boxShadow: `0 4px 16px ${s.color}15`,
                      }}>{s.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", fontFamily: "'Playfair Display',serif", letterSpacing: "-0.02em" }}>{s.val}</div>
                        <div style={{ fontSize: 12, color: s.color, fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: s.color }} />
                          {s.sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Device summary */}
                <div style={{
                  background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                  borderRadius: 24, padding: 28,
                  border: "1.5px solid rgba(226, 232, 240, 0.8)",
                  boxShadow: "0 8px 32px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.02)",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: -30, right: -30, width: 100, height: 100,
                    borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.06), transparent 70%)",
                  }} />
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, position: "relative", zIndex: 1 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px rgba(16,185,129,0.4)" }} />
                    Device Overview
                  </div>
                  {[
                    { label: "Total Devices", val: devices.length, color: "#0f172a", icon: "📡" },
                    { label: "Online", val: devices.filter(d => d.status === "online").length, color: "#16a34a", icon: "🟢" },
                    { label: "Offline", val: devices.filter(d => d.status === "offline").length, color: "#dc2626", icon: "🔴" },
                    { label: "Low Battery", val: devices.filter(d => d.battery < 20).length, color: "#ca8a04", icon: "🔋" },
                  ].map(s => (
                    <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9", position: "relative", zIndex: 1 }}>
                      <span style={{ fontSize: 14, color: "#475569", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14 }}>{s.icon}</span> {s.label}
                      </span>
                      <span style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: "'Playfair Display',serif", letterSpacing: "-0.02em" }}>{s.val}</span>
                    </div>
                  ))}
                  <button onClick={() => setActiveTab("devices")} style={{
                    marginTop: 20, width: "100%", padding: "12px", borderRadius: 14,
                    border: "2px solid #e2e8f0", background: "linear-gradient(145deg, #ffffff, #f8fafc)",
                    color: "#334155", fontSize: 14, fontWeight: 800, cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#ffffff"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "linear-gradient(145deg, #ffffff, #f8fafc)"; }}
                  >
                    Manage Devices <span style={{ fontSize: 16 }}>→</span>
                  </button>
                </div>
              </div>

              {/* Sensor Data quick-access cards */}
              {devices.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 18, display: "flex", alignItems: "center", gap: 10, letterSpacing: "-0.01em" }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 12,
                      background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, border: "1.5px solid #93c5fd40",
                    }}>📊</span>
                    Live Sensor Monitoring
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
                    {devices.map(device => (
                      <div key={device.firestoreId}
                        onClick={() => goToSensorData(device)}
                        style={{
                          background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                          borderRadius: 20, padding: "22px 24px",
                          border: "1.5px solid rgba(226, 232, 240, 0.8)",
                          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)",
                          cursor: "pointer",
                          transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                          position: "relative", overflow: "hidden",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 16px 48px rgba(15, 23, 42, 0.1), 0 4px 12px rgba(15, 23, 42, 0.04)";
                          e.currentTarget.style.borderColor = "#10b98140";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = "";
                          e.currentTarget.style.boxShadow = "0 4px 20px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)";
                          e.currentTarget.style.borderColor = "rgba(226, 232, 240, 0.8)";
                        }}
                      >
                        <div style={{
                          position: "absolute", top: -20, right: -20, width: 80, height: 80,
                          borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.06), transparent 70%)",
                        }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, position: "relative", zIndex: 1 }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22, position: "relative",
                            border: "1.5px solid #86efac60",
                            boxShadow: "0 4px 16px rgba(22, 163, 74, 0.12)",
                          }}>
                            📡
                            <div style={{
                              position: "absolute", top: -2, right: -2, width: 12, height: 12,
                              borderRadius: "50%", background: device.status === "online" ? "#22c55e" : "#ef4444",
                              border: "3px solid white",
                              boxShadow: device.status === "online" ? "0 0 8px rgba(34, 197, 94, 0.4)" : "0 0 8px rgba(239, 68, 68, 0.4)",
                            }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", letterSpacing: "-0.01em" }}>{device.name}</div>
                            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ fontSize: 13 }}>📍</span> {device.location}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          padding: "12px 18px",
                          background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                          borderRadius: 14,
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          border: "1.5px solid #bbf7d040",
                          position: "relative", zIndex: 1,
                        }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "#15803d" }}>Open Sensor Data</span>
                          <span style={{ fontSize: 20, color: "#16a34a" }}>→</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Input Sensor Cards */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 18, display: "flex", alignItems: "center", gap: 10, letterSpacing: "-0.01em" }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, border: "1.5px solid #86efac40",
                  }}>🌱</span>
                  White Root Rot — Model Inputs
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
                  <SensorCard
                    icon="🧪" label="Soil pH"
                    value={sensorData.soilPH} unit=""
                    sparkData={sparkPH} color="#8b5cf6" trend={-1.2}
                  />
                  <SensorCard
                    icon="💧" label="Soil Moisture"
                    value={sensorData.soilMoistureVWC} unit="% VWC"
                    sparkData={sparkMoisture} color="#3b82f6" trend={2.4}
                  />
                  <SensorCard
                    icon="🌡️" label="Soil Temperature"
                    value={sensorData.soilTempC} unit="°C"
                    sparkData={sparkTemp} color="#ea580c" trend={0.8}
                  />
                </div>
              </div>

              {/* Recent history */}
              <div style={{
                background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                borderRadius: 24, padding: 28,
                border: "1.5px solid rgba(226, 232, 240, 0.8)",
                boxShadow: "0 8px 32px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.02)",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -40, right: -40, width: 120, height: 120,
                  borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.05), transparent 70%)",
                }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 10, letterSpacing: "-0.01em" }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 12,
                      background: "linear-gradient(135deg, #fefce8, #fef9c3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, border: "1.5px solid #fde04740",
                    }}>📋</span>
                    Recent Risk History
                  </div>
                  <button onClick={() => setActiveTab("history")} style={{
                    fontSize: 13, color: "#10b981", fontWeight: 800, background: "none", border: "none",
                    cursor: "pointer", textDecoration: "none", padding: "8px 16px", borderRadius: 10,
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#f0fdf4"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                  >
                    View All →
                  </button>
                </div>
                <div style={{ overflowX: "auto", position: "relative", zIndex: 1 }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                    <thead>
                      <tr>
                        {["Date", "Risk Score", "Level", "Temp", "Humidity", "Rainfall"].map(h => (
                          <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 16px 8px 0" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_HISTORY.slice(0, 4).map(row => (
                        <tr key={row.date} className="history-row" style={{
                          background: "white",
                          borderRadius: 14,
                          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                        }}>
                          <td style={{ padding: "14px 16px 14px 18px", fontSize: 14, color: "#334155", fontWeight: 700, borderRadius: "14px 0 0 14px" }}>{row.date}</td>
                          <td style={{ padding: "14px 16px 14px 0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ flex: 1, maxWidth: 90, height: 7, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                                <div style={{
                                  width: `${row.risk}%`, height: "100%",
                                  background: row.risk >= 80 ? "linear-gradient(90deg, #dc2626, #ef4444)" : row.risk >= 60 ? "linear-gradient(90deg, #ea580c, #f97316)" : row.risk >= 40 ? "linear-gradient(90deg, #ca8a04, #eab308)" : "linear-gradient(90deg, #16a34a, #22c55e)",
                                  borderRadius: 99,
                                  boxShadow: row.risk >= 60 ? `0 0 10px ${row.risk >= 80 ? '#dc2626' : '#ea580c'}30` : "none",
                                }} />
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", fontFamily: "'Playfair Display',serif" }}>{row.risk}</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px 14px 0" }}><RiskBadge level={row.level} /></td>
                          <td style={{ padding: "14px 16px 14px 0", fontSize: 14, color: "#475569", fontWeight: 600 }}>{row.temp}°C</td>
                          <td style={{ padding: "14px 16px 14px 0", fontSize: 14, color: "#475569", fontWeight: 600 }}>{row.humidity}%</td>
                          <td style={{ padding: "14px 18px 14px 0", fontSize: 14, color: "#475569", fontWeight: 600, borderRadius: "0 14px 14px 0" }}>{row.rainfall} mm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ DEVICES ══ */}
          {activeTab === "devices" && (
            <div className="fade-up">
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 24, padding: "18px 24px",
                background: "linear-gradient(145deg, #ffffff, #f8fafc)",
                borderRadius: 18, border: "1.5px solid rgba(226, 232, 240, 0.8)",
                boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
              }}>
                <div style={{ fontSize: 15, color: "#64748b", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, border: "1.5px solid #93c5fd40",
                  }}>📡</span>
                  {devices.length} device{devices.length !== 1 ? "s" : ""} registered
                </div>
                <button onClick={() => setShowRegisterModal(true)} style={{
                  background: "linear-gradient(135deg, #10b981, #059669)", color: "white",
                  border: "none", padding: "11px 22px", borderRadius: 14, fontSize: 14,
                  fontWeight: 800, cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                  transition: "all 0.25s",
                  display: "flex", alignItems: "center", gap: 8,
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
                >
                  <span style={{ fontSize: 18 }}>+</span> Register New Device
                </button>
              </div>
              {devicesLoading ? (
                <div style={{
                  textAlign: "center", padding: "64px 24px",
                  background: "linear-gradient(145deg, #ffffff, #f8fafc)",
                  borderRadius: 24, border: "1.5px solid rgba(226, 232, 240, 0.8)",
                  boxShadow: "0 8px 32px rgba(15, 23, 42, 0.04)",
                }}>
                  <div style={{
                    width: 44, height: 44, border: "3.5px solid #e2e8f0", borderTop: "3.5px solid #10b981",
                    borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px",
                    boxShadow: "0 0 16px rgba(16, 185, 129, 0.2)",
                  }}/>
                  <p style={{ fontSize: 15, color: "#64748b", fontWeight: 700 }}>Loading your devices...</p>
                </div>
              ) : devicesError ? (
                <div style={{
                  textAlign: "center", padding: "48px 24px",
                  background: "linear-gradient(145deg, #fef2f2, #fff5f5)",
                  borderRadius: 24, border: "2px solid #fecaca",
                  boxShadow: "0 8px 32px rgba(220, 38, 38, 0.06)",
                }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                  <p style={{ fontSize: 15, color: "#dc2626", fontWeight: 800 }}>{devicesError}</p>
                </div>
              ) : devices.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "80px 24px",
                  background: "linear-gradient(145deg, #ffffff, #f8fafc)",
                  borderRadius: 24, border: "2px dashed #cbd5e1",
                  boxShadow: "0 8px 32px rgba(15, 23, 42, 0.04)",
                }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: 24,
                    background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 40, margin: "0 auto 20px",
                    border: "2px dashed #93c5fd60",
                  }}>📡</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", marginBottom: 10, letterSpacing: "-0.01em" }}>No devices registered yet</div>
                  <p style={{ fontSize: 15, color: "#64748b", marginBottom: 28, fontWeight: 500 }}>Register your first sensor to start monitoring your plantation</p>
                  <button onClick={() => setShowRegisterModal(true)} style={{
                    background: "linear-gradient(135deg, #10b981, #059669)", color: "white",
                    border: "none", padding: "14px 32px", borderRadius: 14, fontSize: 15,
                    fontWeight: 800, cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                    transition: "all 0.25s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(16, 185, 129, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
                  >
                    Register First Device
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {devices.map(d => (
                    <DeviceCard
                      key={d.firestoreId || d.deviceId}
                      device={d}
                      onRemove={removeDevice}
                      removeLoading={removeLoadingId === d.firestoreId}
                      onEdit={openEdit}
                      onViewSensor={goToSensorData}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ HISTORY ══ */}
          {activeTab === "history" && (
            <div className="fade-up">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 28 }}>
                {[
                  { label: "Avg Risk Score", val: "65", icon: "📊", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
                  { label: "Critical Days", val: MOCK_HISTORY.filter(h => h.level === "Critical").length, icon: "🚨", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
                  { label: "High Risk Days", val: MOCK_HISTORY.filter(h => h.level === "High").length, icon: "⚠️", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
                  { label: "Safe Days", val: MOCK_HISTORY.filter(h => h.level === "Low").length, icon: "✅", color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
                ].map(s => (
                  <div key={s.label} style={{
                    background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                    borderRadius: 20, padding: "22px 24px",
                    border: `1.5px solid ${s.border}`,
                    boxShadow: `0 8px 24px ${s.color}10, 0 2px 8px rgba(15, 23, 42, 0.03)`,
                    position: "relative", overflow: "hidden",
                    transition: "all 0.3s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 16px 40px ${s.color}18, 0 4px 12px rgba(15, 23, 42, 0.05)`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}10, 0 2px 8px rgba(15, 23, 42, 0.03)`; }}
                  >
                    <div style={{
                      position: "absolute", top: -20, right: -20, width: 80, height: 80,
                      borderRadius: "50%", background: `radial-gradient(circle, ${s.color}08, transparent 70%)`,
                    }} />
                    <div style={{ fontSize: 28, marginBottom: 12, position: "relative", zIndex: 1 }}>{s.icon}</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: s.color, fontFamily: "'Playfair Display',serif", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6, position: "relative", zIndex: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{
                background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                borderRadius: 24, padding: 32,
                border: "1.5px solid rgba(226, 232, 240, 0.8)",
                boxShadow: "0 8px 32px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.02)",
              }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
                  {["all", "critical", "high", "medium", "low"].map(f => (
                    <button key={f} onClick={() => setHistoryFilter(f)} style={{
                      padding: "9px 20px", borderRadius: 99, fontSize: 13, fontWeight: 800, cursor: "pointer",
                      border: "2px solid",
                      background: historyFilter === f ? (f === "critical" ? "#dc2626" : f === "high" ? "#ea580c" : f === "medium" ? "#ca8a04" : f === "low" ? "#16a34a" : "#0f172a") : "white",
                      borderColor: f === "critical" ? "#dc2626" : f === "high" ? "#ea580c" : f === "medium" ? "#ca8a04" : f === "low" ? "#16a34a" : "#e2e8f0",
                      color: historyFilter === f ? "white" : "#475569",
                      transition: "all 0.2s",
                      boxShadow: historyFilter === f ? `0 4px 16px ${f === "critical" ? "#dc2626" : f === "high" ? "#ea580c" : f === "medium" ? "#ca8a04" : f === "low" ? "#16a34a" : "#0f172a"}30` : "none",
                    }}
                      onMouseEnter={e => { if (historyFilter !== f) { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; } }}
                      onMouseLeave={e => { if (historyFilter !== f) { e.currentTarget.style.borderColor = f === "critical" ? "#dc2626" : f === "high" ? "#ea580c" : f === "medium" ? "#ca8a04" : f === "low" ? "#16a34a" : "#e2e8f0"; e.currentTarget.style.background = "white"; } }}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                      {["Date", "Risk Score", "Risk Level", "Temp (°C)", "Humidity (%)", "Rainfall (mm)"].map(h => (
                        <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", paddingBottom: 16, paddingRight: 16 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map(row => (
                      <tr key={row.date} className="history-row" style={{
                        background: "white",
                        borderRadius: 14,
                        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                      }}>
                        <td style={{ padding: "16px 16px 16px 20px", fontSize: 14, fontWeight: 800, color: "#0f172a", borderRadius: "14px 0 0 14px" }}>{row.date}</td>
                        <td style={{ padding: "16px 16px 16px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 90, height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{
                                width: `${row.risk}%`, height: "100%", borderRadius: 99,
                                background: row.risk >= 80 ? "linear-gradient(90deg, #dc2626, #ef4444)" : row.risk >= 60 ? "linear-gradient(90deg, #ea580c, #f97316)" : row.risk >= 40 ? "linear-gradient(90deg, #ca8a04, #eab308)" : "linear-gradient(90deg, #16a34a, #22c55e)",
                                boxShadow: row.risk >= 60 ? `0 0 10px ${row.risk >= 80 ? '#dc2626' : '#ea580c'}30` : "none",
                              }} />
                            </div>
                            <span style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", fontFamily: "'Playfair Display',serif" }}>{row.risk}</span>
                          </div>
                        </td>
                        <td style={{ padding: "16px 16px 16px 0" }}><RiskBadge level={row.level} /></td>
                        <td style={{ padding: "16px 16px 16px 0", fontSize: 14, color: "#475569", fontWeight: 700 }}>{row.temp}</td>
                        <td style={{ padding: "16px 16px 16px 0", fontSize: 14, color: "#475569", fontWeight: 700 }}>{row.humidity}</td>
                        <td style={{ padding: "16px 20px 16px 0", fontSize: 14, color: "#475569", fontWeight: 700, borderRadius: "0 14px 14px 0" }}>{row.rainfall}</td>
                      </tr>
                    ))}
                    {filteredHistory.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: 15, fontWeight: 600 }}>No records for this risk level</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══ EDIT DEVICE MODAL ══ */}
      {editDevice && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
          animation: "fadeIn 0.25s ease",
        }} onClick={(e) => { if (e.target === e.currentTarget && !editLoading) setEditDevice(null); }}>
          <div style={{
            background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
            borderRadius: 28, width: "100%", maxWidth: 540,
            boxShadow: "0 32px 96px rgba(15, 23, 42, 0.25), 0 8px 24px rgba(15, 23, 42, 0.1)",
            maxHeight: "90vh", overflowY: "auto",
            border: "1.5px solid rgba(226, 232, 240, 0.8)",
          }}>
            {editSuccess ? (
              <div style={{ padding: "64px 48px", textAlign: "center" }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 40, margin: "0 auto 24px",
                  border: "3px solid #86efac",
                  boxShadow: "0 8px 24px rgba(22, 163, 74, 0.2)",
                }}>✅</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: "#0f172a", marginBottom: 10, fontWeight: 900 }}>Device Updated!</h3>
                <p style={{ fontSize: 15, color: "#64748b", fontWeight: 500 }}>Your sensor details have been saved successfully.</p>
              </div>
            ) : (
              <div style={{ padding: "36px 40px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                  <div>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16,
                      background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24, marginBottom: 12,
                      border: "1.5px solid #93c5fd40",
                    }}>✏️</div>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.02em" }}>Edit Device</h3>
                    <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Update your sensor details below</p>
                  </div>
                  <button onClick={() => setEditDevice(null)} style={{
                    background: "#f1f5f9", border: "none", borderRadius: "50%",
                    width: 40, height: 40, cursor: "pointer", fontSize: 20, color: "#64748b",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
                  >✕</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: "#334155", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Device Name *</label>
                    <input value={editForm.name} onChange={e => { setEditForm(f => ({...f, name: e.target.value})); setEditErrors(f => ({...f, name: ""})); }}
                      placeholder="e.g. North Field Temperature Sensor"
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, border: `2px solid ${editErrors.name ? "#fca5a5" : "#e2e8f0"}`, outline: "none", background: "#fafafa", color: "#0f172a", boxSizing: "border-box", transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                      onFocus={e => { e.currentTarget.style.borderColor = editErrors.name ? "#fca5a5" : "#93c5fd"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(147, 197, 253, 0.15)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = editErrors.name ? "#fca5a5" : "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    {editErrors.name && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><span>⚠️</span> {editErrors.name}</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: "#334155", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Device ID *</label>
                    <input value={editForm.deviceId} onChange={e => { setEditForm(f => ({...f, deviceId: e.target.value})); setEditErrors(f => ({...f, deviceId: ""})); }}
                      placeholder="e.g. DEV-001"
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, border: `2px solid ${editErrors.deviceId ? "#fca5a5" : "#e2e8f0"}`, outline: "none", background: "#fafafa", color: "#0f172a", boxSizing: "border-box", transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                      onFocus={e => { e.currentTarget.style.borderColor = editErrors.deviceId ? "#fca5a5" : "#93c5fd"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(147, 197, 253, 0.15)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = editErrors.deviceId ? "#fca5a5" : "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    {editErrors.deviceId && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><span>⚠️</span> {editErrors.deviceId}</div>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 800, color: "#334155", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>District *</label>
                      <select value={editForm.district} onChange={e => { setEditForm(f => ({...f, district: e.target.value})); setEditErrors(f => ({...f, district: ""})); }}
                        style={{ width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, border: `2px solid ${editErrors.district ? "#fca5a5" : "#e2e8f0"}`, outline: "none", background: "#fafafa", color: "#0f172a", boxSizing: "border-box", transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                        onFocus={e => { e.currentTarget.style.borderColor = editErrors.district ? "#fca5a5" : "#93c5fd"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(147, 197, 253, 0.15)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = editErrors.district ? "#fca5a5" : "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        <option value="">Select district</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {editErrors.district && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><span>⚠️</span> {editErrors.district}</div>}
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 800, color: "#334155", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sensor Type</label>
                      <select value={editForm.type} onChange={e => setEditForm(f => ({...f, type: e.target.value}))}
                        style={{ width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, border: "2px solid #e2e8f0", outline: "none", background: "#fafafa", color: "#0f172a", boxSizing: "border-box", transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                        onFocus={e => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(147, 197, 253, 0.15)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        {["Temperature & Humidity","Rainfall","Soil Moisture","Wind Speed","Multi-Sensor"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: "#334155", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Field Location / GPS (optional)</label>
                    <input value={editForm.fieldLocation} onChange={e => setEditForm(f => ({...f, fieldLocation: e.target.value}))}
                      placeholder="e.g. North Zone or 6.0367° N, 80.2170° E"
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, border: "2px solid #e2e8f0", outline: "none", background: "#fafafa", color: "#0f172a", boxSizing: "border-box", transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                      onFocus={e => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(147, 197, 253, 0.15)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: "#334155", display: "block", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Device Status</label>
                    <div style={{ display: "flex", gap: 12 }}>
                      {["online", "offline"].map(s => (
                        <button key={s} onClick={() => setEditForm(f => ({...f, status: s}))} style={{
                          flex: 1, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer",
                          border: `2px solid ${editForm.status === s ? (s === "online" ? "#16a34a" : "#dc2626") : "#e2e8f0"}`,
                          background: editForm.status === s ? (s === "online" ? "#f0fdf4" : "#fef2f2") : "white",
                          color: editForm.status === s ? (s === "online" ? "#15803d" : "#b91c1c") : "#94a3b8",
                          transition: "all 0.2s",
                          boxShadow: editForm.status === s ? `0 4px 16px ${s === "online" ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)"}` : "none",
                        }}
                          onMouseEnter={e => { if (editForm.status !== s) { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; } }}
                          onMouseLeave={e => { if (editForm.status !== s) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; } }}
                        >
                          {s === "online" ? "🟢 Online" : "🔴 Offline"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                    <button onClick={() => setEditDevice(null)} style={{
                      flex: 1, padding: "14px", borderRadius: 14, border: "2px solid #e2e8f0",
                      background: "white", color: "#475569", fontSize: 14, fontWeight: 800,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; }}
                    >Cancel</button>
                    <button onClick={saveEdit} disabled={editLoading} style={{
                      flex: 2, padding: "14px", borderRadius: 14, border: "none",
                      background: editLoading ? "#cbd5e1" : "linear-gradient(135deg, #10b981, #059669)",
                      color: "white", fontSize: 14, fontWeight: 800,
                      cursor: editLoading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "all 0.25s",
                      boxShadow: editLoading ? "none" : "0 6px 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}
                      onMouseEnter={e => { if (!editLoading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
                    >
                      {editLoading ? <><div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTop: "2.5px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/> Saving...</> : "💾 Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ REGISTER DEVICE MODAL ══ */}
      {showRegisterModal && (
        <div className="modal-overlay" style={{
          position: "fixed", inset: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowRegisterModal(false); }}>
          <div style={{
            background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
            borderRadius: 28, width: "100%", maxWidth: 540,
            boxShadow: "0 32px 96px rgba(15, 23, 42, 0.25), 0 8px 24px rgba(15, 23, 42, 0.1)",
            maxHeight: "90vh", overflowY: "auto",
            border: "1.5px solid rgba(226, 232, 240, 0.8)",
          }}>
            {regSuccess ? (
              <div style={{ padding: "64px 48px", textAlign: "center" }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 40, margin: "0 auto 24px",
                  border: "3px solid #86efac",
                  boxShadow: "0 8px 24px rgba(22, 163, 74, 0.2)",
                }}>✅</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: "#0f172a", marginBottom: 10, fontWeight: 900 }}>Device Registered!</h3>
                <p style={{ fontSize: 15, color: "#64748b", fontWeight: 500 }}>Your sensor is now active and monitoring</p>
              </div>
            ) : (
              <div style={{ padding: "36px 40px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                  <div>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16,
                      background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24, marginBottom: 12,
                      border: "1.5px solid #86efac40",
                    }}>📡</div>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.02em" }}>Register New Device</h3>
                    <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Add a sensor to your plantation monitoring network</p>
                  </div>
                  <button onClick={() => setShowRegisterModal(false)} style={{
                    background: "#f1f5f9", border: "none", borderRadius: "50%",
                    width: 40, height: 40, cursor: "pointer", fontSize: 20, color: "#64748b",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
                  >✕</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: "#334155", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Device Name *</label>
                    <input value={newDevice.name} onChange={e => { setNewDevice(p => ({...p, name: e.target.value})); setRegErrors(p => ({...p, name: ""})); }}
                      placeholder="e.g. North Field Temperature Sensor"
                      style={inputStyle(regErrors.name)}
                      onFocus={e => { e.currentTarget.style.borderColor = regErrors.name ? "#fca5a5" : "#93c5fd"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(147, 197, 253, 0.15)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = regErrors.name ? "#fca5a5" : "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    {regErrors.name && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><span>⚠️</span> {regErrors.name}</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: "#334155", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Device ID *</label>
                    <input value={newDevice.deviceId} onChange={e => { setNewDevice(p => ({...p, deviceId: e.target.value})); setRegErrors(p => ({...p, deviceId: ""})); }}
                      placeholder="e.g. DEV-004 or serial number"
                      style={inputStyle(regErrors.deviceId)}
                      onFocus={e => { e.currentTarget.style.borderColor = regErrors.deviceId ? "#fca5a5" : "#93c5fd"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(147, 197, 253, 0.15)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = regErrors.deviceId ? "#fca5a5" : "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    {regErrors.deviceId && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><span>⚠️</span> {regErrors.deviceId}</div>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 800, color: "#334155", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>District *</label>
                      <select value={newDevice.district} onChange={e => { setNewDevice(p => ({...p, district: e.target.value})); setRegErrors(p => ({...p, district: ""})); }}
                        style={inputStyle(regErrors.district)}
                        onFocus={e => { e.currentTarget.style.borderColor = regErrors.district ? "#fca5a5" : "#93c5fd"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(147, 197, 253, 0.15)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = regErrors.district ? "#fca5a5" : "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        <option value="">Select district</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {regErrors.district && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><span>⚠️</span> {regErrors.district}</div>}
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 800, color: "#334155", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sensor Type</label>
                      <select value={newDevice.type} onChange={e => setNewDevice(p => ({...p, type: e.target.value}))}
                        style={inputStyle(false)}
                        onFocus={e => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(147, 197, 253, 0.15)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        {["Temperature & Humidity","Rainfall","Soil Moisture","Wind Speed","Multi-Sensor"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: "#334155", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Field Location / GPS (optional)</label>
                    <input value={newDevice.location} onChange={e => setNewDevice(p => ({...p, location: e.target.value}))}
                      placeholder="e.g. North Zone or 6.0367° N, 80.2170° E"
                      style={inputStyle(false)}
                      onFocus={e => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(147, 197, 253, 0.15)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                  <div style={{
                    padding: "14px 18px", background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                    borderRadius: 14, border: "1.5px solid #bbf7d060",
                    display: "flex", gap: 12, alignItems: "flex-start",
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>💡</span>
                    <p style={{ fontSize: 13, color: "#15803d", lineHeight: 1.7, fontWeight: 600 }}>The Device ID is printed on your sensor hardware. After registration, the device will begin sending data within 5 minutes.</p>
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                    <button onClick={() => setShowRegisterModal(false)} style={{
                      flex: 1, padding: "14px", borderRadius: 14, border: "2px solid #e2e8f0",
                      background: "white", color: "#475569", fontSize: 14, fontWeight: 800,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; }}
                    >Cancel</button>
                    <button onClick={registerDevice} disabled={regLoading} style={{
                      flex: 2, padding: "14px", borderRadius: 14, border: "none",
                      background: regLoading ? "#cbd5e1" : "linear-gradient(135deg, #10b981, #059669)",
                      color: "white", fontSize: 14, fontWeight: 800,
                      cursor: regLoading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "all 0.25s",
                      boxShadow: regLoading ? "none" : "0 6px 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}
                      onMouseEnter={e => { if (!regLoading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
                    >
                      {regLoading ? <><div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTop: "2.5px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Registering...</> : "📡 Register Device"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
