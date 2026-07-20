import { useEffect, useRef, useState } from "react";
import farmImage from '../assets/farm-map.png';
import farmImage1 from '../assets/intro-web.png';
import farmImage2 from '../assets/original-18c9e8267fd4dd01aa0c1dbd6c8b9b09.png';
const style = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --white:       #ffffff;
    --off-white:   #f8faf7;
    --cinnamon:    #c8773a;
    --cinnamon-lt: #e8956a;
    --cinnamon-bg: #fdf3ec;
    --green-dark:  #1a4028;
    --green-mid:   #2d6a45;
    --green:       #3a9460;
    --green-lt:    #5bb87e;
    --green-pale:  #d4edd9;
    --mint:        #e8f5ec;
    --text:        #1a2e20;
    --text-mid:    #3d5c47;
    --text-soft:   #7a9882;
    --border:      rgba(58,148,96,0.14);
  }

  html { scroll-behavior: smooth; }

  body, #root {
    font-family: 'DM Sans', sans-serif;
    background: var(--white);
    color: var(--text);
    overflow-x: hidden;
    width: 100%;
    margin: 0;
    padding: 0;
  }

  /* ── NAV ── */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 60px;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .nav-logo {
    display: flex; align-items: center; gap: 9px;
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.1rem;
    color: var(--green-dark);
  }
  .nav-logo-dot {
    width: 9px; height: 9px; border-radius: 50%;
    background: var(--cinnamon);
    box-shadow: 0 0 10px rgba(200,119,58,0.5);
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.5)} }
  .nav-links { display: flex; gap: 36px; list-style: none; }
  .nav-links a { font-size: 0.87rem; font-weight: 500; color: var(--text-mid); text-decoration: none; transition: color .2s; }
  .nav-links a:hover { color: var(--green); }
  .nav-cta {
    padding: 10px 26px; border-radius: 100px;
    background: var(--green-dark); color: white;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.84rem;
    text-decoration: none; transition: all .22s;
  }
  .nav-cta:hover { background: var(--green); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(42,106,69,0.3); }

  /* ── HERO ── */
  .hero {
    width: 100%; min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
    padding: 130px 60px 80px; text-align: center;
    background: var(--white);
  }
  .hero-blob1 {
    position: absolute; width: 700px; height: 700px; border-radius: 50%;
    background: radial-gradient(circle, rgba(91,184,126,0.1) 0%, transparent 70%);
    top: -200px; right: -180px; z-index: 0; pointer-events: none;
  }
  .hero-blob2 {
    position: absolute; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(200,119,58,0.07) 0%, transparent 70%);
    bottom: -80px; left: -120px; z-index: 0; pointer-events: none;
  }
  .hero-grid {
    position: absolute; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(58,148,96,0.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(58,148,96,0.055) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 85% 85% at 50% 50%, black 20%, transparent 75%);
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--cinnamon-bg); border: 1px solid rgba(200,119,58,0.3);
    border-radius: 100px; padding: 7px 18px;
    font-size: 0.75rem; font-weight: 600; color: var(--cinnamon);
    letter-spacing: 0.07em; text-transform: uppercase;
    margin-bottom: 30px; position: relative; z-index: 1;
  }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cinnamon); animation: pulse 1.5s ease infinite; }
  .hero h1 {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: clamp(3rem, 7vw, 6rem); line-height: 1.0;
    letter-spacing: -0.03em; position: relative; z-index: 1;
    max-width: 900px; color: var(--green-dark);
  }
  .hero h1 .line2 { color: var(--green); display: block; }
  .hero h1 .cinn { color: var(--cinnamon); }
  .hero-sub {
    margin-top: 26px; font-size: 1.02rem; font-weight: 300;
    color: var(--text-mid); max-width: 500px; line-height: 1.78;
    position: relative; z-index: 1;
  }
  .hero-actions {
    margin-top: 40px; display: flex; gap: 13px; align-items: center;
    position: relative; z-index: 1; flex-wrap: wrap; justify-content: center;
  }
  .btn-primary {
    padding: 14px 34px; border-radius: 100px;
    background: var(--green-dark); color: white;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.88rem;
    text-decoration: none; transition: all .25s;
    box-shadow: 0 4px 20px rgba(26,64,40,0.22);
  }
  .btn-primary:hover { background: var(--green); transform: translateY(-2px); box-shadow: 0 10px 28px rgba(26,64,40,0.28); }
  .btn-cinn {
    padding: 14px 30px; border-radius: 100px;
    background: var(--cinnamon-bg); color: var(--cinnamon);
    border: 1px solid rgba(200,119,58,0.32);
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.88rem;
    text-decoration: none; transition: all .25s;
  }
  .btn-cinn:hover { background: var(--cinnamon); color: white; transform: translateY(-2px); }

  /* hero image trio */
  .hero-img-row {
    position: relative; z-index: 1;
    margin-top: 60px; display: flex; gap: 14px; align-items: flex-end;
    width: 100%; max-width: 960px; justify-content: center;
  }
  .hero-img-card {
    border-radius: 18px; overflow: hidden; flex: 1;
    box-shadow: 0 16px 50px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05);
    position: relative;
  }
  .hero-img-card img { width: 100%; display: block; object-fit: cover; }
  .hero-img-card.tall { height: 240px; }
  .hero-img-card.short { height: 185px; }
  .hero-img-tag {
    position: absolute; bottom: 10px; left: 10px;
    background: rgba(255,255,255,0.93); backdrop-filter: blur(10px);
    border-radius: 8px; padding: 5px 10px;
    font-size: 0.7rem; font-weight: 600; color: var(--green-dark);
    display: flex; align-items: center; gap: 5px;
  }
  .hero-img-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); flex-shrink: 0; }

  /* scroll hint */
  .scroll-hint { display:flex; flex-direction:column; align-items:center; gap:7px; position:relative;z-index:1; margin-top:36px; }
  .scroll-hint span { font-size:0.69rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-soft); }
  .scroll-arrow { width:20px;height:20px; border-right:2px solid var(--text-soft); border-bottom:2px solid var(--text-soft); transform:rotate(45deg); animation:scrollBounce 1.8s ease-in-out infinite; }
  @keyframes scrollBounce{0%,100%{transform:rotate(45deg) translateY(0)}50%{transform:rotate(45deg) translateY(5px)}}

  /* ── STATS BAR ── */
  .stats-bar {
    width: 100%; background: var(--green-dark);
    padding: 36px 60px; display: flex; justify-content: center; gap: 80px; flex-wrap: wrap;
  }
  .stat-item { text-align: center; }
  .stat-number { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2rem; color: white; line-height: 1; }
  .stat-number span { color: var(--cinnamon-lt); }
  .stat-label { font-size: 0.73rem; color: rgba(255,255,255,0.45); margin-top: 5px; letter-spacing: 0.06em; text-transform: uppercase; }

  /* ── SCROLL REVEAL ── */
  .reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1); }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.2s; }
  .reveal-delay-3 { transition-delay: 0.3s; }
  .reveal-delay-4 { transition-delay: 0.4s; }

  /* ── SECTION WRAPPERS ── */
  .section-wrap { width: 100%; padding: 96px 60px; }
  .section-wrap.alt { background: var(--off-white); }
  .inner { max-width: 1120px; margin: 0 auto; }
  .section-label {
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--cinnamon); margin-bottom: 13px; display: flex; align-items: center; gap: 8px;
  }
  .section-label::before { content:''; width:18px; height:2px; background:var(--cinnamon); border-radius:2px; }
  .section-title {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: clamp(1.9rem, 3.2vw, 2.9rem); line-height: 1.12; letter-spacing: -0.025em;
    color: var(--green-dark); max-width: 580px;
  }
  .section-title .soft { color: var(--text-soft); }

  /* ── HOW IT WORKS ── */
  .how-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; }
  @media(max-width:820px){ .how-wrapper{grid-template-columns:1fr;} }
  .sentinel-img-wrap {
    border-radius: 22px; overflow: hidden; position: relative;
    box-shadow: 0 20px 70px rgba(0,0,0,0.09); border: 1px solid var(--border);
  }
  .sentinel-img-wrap img { width: 100%; display: block; }
  .sentinel-img-badge {
    position: absolute; bottom: 14px; left: 14px;
    background: rgba(255,255,255,0.93); backdrop-filter: blur(12px);
    border: 1px solid var(--border); border-radius: 10px;
    padding: 8px 13px; font-size: 0.76rem; color: var(--green-dark); font-weight: 600;
    display: flex; align-items: center; gap: 7px;
  }
  .how-steps { display: flex; flex-direction: column; gap: 12px; margin-top: 32px; }
  .step-card {
    display: flex; gap: 16px; align-items: flex-start;
    background: white; border: 1px solid var(--border); border-radius: 14px; padding: 18px 20px;
    transition: border-color .25s, box-shadow .25s; cursor: default;
  }
  .step-card:hover { border-color: var(--green-lt); box-shadow: 0 6px 24px rgba(58,148,96,0.09); }
  .step-num {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    background: var(--mint); border: 1px solid var(--green-pale);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 0.78rem; color: var(--green);
  }
  .step-text h4 { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.9rem; color: var(--green-dark); margin-bottom: 4px; }
  .step-text p { font-size: 0.82rem; color: var(--text-soft); line-height: 1.65; }

  /* ── ZONES ── */
  .zones-header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 18px; margin-bottom: 36px; }
  .zones-desc { font-size: 0.88rem; color: var(--text-mid); max-width: 360px; line-height: 1.7; }
  .zones-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  @media(max-width:900px){ .zones-grid{ grid-template-columns: repeat(2,1fr); } }
  .zone-card {
    border-radius: 16px; overflow: hidden; position: relative;
    border: 1px solid var(--border); aspect-ratio: 3/2.2;
    cursor: pointer; transition: transform .3s, box-shadow .3s;
    box-shadow: 0 3px 14px rgba(0,0,0,0.06);
  }
  .zone-card:hover { transform: translateY(-5px); box-shadow: 0 18px 44px rgba(0,0,0,0.13); }
  .zone-card img { width:100%; height:100%; object-fit:cover; transition: transform .5s; }
  .zone-card:hover img { transform: scale(1.06); }
  .zone-overlay {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    justify-content: flex-end; padding: 13px;
    background: linear-gradient(to top, rgba(8,22,12,0.82) 0%, transparent 60%);
  }
  .zone-health {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 0.68rem; font-weight: 700; border-radius: 100px;
    padding: 3px 9px; margin-bottom: 6px; width: fit-content;
    letter-spacing: 0.04em; text-transform: uppercase;
  }
  .zone-health.good     { background: rgba(91,184,126,0.22); color: #5bb87e; border: 1px solid rgba(91,184,126,0.45); }
  .zone-health.moderate { background: rgba(220,168,52,0.18); color: #dca834; border: 1px solid rgba(220,168,52,0.38); }
  .zone-health.low      { background: rgba(220,80,60,0.18);  color: #e05a4a; border: 1px solid rgba(220,80,60,0.3); }
  .zone-name { font-family:'Syne',sans-serif; font-weight:700; font-size:0.86rem; color:#fff; }
  .zone-sub { font-size:0.69rem; color:rgba(255,255,255,0.6); margin-top:2px; }

  /* ── PREDICTIONS ── */
  .predict-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 68px; align-items: start; }
  @media(max-width:820px){ .predict-wrap{grid-template-columns:1fr;} }
  .predict-features { display: flex; flex-direction: column; gap: 12px; margin-top: 32px; }
  .feat-row {
    display: flex; align-items: flex-start; gap: 15px;
    padding: 17px 19px; border-radius: 13px;
    background: white; border: 1px solid var(--border); transition: border-color .25s;
  }
  .feat-row:hover { border-color: var(--green-lt); }
  .feat-icon {
    width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
    background: var(--mint); display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; border: 1px solid var(--green-pale);
  }
  .feat-content h4 { font-family:'Syne',sans-serif; font-weight:700; font-size:0.88rem; color:var(--green-dark); margin-bottom:3px; }
  .feat-content p { font-size:0.81rem; color:var(--text-soft); line-height:1.65; }

  /* chart */
  .chart-mock {
    background: white; border: 1px solid var(--border);
    border-radius: 20px; padding: 26px 26px 20px;
    box-shadow: 0 6px 36px rgba(0,0,0,0.07);
  }
  .chart-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
  .chart-title { font-family:'Syne',sans-serif; font-size:0.86rem; font-weight:700; color:var(--green-dark); }
  .chart-sub { font-size:0.71rem; color:var(--text-soft); margin-bottom:22px; }
  .chart-bars { display: flex; align-items: flex-end; gap: 7px; height: 148px; }
  .bar-group { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; }
  .bar {
    width: 100%; border-radius: 5px 5px 0 0;
    background: linear-gradient(180deg, var(--green-lt), var(--green));
    transition: height 1.3s cubic-bezier(.22,1,.36,1);
  }
  .bar.predicted {
    background: linear-gradient(180deg, rgba(200,119,58,0.38), rgba(200,119,58,0.13));
    border: 1.5px dashed rgba(200,119,58,0.55); border-bottom: none;
  }
  .bar-label { font-size:0.62rem; color:var(--text-soft); font-weight:500; }
  .chart-legend { display: flex; gap: 16px; margin-top: 16px; border-top: 1px solid var(--border); padding-top: 13px; }
  .legend-item { display:flex; align-items:center; gap:6px; font-size:0.72rem; color:var(--text-soft); font-weight:500; }
  .legend-dot { width:10px;height:10px;border-radius:3px; }

  /* ── CTA ── */
  .cta-wrap {
    width: 100%;
    background: linear-gradient(135deg, #122b1c 0%, #0e2017 100%);
    padding: 100px 60px; text-align: center; position: relative; overflow: hidden;
  }
  .cta-wrap::before {
    content:''; position:absolute; inset:0;
    background: radial-gradient(ellipse 60% 120% at 50% 110%, rgba(91,184,126,0.13) 0%, transparent 68%);
  }
  .cta-wrap > * { position: relative; z-index: 1; }
  .cta-wrap h2 {
    font-family:'Syne',sans-serif; font-weight:800;
    font-size:clamp(2rem,3.8vw,3rem); letter-spacing:-0.025em;
    color:white; margin-bottom:13px;
  }
  .cta-wrap h2 span { color: var(--cinnamon-lt); }
  .cta-wrap p { color:rgba(255,255,255,0.5); font-size:0.98rem; margin-bottom:38px; max-width:460px; margin-left:auto; margin-right:auto; line-height:1.75; }
  .cta-buttons { display:flex; gap:13px; justify-content:center; flex-wrap:wrap; }
  .btn-white {
    padding: 14px 34px; border-radius: 100px;
    background: white; color: var(--green-dark);
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.88rem;
    text-decoration: none; transition: all .25s; box-shadow: 0 4px 18px rgba(0,0,0,0.18);
  }
  .btn-white:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.28); }
  .btn-outline-white {
    padding: 14px 30px; border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.28); color: white;
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.88rem;
    text-decoration: none; transition: all .25s;
  }
  .btn-outline-white:hover { border-color: rgba(255,255,255,0.65); background: rgba(255,255,255,0.07); }

  /* ── FOOTER ── */
  footer {
    width: 100%; background: var(--off-white); border-top: 1px solid var(--border);
    padding: 30px 60px; display:flex; justify-content:space-between; align-items:center;
    font-size:0.79rem; color:var(--text-soft); flex-wrap:wrap; gap:12px;
  }
  footer .logo { font-family:'Syne',sans-serif; font-weight:800; color:var(--green-dark); font-size:0.93rem; }
  footer a { color:var(--text-soft); text-decoration:none; transition:color .2s; }
  footer a:hover { color:var(--green); }

  @media(max-width:640px){
    nav { padding: 15px 22px; }
    .nav-links { display: none; }
    .hero { padding: 105px 22px 60px; }
    .stats-bar { padding: 26px 22px; gap: 28px; }
    .section-wrap { padding: 68px 22px; }
    .cta-wrap { padding: 68px 22px; }
    footer { padding: 22px; }
  }
`;

const ZONES = [
  { name: "Zone A — North Field",  sub: "42 ha · NDVI 0.78", health: "good",     img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80" },
  { name: "Zone B — East Slope",   sub: "31 ha · NDVI 0.61", health: "moderate", img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80" },
  { name: "Zone C — South Block",  sub: "28 ha · NDVI 0.44", health: "low",      img: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80" },
  { name: "Zone D — West Terrace", sub: "36 ha · NDVI 0.82", health: "good",     img: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&q=80" },
];

const BARS = [
  { label:"Jan", h:68, predicted:false },
  { label:"Feb", h:63, predicted:false },
  { label:"Mar", h:77, predicted:false },
  { label:"Apr", h:72, predicted:false },
  { label:"May", h:84, predicted:false },
  { label:"Jun", h:87, predicted:true  },
  { label:"Jul", h:80, predicted:true  },
  { label:"Aug", h:76, predicted:true  },
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function AnimatedBar({ h, predicted, label, visible }) {
  return (
    <div className="bar-group">
      <div className={`bar${predicted ? ' predicted' : ''}`} style={{ height: visible ? `${h}%` : '0%' }} />
      <span className="bar-label">{label}</span>
    </div>
  );
}

export default function Landing() {
  useReveal();
  const chartRef = useRef(null);
  const [chartVisible, setChartVisible] = useState(false);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setChartVisible(true); }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div style={{ width:'100%', minHeight:'100vh', background:'#fff', overflowX:'hidden' }}>
      <style>{style}</style>

      {/* ── NAV ── */}
      <nav>
        <div className="nav-logo"><div className="nav-logo-dot" />Farm Guard</div>
        <ul className="nav-links">
          <li><a href="#how">How It Works</a></li>
          <li><a href="#zones">Zone Monitor</a></li>
          <li><a href="#predict">Predictions</a></li>
        </ul>
        <a href="/login" className="nav-cta">Get Started</a>
      </nav>

      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-blob1" /><div className="hero-blob2" /><div className="hero-grid" />
        <div className="hero-badge"><div className="badge-dot" />Powered by Sentinel-2 · Updates every 5 days</div>
        <h1>
          Cinnamon Field
          <span className="line2">Health <span className="cinn">Monitoring</span></span>
        </h1>
        <p className="hero-sub">
          Track, analyze, and predict your farmland's health using high-resolution satellite imagery. Know every zone, every cycle.
        </p>
        <div className="hero-actions">
          <a href="/signup" className="btn-primary">Start Monitoring →</a>
          <a href="#how" className="btn-cinn">See How It Works</a>
        </div>
        <div className="hero-img-row">
          <div className="hero-img-card tall reveal">
          <img src={farmImage} alt="Farm" />
            <div className="hero-img-tag"><div className="hero-img-dot" />Health Map</div>
          </div>
          <div className="hero-img-card short reveal reveal-delay-1">
          <img src={farmImage1} alt="Satellite"/>
            <div className="hero-img-tag"><div className="hero-img-dot" />Sentinel-2 Live</div>
          </div>
          <div className="hero-img-card tall reveal reveal-delay-2">
          <img src={farmImage2} alt="Field"/>
            <div className="hero-img-tag"><div className="hero-img-dot" style={{background:'#e05a4a'}} />Dashboards</div>
          </div>
        </div>
        <div className="scroll-hint">
          <span>Scroll to explore</span>
          <div className="scroll-arrow" />
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="stats-bar">
        {[
          { n:"5",  unit:"d",  label:"Data Refresh Cycle" },
          { n:"10", unit:"m",  label:"Spatial Resolution" },
          { n:"13", unit:"",   label:"Spectral Bands" },
          { n:"AI", unit:"",   label:"Health Forecast" },
        ].map(s => (
          <div className="stat-item" key={s.label}>
            <div className="stat-number">{s.n}<span>{s.unit}</span></div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="section-wrap" id="how">
        <div className="inner">
          <div className="how-wrapper">
            <div className="reveal">
              <div className="sentinel-img-wrap">
                <img src="https://www.cls.fr/wp-content/uploads/2022/05/Sentinel-2-980x735.jpg" alt="Satellite farmland" />
                <div className="sentinel-img-badge">
                  <div style={{width:7,height:7,background:'#3a9460',borderRadius:'50%',flexShrink:0}} />
                  Sentinel-2
                </div>
              </div>
            </div>
            <div>
              <div className="reveal"><p className="section-label">How It Works</p></div>
              <div className="reveal reveal-delay-1"><h2 className="section-title">Satellite data, <span className="soft">decoded for your farm.</span></h2></div>
              <div className="how-steps">
                {[
                  { n:"01", title:"Sentinel-2 Acquisition",       desc:"ESA's Sentinel-2 passes every 5 days capturing 13 spectral bands at 10 m resolution over your farmland." },
                  { n:"02", title:"NDVI & Index Computation",      desc:"We compute NDVI, EVI, SAVI, and moisture indices to measure vegetation vigor, chlorophyll, and water stress." },
                  { n:"03", title:"Intelligent Zone Segmentation", desc:"Your farm is divided into smart zones based on soil, topology, and historical variance for granular insights." },
                  { n:"04", title:"Health Scoring & Alerts",       desc:"Each zone receives a health score. Instant alerts fire when readings drop outside healthy thresholds." },
                ].map((s, i) => (
                  <div className={`step-card reveal reveal-delay-${i+1}`} key={s.n}>
                    <div className="step-num">{s.n}</div>
                    <div className="step-text"><h4>{s.title}</h4><p>{s.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ZONES ── */}
      <div className="section-wrap alt" id="zones">
        <div className="inner">
          <div className="zones-header">
            <div>
              <div className="reveal"><p className="section-label">Zone Monitoring</p></div>
              <div className="reveal reveal-delay-1"><h2 className="section-title">Every zone, <span className="soft">always in view.</span></h2></div>
            </div>
            <div className="reveal reveal-delay-2"><p className="zones-desc">Divide your farm into as many zones as needed. Each is tracked independently — catch issues before they spread.</p></div>
          </div>
          <div className="zones-grid">
            {ZONES.map((z, i) => (
              <div className={`zone-card reveal reveal-delay-${i+1}`} key={z.name}>
                <img src={z.img} alt={z.name} />
                <div className="zone-overlay">
                  <div className={`zone-health ${z.health}`}>
                    <span style={{width:5,height:5,borderRadius:'50%',background:'currentColor',display:'inline-block'}} />
                    {z.health==='good'?'Healthy':z.health==='moderate'?'Moderate':'Low'}
                  </div>
                  <div className="zone-name">{z.name}</div>
                  <div className="zone-sub">{z.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PREDICTIONS ── */}
      <div className="section-wrap" id="predict">
        <div className="inner">
          <div className="predict-wrap">
            <div>
              <div className="reveal"><p className="section-label">AI Predictions</p></div>
              <div className="reveal reveal-delay-1"><h2 className="section-title">See health risks <span className="soft">before they happen.</span></h2></div>
              <div className="predict-features">
                {[
                  { icon:"📈", title:"30-Day Health Forecast", desc:"ML models trained on historical NDVI trends project future vegetation health per zone." },
                  { icon:"🌧️", title:"Weather Integration",    desc:"Forecasts incorporate rainfall, temperature, and humidity for richer prediction accuracy." },
                  { icon:"⚠️", title:"Early Stress Detection", desc:"Identify zones trending toward low health 2–3 weeks in advance to act preventively." },
                ].map((f, i) => (
                  <div className={`feat-row reveal reveal-delay-${i+1}`} key={f.title}>
                    <div className="feat-icon">{f.icon}</div>
                    <div className="feat-content"><h4>{f.title}</h4><p>{f.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal reveal-delay-2" ref={chartRef}>
              <div className="chart-mock">
                <div className="chart-header">
                  <div className="chart-title">Zone A — NDVI Health Index</div>
                  <div style={{background:'#e8f5ec',color:'#3a9460',fontSize:'0.71rem',fontWeight:700,padding:'3px 10px',borderRadius:'100px',border:'1px solid #d4edd9'}}>2025</div>
                </div>
                <div className="chart-sub">Monthly average · Dashed = AI predicted</div>
                <div className="chart-bars">
                  {BARS.map(b => <AnimatedBar key={b.label} {...b} visible={chartVisible} />)}
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-dot" style={{background:'var(--green)'}} />Recorded
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{background:'rgba(200,119,58,0.32)',border:'1.5px dashed rgba(200,119,58,0.55)'}} />Predicted
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="cta-wrap">
        <h2>Ready to monitor your <span>farm?</span></h2>
        <p>Get satellite-driven insights and AI health predictions for every zone of your land — starting today.</p>
        <div className="cta-buttons">
          <a href="/signup" className="btn-white">Create Free Account →</a>
          <a href="/login" className="btn-outline-white">Sign In</a>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer>
        <span className="logo">🌱 Cinnamon</span>
        <span>© 2025 Cinnamon Health Monitoring. Powered by ESA Sentinel-2.</span>
        <div style={{display:'flex',gap:'22px'}}>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
}