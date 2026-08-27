import { useOutletContext, useNavigate } from "react-router-dom";
import { useDashboard } from "./DashboardContext";
import { useState, useEffect, useMemo } from "react";

/* ─── Status Helpers ─── */
const STATUS_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function getDeviceStatus(device) {
  const lastSeen = device?.lastSeen?.toDate?.() 
    || device?.lastUpdated?.toDate?.() 
    || device?.lastSeen 
    || device?.lastUpdated;
  
  if (!lastSeen) return { state: "unknown", label: "Unknown", since: null };
  
  const lastTime = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);
  const diff = Date.now() - lastTime.getTime();
  
  if (diff < 60_000) return { state: "online", label: "Live", since: lastTime };
  if (diff < STATUS_THRESHOLD_MS) return { state: "recent", label: "Recent", since: lastTime };
  return { state: "offline", label: "Offline", since: lastTime };
}

function timeAgo(date) {
  if (!date) return "";
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── Modern Device Card ─── */
function DeviceCard({ device, onRemove, removeLoading, onEdit, onViewSensor, t }) {
  const [now, setNow] = useState(Date.now());
  const status = useMemo(() => getDeviceStatus(device), [device, now]);
  
  // Re-evaluate status every 30s
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const statusColors = {
    online:  { bg: t.isDark ? "#064e3b" : "#dcfce7", dot: "#22c55e", text: t.isDark ? "#86efac" : "#15803d", border: t.isDark ? "#166534" : "#bbf7d0" },
    recent:  { bg: t.isDark ? "#713f12" : "#fef9c3", dot: "#eab308", text: t.isDark ? "#fde047" : "#a16207", border: t.isDark ? "#854d0e" : "#fde047" },
    offline: { bg: t.isDark ? "#450a0a" : "#fee2e2", dot: "#ef4444", text: t.isDark ? "#fca5a5" : "#b91c1c", border: t.isDark ? "#7f1d1d" : "#fecaca" },
    unknown: { bg: t.isDark ? "#374151" : "#f3f4f6", dot: "#9ca3af", text: t.isDark ? "#d1d5db" : "#4b5563", border: t.isDark ? "#4b5563" : "#e5e7eb" },
  };
  const sc = statusColors[status.state];

  return (
    <div style={{
      background: t.cardBg,
      borderRadius: 20,
      border: `1px solid ${t.cardBorder}`,
      boxShadow: t.cardShadow,
      padding: "20px 24px",
      display: "flex",
      alignItems: "center",
      gap: 20,
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "pointer",
      position: "relative",
      overflow: "hidden",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = t.cardHoverShadow || "0 12px 40px rgba(0,0,0,0.12)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = t.cardShadow;
    }}
    onClick={() => onViewSensor(device)}
    >
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 16, bottom: 16, width: 4, borderRadius: 4,
        background: sc.dot, opacity: 0.8,
      }} />

      {/* Device Icon */}
      <div style={{
        width: 52, height: 52, borderRadius: 16,
        background: t.isDark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, flexShrink: 0, border: `1.5px solid ${t.isDark ? "rgba(16,185,129,0.2)" : "#a7f3d0"}`,
      }}>
        {device.icon || "📡"}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary, letterSpacing: "-0.01em" }}>
            {device.name || device.deviceId}
          </span>
          
          {/* Status Badge */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
            letterSpacing: "0.02em", textTransform: "uppercase",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%", background: sc.dot,
              ...(status.state === "online" ? {
                boxShadow: `0 0 0 3px ${sc.bg}, 0 0 0 5px ${sc.dot}33`,
                animation: "pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              } : {}),
            }} />
            {status.label}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: t.textSecondary, fontWeight: 500 }}>
            ID: <span style={{ fontFamily: "monospace", fontSize: 12, opacity: 0.8 }}>{device.deviceId}</span>
          </span>
          {status.since && (
            <span style={{ fontSize: 12, color: t.textMuted || t.textSecondary, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ opacity: 0.6 }}>⏱</span> {timeAgo(status.since)}
            </span>
          )}
          {device.location && (
            <span style={{ fontSize: 12, color: t.textMuted || t.textSecondary, fontWeight: 500 }}>
              📍 {device.location}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(device); }}
          style={{
            padding: "8px 14px", borderRadius: 10, border: `1px solid ${t.cardBorder}`,
            background: t.isDark ? "rgba(255,255,255,0.04)" : "#f9fafb",
            color: t.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = t.isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6"; e.currentTarget.style.color = t.textPrimary; }}
          onMouseLeave={e => { e.currentTarget.style.background = t.isDark ? "rgba(255,255,255,0.04)" : "#f9fafb"; e.currentTarget.style.color = t.textSecondary; }}
        >
          Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(device); }}
          disabled={removeLoading}
          style={{
            padding: "8px 14px", borderRadius: 10, border: "none",
            background: removeLoading ? "#9ca3af" : "#ef4444",
            color: "white", fontSize: 12, fontWeight: 600, cursor: removeLoading ? "not-allowed" : "pointer",
            opacity: removeLoading ? 0.7 : 1, transition: "all 0.2s",
          }}
          onMouseEnter={e => { if (!removeLoading) e.currentTarget.style.background = "#dc2626"; }}
          onMouseLeave={e => { if (!removeLoading) e.currentTarget.style.background = "#ef4444"; }}
        >
          {removeLoading ? "…" : "Remove"}
        </button>
      </div>
    </div>
  );
}

