import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../hooks/useScrollReveal.jsx";
import { useTheme } from "../../context/ThemeProvider";
import {
  Sun, Ban, Camera, Ruler, CheckCircle2, Layers, ScanLine, Sparkles,
  ImageOff, Hand, Droplets, Eye, ArrowRight, RotateCcw,
} from "lucide-react";
import slide2 from "../../assets/11.png";

/* ── data ─────────────────────────────────────────────── */
const HERO_IMG = slide2;

const STEPS = [
  { t: "Prepare", d: "Flat, plain background. Natural light. Wipe the lens.", icon: Droplets },
  { t: "Position", d: "Pick the distance for a quill or a bundle and keep it steady.", icon: Ruler },
  { t: "Capture", d: "Whole sample in frame, sharp and in focus.", icon: Camera },
  { t: "Check", d: "Zoom in once. If anything is hard to see, retake it.", icon: Eye },
];

const MODES = {
  quill: {
    label: "Single quill", inch: "4 in", cm: "10 cm", pct: 30, scale: 1.25,
    rules: [
      "Keep the entire quill inside the frame.",
      "Make sure it is clearly visible and in focus.",
      "Avoid overlapping quills.",
      "Hold the camera steady while shooting.",
    ],
  },
  bundle: {
    label: "Bundle", inch: "12 in", cm: "30 cm", pct: 82, scale: 0.8,
    rules: [
      "Capture the entire bundle in one photo.",
      "Arrange quills so each one is visible.",
      "Avoid excessive overlapping where possible.",
      "Do not crop the edges of the bundle.",
    ],
  },
};

const BEFORE = [
  { icon: Layers, t: "Plain background", d: "Place the cinnamon on a flat, plain surface." },
  { icon: Sun, t: "Natural light", d: "Good, even daylight works best." },
  { icon: Sparkles, t: "No glare", d: "Avoid shadows, reflections and blur." },
  { icon: Droplets, t: "Clean lens", d: "Wipe the camera lens first." },
];

const MISTAKES = [
  { icon: ImageOff, t: "Blurry or dark photos" },
  { icon: Ruler, t: "Too far away or too close" },
  { icon: Sun, t: "Strong shadows or uneven light" },
  { icon: Layers, t: "Quills hidden behind quills" },
  { icon: ScanLine, t: "Part of a quill or bundle cut off" },
  { icon: Hand, t: "Filters or edits before upload" },
];

const CHECKLIST = [
  "Image is sharp and well-lit",
  "Cinnamon is clearly visible",
  "Recommended camera distance kept",
  "Retaken if the cinnamon was hard to see",
];

