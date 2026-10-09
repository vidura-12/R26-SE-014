import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../hooks/useScrollReveal.jsx";
import { useTheme } from "../../context/ThemeProvider";
import {
  Users, ScanLine, Layers, CalendarDays, Trash2, Search, RefreshCw,
  AlertTriangle, X, Inbox, ShieldCheck, LayoutDashboard,
} from "lucide-react";

/* ── config ───────────────────────────────────────────── */
const API = "https://cinnamon-backend.agreeableisland-ddd74309.southeastasia.azurecontainerapps.io";

const GRADES = ["Alba", "C5", "C4", "H2"];

// Same quill cross-section palette used on the History page
const GRADE_THEME = {
  Alba: { rings: ["#FBF1E1", "#EFD5AC", "#C89A63"], accent: "#B8863B" },
  C5: { rings: ["#EFD9B8", "#CB9A61", "#8C5A32"], accent: "#A9642F" },
  C4: { rings: ["#D9AE79", "#A9642F", "#6E3E20"], accent: "#8C5A32" },
  H2: { rings: ["#B98452", "#7A4A26", "#43281A"], accent: "#7A2E1E" },
};
const DEFAULT_THEME = { rings: ["#E3D2C0", "#B08968", "#6E4A32"], accent: "#6B5B4E" };
const gradeTheme = (g) => GRADE_THEME[g] || DEFAULT_THEME;

/* ── helpers ──────────────────────────────────────────── */
async function api(path, options = {}) {
  const token = localStorage.getItem("cinnamonToken");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json().catch(() => ({}));
}

function statusKind(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("fail") || s.includes("reject") || s.includes("error")) return "fail";
  if (s.includes("mixed") || s.includes("pending") || s.includes("process")) return "pending";
  if (s.includes("complete") || s.includes("done") || s.includes("pass") || s.includes("pure") || s.includes("detected")) return "ok";
  return "neutral";
}

