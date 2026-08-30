// ============================================================
// SHARED SENSOR DATA
// ============================================================

export const MOCK_SENSOR = {
  soilPH: 5.9,
  soilMoistureVWC: 31.5,
  soilTempC: 27.0,
  humidity: 74.2,
  rainfall: 12.6,
  windSpeed: 9.1,
  uvIndex: 6.2,
};


// ============================================================
// MOCK HISTORY
// ============================================================

export const MOCK_HISTORY = [
  {
    date: "2025-05-08",
    risk: 82,
    temp: 29.1,
    humidity: 78,
    rainfall: 18.2,
    level: "High",
  },
  {
    date: "2025-05-07",
    risk: 67,
    temp: 27.8,
    humidity: 71,
    rainfall: 9.4,
    level: "Medium",
  },
  {
    date: "2025-05-06",
    risk: 45,
    temp: 26.4,
    humidity: 65,
    rainfall: 3.1,
    level: "Low",
  },
  {
    date: "2025-05-05",
    risk: 91,
    temp: 30.2,
    humidity: 83,
    rainfall: 24.7,
    level: "Critical",
  },
  {
    date: "2025-05-04",
    risk: 38,
    temp: 25.9,
    humidity: 60,
    rainfall: 1.2,
    level: "Low",
  },
  {
    date: "2025-05-03",
    risk: 74,
    temp: 28.7,
    humidity: 76,
    rainfall: 14.5,
    level: "High",
  },
  {
    date: "2025-05-02",
    risk: 55,
    temp: 27.3,
    humidity: 68,
    rainfall: 6.8,
    level: "Medium",
  },
];


// ============================================================
// DISTRICTS
// ============================================================

export const DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kurunegala",
  "Matara",
  "Ratnapura",
];


// ============================================================
// BACKEND
// ============================================================

export const API_BASE_URL = "https://wrr-backend.thankfultree-9347156a.southeastasia.azurecontainerapps.io";


// ============================================================
// RISK CONFIGURATION
// ============================================================

export function getRiskConfig(isDark) {
  if (isDark) {
    return {
      Critical: {
        color: "#f87171",
        bg: "#321515",
        border: "#7f1d1d",
        label: "Critical Risk",
        gradient:
          "linear-gradient(135deg, #dc2626, #b91c1c)",
      },

      High: {
        color: "#fb923c",
        bg: "#30200f",
        border: "#7c2d12",
        label: "High Risk",
        gradient:
          "linear-gradient(135deg, #ea580c, #c2410c)",
      },

      Medium: {
        color: "#facc15",
        bg: "#302a0e",
        border: "#713f12",
        label: "Medium Risk",
        gradient:
          "linear-gradient(135deg, #ca8a04, #a16207)",
      },

      Low: {
        color: "#6fd695",
        bg: "#10291a",
        border: "#246b3b",
        label: "Low Risk",
        gradient:
          "linear-gradient(135deg, #2d8a4e, #1a5c2e)",
      },
    };
  }

  return {
    Critical: {
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fca5a5",
      label: "Critical Risk",
      gradient:
        "linear-gradient(135deg, #dc2626, #b91c1c)",
    },

    High: {
      color: "#ea580c",
      bg: "#fff7ed",
      border: "#fdba74",
      label: "High Risk",
      gradient:
        "linear-gradient(135deg, #ea580c, #c2410c)",
    },

    Medium: {
      color: "#ca8a04",
      bg: "#fefce8",
      border: "#fde047",
      label: "Medium Risk",
      gradient:
        "linear-gradient(135deg, #ca8a04, #a16207)",
    },

    Low: {
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#86efac",
      label: "Low Risk",
      gradient:
        "linear-gradient(135deg, #16a34a, #15803d)",
    },
  };
}


// ============================================================
// DASHBOARD TOKENS
// ============================================================

