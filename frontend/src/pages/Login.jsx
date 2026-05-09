import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Input Field Wrapper ──────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1a5c2e", marginBottom: 6, letterSpacing: "0.02em" }}>
        {label}
      </label>
      {children}
      {error && <div style={{ fontSize: 12, color: "#e05252", marginTop: 5 }}>{error}</div>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", error, icon }) {
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
          border: `1.5px solid ${error ? "#e05252" : focused ? "#2d8a4e" : "#cde4d5"}`,
          background: focused ? "#f7fdf9" : "white",
          outline: "none", boxSizing: "border-box", color: "#0f2d1a",
          transition: "all 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(44,138,78,0.12)" : "none",
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
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

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
    nav("/dashboard");
  } catch (err) {
    setLoginError("Incorrect email or password. Please try again.");
    setLoading(false);
  }
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter") submit();
  };

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
        .login-card:hover { box-shadow: 0 32px 80px rgba(26,92,46,0.18) !important; }
        .social-btn:hover { background: #f2faf5 !important; border-color: #4caf73 !important; }
        .link-hover:hover { color: #1a5c2e !important; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #f2faf5 0%, #e0f2e9 50%, #c8e6d4 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px", position: "relative", overflow: "hidden",
      }}>

        {/* Background decorative elements */}
        <div style={{ position:"absolute",width:700,height:700,borderRadius:"50%",background:"linear-gradient(135deg,#2d8a4e,#1a5c2e)",top:-300,right:-250,opacity:0.06,pointerEvents:"none" }}/>
        <div style={{ position:"absolute",width:400,height:400,borderRadius:"50%",background:"#4caf73",bottom:-150,left:-100,opacity:0.07,pointerEvents:"none" }}/>

        {/* Floating leaves */}
        <div className="float-leaf" style={{ position:"absolute",top:"12%",left:"8%",fontSize:48,opacity:0.08,pointerEvents:"none",userSelect:"none" }}>🍃</div>
        <div className="float-leaf" style={{ position:"absolute",bottom:"15%",right:"7%",fontSize:64,opacity:0.06,pointerEvents:"none",userSelect:"none",animationDelay:"2s" }}>🌿</div>
        <div className="float-leaf" style={{ position:"absolute",top:"55%",left:"5%",fontSize:32,opacity:0.08,pointerEvents:"none",userSelect:"none",animationDelay:"4s" }}>🍃</div>

        <div style={{ width:"100%",maxWidth:480,position:"relative",zIndex:1 }}>

          {/* Logo */}
          <div className="fade-up-0" style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:36 }}>
            <div style={{ width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#2d8a4e,#1a5c2e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"0 6px 20px rgba(44,138,78,0.4)" }}>🌿</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:"#0f2d1a" }}>CinnaPredict</div>
              <div style={{ fontSize:10,color:"#7aaa8a",letterSpacing:"0.18em",textTransform:"uppercase" }}>Research System</div>
            </div>
          </div>

          {/* Card */}
          <div
            className="login-card"
            style={{
              background:"white",borderRadius:24,padding:"44px 44px 36px",
              boxShadow:"0 16px 56px rgba(26,92,46,0.12)",
              border:"1px solid rgba(44,138,78,0.1)",
              transition:"box-shadow 0.4s",
            }}
          >
            <div className="fade-up-1" style={{ marginBottom:32 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:"#0f2d1a",marginBottom:6 }}>Welcome back</h2>
              <p style={{ fontSize:14,color:"#7aaa8a" }}>Sign in to your plantation dashboard</p>
            </div>

            {/* Global error */}
            {loginError && (
              <div style={{ padding:"12px 16px",background:"#fff5f5",border:"1.5px solid #fca5a5",borderRadius:12,marginBottom:20,fontSize:13,color:"#e05252",display:"flex",alignItems:"center",gap:8 }}>
                ⚠️ {loginError}
              </div>
            )}

            <div className="fade-up-2">
              <Field label="Email Address" error={errors.email}>
                <TextInput
                  value={form.email} onChange={set("email")}
                  placeholder="kasun@example.com" type="email"
                  error={errors.email} icon="📧"
                />
              </Field>

              <Field label="Password" error={errors.password}>
                <div style={{ position:"relative" }}>
                  <TextInput
                    value={form.password} onChange={(e) => { set("password")(e); }}
                    placeholder="Enter your password"
                    type={showPass ? "text" : "password"}
                    error={errors.password} icon="🔒"
                  />
                  <button
                    onClick={() => setShowPass(s => !s)}
                    style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#5a8a6a",fontSize:17,lineHeight:1,padding:0 }}
                  >
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
              </Field>
            </div>

            <div className="fade-up-3" style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28 }}>
              <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:"#2a5c3a",fontWeight:500 }}>
                <input
                  type="checkbox" checked={form.remember} onChange={set("remember")}
                  style={{ accentColor:"#2d8a4e",width:15,height:15 }}
                />
                Remember me
              </label>
              <span
                onClick={() => nav("/forgot-password")}
                style={{ fontSize:13,color:"#2d8a4e",fontWeight:600,cursor:"pointer",textDecoration:"underline" }}
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
                  background: loading ? "#9cb8a8" : "linear-gradient(135deg,#2d8a4e,#1a5c2e)",
                  color:"white",fontSize:16,fontWeight:700,cursor:loading?"not-allowed":"pointer",
                  boxShadow:"0 6px 24px rgba(44,138,78,0.35)",
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
                <div style={{ flex:1,height:1,background:"#e0ede5" }}/>
                <span style={{ fontSize:12,color:"#9cb8a8",fontWeight:500 }}>or continue with</span>
                <div style={{ flex:1,height:1,background:"#e0ede5" }}/>
              </div>

              {/* Social buttons */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:28 }}>
                {[
                  { icon:"🔵", label:"Google" },
                  { icon:"🟦", label:"Microsoft" },
                ].map(({ icon, label }) => (
                  <button key={label} className="social-btn" style={{
                    padding:"12px",borderRadius:12,border:"1.5px solid #cde4d5",
                    background:"white",fontSize:14,fontWeight:600,color:"#2a5c3a",
                    cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                    transition:"all 0.2s",
                  }}>
                    <span style={{ fontSize:18 }}>{icon}</span> {label}
                  </button>
                ))}
              </div>

              <p style={{ textAlign:"center",fontSize:14,color:"#7aaa8a" }}>
                New to CinnaPredict?{" "}
                <span onClick={() => nav("/signup")} style={{ color:"#1a5c2e",fontWeight:700,cursor:"pointer",textDecoration:"underline" }}>
                  Create an account
                </span>
              </p>
            </div>
          </div>

          {/* Bottom note */}
          <p style={{ textAlign:"center",marginTop:24,fontSize:12,color:"#9cb8a8",lineHeight:1.6 }}>
            🔒 Your farm data is encrypted and never shared without consent.<br/>
            University Research Project · Sri Lanka
          </p>
        </div>
      </div>
    </>
  );
}