import { getRiskConfig } from "./dashboardTheme";

// ─── Theme Toggle ───────────────────────────────────────────────────────────
export function ThemeToggle({ isDark, toggleTheme, t }) {
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 42, height: 42, borderRadius: 12,
        border: `1.5px solid ${t.cardBorder}`,
        background: t.inputBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, cursor: "pointer",
        boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.4)" : "0 4px 16px rgba(15,23,42,0.06)",
        transition: "all 0.2s", flexShrink: 0,
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
export function Sparkline({ data, color }) {
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
export function RiskGauge({ score, t }) {
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
          fill="none" stroke={t.gaugeTrack} strokeWidth="14" strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s" }}
        />
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="36" fontWeight="900"
          fontFamily="'Playfair Display',serif" fill={color} style={{ textShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>{score}</text>
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="12" fill={t.textMuted}
          fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="600">/ 100</text>
        <text x={cx} y={cy + 28} textAnchor="middle" fontSize="14" fontWeight="800"
          fill={color} fontFamily="'Plus Jakarta Sans',sans-serif">{label}</text>
      </svg>
    </div>
  );
}

// ─── Probability Bars ─────────────────────────────────────────────────────────
export function ProbabilityBars({ probabilities, t }) {
  if (!probabilities || Object.keys(probabilities).length === 0) return null;
  const levelOrder = ["Critical Risk", "High Risk", "Medium Risk", "Low Risk"];
  const levelShort = { "Critical Risk": "Critical", "High Risk": "High", "Medium Risk": "Medium", "Low Risk": "Low" };
  const riskCfg = getRiskConfig(t.__isDark);
  const levelColor = { "Critical Risk": riskCfg.Critical.color, "High Risk": riskCfg.High.color, "Medium Risk": riskCfg.Medium.color, "Low Risk": riskCfg.Low.color };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
        Model Confidence Distribution
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {levelOrder.map(lvl => {
          const prob = probabilities[lvl] || 0;
          return (
            <div key={lvl} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, width: 56, textAlign: "right", letterSpacing: "0.02em" }}>{levelShort[lvl]}</span>
              <div style={{ flex: 1, height: 10, background: t.divider, borderRadius: 99, overflow: "hidden", position: "relative" }}>
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
export function SensorCard({ icon, label, value, unit, sparkData, color, trend, t }) {
  return (
    <div style={{
      background: t.cardBg, borderRadius: 20, padding: "22px 24px",
      border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow,
      transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = t.cardShadowHover; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = t.cardShadow; }}
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
            fontSize: 22, marginBottom: 10, border: `1px solid ${color}20`,
          }}>{icon}</div>
          <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 800,
          color: trend >= 0 ? "#16a34a" : "#dc2626",
          background: trend >= 0 ? (t.__isDark ? "#0f2718" : "#dcfce7") : (t.__isDark ? "#2a1414" : "#fef2f2"),
          padding: "4px 10px", borderRadius: 99,
          border: `1px solid ${trend >= 0 ? "#16a34a40" : "#dc262640"}`,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {trend >= 0 ? "↗" : "↘"} {Math.abs(trend)}%
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: t.textPrimary, fontFamily: "'Playfair Display',serif", lineHeight: 1, position: "relative", zIndex: 1 }}>
        {value}<span style={{ fontSize: 14, fontWeight: 600, color: t.textMuted, marginLeft: 5 }}>{unit}</span>
      </div>
      <div style={{ marginTop: 14, position: "relative", zIndex: 1 }}>
        <Sparkline data={sparkData} color={color} />
      </div>
    </div>
  );
}

// ─── Device Card ──────────────────────────────────────────────────────────────
export function DeviceCard({ device, onRemove, removeLoading, onEdit, onViewSensor, t }) {
  const isOnline = device.status === "online";
  const battColor = device.battery > 50 ? "#16a34a" : device.battery > 20 ? "#ca8a04" : "#dc2626";
  const battBg    = t.__isDark
    ? (device.battery > 50 ? "#0f2718" : device.battery > 20 ? "#2a2410" : "#2a1414")
    : (device.battery > 50 ? "#dcfce7" : device.battery > 20 ? "#fefce8" : "#fef2f2");
  return (
    <div style={{
      background: t.cardBg, borderRadius: 20, padding: "22px 26px",
      border: `1.5px solid ${isOnline ? "rgba(22, 163, 74, 0.25)" : "rgba(220, 38, 38, 0.25)"}`,
      boxShadow: t.cardShadow,
      display: "flex", alignItems: "center", gap: 20,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = t.cardShadowHover; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = t.cardShadow; }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, width: 4, height: "100%",
        background: isOnline ? "linear-gradient(180deg, #16a34a, #22c55e)" : "linear-gradient(180deg, #dc2626, #ef4444)",
        borderRadius: "20px 0 0 20px",
      }} />
      <div style={{
        width: 52, height: 52, borderRadius: 16, flexShrink: 0,
        background: isOnline
          ? (t.__isDark ? "linear-gradient(135deg, #0f2718, #133420)" : "linear-gradient(135deg, #dcfce7, #bbf7d0)")
          : (t.__isDark ? "linear-gradient(135deg, #2a1414, #331a1a)" : "linear-gradient(135deg, #fef2f2, #fecaca)"),
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
        position: "relative",
        border: `1.5px solid ${isOnline ? "#16a34a40" : "#dc262640"}`,
        boxShadow: isOnline ? "0 4px 12px rgba(22, 163, 74, 0.15)" : "0 4px 12px rgba(220, 38, 38, 0.1)",
      }}>
        📡
        <div style={{
          position: "absolute", top: -3, right: -3, width: 14, height: 14,
          borderRadius: "50%", background: isOnline ? "#22c55e" : "#ef4444",
          border: `3px solid ${t.__isDark ? "#10192b" : "white"}`,
          boxShadow: isOnline ? "0 0 0 3px rgba(34, 197, 94, 0.25), 0 2px 8px rgba(34, 197, 94, 0.3)" : "0 2px 8px rgba(239, 68, 68, 0.3)",
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: t.textPrimary, marginBottom: 4, letterSpacing: "-0.01em" }}>{device.name}</div>
        <div style={{ fontSize: 13, color: t.textSecondary, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>📍</span> {device.location} · <span style={{ color: t.textMuted }}>{device.lastSeen}</span>
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 6, background: t.divider, borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              width: `${device.battery}%`, height: "100%",
              background: `linear-gradient(90deg, ${battColor}, ${battColor}cc)`,
              borderRadius: 99, transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: device.battery < 20 ? "0 0 8px rgba(220, 38, 38, 0.3)" : "none",
            }} />
          </div>
          <span style={{ fontSize: 12, color: battColor, fontWeight: 800, minWidth: 36, background: battBg, padding: "2px 8px", borderRadius: 99, border: `1px solid ${battColor}30` }}>{device.battery}%</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 800, padding: "5px 14px", borderRadius: 99,
          background: isOnline ? (t.__isDark ? "#0f2718" : "#dcfce7") : (t.__isDark ? "#2a1414" : "#fef2f2"),
          color: isOnline ? (t.__isDark ? "#4ade80" : "#15803d") : (t.__isDark ? "#f87171" : "#b91c1c"),
          border: `1.5px solid ${isOnline ? "#16a34a40" : "#dc262640"}`,
          textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center",
        }}>{device.status}</span>
        <button
          onClick={() => onViewSensor(device)}
          style={{
            fontSize: 12, padding: "6px 14px", borderRadius: 10, cursor: "pointer",
            border: "1.5px solid #16a34a",
            background: t.__isDark ? "linear-gradient(135deg, #0f2718, #133420)" : "linear-gradient(135deg, #dcfce7, #f0fdf4)",
            color: t.__isDark ? "#4ade80" : "#15803d", fontWeight: 700, transition: "all 0.2s",
          }}
        >📊 Sensor Data</button>
        <button
          onClick={() => onEdit(device)}
          style={{
            fontSize: 12, padding: "6px 14px", borderRadius: 10, cursor: "pointer",
            border: `1.5px solid ${t.inputBorder}`, background: t.inputBg,
            color: t.textSecondary, fontWeight: 700, transition: "all 0.2s",
          }}
        >✏️ Edit</button>
        <button
          onClick={() => onRemove(device.firestoreId)}
          disabled={removeLoading}
          style={{
            fontSize: 12, padding: "6px 14px", borderRadius: 10,
            cursor: removeLoading ? "not-allowed" : "pointer",
            border: "1.5px solid #dc262660", background: t.inputBg, color: "#dc2626", fontWeight: 700,
            display: "flex", alignItems: "center", gap: 5, justifyContent: "center", transition: "all 0.2s",
          }}
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
export function RiskBadge({ level, t }) {
  const riskCfg = getRiskConfig(t.__isDark);
  const cfg = riskCfg[level] || riskCfg.Low;
  return (
    <span style={{
      fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 99,
      background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`,
      textTransform: "uppercase", letterSpacing: "0.08em",
      boxShadow: `0 2px 8px ${cfg.color}18`,
    }}>{level}</span>
  );
}