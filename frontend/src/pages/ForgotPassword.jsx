import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Shared Input ─────────────────────────────────────────────────────────────
function Field({ label, error, hint, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1a5c2e", marginBottom: 6, letterSpacing: "0.02em" }}>
        {label}
      </label>
      {children}
      {hint && !error && <div style={{ fontSize: 12, color: "#7aaa8a", marginTop: 5 }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: "#e05252", marginTop: 5 }}>{error}</div>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", error, icon, rightEl }) {
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
          width: "100%",
          padding: `12px ${rightEl ? "48px" : "14px"} 12px ${icon ? "42px" : "14px"}`,
          borderRadius: 12, fontSize: 15,
          border: `1.5px solid ${error ? "#e05252" : focused ? "#2d8a4e" : "#cde4d5"}`,
          background: focused ? "#f7fdf9" : "white",
          outline: "none", boxSizing: "border-box", color: "#0f2d1a",
          transition: "all 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(44,138,78,0.12)" : "none",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightEl && (
        <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
          {rightEl}
        </div>
      )}
    </div>
  );
}

// ─── Password Strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
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
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < score ? colors[score - 1] : "#e0ede5", transition: "all 0.3s" }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: score > 0 ? colors[score - 1] : "#9cb8a8", fontWeight: 600 }}>
        {score > 0 ? labels[score - 1] : ""}
      </div>
    </div>
  );
}

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OTPInput({ value, onChange }) {
  const digits = 6;
  const arr = value.split("").concat(Array(digits).fill("")).slice(0, digits);

  const handleKey = (e, idx) => {
    const key = e.key;
    if (key === "Backspace") {
      const next = arr.map((d, i) => (i === idx ? "" : d)).join("");
      onChange(next);
      if (idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus();
      return;
    }
    if (!/^\d$/.test(key)) return;
    const next = arr.map((d, i) => (i === idx ? key : d)).join("");
    onChange(next);
    if (idx < digits - 1) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, digits);
    onChange(pasted.padEnd(digits, "").slice(0, digits));
    document.getElementById(`otp-${Math.min(pasted.length, digits - 1)}`)?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", margin: "8px 0" }}>
      {arr.map((digit, idx) => (
        <input
          key={idx}
          id={`otp-${idx}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onKeyDown={(e) => handleKey(e, idx)}
          onPaste={handlePaste}
          onChange={() => {}}
          style={{
            width: 52, height: 58, textAlign: "center",
            fontSize: 24, fontWeight: 700, color: "#0f2d1a",
            border: `2px solid ${digit ? "#2d8a4e" : "#cde4d5"}`,
            borderRadius: 14, outline: "none",
            background: digit ? "#f2fdf5" : "white",
            boxShadow: digit ? "0 0 0 3px rgba(44,138,78,0.12)" : "none",
            transition: "all 0.2s",
            caretColor: "transparent",
          }}
        />
      ))}
    </div>
  );
}

// ─── Step configs ─────────────────────────────────────────────────────────────
const STEPS = [
  { icon: "🔑", title: "Forgot your password?", sub: "Enter your email and we'll send a reset code" },
  { icon: "📬", title: "Check your email", sub: "Enter the 6-digit code we sent you" },
  { icon: "🔒", title: "Create new password", sub: "Choose a strong password for your account" },
  { icon: "✅", title: "Password reset!", sub: "Your password has been updated successfully" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [resendTimer, setResendTimer] = useState(0);

  // Resend countdown
  const startResendTimer = () => {
    setResendTimer(60);
    const t = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const mockApi = (ms = 1500) =>
    new Promise(resolve => setTimeout(resolve, ms));

  // ── Step 0: Send OTP ──
 const { resetPassword } = useAuth();

const sendCode = async () => {
  if (!email.includes("@")) { setErrors({ email: "Enter a valid email" }); return; }
  setLoading(true);
  try {
    await resetPassword(email);
    setLoading(false);
    setStep(3); // Go straight to success — Firebase sends the real email
  } catch (err) {
    setErrors({ email: err.message });
    setLoading(false);
  }
};

  // ── Step 1: Verify OTP ──
  const verifyCode = async () => {
    if (otp.length < 6) { setErrors({ otp: "Please enter all 6 digits" }); return; }
    setErrors({});
    setLoading(true);
    await mockApi();
    setLoading(false);
    setStep(2);
  };

  const resendCode = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    await mockApi(800);
    setLoading(false);
    setOtp("");
    startResendTimer();
  };

  const { icon, title, sub } = STEPS[step];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes floatLeaf {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(5deg); }
        }
        @keyframes successPop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
        .panel { animation: fadeSlide 0.4s ease both; }
        .float-leaf { animation: floatLeaf 7s ease-in-out infinite; }
        .success-icon { animation: successPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
        .check-path { stroke-dasharray: 60; animation: checkDraw 0.5s 0.5s ease both; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#f2faf5 0%,#e0f2e9 50%,#c8e6d4 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, position: "relative", overflow: "hidden",
      }}>
        {/* Background blobs */}
        <div style={{ position:"absolute",width:600,height:600,borderRadius:"50%",background:"linear-gradient(135deg,#2d8a4e,#1a5c2e)",top:-250,right:-200,opacity:0.06,pointerEvents:"none" }}/>
        <div style={{ position:"absolute",width:380,height:380,borderRadius:"50%",background:"#4caf73",bottom:-120,left:-80,opacity:0.07,pointerEvents:"none" }}/>

        {/* Floating leaves */}
        <div className="float-leaf" style={{ position:"absolute",top:"10%",left:"7%",fontSize:44,opacity:0.08,pointerEvents:"none",userSelect:"none" }}>🍃</div>
        <div className="float-leaf" style={{ position:"absolute",bottom:"14%",right:"6%",fontSize:60,opacity:0.06,pointerEvents:"none",userSelect:"none",animationDelay:"3s" }}>🌿</div>

        <div style={{ width:"100%",maxWidth:460,position:"relative",zIndex:1 }}>

          {/* Logo */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:36,animation:"fadeUp 0.5s ease both" }}>
            <div style={{ width:46,height:46,borderRadius:14,background:"linear-gradient(135deg,#2d8a4e,#1a5c2e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 6px 20px rgba(44,138,78,0.4)" }}>🌿</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:21,color:"#0f2d1a" }}>CinnaPredict</div>
              <div style={{ fontSize:10,color:"#7aaa8a",letterSpacing:"0.18em",textTransform:"uppercase" }}>Research System</div>
            </div>
          </div>

          {/* Progress dots */}
          {step < 3 && (
            <div style={{ display:"flex",justifyContent:"center",gap:8,marginBottom:28 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  height: 6, width: i === step ? 28 : 8,
                  borderRadius: 99,
                  background: i <= step ? "linear-gradient(90deg,#2d8a4e,#4caf73)" : "#cde4d5",
                  transition: "all 0.4s",
                }}/>
              ))}
            </div>
          )}

          {/* Card */}
          <div style={{
            background:"white",borderRadius:24,padding:"44px 44px 36px",
            boxShadow:"0 16px 56px rgba(26,92,46,0.12)",
            border:"1px solid rgba(44,138,78,0.1)",
          }}>

            {/* ── Step Header ── */}
            <div className="panel" key={`header-${step}`} style={{ textAlign:"center",marginBottom:32 }}>
              <div style={{ fontSize:42,marginBottom:12 }}>{icon}</div>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:"#0f2d1a",marginBottom:8 }}>{title}</h2>
              <p style={{ fontSize:14,color:"#7aaa8a",lineHeight:1.6 }}>{sub}</p>
            </div>

            {/* ════ STEP 0: Enter Email ════ */}
            {step === 0 && (
              <div className="panel" key="step0">
                <Field label="Email Address" error={errors.email}>
                  <TextInput
                    value={email} onChange={e => { setEmail(e.target.value); setErrors({}); }}
                    placeholder="kasun@example.com" type="email"
                    error={errors.email} icon="📧"
                  />
                </Field>

                <div style={{ padding:"14px 16px",background:"#f7fdf9",borderRadius:12,border:"1px solid #cde4d5",marginBottom:24,display:"flex",gap:12,alignItems:"flex-start" }}>
                  <span style={{ fontSize:18,flexShrink:0,marginTop:1 }}>💡</span>
                  <p style={{ fontSize:13,color:"#2a5c3a",lineHeight:1.6 }}>
                    We'll send a 6-digit verification code to this email. Make sure it's the one linked to your CinnaPredict account.
                  </p>
                </div>

                <button
                  onClick={sendCode} disabled={loading}
                  style={{ width:"100%",padding:"15px",borderRadius:12,border:"none",background:loading?"#9cb8a8":"linear-gradient(135deg,#2d8a4e,#1a5c2e)",color:"white",fontSize:16,fontWeight:700,cursor:loading?"not-allowed":"pointer",boxShadow:"0 6px 24px rgba(44,138,78,0.35)",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:20 }}
                >
                  {loading
                    ? <><div style={{ width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTop:"2px solid white",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/> Sending Code...</>
                    : "Send Reset Code →"}
                </button>

                <p style={{ textAlign:"center",fontSize:14,color:"#7aaa8a" }}>
                  Remember your password?{" "}
                  <span onClick={() => nav("/login")} style={{ color:"#1a5c2e",fontWeight:700,cursor:"pointer",textDecoration:"underline" }}>Sign In</span>
                </p>
              </div>
            )}

            {/* ════ STEP 1: Enter OTP ════ */}
            {step === 1 && (
              <div className="panel" key="step1">
                {/* Email badge */}
                <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"10px 18px",background:"#f2fdf5",border:"1.5px solid #cde4d5",borderRadius:99,marginBottom:28,width:"fit-content",margin:"0 auto 28px" }}>
                  <span style={{ fontSize:16 }}>📧</span>
                  <span style={{ fontSize:14,fontWeight:600,color:"#1a5c2e" }}>{email}</span>
                </div>

                <Field label="Verification Code" error={errors.otp} hint="Enter the 6-digit code from your email">
                  <OTPInput value={otp} onChange={v => { setOtp(v); setErrors({}); }} />
                </Field>

                {/* Resend */}
                <div style={{ textAlign:"center",marginBottom:24 }}>
                  {resendTimer > 0 ? (
                    <p style={{ fontSize:13,color:"#9cb8a8" }}>
                      Resend code in <span style={{ fontWeight:700,color:"#2d8a4e" }}>{resendTimer}s</span>
                    </p>
                  ) : (
                    <p style={{ fontSize:13,color:"#7aaa8a" }}>
                      Didn't receive it?{" "}
                      <span onClick={resendCode} style={{ color:"#1a5c2e",fontWeight:700,cursor:"pointer",textDecoration:"underline" }}>
                        {loading ? "Resending..." : "Resend Code"}
                      </span>
                    </p>
                  )}
                </div>

                <button
                  onClick={verifyCode} disabled={loading || otp.length < 6}
                  style={{ width:"100%",padding:"15px",borderRadius:12,border:"none",background:(loading||otp.length<6)?"#9cb8a8":"linear-gradient(135deg,#2d8a4e,#1a5c2e)",color:"white",fontSize:16,fontWeight:700,cursor:(loading||otp.length<6)?"not-allowed":"pointer",boxShadow:"0 6px 24px rgba(44,138,78,0.35)",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16 }}
                >
                  {loading
                    ? <><div style={{ width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTop:"2px solid white",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/> Verifying...</>
                    : "Verify Code →"}
                </button>

                <button
                  onClick={() => setStep(0)}
                  style={{ width:"100%",padding:"13px",borderRadius:12,border:"1.5px solid #cde4d5",background:"white",color:"#1a5c2e",fontSize:14,fontWeight:600,cursor:"pointer" }}
                >
                  ← Change Email
                </button>
              </div>
            )}

            {/* ════ STEP 2: New Password ════ */}
            {step === 2 && (
              <div className="panel" key="step2">
                <Field label="New Password" error={errors.newPassword} hint="At least 8 characters with uppercase, number & symbol">
                  <TextInput
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setErrors(er => ({...er, newPassword:""})); }}
                    placeholder="Create a strong password"
                    type={showNew ? "text" : "password"}
                    error={errors.newPassword} icon="🔒"
                    rightEl={
                      <button onClick={() => setShowNew(s=>!s)} style={{ background:"none",border:"none",cursor:"pointer",color:"#5a8a6a",fontSize:17,lineHeight:1,padding:0 }}>
                        {showNew ? "🙈" : "👁"}
                      </button>
                    }
                  />
                  <PasswordStrength password={newPassword} />
                </Field>

                <Field label="Confirm New Password" error={errors.confirmPassword}>
                  <TextInput
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setErrors(er => ({...er, confirmPassword:""})); }}
                    placeholder="Repeat your new password"
                    type={showConfirm ? "text" : "password"}
                    error={errors.confirmPassword} icon="🔒"
                    rightEl={
                      <button onClick={() => setShowConfirm(s=>!s)} style={{ background:"none",border:"none",cursor:"pointer",color:"#5a8a6a",fontSize:17,lineHeight:1,padding:0 }}>
                        {showConfirm ? "🙈" : "👁"}
                      </button>
                    }
                  />
                </Field>

                {/* Requirements checklist */}
                <div style={{ padding:"16px",background:"#f7fdf9",borderRadius:12,border:"1px solid #cde4d5",marginBottom:24 }}>
                  <div style={{ fontSize:12,fontWeight:700,color:"#1a5c2e",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em" }}>Password Requirements</div>
                  {[
                    [newPassword.length >= 8, "At least 8 characters"],
                    [/[A-Z]/.test(newPassword), "One uppercase letter"],
                    [/[0-9]/.test(newPassword), "One number"],
                    [/[^A-Za-z0-9]/.test(newPassword), "One special character"],
                  ].map(([met, label]) => (
                    <div key={label} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                      <div style={{ width:18,height:18,borderRadius:"50%",background:met?"#2d8a4e":"#e0ede5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.3s" }}>
                        {met && <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                      <span style={{ fontSize:13,color:met?"#1a5c2e":"#9cb8a8",fontWeight:met?600:400,transition:"all 0.3s" }}>{label}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={resetPassword} disabled={loading}
                  style={{ width:"100%",padding:"15px",borderRadius:12,border:"none",background:loading?"#9cb8a8":"linear-gradient(135deg,#2d8a4e,#1a5c2e)",color:"white",fontSize:16,fontWeight:700,cursor:loading?"not-allowed":"pointer",boxShadow:"0 6px 24px rgba(44,138,78,0.35)",display:"flex",alignItems:"center",justifyContent:"center",gap:10 }}
                >
                  {loading
                    ? <><div style={{ width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTop:"2px solid white",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/> Updating Password...</>
                    : "🔒 Reset Password"}
                </button>
              </div>
            )}

            {/* ════ STEP 3: Success ════ */}
            {step === 3 && (
              <div className="panel" key="step3" style={{ textAlign:"center" }}>
                {/* Animated checkmark */}
                <div className="success-icon" style={{ width:88,height:88,borderRadius:"50%",background:"linear-gradient(135deg,#2d8a4e,#1a5c2e)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 28px",boxShadow:"0 10px 40px rgba(44,138,78,0.4)" }}>
                  <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                    <path className="check-path" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>

                <p style={{ fontSize:15,color:"#5a8a6a",lineHeight:1.7,marginBottom:32,maxWidth:340,margin:"0 auto 32px" }}>
                  Your password has been successfully reset. You can now sign in to your CinnaPredict account with your new password.
                </p>

                {/* Account pill */}
                <div style={{ display:"inline-flex",alignItems:"center",gap:10,padding:"12px 20px",background:"#f2fdf5",border:"1.5px solid #cde4d5",borderRadius:99,marginBottom:32 }}>
                  <span style={{ fontSize:18 }}>🌿</span>
                  <span style={{ fontSize:14,fontWeight:600,color:"#1a5c2e" }}>{email}</span>
                </div>

                <button
                  onClick={() => nav("/login")}
                  style={{ width:"100%",padding:"15px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#2d8a4e,#1a5c2e)",color:"white",fontSize:16,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 24px rgba(44,138,78,0.35)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:14 }}
                >
                  Sign In Now →
                </button>

                <button
                  onClick={() => nav("/")}
                  style={{ width:"100%",padding:"13px",borderRadius:12,border:"1.5px solid #cde4d5",background:"white",color:"#1a5c2e",fontSize:14,fontWeight:600,cursor:"pointer" }}
                >
                  Back to Home
                </button>
              </div>
            )}
          </div>

          {/* Bottom note */}
          <p style={{ textAlign:"center",marginTop:24,fontSize:12,color:"#9cb8a8",lineHeight:1.6 }}>
            🔒 Your account security is our priority.<br/>
            CinnaPredict · University Research Project · Sri Lanka
          </p>
        </div>
      </div>
    </>
  );
}