export function getTokens(isDark) {
  if (isDark) {
    return {

      // ======================================================
      // PAGE
      // ======================================================

      pageBg:
        "linear-gradient(160deg, #0a1f11 0%, #0e2a17 50%, #123a1d 100%)",


      // ======================================================
      // CARDS
      // ======================================================

      cardBg:
        "linear-gradient(145deg, #0e2a17 0%, #0a1f11 100%)",

      cardBorder:
        "rgba(76, 175, 115, 0.25)",

      cardShadow:
        "0 8px 32px rgba(0, 0, 0, 0.30)",

      cardShadowHover:
        "0 16px 48px rgba(0, 0, 0, 0.45)",


      // ======================================================
      // TEXT
      // ======================================================

      textPrimary:
        "#eafaf0",

      textSecondary:
        "#8fc9a4",

      textMuted:
        "#6fd695",


      // ======================================================
      // INPUTS
      // ======================================================

      inputBg:
        "#0a1f11",

      inputBgFocus:
        "#0e2a17",

      inputBorder:
        "rgba(76, 175, 115, 0.30)",

      inputBorderFocus:
        "#6fd695",

      inputText:
        "#eafaf0",

      focusRing:
        "rgba(111, 214, 149, 0.20)",


      // ======================================================
      // TABLE
      // ======================================================

      tableRowBg:
        "#0e2a17",

      tableRowShadow:
        "0 2px 8px rgba(0, 0, 0, 0.25)",

      divider:
        "rgba(76, 175, 115, 0.15)",


      // ======================================================
      // MODALS
      // ======================================================

      modalOverlay:
        "rgba(0, 0, 0, 0.72)",

      modalBg:
        "linear-gradient(145deg, #0e2a17 0%, #0a1f11 100%)",

      closeBtnBg:
        "rgba(76, 175, 115, 0.12)",

      closeBtnBgHover:
        "rgba(76, 175, 115, 0.20)",


      // ======================================================
      // GAUGE
      // ======================================================

      gaugeTrack:
        "rgba(76, 175, 115, 0.15)",

      arrowColor:
        "%238fc9a4",

      dashedBorder:
        "rgba(76, 175, 115, 0.35)",


      // ======================================================
      // EMPTY STATE
      // ======================================================

      emptyIconBg:
        "linear-gradient(135deg, #0e2a17, #0a1f11)",


      // ======================================================
      // GREEN CHIPS
      // ======================================================

      blueChipBg:
        "linear-gradient(135deg, rgba(76, 175, 115, 0.15), rgba(45, 138, 78, 0.10))",

      blueChipBorder:
        "rgba(76, 175, 115, 0.30)",
    };
  }


  // ==========================================================
  // LIGHT THEME
  // ==========================================================

  return {

    pageBg:
      "linear-gradient(135deg, #f0f9ff 0%, #f1f5f9 50%, #f0fdf4 100%)",

    cardBg:
      "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",

    cardBorder:
      "rgba(226, 232, 240, 0.8)",

    cardShadow:
      "0 4px 20px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)",

    cardShadowHover:
      "0 12px 40px rgba(15, 23, 42, 0.1), 0 4px 12px rgba(15, 23, 42, 0.04)",

    textPrimary:
      "#0f172a",

    textSecondary:
      "#64748b",

    textMuted:
      "#94a3b8",

    inputBg:
      "#fafafa",

    inputBgFocus:
      "#ffffff",

    inputBorder:
      "#e2e8f0",

    inputBorderFocus:
      "#93c5fd",

    inputText:
      "#0f172a",

    focusRing:
      "rgba(147, 197, 253, 0.15)",

    tableRowBg:
      "white",

    tableRowShadow:
      "0 2px 8px rgba(15, 23, 42, 0.03)",

    divider:
      "#f1f5f9",

    modalOverlay:
      "rgba(15, 23, 42, 0.6)",

    modalBg:
      "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",

    closeBtnBg:
      "#f1f5f9",

    closeBtnBgHover:
      "#e2e8f0",

    gaugeTrack:
      "#e2e8f0",

    arrowColor:
      "%2364748b",

    dashedBorder:
      "#cbd5e1",

    emptyIconBg:
      "linear-gradient(135deg, #f0f9ff, #e0f2fe)",

    blueChipBg:
      "linear-gradient(135deg, #dbeafe, #bfdbfe)",

    blueChipBorder:
      "#93c5fd40",
  };
}
