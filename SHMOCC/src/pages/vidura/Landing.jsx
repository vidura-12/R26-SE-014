import { useEffect, useRef, useState } from "react";
import farmImage from '../../assets/farm-map.png';
import farmImage1 from '../../assets/intro-web.png';
import farmImage2 from '../../assets/original-18c9e8267fd4dd01aa0c1dbd6c8b9b09.png';
const style = `
 
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