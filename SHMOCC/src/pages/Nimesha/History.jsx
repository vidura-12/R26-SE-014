import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────
// Grade → visual identity. Each grade gets a ring-gradient (mimicking a cut
// cinnamon quill's cross-section — pale, thin bark for the finest grades,
// darkening and thickening as grade descends) and a single accent color
// used sparingly for status chips and detail highlights.
// ─────────────────────────────────────────────────────────────────────────
const GRADE_THEME = {
  Alba: { rings: ["#FBF1E1", "#EFD5AC", "#C89A63"], accent: "#B8863B", label: "Finest, palest quill" },
  C5: { rings: ["#EFD9B8", "#CB9A61", "#8C5A32"], accent: "#A9642F", label: "Fine commercial grade" },
  C4: { rings: ["#D9AE79", "#A9642F", "#6E3E20"], accent: "#8C5A32", label: "Standard commercial grade" },
  H2: { rings: ["#B98452", "#7A4A26", "#43281A"], accent: "#7A2E1E", label: "Heavier bark grade" },
};
const defaultTheme = { rings: ["#E3D2C0", "#B08968", "#6E4A32"], accent: "#6B5B4E", label: "Ungraded batch" };

const STATUS_STYLE = {
  success: { dot: "#4F6B4A", text: "#3E5239", bg: "#EEF3EC" },
  fail: { dot: "#7A2E1E", text: "#7A2E1E", bg: "#FBEEEA" },
  pending: { dot: "#B8863B", text: "#8A651F", bg: "#FBF1E1" },
  neutral: { dot: "#8A7A6B", text: "#6B5B4E", bg: "#F3EEE6" },
};

function statusStyle(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("complete") || s.includes("done") || s.includes("pass")) return STATUS_STYLE.success;
  if (s.includes("fail") || s.includes("reject") || s.includes("error")) return STATUS_STYLE.fail;
  if (s.includes("pending") || s.includes("process")) return STATUS_STYLE.pending;
  return STATUS_STYLE.neutral;
}

