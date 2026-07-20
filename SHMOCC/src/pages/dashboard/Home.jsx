import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  :root {
    --white:      #ffffff;
    --off-white:  #f8faf7;
    --cinnamon:   #c8773a;
    --cinn-lt:    #e8956a;
    --cinn-bg:    #fdf3ec;
    --green-dark: #1a4028;
    --green:      #3a9460;
    --green-lt:   #5bb87e;
    --green-pale: #d4edd9;
    --mint:       #e8f5ec;
    --text:       #1a2e20;
    --text-mid:   #3d5c47;
    --text-soft:  #7a9882;
    --border:     rgba(58,148,96,0.14);
    --warn:       #dca834;
    --danger:     #e05a4a;
  }

  /* ── GRID CARDS ── */
  .home-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);  /* always 4 equal columns */
    gap: 16px;
    margin-bottom: 24px;
    width: 100%;
  }
  @media(max-width:1100px){ .home-grid{ grid-template-columns: repeat(2,1fr); } }
  @media(max-width:560px){  .home-grid{ grid-template-columns: 1fr; } }

  .kpi-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 18px; padding: 22px 22px 18px;
    display: flex; flex-direction: column; gap: 10px;
    transition: box-shadow .22s, border-color .22s;
  }
  .kpi-card:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.07); border-color: var(--green-pale); }
  .kpi-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .kpi-icon {
    width: 40px; height: 40px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem;
  }
  .kpi-icon.green  { background: var(--mint); border: 1px solid var(--green-pale); }
  .kpi-icon.cinn   { background: var(--cinn-bg); border: 1px solid rgba(200,119,58,0.22); }
  .kpi-icon.warn   { background: #fffbea; border: 1px solid rgba(220,168,52,0.25); }
  .kpi-icon.danger { background: #fef2f0; border: 1px solid rgba(224,90,74,0.22); }

  .kpi-badge {
    font-size: 0.69rem; font-weight: 700; border-radius: 100px; padding: 3px 9px;
    letter-spacing: 0.03em;
  }
  .kpi-badge.up   { background: var(--mint); color: var(--green); border: 1px solid var(--green-pale); }
  .kpi-badge.down { background: #fef2f0; color: var(--danger); border: 1px solid rgba(224,90,74,0.2); }
  .kpi-badge.neu  { background: var(--off-white); color: var(--text-soft); border: 1px solid var(--border); }

  .kpi-value {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: 2rem; color: var(--green-dark); line-height: 1;
  }
  .kpi-label { font-size: 0.8rem; color: var(--text-soft); font-weight: 500; }

  .home-lower {
    display: grid;
    grid-template-columns: 1fr 380px;  /* chart grows, alerts fixed */
    gap: 18px;
    width: 100%;
    box-sizing: border-box;
  }
  @media(max-width: 1100px) {
    .home-lower { grid-template-columns: 1fr; }
  }
  
  /* ── SECTION CARD ── */
  .card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 18px; padding: 22px;
  }
  .card-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;
  }
  .card-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.92rem; color: var(--green-dark); }
  .card-action {
    font-size: 0.77rem; color: var(--green); font-weight: 600; cursor: pointer;
    background: none; border: none; padding: 0; transition: color .18s;
  }
  .card-action:hover { color: var(--green-dark); }

  /* ── CHART ── */
  .chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 130px; }
  .bar-group { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; }
  .bar {
    width: 100%; border-radius: 5px 5px 0 0;
    background: linear-gradient(180deg, var(--green-lt), var(--green));
    transition: height 1.1s cubic-bezier(.22,1,.36,1);
  }
  .bar.predicted {
    background: linear-gradient(180deg, rgba(200,119,58,0.35), rgba(200,119,58,0.12));
    border: 1.5px dashed rgba(200,119,58,0.5); border-bottom: none;
  }
  .bar-lbl { font-size: 0.6rem; color: var(--text-soft); font-weight: 500; }
  .chart-legend { display: flex; gap: 16px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); }
  .leg-item { display:flex; align-items:center; gap:5px; font-size:0.71rem; color:var(--text-soft); }
  .leg-dot { width:9px; height:9px; border-radius:3px; }

  /* ── ZONE LIST ── */
  .zone-list { display: flex; flex-direction: column; gap: 10px; }
  .zone-row {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 14px; border-radius: 12px;
    border: 1px solid var(--border); background: var(--off-white);
    transition: border-color .2s, background .2s; cursor: pointer;
  }
  .zone-row:hover { border-color: var(--green-pale); background: var(--white); }
  .zone-thumb {
    width: 44px; height: 44px; border-radius: 9px; object-fit: cover; flex-shrink: 0;
  }
  .zone-info { flex: 1; min-width: 0; }
  .zone-name-sm { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.84rem; color: var(--green-dark); }
  .zone-sub-sm { font-size: 0.72rem; color: var(--text-soft); margin-top: 2px; }
  .zone-pill {
    font-size: 0.68rem; font-weight: 700; border-radius: 100px; padding: 3px 9px;
    flex-shrink: 0; letter-spacing: 0.03em; text-transform: uppercase;
  }
  .zone-pill.good     { background: var(--mint); color: var(--green-lt); border: 1px solid var(--green-pale); }
  .zone-pill.moderate { background: #fffbea; color: var(--warn); border: 1px solid rgba(220,168,52,0.3); }
  .zone-pill.low      { background: #fef2f0; color: var(--danger); border: 1px solid rgba(224,90,74,0.22); }

  /* ── ALERTS ── */
  .alert-list { display: flex; flex-direction: column; gap: 10px; }
  .alert-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 13px 14px; border-radius: 12px; border-left: 3px solid transparent;
  }
  .alert-item.warn { background: #fffbea; border-color: var(--warn); }
  .alert-item.info { background: var(--mint); border-color: var(--green-lt); }
  .alert-item.crit { background: #fef2f0; border-color: var(--danger); }
  .alert-icon { font-size: 1rem; margin-top: 1px; flex-shrink: 0; }
  .alert-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.82rem; color: var(--green-dark); margin-bottom: 2px; }
  .alert-desc { font-size: 0.76rem; color: var(--text-mid); line-height: 1.55; }
  .alert-time { font-size: 0.69rem; color: var(--text-soft); margin-top: 4px; }

  /* ── WELCOME BANNER ── */
  .welcome-banner {
    background: linear-gradient(135deg, var(--green-dark) 0%, #11301e 100%);
    border-radius: 18px; padding: 28px 30px; margin-bottom: 22px;
    display: flex; justify-content: space-between; align-items: center;
    position: relative; overflow: hidden;
  }
  .welcome-banner::before {
    content: ''; position: absolute;
    width: 280px; height: 280px; border-radius: 50%;
    background: radial-gradient(circle, rgba(91,184,126,0.15) 0%, transparent 70%);
    right: -60px; top: -80px; pointer-events: none;
  }
  .welcome-banner > * { position: relative; z-index: 1; }
  .wb-greeting { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
  .wb-name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.4rem; color: white; }
  .wb-sub { font-size: 0.82rem; color: rgba(255,255,255,0.45); margin-top: 6px; }
  .wb-badge {
    display: flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px; padding: 10px 16px;
    font-size: 0.78rem; color: rgba(255,255,255,0.75);
  }
  .wb-ndvi { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.5rem; color: var(--green-lt); line-height: 1; }
  .wb-ndvi-lbl { font-size: 0.65rem; color: rgba(255,255,255,0.4); letter-spacing: 0.06em; text-transform: uppercase; }

  .fade-in {
    opacity: 0; transform: translateY(16px);
    animation: fadeUp 0.6s cubic-bezier(.22,1,.36,1) forwards;
  }
  .fade-in.d1 { animation-delay: 0.08s; }
  .fade-in.d2 { animation-delay: 0.16s; }
  .fade-in.d3 { animation-delay: 0.24s; }
  .fade-in.d4 { animation-delay: 0.32s; }
  .fade-in.d5 { animation-delay: 0.40s; }
  @keyframes fadeUp { to { opacity:1; transform:translateY(0); } }
`;

const ZONES = [
  { name:"Zone A — North Field",  sub:"42 ha · Last scan 2d ago", health:"good",     img:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=120&q=70" },
  { name:"Zone B — East Slope",   sub:"31 ha · Last scan 2d ago", health:"moderate", img:"https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=120&q=70" },
  { name:"Zone C — South Block",  sub:"28 ha · Last scan 2d ago", health:"low",      img:"https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=120&q=70" },
  { name:"Zone D — West Terrace", sub:"36 ha · Last scan 2d ago", health:"good",     img:"https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=120&q=70" },
];

const BARS = [
  { l:"Jan", h:68, p:false },{ l:"Feb", h:63, p:false },{ l:"Mar", h:77, p:false },
  { l:"Apr", h:72, p:false },{ l:"May", h:84, p:false },
  { l:"Jun", h:87, p:true  },{ l:"Jul", h:80, p:true  },{ l:"Aug", h:76, p:true },
];

const ALERTS = [
  { type:"crit", icon:"⚠️", title:"Zone C NDVI Critical", desc:"South Block dropped to 0.44 — below stress threshold. Consider irrigation.", time:"2h ago" },
  { type:"warn", icon:"🌡️", title:"Temperature Anomaly", desc:"Zone B shows unusual heat stress pattern over past 10 days.", time:"1d ago" },
  { type:"info", icon:"🛰️", title:"New Sentinel-2 Pass", desc:"Fresh imagery acquired. All zones updated with latest spectral data.", time:"2d ago" },
];

export default function Home() {
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const [chartVis, setChartVis] = useState(false);
  const userName = localStorage.getItem("userName") || "Farmer";

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setChartVis(true); }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{css}</style>

      {/* Welcome Banner */}
      <div className="welcome-banner fade-in">
        <div>
          <div className="wb-greeting">Good day,</div>
          <div className="wb-name">{userName} 👋</div>
          <div className="wb-sub">Here's your farm health overview for today.</div>
        </div>
        <div className="wb-badge">
          <div>
            <div className="wb-ndvi">0.72</div>
            <div className="wb-ndvi-lbl">Avg. NDVI</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="home-grid">
        {[
          { icon:"🌾", color:"green",  value:"4",    label:"Active Zones",    badge:"↑ 0",   trend:"neu" },
          { icon:"📡", color:"cinn",   value:"0.72", label:"Avg NDVI",        badge:"↑ +0.04",trend:"up" },
          { icon:"⚠️", color:"warn",   value:"1",    label:"Alerts",          badge:"New",   trend:"down" },
          { icon:"📅", color:"green",  value:"2d",   label:"Next Satellite Pass", badge:"On schedule", trend:"neu" },
        ].map((k, i) => (
          <div className={`kpi-card fade-in d${i+1}`} key={k.label}>
            <div className="kpi-top">
              <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
              <span className={`kpi-badge ${k.trend}`}>{k.badge}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Lower two-col */}
      <div className="home-lower">

        {/* NDVI Chart */}
        <div className="card fade-in d3" ref={chartRef}>
          <div className="card-header">
            <div className="card-title">Zone A — NDVI Trend</div>
            <button className="card-action" onClick={() => navigate("/dashboard/predict")}>View Predictions →</button>
          </div>
          <div className="chart-bars">
            {BARS.map(b => (
              <div className="bar-group" key={b.l}>
                <div
                  className={`bar${b.p ? " predicted" : ""}`}
                  style={{ height: chartVis ? `${b.h}%` : "0%" }}
                />
                <span className="bar-lbl">{b.l}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="leg-item"><div className="leg-dot" style={{background:"var(--green)"}} />Recorded</div>
            <div className="leg-item"><div className="leg-dot" style={{background:"rgba(200,119,58,0.35)",border:"1.5px dashed rgba(200,119,58,0.55)"}} />Predicted</div>
          </div>

          {/* Zone list under chart */}
          <div style={{marginTop:20}}>
            <div className="card-header" style={{marginBottom:12}}>
              <div className="card-title">All Zones</div>
              <button className="card-action" onClick={() => navigate("/dashboard/fields")}>Manage Fields →</button>
            </div>
            <div className="zone-list">
              {ZONES.map(z => (
                <div className="zone-row" key={z.name} onClick={() => navigate("/dashboard/fields")}>
                  <img className="zone-thumb" src={z.img} alt={z.name} />
                  <div className="zone-info">
                    <div className="zone-name-sm">{z.name}</div>
                    <div className="zone-sub-sm">{z.sub}</div>
                  </div>
                  <div className={`zone-pill ${z.health}`}>
                    {z.health === "good" ? "Healthy" : z.health === "moderate" ? "Moderate" : "Low"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="card fade-in d4" style={{alignSelf:"start"}}>
          <div className="card-header">
            <div className="card-title">Recent Alerts</div>
            <button className="card-action">View All</button>
          </div>
          <div className="alert-list">
            {ALERTS.map(a => (
              <div className={`alert-item ${a.type}`} key={a.title}>
                <div className="alert-icon">{a.icon}</div>
                <div>
                  <div className="alert-title">{a.title}</div>
                  <div className="alert-desc">{a.desc}</div>
                  <div className="alert-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{marginTop:20, display:"flex", flexDirection:"column", gap:8}}>
            <div style={{fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"0.88rem", color:"var(--green-dark)", marginBottom:4}}>Quick Actions</div>
            {[
              { label:"📡  View Satellite Map",  path:"/dashboard/map" },
              { label:"📈  Run Prediction",       path:"/dashboard/predict" },
              { label:"📋  Download Report",      path:"/dashboard/reports" },
            ].map(q => (
              <button
                key={q.path}
                onClick={() => navigate(q.path)}
                style={{
                  width:"100%", padding:"10px 14px", borderRadius:10,
                  border:"1px solid var(--border)", background:"var(--off-white)",
                  fontSize:"0.82rem", fontWeight:500, color:"var(--text-mid)",
                  cursor:"pointer", textAlign:"left", transition:"all .18s",
                  fontFamily:"'DM Sans',sans-serif",
                }}
                onMouseEnter={e => { e.target.style.background="var(--mint)"; e.target.style.borderColor="var(--green-pale)"; }}
                onMouseLeave={e => { e.target.style.background="var(--off-white)"; e.target.style.borderColor="var(--border)"; }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
