import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeProvider";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const SRI_LANKA_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
];

const FARM_SIZE_OPTIONS = [
  "Less than 1 acre",
  "1 – 5 acres",
  "5 – 10 acres",
  "10 – 25 acres",
  "25 – 50 acres",
  "More than 50 acres",
];

const CINNAMON_VARIETIES = [
  "Ceylon True Cinnamon (C. verum)",
  "Sri Vijaya",
  "Navashakti",
  "Thunpaha",
  "Pan Kurdu",
  "Other / Mixed",
];

const EXPERIENCE_LEVELS = [
  "Beginner (< 2 years)",
  "Intermediate (2 – 5 years)",
  "Experienced (5 – 10 years)",
  "Expert (10+ years)",
];

// ─── Theme Tokens ──────────────────────────────────────────────────────────
function getTokens(isDark) {
  return isDark
    ? {
        pageBg: "#0a1f14",
        rightPanelBg: "#0a1f14",
        accentGradient: "linear-gradient(135deg,#2d8a4e,#1a5c2e)",
        stepInactiveBg: "#122318",
        stepInactiveText: "#5f8a70",
        stepInactiveBorder: "2px solid #254a34",
        stepLineInactive: "#254a34",
        stepLineActive: "linear-gradient(90deg,#2d8a4e,#4caf73)",
        textPrimary: "#eaf5ee",
        textSecondary: "#8fb89e",
        labelColor: "#9fd6b3",
        hintColor: "#6f9c81",
        inputBorder: "#254a34",
        inputBorderFocus: "#3fae6a",
        inputBg: "#0f2015",
        inputBgFocus: "#132a1c",
        inputText: "#eaf5ee",
        focusRing: "rgba(63,174,106,0.22)",
        errorColor: "#ff8080",
        strengthTrack: "#22402c",
        strengthNeutral: "#5f8a70",
        termsBg: "#122318",
        termsBorder: "#254a34",
        termsText: "#bfe3cd",
        linkColor: "#4cc27f",
        backBtnBorder: "#254a34",
        backBtnBg: "#0f2015",
        backBtnText: "#9fd6b3",
        buttonDisabled: "#22422e",
        buttonShadow: "0 6px 20px rgba(45,138,78,0.45)",
        leftPanelGradient: "linear-gradient(160deg,#0e3320 0%,#081f10 60%,#050f08 100%)",
      }
    : {
        pageBg: "#f2faf5",
        rightPanelBg: "#f2faf5",
        accentGradient: "linear-gradient(135deg,#2d8a4e,#1a5c2e)",
        stepInactiveBg: "white",
        stepInactiveText: "#9cb8a8",
        stepInactiveBorder: "2px solid #d4e8db",
        stepLineInactive: "#d4e8db",
        stepLineActive: "linear-gradient(90deg,#2d8a4e,#4caf73)",
        textPrimary: "#0f2d1a",
        textSecondary: "#7aaa8a",
        labelColor: "#1a5c2e",
        hintColor: "#7aaa8a",
        inputBorder: "#cde4d5",
        inputBorderFocus: "#2d8a4e",
        inputBg: "white",
        inputBgFocus: "#f7fdf9",
        inputText: "#0f2d1a",
        focusRing: "rgba(44,138,78,0.12)",
        errorColor: "#e05252",
        strengthTrack: "#e0ede5",
        strengthNeutral: "#9cb8a8",
        termsBg: "#f7fdf9",
        termsBorder: "#cde4d5",
        termsText: "#2a5c3a",
        linkColor: "#1a5c2e",
        backBtnBorder: "#cde4d5",
        backBtnBg: "white",
        backBtnText: "#1a5c2e",
        buttonDisabled: "#9cb8a8",
        buttonShadow: "0 6px 20px rgba(44,138,78,0.35)",
        leftPanelGradient: "linear-gradient(160deg,#1a5c2e 0%,#0e3d1e 60%,#0a2412 100%)",
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
        background: t.inputBg,
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

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, total, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < total - 1 ? 1 : 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14,
            background: i <= current ? t.accentGradient : t.stepInactiveBg,
            color: i <= current ? "white" : t.stepInactiveText,
            border: i <= current ? "none" : t.stepInactiveBorder,
            boxShadow: i === current ? "0 4px 16px rgba(44,138,78,0.4)" : "none",
            transition: "all 0.4s",
            zIndex: 1,
          }}>
            {i < current ? (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (i + 1)}
          </div>
          {i < total - 1 && (
            <div style={{
              flex: 1, height: 2,
              background: i < current ? t.stepLineActive : t.stepLineInactive,
              transition: "background 0.4s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function Field({ label, hint, error, children, t }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: t.labelColor, marginBottom: 6, letterSpacing: "0.02em" }}>
        {label}
      </label>
      {children}
      {hint && !error && <div style={{ fontSize: 12, color: t.hintColor, marginTop: 5 }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: t.errorColor, marginTop: 5 }}>{error}</div>}
    </div>
  );
}

const inputStyle = (focused, error, t) => ({
  width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 15,
  border: `1.5px solid ${error ? t.errorColor : focused ? t.inputBorderFocus : t.inputBorder}`,
  background: focused ? t.inputBgFocus : t.inputBg,
  outline: "none", boxSizing: "border-box", color: t.inputText,
  transition: "all 0.2s",
  boxShadow: focused ? `0 0 0 3px ${t.focusRing}` : "none",
});

function TextInput({ value, onChange, placeholder, type = "text", error, t }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={inputStyle(focused, error, t)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder, error, t }) {
  const [focused, setFocused] = useState(false);
  const arrowColor = t.inputBorderFocus === "#3fae6a" ? "%233fae6a" : "%232d8a4e";
  return (
    <select
      value={value} onChange={onChange}
      style={{ ...inputStyle(focused, error, t), appearance: "none", cursor: "pointer", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='${arrowColor}' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function TextareaInput({ value, onChange, placeholder, rows = 3, error, t }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ ...inputStyle(focused, error, t), resize: "vertical", fontFamily: "inherit" }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─── Password Strength ────────────────────────────────────────────────────────
function PasswordStrength({ password, t }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["#e05252", "#e08c52", "#e8c84a", "#2d8a4e"];
  const labels = ["Weak", "Fair", "Good", "Strong"];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < score ? colors[score - 1] : t.strengthTrack, transition: "all 0.3s" }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: score > 0 ? colors[score - 1] : t.strengthNeutral, fontWeight: 600 }}>
        {score > 0 ? labels[score - 1] : ""}
      </div>
    </div>
  );
}

// ─── Main SignUp ──────────────────────────────────────────────────────────────
export default function SignUp() {
  const nav = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const t = getTokens(isDark);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    // Step 0 – Account
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
    // Step 1 – Farm Details
    farmName: "", district: "", address: "", farmSize: "", variety: "",
    // Step 2 – Profile
    experience: "", phone: "", bio: "", agreedToTerms: false,
  });

  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [key]: val }));
    setErrors(er => ({ ...er, [key]: "" }));
  };

  const STEPS = ["Account", "Farm Details", "Profile"];

  // ─ Validation ─
  const validate = () => {
    const errs = {};
    if (step === 0) {
      if (!form.firstName.trim()) errs.firstName = "First name is required";
      if (!form.lastName.trim()) errs.lastName = "Last name is required";
      if (!form.email.includes("@")) errs.email = "Enter a valid email";
      if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    }
    if (step === 1) {
      if (!form.farmName.trim()) errs.farmName = "Farm name is required";
      if (!form.district) errs.district = "Please select a district";
      if (!form.farmSize) errs.farmSize = "Please select farm size";
    }
    if (step === 2) {
      if (!form.experience) errs.experience = "Please select your experience level";
      if (!form.agreedToTerms) errs.agreedToTerms = "You must agree to the terms";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const { signup } = useAuth();

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const userCredential = await signup(form.email, form.password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        firstName:  form.firstName,
        lastName:   form.lastName,
        email:      form.email,
        farmName:   form.farmName,
        district:   form.district,
        address:    form.address,
        farmSize:   form.farmSize,
        variety:    form.variety,
        experience: form.experience,
        phone:      form.phone,
        bio:        form.bio,
        createdAt:  new Date().toISOString(),
      });

      setSuccess(true);
    } catch (err) {
      setErrors({ email: err.message });
      setLoading(false);
    }
  };

  const stepLabels = [
    { icon: "👤", title: "Create your account", sub: "Set up your login credentials" },
    { icon: "🌿", title: "Tell us about your farm", sub: "Help us tailor insights for your plantation" },
    { icon: "📋", title: "Complete your profile", sub: "A few last details to get started" },
  ];

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
        .success-icon  { animation: popIn  0.6s cubic-bezier(.34,1.56,.64,1) both; }
        .success-title { animation: fadeUp 0.5s ease 0.3s both; }
        .success-sub   { animation: fadeUp 0.5s ease 0.45s both; }
        .success-btn   { animation: fadeUp 0.5s ease 0.6s both; }
      `}</style>
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: t.pageBg, flexDirection: "column",
        gap: 20, padding: 24,
      }}>
        <div className="success-icon" style={{
          width: 96, height: 96, borderRadius: "50%",
          background: t.accentGradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 44, boxShadow: "0 12px 40px rgba(44,138,78,0.35)",
        }}>🌿</div>

        <h2 className="success-title" style={{
          fontFamily: "'Playfair Display',serif", fontSize: 32,
          fontWeight: 900, color: t.textPrimary, textAlign: "center",
        }}>
          Account Created Successfully!
        </h2>

        <p className="success-sub" style={{
          color: t.textSecondary, fontSize: 16, textAlign: "center", maxWidth: 360, lineHeight: 1.6,
        }}>
          Welcome to CinnaPredict, <strong style={{ color: t.labelColor }}>{form.firstName}</strong>!
          Your plantation profile has been saved and you're all set.
        </p>

        <button
          className="success-btn"
          onClick={() => nav("/dashboard")}
          style={{
            marginTop: 8, padding: "14px 40px", borderRadius: 12, border: "none",
            background: t.accentGradient, color: "white",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 6px 20px rgba(44,138,78,0.35)", transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          Go to Dashboard →
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .step-panel { animation: fadeSlide 0.4s ease both; }
        .left-panel-img { position:absolute;inset:0;background:${t.leftPanelGradient}; }
        .leaf-deco { position:absolute;opacity:0.07;pointer-events:none; }
        .theme-toggle:hover { transform: scale(1.06); }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", background: t.pageBg, transition: "background 0.4s" }}>

        {/* ── Left Panel ── */}
        <div style={{ width: 420, flexShrink: 0, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 48 }}>
          <div className="left-panel-img" />

          {/* Decorative circles */}
          <div style={{ position:"absolute",width:400,height:400,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.06)",top:-100,right:-150,pointerEvents:"none" }}/>
          <div style={{ position:"absolute",width:280,height:280,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.06)",bottom:60,left:-80,pointerEvents:"none" }}/>
          <div style={{ position:"absolute",width:180,height:180,borderRadius:"50%",background:"rgba(76,175,115,0.08)",top:"40%",right:-40,pointerEvents:"none" }}/>

          {/* Logo */}
          <div style={{ position:"relative",zIndex:1 }}>
            <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:64 }}>
              <div style={{ width:44,height:44,borderRadius:14,background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>🌿</div>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,color:"white" }}>CinnaPredict</div>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.45)",letterSpacing:"0.18em",textTransform:"uppercase" }}>Research System</div>
              </div>
            </div>

            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,color:"white",lineHeight:1.2,marginBottom:20 }}>
              Join Sri Lanka's<br/>
              <span style={{ color:"#7de0a4" }}>Cinnamon Intelligence</span><br/>
              Platform
            </div>
            <p style={{ fontSize:15,color:"rgba(255,255,255,0.55)",lineHeight:1.7,marginBottom:48 }}>
              Connect your plantation to AI-powered disease risk prediction and climate analysis tools.
            </p>
          </div>

          {/* Benefits */}
          <div style={{ position:"relative",zIndex:1 }}>
            {[
              { icon:"🧠", text:"AI disease risk forecasting" },
              { icon:"🌡️", text:"Real-time climate monitoring" },
              { icon:"📊", text:"Plantation health dashboards" },
              { icon:"📍", text:"Location-specific advisories" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display:"flex",alignItems:"center",gap:14,marginBottom:18 }}>
                <div style={{ width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0 }}>{icon}</div>
                <span style={{ fontSize:14,color:"rgba(255,255,255,0.7)",fontWeight:500 }}>{text}</span>
              </div>
            ))}

            <div style={{ marginTop:40,paddingTop:32,borderTop:"1px solid rgba(255,255,255,0.1)",fontSize:13,color:"rgba(255,255,255,0.35)" }}>
              © {new Date().getFullYear()} CinnaPredict · University Research Project
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",overflowY:"auto",position:"relative",background:t.rightPanelBg,transition:"background 0.4s" }}>

          {/* Theme toggle */}
          <div className="theme-toggle" style={{ transition: "transform 0.2s" }}>
            <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} t={t} />
          </div>

          <div style={{ width:"100%",maxWidth:540 }}>

            {/* Step header */}
            <div style={{ marginBottom:32 }}>
              <div style={{ fontSize:28,marginBottom:8 }}>{stepLabels[step].icon}</div>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:t.textPrimary,marginBottom:6 }}>{stepLabels[step].title}</h2>
              <p style={{ fontSize:14,color:t.textSecondary }}>{stepLabels[step].sub}</p>
            </div>

            {/* Step indicator */}
            <StepIndicator current={step} total={3} t={t} />

            {/* ── Step 0: Account ── */}
            {step === 0 && (
              <div className="step-panel">
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
                  <Field label="First Name" error={errors.firstName} t={t}>
                    <TextInput value={form.firstName} onChange={set("firstName")} placeholder="Kasun" error={errors.firstName} t={t}/>
                  </Field>
                  <Field label="Last Name" error={errors.lastName} t={t}>
                    <TextInput value={form.lastName} onChange={set("lastName")} placeholder="Perera" error={errors.lastName} t={t}/>
                  </Field>
                </div>
                <Field label="Email Address" error={errors.email} t={t}>
                  <TextInput value={form.email} onChange={set("email")} placeholder="kasun@example.com" type="email" error={errors.email} t={t}/>
                </Field>
                <Field label="Password" hint="At least 8 characters with uppercase and numbers" error={errors.password} t={t}>
                  <div style={{ position:"relative" }}>
                    <TextInput value={form.password} onChange={set("password")} placeholder="Create a strong password" type={showPass ? "text" : "password"} error={errors.password} t={t}/>
                    <button onClick={() => setShowPass(s=>!s)} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:t.textSecondary,fontSize:18,lineHeight:1 }}>
                      {showPass ? "🙈" : "👁"}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} t={t}/>
                </Field>
                <Field label="Confirm Password" error={errors.confirmPassword} t={t}>
                  <TextInput value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat your password" type="password" error={errors.confirmPassword} t={t}/>
                </Field>
              </div>
            )}

            {/* ── Step 1: Farm Details ── */}
            {step === 1 && (
              <div className="step-panel">
                <Field label="Farm / Plantation Name" error={errors.farmName} t={t}>
                  <TextInput value={form.farmName} onChange={set("farmName")} placeholder="e.g. Green Valley Cinnamon Estate" error={errors.farmName} t={t}/>
                </Field>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
                  <Field label="District" error={errors.district} t={t}>
                    <SelectInput value={form.district} onChange={set("district")} options={SRI_LANKA_DISTRICTS} placeholder="Select district" error={errors.district} t={t}/>
                  </Field>
                  <Field label="Farm Size" error={errors.farmSize} t={t}>
                    <SelectInput value={form.farmSize} onChange={set("farmSize")} options={FARM_SIZE_OPTIONS} placeholder="Select size" error={errors.farmSize} t={t}/>
                  </Field>
                </div>
                <Field label="Plantation Address / GPS Location" hint="Street address, village, or GPS coordinates" t={t}>
                  <TextInput value={form.address} onChange={set("address")} placeholder="e.g. Matara Road, Akuressa" t={t}/>
                </Field>
                <Field label="Cinnamon Variety Grown" hint="Select the primary variety on your farm" t={t}>
                  <SelectInput value={form.variety} onChange={set("variety")} options={CINNAMON_VARIETIES} placeholder="Select variety" t={t}/>
                </Field>
              </div>
            )}

            {/* ── Step 2: Profile ── */}
            {step === 2 && (
              <div className="step-panel">
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
                  <Field label="Farming Experience" error={errors.experience} t={t}>
                    <SelectInput value={form.experience} onChange={set("experience")} options={EXPERIENCE_LEVELS} placeholder="Select level" error={errors.experience} t={t}/>
                  </Field>
                  <Field label="Phone Number" hint="Optional — for SMS alerts" t={t}>
                    <TextInput value={form.phone} onChange={set("phone")} placeholder="+94 77 123 4567" type="tel" t={t}/>
                  </Field>
                </div>
                <Field label="About Your Farm" hint="Brief description to personalise your experience" t={t}>
                  <TextareaInput value={form.bio} onChange={set("bio")} placeholder="Tell us about your plantation — crops, challenges, goals..." rows={4} t={t}/>
                </Field>

                {/* Terms */}
                <div style={{ marginBottom:24,padding:18,background:t.termsBg,borderRadius:14,border:`1.5px solid ${t.termsBorder}` }}>
                  <label style={{ display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer" }}>
                    <input
                      type="checkbox" checked={form.agreedToTerms} onChange={set("agreedToTerms")}
                      style={{ marginTop:3,accentColor:"#2d8a4e",width:16,height:16,flexShrink:0 }}
                    />
                    <span style={{ fontSize:13,color:t.termsText,lineHeight:1.6 }}>
                      I agree to the <span style={{ color:t.linkColor,fontWeight:700,textDecoration:"underline",cursor:"pointer" }}>Terms of Service</span> and <span style={{ color:t.linkColor,fontWeight:700,textDecoration:"underline",cursor:"pointer" }}>Privacy Policy</span>. My farm data will only be used for research and advisory purposes.
                    </span>
                  </label>
                  {errors.agreedToTerms && <div style={{ fontSize:12,color:t.errorColor,marginTop:8 }}>{errors.agreedToTerms}</div>}
                </div>
              </div>
            )}

            {/* ── Navigation Buttons ── */}
            <div style={{ display:"flex",gap:12,marginTop:8 }}>
              {step > 0 && (
                <button onClick={back} style={{ flex:1,padding:"14px",borderRadius:12,border:`1.5px solid ${t.backBtnBorder}`,background:t.backBtnBg,color:t.backBtnText,fontSize:15,fontWeight:600,cursor:"pointer",transition:"all 0.2s" }}>
                  ← Back
                </button>
              )}
              {step < 2 ? (
                <button onClick={next} style={{ flex:2,padding:"14px",borderRadius:12,border:"none",background:t.accentGradient,color:"white",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:t.buttonShadow,transition:"all 0.2s" }}>
                  Continue →
                </button>
              ) : (
                <button onClick={submit} disabled={loading} style={{ flex:2,padding:"14px",borderRadius:12,border:"none",background:loading?t.buttonDisabled:t.accentGradient,color:"white",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",boxShadow:t.buttonShadow,display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"all 0.3s" }}>
                  {loading ? (
                    <>
                      <div style={{ width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTop:"2px solid white",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
                      Creating Account...
                    </>
                  ) : "🌿 Create My Account"}
                </button>
              )}
            </div>

            <p style={{ textAlign:"center",marginTop:24,fontSize:14,color:t.textSecondary }}>
              Already have an account?{" "}
              <span onClick={() => nav("/login")} style={{ color:t.linkColor,fontWeight:700,cursor:"pointer",textDecoration:"underline" }}>Login</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}