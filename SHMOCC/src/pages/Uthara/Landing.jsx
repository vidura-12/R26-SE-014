import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeProvider";

// ============================================================
// IMPORTANT:
// Your image must be here:
// src/assets/cinnamon-hero.jpg
// ============================================================
import cinnamonHero from "../../assets/cinnamon-hero.jpg.png";

// ============================================================
// THEME TOKENS
// ============================================================
function getTokens(isDark) {
  return isDark
    ? {
        pageBg: "#0b1711",
        surface: "#101d16",
        surface2: "#122019",
        textPrimary: "#f3faf5",
        textSecondary: "#8eab99",
        textMuted: "#6f8d7b",

        accent: "#238342",
        accentDark: "#145c2f",
        accentLight: "#3aad6a",

        gold: "#f4b400",

        border: "#294636",
        borderLight: "#31513e",

        cardBg: "#122019",
        cardHover: "#172d21",

        navBg: "rgba(11,23,17,0.94)",

        shadow: "0 24px 70px rgba(0,0,0,0.35)",
        softShadow: "0 12px 35px rgba(0,0,0,0.22)",

        heroOverlay:
          "linear-gradient(180deg, rgba(5,25,15,0.02) 20%, rgba(5,28,17,0.88) 100%)",
      }
    : {
        pageBg: "#eef5f1",
        surface: "#ffffff",
        surface2: "#f8fcf9",
        textPrimary: "#0d3820",
        textSecondary: "#76a083",
        textMuted: "#94ad9d",

        accent: "#2c8c4e",
        accentDark: "#155b31",
        accentLight: "#3aad6a",

        gold: "#f4b400",

        border: "#d4e5da",
        borderLight: "#c9ddd1",

        cardBg: "#ffffff",
        cardHover: "#f3faf5",

        navBg: "rgba(238,245,241,0.94)",

        shadow: "0 24px 70px rgba(24,73,43,0.14)",
        softShadow: "0 12px 35px rgba(24,73,43,0.10)",

        heroOverlay:
          "linear-gradient(180deg, rgba(255,255,255,0.00) 15%, rgba(13,56,32,0.82) 100%)",
      };
}

// ============================================================
// SUN ICON
// ============================================================
function SunIcon({ color = "#f4b400" }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" fill={color} fillOpacity="0.15" />

      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

// ============================================================
// MOON ICON
// ============================================================
function MoonIcon({ color = "#5a8c6e" }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
        fill={color}
        fillOpacity="0.15"
      />
    </svg>
  );
}

