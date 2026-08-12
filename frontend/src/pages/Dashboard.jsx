import { useState, useEffect, useRef } from "react";
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
  // supplementary display-only fields
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
  Critical: { color: "#e05252", bg: "#fff5f5", border: "#fca5a5", label: "Critical Risk" },
  High:     { color: "#e08c52", bg: "#fff7ed", border: "#fed7aa", label: "High Risk" },
  Medium:   { color: "#e8c84a", bg: "#fefce8", border: "#fde047", label: "Medium Risk" },
  Low:      { color: "#2d8a4e", bg: "#f2fdf5", border: "#86efac", label: "Low Risk" },
};

const DISTRICTS = [
  "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha",
  "Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Kurunegala","Matara","Ratnapura",
];

const API_BASE_URL = "http://localhost:8000"; // your FastAPI server

// ─── Mini sparkline ───────────────────────────────────────────────────────────
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
      <polyline points={area} fill={color + "22"} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Gauge ────────────────────────────────────────────────────────────────────
function RiskGauge({ score }) {
  const r = 70, cx = 90, cy = 90;
  const circumference = Math.PI * r;
  const pct = score / 100;
  const color = score >= 80 ? "#e05252" : score >= 60 ? "#e08c52" : score >= 40 ? "#e8c84a" : "#2d8a4e";
  const label = score >= 80 ? "Critical" : score >= 60 ? "High" : score >= 40 ? "Medium" : "Low";
  const dashOffset = circumference * (1 - pct);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="180" height="110" viewBox="0 0 180 110">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#e0ede5" strokeWidth="12" strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s" }}
        />
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize="32" fontWeight="800"
          fontFamily="'Playfair Display',serif" fill={color}>{score}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="12" fill="#5a8a6a"
          fontFamily="'Plus Jakarta Sans',sans-serif">/ 100</text>
        <text x={cx} y={cy + 26} textAnchor="middle" fontSize="13" fontWeight="700"
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
  const levelColor = { "Critical Risk": "#e05252", "High Risk": "#e08c52", "Medium Risk": "#e8c84a", "Low Risk": "#2d8a4e" };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#7aaa8a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
        Model Confidence
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {levelOrder.map(lvl => {
          const prob = probabilities[lvl] || 0;
          return (
            <div key={lvl} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#2a5c3a", width: 60, textAlign: "right" }}>{levelShort[lvl]}</span>
              <div style={{ flex: 1, height: 8, background: "#e0ede5", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${prob * 100}%`, height: "100%", background: levelColor[lvl], borderRadius: 99, transition: "width 0.8s ease" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: levelColor[lvl], width: 40 }}>{(prob * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sensor Card (overview only) ──────────────────────────────────────────────
function SensorCard({ icon, label, value, unit, sparkData, color, trend }) {
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: "18px 20px",
      border: "1px solid rgba(44,138,78,0.1)",
      boxShadow: "0 2px 12px rgba(26,92,46,0.06)", transition: "all 0.3s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(26,92,46,0.13)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(26,92,46,0.06)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
          <div style={{ fontSize: 12, color: "#7aaa8a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: trend >= 0 ? "#2d8a4e" : "#e05252", background: trend >= 0 ? "#e8f5ed" : "#fff5f5", padding: "3px 8px", borderRadius: 99 }}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#0f2d1a", fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>
        {value}<span style={{ fontSize: 14, fontWeight: 500, color: "#7aaa8a", marginLeft: 4 }}>{unit}</span>
      </div>
      <div style={{ marginTop: 10 }}>
        <Sparkline data={sparkData} color={color} />
      </div>
    </div>
  );
}

// ─── Device Card ──────────────────────────────────────────────────────────────
function DeviceCard({ device, onRemove, removeLoading, onEdit, onViewSensor }) {
  const isOnline = device.status === "online";
  const battColor = device.battery > 50 ? "#2d8a4e" : device.battery > 20 ? "#e8c84a" : "#e05252";
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: "18px 20px",
      border: `1px solid ${isOnline ? "rgba(44,138,78,0.2)" : "rgba(224,82,82,0.2)"}`,
      boxShadow: "0 2px 12px rgba(26,92,46,0.06)",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 13, flexShrink: 0,
        background: isOnline ? "#e8f5ed" : "#fff5f5",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
        position: "relative",
      }}>
        📡
        <div style={{
          position: "absolute", top: -2, right: -2, width: 11, height: 11,
          borderRadius: "50%", background: isOnline ? "#2d8a4e" : "#e05252",
          border: "2px solid white",
          boxShadow: isOnline ? "0 0 0 3px rgba(44,138,78,0.2)" : "none",
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f2d1a", marginBottom: 2 }}>{device.name}</div>
        <div style={{ fontSize: 12, color: "#7aaa8a" }}>📍 {device.location} · {device.lastSeen}</div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1, height: 5, background: "#e0ede5", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${device.battery}%`, height: "100%", background: battColor, borderRadius: 99, transition: "width 0.5s" }} />
          </div>
          <span style={{ fontSize: 11, color: battColor, fontWeight: 700, minWidth: 30 }}>{device.battery}%</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
          background: isOnline ? "#e8f5ed" : "#fff5f5",
          color: isOnline ? "#1a5c2e" : "#e05252",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>{device.status}</span>
        <button
          onClick={() => onViewSensor(device)}
          style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 99, cursor: "pointer",
            border: "1px solid #2d8a4e", background: "#e8f5ed", color: "#1a5c2e", fontWeight: 700,
          }}>📊 Sensor Data</button>
        <button
          onClick={() => onEdit(device)}
          style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 99, cursor: "pointer",
            border: "1px solid #cde4d5", background: "white", color: "#1a5c2e", fontWeight: 600,
          }}>✏️ Edit</button>
        <button
          onClick={() => onRemove(device.firestoreId)}
          disabled={removeLoading}
          style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 99,
            cursor: removeLoading ? "not-allowed" : "pointer",
            border: "1px solid #fca5a5", background: "white", color: "#e05252", fontWeight: 600,
            display: "flex", alignItems: "center", gap: 4,
          }}>
          {removeLoading
            ? <><div style={{ width:10,height:10,border:"1.5px solid #fca5a5",borderTop:"1.5px solid #e05252",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/> Removing</>
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
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      textTransform: "uppercase", letterSpacing: "0.06em",
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

  // ── NEW: Live prediction states ───────────────────────────────────────────
  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState("Low");
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState("");
  const [probabilities, setProbabilities] = useState({});
  const [riskAdvice, setRiskAdvice] = useState("");

  // Sparkline data for the 3 model inputs
  const sparkPH       = [5.7, 5.8, 5.9, 6.0, 6.1, 5.9, 5.9];
  const sparkMoisture = [28, 30, 32, 31, 33, 31, 31];
  const sparkTemp     = [25.5, 26.2, 26.8, 27.1, 27.5, 27.0, 27.0];

  const currentRiskLevel = riskLevel;
  const riskCfg = RISK_CONFIG[currentRiskLevel] || RISK_CONFIG.Low;

  const filteredHistory = historyFilter === "all"
    ? MOCK_HISTORY
    : MOCK_HISTORY.filter(h => h.level.toLowerCase() === historyFilter);

  // ── Fetch prediction from FastAPI ─────────────────────────────────────────
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

      // Map API level (e.g. "High Risk") → dashboard level ("High")
      const apiLevel = data.White_Root_Disease_Risk || "Low Risk";
      const shortLevel = apiLevel.replace(" Risk", "");

      // Convert level + confidence to a 0-100 score for the gauge
      const levelBase = { Low: 20, Medium: 45, High: 70, Critical: 90 };
      const base = levelBase[shortLevel] || 50;
      const conf = (data.confidence || 0) / 100;
      const score = Math.round(base + (conf * 15));

      setRiskScore(Math.min(100, Math.max(0, score)));
      setRiskLevel(shortLevel);
      setProbabilities(data.probabilities || {});

      // Dynamic advice based on level
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
      // Fallback so UI doesn't break
      setRiskScore(73);
      setRiskLevel("High");
      setProbabilities({ "High Risk": 0.73, "Medium Risk": 0.15, "Low Risk": 0.08, "Critical Risk": 0.04 });
      setRiskAdvice("⚠️ High humidity combined with recent rainfall increases Leaf Spot risk. Consider preventive fungicide application.");
    } finally {
      setPredictionLoading(false);
    }
  };

  // ── Load prediction on mount ──────────────────────────────────────────────
  useEffect(() => {
    fetchPrediction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load devices ──────────────────────────────────────────────────────────
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

  // ── Register device ───────────────────────────────────────────────────────
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

  // ── Remove device ─────────────────────────────────────────────────────────
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

  // ── Open edit modal ───────────────────────────────────────────────────────
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

  // ── Save edit ─────────────────────────────────────────────────────────────
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

  // ── Navigate to Sensor Data page for a specific device ────────────────────
  const goToSensorData = (device) => {
    nav("/sensor-data", { state: { device } });
  };

  // ── Sign out ──────────────────────────────────────────────────────────────
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
    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
    border: `1.5px solid ${err ? "#e05252" : "#cde4d5"}`, outline: "none",
    background: "white", color: "#0f2d1a", boxSizing: "border-box",
    fontFamily: "'Plus Jakarta Sans',sans-serif",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f2faf5; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.4);opacity:0;} }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .tab-btn { border:none; background:none; cursor:pointer; transition:all 0.2s; width:100%; text-align:left; }
        .tab-btn:hover { background:rgba(44,138,78,0.06); }
        .stat-card { transition: all 0.3s; }
        .stat-card:hover { transform:translateY(-2px); }
        .modal-overlay { animation: fadeIn 0.2s ease; }
        select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 24 24' stroke='%232d8a4e' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:36px !important; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:#cde4d5; border-radius:99px; }
        .history-row:hover { background:#f7fdf9 !important; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#f2faf5" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: sidebarOpen ? 240 : 72, flexShrink: 0,
          background: "linear-gradient(180deg,#1a5c2e 0%,#0e3d1e 100%)",
          display: "flex", flexDirection: "column",
          transition: "width 0.3s", overflow: "hidden",
          position: "sticky", top: 0, height: "100vh",
        }}>
          {/* Logo */}
          <div style={{ padding: "24px 18px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🌿</div>
              {sidebarOpen && (
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, color: "white", whiteSpace: "nowrap" }}>CinnaPredict</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Dashboard</div>
                </div>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "16px 10px" }}>
            {NAV_ITEMS.map(item => (
              <button key={item.id} className="tab-btn" onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 12px", borderRadius: 10, marginBottom: 4,
                  background: activeTab === item.id ? "rgba(255,255,255,0.12)" : "transparent",
                  borderLeft: activeTab === item.id ? "3px solid #7de0a4" : "3px solid transparent",
                }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span style={{ fontSize: 14, fontWeight: activeTab === item.id ? 700 : 500, color: activeTab === item.id ? "white" : "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>{item.label}</span>}
              </button>
            ))}

            {/* Sensor Data — goes to separate page, pick first device */}
            <button className="tab-btn"
              onClick={() => {
                if (devices.length > 0) goToSensorData(devices[0]);
                else { setActiveTab("devices"); setShowRegisterModal(true); }
              }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 12px", borderRadius: 10, marginBottom: 4,
                background: "transparent",
                borderLeft: "3px solid transparent",
              }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>📊</span>
              {sidebarOpen && <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>Sensor Data</span>}
            </button>
          </nav>

          {/* Register device button */}
          <div style={{ padding: "16px 10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => setShowRegisterModal(true)} style={{
              width: "100%", padding: "11px 12px", borderRadius: 10, border: "1.5px solid rgba(125,224,164,0.4)",
              background: "rgba(125,224,164,0.1)", color: "#7de0a4", fontWeight: 700, fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10, justifyContent: sidebarOpen ? "flex-start" : "center",
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>➕</span>
              {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>Register Device</span>}
            </button>
          </div>

          {/* Toggle + logout */}
          <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={() => setSidebarOpen(s => !s)} style={{
              background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)",
              fontSize: 18, padding: "8px", borderRadius: 8, textAlign: sidebarOpen ? "right" : "center",
            }}>
              {sidebarOpen ? "◀" : "▶"}
            </button>
            <button onClick={handleSignOut} style={{
              background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)",
              fontSize: 12, fontWeight: 600, padding: "8px 12px", borderRadius: 8, textAlign: "left", display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>🚪</span>{sidebarOpen && "Sign Out"}
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, overflowY: "auto", padding: "32px 36px" }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: "#0f2d1a", marginBottom: 4 }}>
                {NAV_ITEMS.find(n => n.id === activeTab)?.icon} {NAV_ITEMS.find(n => n.id === activeTab)?.label}
              </h1>
              <p style={{ fontSize: 14, color: "#7aaa8a" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(44,138,78,0.12)", fontSize: 13, color: "#2a5c3a", fontWeight: 500 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d8a4e", animation: "pulse 2s infinite" }} />
                {devices.filter(d => d.status === "online").length} devices online
              </div>
              <button onClick={() => setShowRegisterModal(true)} style={{
                background: "linear-gradient(135deg,#2d8a4e,#1a5c2e)", color: "white",
                border: "none", padding: "9px 18px", borderRadius: 10, fontSize: 13,
                fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(44,138,78,0.35)",
              }}>+ Register Device</button>
            </div>
          </div>

          {/* ══ OVERVIEW ══ */}
          {activeTab === "overview" && (
            <div className="fade-up">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
                {/* Risk gauge */}
                <div style={{ background: "white", borderRadius: 20, padding: 24, border: `1.5px solid ${riskCfg.border}`, boxShadow: "0 4px 20px rgba(26,92,46,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#7aaa8a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Current Disease Risk</div>
                    {predictionLoading && (
                      <div style={{ width: 16, height: 16, border: "2px solid #cde4d5", borderTop: "2px solid #2d8a4e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    )}
                  </div>
                  <RiskGauge score={riskScore} />
                  <ProbabilityBars probabilities={probabilities} />
                  <div style={{ marginTop: 16, padding: "12px 16px", background: riskCfg.bg, borderRadius: 10, border: `1px solid ${riskCfg.border}` }}>
                    <div style={{ fontSize: 13, color: riskCfg.color, fontWeight: 600, lineHeight: 1.5 }}>
                      {riskAdvice}
                    </div>
                  </div>
                  {predictionError && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#e05252", fontWeight: 600 }}>
                      {predictionError}
                    </div>
                  )}
                  <button
                    onClick={fetchPrediction}
                    disabled={predictionLoading}
                    style={{
                      marginTop: 14, width: "100%", padding: "10px", borderRadius: 10,
                      border: "1.5px solid #cde4d5", background: "white", color: "#1a5c2e",
                      fontSize: 13, fontWeight: 700, cursor: predictionLoading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {predictionLoading ? (
                      <><div style={{ width: 14, height: 14, border: "2px solid #cde4d5", borderTop: "2px solid #2d8a4e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Refreshing...</>
                    ) : (
                      <>🔄 Refresh Prediction</>
                    )}
                  </button>
                </div>

                {/* Quick stats — now showing the 3 model inputs */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { icon: "🧪", label: "Soil pH", val: sensorData.soilPH, unit: "", sub: "Acidic range", color: "#8b5cf6" },
                    { icon: "💧", label: "Soil Moisture", val: `${sensorData.soilMoistureVWC}%`, unit: "VWC", sub: "Moderately wet", color: "#3b82f6" },
                    { icon: "🌡️", label: "Soil Temperature", val: `${sensorData.soilTempC}°C`, unit: "", sub: "Above optimal", color: "#e08c52" },
                  ].map(s => (
                    <div key={s.label} className="stat-card" style={{ background: "white", borderRadius: 14, padding: "14px 18px", border: "1px solid rgba(44,138,78,0.1)", boxShadow: "0 2px 8px rgba(26,92,46,0.05)", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#7aaa8a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#0f2d1a", fontFamily: "'Playfair Display',serif" }}>{s.val}</div>
                        <div style={{ fontSize: 12, color: s.color, fontWeight: 500 }}>{s.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Device summary */}
                <div style={{ background: "white", borderRadius: 20, padding: 24, border: "1px solid rgba(44,138,78,0.1)", boxShadow: "0 4px 20px rgba(26,92,46,0.08)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#7aaa8a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Device Overview</div>
                  {[
                    { label: "Total Devices", val: devices.length, color: "#1a5c2e" },
                    { label: "Online", val: devices.filter(d => d.status === "online").length, color: "#2d8a4e" },
                    { label: "Offline", val: devices.filter(d => d.status === "offline").length, color: "#e05252" },
                    { label: "Low Battery", val: devices.filter(d => d.battery < 20).length, color: "#e08c52" },
                  ].map(s => (
                    <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f2faf5" }}>
                      <span style={{ fontSize: 14, color: "#2a5c3a" }}>{s.label}</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Playfair Display',serif" }}>{s.val}</span>
                    </div>
                  ))}
                  <button onClick={() => setActiveTab("devices")} style={{ marginTop: 16, width: "100%", padding: "10px", borderRadius: 10, border: "1.5px solid #cde4d5", background: "white", color: "#1a5c2e", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    Manage Devices →
                  </button>
                </div>
              </div>

              {/* Sensor Data quick-access cards */}
              {devices.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f2d1a", marginBottom: 14 }}>📊 Live Sensor Monitoring</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                    {devices.map(device => (
                      <div key={device.firestoreId}
                        onClick={() => goToSensorData(device)}
                        style={{
                          background: "white", borderRadius: 16, padding: "18px 20px",
                          border: "1.5px solid rgba(44,138,78,0.15)",
                          boxShadow: "0 2px 12px rgba(26,92,46,0.06)",
                          cursor: "pointer", transition: "all 0.25s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(26,92,46,0.14)"; e.currentTarget.style.borderColor = "#2d8a4e"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(26,92,46,0.06)"; e.currentTarget.style.borderColor = "rgba(44,138,78,0.15)"; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 11, background: "#e8f5ed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, position: "relative" }}>
                            📡
                            <div style={{ position: "absolute", top: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: device.status === "online" ? "#2d8a4e" : "#e05252", border: "2px solid white" }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f2d1a" }}>{device.name}</div>
                            <div style={{ fontSize: 12, color: "#7aaa8a" }}>📍 {device.location}</div>
                          </div>
                        </div>
                        <div style={{ padding: "10px 14px", background: "linear-gradient(135deg,#e8f5ed,#f2fdf5)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a5c2e" }}>Open Sensor Data</span>
                          <span style={{ fontSize: 18 }}>→</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Input Sensor Cards */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f2d1a", marginBottom: 14 }}>🌱 White Root Rot — Model Inputs</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
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
                    sparkData={sparkTemp} color="#e08c52" trend={0.8}
                  />
                </div>
              </div>

              {/* Recent history */}
              <div style={{ background: "white", borderRadius: 20, padding: 24, border: "1px solid rgba(44,138,78,0.1)", boxShadow: "0 4px 20px rgba(26,92,46,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f2d1a" }}>Recent Risk History</div>
                  <button onClick={() => setActiveTab("history")} style={{ fontSize: 13, color: "#1a5c2e", fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>View All</button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Date", "Risk Score", "Level", "Temp", "Humidity", "Rainfall"].map(h => (
                          <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "#7aaa8a", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 16px 12px 0" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_HISTORY.slice(0, 4).map(row => (
                        <tr key={row.date} className="history-row" style={{ borderTop: "1px solid #f2faf5" }}>
                          <td style={{ padding: "12px 16px 12px 0", fontSize: 14, color: "#2a5c3a", fontWeight: 600 }}>{row.date}</td>
                          <td style={{ padding: "12px 16px 12px 0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, maxWidth: 80, height: 6, background: "#e0ede5", borderRadius: 99, overflow: "hidden" }}>
                                <div style={{ width: `${row.risk}%`, height: "100%", background: row.risk >= 80 ? "#e05252" : row.risk >= 60 ? "#e08c52" : row.risk >= 40 ? "#e8c84a" : "#2d8a4e", borderRadius: 99 }} />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f2d1a" }}>{row.risk}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px 12px 0" }}><RiskBadge level={row.level} /></td>
                          <td style={{ padding: "12px 16px 12px 0", fontSize: 14, color: "#2a5c3a" }}>{row.temp}°C</td>
                          <td style={{ padding: "12px 16px 12px 0", fontSize: 14, color: "#2a5c3a" }}>{row.humidity}%</td>
                          <td style={{ padding: "12px 16px 12px 0", fontSize: 14, color: "#2a5c3a" }}>{row.rainfall} mm</td>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 14, color: "#7aaa8a" }}>{devices.length} device{devices.length !== 1 ? "s" : ""} registered</div>
                <button onClick={() => setShowRegisterModal(true)} style={{
                  background: "linear-gradient(135deg,#2d8a4e,#1a5c2e)", color: "white",
                  border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 13,
                  fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(44,138,78,0.3)",
                }}>+ Register New Device</button>
              </div>
              {devicesLoading ? (
                <div style={{ textAlign:"center", padding:"56px 24px", background:"white", borderRadius:20, border:"1px solid rgba(44,138,78,0.1)" }}>
                  <div style={{ width:36,height:36,border:"3px solid #cde4d5",borderTop:"3px solid #2d8a4e",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/>
                  <p style={{ fontSize:14,color:"#7aaa8a" }}>Loading your devices...</p>
                </div>
              ) : devicesError ? (
                <div style={{ textAlign:"center", padding:"40px 24px", background:"#fff5f5", borderRadius:20, border:"1px solid #fca5a5" }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
                  <p style={{ fontSize:14,color:"#e05252",fontWeight:600 }}>{devicesError}</p>
                </div>
              ) : devices.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px 24px", background: "white", borderRadius: 20, border: "2px dashed #cde4d5" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#0f2d1a", marginBottom: 8 }}>No devices registered yet</div>
                  <p style={{ fontSize: 14, color: "#7aaa8a", marginBottom: 24 }}>Register your first sensor to start monitoring your plantation</p>
                  <button onClick={() => setShowRegisterModal(true)} style={{ background: "linear-gradient(135deg,#2d8a4e,#1a5c2e)", color: "white", border: "none", padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    Register First Device
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "Avg Risk Score", val: "65", icon: "📊", color: "#e08c52" },
                  { label: "Critical Days", val: MOCK_HISTORY.filter(h => h.level === "Critical").length, icon: "🚨", color: "#e05252" },
                  { label: "High Risk Days", val: MOCK_HISTORY.filter(h => h.level === "High").length, icon: "⚠️", color: "#e08c52" },
                  { label: "Safe Days", val: MOCK_HISTORY.filter(h => h.level === "Low").length, icon: "✅", color: "#2d8a4e" },
                ].map(s => (
                  <div key={s.label} style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(44,138,78,0.1)", boxShadow: "0 2px 8px rgba(26,92,46,0.05)" }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "'Playfair Display',serif" }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: "#7aaa8a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "white", borderRadius: 20, padding: 28, border: "1px solid rgba(44,138,78,0.1)", boxShadow: "0 4px 20px rgba(26,92,46,0.08)" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                  {["all", "critical", "high", "medium", "low"].map(f => (
                    <button key={f} onClick={() => setHistoryFilter(f)} style={{
                      padding: "7px 16px", borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: "pointer",
                      border: "1.5px solid",
                      background: historyFilter === f ? (f === "critical" ? "#e05252" : f === "high" ? "#e08c52" : f === "medium" ? "#e8c84a" : f === "low" ? "#2d8a4e" : "#1a5c2e") : "white",
                      borderColor: f === "critical" ? "#e05252" : f === "high" ? "#e08c52" : f === "medium" ? "#e8c84a" : f === "low" ? "#2d8a4e" : "#cde4d5",
                      color: historyFilter === f ? "white" : "#2a5c3a",
                    }}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f2faf5" }}>
                      {["Date", "Risk Score", "Risk Level", "Temp (°C)", "Humidity (%)", "Rainfall (mm)"].map(h => (
                        <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "#7aaa8a", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 14, paddingRight: 16 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map(row => (
                      <tr key={row.date} className="history-row" style={{ borderBottom: "1px solid #f2faf5" }}>
                        <td style={{ padding: "14px 16px 14px 0", fontSize: 14, fontWeight: 600, color: "#0f2d1a" }}>{row.date}</td>
                        <td style={{ padding: "14px 16px 14px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 80, height: 7, background: "#e0ede5", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ width: `${row.risk}%`, height: "100%", borderRadius: 99, background: row.risk >= 80 ? "#e05252" : row.risk >= 60 ? "#e08c52" : row.risk >= 40 ? "#e8c84a" : "#2d8a4e" }} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#0f2d1a", fontFamily: "'Playfair Display',serif" }}>{row.risk}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px 14px 0" }}><RiskBadge level={row.level} /></td>
                        <td style={{ padding: "14px 16px 14px 0", fontSize: 14, color: "#2a5c3a" }}>{row.temp}</td>
                        <td style={{ padding: "14px 16px 14px 0", fontSize: 14, color: "#2a5c3a" }}>{row.humidity}</td>
                        <td style={{ padding: "14px 16px 14px 0", fontSize: 14, color: "#2a5c3a" }}>{row.rainfall}</td>
                      </tr>
                    ))}
                    {filteredHistory.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#7aaa8a", fontSize: 14 }}>No records for this risk level</td></tr>
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
          position: "fixed", inset: 0, background: "rgba(10,36,18,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
          animation: "fadeIn 0.2s ease",
        }} onClick={(e) => { if (e.target === e.currentTarget && !editLoading) setEditDevice(null); }}>
          <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 520, boxShadow: "0 24px 80px rgba(10,36,18,0.3)", maxHeight: "90vh", overflowY: "auto" }}>
            {editSuccess ? (
              <div style={{ padding: "56px 40px", textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: "#0f2d1a", marginBottom: 8 }}>Device Updated!</h3>
                <p style={{ fontSize: 14, color: "#7aaa8a" }}>Your sensor details have been saved successfully.</p>
              </div>
            ) : (
              <div style={{ padding: "32px 36px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>✏️</div>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: "#0f2d1a", marginBottom: 4 }}>Edit Device</h3>
                    <p style={{ fontSize: 13, color: "#7aaa8a" }}>Update your sensor details below</p>
                  </div>
                  <button onClick={() => setEditDevice(null)} style={{ background: "#f2faf5", border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 18, color: "#5a8a6a", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2e", display: "block", marginBottom: 6 }}>Device Name *</label>
                    <input value={editForm.name} onChange={e => { setEditForm(f => ({...f, name: e.target.value})); setEditErrors(f => ({...f, name: ""})); }}
                      placeholder="e.g. North Field Temperature Sensor"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14, border: `1.5px solid ${editErrors.name ? "#e05252" : "#cde4d5"}`, outline: "none", background: "white", color: "#0f2d1a", boxSizing: "border-box" }} />
                    {editErrors.name && <div style={{ fontSize: 12, color: "#e05252", marginTop: 4 }}>{editErrors.name}</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2e", display: "block", marginBottom: 6 }}>Device ID *</label>
                    <input value={editForm.deviceId} onChange={e => { setEditForm(f => ({...f, deviceId: e.target.value})); setEditErrors(f => ({...f, deviceId: ""})); }}
                      placeholder="e.g. DEV-001"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14, border: `1.5px solid ${editErrors.deviceId ? "#e05252" : "#cde4d5"}`, outline: "none", background: "white", color: "#0f2d1a", boxSizing: "border-box" }} />
                    {editErrors.deviceId && <div style={{ fontSize: 12, color: "#e05252", marginTop: 4 }}>{editErrors.deviceId}</div>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2e", display: "block", marginBottom: 6 }}>District *</label>
                      <select value={editForm.district} onChange={e => { setEditForm(f => ({...f, district: e.target.value})); setEditErrors(f => ({...f, district: ""})); }}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14, border: `1.5px solid ${editErrors.district ? "#e05252" : "#cde4d5"}`, outline: "none", background: "white", color: "#0f2d1a", boxSizing: "border-box" }}>
                        <option value="">Select district</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {editErrors.district && <div style={{ fontSize: 12, color: "#e05252", marginTop: 4 }}>{editErrors.district}</div>}
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2e", display: "block", marginBottom: 6 }}>Sensor Type</label>
                      <select value={editForm.type} onChange={e => setEditForm(f => ({...f, type: e.target.value}))}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid #cde4d5", outline: "none", background: "white", color: "#0f2d1a", boxSizing: "border-box" }}>
                        {["Temperature & Humidity","Rainfall","Soil Moisture","Wind Speed","Multi-Sensor"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2e", display: "block", marginBottom: 6 }}>Field Location / GPS (optional)</label>
                    <input value={editForm.fieldLocation} onChange={e => setEditForm(f => ({...f, fieldLocation: e.target.value}))}
                      placeholder="e.g. North Zone or 6.0367° N, 80.2170° E"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid #cde4d5", outline: "none", background: "white", color: "#0f2d1a", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2e", display: "block", marginBottom: 10 }}>Device Status</label>
                    <div style={{ display: "flex", gap: 10 }}>
                      {["online", "offline"].map(s => (
                        <button key={s} onClick={() => setEditForm(f => ({...f, status: s}))} style={{
                          flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                          border: `1.5px solid ${editForm.status === s ? (s === "online" ? "#2d8a4e" : "#e05252") : "#cde4d5"}`,
                          background: editForm.status === s ? (s === "online" ? "#e8f5ed" : "#fff5f5") : "white",
                          color: editForm.status === s ? (s === "online" ? "#1a5c2e" : "#e05252") : "#7aaa8a",
                        }}>
                          {s === "online" ? "🟢 Online" : "🔴 Offline"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                    <button onClick={() => setEditDevice(null)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #cde4d5", background: "white", color: "#1a5c2e", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    <button onClick={saveEdit} disabled={editLoading} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: editLoading ? "#9cb8a8" : "linear-gradient(135deg,#2d8a4e,#1a5c2e)", color: "white", fontSize: 14, fontWeight: 700, cursor: editLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      {editLoading ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/> Saving...</> : "💾 Save Changes"}
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
          position: "fixed", inset: 0, background: "rgba(10,36,18,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowRegisterModal(false); }}>
          <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 520, boxShadow: "0 24px 80px rgba(10,36,18,0.3)", maxHeight: "90vh", overflowY: "auto" }}>
            {regSuccess ? (
              <div style={{ padding: "56px 40px", textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: "#0f2d1a", marginBottom: 8 }}>Device Registered!</h3>
                <p style={{ fontSize: 14, color: "#7aaa8a" }}>Your sensor is now active and monitoring</p>
              </div>
            ) : (
              <div style={{ padding: "32px 36px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>📡</div>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: "#0f2d1a", marginBottom: 4 }}>Register New Device</h3>
                    <p style={{ fontSize: 13, color: "#7aaa8a" }}>Add a sensor to your plantation monitoring network</p>
                  </div>
                  <button onClick={() => setShowRegisterModal(false)} style={{ background: "#f2faf5", border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 18, color: "#5a8a6a", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2e", display: "block", marginBottom: 6 }}>Device Name *</label>
                    <input value={newDevice.name} onChange={e => { setNewDevice(p => ({...p, name: e.target.value})); setRegErrors(p => ({...p, name: ""})); }}
                      placeholder="e.g. North Field Temperature Sensor" style={inputStyle(regErrors.name)} />
                    {regErrors.name && <div style={{ fontSize: 12, color: "#e05252", marginTop: 4 }}>{regErrors.name}</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2e", display: "block", marginBottom: 6 }}>Device ID *</label>
                    <input value={newDevice.deviceId} onChange={e => { setNewDevice(p => ({...p, deviceId: e.target.value})); setRegErrors(p => ({...p, deviceId: ""})); }}
                      placeholder="e.g. DEV-004 or serial number" style={inputStyle(regErrors.deviceId)} />
                    {regErrors.deviceId && <div style={{ fontSize: 12, color: "#e05252", marginTop: 4 }}>{regErrors.deviceId}</div>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2e", display: "block", marginBottom: 6 }}>District *</label>
                      <select value={newDevice.district} onChange={e => { setNewDevice(p => ({...p, district: e.target.value})); setRegErrors(p => ({...p, district: ""})); }} style={inputStyle(regErrors.district)}>
                        <option value="">Select district</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {regErrors.district && <div style={{ fontSize: 12, color: "#e05252", marginTop: 4 }}>{regErrors.district}</div>}
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2e", display: "block", marginBottom: 6 }}>Sensor Type</label>
                      <select value={newDevice.type} onChange={e => setNewDevice(p => ({...p, type: e.target.value}))} style={inputStyle(false)}>
                        {["Temperature & Humidity","Rainfall","Soil Moisture","Wind Speed","Multi-Sensor"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2e", display: "block", marginBottom: 6 }}>Field Location / GPS (optional)</label>
                    <input value={newDevice.location} onChange={e => setNewDevice(p => ({...p, location: e.target.value}))}
                      placeholder="e.g. North Zone or 6.0367° N, 80.2170° E" style={inputStyle(false)} />
                  </div>
                  <div style={{ padding: "12px 16px", background: "#f2fdf5", borderRadius: 10, border: "1px solid #cde4d5", display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                    <p style={{ fontSize: 12, color: "#2a5c3a", lineHeight: 1.6 }}>The Device ID is printed on your sensor hardware. After registration, the device will begin sending data within 5 minutes.</p>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                    <button onClick={() => setShowRegisterModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #cde4d5", background: "white", color: "#1a5c2e", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    <button onClick={registerDevice} disabled={regLoading} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: regLoading ? "#9cb8a8" : "linear-gradient(135deg,#2d8a4e,#1a5c2e)", color: "white", fontSize: 14, fontWeight: 700, cursor: regLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      {regLoading ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Registering...</> : "📡 Register Device"}
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
