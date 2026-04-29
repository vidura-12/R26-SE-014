import { useState } from "react";
import axios from "axios";
import AuthLayout from "./AuthLayout";
import { formStyles } from "./Login";

/** * 1. FIXED: Component defined OUTSIDE to prevent focus loss 
 * 2. STYLING: Uses 'fg-input-line' to match Login 
 */
const InputField = ({ icon: Icon, placeholder, value, onChange, type = "text" }) => (
  <div className="fg-input-line">
    {Icon && <Icon />}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      autoComplete="off"
    />
  </div>
);

export default function Signup() {
  const [data, setData] = useState({
    username: "",
    email: "",
    passwordHash: "",
    confirmPassword: "",
    phone: "",
    address: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (data.passwordHash !== data.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("https://localhost:44331/api/auth/signup", data);
      alert("Account created successfully!");
    } catch (err) {
      alert(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <style>{formStyles}</style>
      
      <div className="fg-panel" style={{ maxWidth: 400 }}>
        <div className="fg-heading">
          <h2 className="fg-title">Create account</h2>
          <p className="fg-subtitle">Join the Cinnamon Intelligence Framework.</p>
        </div>

        <div className="fg-form">
          {/* USERNAME & PHONE ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <InputField 
              icon={UserIcon} 
              placeholder="Username" 
              value={data.username}
              onChange={(e) => setData({ ...data, username: e.target.value })} 
            />
            <InputField 
              icon={PhoneIcon} 
              placeholder="Phone" 
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })} 
            />
          </div>

          {/* EMAIL */}
          <InputField 
            icon={MailIcon} 
            placeholder="Email ID" 
            type="email" 
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })} 
          />

          {/* ADDRESS */}
          <InputField 
            icon={MapIcon} 
            placeholder="Farm Address" 
            value={data.address}
            onChange={(e) => setData({ ...data, address: e.target.value })} 
          />

          {/* PASSWORD */}
          <div className="fg-input-line">
            <LockIcon />
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={data.passwordHash}
              onChange={(e) => setData({ ...data, passwordHash: e.target.value })}
            />
            <button className="fg-eye" onClick={() => setShowPass(!showPass)} type="button">
              {showPass ? <EyeOff /> : <EyeOn />}
            </button>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="fg-input-line">
            <LockIcon />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              value={data.confirmPassword}
              onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
            />
            <button className="fg-eye" onClick={() => setShowConfirm(!showConfirm)} type="button">
              {showConfirm ? <EyeOff /> : <EyeOn />}
            </button>
          </div>

          <button className="fg-btn" onClick={handleSignup} disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <div className="fg-divider">
            <span className="fg-divider-line" />
            <span className="fg-divider-text">or</span>
            <span className="fg-divider-line" />
          </div>

          <button className="fg-google-btn" type="button">
            <GoogleIcon /> Continue with Google
          </button>
        </div>

        <p className="fg-footer">
          Already have an account? <a href="/login" className="fg-link">Sign in</a>
        </p>
      </div>
    </AuthLayout>
  );
}

/* --- ICONS --- */

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const MailIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M4 4h16v16H4zM4 4l8 8 8-8"/></svg>;
const LockIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const EyeOn = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 48 48">
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="#FBBC05" d="M10.53 28.59c-.5-1.45-.79-3-.79-4.59s.29-3.14.79-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.89C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
  </svg>
);