function timeAgo(d) {
  const t = new Date(d).getTime();
  if (!t) return "";
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / ms, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/* ── small components ─────────────────────────────────── */
function QuillBadge({ grade, size = 46 }) {
  const t = gradeTheme(grade);
  return (
    <div
      className="ax-quill"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 30%, ${t.rings[0]} 0%, ${t.rings[0]} 22%, ${t.rings[1]} 23%, ${t.rings[1]} 55%, ${t.rings[2]} 56%, ${t.rings[2]} 100%)`,
      }}
    >
      <span style={{ fontSize: size * 0.27 }}>{grade || "?"}</span>
    </div>
  );
}

function StatusChip({ status }) {
  return (
    <span className={`ax-chip ${statusKind(status)}`}>
      <i />
      {status || "Unknown"}
    </span>
  );
}

function GradeChip({ grade }) {
  const t = gradeTheme(grade);
  return (
    <span className="ax-grade" style={{ background: `${t.accent}1F`, borderColor: `${t.accent}66`, color: t.accent }}>
      {grade || "?"}
    </span>
  );
}

function Stat({ icon: Icon, label, value, suffix = "", note, hero }) {
  const n = useCountUp(value);
  return (
    <div className={`ax-stat ${hero ? "hero" : ""}`}>
      <div className="ax-stat-top">
        <span className="lbl">{label}</span>
        <span className="ico"><Icon size={20} strokeWidth={1.9} /></span>
      </div>
      <div className="big">{n}{suffix}</div>
      <div className="note">{note}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="ax-skel-wrap" aria-busy="true" aria-label="Loading data">
      <div className="ax-stats">{[0, 1, 2, 3].map((i) => <div key={i} className="ax-skel" style={{ height: 150 }} />)}</div>
      <div className="ax-skel" style={{ height: 320, marginTop: 20 }} />
    </div>
  );
}

function Empty({ title, text }) {
  return (
    <div className="ax-empty">
      <span className="ico"><Inbox size={26} strokeWidth={1.7} /></span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

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
          <button className="link" onClick={() => go("/cinnamon/history")}>History</button>
          {isAdmin && <button className="link active" onClick={() => go("/cinnamon/admin")}>Admin</button>}
          <button className="cx-logout" onClick={logout}>Logout</button>
        </nav>
      </div>
    </header>
  );
}

/* ── page ─────────────────────────────────────────────── */
export default function Admin() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [tab, setTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const [userQuery, setUserQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [detQuery, setDetQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [visible, setVisible] = useState(12);
  const [hoverGrade, setHoverGrade] = useState(null);

  const [confirm, setConfirm] = useState(null); // { type, id, label }
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const myId = localStorage.getItem("cinnamonUserId");

  const loadAll = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setError("");
    const [d, u, det] = await Promise.allSettled([
      api("/api/admin/dashboard"),
      api("/api/admin/users"),
      api("/api/admin/detections"),
    ]);
    if (d.status === "fulfilled") setDashboard(d.value);
    if (u.status === "fulfilled") setUsers(Array.isArray(u.value) ? u.value : []);
    if (det.status === "fulfilled") setDetections(Array.isArray(det.value) ? det.value : []);
    if ([d, u, det].every((r) => r.status === "rejected")) {
      setError("Could not reach the server. Check your connection and try again.");
    } else {
      setUpdatedAt(new Date());
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!confirm) return;
    const onKey = (e) => e.key === "Escape" && !busy && setConfirm(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, busy]);

  useEffect(() => { setVisible(12); }, [detQuery, gradeFilter, tab]);

  async function runDelete() {
    if (!confirm) return;
    setBusy(true);
    try {
      const path = confirm.type === "user" ? `/api/admin/users/${confirm.id}` : `/api/admin/detections/${confirm.id}`;
      await api(path, { method: "DELETE" });
      setToast({ kind: "ok", msg: confirm.type === "user" ? "User deleted" : "Detection deleted" });
      setConfirm(null);
      await loadAll(true);
    } catch {
      setToast({ kind: "fail", msg: "Delete failed. Please try again." });
    }
    setBusy(false);
  }

  /* derived data */
  const totalUsers = dashboard?.totalUsers ?? users.length;
  const totalDetections = dashboard?.totalDetections ?? detections.length;

  const stats = useMemo(() => {
    const counts = Object.fromEntries(GRADES.map((g) => [g, 0]));
    let mixed = 0;
    let today = 0;
    const todayStr = new Date().toDateString();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ key: d.toDateString(), label: d.toLocaleDateString(undefined, { weekday: "short" }), count: 0 });
    }
    const perUser = {};
    detections.forEach((x) => {
      if (counts[x.final_grade] !== undefined) counts[x.final_grade] += 1;
      if (String(x.status).toLowerCase().includes("mixed")) mixed += 1;
      const ds = new Date(x.createdAt).toDateString();
      if (ds === todayStr) today += 1;
      const slot = days.find((d) => d.key === ds);
      if (slot) slot.count += 1;
      const uid = x.userId?._id || x.userId;
      if (uid) perUser[uid] = (perUser[uid] || 0) + 1;
    });
    const total = detections.length;
    const maxDay = Math.max(1, ...days.map((d) => d.count));
    const weekTotal = days.reduce((s, d) => s + d.count, 0);
    return { counts, mixed, today, days, maxDay, weekTotal, perUser, total, mixedPct: total ? Math.round((mixed / total) * 100) : 0 };
  }, [detections]);

  const topUsers = useMemo(() => {
    return users
      .map((u) => ({ ...u, n: stats.perUser[u._id] || 0 }))
      .filter((u) => u.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);
  }, [users, stats.perUser]);

  const recent = useMemo(() => {
    const src = dashboard?.recentDetections?.length ? dashboard.recentDetections : detections.slice(0, 6);
    return src.slice(0, 6);
  }, [dashboard, detections]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      return `${u.name || ""} ${u.email || ""}`.toLowerCase().includes(q);
    });
  }, [users, userQuery, roleFilter]);

  const filteredDet = useMemo(() => {
    const q = detQuery.trim().toLowerCase();
    return detections.filter((d) => {
      if (gradeFilter !== "all" && d.final_grade !== gradeFilter) return false;
      if (!q) return true;
      return `${d.userId?.name || ""} ${d.userId?.email || ""} ${d.status || ""}`.toLowerCase().includes(q);
    });
  }, [detections, detQuery, gradeFilter]);

  const roles = useMemo(() => ["all", ...Array.from(new Set(users.map((u) => u.role).filter(Boolean)))], [users]);

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, n: null },
    { id: "users", label: "Users", icon: Users, n: users.length },
    { id: "detections", label: "Detections", icon: ScanLine, n: detections.length },
  ];

  /* growth-ring geometry */
  const RING_R = [96, 78, 60, 42];
  const circ = (r) => 2 * Math.PI * r;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700&display=swap');
        .cx-root { --bg:#FBF6EF; --surface:#FFFFFF; --surface-2:#F6EDE2; --ink:#2A1810; --muted:#6F5E50; --line:rgba(62,36,21,.12); --amber:#E3A24B; --amber-deep:#B9701F; --bark:#3E2415; --good:#4F7A47; --bad:#B3412B;
          font-family:'Manrope',system-ui,sans-serif; background:var(--bg); color:var(--ink); min-height:100vh; overflow-x:hidden; transition:background .3s,color .3s; display:flex; flex-direction:column; }
        .cx-root.cx-dark { --bg:#170D07; --surface:#24150D; --surface-2:#2E1B11; --ink:#F8EEDD; --muted:#BFAA92; --line:rgba(248,238,221,.12); --good:#9BDB92; --bad:#FFA08A; --amber-deep:#F0B25A; }
        .cx-root h1,.cx-root h2,.cx-root h3,.cx-root h4 { font-family:'Fraunces',Georgia,serif; letter-spacing:-.01em; margin:0; }
        .cx-root button, .cx-root input { font-family:inherit; }
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
        .cx-btn { display:inline-flex; align-items:center; gap:10px; padding:14px 26px; border-radius:99px; font-weight:700; font-size:15px; cursor:pointer; border:0; transition:transform .2s, box-shadow .2s, background .2s; }
        .cx-btn:hover { transform:translateY(-2px); }
        .cx-btn:disabled { opacity:.55; cursor:progress; transform:none; }
        .cx-btn.primary { background:var(--amber); color:#2A1810; box-shadow:0 10px 30px rgba(227,162,75,.35); }
        .cx-btn.ghost { background:rgba(255,255,255,.12); color:#fff; border:1px solid rgba(255,255,255,.4); backdrop-filter:blur(10px); }
        .cx-btn.ghost:hover { background:rgba(255,255,255,.22); }
        .cx-btn.danger { background:linear-gradient(135deg,#E5484D,#C62B33); color:#fff; box-shadow:0 8px 22px rgba(198,43,51,.35); }
        .cx-btn.plain { background:var(--surface-2); color:var(--ink); border:1px solid var(--line); }
        .cx-spin { animation:axSpin 1s linear infinite; }
        @keyframes axSpin { to { transform:rotate(360deg); } }

        /* hero scene */
        .cx-scene { position:relative; isolation:isolate; overflow:hidden; color:#fff; border-radius:0 0 56px 56px; background:linear-gradient(150deg,#4A2A18 0%,#2A1810 55%,#160B06 100%); }
        .cx-scene::before { content:""; position:absolute; inset:0; z-index:-1; background:radial-gradient(circle at 82% 30%,rgba(227,162,75,.32),transparent 55%); }
        .ax-rings { position:absolute; right:-120px; top:50%; width:560px; height:560px; margin-top:-280px; z-index:-1; pointer-events:none; }
        .ax-rings span { position:absolute; border-radius:50%; border:2px dashed rgba(246,196,122,.35); }
        .ax-rings span:nth-child(1){ inset:0; animation:axRot 60s linear infinite; }
        .ax-rings span:nth-child(2){ inset:60px; border-color:rgba(246,196,122,.28); animation:axRot 45s linear infinite reverse; }
        .ax-rings span:nth-child(3){ inset:120px; border-color:rgba(246,196,122,.22); animation:axRot 35s linear infinite; }
        .ax-rings span:nth-child(4){ inset:180px; border-style:solid; border-color:rgba(246,196,122,.18); }
        @keyframes axRot { to { transform:rotate(360deg); } }
        .ax-hero { padding:110px 0 44px; }
        .ax-hero-row { display:flex; align-items:flex-end; justify-content:space-between; gap:32px; flex-wrap:wrap; }
        .ax-hero h1 { font-size:clamp(34px,4.6vw,58px); line-height:1.06; font-weight:600; color:#fff; text-shadow:0 4px 30px rgba(0,0,0,.4); }
        .ax-hero p.lead { margin:14px 0 0; max-width:520px; font-size:16px; line-height:1.7; color:rgba(255,255,255,.9); }
        .ax-hero-act { display:flex; flex-direction:column; align-items:flex-end; gap:8px; }
        .ax-hero-act small { font-size:12px; color:rgba(255,255,255,.75); font-weight:600; }
        @media (max-width:700px){ .ax-hero-act { align-items:flex-start; } }

        /* body */
        .ax-main { flex:1; padding:44px 0 90px; }
        .ax-tabs { display:inline-flex; flex-wrap:wrap; gap:6px; padding:6px; border-radius:99px; background:var(--surface); border:1px solid var(--line); margin-bottom:32px; }
        .ax-tab { display:inline-flex; align-items:center; gap:8px; padding:11px 20px; border-radius:99px; border:0; background:none; color:var(--muted); font-weight:700; font-size:14px; cursor:pointer; transition:all .25s; }
        .ax-tab:hover { color:var(--ink); }
        .ax-tab.on { background:var(--bark); color:#fff; box-shadow:0 8px 20px rgba(62,36,21,.3); }
        .cx-dark .ax-tab.on { background:var(--amber); color:#2A1810; }
        .ax-tab em { font-style:normal; font-size:11px; padding:2px 8px; border-radius:99px; background:rgba(127,127,127,.18); }
        .ax-tab.on em { background:rgba(255,255,255,.22); }
        .cx-dark .ax-tab.on em { background:rgba(42,24,16,.18); }

        .ax-card { background:var(--surface); border:1px solid var(--line); border-radius:26px; box-shadow:0 14px 40px rgba(62,36,21,.07); }
        .cx-dark .ax-card { box-shadow:0 14px 40px rgba(0,0,0,.35); }
        .ax-fade { animation:axFade .55s ease both; }
        @keyframes axFade { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }

        /* stats */
        .ax-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
        @media (max-width:1000px){ .ax-stats { grid-template-columns:1fr 1fr; } } @media (max-width:520px){ .ax-stats { grid-template-columns:1fr; } }
        .ax-stat { padding:24px 26px; border-radius:26px; background:var(--surface); border:1px solid var(--line); box-shadow:0 14px 40px rgba(62,36,21,.07); transition:transform .3s, border-color .3s; }
        .ax-stat:hover { transform:translateY(-3px); border-color:var(--amber); }
        .ax-stat-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
        .ax-stat .lbl { font-size:13px; font-weight:700; color:var(--muted); }
        .ax-stat .ico { width:42px; height:42px; border-radius:14px; display:grid; place-items:center; background:rgba(227,162,75,.18); color:var(--amber-deep); }
        .ax-stat .big { font-family:'Fraunces',serif; font-size:clamp(40px,4.4vw,56px); font-weight:600; line-height:1; font-variant-numeric:tabular-nums; }
        .ax-stat .note { margin-top:12px; font-size:13px; color:var(--muted); font-weight:600; }
        .ax-stat.hero { background:linear-gradient(145deg,#4A2A18,#1F110A); border-color:transparent; color:#fff; }
        .ax-stat.hero .lbl, .ax-stat.hero .note { color:rgba(255,255,255,.78); }
        .ax-stat.hero .big { color:#F6C47A; }
        .ax-stat.hero .ico { background:rgba(246,196,122,.2); color:#F6C47A; }

        /* dashboard grid */
        .ax-grid { display:grid; grid-template-columns:1.05fr 1.25fr .9fr; gap:18px; margin-top:18px; }
        @media (max-width:1100px){ .ax-grid { grid-template-columns:1fr 1fr; } .ax-grid > :last-child { grid-column:1 / -1; } }
        @media (max-width:760px){ .ax-grid { grid-template-columns:1fr; } }
        .ax-panel { padding:26px 28px; display:flex; flex-direction:column; }
        .ax-panel h3 { font-size:22px; font-weight:600; }
        .ax-panel .cap { font-size:13px; color:var(--muted); margin:4px 0 20px; line-height:1.5; }

        /* growth rings */
        .ax-donut { position:relative; width:220px; max-width:100%; margin:0 auto 18px; aspect-ratio:1; }
        .ax-donut svg { width:100%; height:100%; transform:rotate(-90deg); }
        .ax-donut circle { fill:none; stroke-linecap:round; }
        .ax-donut .tr { stroke:var(--surface-2); stroke-width:12; }
        .ax-donut .ar { stroke-width:12; animation:axArc 1.3s cubic-bezier(.2,.7,.2,1) both; transition:opacity .25s, stroke-width .25s; }
        .ax-donut .ar.dim { opacity:.25; } .ax-donut .ar.hl { stroke-width:15; }
        @keyframes axArc { from { stroke-dashoffset:var(--c); } }
        .ax-donut-mid { position:absolute; inset:0; display:grid; place-content:center; text-align:center; }
        .ax-donut-mid b { font-family:'Fraunces',serif; font-size:36px; font-weight:600; line-height:1; }
        .ax-donut-mid span { font-size:12px; color:var(--muted); font-weight:700; margin-top:4px; }
        .ax-legend { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .ax-leg { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:14px; background:var(--surface-2); border:1px solid transparent; cursor:default; transition:border-color .2s; font-size:13px; }
        .ax-leg:hover { border-color:var(--amber); }
        .ax-leg i { width:10px; height:10px; border-radius:50%; flex:none; }
        .ax-leg b { font-weight:700; }
        .ax-leg span { margin-left:auto; color:var(--muted); font-weight:700; font-variant-numeric:tabular-nums; }

        /* week bars */
        .ax-bars { flex:1; min-height:220px; display:flex; align-items:flex-end; gap:12px; padding-top:10px; }
        .ax-bar { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:8px; height:100%; }
        .ax-bar .v { font-size:12px; font-weight:700; color:var(--muted); font-variant-numeric:tabular-nums; }
        .ax-bar .col { width:100%; max-width:44px; border-radius:14px 14px 6px 6px; background:linear-gradient(180deg,#E3A24B,#A9642F); transform-origin:bottom; animation:axRise .9s cubic-bezier(.2,.7,.2,1) both; min-height:6px; }
        .ax-bar.today .col { background:linear-gradient(180deg,#F6C47A,#E3A24B); box-shadow:0 8px 20px rgba(227,162,75,.4); }
        .ax-bar.zero .col { background:var(--surface-2); }
        .ax-bar .d { font-size:12px; font-weight:700; color:var(--muted); }
        @keyframes axRise { from { transform:scaleY(0); } }
        .ax-week-foot { margin-top:16px; padding-top:14px; border-top:1px solid var(--line); font-size:13px; color:var(--muted); font-weight:600; display:flex; justify-content:space-between; }
        .ax-week-foot b { color:var(--ink); }

        /* top users */
        .ax-top { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; }
        .ax-top li { display:flex; align-items:center; gap:12px; }
        .ax-avatar { flex:none; width:40px; height:40px; border-radius:50%; display:grid; place-items:center; font-family:'Fraunces',serif; font-weight:600; font-size:17px; background:linear-gradient(135deg,#F0B25A,#D98E2E); color:#2A1810; }
        .ax-top .who { min-width:0; flex:1; }
        .ax-top .who b { display:block; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ax-top .who span { display:block; height:5px; border-radius:99px; margin-top:6px; background:var(--surface-2); overflow:hidden; }
        .ax-top .who span i { display:block; height:100%; border-radius:99px; background:var(--amber); transform-origin:left; animation:axGrow .9s cubic-bezier(.2,.7,.2,1) both; }
        @keyframes axGrow { from { transform:scaleX(0); } }
        .ax-top .n { font-weight:700; font-size:14px; font-variant-numeric:tabular-nums; }

        /* activity timeline */
        .ax-section-title { display:flex; align-items:baseline; justify-content:space-between; gap:16px; margin:44px 0 18px; }
        .ax-section-title h2 { font-size:clamp(26px,3vw,36px); font-weight:600; }
        .ax-section-title p { margin:0; font-size:14px; color:var(--muted); }
        .ax-feed { list-style:none; margin:0; padding:8px 0 8px 0; position:relative; }
        .ax-feed::before { content:""; position:absolute; left:46px; top:28px; bottom:28px; width:2px; background:repeating-linear-gradient(180deg,var(--amber) 0 7px,transparent 7px 14px); opacity:.7; }
        .ax-feed li { position:relative; display:flex; align-items:center; gap:18px; padding:14px 26px; transition:background .25s; }
        .ax-feed li:hover { background:var(--surface-2); }
        .ax-feed .who { min-width:0; flex:1; }
        .ax-feed .who b { display:block; font-size:15px; }
        .ax-feed .who span { display:block; font-size:12px; color:var(--muted); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ax-feed .tags { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
        .ax-feed time { flex:none; width:96px; text-align:right; font-size:12px; font-weight:700; color:var(--muted); }
        @media (max-width:700px){ .ax-feed li { flex-wrap:wrap; } .ax-feed time { width:auto; text-align:left; } .ax-feed::before { display:none; } }

        .ax-quill { position:relative; z-index:1; flex:none; border-radius:50%; display:grid; place-items:center; border:1px solid rgba(62,27,18,.15); box-shadow:0 4px 14px rgba(62,27,18,.2); }
        .ax-quill span { font-weight:700; color:#2C1B12; text-shadow:0 1px 2px rgba(255,255,255,.4); }

        /* chips */
        .ax-chip { display:inline-flex; align-items:center; gap:7px; padding:5px 12px; border-radius:99px; font-size:12px; font-weight:700; border:1px solid; white-space:nowrap; }
        .ax-chip i { width:7px; height:7px; border-radius:50%; background:currentColor; }
        .ax-chip.ok { color:var(--good); background:rgba(79,122,71,.13); border-color:rgba(79,122,71,.4); }
        .ax-chip.fail { color:var(--bad); background:rgba(198,43,51,.1); border-color:rgba(198,43,51,.35); }
        .ax-chip.pending { color:var(--amber-deep); background:rgba(227,162,75,.16); border-color:rgba(227,162,75,.5); }
        .ax-chip.neutral { color:var(--muted); background:var(--surface-2); border-color:var(--line); }
        .ax-grade { padding:5px 13px; border-radius:99px; border:1px solid; font-size:12px; font-weight:700; }

        /* toolbar + list */
        .ax-toolbar { display:flex; flex-wrap:wrap; gap:14px; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .ax-search { position:relative; flex:1 1 280px; max-width:420px; }
        .ax-search svg { position:absolute; left:16px; top:50%; transform:translateY(-50%); color:var(--muted); }
        .ax-search input { width:100%; padding:14px 18px 14px 46px; border-radius:99px; border:1px solid var(--line); background:var(--surface); color:var(--ink); font-size:14px; font-weight:600; transition:border-color .2s, box-shadow .2s; }
        .ax-search input::placeholder { color:var(--muted); font-weight:500; }
        .ax-search input:focus { outline:none; border-color:var(--amber); box-shadow:0 0 0 4px rgba(227,162,75,.2); }
        .ax-filters { display:flex; flex-wrap:wrap; gap:8px; }
        .ax-filter { padding:9px 16px; border-radius:99px; border:1px solid var(--line); background:var(--surface); color:var(--muted); font-weight:700; font-size:13px; cursor:pointer; text-transform:capitalize; transition:all .2s; }
        .ax-filter:hover { border-color:var(--amber); color:var(--ink); }
        .ax-filter.on { background:var(--amber); border-color:var(--amber); color:#2A1810; }
        .ax-count { font-size:13px; color:var(--muted); font-weight:600; margin:0 0 12px 4px; }

        .ax-list { list-style:none; margin:0; padding:6px 0; overflow:hidden; }
        .ax-row { display:grid; grid-template-columns:52px minmax(0,1.5fr) minmax(0,1fr) 150px 120px; gap:16px; align-items:center; padding:14px 26px; border-bottom:1px solid var(--line); transition:background .25s; animation:axFade .45s ease both; }
        .ax-row:last-child { border-bottom:0; }
        .ax-row:hover { background:var(--surface-2); }
        .ax-row.users { grid-template-columns:52px minmax(0,1.5fr) 110px 120px 120px; }
        .ax-row .who { min-width:0; }
        .ax-row .who b { display:block; font-size:15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ax-row .who span { display:block; font-size:12px; color:var(--muted); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ax-row .when { font-size:13px; color:var(--muted); font-weight:600; }
        .ax-row .tags { display:flex; flex-wrap:wrap; gap:8px; }
        .ax-role { display:inline-flex; width:fit-content; padding:5px 13px; border-radius:99px; font-size:12px; font-weight:700; text-transform:capitalize; background:var(--surface-2); border:1px solid var(--line); color:var(--muted); }
        .ax-role.admin { background:rgba(227,162,75,.18); border-color:rgba(227,162,75,.55); color:var(--amber-deep); }
        .ax-del { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:9px 16px; border-radius:99px; border:1px solid rgba(198,43,51,.35); background:rgba(198,43,51,.08); color:var(--bad); font-weight:700; font-size:13px; cursor:pointer; transition:all .2s; justify-self:end; }
        .ax-del:hover { background:#C62B33; border-color:#C62B33; color:#fff; }
        .ax-del:disabled { opacity:.4; cursor:not-allowed; background:none; color:var(--muted); border-color:var(--line); }
        .ax-you { font-size:11px; font-weight:700; margin-left:8px; padding:2px 8px; border-radius:99px; background:var(--amber); color:#2A1810; vertical-align:middle; }
        @media (max-width:900px){
          .ax-row, .ax-row.users { grid-template-columns:52px 1fr auto; gap:10px 14px; padding:16px 18px; }
          .ax-row .tags, .ax-row .when, .ax-row .ax-role, .ax-row .cnt { grid-column:2 / 3; }
          .ax-row .ax-del { grid-column:3; grid-row:1; }
        }
        .ax-more { display:flex; justify-content:center; margin-top:22px; }

        /* empty / error / skeleton */
        .ax-empty { text-align:center; padding:60px 28px; }
        .ax-empty .ico { width:64px; height:64px; margin:0 auto 16px; border-radius:50%; display:grid; place-items:center; background:rgba(227,162,75,.18); color:var(--amber-deep); }
        .ax-empty h3 { font-size:24px; margin-bottom:6px; } .ax-empty p { margin:0 auto; max-width:380px; color:var(--muted); line-height:1.7; }
        .ax-error { display:flex; flex-wrap:wrap; align-items:center; gap:16px; padding:22px 26px; border-radius:22px; background:rgba(198,43,51,.09); border:1px solid rgba(198,43,51,.35); color:var(--ink); margin-bottom:24px; }
        .ax-error svg { color:var(--bad); flex:none; } .ax-error p { margin:0; flex:1; min-width:200px; font-weight:600; }
        .ax-skel { border-radius:26px; background:linear-gradient(100deg,var(--surface) 30%,var(--surface-2) 50%,var(--surface) 70%); background-size:300% 100%; border:1px solid var(--line); animation:axShim 1.4s ease-in-out infinite; }
        @keyframes axShim { from { background-position:100% 0; } to { background-position:0 0; } }

        /* modal + toast */
        .ax-modal { position:fixed; inset:0; z-index:1000; background:rgba(15,8,4,.75); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:16px; animation:axFade .25s both; }
        .ax-modal-box { width:100%; max-width:440px; padding:30px; border-radius:30px; background:var(--surface); border:1px solid var(--line); box-shadow:0 40px 90px rgba(0,0,0,.5); text-align:center; }
        .ax-modal-box .ico { width:60px; height:60px; margin:0 auto 16px; border-radius:50%; display:grid; place-items:center; background:rgba(198,43,51,.12); color:var(--bad); }
        .ax-modal-box h3 { font-size:26px; margin-bottom:8px; }
        .ax-modal-box p { margin:0 0 24px; color:var(--muted); line-height:1.7; font-size:15px; }
        .ax-modal-box p strong { color:var(--ink); }
        .ax-modal-row { display:flex; gap:12px; } .ax-modal-row .cx-btn { flex:1; justify-content:center; }
        .ax-toast { position:fixed; left:50%; bottom:28px; z-index:1100; transform:translateX(-50%); display:flex; align-items:center; gap:10px; padding:14px 22px; border-radius:99px; font-weight:700; font-size:14px; color:#fff; background:#2A1810; box-shadow:0 20px 40px rgba(0,0,0,.4); animation:axToast .4s cubic-bezier(.2,.7,.2,1) both; }
        .ax-toast.ok i { background:#6FAE63; } .ax-toast.fail i { background:#E5484D; }
        .ax-toast i { width:10px; height:10px; border-radius:50%; }
        @keyframes axToast { from { opacity:0; transform:translate(-50%,16px); } to { opacity:1; transform:translate(-50%,0); } }

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

        @media (prefers-reduced-motion:reduce){
          .ax-rings span, .ax-donut .ar, .ax-bar .col, .ax-top .who span i, .ax-row, .ax-fade, .ax-skel, .ax-modal, .ax-toast, .cx-spin { animation:none; }
        }
      `}</style>

      <div className={`cx-root ${isDark ? "cx-dark" : ""}`}>
        <Header navigate={navigate} />

        {/* ── HERO ── */}
        <div className="cx-scene">
          <div className="ax-rings" aria-hidden="true"><span /><span /><span /><span /></div>
          <section className="ax-hero">
            <div className="cx-wrap">
              <div className="ax-hero-row">
                <div>
                  <h1>Admin dashboard</h1>
                  <p className="lead">See what is being graded, who is using the app, and clean up old records in one place.</p>
                </div>
                <div className="ax-hero-act">
                  <button className="cx-btn ghost" onClick={() => loadAll(true)} disabled={refreshing || loading}>
                    <RefreshCw size={17} className={refreshing ? "cx-spin" : ""} />
                    {refreshing ? "Refreshing…" : "Refresh data"}
                  </button>
                  {updatedAt && <small>Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── BODY ── */}
        <main className="ax-main">
          <div className="cx-wrap">
            <div className="ax-tabs" role="tablist">
              {TABS.map(({ id, label, icon: Icon, n }) => (
                <button key={id} role="tab" aria-selected={tab === id} className={`ax-tab ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>
                  <Icon size={16} strokeWidth={2.2} />
                  {label}
                  {n !== null && <em>{n}</em>}
                </button>
              ))}
            </div>

            {error && (
              <div className="ax-error ax-fade" role="alert">
                <AlertTriangle size={22} />
                <p>{error}</p>
                <button className="cx-btn primary" onClick={() => loadAll()}>Try again</button>
              </div>
            )}

            {loading ? (
              <Skeleton />
            ) : (
              <>
                {/* ───── DASHBOARD ───── */}
                {tab === "dashboard" && (
                  <div className="ax-fade" key="dashboard">
                    <div className="ax-stats">
                      <Stat hero icon={Users} label="Total users" value={totalUsers} note="Registered accounts" />
                      <Stat icon={ScanLine} label="Total detections" value={totalDetections} note="All time" />
                      <Stat icon={CalendarDays} label="Detections today" value={stats.today} note={`${stats.weekTotal} in the last 7 days`} />
                      <Stat icon={Layers} label="Mixed bundles" value={stats.mixedPct} suffix="%" note={`${stats.mixed} of ${stats.total} samples`} />
                    </div>

                    <div className="ax-grid">
                      {/* growth rings */}
                      <div className="ax-card ax-panel">
                        <h3>Grade mix</h3>
                        <p className="cap">Each ring is one grade, like the layers of a quill. Longer arc means more samples.</p>
                        {stats.total === 0 ? (
                          <Empty title="No detections yet" text="Grades will appear here after the first sample is analysed." />
                        ) : (
                          <>
                            <div className="ax-donut">
                              <svg viewBox="0 0 220 220" role="img" aria-label="Grade distribution">
                                {GRADES.map((g, i) => {
                                  const r = RING_R[i];
                                  const c = circ(r);
                                  const share = stats.counts[g] / stats.total;
                                  return (
                                    <g key={g}>
                                      <circle className="tr" cx="110" cy="110" r={r} />
                                      <circle
                                        className={`ar ${hoverGrade && hoverGrade !== g ? "dim" : ""} ${hoverGrade === g ? "hl" : ""}`}
                                        cx="110" cy="110" r={r}
                                        stroke={gradeTheme(g).accent}
                                        strokeDasharray={c}
                                        strokeDashoffset={c * (1 - share)}
                                        style={{ "--c": c, animationDelay: `${i * 0.12}s` }}
                                      />
                                    </g>
                                  );
                                })}
                              </svg>
                              <div className="ax-donut-mid">
                                <b>{hoverGrade ? stats.counts[hoverGrade] : stats.total}</b>
                                <span>{hoverGrade ? `${hoverGrade} samples` : "samples"}</span>
                              </div>
                            </div>
                            <div className="ax-legend">
                              {GRADES.map((g) => (
                                <div key={g} className="ax-leg" onMouseEnter={() => setHoverGrade(g)} onMouseLeave={() => setHoverGrade(null)}>
                                  <i style={{ background: gradeTheme(g).accent }} />
                                  <b>{g}</b>
                                  <span>{Math.round((stats.counts[g] / stats.total) * 100)}%</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* week bars */}
                      <div className="ax-card ax-panel">
                        <h3>Last 7 days</h3>
                        <p className="cap">Detections per day.</p>
                        <div className="ax-bars">
                          {stats.days.map((d, i) => (
                            <div key={d.key} className={`ax-bar ${i === 6 ? "today" : ""} ${d.count === 0 ? "zero" : ""}`}>
                              <span className="v">{d.count}</span>
                              <div className="col" style={{ height: `${Math.max(3, (d.count / stats.maxDay) * 100)}%`, animationDelay: `${i * 0.07}s` }} />
                              <span className="d">{d.label}</span>
                            </div>
                          ))}
                        </div>
                        <div className="ax-week-foot">
                          <span>Busiest day: <b>{stats.weekTotal ? stats.days.reduce((a, b) => (b.count > a.count ? b : a)).label : "None"}</b></span>
                          <span>Total: <b>{stats.weekTotal}</b></span>
                        </div>
                      </div>

                      {/* top users */}
                      <div className="ax-card ax-panel">
                        <h3>Most active users</h3>
                        <p className="cap">Ranked by number of detections.</p>
                        {topUsers.length === 0 ? (
                          <Empty title="No activity" text="Active users will be listed here." />
                        ) : (
                          <ul className="ax-top">
                            {topUsers.map((u, i) => (
                              <li key={u._id}>
                                <span className="ax-avatar">{u.name?.charAt(0).toUpperCase() || "?"}</span>
                                <div className="who">
                                  <b>{u.name}</b>
                                  <span><i style={{ width: `${(u.n / topUsers[0].n) * 100}%`, animationDelay: `${i * 0.1}s` }} /></span>
                                </div>
                                <span className="n">{u.n}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* recent activity */}
                    <ScrollReveal direction="up">
                      <div className="ax-section-title">
                        <h2>Recent activity</h2>
                        <button className="cx-btn plain" onClick={() => setTab("detections")} style={{ padding: "10px 20px", fontSize: 14 }}>View all detections</button>
                      </div>
                      <div className="ax-card">
                        {recent.length === 0 ? (
                          <Empty title="Nothing yet" text="New detections will show up here as people use the app." />
                        ) : (
                          <ul className="ax-feed">
                            {recent.map((item) => (
                              <li key={item._id}>
                                <QuillBadge grade={item.final_grade} size={42} />
                                <div className="who">
                                  <b>{item.userId?.name || "Unknown user"}</b>
                                  <span>{item.userId?.email}</span>
                                </div>
                                <div className="tags"><GradeChip grade={item.final_grade} /><StatusChip status={item.status} /></div>
                                <time>{timeAgo(item.createdAt)}</time>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </ScrollReveal>
                  </div>
                )}

                {/* ───── USERS ───── */}
                {tab === "users" && (
                  <div className="ax-fade" key="users">
                    <div className="ax-toolbar">
                      <label className="ax-search">
                        <Search size={18} />
                        <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Search by name or email" aria-label="Search users" />
                      </label>
                      <div className="ax-filters">
                        {roles.map((r) => (
                          <button key={r} className={`ax-filter ${roleFilter === r ? "on" : ""}`} onClick={() => setRoleFilter(r)}>{r === "all" ? "All roles" : r}</button>
                        ))}
                      </div>
                    </div>
                    <p className="ax-count">{filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"}</p>
                    <div className="ax-card">
                      {filteredUsers.length === 0 ? (
                        <Empty title="No users found" text="Try a different name, email or role filter." />
                      ) : (
                        <ul className="ax-list">
                          {filteredUsers.map((u, i) => {
                            const isMe = String(u._id) === String(myId);
                            return (
                              <li key={u._id} className="ax-row users" style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}>
                                <span className="ax-avatar" style={{ width: 46, height: 46 }}>{u.name?.charAt(0).toUpperCase() || "?"}</span>
                                <div className="who">
                                  <b>{u.name}{isMe && <span className="ax-you">You</span>}</b>
                                  <span>{u.email}</span>
                                </div>
                                <span className={`ax-role ${u.role === "admin" ? "admin" : ""}`}>{u.role === "admin" && <ShieldCheck size={13} style={{ marginRight: 5 }} />}{u.role}</span>
                                <span className="when cnt">{stats.perUser[u._id] || 0} detection{(stats.perUser[u._id] || 0) === 1 ? "" : "s"}</span>
                                <button className="ax-del" disabled={isMe} title={isMe ? "You cannot delete your own account" : "Delete user"} onClick={() => setConfirm({ type: "user", id: u._id, label: u.name })}>
                                  <Trash2 size={15} />Delete
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* ───── DETECTIONS ───── */}
                {tab === "detections" && (
                  <div className="ax-fade" key="detections">
                    <div className="ax-toolbar">
                      <label className="ax-search">
                        <Search size={18} />
                        <input value={detQuery} onChange={(e) => setDetQuery(e.target.value)} placeholder="Search by user or status" aria-label="Search detections" />
                      </label>
                      <div className="ax-filters">
                        {["all", ...GRADES].map((g) => (
                          <button key={g} className={`ax-filter ${gradeFilter === g ? "on" : ""}`} onClick={() => setGradeFilter(g)}>{g === "all" ? "All grades" : g}</button>
                        ))}
                      </div>
                    </div>
                    <p className="ax-count">{filteredDet.length} detection{filteredDet.length === 1 ? "" : "s"}</p>
                    <div className="ax-card">
                      {filteredDet.length === 0 ? (
                        <Empty title="No detections found" text="Try a different search or grade filter." />
                      ) : (
                        <ul className="ax-list">
                          {filteredDet.slice(0, visible).map((d, i) => (
                            <li key={d._id} className="ax-row" style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}>
                              <QuillBadge grade={d.final_grade} size={44} />
                              <div className="who">
                                <b>{d.userId?.name || "Unknown user"}</b>
                                <span>{d.userId?.email}</span>
                              </div>
                              <div className="tags"><GradeChip grade={d.final_grade} /><StatusChip status={d.status} /></div>
                              <span className="when">{new Date(d.createdAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                              <button className="ax-del" onClick={() => setConfirm({ type: "detection", id: d._id, label: `${d.final_grade} sample from ${d.userId?.name || "unknown user"}` })}>
                                <Trash2 size={15} />Delete
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {filteredDet.length > visible && (
                      <div className="ax-more">
                        <button className="cx-btn plain" onClick={() => setVisible((v) => v + 12)}>Show more ({filteredDet.length - visible} left)</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* ── DELETE CONFIRM ── */}
        {confirm && (
          <div className="ax-modal" onClick={() => !busy && setConfirm(null)} role="dialog" aria-modal="true" aria-labelledby="ax-del-title">
            <div className="ax-modal-box" onClick={(e) => e.stopPropagation()}>
              <span className="ico"><Trash2 size={26} /></span>
              <h3 id="ax-del-title">Delete this {confirm.type}?</h3>
              <p><strong>{confirm.label}</strong> will be removed permanently. This cannot be undone.</p>
              <div className="ax-modal-row">
                <button className="cx-btn plain" onClick={() => setConfirm(null)} disabled={busy}>Cancel</button>
                <button className="cx-btn danger" onClick={runDelete} disabled={busy}>
                  {busy ? <><RefreshCw size={16} className="cx-spin" />Deleting…</> : <>Delete {confirm.type}</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className={`ax-toast ${toast.kind}`} role="status"><i />{toast.msg}</div>}

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
      </div>
    </>
  );
}