import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import Spinner from '../../components/Spinner'
import heroImg from '../../assets/image-1.jpg'
import spicesHeroImg from '../../assets/image-2.jpg'
import cinnamonFarmImg from '../../assets/image-3.jpg'
import logoImg from '../../assets/logo.png'

const images = [heroImg, spicesHeroImg, cinnamonFarmImg]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; height: 100%; font-family: 'DM Sans', sans-serif; }

  .auth-page {
    width: 100vw; height: 100vh;
    background: #e6ebe7;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .auth-card {
    display: flex;
    width: min(1020px, calc(100vw - 48px));
    height: min(640px, calc(100vh - 48px));
    border-radius: 20px; overflow: hidden;
    box-shadow: 0 30px 80px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.06);
    background: white;
  }
  .auth-left {
    flex: 0 0 42%; position: relative; overflow: hidden; min-width: 0;
  }
  .auth-img {
    position: absolute; inset: 0;
    width: 100%; height: 100%; object-fit: cover;
    transition: opacity 1s ease;
  }
  .auth-img.hidden { opacity: 0; }
  .auth-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(165deg, rgba(8,22,14,0.35) 0%, rgba(8,22,14,0.82) 100%);
    display: flex; flex-direction: column;
    justify-content: space-between; padding: 36px 38px;
  }
  .auth-brand { display: flex; align-items: center; gap: 9px; }
  .auth-brand-logo {
    width: 20px; height: 20px; object-fit: contain; flex-shrink: 0;
    filter: brightness(0) saturate(100%) invert(65%) sepia(60%) saturate(600%) hue-rotate(340deg) brightness(105%);
  }
  .auth-brand-name {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.05rem;
    color: white; letter-spacing: -0.01em;
  }
  .auth-tagline {
    font-family: 'Syne', sans-serif; font-weight: 700;
    font-size: clamp(1.2rem, 2.2vw, 1.6rem);
    color: white; line-height: 1.25; letter-spacing: -0.02em; margin-bottom: 6px;
  }
  .auth-tagline-sub {
    font-size: 0.88rem; font-weight: 300;
    color: rgba(255,255,255,0.55); margin-bottom: 22px;
  }
  .auth-dots { display: flex; gap: 7px; align-items: center; }
  .auth-dot {
    height: 7px; border-radius: 4px; width: 7px;
    background: rgba(255,255,255,0.35);
    cursor: pointer; border: none; padding: 0; transition: all 0.3s ease;
  }
  .auth-dot.active { background: white; width: 22px; box-shadow: 0 0 6px rgba(255,255,255,0.5); }

  .auth-right {
    flex: 1; min-width: 0;
    display: flex; align-items: center; justify-content: center;
    padding: 40px clamp(28px, 5vw, 64px);
    background: white; overflow-y: auto; scrollbar-width: none;
  }
  .auth-right::-webkit-scrollbar { display: none; }

  .fg-panel { width: 100%; max-width: 340px; }
  .fg-heading { margin-bottom: 30px; }
  .fg-title { font-family: 'Syne', sans-serif; font-size: 1.8rem; font-weight: 700; color: #1a4028; }
  .fg-subtitle { font-size: 0.85rem; color: #6b7280; margin-top: 4px; }

  .fg-form { display: flex; flex-direction: column; gap: 20px; }

  .fg-input-line {
    display: flex; align-items: center; gap: 10px;
    border-bottom: 1.5px solid #cbd5d1; padding: 10px 4px;
    position: relative; transition: border-color 0.2s;
  }
  .fg-input-line:focus-within { border-bottom: 2px solid #3a9460; }
  .fg-input-line svg { width: 18px; height: 18px; color: #64748b; flex-shrink: 0; }
  .fg-input-line input {
    border: none; outline: none; width: 100%;
    font-size: 0.95rem; background: transparent;
    color: #1f2937; font-family: 'DM Sans', sans-serif;
  }
  .fg-input-line input::placeholder { color: #9ca3af; }
  .fg-eye { background: none; border: none; cursor: pointer; color: #64748b; padding: 0; }

  .fg-btn {
    padding: 12px; border: none; background: #1a4028; color: white;
    border-radius: 8px; cursor: pointer; font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 0.88rem; transition: background 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .fg-btn:hover { background: #3a9460; }
  .fg-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .fg-divider { display: flex; align-items: center; gap: 10px; }
  .fg-divider-line { flex: 1; height: 1px; background: #e5e7eb; }
  .fg-divider-text { font-size: 0.75rem; color: #9ca3af; }

  .fg-footer { text-align: center; font-size: 0.8rem; color: #6b7280; margin-top: 24px; }
  .fg-link { color: #c8773a; font-weight: 600; text-decoration: none; }
  .fg-link:hover { text-decoration: underline; }

  @media (max-width: 600px) {
    .auth-left { display: none; }
    .auth-card { width: calc(100vw - 32px); height: auto; min-height: min(580px, calc(100vh - 32px)); }
  }
`

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setImgIndex(p => (p + 1) % images.length), 4500)
    return () => clearInterval(id)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      if (user.role === 'ADMIN') navigate('/admin')
      else if (user.role === 'FARMER') navigate('/farmer')
      else navigate('/peeler')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="auth-page">
        <div className="auth-card">

          {/* Left panel */}
          <div className="auth-left">
            {images.map((src, i) => (
              <img key={src} src={src} className={`auth-img${i !== imgIndex ? ' hidden' : ''}`} alt="farm" />
            ))}
            <div className="auth-overlay">
              <div className="auth-brand">
                <img src={logoImg} alt="logo" className="auth-brand-logo" />
                <span className="auth-brand-name">Cinnomon</span>
              </div>
              <div>
                <p className="auth-tagline">AI-Powered<br />Harvest Scheduling</p>
                <p className="auth-tagline-sub">Powered by Genetic Algorithms</p>
                <div className="auth-dots">
                  {images.map((_, i) => (
                    <button key={i} className={`auth-dot${i === imgIndex ? ' active' : ''}`} onClick={() => setImgIndex(i)} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="auth-right">
            <div className="fg-panel">
              <div className="fg-heading">
                <h2 className="fg-title">Welcome back</h2>
                <p className="fg-subtitle">Sign in to your Cinnomon account.</p>
              </div>

              <form className="fg-form" onSubmit={handleSubmit}>
                {/* Email */}
                <div className="fg-input-line">
                  <MailIcon />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                {/* Password */}
                <div className="fg-input-line">
                  <LockIcon />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" className="fg-eye" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>

                <button type="submit" className="fg-btn" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : null}
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p className="fg-footer">
                Don't have an account? <Link to="/register" className="fg-link">Create one</Link>
              </p>

            </div>
          </div>

        </div>
      </div>
    </>
  )
}

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16v16H4z" /><path d="M4 4l8 8 8-8" />
  </svg>
)
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
)
const EyeOn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)