/* ── hooks ────────────────────────────────────────────── */
/* ── header (same as Cinnamon page, Guidelines active) ── */
function Header({ navigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = localStorage.getItem("cinnamonRole") === "admin";
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const go = (p) => { setMenuOpen(false); navigate(p); };
  function logout() {
    ["cinnamonToken", "cinnamonRole", "cinnamonUserId", "cinnamonUserName"].forEach((k) => localStorage.removeItem(k));
    window.location.href = "/cinnamon/login";
  }
  return (
    <header className={`cx-header ${scrolled ? "on" : ""}`}>
      <div className="cx-hwrap">
        <button className="cx-brand" onClick={() => go("/cinnamon")} aria-label="Ceylon Cinnamon home">
          <span className="cx-logo">🪵</span>
          <span><b>Ceylon Cinnamon</b><small>Grade Detection</small></span>
        </button>
        <button className="cx-burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">{menuOpen ? "×" : "☰"}</button>
        <nav className={`cx-nav ${menuOpen ? "open" : ""}`}>
          <button className="link" onClick={() => go("/cinnamon")}>Detection</button>
          <button className="link active" onClick={() => go("/cinnamon/guidelines")}>Guideline to get images</button>
          <button className="link" onClick={() => go("/cinnamon/history")}>History</button>
          {isAdmin && <button className="link" onClick={() => go("/cinnamon/admin")}>Admin</button>}
          <button className="cx-logout" onClick={logout}>Logout</button>
        </nav>
      </div>
    </header>
  );
}

/* ── page ─────────────────────────────────────────────── */
export default function Guidelines() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [mode, setMode] = useState("quill");
  const [checked, setChecked] = useState([]);
  const m = MODES[mode];
  const done = checked.length === CHECKLIST.length;
  const toggle = (i) => setChecked((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700&display=swap');
        .cx-root { --bg:#FBF6EF; --surface:#FFFFFF; --surface-2:#F6EDE2; --ink:#2A1810; --muted:#6F5E50; --line:rgba(62,36,21,.12); --amber:#E3A24B; --amber-deep:#B9701F; --bark:#3E2415; --good:#4F7A47;
          font-family:'Manrope',system-ui,sans-serif; background:var(--bg); color:var(--ink); min-height:100vh; overflow-x:hidden; transition:background .3s,color .3s; }
        .cx-root.cx-dark { --bg:#170D07; --surface:#24150D; --surface-2:#2E1B11; --ink:#F8EEDD; --muted:#BFAA92; --line:rgba(248,238,221,.12); }
        .cx-root h1,.cx-root h2,.cx-root h3,.cx-root h4 { font-family:'Fraunces',Georgia,serif; letter-spacing:-.01em; margin:0; }
        .cx-root button { font-family:inherit; }
        .cx-root :focus-visible { outline:2px solid var(--amber); outline-offset:3px; }
        .cx-wrap { max-width:1240px; margin:0 auto; padding:0 28px; }

        /* header */
        .cx-header { position:fixed; inset:0 0 auto 0; z-index:60; padding:18px 0; transition:all .35s; }
        .cx-header.on { background:rgba(42,24,16,.45); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); padding:10px 0; box-shadow:0 4px 24px rgba(0,0,0,.2); border-bottom:1px solid rgba(255,255,255,.05); }
        .cx-hwrap { width:100%; padding:0 36px; display:flex; align-items:center; justify-content:space-between; }
        .cx-brand { display:flex; align-items:center; gap:12px; color:#fff; cursor:pointer; background:none; border:0; text-align:left; }
        .cx-logo { width:44px; height:44px; border-radius:14px; display:grid; place-items:center; font-size:22px; background:linear-gradient(135deg,#8C5A32,#3E2415); border:1px solid rgba(255,255,255,.08); box-shadow:0 4px 12px rgba(0,0,0,.3); }
        .cx-brand b { display:block; font-family:'Fraunces',serif; font-size:19px; font-weight:600; }
        .cx-brand small { display:block; font-size:11px; color:rgba(255,255,255,.7); }
        .cx-nav { display:flex; align-items:center; gap:6px; }
        .cx-nav button.link { color:rgba(255,255,255,.9); background:none; border:0; padding:9px 16px; border-radius:99px; font-size:14px; font-weight:600; cursor:pointer; transition:background .2s; }
        .cx-nav button.link:hover { background:rgba(255,255,255,.14); color:#fff; }
        .cx-nav button.link.active { background:rgba(255,255,255,.18); color:#fff; }
        .cx-logout { margin-left:8px; background:linear-gradient(135deg,#E5484D,#C62B33); color:#fff; border:0; padding:10px 24px; border-radius:99px; font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 6px 18px rgba(198,43,51,.35); transition:transform .2s, box-shadow .2s; }
        .cx-logout:hover { transform:translateY(-1px); box-shadow:0 10px 26px rgba(198,43,51,.55); }
        .cx-burger { display:none; width:44px; height:44px; border-radius:12px; border:1px solid rgba(255,255,255,.3); background:rgba(255,255,255,.1); color:#fff; font-size:20px; cursor:pointer; }
        @media (max-width:900px){
          .cx-hwrap { padding:0 16px; } .cx-burger { display:block; }
          .cx-nav { position:absolute; top:100%; left:12px; right:12px; flex-direction:column; align-items:stretch; padding:12px; border-radius:20px; background:rgba(26,14,8,.96); backdrop-filter:blur(18px); display:none; }
          .cx-nav.open { display:flex; } .cx-nav button.link { text-align:left; } .cx-logout { margin:6px 0 0; }
        }

        /* buttons */
        .cx-btn { display:inline-flex; align-items:center; gap:10px; padding:15px 28px; border-radius:99px; font-weight:700; font-size:15px; cursor:pointer; border:0; transition:transform .2s, box-shadow .2s, background .2s; }
        .cx-btn:hover { transform:translateY(-2px); }
        .cx-btn.primary { background:var(--amber); color:#2A1810; box-shadow:0 10px 30px rgba(227,162,75,.35); }
        .cx-btn.ghost { background:rgba(255,255,255,.12); color:#fff; border:1px solid rgba(255,255,255,.4); backdrop-filter:blur(10px); }
        .cx-btn.ghost:hover { background:rgba(255,255,255,.22); }
        .cx-btn.dark { background:#2A1810; color:#fff; }

        /* scene / hero */
        .cx-scene { position:relative; isolation:isolate; overflow:hidden; color:#fff; border-radius:0 0 56px 56px; }
        .cx-slide { position:absolute; inset:0; background-size:cover; background-position:center 35%; opacity:0; transition:opacity 1.6s ease; z-index:-2; }
        .cx-slide.on { opacity:1; animation:cxZoom 10s ease-out both; }
        @keyframes cxZoom { from{transform:scale(1)} to{transform:scale(1.08)} }
        .cx-shade { position:absolute; inset:0; z-index:-1; background:linear-gradient(95deg,rgba(20,10,5,.9) 0%,rgba(20,10,5,.55) 50%,rgba(20,10,5,.3) 100%),linear-gradient(180deg,rgba(20,10,5,.05) 0%,rgba(20,10,5,.5) 50%,rgba(20,10,5,.9) 100%); }
        .gx-hero { min-height:34vh; display:flex; align-items:flex-end; padding:96px 0 36px; }
        .gx-hero .cx-wrap { width:100%; }
        .gx-hero h1 { font-size:clamp(34px,4.6vw,60px); line-height:1.06; font-weight:600; color:#fff; max-width:760px; text-shadow:0 4px 30px rgba(0,0,0,.4); }
        .gx-hero-row { display:flex; align-items:center; justify-content:space-between; gap:32px; margin-top:22px; }
        .gx-hero p.lead { margin:0; max-width:560px; font-size:16px; line-height:1.7; color:rgba(255,255,255,.9); }
        .gx-cta { display:flex; gap:12px; flex:none; margin-left:auto; }
        @media (max-width:900px){ .gx-hero-row { flex-direction:column; align-items:flex-start; } .gx-cta { margin-left:0; flex-wrap:wrap; } }

        /* sections */
        .cx-section { padding:90px 0; }
        .cx-sec-head { max-width:640px; margin-bottom:40px; }
        .cx-sec-head h2 { font-size:clamp(30px,4vw,48px); font-weight:600; line-height:1.1; }
        .cx-sec-head p { margin-top:12px; color:var(--muted); font-size:16px; line-height:1.7; }
        .cx-surface { background:var(--surface); border:1px solid var(--line); border-radius:26px; box-shadow:0 14px 40px rgba(62,36,21,.07); }
        .cx-dark .cx-surface { box-shadow:0 14px 40px rgba(0,0,0,.35); }

        /* steps timeline */
        .cx-steps { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(4,1fr); position:relative; }
        .cx-steps::before { content:""; position:absolute; top:27px; left:6%; right:6%; height:2px; background:repeating-linear-gradient(90deg,var(--amber) 0 8px,transparent 8px 16px); }
        @media (max-width:900px){ .cx-steps { grid-template-columns:1fr 1fr; gap:28px 16px; } .cx-steps::before { display:none; } }
        .cx-steps li { padding:0 16px; text-align:center; position:relative; }
        .cx-steps .n { width:54px; height:54px; margin:0 auto 18px; border-radius:50%; display:grid; place-items:center; background:var(--amber); color:#2A1810; box-shadow:0 0 0 8px var(--bg); }
        .cx-steps h3 { font-size:21px; font-weight:600; margin-bottom:6px; }
        .cx-steps p { font-size:14px; line-height:1.65; color:var(--muted); }

        /* before-photo cards */
        .gx-before { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
        @media (max-width:1000px){ .gx-before { grid-template-columns:1fr 1fr; } } @media (max-width:560px){ .gx-before { grid-template-columns:1fr; } }
        .gx-bcard { padding:26px; transition:transform .3s, border-color .3s; }
        .gx-bcard:hover { transform:translateY(-4px); border-color:var(--amber); }
        .gx-bcard .ico { width:50px; height:50px; border-radius:16px; display:grid; place-items:center; margin-bottom:18px; background:rgba(227,162,75,.18); color:var(--amber-deep); }
        .gx-bcard h3 { font-size:21px; font-weight:600; margin-bottom:6px; }
        .gx-bcard p { font-size:14px; line-height:1.65; color:var(--muted); }

        /* distance lab (dark band, like Features) */
        .gx-lab { background:linear-gradient(160deg,#FFF6E8,#F6E3C4); color:#2A1810; padding:100px 0; position:relative; overflow:hidden; }
        .cx-dark .gx-lab { background:linear-gradient(160deg,#4A2E1D,#33200F); color:#fff; }
        .gx-lab-grid { display:grid; grid-template-columns:1.1fr 1fr; gap:56px; align-items:center; }
        @media (max-width:900px){ .gx-lab-grid { grid-template-columns:1fr; gap:36px; } }
        .gx-lab h2 { font-size:clamp(32px,4vw,50px); font-weight:600; line-height:1.1; }
        .gx-lab .lead { margin:14px 0 26px; font-size:17px; line-height:1.7; color:#5A4636; max-width:480px; }
        .cx-dark .gx-lab .lead { color:rgba(255,255,255,.85); }
        .gx-toggle { display:inline-flex; gap:6px; padding:6px; border-radius:99px; background:rgba(255,255,255,.7); border:1px solid rgba(62,36,21,.12); margin-bottom:24px; }
        .cx-dark .gx-toggle { background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.15); }
        .gx-toggle button { padding:11px 22px; border-radius:99px; border:0; background:none; color:#6F5E50; font-weight:700; font-size:14px; cursor:pointer; transition:all .25s; }
        .cx-dark .gx-toggle button { color:rgba(255,255,255,.7); }
        .gx-toggle button.on { background:#3E2415; color:#fff; box-shadow:0 8px 20px rgba(62,36,21,.3); }
        .cx-dark .gx-toggle button.on { background:var(--amber); color:#2A1810; }
        .gx-rules { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
        .gx-rules li { display:flex; gap:12px; align-items:flex-start; font-size:15px; line-height:1.6; animation:gxIn .5s both; }
        .gx-rules li:nth-child(2){animation-delay:.07s} .gx-rules li:nth-child(3){animation-delay:.14s} .gx-rules li:nth-child(4){animation-delay:.21s}
        @keyframes gxIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:none} }
        .gx-rules .ck { flex:none; width:24px; height:24px; border-radius:50%; display:grid; place-items:center; margin-top:1px; background:rgba(79,122,71,.16); color:var(--good); }
        .cx-dark .gx-rules .ck { color:#9BDB92; }

        .gx-stage { position:relative; padding:34px 30px 26px; border-radius:34px; background:linear-gradient(160deg,#4A2A18,#1F110A); color:#fff; box-shadow:0 30px 60px rgba(62,36,21,.3); overflow:hidden; }
        .gx-stage::before { content:""; position:absolute; inset:0; background:radial-gradient(circle at 85% 0%,rgba(227,162,75,.35),transparent 55%); pointer-events:none; }
        .gx-scene { position:relative; height:200px; }
        .gx-cam { position:absolute; left:0; top:50%; transform:translateY(-50%); width:56px; height:56px; border-radius:18px; display:grid; place-items:center; background:var(--amber); color:#2A1810; box-shadow:0 10px 24px rgba(227,162,75,.4); z-index:2; }
        .gx-beam { position:absolute; left:56px; top:50%; height:3px; margin-top:-1.5px; border-radius:3px; background:repeating-linear-gradient(90deg,#FFD79A 0 8px,transparent 8px 14px); transition:width .9s cubic-bezier(.2,.7,.2,1); }
        .gx-subject { position:absolute; top:50%; transition:left .9s cubic-bezier(.2,.7,.2,1); transform:translate(-50%,-50%); z-index:2; }
        .gx-subject svg { display:block; transition:transform .9s cubic-bezier(.2,.7,.2,1); }
        @keyframes gxFocus { 0%,100%{transform:scale(1.35);opacity:.4} 45%,70%{transform:scale(1);opacity:1} }
        .gx-frame { position:absolute; inset:-14px; border:2px solid #FFD79A; border-radius:16px; animation:gxFocus 3.2s ease-in-out infinite; }
        .gx-dist { position:absolute; top:50%; transform:translate(-50%,-34px); font-family:'Fraunces',serif; font-weight:600; font-size:15px; background:rgba(255,255,255,.14); padding:3px 12px; border-radius:99px; white-space:nowrap; transition:left .9s cubic-bezier(.2,.7,.2,1); }
        .gx-readout { position:relative; display:flex; align-items:baseline; justify-content:space-between; gap:14px; padding-top:18px; border-top:1px solid rgba(255,255,255,.16); }
        .gx-readout b { font-family:'Fraunces',serif; font-size:clamp(44px,6vw,64px); font-weight:600; color:#F6C47A; line-height:1; }
        .gx-readout span { font-size:14px; color:rgba(255,255,255,.8); text-align:right; }

        .gx-note { display:flex; gap:16px; align-items:flex-start; padding:26px 30px; margin-top:40px; background:linear-gradient(120deg,rgba(227,162,75,.2),rgba(227,162,75,.06)); border:1px solid rgba(227,162,75,.45); border-radius:28px; }
        .gx-note .ico { flex:none; width:46px; height:46px; border-radius:50%; display:grid; place-items:center; background:var(--amber); color:#2A1810; }
        .gx-note p { margin:0; font-size:15px; line-height:1.75; color:#5A4636; } .cx-dark .gx-note p { color:rgba(255,255,255,.85); }
        .gx-note strong { color:var(--amber-deep); }

        /* mistakes */
        .gx-mist { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        @media (max-width:900px){ .gx-mist { grid-template-columns:1fr 1fr; } } @media (max-width:560px){ .gx-mist { grid-template-columns:1fr; } }
        .gx-m { display:flex; align-items:center; gap:14px; padding:20px 22px; border-radius:22px; background:var(--surface); border:1px solid var(--line); transition:transform .3s, border-color .3s, background .3s; }
        .gx-m:hover { transform:translateY(-3px) rotate(-.6deg); border-color:#C62B33; }
        .gx-m .ico { flex:none; width:44px; height:44px; border-radius:14px; display:grid; place-items:center; background:rgba(198,43,51,.1); color:#C62B33; }
        .gx-m span { font-weight:700; font-size:15px; }

        /* checklist */
        .gx-check { display:grid; grid-template-columns:320px 1fr; border-radius:30px; overflow:hidden; }
        @media (max-width:900px){ .gx-check { grid-template-columns:1fr; } }
        .gx-ring-side { padding:36px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:14px; background:linear-gradient(160deg,var(--surface-2),var(--surface)); }
        .gx-ring { position:relative; width:150px; height:150px; }
        .gx-ring svg { transform:rotate(-90deg); }
        .gx-ring circle { fill:none; stroke-width:10; stroke-linecap:round; }
        .gx-ring .bg { stroke:var(--surface-2); } .gx-ring .fg { stroke:var(--amber); transition:stroke-dashoffset .6s cubic-bezier(.2,.7,.2,1), stroke .3s; }
        .gx-ring.ok .fg { stroke:var(--good); }
        .gx-ring b { position:absolute; inset:0; display:grid; place-items:center; font-family:'Fraunces',serif; font-size:34px; font-weight:600; }
        .gx-ring-side p { margin:0; font-size:14px; color:var(--muted); line-height:1.6; }
        .gx-items { padding:30px; display:flex; flex-direction:column; gap:12px; justify-content:center; }
        .gx-item { display:flex; align-items:center; gap:14px; width:100%; text-align:left; padding:16px 18px; border-radius:18px; background:var(--surface-2); border:1px solid var(--line); color:var(--ink); font-size:15px; font-weight:600; cursor:pointer; transition:all .25s; }
        .gx-item:hover { border-color:var(--amber); }
        .gx-item .box { flex:none; width:26px; height:26px; border-radius:50%; display:grid; place-items:center; border:2px solid var(--muted); color:transparent; transition:all .25s; }
        .gx-item.on { background:rgba(79,122,71,.12); border-color:rgba(79,122,71,.5); }
        .gx-item.on .box { background:var(--good); border-color:var(--good); color:#fff; transform:scale(1.1); }
        .gx-actions { display:flex; gap:12px; flex-wrap:wrap; margin-top:8px; }
        .gx-reset { background:none; border:1px solid var(--line); color:var(--muted); padding:15px 22px; border-radius:99px; font-weight:700; cursor:pointer; display:inline-flex; gap:8px; align-items:center; }
        .cx-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; box-shadow:none; }

        /* footer */
        .cx-footer { background:var(--surface); padding:28px 0; border-top:1px solid rgba(62,36,21,.05); }
        .cx-footer .cx-wrap { max-width:none; padding:0 36px; }
        .cx-foot-grid { display:flex; justify-content:space-between; align-items:center; }
        .cx-foot-brand b { font-family:'Fraunces',serif; font-size:22px; color:#4A2A18; letter-spacing:-.5px; } .cx-dark .cx-foot-brand b { color:var(--ink); }
        .cx-foot-copy { font-size:11px; color:rgba(42,24,16,.5); font-weight:600; text-transform:uppercase; letter-spacing:.5px; } .cx-dark .cx-foot-copy { color:var(--muted); }
        .cx-foot-links { display:flex; gap:36px; align-items:center; }
        .cx-foot-links button { background:none; border:0; font-size:11px; font-weight:700; color:var(--ink); cursor:pointer; padding:0; text-transform:uppercase; letter-spacing:1.5px; transition:color .2s; }
        .cx-foot-links button:hover { color:var(--amber-deep); }
        @media (max-width:800px){ .cx-foot-grid { flex-direction:column; gap:20px; text-align:center; } .cx-foot-links { gap:16px; flex-wrap:wrap; justify-content:center; } }

        @media (prefers-reduced-motion:reduce){ .cx-slide.on,.gx-frame,.gx-rules li { animation:none; } .gx-beam,.gx-subject,.gx-subject svg,.gx-dist { transition:none; } }
      `}</style>

      <div className={`cx-root ${isDark ? "cx-dark" : ""}`}>
        <Header navigate={navigate} />

        {/* ── HERO ── */}
        <div className="cx-scene">
          <div className="cx-slide on" style={{ backgroundImage: `url(${HERO_IMG})` }} />
          <div className="cx-shade" />
          <section className="gx-hero">
            <div className="cx-wrap">
              <h1>Shoot cinnamon the way the model sees it</h1>
              <div className="gx-hero-row">
                <p className="lead">
                  A few careful choices in how you take each photo make grade detection noticeably more reliable. Here is exactly what to do.
                </p>
                <div className="gx-cta">
                  <button className="cx-btn primary" onClick={() => document.getElementById("gx-lab")?.scrollIntoView({ behavior: "smooth" })}>
                    See the right distance
                  </button>
                  <button className="cx-btn ghost" onClick={() => navigate("/cinnamon")}>Go to detection</button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── STEPS ── */}
        <section className="cx-section">
          <div className="cx-wrap">
            <ScrollReveal direction="up">
              <div className="cx-sec-head">
                <h2>Four steps to a good photo</h2>
                <p>Follow them in order and your sample will be graded on the first try.</p>
              </div>
              <ol className="cx-steps">
                {STEPS.map(({ t, d, icon: Icon }) => (
                  <li key={t}>
                    <div className="n"><Icon size={22} strokeWidth={2} /></div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </li>
                ))}
              </ol>
            </ScrollReveal>
          </div>
        </section>

        {/* ── BEFORE YOU SHOOT ── */}
        <section className="cx-section" style={{ paddingTop: 0 }}>
          <div className="cx-wrap">
            <ScrollReveal direction="up">
              <div className="cx-sec-head">
                <h2>Before taking the photo</h2>
                <p>Set the scene first. It takes under a minute.</p>
              </div>
            </ScrollReveal>
            <div className="gx-before">
              {BEFORE.map(({ icon: Icon, t, d }, i) => (
                <ScrollReveal key={t} direction="up" delay={i * 0.08}>
                  <div className="cx-surface gx-bcard">
                    <div className="ico"><Icon size={24} strokeWidth={1.8} /></div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── DISTANCE LAB ── */}
        <section id="gx-lab" className="gx-lab">
          <div className="cx-wrap">
            <div className="gx-lab-grid">
              <ScrollReveal direction="left">
                <div>
                  <h2>Pick your sample, keep the distance</h2>
                  <p className="lead">Switch between a single quill and a bundle to see how far the camera should be and what to check.</p>
                  <div className="gx-toggle" role="tablist">
                    {Object.entries(MODES).map(([k, v]) => (
                      <button key={k} role="tab" aria-selected={mode === k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}>{v.label}</button>
                    ))}
                  </div>
                  <ul className="gx-rules" key={mode}>
                    {m.rules.map((r) => (
                      <li key={r}><span className="ck"><CheckCircle2 size={14} strokeWidth={2.6} /></span>{r}</li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up">
                <div className="gx-stage">
                  <div className="gx-scene">
                    <div className="gx-cam"><Camera size={26} strokeWidth={1.9} /></div>
                    <div className="gx-beam" style={{ width: `calc(${m.pct}% - 56px)` }} />
                    <div className="gx-dist" style={{ left: `${m.pct / 2 + 8}%` }}>{m.inch}</div>
                    <div className="gx-subject" style={{ left: `${m.pct + 6}%` }}>
                      <div className="gx-frame" />
                      <svg width="64" height="64" viewBox="0 0 80 80" style={{ transform: `scale(${m.scale})` }}>
                        <defs>
                          <linearGradient id="gxBark" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#B57F49" /><stop offset="100%" stopColor="#7A4A25" /></linearGradient>
                          <linearGradient id="gxBarkV" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D2A068" /><stop offset="55%" stopColor="#A06A3A" /><stop offset="100%" stopColor="#6B3E1D" /></linearGradient>
                        </defs>
                        {mode === "quill" ? (
                          <>
                            {/* one cinnamon quill lying on its side, rolled end facing the camera */}
                            <rect x="16" y="28" width="58" height="24" rx="12" fill="url(#gxBarkV)" />
                            {[33, 40, 47].map((y) => (
                              <path key={y} d={`M24 ${y} Q46 ${y - 2} 70 ${y}`} stroke="rgba(0,0,0,0.16)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                            ))}
                            <path d="M30 31 Q48 29 68 31" stroke="rgba(255,235,200,0.35)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                            <ellipse cx="18" cy="40" rx="8" ry="12.5" fill="#E7C79B" />
                            <ellipse cx="18" cy="40" rx="5.8" ry="9.4" fill="none" stroke="#B57F49" strokeWidth="1.3" />
                            <ellipse cx="18" cy="40" rx="3.6" ry="6.2" fill="none" stroke="#9A6535" strokeWidth="1.3" />
                            <ellipse cx="18" cy="40" rx="1.6" ry="3" fill="#6B3E1D" />
                          </>
                        ) : (
                          <>
                            {[-16, -6, 4, 14].map((dx, i) => (
                              <g key={i} transform={`translate(${dx} 0) rotate(${(i - 1.5) * 6} 40 40)`}>
                                <rect x="30" y="10" width="20" height="58" rx="10" fill="url(#gxBark)" />
                                <ellipse cx="40" cy="12" rx="8" ry="3.4" fill="#E7C79B" />
                              </g>
                            ))}
                            <path d="M18 44 Q40 52 62 44" stroke="#D9AE79" strokeWidth="4" fill="none" strokeLinecap="round" />
                          </>
                        )}
                      </svg>
                    </div>
                  </div>
                  <div className="gx-readout">
                    <b>{m.inch}</b>
                    <span>about {m.cm} from the camera<br />{m.label.toLowerCase()} shot</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal direction="up">
              <div className="gx-note">
                <span className="ico"><Ruler size={22} strokeWidth={2} /></span>
                <p>
                  <strong>Why distance matters:</strong> camera distance changes how large or small a quill appears in the frame. Keeping to 4 in for a single quill and 12 in for a bundle helps the model compare images fairly and gives more reliable results.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── MISTAKES ── */}
        <section className="cx-section">
          <div className="cx-wrap">
            <ScrollReveal direction="up">
              <div className="cx-sec-head">
                <h2>Mistakes that cost accuracy</h2>
                <p>If your photo has any of these, retake it before you upload.</p>
              </div>
            </ScrollReveal>
            <div className="gx-mist">
              {MISTAKES.map(({ icon: Icon, t }, i) => (
                <ScrollReveal key={t} direction="up" delay={i * 0.06}>
                  <div className="gx-m"><span className="ico"><Icon size={20} strokeWidth={2} /></span><span>{t}</span></div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CHECKLIST ── */}
        <section className="cx-section" style={{ paddingTop: 0 }}>
          <div className="cx-wrap">
            <ScrollReveal direction="up">
              <div className="cx-sec-head">
                <h2>Quick checklist before uploading</h2>
                <p>Tap each item as you confirm it. The ring fills as you go.</p>
              </div>
              <div className="cx-surface gx-check">
                <div className="gx-ring-side">
                  <div className={`gx-ring ${done ? "ok" : ""}`}>
                    <svg width="150" height="150" viewBox="0 0 150 150">
                      <circle className="bg" cx="75" cy="75" r="65" />
                      <circle className="fg" cx="75" cy="75" r="65" strokeDasharray={2 * Math.PI * 65}
                        strokeDashoffset={2 * Math.PI * 65 * (1 - checked.length / CHECKLIST.length)} />
                    </svg>
                    <b>{checked.length}/{CHECKLIST.length}</b>
                  </div>
                  <p>{done ? "All set. Your photo is ready to grade." : "Confirm every item to get ready."}</p>
                </div>
                <div className="gx-items">
                  {CHECKLIST.map((c, i) => (
                    <button key={c} className={`gx-item ${checked.includes(i) ? "on" : ""}`} onClick={() => toggle(i)} aria-pressed={checked.includes(i)}>
                      <span className="box"><CheckCircle2 size={16} strokeWidth={3} /></span>{c}
                    </button>
                  ))}
                  <div className="gx-actions">
                    <button className="cx-btn primary" disabled={!done} onClick={() => navigate("/cinnamon")}>
                      Upload my photo <ArrowRight size={18} />
                    </button>
                    {checked.length > 0 && (
                      <button className="gx-reset" onClick={() => setChecked([])}><RotateCcw size={16} />Reset</button>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── FOOTER (same as Cinnamon page) ── */}
        <footer className="cx-footer">
          <div className="cx-wrap">
            <div className="cx-foot-grid">
              <div className="cx-foot-brand"><b>Ceylon Cinnamon</b></div>
              <div className="cx-foot-links">
                <button onClick={() => navigate("/cinnamon")}>Detection</button>
                <button onClick={() => navigate("/cinnamon/guidelines")}>Guidelines</button>
                <button onClick={() => navigate("/cinnamon/history")}>History</button>
              </div>
              <div className="cx-foot-copy"><span>© 2025 Ceylon Cinnamon</span></div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}