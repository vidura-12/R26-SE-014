import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useTheme } from "../../context/ThemeProvider";
import DashboardProvider, { useDashboard } from "./DashboardContext";
import { getTokens, DISTRICTS } from "./dashboardTheme";
import { ThemeToggle } from "./DashboardComponents";

const NAV_ITEMS = [
  { id: "overview",    icon: "🏠", label: "Overview",    path: "/dashboard" },
  { id: "devices",     icon: "📡", label: "Devices",     path: "/dashboard/devices" },
  { id: "history",     icon: "📋", label: "History",     path: "/dashboard/history" },
  { id: "sensor-data", icon: "📊", label: "Sensor Data", path: "/dashboard/sensor-data" },
];

function getActiveTab(pathname) {
  if (pathname.startsWith("/dashboard/devices")) return "devices";
  if (pathname.startsWith("/dashboard/history")) return "history";
  if (pathname.startsWith("/dashboard/sensor-data")) return "sensor-data";
  return "overview";
}

// ─── Register Device Modal ───────────────────────────────────────────────────
function RegisterModal({ t }) {
  const {
    showRegisterModal, setShowRegisterModal,
    newDevice, setNewDevice, regErrors, setRegErrors, regSuccess, regLoading, registerDevice,
  } = useDashboard();

  if (!showRegisterModal) return null;

  const inputStyle = (err) => ({
    width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14,
    border: `2px solid ${err ? "#dc2626" : t.inputBorder}`, outline: "none",
    background: t.inputBg, color: t.inputText, boxSizing: "border-box",
    fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.2s",
  });

  return (
    <div className="modal-overlay" style={{
      position: "fixed", inset: 0, background: t.modalOverlay, backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
    }} onClick={(e) => { if (e.target === e.currentTarget) setShowRegisterModal(false); }}>
      <div style={{
        background: t.modalBg, borderRadius: 28, width: "100%", maxWidth: 540,
        boxShadow: "0 32px 96px rgba(0,0,0,0.35)", maxHeight: "90vh", overflowY: "auto",
        border: `1.5px solid ${t.cardBorder}`,
      }}>
        {regSuccess ? (
          <div style={{ padding: "64px 48px", textAlign: "center" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: t.__isDark ? "linear-gradient(135deg, #0f2718, #133420)" : "linear-gradient(135deg, #dcfce7, #bbf7d0)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 24px",
              border: "3px solid #16a34a60", boxShadow: "0 8px 24px rgba(22, 163, 74, 0.2)",
            }}>✅</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: t.textPrimary, marginBottom: 10, fontWeight: 900 }}>Device Registered!</h3>
            <p style={{ fontSize: 15, color: t.textSecondary, fontWeight: 500 }}>Your sensor is now active and monitoring</p>
          </div>
        ) : (
          <div style={{ padding: "36px 40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
              <div>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, background: t.blueChipBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, marginBottom: 12, border: `1.5px solid ${t.blueChipBorder}`,
                }}>📡</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: t.textPrimary, marginBottom: 6, letterSpacing: "-0.02em" }}>Register New Device</h3>
                <p style={{ fontSize: 14, color: t.textSecondary, fontWeight: 500 }}>Add a sensor to your plantation monitoring network</p>
              </div>
              <button onClick={() => setShowRegisterModal(false)} style={{
                background: t.closeBtnBg, border: "none", borderRadius: "50%",
                width: 40, height: 40, cursor: "pointer", fontSize: 20, color: t.textSecondary,
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
              }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: t.textSecondary, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Device Name *</label>
                <input value={newDevice.name} onChange={e => { setNewDevice(p => ({...p, name: e.target.value})); setRegErrors(p => ({...p, name: ""})); }}
                  placeholder="e.g. North Field Temperature Sensor" style={inputStyle(regErrors.name)} />
                {regErrors.name && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6, fontWeight: 600 }}>⚠️ {regErrors.name}</div>}
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: t.textSecondary, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Device ID *</label>
                <input value={newDevice.deviceId} onChange={e => { setNewDevice(p => ({...p, deviceId: e.target.value})); setRegErrors(p => ({...p, deviceId: ""})); }}
                  placeholder="e.g. DEV-004 or serial number" style={inputStyle(regErrors.deviceId)} />
                {regErrors.deviceId && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6, fontWeight: 600 }}>⚠️ {regErrors.deviceId}</div>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 800, color: t.textSecondary, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>District *</label>
                  <select value={newDevice.district} onChange={e => { setNewDevice(p => ({...p, district: e.target.value})); setRegErrors(p => ({...p, district: ""})); }}
                    style={inputStyle(regErrors.district)}>
                    <option value="">Select district</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {regErrors.district && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6, fontWeight: 600 }}>⚠️ {regErrors.district}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 800, color: t.textSecondary, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sensor Type</label>
                  <select value={newDevice.type} onChange={e => setNewDevice(p => ({...p, type: e.target.value}))} style={inputStyle(false)}>
                    {["Temperature & Humidity","Rainfall","Soil Moisture","Wind Speed","Multi-Sensor"].map(t2 => <option key={t2} value={t2}>{t2}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: t.textSecondary, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Field Location / GPS (optional)</label>
                <input value={newDevice.location} onChange={e => setNewDevice(p => ({...p, location: e.target.value}))}
                  placeholder="e.g. North Zone or 6.0367° N, 80.2170° E" style={inputStyle(false)} />
              </div>
              <div style={{
                padding: "14px 18px", background: t.__isDark ? "linear-gradient(135deg, #0f2718, #0c2015)" : "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                borderRadius: 14, border: "1.5px solid #16a34a30", display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>💡</span>
                <p style={{ fontSize: 13, color: t.__isDark ? "#4ade80" : "#15803d", lineHeight: 1.7, fontWeight: 600 }}>The Device ID is printed on your sensor hardware. After registration, the device will begin sending data within 5 minutes.</p>
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                <button onClick={() => setShowRegisterModal(false)} style={{
                  flex: 1, padding: "14px", borderRadius: 14, border: `2px solid ${t.inputBorder}`,
                  background: t.inputBg, color: t.textSecondary, fontSize: 14, fontWeight: 800, cursor: "pointer",
                }}>Cancel</button>
                <button onClick={registerDevice} disabled={regLoading} style={{
                  flex: 2, padding: "14px", borderRadius: 14, border: "none",
                  background: regLoading ? "#64748b" : "linear-gradient(135deg, #10b981, #059669)",
                  color: "white", fontSize: 14, fontWeight: 800, cursor: regLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: regLoading ? "none" : "0 6px 20px rgba(16, 185, 129, 0.3)",
                }}>
                  {regLoading ? <><div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTop: "2.5px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Registering...</> : "📡 Register Device"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit Device Modal ────────────────────────────────────────────────────────
function EditModal({ t }) {
  const { editDevice, setEditDevice, editForm, setEditForm, editErrors, setEditErrors, editLoading, editSuccess, saveEdit } = useDashboard();

  if (!editDevice) return null;

  const inputStyle = (err) => ({
    width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14,
    border: `2px solid ${err ? "#dc2626" : t.inputBorder}`, outline: "none",
    background: t.inputBg, color: t.inputText, boxSizing: "border-box",
    fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.2s",
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: t.modalOverlay, backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
    }} onClick={(e) => { if (e.target === e.currentTarget && !editLoading) setEditDevice(null); }}>
      <div style={{
        background: t.modalBg, borderRadius: 28, width: "100%", maxWidth: 540,
        boxShadow: "0 32px 96px rgba(0,0,0,0.35)", maxHeight: "90vh", overflowY: "auto",
        border: `1.5px solid ${t.cardBorder}`,
      }}>
        {editSuccess ? (
          <div style={{ padding: "64px 48px", textAlign: "center" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: t.__isDark ? "linear-gradient(135deg, #0f2718, #133420)" : "linear-gradient(135deg, #dcfce7, #bbf7d0)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 24px",
              border: "3px solid #16a34a60", boxShadow: "0 8px 24px rgba(22, 163, 74, 0.2)",
            }}>✅</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: t.textPrimary, marginBottom: 10, fontWeight: 900 }}>Device Updated!</h3>
            <p style={{ fontSize: 15, color: t.textSecondary, fontWeight: 500 }}>Your sensor details have been saved successfully.</p>
          </div>
        ) : (
          <div style={{ padding: "36px 40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
              <div>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, background: t.blueChipBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, marginBottom: 12, border: `1.5px solid ${t.blueChipBorder}`,
                }}>✏️</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: t.textPrimary, marginBottom: 6, letterSpacing: "-0.02em" }}>Edit Device</h3>
                <p style={{ fontSize: 14, color: t.textSecondary, fontWeight: 500 }}>Update your sensor details below</p>
              </div>
              <button onClick={() => setEditDevice(null)} style={{
                background: t.closeBtnBg, border: "none", borderRadius: "50%",
                width: 40, height: 40, cursor: "pointer", fontSize: 20, color: t.textSecondary,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: t.textSecondary, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Device Name *</label>
                <input value={editForm.name} onChange={e => { setEditForm(f => ({...f, name: e.target.value})); setEditErrors(f => ({...f, name: ""})); }}
                  placeholder="e.g. North Field Temperature Sensor" style={inputStyle(editErrors.name)} />
                {editErrors.name && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6, fontWeight: 600 }}>⚠️ {editErrors.name}</div>}
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: t.textSecondary, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Device ID *</label>
                <input value={editForm.deviceId} onChange={e => { setEditForm(f => ({...f, deviceId: e.target.value})); setEditErrors(f => ({...f, deviceId: ""})); }}
                  placeholder="e.g. DEV-001" style={inputStyle(editErrors.deviceId)} />
                {editErrors.deviceId && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6, fontWeight: 600 }}>⚠️ {editErrors.deviceId}</div>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 800, color: t.textSecondary, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>District *</label>
                  <select value={editForm.district} onChange={e => { setEditForm(f => ({...f, district: e.target.value})); setEditErrors(f => ({...f, district: ""})); }}
                    style={inputStyle(editErrors.district)}>
                    <option value="">Select district</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {editErrors.district && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6, fontWeight: 600 }}>⚠️ {editErrors.district}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 800, color: t.textSecondary, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sensor Type</label>
                  <select value={editForm.type} onChange={e => setEditForm(f => ({...f, type: e.target.value}))} style={inputStyle(false)}>
                    {["Temperature & Humidity","Rainfall","Soil Moisture","Wind Speed","Multi-Sensor"].map(t2 => <option key={t2} value={t2}>{t2}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: t.textSecondary, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Field Location / GPS (optional)</label>
                <input value={editForm.fieldLocation} onChange={e => setEditForm(f => ({...f, fieldLocation: e.target.value}))}
                  placeholder="e.g. North Zone or 6.0367° N, 80.2170° E" style={inputStyle(false)} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: t.textSecondary, display: "block", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Device Status</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {["online", "offline"].map(s => (
                    <button key={s} onClick={() => setEditForm(f => ({...f, status: s}))} style={{
                      flex: 1, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer",
                      border: `2px solid ${editForm.status === s ? (s === "online" ? "#16a34a" : "#dc2626") : t.inputBorder}`,
                      background: editForm.status === s ? (s === "online" ? (t.__isDark ? "#0f2718" : "#f0fdf4") : (t.__isDark ? "#2a1414" : "#fef2f2")) : t.inputBg,
                      color: editForm.status === s ? (s === "online" ? "#16a34a" : "#dc2626") : t.textMuted,
                    }}>{s === "online" ? "🟢 Online" : "🔴 Offline"}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                <button onClick={() => setEditDevice(null)} style={{
                  flex: 1, padding: "14px", borderRadius: 14, border: `2px solid ${t.inputBorder}`,
                  background: t.inputBg, color: t.textSecondary, fontSize: 14, fontWeight: 800, cursor: "pointer",
                }}>Cancel</button>
                <button onClick={saveEdit} disabled={editLoading} style={{
                  flex: 2, padding: "14px", borderRadius: 14, border: "none",
                  background: editLoading ? "#64748b" : "linear-gradient(135deg, #10b981, #059669)",
                  color: "white", fontSize: 14, fontWeight: 800, cursor: editLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: editLoading ? "none" : "0 6px 20px rgba(16, 185, 129, 0.3)",
                }}>
                  {editLoading ? <><div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTop: "2.5px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/> Saving...</> : "💾 Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar + Topbar Shell ──────────────────────────────────────────────────
function DashboardShell() {
  const nav = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const t = { ...getTokens(isDark), __isDark: isDark };
  const { devices, setShowRegisterModal } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeTab = getActiveTab(location.pathname);

  const handleSignOut = async () => {
    await signOut(auth);
    nav("/login");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.5);opacity:0.4;} }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .tab-btn { border:none; background:none; cursor:pointer; transition:all 0.25s; width:100%; text-align:left; }
        .tab-btn:hover { background:rgba(255,255,255,0.08); }
        .stat-card { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
        .modal-overlay { animation: fadeIn 0.25s ease; }
        select { appearance:none; background-repeat:no-repeat; background-position:right 14px center; padding-right:40px !important; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:${t.dashedBorder}; border-radius:99px; }
        .history-row:hover { filter: brightness(${t.__isDark ? 1.15 : 0.98}); }
        .theme-toggle-btn:hover { transform: scale(1.06); }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: t.pageBg, transition: "background 0.4s" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: sidebarOpen ? 260 : 76, flexShrink: 0,
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          display: "flex", flexDirection: "column",
          transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden",
          position: "sticky", top: 0, height: "100vh",
          boxShadow: "4px 0 24px rgba(15, 23, 42, 0.15)",
        }}>
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

          <nav style={{ flex: 1, padding: "20px 12px" }}>
            {NAV_ITEMS.map((item) => (
              <button key={item.id} className="tab-btn" onClick={() => nav(item.path)}
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

            <button className="tab-btn" onClick={() => nav("/advisory")}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 12, marginBottom: 6, background: "transparent", borderLeft: "3px solid transparent" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🛡️</span>
              {sidebarOpen && <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", whiteSpace: "nowrap" }}>Advisory</span>}
            </button>
          </nav>

          <div style={{ padding: "20px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={() => setShowRegisterModal(true)} style={{
              width: "100%", padding: "13px 14px", borderRadius: 12,
              border: "1.5px solid rgba(16, 185, 129, 0.4)",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08))",
              color: "#34d399", fontWeight: 800, fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              justifyContent: sidebarOpen ? "flex-start" : "center", transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)",
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>➕</span>
              {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>Register Device</span>}
            </button>
          </div>

          <div style={{ padding: "14px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: sidebarOpen ? "space-between" : "center", alignItems: "center", gap: 8 }}>
              <div className="theme-toggle-btn" style={{ transition: "transform 0.2s" }}>
                <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} t={{ ...t, cardBorder: "rgba(255,255,255,0.12)", inputBg: "rgba(255,255,255,0.05)" }} />
              </div>
              {sidebarOpen && (
                <button onClick={() => setSidebarOpen(false)} style={{
                  background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", color: "#64748b",
                  fontSize: 18, padding: "10px", borderRadius: 10, transition: "all 0.2s",
                }}>◀</button>
              )}
            </div>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} style={{
                background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", color: "#64748b",
                fontSize: 18, padding: "10px", borderRadius: 10, transition: "all 0.2s",
              }}>▶</button>
            )}
            <button onClick={handleSignOut} style={{
              background: "none", border: "none", cursor: "pointer", color: "#64748b",
              fontSize: 13, fontWeight: 700, padding: "10px 14px", borderRadius: 10,
              textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 18 }}>🚪</span>{sidebarOpen && "Sign Out"}
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, overflowY: "auto", padding: "36px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 900,
                color: t.textPrimary, marginBottom: 6, letterSpacing: "-0.02em",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 28 }}>{NAV_ITEMS.find(n => n.id === activeTab)?.icon}</span>
                {NAV_ITEMS.find(n => n.id === activeTab)?.label}
              </h1>
              <p style={{ fontSize: 14, color: t.textSecondary, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, background: t.cardBg,
                padding: "10px 18px", borderRadius: 14, border: `1.5px solid ${t.cardBorder}`,
                fontSize: 14, color: t.textPrimary, fontWeight: 700, boxShadow: t.cardShadow,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", animation: "pulse 2.5s infinite", boxShadow: "0 0 8px rgba(34, 197, 94, 0.4)" }} />
                {devices.filter(d => d.status === "online").length} devices online
              </div>
              <button onClick={() => setShowRegisterModal(true)} style={{
                background: "linear-gradient(135deg, #10b981, #059669)", color: "white",
                border: "none", padding: "11px 22px", borderRadius: 14, fontSize: 14,
                fontWeight: 800, cursor: "pointer",
                boxShadow: "0 6px 20px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                transition: "all 0.25s", display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 18 }}>+</span> Register Device
              </button>
            </div>
          </div>

          <Outlet context={{ t }} />
        </main>
      </div>

      <RegisterModal t={t} />
      <EditModal t={t} />
    </>
  );
}

// ─── Exported Layout (provider wraps shell) ──────────────────────────────────
export default function DashboardLayout() {
  return (
    <DashboardProvider>
      <DashboardShell />
    </DashboardProvider>
  );
}