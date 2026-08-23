import { useOutletContext, useNavigate } from "react-router-dom";
import { useDashboard } from "./DashboardContext";
import { DeviceCard } from "./DashboardComponents";

export default function Devices() {
  const { t } = useOutletContext();
  const nav = useNavigate();
  const {
    devices, devicesLoading, devicesError,
    removeDevice, removeLoadingId, openEdit, setShowRegisterModal,
  } = useDashboard();

  const goToSensorData = (device) => nav("/dashboard/sensor-data", { state: { device } });

  return (
    <div className="fade-up">
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 24, padding: "18px 24px", background: t.cardBg,
        borderRadius: 18, border: `1.5px solid ${t.cardBorder}`, boxShadow: t.cardShadow,
      }}>
        <div style={{ fontSize: 15, color: t.textSecondary, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 32, height: 32, borderRadius: 10, background: t.blueChipBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: `1.5px solid ${t.blueChipBorder}` }}>📡</span>
          {devices.length} device{devices.length !== 1 ? "s" : ""} registered
        </div>
        <button onClick={() => setShowRegisterModal(true)} style={{
          background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none",
          padding: "11px 22px", borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 6px 20px rgba(16, 185, 129, 0.3)", display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>+</span> Register New Device
        </button>
      </div>

      {devicesLoading ? (
        <div style={{ textAlign: "center", padding: "64px 24px", background: t.cardBg, borderRadius: 24, border: `1.5px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
          <div style={{ width: 44, height: 44, border: `3.5px solid ${t.divider}`, borderTop: "3.5px solid #10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
          <p style={{ fontSize: 15, color: t.textSecondary, fontWeight: 700 }}>Loading your devices...</p>
        </div>
      ) : devicesError ? (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          background: t.__isDark ? "linear-gradient(145deg, #2a1414, #201010)" : "linear-gradient(145deg, #fef2f2, #fff5f5)",
          borderRadius: 24, border: "2px solid #dc262640",
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <p style={{ fontSize: 15, color: "#dc2626", fontWeight: 800 }}>{devicesError}</p>
        </div>
      ) : devices.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px", background: t.cardBg, borderRadius: 24, border: `2px dashed ${t.dashedBorder}` }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: t.emptyIconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 20px", border: `2px dashed ${t.blueChipBorder}` }}>📡</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: t.textPrimary, marginBottom: 10 }}>No devices registered yet</div>
          <p style={{ fontSize: 15, color: t.textSecondary, marginBottom: 28, fontWeight: 500 }}>Register your first sensor to start monitoring your plantation</p>
          <button onClick={() => setShowRegisterModal(true)} style={{
            background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none",
            padding: "14px 32px", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)",
          }}>
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
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}