/* ─── Skeleton Loader ─── */
function DeviceSkeleton({ t }) {
  return (
    <div style={{
      background: t.cardBg, borderRadius: 20, border: `1px solid ${t.cardBorder}`,
      padding: "20px 24px", display: "flex", alignItems: "center", gap: 20,
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: t.skeletonBg || "#e5e7eb", animation: "shimmer 1.5s infinite" }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: 140, height: 16, borderRadius: 6, background: t.skeletonBg || "#e5e7eb", marginBottom: 10, animation: "shimmer 1.5s infinite" }} />
        <div style={{ width: 200, height: 12, borderRadius: 4, background: t.skeletonBg || "#e5e7eb", animation: "shimmer 1.5s infinite 0.2s" }} />
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function Devices() {
  const { t } = useOutletContext();
  const nav = useNavigate();
  const {
    devices, devicesLoading, devicesError,
    removeDevice, removeLoadingId, openEdit, setShowRegisterModal,
  } = useDashboard();

  const goToSensorData = (device) => nav("/dashboard/sensor-data", { state: { device } });

  // Online count for header
  const onlineCount = useMemo(() => 
    devices.filter(d => getDeviceStatus(d).state === "online").length,
  [devices]);

  return (
    <div className="fade-up" style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Inject animations */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 28, padding: "20px 28px",
        background: t.isDark 
          ? "linear-gradient(145deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))" 
          : "linear-gradient(145deg, #ecfdf5, #f0fdf4)",
        borderRadius: 20,
        border: `1.5px solid ${t.isDark ? "rgba(16,185,129,0.15)" : "#bbf7d0"}`,
        boxShadow: t.cardShadow,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: t.isDark ? "rgba(16,185,129,0.15)" : "#d1fae5",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            border: `1.5px solid ${t.isDark ? "rgba(16,185,129,0.25)" : "#a7f3d0"}`,
          }}>
            📡
          </div>
          <div>
            <div style={{ fontSize: 13, color: t.textSecondary, fontWeight: 600, marginBottom: 2, letterSpacing: "0.02em", textTransform: "uppercase" }}>
              Registered Devices
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {devices.length}
              <span style={{ fontSize: 13, fontWeight: 600, color: t.textSecondary, marginLeft: 8 }}>
                {onlineCount > 0 && (
                  <span style={{ color: "#22c55e" }}>• {onlineCount} online</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <button onClick={() => setShowRegisterModal(true)} style={{
          background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none",
          padding: "12px 24px", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)", display: "flex", alignItems: "center", gap: 8,
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(16, 185, 129, 0.4)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(16, 185, 129, 0.3)"; }}
        >
          <span style={{ fontSize: 18, fontWeight: 400 }}>+</span> Register Device
        </button>
      </div>

      {/* States */}
      {devicesLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <DeviceSkeleton t={t} />
          <DeviceSkeleton t={t} />
          <DeviceSkeleton t={t} />
        </div>
      ) : devicesError ? (
        <div style={{
          textAlign: "center", padding: "56px 24px",
          background: t.isDark ? "linear-gradient(145deg, #2a1414, #201010)" : "linear-gradient(145deg, #fef2f2, #fff5f5)",
          borderRadius: 24, border: "1.5px solid rgba(220,38,38,0.15)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 16, filter: "grayscale(0.2)" }}>⚠️</div>
          <p style={{ fontSize: 15, color: "#dc2626", fontWeight: 700, marginBottom: 6 }}>{devicesError}</p>
          <p style={{ fontSize: 13, color: t.textSecondary }}>Please check your connection and try again.</p>
        </div>
      ) : devices.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "80px 24px",
          background: t.cardBg, borderRadius: 24,
          border: `2px dashed ${t.dashedBorder || t.cardBorder}`,
        }}>
          <div style={{
            width: 88, height: 88, borderRadius: 28,
            background: t.isDark ? "rgba(16,185,129,0.08)" : "#f0fdf4",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
            margin: "0 auto 24px", border: `2px dashed ${t.isDark ? "rgba(16,185,129,0.2)" : "#a7f3d0"}`,
          }}>
            📡
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: t.textPrimary, marginBottom: 8, letterSpacing: "-0.01em" }}>
            No devices yet
          </div>
          <p style={{ fontSize: 15, color: t.textSecondary, marginBottom: 32, fontWeight: 500, maxWidth: 320, marginInline: "auto", lineHeight: 1.5 }}>
            Register your first sensor to start monitoring your plantation in real-time.
          </p>
          <button onClick={() => setShowRegisterModal(true)} style={{
            background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none",
            padding: "14px 32px", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Register First Device
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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