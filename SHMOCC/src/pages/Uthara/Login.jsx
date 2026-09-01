import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeProvider";

// ─── Import images from src/assets/ (matching your actual filenames) ───
import plantationImg from "../../assets/cinnamon-plantation.jpg.jpg";
import farmImg from "../../assets/cinnamon-farm.jpg.jpg";
import harvestImg from "../../assets/cinnamon-harvest.jpg.jpg";

const SLIDE_IMAGES = [
  { src: plantationImg, alt: "Cinnamon plantation" },
  { src: farmImg, alt: "Cinnamon farm" },
  { src: harvestImg, alt: "Cinnamon harvest" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Theme Tokens
// ─────────────────────────────────────────────────────────────────────────────
function getTokens(isDark) {
  return isDark
    ? {
        pageBg: "#0b1711",
        panelBg: "#101d16",
        rightBg: "#122019",
        textPrimary: "#f3faf5",
        textSecondary: "#8eab99",
        inputBg: "#192b21",
        inputBorder: "#31513e",
        inputFocus: "#3fae6a",
        inputText: "#f3faf5",
        accent: "#238342",
        accentDark: "#145c2f",
        greenText: "#319454",
        placeholder: "#789486",
        divider: "#2a4033",
        socialBorder: "#355443",
        socialHover: "#193124",
        shadow: "0 20px 60px rgba(0,0,0,0.35)",
      }
    : {
        pageBg: "#eef5f1",
        panelBg: "#ffffff",
        rightBg: "#ffffff",
        textPrimary: "#0d3820",
        textSecondary: "#76a083",
        inputBg: "#eaf2fc",
        inputBorder: "#d4dfda",
        inputFocus: "#2c8c4e",
        inputText: "#163a25",
        accent: "#2c8c4e",
        accentDark: "#155b31",
        greenText: "#176c38",
        placeholder: "#789486",
        divider: "#dbe6df",
        socialBorder: "#cdded3",
        socialHover: "#f1f8f3",
        shadow: "0 20px 60px rgba(24,73,43,0.14)",
      };
}

// ─────────────────────────────────────────────────────────────────────────────
// Modern Sun Icon
// ─────────────────────────────────────────────────────────────────────────────
function SunIcon({ color = "#f4b400" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" fill={color} fillOpacity="0.15" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modern Moon Icon
// ─────────────────────────────────────────────────────────────────────────────
function MoonIcon({ color = "#8eab99" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill={color} fillOpacity="0.15" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme Toggle
// ─────────────────────────────────────────────────────────────────────────────
function ThemeToggle({ isDark, toggleTheme, t }) {
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 44,
        height: 44,
        borderRadius: 13,
        border: `1px solid ${t.inputBorder}`,
        background: t.panelBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 5px 18px rgba(0,0,0,0.08)",
        flexShrink: 0,
        transition: "all .2s ease",
      }}
    >
      {isDark ? <SunIcon color="#f4b400" /> : <MoonIcon color="#5a8c6e" />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Google Icon
// ─────────────────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.35 12.27c0-.71-.06-1.39-.18-2.05H12v3.88h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.19z" />
      <path fill="#34A853" d="M12 21.6c2.63 0 4.84-.87 6.45-2.35l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.04H3.28v2.5A9.74 9.74 0 0 0 12 21.6z" />
      <path fill="#FBBC05" d="M6.53 13.7a5.86 5.86 0 0 1 0-3.4V7.8H3.28a9.76 9.76 0 0 0 0 8.4l3.25-2.5z" />
      <path fill="#EA4335" d="M12 6.26c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.83 3.34 14.62 2.4 12 2.4a9.74 9.74 0 0 0-8.72 5.4l3.25 2.5C7.3 7.98 9.46 6.26 12 6.26z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Microsoft Icon
// ─────────────────────────────────────────────────────────────────────────────
function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <rect x="2" y="2" width="9" height="9" fill="#f35325" />
      <rect x="13" y="2" width="9" height="9" fill="#81bc06" />
      <rect x="2" y="13" width="9" height="9" fill="#05a6f0" />
      <rect x="13" y="13" width="9" height="9" fill="#ffba08" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Login
// ─────────────────────────────────────────────────────────────────────────────
export default function Login() {
  const nav = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { login } = useAuth();
  const t = getTokens(isDark);

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [success, setSuccess] = useState(false);

  // ─── Image slider ───
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // ─── Input handler ───
  const set = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setLoginError("");
  };

  // ─── Validation ───
  const validate = () => {
    const newErrors = {};
    if (!form.email.includes("@")) newErrors.email = "Enter a valid email address";
    if (!form.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Login ───
  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      setSuccess(true);
      setTimeout(() => nav("/disease-prediction/dashboard"), 1500);
    } catch (err) {
      setLoginError("Incorrect email or password. Please try again.");
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") submit();
  };

  // ─── Success screen ───
  if (success) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
          @keyframes successPop { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
          @keyframes successFade { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        <div style={{ minHeight: "100vh", background: t.pageBg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 18, color: t.textPrimary }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg,#2c914f,#155b31)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, animation: "successPop .5s ease both", boxShadow: "0 15px 40px rgba(44,145,79,.3)" }}>🌿</div>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 800, animation: "successFade .5s .15s ease both" }}>Login Successful!</h2>
          <p style={{ margin: 0, color: t.textSecondary, animation: "successFade .5s .3s ease both" }}>Welcome back to CinnaPredict. Redirecting...</p>
        </div>
      </>
    );
  }

  // ─── Login page ───
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        html, body, #root {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
        }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .login-page {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: ${t.pageBg};
          transition: background .3s ease;
          overflow: hidden;
          position: fixed;
          inset: 0;
        }

        .login-shell {
          width: 100%;
          max-width: 1120px;
          height: calc(100vh - 48px);
          max-height: 720px;
          display: grid;
          grid-template-columns: 52% 48%;
          border-radius: 26px;
          overflow: hidden;
          background: ${t.panelBg};
          box-shadow: ${t.shadow};
          transition: all .3s ease;
        }

        .image-panel {
          position: relative;
          height: 100%;
          overflow: hidden;
          background: #173a26;
        }

        .slide-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 0;
          transition: opacity 0.8s ease-in-out;
          z-index: 0;
        }

        .slide-img.active {
          opacity: 1;
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(9,32,19,0.15) 0%, rgba(8,30,18,0.08) 40%, rgba(5,28,17,0.82) 100%);
          z-index: 1;
        }

        .image-content {
          position: absolute;
          inset: 0;
          z-index: 2;
          padding: 28px 34px 30px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          pointer-events: none;
        }

        .image-content > * { pointer-events: auto; }

        .brand-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .back-button {
          width: 42px;
          height: 42px;
          border: none;
          border-radius: 12px;
          background: rgba(24,49,37,.72);
          color: white;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: .2s ease;
          flex-shrink: 0;
        }

        .back-button:hover {
          transform: translateX(-2px);
          background: rgba(31,69,49,.9);
        }

        .logo-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #f4b400;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .brand-name {
          color: white;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .hero-bottom { max-width: 560px; }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(32,63,48,.75);
          border: 1px solid rgba(255,255,255,.16);
          color: white;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 20px;
          backdrop-filter: blur(8px);
        }

        .hero-title {
          color: white;
          font-size: clamp(32px, 3.5vw, 50px);
          line-height: 1.05;
          letter-spacing: -1.5px;
          font-weight: 800;
          margin: 0 0 16px;
        }

        .hero-description {
          color: rgba(255,255,255,.78);
          font-size: 15px;
          line-height: 1.65;
          max-width: 500px;
          margin: 0;
        }

        .slider-dots {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 24px;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255,255,255,.55);
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          padding: 0;
        }

        .dot.active {
          width: 23px;
          border-radius: 10px;
          background: white;
        }

        .form-panel {
          background: ${t.rightBg};
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 50px;
          position: relative;
          overflow-y: auto;
        }

        .theme-button {
          position: absolute;
          right: 20px;
          top: 20px;
          z-index: 10;
        }

        .form-container {
          width: 100%;
          max-width: 400px;
          margin: auto;
        }

        .welcome-title {
          margin: 0 0 7px;
          color: ${t.textPrimary};
          font-size: 28px;
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .welcome-text {
          margin: 0 0 28px;
          color: ${t.textSecondary};
          font-size: 13px;
        }

        .error-box {
          padding: 11px 14px;
          margin-bottom: 18px;
          border-radius: 9px;
          background: #fff3f3;
          border: 1px solid #f2b7b7;
          color: #d64646;
          font-size: 12px;
        }

        .input-group {
          position: relative;
          margin-bottom: 16px;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #6d8190;
          font-size: 16px;
          pointer-events: none;
          line-height: 1;
        }

        .login-input {
          width: 100%;
          height: 46px;
          padding: 0 42px 0 43px;
          border: 1px solid ${t.inputBorder};
          border-radius: 10px;
          background: ${t.inputBg};
          color: ${t.inputText};
          outline: none;
          font-family: inherit;
          font-size: 13px;
          transition: .2s ease;
        }

        .login-input::placeholder {
          color: ${t.placeholder};
        }

        .login-input:focus {
          border-color: ${t.inputFocus};
          box-shadow: 0 0 0 3px rgba(44,140,78,.10);
        }

        .password-button {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          cursor: pointer;
          color: #6d8190;
          font-size: 17px;
          padding: 4px;
          line-height: 1;
        }

        .field-error {
          color: #d95353;
          font-size: 11px;
          margin-top: 5px;
          padding-left: 4px;
        }

        .options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 4px 0 24px;
        }

        .remember-label {
          display: flex;
          align-items: center;
          gap: 7px;
          color: ${t.textSecondary};
          font-size: 12px;
          cursor: pointer;
          user-select: none;
        }

        .remember-label input {
          width: 15px;
          height: 15px;
          accent-color: ${t.accent};
          cursor: pointer;
          margin: 0;
        }

        .forgot-link {
          color: ${t.greenText};
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
        }

        .sign-in-button {
          width: 100%;
          height: 46px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, ${t.accent}, ${t.accentDark});
          color: white;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(34,126,67,.22);
          transition: .2s ease;
        }

        .sign-in-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 13px 30px rgba(34,126,67,.3);
        }

        .sign-in-button:disabled {
          opacity: .7;
          cursor: not-allowed;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: ${t.divider};
        }

        .divider-text {
          color: ${t.textSecondary};
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .social-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .social-button {
          height: 44px;
          border: 1px solid ${t.socialBorder};
          border-radius: 10px;
          background: ${t.rightBg};
          color: ${t.textPrimary};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: .2s ease;
        }

        .social-button:hover {
          background: ${t.socialHover};
          transform: translateY(-1px);
        }

        .signup-text {
          text-align: center;
          margin: 24px 0 0;
          color: ${t.textSecondary};
          font-size: 12px;
        }

        .signup-link {
          color: ${t.greenText};
          font-weight: 800;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: inherit;
        }

        .secure-note {
          text-align: center;
          margin-top: 24px;
          color: ${t.textSecondary};
          opacity: .75;
          font-size: 10px;
        }

        @media (max-width: 900px) {
          .login-page { padding: 16px; }
          .login-shell {
            grid-template-columns: 1fr;
            height: auto;
            max-height: calc(100vh - 32px);
            overflow-y: auto;
          }
          .image-panel { min-height: 260px; height: 260px; }
          .form-panel { padding: 35px 30px; }
          .hero-title { font-size: 32px; }
        }

        @media (max-width: 520px) {
          .login-page { padding: 0; height: 100dvh; }
          .login-shell {
            border-radius: 0;
            height: 100dvh;
            max-height: none;
            overflow-y: auto;
          }
          .image-panel { min-height: 220px; height: 220px; }
          .image-content { padding: 20px 22px; }
          .form-panel { padding: 30px 22px; }
          .theme-button { right: 16px; top: 16px; }
          .hero-title { font-size: 28px; }
          .welcome-title { font-size: 26px; }
        }
      `}</style>

      <div className="login-page">
        <div className="login-shell">

          {/* ================================================================
              LEFT IMAGE PANEL (Slideshow)
          ================================================================= */}
          <section className="image-panel">
            {SLIDE_IMAGES.map((img, idx) => (
              <img
                key={idx}
                className={`slide-img${idx === currentSlide ? " active" : ""}`}
                src={img.src}
                alt={img.alt}
                loading="eager"
              />
            ))}

            <div className="image-overlay"></div>

            <div className="image-content">
              <div className="brand-row">
                <button
                  className="back-button"
                  onClick={() => nav("/")}
                  title="Back to main page"
                  aria-label="Back to main page"
                >
                  ←
                </button>
                <div className="logo-box">🌿</div>
                <div className="brand-name">CinnaPredict</div>
              </div>

              <div className="hero-bottom">
                <div className="hero-badge">🌱 SMART PLANTATION MONITORING</div>
                <h1 className="hero-title">
                  Intelligent Cinnamon<br />Plantation Insights
                </h1>
                <p className="hero-description">
                  Monitor plantation conditions, analyze farm data and make
                  smarter decisions with CinnaPredict.
                </p>
                <div className="slider-dots">
                  {SLIDE_IMAGES.map((_, idx) => (
                    <button
                      key={idx}
                      className={`dot${idx === currentSlide ? " active" : ""}`}
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================
              RIGHT LOGIN PANEL
          ================================================================= */}
          <section className="form-panel">
            <div className="theme-button">
              <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} t={t} />
            </div>

            <div className="form-container">
              <h2 className="welcome-title">Welcome back</h2>
              <p className="welcome-text">Sign in to your CinnaPredict account.</p>

              {loginError && <div className="error-box">⚠️ {loginError}</div>}

              {/* Email */}
              <div className="input-group">
                <span className="input-icon">✉</span>
                <input
                  className="login-input"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  onKeyDown={handleKeyDown}
                  placeholder="Email address"
                  autoComplete="email"
                />
                {errors.email && <div className="field-error">{errors.email}</div>}
              </div>

              {/* Password */}
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input
                  className="login-input"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  onKeyDown={handleKeyDown}
                  placeholder="Password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-button"
                  onClick={() => setShowPass((prev) => !prev)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "🙈" : "👁"}
                </button>
                {errors.password && <div className="field-error">{errors.password}</div>}
              </div>

              {/* Remember + Forgot */}
              <div className="options-row">
                <label className="remember-label">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={set("remember")}
                  />
                  Remember me
                </label>
                <button
                  className="forgot-link"
                  onClick={() => nav("/disease-prediction/forgot-password")}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In */}
              <button className="sign-in-button" onClick={submit} disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>

              {/* Divider */}
              <div className="divider">
                <div className="divider-line"></div>
                <span className="divider-text">OR</span>
                <div className="divider-line"></div>
              </div>

              {/* Social Login */}
              <div className="social-row">
                <button type="button" className="social-button">
                  <GoogleIcon /> Google
                </button>
                <button type="button" className="social-button">
                  <MicrosoftIcon /> Microsoft
                </button>
              </div>

              {/* Signup */}
              <p className="signup-text">
                New to CinnaPredict?{" "}
                <button
                  className="signup-link"
                  onClick={() => nav("/disease-prediction/signup")}
                >
                  Create an account
                </button>
              </p>

              <p className="secure-note">🔒 Secure access to your plantation data</p>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}