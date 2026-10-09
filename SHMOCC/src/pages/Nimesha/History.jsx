import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../hooks/useScrollReveal.jsx";
import { useTheme } from "../../context/ThemeProvider";
import heroImg from "../../assets/10.png"; 

/* ── data ─────────────────────────────────────────────── */
const GRADE_THEME = {
  Alba: { rings: ["#FBF1E1", "#EFD5AC", "#C89A63"], accent: "#B8863B", label: "Finest, palest quill", dia: "< 0.5 mm" },
  C5: { rings: ["#EFD9B8", "#CB9A61", "#8C5A32"], accent: "#A9642F", label: "Fine commercial grade", dia: "< 1 mm" },
  C4: { rings: ["#D9AE79", "#A9642F", "#6E3E20"], accent: "#8C5A32", label: "Standard commercial grade", dia: "1 – 1.5 mm" },
  H2: { rings: ["#B98452", "#7A4A26", "#43281A"], accent: "#7A2E1E", label: "Heavier bark grade", dia: "2 – 3 mm" },
};
const DEFAULT_THEME = { rings: ["#E3D2C0", "#B08968", "#6E4A32"], accent: "#6B5B4E", label: "Ungraded batch", dia: "—" };
const themeOf = (g) => GRADE_THEME[g] || DEFAULT_THEME;

function statusKind(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("fail") || s.includes("reject") || s.includes("error")) return "bad";
  if (s.includes("mixed") || s.includes("pending") || s.includes("process")) return "warn";
  return "ok";
}

function timeAgo(dateStr) {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

const money = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d, opts) => new Date(d).toLocaleString(undefined, opts);

/* quill cross-section badge */
function QuillBadge({ grade, size = 56 }) {
  const t = themeOf(grade);
  return (
    <div
      className="hx-quill"
      style={{
        width: size, height: size,
        background: `radial-gradient(circle at 32% 30%, ${t.rings[0]} 0%, ${t.rings[0]} 22%, ${t.rings[1]} 23%, ${t.rings[1]} 55%, ${t.rings[2]} 56%, ${t.rings[2]} 100%)`,
      }}
    >
      <span style={{ fontSize: size * 0.26 }}>{grade}</span>
    </div>
  );
}

/* header: same as the other pages, History active */
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
          <button className="link" onClick={() => go("/cinnamon/guidelines")}>Guideline to get images</button>
          <button className="link active" onClick={() => go("/cinnamon/history")}>History</button>
          {isAdmin && <button className="link" onClick={() => go("/cinnamon/admin")}>Admin</button>}
          <button className="cx-logout" onClick={logout}>Logout</button>
        </nav>
      </div>
    </header>
  );
}

