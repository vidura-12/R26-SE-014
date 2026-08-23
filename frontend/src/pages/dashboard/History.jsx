import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { MOCK_HISTORY } from "./dashboardTheme";
import { RiskBadge } from "./DashboardComponents";

const FILTER_COLOR = { critical: "#dc2626", high: "#ea580c", medium: "#ca8a04", low: "#16a34a", all: "#0f172a" };
const FILTER_COLOR_DARK = { critical: "#dc2626", high: "#ea580c", medium: "#ca8a04", low: "#16a34a", all: "#334155" };

export default function History() {
  const { t } = useOutletContext();
  const [historyFilter, setHistoryFilter] = useState("all");

  const filteredHistory = historyFilter === "all"
    ? MOCK_HISTORY
    : MOCK_HISTORY.filter(h => h.level.toLowerCase() === historyFilter);

  const filterColor = t.__isDark ? FILTER_COLOR_DARK : FILTER_COLOR;

  const stats = [
    { label: "Avg Risk Score", val: "65", icon: "📊", color: "#ea580c" },
    { label: "Critical Days", val: MOCK_HISTORY.filter(h => h.level === "Critical").length, icon: "🚨", color: "#dc2626" },
    { label: "High Risk Days", val: MOCK_HISTORY.filter(h => h.level === "High").length, icon: "⚠️", color: "#ea580c" },
    { label: "Safe Days", val: MOCK_HISTORY.filter(h => h.level === "Low").length, icon: "✅", color: "#16a34a" },
  ];

  return (
    <div className="fade-up">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: t.cardBg, borderRadius: 20, padding: "22px 24px",
            border: `1.5px solid ${s.color}40`, boxShadow: `0 8px 24px ${s.color}10, ${t.cardShadow}`,
            position: "relative", overflow: "hidden", transition: "all 0.3s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${s.color}10, transparent 70%)` }} />
            <div style={{ fontSize: 28, marginBottom: 12, position: "relative", zIndex: 1 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color, fontFamily: "'Playfair Display',serif", position: "relative", zIndex: 1 }}>{s.val}</div>
            <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6, position: "relative", zIndex: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: t.cardBg, borderRadius: 24, padding: 32, border: `1.5px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
          {["all", "critical", "high", "medium", "low"].map(f => (
            <button key={f} onClick={() => setHistoryFilter(f)} style={{
              padding: "9px 20px", borderRadius: 99, fontSize: 13, fontWeight: 800, cursor: "pointer",
              border: `2px solid ${filterColor[f]}`,
              background: historyFilter === f ? filterColor[f] : t.inputBg,
              color: historyFilter === f ? "white" : t.textSecondary,
              transition: "all 0.2s",
              boxShadow: historyFilter === f ? `0 4px 16px ${filterColor[f]}40` : "none",
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${t.divider}` }}>
              {["Date", "Risk Score", "Risk Level", "Temp (°C)", "Humidity (%)", "Rainfall (mm)"].map(h => (
                <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 800, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", paddingBottom: 16, paddingRight: 16 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map(row => (
              <tr key={row.date} className="history-row" style={{ background: t.tableRowBg, borderRadius: 14, boxShadow: t.tableRowShadow }}>
                <td style={{ padding: "16px 16px 16px 20px", fontSize: 14, fontWeight: 800, color: t.textPrimary, borderRadius: "14px 0 0 14px" }}>{row.date}</td>
                <td style={{ padding: "16px 16px 16px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 90, height: 8, background: t.divider, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        width: `${row.risk}%`, height: "100%", borderRadius: 99,
                        background: row.risk >= 80 ? "linear-gradient(90deg, #dc2626, #ef4444)" : row.risk >= 60 ? "linear-gradient(90deg, #ea580c, #f97316)" : row.risk >= 40 ? "linear-gradient(90deg, #ca8a04, #eab308)" : "linear-gradient(90deg, #16a34a, #22c55e)",
                      }} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 900, color: t.textPrimary, fontFamily: "'Playfair Display',serif" }}>{row.risk}</span>
                  </div>
                </td>
                <td style={{ padding: "16px 16px 16px 0" }}><RiskBadge level={row.level} t={t} /></td>
                <td style={{ padding: "16px 16px 16px 0", fontSize: 14, color: t.textSecondary, fontWeight: 700 }}>{row.temp}</td>
                <td style={{ padding: "16px 16px 16px 0", fontSize: 14, color: t.textSecondary, fontWeight: 700 }}>{row.humidity}</td>
                <td style={{ padding: "16px 20px 16px 0", fontSize: 14, color: t.textSecondary, fontWeight: 700, borderRadius: "0 14px 14px 0" }}>{row.rainfall}</td>
              </tr>
            ))}
            {filteredHistory.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: t.textMuted, fontSize: 15, fontWeight: 600 }}>No records for this risk level</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}