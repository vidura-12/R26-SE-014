import { useEffect, useState } from "react";

const images = [
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200",
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200",
  "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200",
];

export default function AuthLayout({ children }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((p) => (p + 1) % images.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root {
          width: 100%;
          height: 100%;
          font-family: 'DM Sans', sans-serif;
        }

        .auth-page {
          width: 100vw;
          height: 100vh;
          background: #e6ebe7;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .auth-card {
          display: flex;
          width: min(1020px, calc(100vw - 48px));
          height: min(640px, calc(100vh - 48px));
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 30px 80px rgba(0,0,0,0.15),
            0 4px 16px rgba(0,0,0,0.06);
          background: white;
        }

        /* ── LEFT ── */
        .auth-left {
          flex: 0 0 42%;
          position: relative;
          overflow: hidden;
          min-width: 0;
        }

        .auth-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          transition: opacity 1s ease;
        }
        .auth-img.hidden { opacity: 0; }

        .auth-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            165deg,
            rgba(8,22,14,0.35) 0%,
            rgba(8,22,14,0.82) 100%
          );
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 36px 38px;
        }

        .auth-brand {
          display: flex; align-items: center; gap: 9px;
        }
        .auth-brand-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: #e8956a;
          box-shadow: 0 0 10px rgba(232,149,106,0.85);
          flex-shrink: 0;
        }
        .auth-brand-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 1.05rem;
          color: white; letter-spacing: -0.01em;
        }

        .auth-bottom { }
        .auth-tagline {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: clamp(1.2rem, 2.2vw, 1.6rem);
          color: white; line-height: 1.25;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .auth-tagline-sub {
          font-size: 0.88rem; font-weight: 300;
          color: rgba(255,255,255,0.55);
          margin-bottom: 22px;
        }

        .auth-dots { display: flex; gap: 7px; align-items: center; }
        .auth-dot {
          height: 7px; border-radius: 4px;
          width: 7px;
          background: rgba(255,255,255,0.35);
          cursor: pointer; border: none; padding: 0;
          transition: all 0.3s ease;
        }
        .auth-dot.active {
          background: white; width: 22px;
          box-shadow: 0 0 6px rgba(255,255,255,0.5);
        }

        /* ── RIGHT ── */
        .auth-right {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px clamp(28px, 5vw, 64px);
          background: white;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .auth-right::-webkit-scrollbar { display: none; }

        @media (max-width: 600px) {
          .auth-left { display: none; }
          .auth-card { width: calc(100vw - 32px); height: auto; min-height: min(580px, calc(100vh - 32px)); }
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-card">

          {/* LEFT */}
          <div className="auth-left">
            {images.map((src, i) => (
              <img
                key={src}
                src={src}
                className={`auth-img${i !== index ? " hidden" : ""}`}
                alt="farm"
              />
            ))}
            <div className="auth-overlay">
              <div className="auth-brand">
               
              </div>
              <div className="auth-bottom">
                <p className="auth-tagline">Smart Cinnamon
<br />Health Monitoring</p>
                <p className="auth-tagline-sub">Powered by AI &amp; Satellite</p>
                <div className="auth-dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={`auth-dot${i === index ? " active" : ""}`}
                      onClick={() => setIndex(i)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="auth-right">
            {children}
          </div>

        </div>
      </div>
    </>
  );
}