/* ── page ─────────────────────────────────────────────── */
export default function History() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");

  const isAdmin = localStorage.getItem("cinnamonRole") === "admin";

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("cinnamonToken");
      const response = await fetch("https://cinnamon-backend.agreeableisland-ddd74309.southeastasia.azurecontainerapps.io/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  // close the detail card with Escape and lock page scroll while it is open
  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [selected]);

  // display-only aggregates
  const gradeCounts = history.reduce((acc, item) => {
    const g = item.final_grade || "—";
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const gradeKeys = Object.keys(gradeCounts);
  const maxCount = Math.max(1, ...Object.values(gradeCounts));
  const topGrade = gradeKeys.sort((a, b) => gradeCounts[b] - gradeCounts[a])[0];
  const latest = history[0];
  const list = filter === "All" ? history : history.filter((i) => i.final_grade === filter);

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

        /* header (same as other pages) */
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

        /* hero */
        .cx-scene { position:relative; isolation:isolate; overflow:hidden; color:#fff; border-radius:0 0 56px 56px; }
        .cx-slide { position:absolute; inset:0; background-size:cover; background-position:center 35%; z-index:-2; animation:cxZoom 14s ease-out both; }
        @keyframes cxZoom { from{transform:scale(1)} to{transform:scale(1.08)} }
        .cx-shade { position:absolute; inset:0; z-index:-1; background:linear-gradient(95deg,rgba(20,10,5,.9) 0%,rgba(20,10,5,.55) 50%,rgba(20,10,5,.3) 100%),linear-gradient(180deg,rgba(20,10,5,.05) 0%,rgba(20,10,5,.5) 50%,rgba(20,10,5,.9) 100%); }
        .hx-hero { min-height:52vh; display:flex; align-items:flex-end; padding:130px 0 48px; }
        .hx-hero .cx-wrap { width:100%; display:grid; grid-template-columns:1.2fr 1fr; gap:40px; align-items:end; }
        @media (max-width:900px){ .hx-hero .cx-wrap { grid-template-columns:1fr; } }
        .hx-hero h1 { font-size:clamp(34px,4.8vw,64px); line-height:1.06; font-weight:600; color:#fff; text-shadow:0 4px 30px rgba(0,0,0,.4); }
        .hx-hero p.lead { margin:18px 0 0; max-width:520px; font-size:16px; line-height:1.7; color:rgba(255,255,255,.9); }
        .hx-cta { display:flex; gap:12px; margin-top:28px; flex-wrap:wrap; }
        .hx-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        @media (max-width:560px){ .hx-stats { grid-template-columns:1fr; } }
        .hx-stat { padding:20px 22px; border-radius:24px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.25); backdrop-filter:blur(18px); animation:hxUp .8s both; }
        .hx-stat:nth-child(2){animation-delay:.12s} .hx-stat:nth-child(3){animation-delay:.24s}
        .hx-stat small { display:block; font-size:12px; font-weight:700; color:rgba(255,255,255,.75); }
        .hx-stat b { display:block; margin-top:6px; font-family:'Fraunces',serif; font-size:clamp(26px,3vw,38px); font-weight:600; color:#F6C47A; line-height:1.1; }
        .hx-stat span { display:block; margin-top:4px; font-size:12px; color:rgba(255,255,255,.8); }
        @keyframes hxUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }

        /* sections */
        .cx-section { padding:90px 0; }
        .cx-sec-head { max-width:640px; margin-bottom:36px; }
        .cx-sec-head h2 { font-size:clamp(30px,4vw,48px); font-weight:600; line-height:1.1; }
        .cx-sec-head p { margin-top:12px; color:var(--muted); font-size:16px; line-height:1.7; }
        .cx-surface { background:var(--surface); border:1px solid var(--line); border-radius:26px; box-shadow:0 14px 40px rgba(62,36,21,.07); }
        .cx-dark .cx-surface { box-shadow:0 14px 40px rgba(0,0,0,.35); }
        .cx-dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:#6FAE63; margin-right:8px; box-shadow:0 0 0 4px rgba(111,174,99,.2); }

        /* quill badge */
        .hx-quill { position:relative; flex:none; border-radius:50%; display:grid; place-items:center; border:1px solid rgba(62,27,18,.15); box-shadow:0 6px 16px rgba(62,27,18,.22); transition:transform .4s cubic-bezier(.2,.7,.2,1); }
        .hx-quill::after { content:""; position:absolute; inset:-5px; border-radius:50%; border:1.5px dashed rgba(185,112,31,.45); animation:hxSpin 18s linear infinite; }
        .hx-quill span { font-family:'Fraunces',serif; font-weight:600; color:#2C1B12; text-shadow:0 1px 2px rgba(255,255,255,.4); }
        @keyframes hxSpin { to{transform:rotate(360deg)} }

        /* distribution */
        .hx-dist { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:16px; padding:28px; }
        .hx-d { display:flex; flex-direction:column; gap:10px; padding:18px; border-radius:20px; background:var(--surface-2); border:1px solid var(--line); }
        .hx-d-top { display:flex; align-items:center; gap:12px; }
        .hx-d-top b { font-family:'Fraunces',serif; font-size:32px; font-weight:600; line-height:1; }
        .hx-d-top span { font-size:13px; font-weight:700; color:var(--muted); }
        .hx-bar { height:8px; border-radius:99px; background:var(--surface); overflow:hidden; }
        .hx-bar i { display:block; height:100%; border-radius:99px; transform-origin:left; animation:hxGrow 1.1s cubic-bezier(.2,.7,.2,1) both; }
        @keyframes hxGrow { from{transform:scaleX(0)} }

        /* filters */
        .hx-filters { display:inline-flex; flex-wrap:wrap; gap:6px; padding:6px; border-radius:99px; background:var(--surface); border:1px solid var(--line); margin-bottom:30px; }
        .hx-f { display:inline-flex; gap:8px; align-items:center; padding:10px 20px; border-radius:99px; border:0; background:none; color:var(--muted); font-weight:700; font-size:14px; cursor:pointer; transition:all .25s; }
        .hx-f:hover { color:var(--ink); }
        .hx-f em { font-style:normal; font-size:12px; padding:2px 8px; border-radius:99px; background:var(--surface-2); }
        .hx-f.on { background:var(--bark); color:#fff; box-shadow:0 8px 20px rgba(62,36,21,.3); }
        .cx-dark .hx-f.on { background:var(--amber); color:#2A1810; }
        .hx-f.on em { background:rgba(255,255,255,.2); color:inherit; }

        /* timeline */
        .hx-tl { position:relative; display:flex; flex-direction:column; gap:16px; padding-left:42px; }
        .hx-tl::before { content:""; position:absolute; top:10px; bottom:10px; left:11px; width:2px; background:repeating-linear-gradient(180deg,var(--amber) 0 8px,transparent 8px 16px); }
        .hx-item { position:relative; }
        .hx-item::before { content:""; position:absolute; left:-39px; top:50%; width:16px; height:16px; margin-top:-8px; border-radius:50%; background:var(--amber); box-shadow:0 0 0 6px var(--bg); transition:transform .3s; }
        .hx-item:first-child::before { animation:hxPing 2.2s ease-out infinite; }
        @keyframes hxPing { 0%{box-shadow:0 0 0 6px var(--bg),0 0 0 6px rgba(227,162,75,.6)} 100%{box-shadow:0 0 0 6px var(--bg),0 0 0 18px rgba(227,162,75,0)} }
        .hx-item:hover::before { transform:scale(1.35); }
        .hx-card { width:100%; text-align:left; display:grid; grid-template-columns:auto 1fr auto auto; gap:20px; align-items:center; padding:18px 24px; border-radius:26px; background:var(--surface); border:1px solid var(--line); color:var(--ink); cursor:pointer; box-shadow:0 10px 30px rgba(62,36,21,.06); transition:transform .3s, border-color .3s, box-shadow .3s; }
        .cx-dark .hx-card { box-shadow:0 10px 30px rgba(0,0,0,.3); }
        .hx-card:hover { transform:translateX(6px); border-color:var(--amber); box-shadow:0 18px 40px rgba(227,162,75,.22); }
        .hx-card:hover .hx-quill { transform:scale(1.08) rotate(-6deg); }
        .hx-card h3 { font-size:22px; font-weight:600; }
        .hx-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:4px; }
        .hx-when { font-size:13px; color:var(--muted); font-weight:600; }
        .hx-chip { display:inline-flex; gap:6px; align-items:center; padding:4px 12px; border-radius:99px; font-size:12px; font-weight:700; }
        .hx-chip i { width:6px; height:6px; border-radius:50%; background:currentColor; }
        .hx-chip.ok { background:rgba(79,122,71,.14); color:#4F7A47; } .hx-chip.warn { background:rgba(227,162,75,.2); color:var(--amber-deep); } .hx-chip.bad { background:rgba(198,43,51,.12); color:#C62B33; }
        .cx-dark .hx-chip.ok { color:#9BDB92; }
        .hx-mix { display:flex; width:150px; height:8px; gap:2px; border-radius:99px; overflow:hidden; background:var(--surface-2); }
        .hx-mix i { display:block; height:100%; }
        .hx-meta { text-align:right; font-size:12px; color:var(--muted); font-weight:600; display:flex; flex-direction:column; gap:6px; align-items:flex-end; }
        .hx-go { width:38px; height:38px; border-radius:50%; display:grid; place-items:center; background:var(--surface-2); color:var(--amber-deep); font-size:16px; transition:all .3s; }
        .hx-card:hover .hx-go { background:var(--amber); color:#2A1810; transform:translateX(3px); }
        @media (max-width:760px){ .hx-card { grid-template-columns:auto 1fr auto; padding:16px; gap:14px; } .hx-meta { display:none; } .hx-tl { padding-left:30px; } .hx-item::before { left:-27px; } .hx-tl::before { left:5px; } }

        /* states */
        .hx-state { text-align:center; padding:70px 30px; }
        .hx-state h3 { font-size:30px; margin:20px 0 10px; }
        .hx-state p { color:var(--muted); max-width:440px; margin:0 auto 26px; line-height:1.7; }
        .hx-spin { width:54px; height:54px; margin:0 auto; border-radius:50%; border:4px solid var(--surface-2); border-top-color:var(--amber); animation:hxSpin 1s linear infinite; }

        /* grade reference band */
        .hx-ref { background:linear-gradient(160deg,#FFF6E8,#F6E3C4); color:#2A1810; padding:100px 0; position:relative; overflow:hidden; }
        .cx-dark .hx-ref { background:linear-gradient(160deg,#4A2E1D,#33200F); color:#fff; }
        .hx-ref .cx-sec-head p { color:#5A4636; } .cx-dark .hx-ref .cx-sec-head p { color:rgba(255,255,255,.85); }
        .hx-ref-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
        @media (max-width:1000px){ .hx-ref-grid { grid-template-columns:1fr 1fr; } } @media (max-width:560px){ .hx-ref-grid { grid-template-columns:1fr; } }
        .hx-rc { display:flex; flex-direction:column; align-items:flex-start; gap:16px; padding:26px; border-radius:26px; background:rgba(255,255,255,.75); border:1px solid rgba(62,36,21,.12); transition:transform .3s, border-color .3s; color:#2A1810; }
        .cx-dark .hx-rc { background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.15); color:#fff; }
        .hx-rc:hover { transform:translateY(-6px); border-color:var(--amber); }
        .hx-rc h3 { font-size:22px; font-weight:600; }
        .hx-rc p { margin:4px 0 0; font-size:14px; line-height:1.6; color:#5A4636; } .cx-dark .hx-rc p { color:rgba(255,255,255,.8); }
        .hx-rc .dia { padding:4px 12px; border-radius:99px; font-size:12px; font-weight:700; background:rgba(62,36,21,.08); color:#5A3A22; }
        .cx-dark .hx-rc .dia { background:rgba(255,255,255,.14); color:#fff; }

        /* detail modal */
        .hx-modal { position:fixed; inset:0; z-index:1000; background:rgba(15,8,4,.78); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; padding:16px; animation:hxFade .25s both; }
        @keyframes hxFade { from{opacity:0} to{opacity:1} }
        .hx-box { width:100%; max-width:780px; max-height:88vh; display:flex; flex-direction:column; overflow:hidden; border-radius:34px; background:var(--surface); border:1px solid var(--line); box-shadow:0 40px 90px rgba(0,0,0,.55); animation:hxPop .45s cubic-bezier(.2,.8,.2,1) both; color:var(--ink); }
        @keyframes hxPop { from{opacity:0;transform:translateY(24px) scale(.96)} to{opacity:1;transform:none} }
        .hx-mh { position:relative; padding:30px 34px; color:#fff; display:flex; gap:20px; align-items:center; flex:none; overflow:hidden; }
        .hx-mh::after { content:""; position:absolute; inset:0; background:radial-gradient(circle at 90% 0%,rgba(255,255,255,.28),transparent 55%); pointer-events:none; }
        .hx-mh small { display:block; font-size:13px; color:rgba(255,255,255,.85); font-weight:600; margin-bottom:4px; }
        .hx-mh h2 { color:#fff; font-size:clamp(28px,4vw,38px); font-weight:600; }
        .hx-mh .hx-chip { background:rgba(255,255,255,.22); color:#fff; margin-top:10px; }
        .hx-x { position:absolute; top:18px; right:18px; z-index:2; width:38px; height:38px; border-radius:50%; border:0; background:rgba(255,255,255,.9); color:var(--bark); font-size:22px; line-height:1; cursor:pointer; transition:transform .25s; }
        .hx-x:hover { transform:rotate(90deg); }
        .hx-mb { padding:30px 34px 34px; overflow-y:auto; display:flex; flex-direction:column; gap:28px; }
        .hx-facts { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        @media (max-width:640px){ .hx-facts { grid-template-columns:1fr; } }
        .hx-fact { padding:18px 20px; border-radius:20px; background:var(--surface-2); border:1px solid var(--line); }
        .hx-fact small { display:block; font-size:12px; font-weight:700; color:var(--muted); }
        .hx-fact b { display:block; margin-top:6px; font-family:'Fraunces',serif; font-size:22px; font-weight:600; }
        .hx-fact span { display:block; margin-top:2px; font-size:12px; color:var(--muted); }
        .hx-mb h4 { font-size:22px; font-weight:600; margin-bottom:14px; }
        .hx-crow { display:grid; grid-template-columns:50px 1fr 90px; gap:14px; align-items:center; padding:7px 0; font-size:14px; font-weight:700; }
        .hx-crow .tr { height:12px; border-radius:99px; background:var(--surface-2); overflow:hidden; }
        .hx-crow .tr i { display:block; height:100%; border-radius:99px; transform-origin:left; animation:hxGrow 1s cubic-bezier(.2,.7,.2,1) both; }
        .hx-crow span:last-child { text-align:right; color:var(--muted); font-size:13px; }
        .hx-fc { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        @media (max-width:700px){ .hx-fc { grid-template-columns:1fr; } }
        .hx-fct { padding:22px; border-radius:24px; background:var(--surface-2); border:1px solid var(--line); }
        .hx-fct.p { background:linear-gradient(145deg,#4A2A18,#1F110A); color:#fff; border-color:var(--amber); }
        .hx-fct small { font-size:13px; font-weight:700; color:var(--amber-deep); } .hx-fct.p small { color:#F6C47A; }
        .hx-fct b { display:block; margin:8px 0 12px; font-family:'Fraunces',serif; font-size:24px; font-weight:600; }
        .hx-fct b span { font-family:'Manrope',sans-serif; font-size:12px; font-weight:500; opacity:.7; }
        .hx-fct strong { display:block; font-size:15px; margin-bottom:4px; }
        .hx-fct p { margin:0; font-size:13px; line-height:1.6; color:var(--muted); } .hx-fct.p p { color:rgba(255,255,255,.85); }

        /* footer (same as other pages) */
        .cx-footer { background:var(--surface); padding:28px 0; border-top:1px solid rgba(62,36,21,.05); }
        .cx-footer .cx-wrap { max-width:none; padding:0 36px; }
        .cx-foot-grid { display:flex; justify-content:space-between; align-items:center; }
        .cx-foot-brand b { font-family:'Fraunces',serif; font-size:22px; color:#4A2A18; letter-spacing:-.5px; } .cx-dark .cx-foot-brand b { color:var(--ink); }
        .cx-foot-copy { font-size:11px; color:rgba(42,24,16,.5); font-weight:600; text-transform:uppercase; letter-spacing:.5px; } .cx-dark .cx-foot-copy { color:var(--muted); }
        .cx-foot-links { display:flex; gap:36px; align-items:center; }
        .cx-foot-links button { background:none; border:0; font-size:11px; font-weight:700; color:var(--ink); cursor:pointer; padding:0; text-transform:uppercase; letter-spacing:1.5px; transition:color .2s; }
        .cx-foot-links button:hover { color:var(--amber-deep); }
        @media (max-width:800px){ .cx-foot-grid { flex-direction:column; gap:20px; text-align:center; } .cx-foot-links { gap:16px; flex-wrap:wrap; justify-content:center; } }

        @media (prefers-reduced-motion:reduce){ .cx-slide,.hx-quill::after,.hx-item::before,.hx-stat,.hx-bar i,.hx-crow .tr i,.hx-box,.hx-modal,.hx-spin { animation:none; } }
      `}</style>

      <div className={`cx-root ${isDark ? "cx-dark" : ""}`}>
        <Header navigate={navigate} />

        {/* ── HERO ── */}
        <div className="cx-scene">
          <div className="cx-slide" style={{ backgroundImage: `url(${heroImg})` }} />
          <div className="cx-shade" />
          <section className="hx-hero">
            <div className="cx-wrap">
              <div>
                <h1>Every batch you have graded, in one place</h1>
                <p className="lead">Open any batch to see its grade mix, quill count and the market price outlook from that day.</p>
                
              </div>
              {history.length > 0 && (
                <div className="hx-stats">
                  <div className="hx-stat"><small>Batches graded</small><b>{history.length}</b><span>since you started</span></div>
                  <div className="hx-stat"><small>Most common</small><b>{topGrade}</b><span>{gradeCounts[topGrade]} batch{gradeCounts[topGrade] === 1 ? "" : "es"}</span></div>
                  <div className="hx-stat"><small>Latest</small><b>{latest?.final_grade || "—"}</b><span>{latest ? timeAgo(latest.createdAt) : ""}</span></div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── CONTENT ── */}
        <section className="cx-section">
          <div className="cx-wrap">
            {loading ? (
              <div className="cx-surface hx-state">
                <div className="hx-spin" />
                <h3>{isAdmin ? "Loading system history" : "Loading your history"}</h3>
                <p>{isAdmin ? "Fetching all user detections…" : "Fetching your graded batches…"}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="cx-surface hx-state">
                <QuillBadge grade="Alba" size={84} />
                <h3>{isAdmin ? "No detections found" : "Nothing graded yet"}</h3>
                <p>{isAdmin ? "When users run detections, they will appear here." : "Run your first detection and it will appear here with its grade, market forecast and full breakdown."}</p>
                {!isAdmin && <button className="cx-btn primary" onClick={() => navigate("/cinnamon")}>Start a detection</button>}
              </div>
            ) : (
              <>
                <ScrollReveal direction="up">
                  <div className="cx-sec-head">
                    <h2>{isAdmin ? "Test Records" : "Your grade mix"}</h2>
                    <p>{isAdmin ? "Overview of all grade detection tests performed by the admin." : "How your batches split across grades."}</p>
                  </div>
                  <div className="cx-surface hx-dist" style={{ marginBottom: 64 }}>
                    {Object.entries(gradeCounts).map(([grade, count]) => {
                      const t = themeOf(grade);
                      return (
                        <div key={grade} className="hx-d">
                          <div className="hx-d-top">
                            <QuillBadge grade={grade} size={46} />
                            <div><b>{count}</b><span> batch{count === 1 ? "" : "es"}</span></div>
                          </div>
                          <div className="hx-bar"><i style={{ width: `${(count / maxCount) * 100}%`, background: t.accent }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="up">
                  <div className="cx-sec-head">
                    <h2>Detection history</h2>
                    <p>Newest first. Tap a batch to open its full report.</p>
                  </div>
                  <div className="hx-filters" role="tablist">
                    {["All", ...Object.keys(gradeCounts)].map((g) => (
                      <button key={g} role="tab" aria-selected={filter === g} className={`hx-f ${filter === g ? "on" : ""}`} onClick={() => setFilter(g)}>
                        {g}<em>{g === "All" ? history.length : gradeCounts[g]}</em>
                      </button>
                    ))}
                  </div>
                </ScrollReveal>

                <div className="hx-tl" key={filter}>
                  {list.map((item, i) => {
                    const entries = item.details ? Object.entries(item.details) : [];
                    const total = entries.reduce((s, [, v]) => s + v, 0);
                    return (
                      <ScrollReveal key={item._id || i} direction="up" delay={Math.min(i, 6) * 0.05}>
                        <div className="hx-item">
                          <button className="hx-card" onClick={() => setSelected(item)}>
                            <QuillBadge grade={item.final_grade} size={56} />
                            <div style={{ minWidth: 0 }}>
                              <div className="hx-row">
                                <h3>Grade {item.final_grade}</h3>
                                <span className={`hx-chip ${statusKind(item.status)}`}><i />{item.status}</span>
                              </div>
                              <div className="hx-when">
                                {fmtDate(item.createdAt, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                            <div className="hx-meta">
                              {total > 0 && (
                                <div className="hx-mix" title="Grade mix">
                                  {entries.map(([g, c]) => <i key={g} style={{ width: `${(c / total) * 100}%`, background: themeOf(g).accent }} />)}
                                </div>
                              )}
                              <span>{total ? `${total} quill${total === 1 ? "" : "s"} · ` : ""}{timeAgo(item.createdAt)}</span>
                            </div>
                            <span className="hx-go">→</span>
                          </button>
                        </div>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── GRADE REFERENCE ── */}
        <section className="hx-ref">
          <div className="cx-wrap">
            <ScrollReveal direction="up">
              <div className="cx-sec-head">
                <h2>Reading a quill's grade</h2>
                <p>Each badge mirrors a real quill cross-section: paler and thinner rings for the finer grades, darker and thicker as the grade drops.</p>
              </div>
            </ScrollReveal>
            <div className="hx-ref-grid">
              {Object.entries(GRADE_THEME).map(([grade, t], i) => (
                <ScrollReveal key={grade} direction="up" delay={i * 0.08}>
                  <div className="hx-rc">
                    <QuillBadge grade={grade} size={68} />
                    <div>
                      <h3>{grade}</h3>
                      <p>{t.label}</p>
                    </div>
                    <span className="dia">Diameter {t.dia}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER (same as other pages) ── */}
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

        {/* ── DETAIL MODAL ── */}
        {selected && (() => {
          const t = themeOf(selected.final_grade);
          const entries = selected.details ? Object.entries(selected.details).sort((a, b) => b[1] - a[1]) : [];
          const total = entries.reduce((s, [, v]) => s + v, 0);
          const dominant = entries[0]?.[0] || selected.final_grade;
          const fc = selected.market_price_forecast;
          const tiles = fc && fc.available !== false
            ? [["This week", fc.this_week, true], ["Next week", fc.next_week, false], ["Next month", fc.next_month, false]].filter(([, d]) => d?.best_market)
            : [];
          return (
            <div className="hx-modal" onClick={() => setSelected(null)}>
              <div className="hx-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="hx-mh" style={{ background: `linear-gradient(135deg, ${t.rings[1]}, ${t.rings[2]})` }}>
                  <button className="hx-x" onClick={() => setSelected(null)} aria-label="Close">×</button>
                  <QuillBadge grade={selected.final_grade} size={72} />
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <small>Detection overview</small>
                    <h2>Grade {selected.final_grade}</h2>
                    <span className="hx-chip"><i />{selected.status}</span>
                  </div>
                </div>

                <div className="hx-mb">
                  <div className="hx-facts">
                    <div className="hx-fact">
                      <small>Recorded</small>
                      <b style={{ fontSize: 17 }}>{fmtDate(selected.createdAt, { month: "short", day: "numeric", year: "numeric" })}</b>
                      <span>{fmtDate(selected.createdAt, { hour: "2-digit", minute: "2-digit" })} · {timeAgo(selected.createdAt)}</span>
                    </div>
                    <div className="hx-fact">
                      <small>Quills identified</small>
                      <b>{total || "—"}</b>
                      <span>across {entries.length} grade{entries.length === 1 ? "" : "s"}</span>
                    </div>
                    <div className="hx-fact">
                      <small>Dominant grade</small>
                      <b>{dominant}</b>
                      <span>ref #{String(selected._id || "").slice(-6)}</span>
                    </div>
                  </div>

                  {entries.length > 0 && (
                    <div>
                      <h4>Composition breakdown</h4>
                      {entries.map(([key, value]) => {
                        const pct = total ? Math.round((value / total) * 100) : 0;
                        return (
                          <div key={key} className="hx-crow">
                            <span>{key}</span>
                            <div className="tr"><i style={{ width: `${pct}%`, background: themeOf(key).accent }} /></div>
                            <span>{value} · {pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {tiles.length > 0 && (
                    <div>
                      <h4>Market price forecast</h4>
                      <div className="hx-fc">
                        {tiles.map(([label, d, primary]) => (
                          <div key={label} className={`hx-fct ${primary ? "p" : ""}`}>
                            <small>{label}</small>
                            <b>LKR {money(d.best_market.predicted_price)}<span> /kg</span></b>
                            <strong>{d.best_market.district}</strong>
                            {d.recommendation && <p>{d.recommendation}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}