function timeAgo(dateStr) {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

// A quill cross-section badge: concentric rings standing in for the grade.
function QuillBadge({ grade, size = 56 }) {
  const theme = GRADE_THEME[grade] || defaultTheme;
  return (
    <div
      className="relative shrink-0 rounded-full flex items-center justify-center shadow-[0_4px_14px_rgba(62,27,18,0.18)]"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 30%, ${theme.rings[0]} 0%, ${theme.rings[0]} 22%, ${theme.rings[1]} 23%, ${theme.rings[1]} 55%, ${theme.rings[2]} 56%, ${theme.rings[2]} 100%)`,
        border: "1px solid rgba(62,27,18,0.15)",
      }}
    >
      <span
        className="font-semibold"
        style={{
          fontSize: size * 0.26,
          color: "#2C1B12",
          textShadow: "0 1px 2px rgba(255,255,255,0.35)",
        }}
      >
        {grade}
      </span>
    </div>
  );
}

function TopNav({ navigate }) {
  function handleLogout() {
    localStorage.removeItem("cinnamonToken");
    localStorage.removeItem("cinnamonRole");
    localStorage.removeItem("cinnamonUserId");
    localStorage.removeItem("cinnamonUserName");
    window.location.href = "/cinnamon/login";
  }

  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-[#FBF6EF]/90 backdrop-blur-md border-b border-[#3E1B12]/10 shadow-sm px-4 sm:px-8">
      <div className="w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="w-[42px] h-[42px] rounded-[12px] bg-gradient-to-br from-[#8C5A32] to-[#3E2415] flex items-center justify-center text-[20px] shadow-[0_4px_14px_rgba(62,27,18,0.35)]">
            🪵
          </div>
          <div>
            <div className="font-serif font-bold text-[18px] text-[#3E1B12]">Ceylon Cinnamon</div>
            <div className="text-[11px] text-[#8C5A32] tracking-wide">Grade detection</div>
          </div>
        </div>

        <nav className="flex items-center gap-3 overflow-x-auto">
          <button
            onClick={() => navigate("/cinnamon")}
            className="whitespace-nowrap px-5 py-2 rounded-full bg-white/60 border border-[#3E1B12]/10 text-[#3E1B12] text-sm font-medium hover:bg-white hover:shadow-sm transition-all duration-300"
          >
            Detection
          </button>
          <button
            onClick={() => navigate("/cinnamon/history")}
            className="whitespace-nowrap px-5 py-2 rounded-full bg-[#3E1B12] text-[#FBF6EF] text-sm font-medium shadow-sm transition-all duration-300"
          >
            History
          </button>
          {localStorage.getItem("cinnamonRole") === "admin" && (
            <button
              onClick={() => navigate("/cinnamon/admin")}
              className="whitespace-nowrap px-5 py-2 rounded-full bg-[#3E1B12]/5 border border-[#3E1B12]/10 text-[#3E1B12] text-sm font-medium hover:bg-[#3E1B12]/10 transition-all duration-300"
            >
              Admin dashboard
            </button>
          )}
          <button
            onClick={handleLogout}
            className="whitespace-nowrap px-5 py-2 rounded-full bg-[#7A2E1E]/8 border border-[#7A2E1E]/20 text-[#7A2E1E] text-sm font-semibold hover:bg-[#7A2E1E] hover:text-white transition-all duration-300 ml-1"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("cinnamonToken");

      const response = await fetch("https://cinnamon-backend.agreeableisland-ddd74309.southeastasia.azurecontainerapps.io/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF6EF] flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        <TopNav navigate={navigate} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C89A63]/15 rounded-full blur-3xl" />
        <div className="w-14 h-14 rounded-full border-4 border-[#E3D2C0] border-t-[#A9642F] animate-spin relative z-10" />
        <p className="text-[#6B5B4E] text-sm relative z-10">Loading your detection history…</p>
      </div>
    );
  }

  // ── Empty ──
  if (history.length === 0) {
    return (
      <div className="min-h-screen bg-[#FBF6EF] flex flex-col items-center justify-center relative overflow-hidden px-6">
        <TopNav navigate={navigate} />
        <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#C89A63]/10 blur-[120px]" />
        <div className="bg-white/70 backdrop-blur-xl border border-white p-12 rounded-[2rem] shadow-[0_8px_30px_rgba(62,27,18,0.06)] text-center max-w-lg w-full relative z-10 mt-20">
          <div className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center" style={{ background: "radial-gradient(circle at 32% 30%, #FBF1E1 22%, #C89A63 23%, #C89A63 55%, #6E3E20 56%)" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2C1B12" strokeWidth="1.6">
              <path d="M4 19c4-1 4-9 8-9s4 8 8 9" />
              <path d="M4 19h16" />
            </svg>
          </div>
          <h2 className="text-3xl font-medium text-[#2C1B12] mb-4" style={{ fontFamily: "Georgia, 'Iowan Old Style', serif" }}>
            Nothing graded yet
          </h2>
          <p className="text-[#6B5B4E] leading-relaxed mb-8">
            Run your first detection and it will show up here, with its grade, market forecast, and full breakdown.
          </p>
          <button
            onClick={() => navigate("/cinnamon")}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-[#A9642F] to-[#8C5A32] text-white text-sm font-medium rounded-full hover:shadow-[0_12px_30px_rgba(140,90,50,0.3)] hover:-translate-y-0.5 transition-all duration-300"
          >
            Start a detection
          </button>
        </div>
      </div>
    );
  }

  // Aggregate counts for the header strip — purely a display computation,
  // doesn't touch fetched data.
  const gradeCounts = history.reduce((acc, item) => {
    const g = item.final_grade || "—";
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const maxCount = Math.max(1, ...Object.values(gradeCounts));

  return (
    <div className="min-h-screen font-sans relative" style={{ background: "linear-gradient(180deg,#FBF6EF 0%,#F6EDE2 100%)" }}>
      <TopNav navigate={navigate} />
      <div className="fixed top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-[#C89A63]/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#7A2E1E]/5 blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-28 pb-20 relative z-10">
        {/* ── Header ── */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-[42px] font-medium text-[#2C1B12] tracking-tight leading-tight mb-2" style={{ fontFamily: "Georgia, 'Iowan Old Style', serif" }}>
            Detection history
          </h1>
          <p className="text-[#6B5B4E] mb-6">
            {history.length} batch{history.length === 1 ? "" : "es"} graded so far
          </p>

          {/* Grade distribution strip — a real reading of the data, not decoration */}
          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-5 flex flex-wrap items-end gap-6">
            {Object.entries(gradeCounts).map(([grade, count]) => {
              const theme = GRADE_THEME[grade] || defaultTheme;
              return (
                <div key={grade} className="flex flex-col items-start gap-2">
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-medium text-[#2C1B12]" style={{ fontFamily: "Georgia, serif" }}>
                      {count}
                    </span>
                    <span className="text-sm text-[#6B5B4E] mb-0.5">{grade}</span>
                  </div>
                  <div className="w-20 h-1.5 rounded-full bg-[#EFE4D6] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(count / maxCount) * 100}%`, background: theme.accent }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── List ── */}
        <div className="flex flex-col gap-3">
          {history.map((item) => {
            const st = statusStyle(item.status);
            return (
              <button
                key={item._id}
                onClick={() => setSelected(item)}
                className="group text-left flex items-center gap-5 bg-white/70 hover:bg-white backdrop-blur-xl border border-white rounded-2xl px-5 py-4 shadow-[0_4px_16px_rgba(62,27,18,0.04)] hover:shadow-[0_10px_28px_rgba(62,27,18,0.09)] transition-all duration-300"
              >
                <QuillBadge grade={item.final_grade} size={52} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg text-[#2C1B12] font-medium" style={{ fontFamily: "Georgia, serif" }}>
                      Grade {item.final_grade}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium"
                      style={{ background: st.bg, color: st.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#8A7A6B] mt-1">
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                    <span className="mx-2 text-[#D8C7B4]">•</span>
                    {timeAgo(item.createdAt)}
                  </p>
                </div>

                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C5A32" strokeWidth="2" className="shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            );
          })}
        </div>

        {/* ── Cinnamon grade reference (sits after the history, as requested) ── */}
        <div className="mt-16 bg-[#2C1B12] rounded-[2rem] p-8 sm:p-10 relative overflow-hidden">
          <svg className="absolute -right-10 -bottom-10 opacity-10" width="220" height="220" viewBox="0 0 24 24" fill="none" stroke="#FBF6EF" strokeWidth="0.6">
            <path d="M4 19c4-1 4-9 8-9s4 8 8 9" />
            <path d="M2 14c3-0.5 3-6 6-6s3 5.5 6 6" />
          </svg>
          <h2 className="text-2xl font-medium text-[#FBF6EF] mb-2 relative z-10" style={{ fontFamily: "Georgia, serif" }}>
            Reading a quill's grade
          </h2>
          <p className="text-[#D8C7B4] text-sm mb-8 max-w-md relative z-10">
            Each badge above mirrors a real quill cross-section: paler and thinner rings for the finer
            grades, darkening as the bark thickens toward the lower grades.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
            {Object.entries(GRADE_THEME).map(([grade, theme]) => (
              <div key={grade} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                <QuillBadge grade={grade} size={44} />
                <div>
                  <p className="text-[#FBF6EF] font-medium text-sm mb-1">{grade}</p>
                  <p className="text-[#B8A791] text-[13px] leading-snug">{theme.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Detail card ── */}
      {selected && (() => {
        const theme = GRADE_THEME[selected.final_grade] || defaultTheme;
        const st = statusStyle(selected.status);
        const totalQuills = selected.details ? Object.values(selected.details).reduce((a, b) => a + b, 0) : 0;
        const compositionEntries = selected.details
          ? Object.entries(selected.details).sort((a, b) => b[1] - a[1])
          : [];
        const dominant = compositionEntries[0]?.[0];

        return (
          <div
            className="fixed inset-0 bg-[#2C1B12]/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6"
            onClick={() => setSelected(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FFFDFA] rounded-[2rem] shadow-2xl w-[760px] max-w-full max-h-[85vh] flex flex-col overflow-hidden border border-white"
            >
              {/* Header */}
              <div className="relative px-8 py-8 shrink-0" style={{ background: `linear-gradient(135deg, ${theme.rings[1]}, ${theme.rings[2]})` }}>
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-all"
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex items-center gap-5">
                  <QuillBadge grade={selected.final_grade} size={64} />
                  <div>
                    <p className="text-white/80 text-sm mb-1">Detection overview</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-3xl text-white font-medium" style={{ fontFamily: "Georgia, serif" }}>
                        Grade {selected.final_grade}
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        {selected.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 overflow-y-auto flex-1">
                {/* Quick facts */}
                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  <div className="rounded-2xl border border-[#EFE4D6] bg-white p-4">
                    <p className="text-[13px] text-[#8A7A6B] mb-1">Recorded</p>
                    <p className="text-[#2C1B12] text-sm font-medium">
                      {new Date(selected.createdAt).toLocaleString(undefined, {
                        month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                    <p className="text-[#B8A791] text-xs mt-0.5">{timeAgo(selected.createdAt)}</p>
                  </div>
                  <div className="rounded-2xl border border-[#EFE4D6] bg-white p-4">
                    <p className="text-[13px] text-[#8A7A6B] mb-1">Quills identified</p>
                    <p className="text-[#2C1B12] text-sm font-medium">{totalQuills || "—"}</p>
                    <p className="text-[#B8A791] text-xs mt-0.5">across {compositionEntries.length} grade{compositionEntries.length === 1 ? "" : "s"}</p>
                  </div>
                  <div className="rounded-2xl border border-[#EFE4D6] bg-white p-4">
                    <p className="text-[13px] text-[#8A7A6B] mb-1">Dominant grade</p>
                    <p className="text-[#2C1B12] text-sm font-medium">{dominant || selected.final_grade}</p>
                    <p className="text-[#B8A791] text-xs mt-0.5">reference #{String(selected._id || "").slice(-6)}</p>
                  </div>
                </div>

                {/* Composition */}
                {compositionEntries.length > 0 && (
                  <div className="mb-8">
                    <p className="text-[#2C1B12] font-medium mb-4">Composition breakdown</p>
                    <div className="flex flex-col gap-3">
                      {compositionEntries.map(([key, value]) => {
                        const detTheme = GRADE_THEME[key] || defaultTheme;
                        const pct = totalQuills ? Math.round((value / totalQuills) * 100) : 0;
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <span className="w-10 text-sm text-[#2C1B12] font-medium">{key}</span>
                            <div className="flex-1 h-2.5 rounded-full bg-[#EFE4D6] overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: detTheme.accent }} />
                            </div>
                            <span className="w-16 text-right text-[13px] text-[#6B5B4E]">{value} · {pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Market forecast */}
                {selected.market_price_forecast && (
                  <div>
                    <p className="text-[#2C1B12] font-medium mb-4">Market price forecast</p>
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        ["This week", selected.market_price_forecast.this_week, true],
                        ["Next week", selected.market_price_forecast.next_week, false],
                        ["Next month", selected.market_price_forecast.next_month, false],
                      ].map(([label, data, primary]) => (
                        <div
                          key={label}
                          className="rounded-2xl p-5 border"
                          style={primary ? { background: "#FBF1E1", borderColor: "#E3C89A" } : { background: "#FFFFFF", borderColor: "#EFE4D6" }}
                        >
                          <p className="text-[13px] text-[#8A7A6B] mb-3">{label}</p>
                          <p className="text-xl text-[#2C1B12] font-medium mb-4" style={{ fontFamily: "Georgia, serif" }}>
                            LKR {Number(data.best_market.predicted_price).toFixed(2)}
                            <span className="text-xs text-[#8A7A6B] font-sans"> /kg</span>
                          </p>
                          <p className="text-sm text-[#2C1B12] mb-1">{data.best_market.district}</p>
                          <p className="text-[13px] text-[#6B5B4E] leading-relaxed">{data.recommendation}</p>
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

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-[#3E1B12]/8 flex flex-col md:flex-row items-center justify-between text-[13px] text-[#8A7A6B] px-8 gap-3 relative z-10">
        <span>Cinnamon grade ID system</span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4F6B4A]" />
          All systems operational
        </div>
        <span>© 2025 Ceylon Spice</span>
      </footer>
    </div>
  );
}