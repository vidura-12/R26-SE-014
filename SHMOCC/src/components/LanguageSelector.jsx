
import { useTranslation } from "react-i18next";

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const currentLanguage =
    i18n.resolvedLanguage?.split("-")[0] || "en";

  const languages = [
    { code: "si", label: "සිංහල" },
    { code: "ta", label: "தமிழ்" },
    { code: "en", label: "English" },
  ];

  return (
    <div
      className="language-selector"
      role="group"
      aria-label="Select language"
    >
      {languages.map((language) => (
        <button
          key={language.code}
          type="button"
          className={`language-button ${
            currentLanguage === language.code ? "active" : ""
          }`}
          aria-pressed={currentLanguage === language.code}
          onClick={() => i18n.changeLanguage(language.code)}
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}
