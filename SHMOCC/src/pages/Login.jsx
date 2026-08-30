import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeProvider";

// ─── Theme Tokens ──────────────────────────────────────────────────────────
// Derives every color used on this page from isDark, so the palette stays
// in sync with the rest of the app's dark/light mode.
function getTokens(isDark) {
  return isDark
    ? {
        pageBg: "linear-gradient(160deg, #0a1f14 0%, #0d2a1a 50%, #0f3320 100%)",
        blob1: "linear-gradient(135deg,#2d8a4e,#1a5c2e)",
        blob1Opacity: 0.14,
        blob2: "#34a35c",
        blob2Opacity: 0.1,
        leafOpacity: 0.1,
        cardBg: "#122318",
        cardBorder: "1px solid rgba(76,175,115,0.18)",
        cardShadow: "0 16px 56px rgba(0,0,0,0.45)",
        cardShadowHover: "0 32px 80px rgba(0,0,0,0.55)",
        textPrimary: "#eaf5ee",
        textSecondary: "#8fb89e",
        labelColor: "#9fd6b3",
        inputBorder: "#254a34",
        inputBorderFocus: "#3fae6a",
        inputBg: "#0f2015",
        inputBgFocus: "#132a1c",
        inputText: "#eaf5ee",
        focusRing: "rgba(63,174,106,0.22)",
        errorColor: "#ff8080",
        errorBg: "#2a1414",
        errorBorder: "#7a3232",
        accentGradient: "linear-gradient(135deg,#2d8a4e,#1a5c2e)",
        buttonShadow: "0 6px 24px rgba(45,138,78,0.45)",
        buttonDisabled: "#22422e",
        divider: "#22402c",
        dividerText: "#5f8a70",
        socialBorder: "#254a34",
        socialBg: "#0f2015",
        socialHoverBg: "#152b1d",
        socialHoverBorder: "#3fae6a",
        socialText: "#bfe3cd",
        linkColor: "#4cc27f",
        checkboxAccent: "#3fae6a",
        forgotColor: "#4cc27f",
        bottomNote: "#5f8a70",
        subLabel: "#5f8a70",
      }
    : {
        pageBg: "linear-gradient(160deg, #f2faf5 0%, #e0f2e9 50%, #c8e6d4 100%)",
        blob1: "linear-gradient(135deg,#2d8a4e,#1a5c2e)",
        blob1Opacity: 0.06,
        blob2: "#4caf73",
        blob2Opacity: 0.07,
        leafOpacity: 0.08,
        cardBg: "#ffffff",
        cardBorder: "1px solid rgba(44,138,78,0.1)",
        cardShadow: "0 16px 56px rgba(26,92,46,0.12)",
        cardShadowHover: "0 32px 80px rgba(26,92,46,0.18)",
        textPrimary: "#0f2d1a",
        textSecondary: "#7aaa8a",
        labelColor: "#1a5c2e",
        inputBorder: "#cde4d5",
        inputBorderFocus: "#2d8a4e",
        inputBg: "#ffffff",
        inputBgFocus: "#f7fdf9",
        inputText: "#0f2d1a",
        focusRing: "rgba(44,138,78,0.12)",
        errorColor: "#e05252",
        errorBg: "#fff5f5",
        errorBorder: "#fca5a5",
        accentGradient: "linear-gradient(135deg,#2d8a4e,#1a5c2e)",
        buttonShadow: "0 6px 24px rgba(44,138,78,0.35)",
        buttonDisabled: "#9cb8a8",
        divider: "#e0ede5",
        dividerText: "#9cb8a8",
        socialBorder: "#cde4d5",
        socialBg: "#ffffff",
        socialHoverBg: "#f2faf5",
        socialHoverBorder: "#4caf73",
        socialText: "#2a5c3a",
        linkColor: "#1a5c2e",
        checkboxAccent: "#2d8a4e",
        forgotColor: "#2d8a4e",
        bottomNote: "#9cb8a8",
        subLabel: "#7aaa8a",
      };
}

// ─── Theme Toggle Button ───────────────────────────────────────────────────
function ThemeToggle({ isDark, toggleTheme, t }) {
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "absolute",
        top: 20,
        right: 20,
        width: 42,
        height: 42,
        borderRadius: 12,
        border: `1.5px solid ${t.inputBorder}`,
        background: t.cardBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        cursor: "pointer",
        boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.4)" : "0 4px 16px rgba(26,92,46,0.1)",
        transition: "all 0.2s",
        zIndex: 2,
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}

