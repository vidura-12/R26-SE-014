// src/context/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../translations";

const LanguageContext = createContext(null);

const LANGUAGES = ["en", "si", "ta"];

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem("appLanguage") || "en"
  );

  useEffect(() => {
    localStorage.setItem("appLanguage", language);
  }, [language]);

  const toggleLanguage = () =>
    setLanguage((prev) => {
      const idx = LANGUAGES.indexOf(prev);
      return LANGUAGES[(idx + 1) % LANGUAGES.length];
    });

  const t = (key) => {
    const value = key
      .split(".")
      .reduce((obj, part) => obj?.[part], translations[language]);
    return value ?? key;
  };

  return (
  <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
    {children}
  </LanguageContext.Provider>
);
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}