// ============================================================
// THEME TOGGLE
// Same visual style as Login page
// ============================================================
function ThemeToggle({ isDark, toggleTheme, t }) {
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="theme-toggle"
      style={{
        width: 42,
        height: 42,
        borderRadius: 12,
        border: `1px solid ${t.borderLight}`,
        background: t.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: isDark
          ? "0 5px 18px rgba(0,0,0,0.28)"
          : "0 5px 18px rgba(24,73,43,0.08)",
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

// ============================================================
// FEATURE ICON
// ============================================================
function FeatureIcon({ children, t }) {
  return (
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: 13,
        background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 21,
        boxShadow: "0 8px 20px rgba(35,131,66,0.18)",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

// ============================================================
// LANDING PAGE
// ============================================================
export default function Landing() {
  const nav = useNavigate();

  const { isDark, toggleTheme } = useTheme();

  const t = getTokens(isDark);

  // ==========================================================
  // FEATURES
  // ==========================================================
  const features = [
    {
      icon: "🧠",
      title: "AI Disease Prediction",
      description:
        "Predict potential cinnamon diseases using machine learning and plantation conditions.",
    },
    {
      icon: "🌡️",
      title: "Environmental Monitoring",
      description:
        "Analyze temperature, humidity and other environmental conditions affecting plant health.",
    },
    {
      icon: "🍃",
      title: "Early Detection",
      description:
        "Identify disease risks early so farmers can take preventive action before major damage occurs.",
    },
    {
      icon: "📊",
      title: "Smart Dashboard",
      description:
        "View predictions, sensor information, historical trends and plantation insights in one place.",
    },
    {
      icon: "📍",
      title: "Intelligent Advisory",
      description:
        "Receive practical recommendations based on plantation conditions and predicted disease risks.",
    },
    {
      icon: "🌱",
      title: "Plant Health Insights",
      description:
        "Turn plantation data into simple and useful information for better farming decisions.",
    },
  ];

  // ==========================================================
  // STATS
  // ==========================================================
  const stats = [
    {
      number: "AI",
      label: "Powered Prediction",
    },
    {
      number: "24/7",
      label: "Plantation Monitoring",
    },
    {
      number: "ML",
      label: "Disease Analysis",
    },
    {
      number: "RAG",
      label: "Smart Advisory",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: ${t.pageBg};
          color: ${t.textPrimary};
        }

        button {
          font-family: inherit;
        }

        /* =====================================================
           PAGE
        ===================================================== */

        .landing-page {
          width: 100%;
          min-height: 100vh;
          background: ${t.pageBg};
          color: ${t.textPrimary};
          overflow-x: hidden;
          transition:
            background 0.3s ease,
            color 0.3s ease;
        }

        /* =====================================================
           NAVBAR
        ===================================================== */

        .topbar {
          position: sticky;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 100;
          background: ${t.navBg};
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid ${t.border};
        }

        .topbar-inner {
          width: 100%;
          max-width: 1180px;
          height: 70px;
          margin: 0 auto;
          padding: 0 28px;

          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* =====================================================
           BRAND
        ===================================================== */

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          cursor: pointer;
          user-select: none;
        }

        .brand-logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;

          background: linear-gradient(
            135deg,
            #f4b400,
            #d99d00
          );

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 22px;

          box-shadow:
            0 7px 18px rgba(244,180,0,0.20);
        }

        .brand-name {
          color: ${t.textPrimary};
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.6px;
        }

        .brand-subtitle {
          color: ${t.textMuted};
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        /* =====================================================
           NAV ACTIONS
        ===================================================== */

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nav-login {
          height: 42px;
          padding: 0 18px;

          border: 1px solid ${t.border};
          border-radius: 11px;

          background: transparent;
          color: ${t.accent};

          font-size: 12px;
          font-weight: 700;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .nav-login:hover {
          background: ${t.cardHover};
          transform: translateY(-1px);
        }

        .nav-start {
          height: 42px;
          padding: 0 20px;

          border: none;
          border-radius: 11px;

          background: linear-gradient(
            135deg,
            ${t.accentLight},
            ${t.accentDark}
          );

          color: white;

          font-size: 12px;
          font-weight: 700;

          cursor: pointer;

          box-shadow:
            0 8px 20px rgba(35,131,66,0.22);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .nav-start:hover {
          transform: translateY(-1px);
          box-shadow:
            0 12px 27px rgba(35,131,66,0.30);
        }

        .theme-toggle:hover {
          transform: scale(1.04);
        }

        /* =====================================================
           HERO
        ===================================================== */

        .hero-section {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;

          min-height: calc(100vh - 70px);

          padding: 58px 28px 70px;

          display: grid;
          grid-template-columns: 0.92fr 1.08fr;
          gap: 52px;

          align-items: center;
        }

        /* =====================================================
           HERO CONTENT
        ===================================================== */

        .hero-content {
          width: 100%;
          max-width: 560px;

          animation: fadeUp 0.6s ease both;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          padding: 8px 13px;

          border-radius: 999px;

          background: ${
            isDark
              ? "rgba(58,173,106,0.12)"
              : "rgba(44,140,78,0.10)"
          };

          border: 1px solid ${t.border};

          color: ${t.accent};

          font-size: 10px;
          font-weight: 700;

          letter-spacing: 0.4px;
          text-transform: uppercase;

          margin-bottom: 21px;
        }

        .badge-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: ${t.accentLight};

          box-shadow:
            0 0 0 4px rgba(58,173,106,0.12);
        }

        .hero-title {
          font-size: clamp(43px, 5vw, 64px);

          line-height: 1.04;

          letter-spacing: -2.8px;

          font-weight: 800;

          color: ${t.textPrimary};

          margin-bottom: 22px;
        }

        .hero-title-highlight {
          color: ${t.accent};
        }

        .hero-description {
          max-width: 540px;

          font-size: 15px;

          line-height: 1.75;

          color: ${t.textSecondary};

          margin-bottom: 30px;
        }

        /* =====================================================
           HERO BUTTONS
        ===================================================== */

        .hero-buttons {
          display: flex;
          align-items: center;
          gap: 12px;

          margin-bottom: 27px;
        }

        .primary-button {
          height: 48px;

          padding: 0 23px;

          border: none;
          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              ${t.accentLight},
              ${t.accentDark}
            );

          color: white;

          font-size: 13px;
          font-weight: 700;

          cursor: pointer;

          box-shadow:
            0 11px 28px rgba(35,131,66,0.24);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .primary-button:hover {
          transform: translateY(-2px);

          box-shadow:
            0 15px 32px rgba(35,131,66,0.31);
        }

        .secondary-button {
          height: 48px;

          padding: 0 21px;

          border: 1px solid ${t.borderLight};

          border-radius: 12px;

          background: ${t.surface};

          color: ${t.textPrimary};

          font-size: 13px;
          font-weight: 700;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .secondary-button:hover {
          background: ${t.cardHover};

          transform: translateY(-2px);
        }

        .hero-note {
          display: flex;
          align-items: center;
          gap: 8px;

          color: ${t.textMuted};

          font-size: 11px;
        }

        .hero-note span {
          color: ${t.gold};
        }

        /* =====================================================
           HERO MEDIA
        ===================================================== */

        .hero-media {
          width: 100%;
          position: relative;

          animation: fadeIn 0.7s ease both;
        }

        /*
          FIX:
          Explicit height instead of aspect-ratio.
          This prevents the page from changing height
          while the image loads.
        */

        .hero-image-card {
          position: relative;

          width: 100%;
          height: 520px;

          border-radius: 25px;

          overflow: hidden;

          background: #123b26;

          border: 1px solid ${t.border};

          box-shadow: ${t.shadow};

          isolation: isolate;
        }

        .hero-image {
          position: absolute;

          inset: 0;

          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;

          object-position: center;

          z-index: 0;

          transition: transform 0.6s ease;
        }

        .hero-image-card:hover .hero-image {
          transform: scale(1.025);
        }

        .hero-overlay {
          position: absolute;

          inset: 0;

          background: ${t.heroOverlay};

          z-index: 1;

          pointer-events: none;
        }

        /* =====================================================
           IMAGE TOP LABEL
        ===================================================== */

        .image-top-label {
          position: absolute;

          top: 22px;
          left: 22px;

          z-index: 2;

          display: inline-flex;
          align-items: center;
          gap: 8px;

          padding: 9px 13px;

          border-radius: 999px;

          background: rgba(11,31,20,0.70);

          border: 1px solid rgba(255,255,255,0.15);

          backdrop-filter: blur(10px);

          color: white;

          font-size: 10px;
          font-weight: 700;
        }

        .image-top-label-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #68d391;

          box-shadow:
            0 0 0 4px rgba(104,211,145,0.12);
        }

        /* =====================================================
           IMAGE INFO
        ===================================================== */

        .image-info {
          position: absolute;

          left: 25px;
          right: 25px;
          bottom: 25px;

          z-index: 2;

          padding: 20px;

          border-radius: 17px;

          background: rgba(7,30,18,0.78);

          border: 1px solid rgba(255,255,255,0.12);

          backdrop-filter: blur(14px);

          color: white;
        }

        .image-info-title {
          font-size: 18px;
          font-weight: 800;

          margin-bottom: 5px;
        }

        .image-info-text {
          font-size: 11px;

          line-height: 1.55;

          color: rgba(255,255,255,0.76);
        }

        /* =====================================================
           FLOATING AI CARD
        ===================================================== */

        .floating-card {
          position: absolute;

          right: -22px;
          top: 50%;

          transform: translateY(-50%);

          width: 150px;

          padding: 16px;

          border-radius: 16px;

          background: ${t.surface};

          border: 1px solid ${t.border};

          box-shadow: ${t.softShadow};

          z-index: 5;
        }

        .floating-card-icon {
          width: 34px;
          height: 34px;

          border-radius: 10px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: rgba(44,140,78,0.11);

          font-size: 17px;

          margin-bottom: 10px;
        }

        .floating-card-title {
          color: ${t.textPrimary};

          font-size: 11px;
          font-weight: 800;

          margin-bottom: 4px;
        }

        .floating-card-text {
          color: ${t.textMuted};

          font-size: 9px;

          line-height: 1.5;
        }

        /* =====================================================
           STATS
        ===================================================== */

        .stats-section {
          width: 100%;
          max-width: 1180px;

          margin: 0 auto;

          padding: 0 28px 75px;
        }

        .section-line {
          height: 1px;

          background: ${t.border};

          margin-bottom: 25px;
        }

        .stats-grid {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 14px;
        }

        .stat-card {
          padding: 20px 18px;

          border-radius: 15px;

          background: ${t.surface};

          border: 1px solid ${t.border};

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);

          background: ${t.cardHover};

          box-shadow: ${t.softShadow};
        }

        .stat-number {
          font-size: 28px;

          font-weight: 800;

          color: ${t.accent};

          letter-spacing: -1px;

          margin-bottom: 5px;
        }

        .stat-label {
          color: ${t.textSecondary};

          font-size: 10px;

          font-weight: 600;
        }

        /* =====================================================
           FEATURES
        ===================================================== */

        .features-section {
          width: 100%;
          max-width: 1180px;

          margin: 0 auto;

          padding: 20px 28px 90px;
        }

        .section-heading {
          text-align: center;

          max-width: 650px;

          margin:
            0 auto
            42px;
        }

        .section-eyebrow {
          color: ${t.accent};

          font-size: 10px;

          font-weight: 800;

          letter-spacing: 2px;

          text-transform: uppercase;

          margin-bottom: 10px;
        }

        .section-title {
          color: ${t.textPrimary};

          font-size: clamp(28px, 3vw, 39px);

          line-height: 1.15;

          letter-spacing: -1.2px;

          font-weight: 800;

          margin-bottom: 12px;
        }

        .section-description {
          color: ${t.textSecondary};

          font-size: 13px;

          line-height: 1.7;
        }

        .features-grid {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 15px;
        }

        .feature-card {
          padding: 22px;

          border-radius: 17px;

          background: ${t.surface};

          border: 1px solid ${t.border};

          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            background 0.25s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);

          background: ${t.cardHover};

          box-shadow: ${t.softShadow};
        }

        .feature-card-title {
          color: ${t.textPrimary};

          font-size: 14px;

          font-weight: 800;

          margin-top: 17px;

          margin-bottom: 8px;
        }

        .feature-card-description {
          color: ${t.textSecondary};

          font-size: 11px;

          line-height: 1.65;
        }

        /* =====================================================
           CTA
        ===================================================== */

        .cta-section {
          width: 100%;
          max-width: 1180px;

          margin: 0 auto;

          padding: 0 28px 90px;
        }

        .cta-card {
          position: relative;

          overflow: hidden;

          padding: 48px 50px;

          border-radius: 24px;

          background:
            linear-gradient(
              135deg,
              ${t.accentDark},
              ${t.accent}
            );

          box-shadow:
            0 20px 50px
            rgba(35,131,66,0.20);

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 30px;
        }

        .cta-card::before {
          content: "";

          position: absolute;

          width: 300px;
          height: 300px;

          border-radius: 50%;

          background:
            rgba(255,255,255,0.06);

          right: -80px;
          top: -130px;
        }

        .cta-content {
          position: relative;

          z-index: 1;
        }

        .cta-title {
          color: white;

          font-size: 28px;

          line-height: 1.15;

          font-weight: 800;

          letter-spacing: -1px;

          margin-bottom: 9px;
        }

        .cta-text {
          color: rgba(255,255,255,0.72);

          font-size: 12px;

          line-height: 1.6;

          max-width: 530px;
        }

        .cta-button {
          position: relative;

          z-index: 1;

          height: 46px;

          padding: 0 23px;

          border: none;

          border-radius: 11px;

          background: white;

          color: ${t.accentDark};

          font-size: 12px;

          font-weight: 800;

          cursor: pointer;

          flex-shrink: 0;

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .cta-button:hover {
          transform: translateY(-2px);

          box-shadow:
            0 10px 25px
            rgba(0,0,0,0.18);
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .footer {
          border-top: 1px solid ${t.border};

          padding: 25px 28px;

          text-align: center;

          color: ${t.textMuted};

          font-size: 10px;
        }

        .footer strong {
          color: ${t.textSecondary};
        }

        /* =====================================================
           ANIMATIONS
        ===================================================== */

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 960px) {

          .hero-section {
            min-height: auto;

            grid-template-columns: 1fr;

            padding:
              55px 28px
              70px;

            gap: 45px;
          }

          .hero-content {
            max-width: 720px;
          }

          .hero-media {
            max-width: 720px;

            width: 100%;

            margin: 0 auto;
          }

          .hero-image-card {
            height: 500px;
          }

          .floating-card {
            right: -8px;
          }

          .features-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 600px) {

          .topbar-inner {
            height: 64px;

            padding:
              0 16px;
          }

          .brand-subtitle {
            display: none;
          }

          .brand-name {
            font-size: 17px;
          }

          .brand-logo {
            width: 38px;
            height: 38px;
          }

          .nav-actions {
            gap: 7px;
          }

          .nav-login {
            display: none;
          }

          .nav-start {
            height: 38px;

            padding:
              0 14px;
          }

          .theme-toggle {
            width: 38px !important;
            height: 38px !important;
          }

          .hero-section {
            min-height: auto;

            padding:
              45px 18px
              55px;

            gap: 38px;
          }

          .hero-title {
            font-size: 40px;

            letter-spacing: -1.8px;
          }

          .hero-description {
            font-size: 13px;
          }

          .hero-buttons {
            flex-direction: column;

            align-items: stretch;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
          }

          .hero-image-card {
            height: 420px;

            border-radius: 20px;
          }

          .floating-card {
            display: none;
          }

          .image-info {
            left: 16px;
            right: 16px;
            bottom: 16px;

            padding: 16px;
          }

          .image-info-title {
            font-size: 16px;
          }

          .stats-section {
            padding:
              0 18px
              55px;
          }

          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .features-section {
            padding:
              10px 18px
              65px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .section-heading {
            margin-bottom: 30px;
          }

          .cta-section {
            padding:
              0 18px
              65px;
          }

          .cta-card {
            padding: 32px 25px;

            flex-direction: column;

            align-items: flex-start;
          }

          .cta-title {
            font-size: 25px;
          }

          .cta-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="landing-page">

        {/* ======================================================
            NAVIGATION
        ====================================================== */}

        <nav className="topbar">
          <div className="topbar-inner">

            <div
              className="brand"
              onClick={() => nav("/")}
              title="CinnaPredict Home"
            >
              <div className="brand-logo">
                🌿
              </div>

              <div>
                <div className="brand-name">
                  CinnaPredict
                </div>

                <div className="brand-subtitle">
                  Smart Plantation Intelligence
                </div>
              </div>
            </div>

            <div className="nav-actions">

              <ThemeToggle
                isDark={isDark}
                toggleTheme={toggleTheme}
                t={t}
              />

              <button
                className="nav-login"
                onClick={() =>
                  nav("/disease-prediction/login")
                }
              >
                Sign In
              </button>

              <button
                className="nav-start"
                onClick={() =>
                  nav("/disease-prediction/signup")
                }
              >
                Get Started
              </button>

            </div>

          </div>
        </nav>

        {/* ======================================================
            HERO
        ====================================================== */}

        <main>

          <section className="hero-section">

            {/* LEFT CONTENT */}

            <div className="hero-content">

              <div className="hero-badge">
                <span className="badge-dot"></span>
                Smart Plantation Monitoring
              </div>

              <h1 className="hero-title">
                Intelligent{" "}
                <span className="hero-title-highlight">
                  Cinnamon
                </span>
                <br />
                Plantation Insights
              </h1>

              <p className="hero-description">
                CinnaPredict combines machine learning,
                plantation data and environmental monitoring
                to help identify cinnamon disease risks early
                and support smarter farming decisions.
              </p>

              <div className="hero-buttons">

                <button
                  className="primary-button"
                  onClick={() =>
                    nav("/disease-prediction/signup")
                  }
                >
                  Start Monitoring →
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    nav("/disease-prediction/login")
                  }
                >
                  Sign In
                </button>

              </div>

              <div className="hero-note">
                <span>🔒</span>
                Secure access to your plantation data
              </div>

            </div>

            {/* RIGHT IMAGE */}

            <div className="hero-media">

              <div className="hero-image-card">

                {/* YOUR LOCAL IMAGE */}

                <img
                  className="hero-image"
                  src={cinnamonHero}
                  alt="Cinnamon plantation"
                  loading="eager"
                />

                <div className="hero-overlay"></div>

                <div className="image-top-label">
                  <span className="image-top-label-dot"></span>
                  Ceylon Cinnamon Intelligence
                </div>

                <div className="image-info">

                  <div className="image-info-title">
                    Smarter Plantation Decisions
                  </div>

                  <div className="image-info-text">
                    Monitor environmental conditions,
                    understand disease risks and turn
                    plantation data into actionable insights.
                  </div>

                </div>

              </div>

              {/* AI FLOATING CARD */}

              <div className="floating-card">

                <div className="floating-card-icon">
                  🧠
                </div>

                <div className="floating-card-title">
                  AI Prediction
                </div>

                <div className="floating-card-text">
                  Intelligent disease risk analysis
                  for cinnamon plantations.
                </div>

              </div>

            </div>

          </section>

          {/* ====================================================
              STATS
          ==================================================== */}

          <section className="stats-section">

            <div className="section-line"></div>

            <div className="stats-grid">

              {stats.map((stat) => (
                <div
                  className="stat-card"
                  key={stat.label}
                >
                  <div className="stat-number">
                    {stat.number}
                  </div>

                  <div className="stat-label">
                    {stat.label}
                  </div>
                </div>
              ))}

            </div>

          </section>

          {/* ====================================================
              FEATURES
          ==================================================== */}

          <section className="features-section">

            <div className="section-heading">

              <div className="section-eyebrow">
                CinnaPredict Platform
              </div>

              <h2 className="section-title">
                Everything you need to understand
                plantation health
              </h2>

              <p className="section-description">
                From environmental monitoring to disease
                prediction and intelligent advisory,
                CinnaPredict brings plantation insights
                together in one platform.
              </p>

            </div>

            <div className="features-grid">

              {features.map((feature) => (
                <div
                  className="feature-card"
                  key={feature.title}
                >

                  <FeatureIcon t={t}>
                    {feature.icon}
                  </FeatureIcon>

                  <h3 className="feature-card-title">
                    {feature.title}
                  </h3>

                  <p className="feature-card-description">
                    {feature.description}
                  </p>

                </div>
              ))}

            </div>

          </section>

          {/* ====================================================
              CTA
          ==================================================== */}

          <section className="cta-section">

            <div className="cta-card">

              <div className="cta-content">

                <h2 className="cta-title">
                  Ready to monitor your plantation?
                </h2>

                <p className="cta-text">
                  Create your CinnaPredict account and
                  start exploring intelligent plantation
                  health insights.
                </p>

              </div>

              <button
                className="cta-button"
                onClick={() =>
                  nav("/disease-prediction/signup")
                }
              >
                Create Account →
              </button>

            </div>

          </section>

        </main>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="footer">

          CinnaPredict ·{" "}

          <strong>
            Smart Cinnamon Plantation Intelligence
          </strong>

          {" "}· University Research Project · Sri Lanka

        </footer>

      </div>
    </>
  );
}