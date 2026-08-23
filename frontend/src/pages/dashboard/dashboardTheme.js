// ─── Shared constants ───────────────────────────────────────────────────────
export const MOCK_SENSOR = {
  soilPH: 5.9,
  soilMoistureVWC: 31.5,
  soilTempC: 27.0,
  humidity: 74.2,
  rainfall: 12.6,
  windSpeed: 9.1,
  uvIndex: 6.2,
};

export const MOCK_HISTORY = [
  { date: "2025-05-08", risk: 82, temp: 29.1, humidity: 78, rainfall: 18.2, level: "High" },
  { date: "2025-05-07", risk: 67, temp: 27.8, humidity: 71, rainfall: 9.4,  level: "Medium" },
  { date: "2025-05-06", risk: 45, temp: 26.4, humidity: 65, rainfall: 3.1,  level: "Low" },
  { date: "2025-05-05", risk: 91, temp: 30.2, humidity: 83, rainfall: 24.7, level: "Critical" },
  { date: "2025-05-04", risk: 38, temp: 25.9, humidity: 60, rainfall: 1.2,  level: "Low" },
  { date: "2025-05-03", risk: 74, temp: 28.7, humidity: 76, rainfall: 14.5, level: "High" },
  { date: "2025-05-02", risk: 55, temp: 27.3, humidity: 68, rainfall: 6.8,  level: "Medium" },
];

export const DISTRICTS = [
  "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha",
  "Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Kurunegala","Matara","Ratnapura",
];

export const API_BASE_URL = "http://localhost:8000";

// ─── Risk level config (semantic colors adapt slightly per theme) ──────────
export function getRiskConfig(isDark) {
  return isDark
    ? {
        Critical: { color: "#f87171", bg: "#2a1414", border: "#7f1d1d", label: "Critical Risk", gradient: "linear-gradient(135deg, #dc2626, #b91c1c)" },
        High:     { color: "#fb923c", bg: "#2a1a0e", border: "#7c2d12", label: "High Risk",     gradient: "linear-gradient(135deg, #ea580c, #c2410c)" },
        Medium:   { color: "#facc15", bg: "#2a2410", border: "#713f12", label: "Medium Risk",   gradient: "linear-gradient(135deg, #ca8a04, #a16207)" },
        Low:      { color: "#4ade80", bg: "#132a1c", border: "#14532d", label: "Low Risk",      gradient: "linear-gradient(135deg, #16a34a, #15803d)" },
      }
    : {
        Critical: { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", label: "Critical Risk", gradient: "linear-gradient(135deg, #dc2626, #b91c1c)" },
        High:     { color: "#ea580c", bg: "#fff7ed", border: "#fdba74", label: "High Risk",     gradient: "linear-gradient(135deg, #ea580c, #c2410c)" },
        Medium:   { color: "#ca8a04", bg: "#fefce8", border: "#fde047", label: "Medium Risk",   gradient: "linear-gradient(135deg, #ca8a04, #a16207)" },
        Low:      { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", label: "Low Risk",      gradient: "linear-gradient(135deg, #16a34a, #15803d)" },
      };
}

// ─── Page/card/text tokens ───────────────────────────────────────────────────
export function getTokens(isDark) {
  return isDark
    ? {
        pageBg: "linear-gradient(135deg, #060b14 0%, #0a0f1a 50%, #060f0a 100%)",
        cardBg: "linear-gradient(145deg, #10192b 0%, #0c1420 100%)",
        cardBorder: "rgba(51,65,85,0.6)",
        cardShadow: "0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)",
        cardShadowHover: "0 16px 48px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)",
        textPrimary: "#f1f5f9",
        textSecondary: "#94a3b8",
        textMuted: "#64748b",
        inputBg: "#0c1420",
        inputBgFocus: "#101a2c",
        inputBorder: "#243044",
        inputBorderFocus: "#3b82f6",
        inputText: "#e2e8f0",
        focusRing: "rgba(59,130,246,0.2)",
        tableRowBg: "#0f1826",
        tableRowShadow: "0 2px 8px rgba(0,0,0,0.35)",
        divider: "#1c2637",
        modalOverlay: "rgba(0,0,0,0.75)",
        modalBg: "linear-gradient(145deg, #10192b 0%, #0c1420 100%)",
        closeBtnBg: "#1c2637",
        closeBtnBgHover: "#243044",
        gaugeTrack: "#1c2637",
        arrowColor: "%2394a3b8",
        dashedBorder: "#334155",
        emptyIconBg: "linear-gradient(135deg, #0f2436, #0c1a2b)",
        blueChipBg: "linear-gradient(135deg, #142a45, #0f2036)",
        blueChipBorder: "#1d4ed84a",
      }
    : {
        pageBg: "linear-gradient(135deg, #f0f9ff 0%, #f1f5f9 50%, #f0fdf4 100%)",
        cardBg: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
        cardBorder: "rgba(226, 232, 240, 0.8)",
        cardShadow: "0 4px 20px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)",
        cardShadowHover: "0 12px 40px rgba(15, 23, 42, 0.1), 0 4px 12px rgba(15, 23, 42, 0.04)",
        textPrimary: "#0f172a",
        textSecondary: "#64748b",
        textMuted: "#94a3b8",
        inputBg: "#fafafa",
        inputBgFocus: "#ffffff",
        inputBorder: "#e2e8f0",
        inputBorderFocus: "#93c5fd",
        inputText: "#0f172a",
        focusRing: "rgba(147, 197, 253, 0.15)",
        tableRowBg: "white",
        tableRowShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
        divider: "#f1f5f9",
        modalOverlay: "rgba(15, 23, 42, 0.6)",
        modalBg: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
        closeBtnBg: "#f1f5f9",
        closeBtnBgHover: "#e2e8f0",
        gaugeTrack: "#e2e8f0",
        arrowColor: "%2364748b",
        dashedBorder: "#cbd5e1",
        emptyIconBg: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
        blueChipBg: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
        blueChipBorder: "#93c5fd40",
      };
}