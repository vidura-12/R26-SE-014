import { createContext, useContext, useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { MOCK_SENSOR, API_BASE_URL } from "./dashboardTheme";

const DashboardContext = createContext(null);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
};

export default function DashboardProvider({ children }) {
  const { currentUser } = useAuth();

  // ── Devices ──
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devicesError, setDevicesError] = useState("");
  const [removeLoadingId, setRemoveLoadingId] = useState(null);

  // ── Register modal ──
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: "", deviceId: "", location: "", district: "", type: "Temperature & Humidity" });
  const [regErrors, setRegErrors] = useState({});
  const [regSuccess, setRegSuccess] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // ── Edit modal ──
  const [editDevice, setEditDevice] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  // ── Prediction (Overview) ──
  const [sensorData] = useState(MOCK_SENSOR);
  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState("Low");
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState("");
  const [probabilities, setProbabilities] = useState({});
  const [riskAdvice, setRiskAdvice] = useState("");

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

  const value = {
    devices, devicesLoading, devicesError,
    removeLoadingId, removeDevice,
    showRegisterModal, setShowRegisterModal,
    newDevice, setNewDevice, regErrors, setRegErrors, regSuccess, regLoading, registerDevice,
    editDevice, setEditDevice, editForm, setEditForm, editErrors, setEditErrors,
    editLoading, editSuccess, openEdit, saveEdit,
    sensorData, riskScore, riskLevel, predictionLoading, predictionError,
    probabilities, riskAdvice, fetchPrediction,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}