// ─── Input Field Wrapper ──────────────────────────────────────────────────────
function Field({ label, error, children, t }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: t.labelColor, marginBottom: 6, letterSpacing: "0.02em" }}>
        {label}
      </label>
      {children}
      {error && <div style={{ fontSize: 12, color: t.errorColor, marginTop: 5 }}>{error}</div>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", error, icon, t }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      {icon && (
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 17, pointerEvents: "none" }}>
          {icon}
        </span>
      )}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          width: "100%", padding: icon ? "12px 14px 12px 42px" : "12px 14px",
          borderRadius: 12, fontSize: 15,
          border: `1.5px solid ${error ? t.errorColor : focused ? t.inputBorderFocus : t.inputBorder}`,
          background: focused ? t.inputBgFocus : t.inputBg,
          outline: "none", boxSizing: "border-box", color: t.inputText,
          transition: "all 0.2s",
          boxShadow: focused ? `0 0 0 3px ${t.focusRing}` : "none",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

// ─── Main Login ───────────────────────────────────────────────────────────────
export default function Login() {
  const nav = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const t = getTokens(isDark);

  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [key]: val }));
    setErrors(er => ({ ...er, [key]: "" }));
    setLoginError("");
  };

  const validate = () => {
    const errs = {};
    if (!form.email.includes("@")) errs.email = "Enter a valid email address";
    if (!form.password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const { login } = useAuth();

  const submit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      await login(form.email, form.password);
      setSuccess(true);
      setTimeout(() => {
        nav("/dashboard");
      }, 2000);
    } catch (err) {
      setLoginError("Incorrect email or password. Please try again.");
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") submit();
  };

  // ─── Success Screen ───────────────────────────────────────────────────────
  if (success) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.7); }
          70%  { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .success-icon  { animation: popIn 0.6s cubic-bezier(.34,1.56,.64,1) both; }
        .success-title { animation: fadeUp 0.5s ease 0.3s both; }
        .success-sub   { animation: fadeUp 0.5s ease 0.45s both; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark ? "#0a1f14" : "#f2faf5",
        flexDirection: "column",
        gap: 20,
        padding: 24,
      }}>

        <div className="success-icon" style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: t.accentGradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 44,
          boxShadow: "0 12px 40px rgba(44,138,78,0.35)",
        }}>
          🌿
        </div>

        <h2 className="success-title" style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 32,
          fontWeight: 900,
          color: t.textPrimary,
          textAlign: "center",
        }}>
          Login Successful!
        </h2>

        <p className="success-sub" style={{
          color: t.textSecondary,
          fontSize: 16,
          textAlign: "center",
          maxWidth: 360,
          lineHeight: 1.6,
        }}>
          Welcome back to <strong style={{ color: t.labelColor }}>CinnaPredict</strong>.
          Redirecting to your dashboard...
        </p>

      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes floatLeaf {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(6deg); }
        }
        .fade-up-0 { animation: fadeUp 0.6s 0.0s ease both; }
        .fade-up-1 { animation: fadeUp 0.6s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.6s 0.2s ease both; }
        .fade-up-3 { animation: fadeUp 0.6s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.6s 0.4s ease both; }
        .float-leaf { animation: floatLeaf 6s ease-in-out infinite; }
        .login-card:hover { box-shadow: ${t.cardShadowHover} !important; }
        .social-btn:hover { background: ${t.socialHoverBg} !important; border-color: ${t.socialHoverBorder} !important; }
        .link-hover:hover { color: ${t.linkColor} !important; }
        .theme-toggle:hover { transform: scale(1.06); }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: t.pageBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px", position: "relative", overflow: "hidden",
        transition: "background 0.4s",
      }}>

        {/* Background decorative elements */}
        <div style={{ position:"absolute",width:700,height:700,borderRadius:"50%",background:t.blob1,top:-300,right:-250,opacity:t.blob1Opacity,pointerEvents:"none" }}/>
        <div style={{ position:"absolute",width:400,height:400,borderRadius:"50%",background:t.blob2,bottom:-150,left:-100,opacity:t.blob2Opacity,pointerEvents:"none" }}/>

        {/* Floating leaves */}
        <div className="float-leaf" style={{ position:"absolute",top:"12%",left:"8%",fontSize:48,opacity:t.leafOpacity,pointerEvents:"none",userSelect:"none" }}>🍃</div>
        <div className="float-leaf" style={{ position:"absolute",bottom:"15%",right:"7%",fontSize:64,opacity:t.leafOpacity*0.75,pointerEvents:"none",userSelect:"none",animationDelay:"2s" }}>🌿</div>
        <div className="float-leaf" style={{ position:"absolute",top:"55%",left:"5%",fontSize:32,opacity:t.leafOpacity,pointerEvents:"none",userSelect:"none",animationDelay:"4s" }}>🍃</div>

        {/* Theme toggle */}
        <div className="theme-toggle" style={{ transition: "transform 0.2s" }}>
          <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} t={t} />
        </div>

        <div style={{ width:"100%",maxWidth:480,position:"relative",zIndex:1 }}>

          {/* Logo */}
          <div className="fade-up-0" style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:36 }}>
            <div style={{ width:48,height:48,borderRadius:14,background:t.accentGradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"0 6px 20px rgba(44,138,78,0.4)" }}>🌿</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:t.textPrimary }}>CinnaPredict</div>
              <div style={{ fontSize:10,color:t.subLabel,letterSpacing:"0.18em",textTransform:"uppercase" }}>Research System</div>
            </div>
          </div>

          {/* Card */}
          <div
            className="login-card"
            style={{
              background:t.cardBg,borderRadius:24,padding:"44px 44px 36px",
              boxShadow:t.cardShadow,
              border:t.cardBorder,
              transition:"box-shadow 0.4s, background 0.4s, border 0.4s",
            }}
          >
            <div className="fade-up-1" style={{ marginBottom:32 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:t.textPrimary,marginBottom:6 }}>Welcome back</h2>
              <p style={{ fontSize:14,color:t.textSecondary }}>Sign in to your plantation dashboard</p>
            </div>

            {/* Global error */}
            {loginError && (
              <div style={{ padding:"12px 16px",background:t.errorBg,border:`1.5px solid ${t.errorBorder}`,borderRadius:12,marginBottom:20,fontSize:13,color:t.errorColor,display:"flex",alignItems:"center",gap:8 }}>
                ⚠️ {loginError}
              </div>
            )}

            <div className="fade-up-2">
              <Field label="Email Address" error={errors.email} t={t}>
                <TextInput
                  value={form.email} onChange={set("email")}
                  placeholder="kasun@example.com" type="email"
                  error={errors.email} icon="📧" t={t}
                />
              </Field>

              <Field label="Password" error={errors.password} t={t}>
                <div style={{ position:"relative" }}>
                  <TextInput
                    value={form.password} onChange={(e) => { set("password")(e); }}
                    placeholder="Enter your password"
                    type={showPass ? "text" : "password"}
                    error={errors.password} icon="🔒" t={t}
                  />
                  <button
                    onClick={() => setShowPass(s => !s)}
                    style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:t.textSecondary,fontSize:17,lineHeight:1,padding:0 }}
                  >
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
              </Field>
            </div>

            <div className="fade-up-3" style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28 }}>
              <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:t.socialText,fontWeight:500 }}>
                <input
                  type="checkbox" checked={form.remember} onChange={set("remember")}
                  style={{ accentColor:t.checkboxAccent,width:15,height:15 }}
                />
                Remember me
              </label>
              <span
                onClick={() => nav("/forgot-password")}
                style={{ fontSize:13,color:t.forgotColor,fontWeight:600,cursor:"pointer",textDecoration:"underline" }}
              >
                Forgot password?
              </span>
            </div>

            <div className="fade-up-4">
              <button
                onClick={submit}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{
                  width:"100%",padding:"15px",borderRadius:12,border:"none",
                  background: loading ? t.buttonDisabled : t.accentGradient,
                  color:"white",fontSize:16,fontWeight:700,cursor:loading?"not-allowed":"pointer",
                  boxShadow:t.buttonShadow,
                  display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                  transition:"all 0.3s", marginBottom:20,
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTop:"2px solid white",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
                    Signing In...
                  </>
                ) : "Sign In to Dashboard"}
              </button>

              {/* Divider */}
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
                <div style={{ flex:1,height:1,background:t.divider }}/>
                <span style={{ fontSize:12,color:t.dividerText,fontWeight:500 }}>or continue with</span>
                <div style={{ flex:1,height:1,background:t.divider }}/>
              </div>

              {/* Social buttons */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:28 }}>
                {[
                  { icon:"🔵", label:"Google" },
                  { icon:"🟦", label:"Microsoft" },
                ].map(({ icon, label }) => (
                  <button key={label} className="social-btn" style={{
                    padding:"12px",borderRadius:12,border:`1.5px solid ${t.socialBorder}`,
                    background:t.socialBg,fontSize:14,fontWeight:600,color:t.socialText,
                    cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                    transition:"all 0.2s",
                  }}>
                    <span style={{ fontSize:18 }}>{icon}</span> {label}
                  </button>
                ))}
              </div>

              <p style={{ textAlign:"center",fontSize:14,color:t.textSecondary }}>
                New to CinnaPredict?{" "}
                <span onClick={() => nav("/signup")} style={{ color:t.linkColor,fontWeight:700,cursor:"pointer",textDecoration:"underline" }}>
                  Create an account
                </span>
              </p>
            </div>
          </div>

          {/* Bottom note */}
          <p style={{ textAlign:"center",marginTop:24,fontSize:12,color:t.bottomNote,lineHeight:1.6 }}>
            🔒 Your farm data is encrypted and never shared without consent.<br/>
            University Research Project · Sri Lanka
          </p>
        </div>
      </div>
    </>
  );
}