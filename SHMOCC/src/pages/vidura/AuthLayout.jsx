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