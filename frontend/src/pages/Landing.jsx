import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

// ─── Floating particle background ───────────────────────────────────────────
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full opacity-10 bg-amber-300"
          style={{
            width: `${Math.random() * 80 + 20}px`,
            height: `${Math.random() * 80 + 20}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 12 + 8}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 8}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 20);
        obs.disconnect();
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Feature card ────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div
      className="group relative bg-white/5 backdrop-blur-sm border border-amber-700/20 rounded-2xl p-6 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-500 hover:-translate-y-1"
      style={{ animationDelay: delay }}
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="font-semibold text-amber-100 text-lg mb-2">{title}</h3>
      <p className="text-amber-200/60 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Navbar({ nav }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? "bg-stone-950/80 backdrop-blur-md shadow-xl border-b border-amber-800/20" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-700/30">
            <span className="text-lg">🌿</span>
          </div>
          <div>
            <span className="font-bold text-amber-100 tracking-wide text-sm">CinnaPredict</span>
            <span className="block text-amber-400/60 text-xs tracking-widest uppercase">Research System</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-amber-200/70">
          <a href="#features" className="hover:text-amber-300 transition-colors">Features</a>
          <a href="#about" className="hover:text-amber-300 transition-colors">About</a>
          <a href="#research" className="hover:text-amber-300 transition-colors">Research</a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav("/login")}
            className="text-sm text-amber-200/80 hover:text-amber-100 transition-colors px-4 py-2"
          >
            Sign In
          </button>
          <button
            onClick={() => nav("/signup")}
            className="text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold px-5 py-2 rounded-full transition-all duration-300 shadow-lg shadow-amber-600/30 hover:shadow-amber-500/50 hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Main Landing ─────────────────────────────────────────────────────────────
export default function Landing() {
  const nav = useNavigate();

  const features = [
    { icon: "🧠", title: "AI-Powered Prediction", desc: "Machine learning models trained on Ceylon cinnamon datasets to forecast disease risk with high accuracy.", delay: "0ms" },
    { icon: "🌡️", title: "Climate Analysis", desc: "Real-time integration of temperature, humidity, and rainfall data to assess environmental stress factors.", delay: "80ms" },
    { icon: "🍃", title: "Disease Detection", desc: "Early identification of leaf spot, canker, and other fungal threats before visible symptoms appear.", delay: "160ms" },
    { icon: "📊", title: "Risk Dashboard", desc: "Intuitive visual dashboards displaying risk scores, trend graphs, and regional heatmaps.", delay: "240ms" },
    { icon: "📍", title: "Geo-Mapping", desc: "Plot plantation zones and get location-specific advisory reports for precision farming decisions.", delay: "320ms" },
    { icon: "📋", title: "Research Reports", desc: "Auto-generated PDF reports compatible with academic standards for research documentation.", delay: "400ms" },
  ];

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { font-family: 'DM Sans', sans-serif; }
        h1, h2, .serif { font-family: 'Playfair Display', serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .fade-up { animation: fadeUp 0.8s ease both; }
        .fade-up-1 { animation: fadeUp 0.8s 0.15s ease both; }
        .fade-up-2 { animation: fadeUp 0.8s 0.30s ease both; }
        .fade-up-3 { animation: fadeUp 0.8s 0.50s ease both; }
        .shimmer-text {
          background: linear-gradient(90deg, #f59e0b, #fcd34d, #f59e0b, #d97706);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .grain::after {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 100; opacity: 0.4;
        }
        .img-fade { mask-image: linear-gradient(to bottom, black 60%, transparent 100%); }
        .card-glow:hover { box-shadow: 0 0 40px rgba(217, 119, 6, 0.15); }
      `}</style>

      <div className="grain bg-stone-950 min-h-screen text-stone-100 overflow-x-hidden">
        <Navbar nav={nav} />

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          {/* Background image collage */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1600&q=80"
              alt="Cinnamon plantation"
              className="w-full h-full object-cover opacity-20 img-fade"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-stone-950/90 to-amber-950/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/60" />
          </div>

          <Particles />

          {/* Decorative ring */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-amber-600/10 translate-x-1/3" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-amber-600/10 translate-x-1/4" />

          <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20 grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div>
              <div className="fade-up inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-amber-400 text-xs font-medium tracking-widest uppercase mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Research Project · University of Sri Lanka
              </div>

              <h1 className="fade-up-1 text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-6">
                <span className="text-amber-50">Ceylon</span><br />
                <span className="shimmer-text">Cinnamon</span><br />
                <span className="text-amber-50/80 text-4xl md:text-5xl">Risk Prediction</span>
              </h1>

              <p className="fade-up-2 text-amber-200/60 text-lg leading-relaxed mb-10 max-w-lg">
                An intelligent advisory platform leveraging machine learning and climate data to predict disease risk in <em>Cinnamomum verum</em> plantations — empowering farmers and researchers with precision insights.
              </p>

              <div className="fade-up-3 flex flex-wrap gap-4">
                <button
                  onClick={() => nav("/signup")}
                  className="group flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-2xl shadow-amber-600/40 hover:shadow-amber-500/60 hover:scale-105"
                >
                  Launch Dashboard
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                <button
                  onClick={() => nav("/login")}
                  className="flex items-center gap-2 border border-amber-700/40 hover:border-amber-500/60 text-amber-200/80 hover:text-amber-100 px-8 py-4 rounded-full transition-all duration-300 hover:bg-amber-900/20"
                >
                  Sign In
                </button>
              </div>
            </div>

            {/* Right: image mosaic */}
            <div className="hidden lg:grid grid-cols-2 gap-4 fade-up-2">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-amber-800/20 h-48">
                  <img src="https://images.unsplash.com/photo-1561199866-47b8f0aaa7b6?w=600&q=80" alt="Cinnamon sticks" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="rounded-2xl overflow-hidden border border-amber-800/20 h-36">
                  <img src="https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?w=600&q=80" alt="Cinnamon spice" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="rounded-2xl overflow-hidden border border-amber-800/20 h-36">
                  <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80" alt="Cinnamon plantation" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="rounded-2xl overflow-hidden border border-amber-800/20 h-48">
                  <img src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80" alt="Tropical farm" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-amber-400/40 text-xs">
            <span className="tracking-widest uppercase">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-amber-400/40 to-transparent animate-pulse" />
          </div>
        </section>

        {/* ══ STATS BAR ═════════════════════════════════════════════════════ */}
        <section className="border-y border-amber-800/20 bg-amber-950/20 backdrop-blur-sm" id="about">
          <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: 94, suffix: "%", label: "Prediction Accuracy" },
              { val: 12, suffix: "+", label: "Disease Classes" },
              { val: 5000, suffix: "+", label: "Training Samples" },
              { val: 3, suffix: " Zones", label: "Sri Lanka Regions" },
            ].map(({ val, suffix, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-3xl md:text-4xl font-black text-amber-400 serif">
                  <Counter target={val} suffix={suffix} />
                </span>
                <span className="text-amber-200/50 text-xs mt-1 tracking-wide uppercase">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══ ABOUT / RESEARCH CONTEXT ══════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center" id="research">
          <div className="relative">
            <div className="rounded-3xl overflow-hidden border border-amber-800/20 shadow-2xl shadow-amber-950/50">
              <img
                src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=900&q=80"
                alt="Cinnamon field Sri Lanka"
                className="w-full h-80 object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 rounded-2xl overflow-hidden border-4 border-stone-950 w-40 h-40 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1561199866-47b8f0aaa7b6?w=400&q=80"
                alt="Cinnamon harvest"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -top-4 -left-4 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-4 shadow-xl shadow-amber-800/40">
              <div className="text-stone-950 font-black text-2xl serif">A+</div>
              <div className="text-stone-950/70 text-xs font-semibold">Risk Grade</div>
            </div>
          </div>

          <div>
            <p className="text-amber-500 text-xs tracking-widest uppercase font-semibold mb-4">Research Background</p>
            <h2 className="serif text-4xl font-bold text-amber-50 leading-tight mb-6">
              Protecting Sri Lanka's Most Valuable Spice
            </h2>
            <p className="text-amber-200/60 leading-relaxed mb-5">
              Ceylon cinnamon (<em>Cinnamomum verum</em>) is Sri Lanka's most iconic export crop, contributing over $200M annually. However, unpredictable disease outbreaks driven by climate variability pose a significant threat to yield quality and farmer livelihoods.
            </p>
            <p className="text-amber-200/60 leading-relaxed mb-8">
              This system integrates IoT sensor data, satellite weather feeds, and a Random Forest + LSTM hybrid model to deliver early-warning disease risk scores at the plantation level, enabling timely, data-driven interventions.
            </p>
            <div className="flex flex-wrap gap-3">
              {["Random Forest", "LSTM Neural Net", "Climate API", "Geo-Spatial Mapping"].map(tag => (
                <span key={tag} className="text-xs px-3 py-1.5 rounded-full border border-amber-700/30 text-amber-300/70 bg-amber-900/20">{tag}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURES ══════════════════════════════════════════════════════ */}
        <section className="py-24 bg-gradient-to-b from-transparent to-amber-950/10" id="features">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-amber-500 text-xs tracking-widest uppercase font-semibold mb-4">Platform Capabilities</p>
              <h2 className="serif text-4xl md:text-5xl font-bold text-amber-50">Built for Precision Agriculture</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map(f => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ══════════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-amber-500 text-xs tracking-widest uppercase font-semibold mb-4">Workflow</p>
            <h2 className="serif text-4xl font-bold text-amber-50">How It Works</h2>
          </div>
          <div className="relative">
            {/* Line */}
            <div className="absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent hidden md:block" />
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: "01", icon: "📡", title: "Data Ingestion", desc: "Climate sensors and satellite weather feeds push real-time data." },
                { step: "02", icon: "⚙️", title: "Preprocessing", desc: "Normalization, feature engineering, and anomaly filtering." },
                { step: "03", icon: "🔮", title: "AI Prediction", desc: "Hybrid ML model scores disease probability by zone." },
                { step: "04", icon: "📬", title: "Advisory Alert", desc: "Farmers receive actionable risk reports and recommendations." },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="flex flex-col items-center text-center group">
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-800/40 to-amber-900/20 border border-amber-700/30 flex items-center justify-center mb-4 group-hover:border-amber-500/50 transition-all duration-300 group-hover:scale-110">
                    <span className="text-2xl">{icon}</span>
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-600 text-stone-950 text-[9px] font-black flex items-center justify-center">{step}</span>
                  </div>
                  <h3 className="font-semibold text-amber-100 mb-2">{title}</h3>
                  <p className="text-amber-200/50 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="relative rounded-3xl overflow-hidden border border-amber-700/20 bg-gradient-to-br from-amber-900/30 to-stone-900/60 p-12 md:p-20 text-center">
            <div className="absolute inset-0">
              <img src="https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?w=1400&q=60" alt="" className="w-full h-full object-cover opacity-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-stone-950/80 to-amber-950/60" />
            </div>
            <div className="relative">
              <h2 className="serif text-4xl md:text-5xl font-bold text-amber-50 mb-6 leading-tight">
                Ready to Monitor Your<br />Cinnamon Plantation?
              </h2>
              <p className="text-amber-200/60 text-lg mb-10 max-w-xl mx-auto">
                Join researchers and agronomists using CinnaPredict to safeguard crop health and advance precision agriculture in Sri Lanka.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => nav("/signup")}
                  className="group flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold px-10 py-4 rounded-full transition-all duration-300 shadow-2xl shadow-amber-600/40 hover:scale-105 text-lg"
                >
                  Create Free Account
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                <button
                  onClick={() => nav("/login")}
                  className="border border-amber-600/40 hover:border-amber-500 text-amber-200 hover:text-amber-100 px-10 py-4 rounded-full transition-all duration-300 text-lg hover:bg-amber-900/20"
                >
                  Existing User? Sign In
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
        <footer className="border-t border-amber-900/30 py-10">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-amber-200/30 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌿</span>
              <span className="font-semibold text-amber-200/50">CinnaPredict</span>
              <span>· Research System</span>
            </div>
            <p>© {new Date().getFullYear()} · Department of Agriculture · University Research Project</p>
            <p>Built with React · Vite · Tailwind CSS</p>
          </div>
        </footer>
      </div>
    </>
  );
}