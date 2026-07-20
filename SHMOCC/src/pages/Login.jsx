import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this line
import axios from "axios";
import AuthLayout from "./AuthLayout";

export default function Login() {
  const [data, setData] = useState({ username: "", passwordHash: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post("https://localhost:44331/api/auth/login", data);

      console.log("API Response:", res.data); 
  
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId); 
      localStorage.setItem("userName", res.data.user); 
      
      alert("Welcome " + res.data.user); 
      navigate("/dashboard"); 
      
    } catch (err) {
      alert(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthLayout>
      <style>{formStyles}</style>

      <div className="fg-panel">
        <div className="fg-heading">
          <h2 className="fg-title">Welcome back</h2>
          <p className="fg-subtitle">
            Monitor your farmland with satellite intelligence.
          </p>
        </div>

        <div className="fg-form">

          {/* EMAIL */}
          <div className="fg-input-line">
            <MailIcon />
            <input
              type="text"
              placeholder="Email ID"
              value={data.username}
              onChange={(e) =>
                setData({ ...data, username: e.target.value })
              }
            />
          </div>

          {/* PASSWORD */}
          <div className="fg-input-line">
            <LockIcon />
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={data.passwordHash}
              onChange={(e) =>
                setData({ ...data, passwordHash: e.target.value })
              }
            />

            <button
              className="fg-eye"
              onClick={() => setShowPass((v) => !v)}
              type="button"
            >
              {showPass ? <EyeOff /> : <EyeOn />}
            </button>
          </div>

          <button className="fg-btn" onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="fg-divider">
            <span className="fg-divider-line" />
            <span className="fg-divider-text">or</span>
            <span className="fg-divider-line" />
          </div>

          <button className="fg-google-btn">
            <GoogleIcon /> Continue with Google
          </button>
        </div>

        <p className="fg-footer">
          Don't have an account?{" "}
          <a href="/signup" className="fg-link">
            Sign up
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}

/* ICONS */

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16v16H4z" />
    <path d="M4 4l8 8 8-8" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const EyeOn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 48 48">
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.5-1.45-.79-3-.79-4.59s.29-3.14.79-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.89C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
  </svg>
);

export const formStyles = `
.fg-panel {
  width: 100%;
  max-width: 340px;
}

.fg-heading {
  margin-bottom: 30px;
}

.fg-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a4028;
}

.fg-subtitle {
  font-size: 0.85rem;
  color: #6b7280;
}

.fg-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.fg-input-line {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1.5px solid #cbd5d1;
  padding: 10px 4px;
  position: relative;
}

.fg-input-line:focus-within {
  border-bottom: 2px solid #22c55e;
}

.fg-input-line input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.95rem; /* Slightly larger for readability */
  background: transparent;
  color: #1f2937; /* Add this: Dark gray/black color */
}

/* Also ensure the placeholder is visible but distinct */
.fg-input-line input::placeholder {
  color: #9ca3af;
}
.fg-input-line svg {
  width: 18px;
  height: 18px;
  color: #64748b;
}

.fg-eye {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
}

/* BUTTON */
.fg-btn {
  padding: 12px;
  border: none;
  background: #1a4028;
  color: white;
  border-radius: 8px;
  cursor: pointer;
}

/* DIVIDER */
.fg-divider {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fg-divider-line {
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.fg-divider-text {
  font-size: 0.75rem;
  color: #9ca3af;
}

.fg-google-btn {
  padding: 10px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  color: #64748b;
}


/* FOOTER */
.fg-footer {
  text-align: center;
  font-size: 0.8rem;
}

.fg-link {
  color: #f97316;
}
`;