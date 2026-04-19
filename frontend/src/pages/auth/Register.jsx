import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api'
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
    width: 100vw; min-height: 100vh;
    background: #e6ebe7;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; padding: 24px;
  }
  .auth-card {
    display: flex;
    width: min(1020px, 100%);
    min-height: min(680px, calc(100vh - 48px));
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

  .fg-panel { width: 100%; max-width: 400px; }
  .fg-heading { margin-bottom: 26px; }
  .fg-title { font-family: 'Syne', sans-serif; font-size: 1.8rem; font-weight: 700; color: #1a4028; }
  .fg-subtitle { font-size: 0.85rem; color: #6b7280; margin-top: 4px; }

  .fg-form { display: flex; flex-direction: column; gap: 18px; }

  .fg-input-line {
    display: flex; align-items: center; gap: 10px;
    border-bottom: 1.5px solid #cbd5d1; padding: 10px 4px;
    position: relative; transition: border-color 0.2s;
  }
  .fg-input-line:focus-within { border-bottom: 2px solid #3a9460; }
  .fg-input-line svg { width: 18px; height: 18px; color: #64748b; flex-shrink: 0; }
  .fg-input-line input,
  .fg-input-line select {
    border: none; outline: none; width: 100%;
    font-size: 0.95rem; background: transparent;
    color: #1f2937; font-family: 'DM Sans', sans-serif;
    appearance: none;
  }
  .fg-input-line input::placeholder { color: #9ca3af; }
  .fg-input-line.error { border-bottom: 2px solid #e05a4a; }
  .fg-eye { background: none; border: none; cursor: pointer; color: #64748b; padding: 0; }

  .fg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .fg-btn {
    padding: 12px; border: none; background: #1a4028; color: white;
    border-radius: 8px; cursor: pointer; font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 0.88rem; transition: background 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .fg-btn:hover { background: #3a9460; }
  .fg-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .fg-error { font-size: 0.72rem; color: #e05a4a; margin-top: 4px; }

  .fg-footer { text-align: center; font-size: 0.8rem; color: #6b7280; margin-top: 22px; }
  .fg-link { color: #c8773a; font-weight: 600; text-decoration: none; }
  .fg-link:hover { text-decoration: underline; }

  @media (max-width: 600px) {
    .auth-left { display: none; }
    .auth-card { width: 100%; height: auto; }
    .fg-row { grid-template-columns: 1fr; }
  }
`

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'FARMER' })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setImgIndex(p => (p + 1) % images.length), 4500)
    return () => clearInterval(id)
  }, [])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authApi.register(form)
      toast.success('Account created! Please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const pwMismatch = confirmPassword && form.password !== confirmPassword

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
                <p className="auth-tagline">Join the Ceylon<br />Cinnamon Platform</p>
                <p className="auth-tagline-sub">Smart Harvest Scheduling</p>
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
                <h2 className="fg-title">Create account</h2>
                <p className="fg-subtitle">Join the Cinnomon platform.</p>
              </div>

              <form className="fg-form" onSubmit={handleSubmit}>
                {/* Name + Phone row */}
                <div className="fg-row">
                  <div className="fg-input-line">
                    <UserIcon />
                    <input type="text" placeholder="Full name" value={form.name} onChange={set('name')} required />
                  </div>
                  <div className="fg-input-line">
                    <PhoneIcon />
                    <input type="tel" placeholder="Phone" value={form.phone} onChange={set('phone')} />
                  </div>
                </div>

                {/* Email */}
                <div className="fg-input-line">
                  <MailIcon />
                  <input type="email" placeholder="Email address" value={form.email} onChange={set('email')} required />
                </div>

                {/* Role */}
                <div className="fg-input-line">
                  <RoleIcon />
                  <select value={form.role} onChange={set('role')}>
                    <option value="FARMER">Farmer</option>
                    <option value="PEELER">Peeler Group</option>
                  </select>
                </div>

                {/* Password */}
                <div className="fg-input-line">
                  <LockIcon />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password (min. 6 chars)"
                    value={form.password}
                    onChange={set('password')}
                    autoComplete="new-password"
                    required minLength={6}
                  />
                  <button type="button" className="fg-eye" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>

                {/* Confirm password */}
                <div>
                  <div className={`fg-input-line${pwMismatch ? ' error' : ''}`}>
                    <LockIcon />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required minLength={6}
                    />
                    <button type="button" className="fg-eye" onClick={() => setShowConfirm(v => !v)}>
                      {showConfirm ? <EyeOff /> : <EyeOn />}
                    </button>
                  </div>
                  {pwMismatch && <div className="fg-error">Passwords do not match</div>}
                </div>

                <button type="submit" className="fg-btn" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : null}
                  {loading ? 'Creating…' : 'Create Account'}
                </button>
              </form>

              <p className="fg-footer">
                Already have an account? <Link to="/login" className="fg-link">Sign in</Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

const UserIcon  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const PhoneIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
const MailIcon  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M4 4h16v16H4z"/><path d="M4 4l8 8 8-8"/></svg>
const LockIcon  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const RoleIcon  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const EyeOn     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const EyeOff    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
