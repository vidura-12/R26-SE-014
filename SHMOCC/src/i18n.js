
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      appName: "CinnaPredict",
      language: "Language",
      dashboard: "Dashboard",
      sensorData: "Sensor Data",
      soilPH: "Soil pH",
      soilMoisture: "Soil Moisture",
      soilTemperature: "Soil Temperature",
      diseaseRisk: "Disease Risk",
      advice: "Recommendations",
      advisory: "ADVISORY",
      advisoryDescription:
        "AI-assisted White Root Rot assessment and recommended actions.",
      immediateActions: "Immediate Actions",
      preventiveMeasures: "Preventive Measures",
      monitoringPlan: "Monitoring Plan",
      confidence: "Confidence",
      knowledgeSources: "Knowledge Sources",
      loading: "Loading...",
      low: "Low",
      medium: "Medium",
      high: "High"
    }
  },

  si: {
    translation: {
      appName: "සින්නාප්‍රෙඩික්ට්",
      language: "භාෂාව",
      dashboard: "පාලක පුවරුව",
      sensorData: "සංවේදක දත්ත",
      soilPH: "පාංශු pH අගය",
      soilMoisture: "පාංශු තෙතමනය",
      soilTemperature: "පාංශු උෂ්ණත්වය",
      diseaseRisk: "රෝග අවදානම",
      advice: "නිර්දේශ",
      advisory: "උපදෙස්",
      advisoryDescription:
        "සුදු මුල් කුණුවීමේ රෝග අවදානම තක්සේරු කිරීම සහ නිර්දේශිත ක්‍රියාමාර්ග.",
      immediateActions: "වහාම ගත යුතු ක්‍රියාමාර්ග",
      preventiveMeasures: "වැළැක්වීමේ ක්‍රියාමාර්ග",
      monitoringPlan: "නිරීක්ෂණ සැලැස්ම",
      confidence: "විශ්වාස මට්ටම",
      knowledgeSources: "තොරතුරු මූලාශ්‍ර",
      loading: "පූරණය වෙමින් පවතී...",
      low: "අඩු",
      medium: "මධ්‍යම",
      high: "ඉහළ"
    }
  },

  ta: {
    translation: {
      appName: "சின்னாபிரெடிக்ட்",
      language: "மொழி",
      dashboard: "முகப்புப் பலகை",
      sensorData: "சென்சார் தரவுகள்",
      soilPH: "மண்ணின் pH அளவு",
      soilMoisture: "மண்ணின் ஈரப்பதம்",
      soilTemperature: "மண்ணின் வெப்பநிலை",
      diseaseRisk: "நோய் அபாயம்",
      advice: "பரிந்துரைகள்",
      advisory: "ஆலோசனை",
      advisoryDescription:
        "வெள்ளை வேர் அழுகல் நோய் அபாய மதிப்பீடு மற்றும் பரிந்துரைக்கப்பட்ட நடவடிக்கைகள்.",
      immediateActions: "உடனடி நடவடிக்கைகள்",
      preventiveMeasures: "தடுப்பு நடவடிக்கைகள்",
      monitoringPlan: "கண்காணிப்புத் திட்டம்",
      confidence: "நம்பகத்தன்மை",
      knowledgeSources: "தகவல் ஆதாரங்கள்",
      loading: "ஏற்றப்படுகிறது...",
      low: "குறைவு",
      medium: "நடுத்தரம்",
      high: "அதிகம்"
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "si",
  fallbackLng: "en",
  supportedLngs: ["en", "si", "ta"],
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
