import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Bold gradient + accent per grade tier — purely presentational, falls back
// to a neutral terracotta treatment for any grade string not in the map.
const GRADE_THEME = {
  Alba: {
    gradient: "from-violet-600 via-fuchsia-500 to-orange-400",
    text: "text-violet-700",
    chipBg: "bg-violet-50",
    chipRing: "ring-violet-200",
  },
  C5: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-400",
    text: "text-emerald-700",
    chipBg: "bg-emerald-50",
    chipRing: "ring-emerald-200",
  },
  C4: {
    gradient: "from-cyan-500 via-sky-500 to-blue-400",
    text: "text-sky-700",
    chipBg: "bg-sky-50",
    chipRing: "ring-sky-200",
  },
  H2: {
    gradient: "from-orange-500 via-amber-500 to-yellow-400",
    text: "text-orange-700",
    chipBg: "bg-orange-50",
    chipRing: "ring-orange-200",
  },
};

const defaultTheme = {
  gradient: "from-rose-500 via-orange-500 to-amber-400",
  text: "text-rose-700",
  chipBg: "bg-rose-50",
  chipRing: "ring-rose-200",
};

function TopNav({ navigate }) {
  function handleLogout() {
    localStorage.removeItem("cinnamonToken");
    localStorage.removeItem("cinnamonRole");
    localStorage.removeItem("cinnamonUserId");
    localStorage.removeItem("cinnamonUserName");
    window.location.href = "/cinnamon/login";
  }

  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-amber-900/10 shadow-sm px-4 sm:px-8">
    <div className="w-full flex items-center justify-between py-4">
     <div className="flex items-center gap-2">
        <div className="w-[42px] h-[42px] rounded-[12px] bg-gradient-to-br from-[#2d8a4e] to-[#1a5c2e] flex items-center justify-center text-[20px] shadow-[0_4px_14px_rgba(44,138,78,0.35)]">
          🪵
        </div>

        <div>
          <div className="font-serif font-bold text-[18px] text-[#1a5c2e]">
            Ceylon Cinnamon
          </div>
          <div className="text-[10px] text-[#5a8a6a] tracking-[0.15em] uppercase">
            Grade Detection
          </div>
        </div>
      </div>

        <nav className="flex items-center gap-3 overflow-x-auto">
          <button
            onClick={() => navigate("/cinnamon")}
            className="whitespace-nowrap px-5 py-2 rounded-full bg-white/60 border border-amber-900/10 text-amber-900 text-sm font-medium hover:bg-white hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] transition-all duration-300"
          >
            Detection
          </button>

          <button
            onClick={() => navigate("/cinnamon/history")}
            className="whitespace-nowrap px-5 py-2 rounded-full bg-white/60 border border-amber-900/10 text-amber-900 text-sm font-medium hover:bg-white hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] transition-all duration-300"
          >
            History
          </button>

          {localStorage.getItem("cinnamonRole") === "admin" && (
            <button
              onClick={() => navigate("/cinnamon/admin")}
              className="whitespace-nowrap px-5 py-2 rounded-full bg-amber-900/5 border border-amber-900/10 text-amber-900 text-sm font-medium hover:bg-amber-900/10 hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] transition-all duration-300"
            >
              Admin Dashboard
            </button>
          )}

          <button
            onClick={handleLogout}
            className="whitespace-nowrap px-5 py-2 rounded-full bg-red-50/80 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-500 hover:text-white hover:shadow-[0_4px_12px_rgba(239,68,68,0.2)] transition-all duration-300 ml-1"
          >
            Logout
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

  const statusStyle = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("complete") || s.includes("done") || s.includes("pass")) {
      return { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
    }
    if (s.includes("fail") || s.includes("reject") || s.includes("error")) {
      return { dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" };
    }
    if (s.includes("pending") || s.includes("process")) {
      return { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
    }
    return { dot: "bg-stone-400", text: "text-stone-600", bg: "bg-stone-50" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf9f6] via-[#fffdfa] to-[#f5f0e6] flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        <TopNav navigate={navigate} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="w-16 h-16 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin relative z-10 shadow-lg" />
        <p className="text-amber-800/60 text-sm font-mono tracking-widest uppercase relative z-10 animate-pulse">Loading History…</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf9f6] via-[#fffdfa] to-[#f5f0e6] flex flex-col items-center justify-center relative overflow-hidden px-6">
        <TopNav navigate={navigate} />
        <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-300/10 blur-[120px]" />
        
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center max-w-lg w-full relative z-10 mt-20">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center mx-auto mb-8 shadow-inner border border-amber-200/50">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-amber-600" strokeWidth="1.5">
              <path d="M4 19c4-1 4-9 8-9s4 8 8 9" />
              <path d="M4 19h16" />
            </svg>
          </div>
          <h2 className="font-serif text-3xl font-medium text-slate-800 mb-4">No History Yet</h2>
          <p className="text-gray-500 leading-relaxed mb-8">
            You haven't run any cinnamon detections yet. Run your first analysis to start building your history.
          </p>
          <button
            onClick={() => navigate("/cinnamon")}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-full cursor-pointer hover:shadow-[0_12px_30px_rgba(245,158,11,0.3)] hover:-translate-y-1 transition-all duration-300"
          >
            Start Detection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
  className="min-h-screen font-sans selection:bg-amber-200 selection:text-amber-900 relative overflow-hidden"
  style={{
    background: "linear-gradient(160deg,#fff 0%,#f2faf5 50%,#d4edde 100%)"
  }}
>
      <TopNav navigate={navigate} />
      
      {/* Decorative Background Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-300/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-orange-300/10 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-24 pb-16 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 bg-white/50 p-6 rounded-3xl backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div>
            <div className="inline-flex items-center gap-3 font-mono text-[10px] tracking-[0.25em] uppercase text-amber-700 bg-amber-100/50 px-4 py-1.5 rounded-full mb-3 border border-amber-200/50">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Cinnamon Grading
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-slate-800 tracking-tight leading-tight">
              Detection History
            </h1>
            <p className="text-xs text-gray-500 mt-2 font-mono uppercase tracking-widest">
              {history.length} Total Record{history.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {history.map((item) => {
            const st = statusStyle(item.status);
            const theme = GRADE_THEME[item.final_grade] || defaultTheme;
            return (
              <div
                key={item._id}
                onClick={() => setSelected(item)}
                className="group relative bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col h-full"
              >
                {/* Gradient header band */}
                <div className={`relative h-32 bg-gradient-to-br ${theme.gradient} overflow-hidden shrink-0`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                  <svg
                    className="absolute -right-8 -top-8 opacity-20 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700 ease-out"
                    width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.5"
                  >
                    <path d="M4 19c4-1 4-9 8-9s4 8 8 9" />
                    <path d="M2 14c3-0.5 3-6 6-6s3 5.5 6 6" />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-start justify-end p-6">
                    <span className="font-mono text-[9px] font-semibold tracking-[0.2em] text-white/90 uppercase mb-1 drop-shadow-sm">
                      Final Grade
                    </span>
                    <span className="font-serif text-4xl text-white tracking-tight drop-shadow-md">
                      {item.final_grade}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between bg-gradient-to-b from-white/50 to-transparent">
                  <div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white shadow-sm ${st.bg} mb-4`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot} shadow-inner`} />
                      <span className={`text-[11px] font-mono uppercase tracking-widest font-semibold ${st.text}`}>{item.status}</span>
                    </div>
                  </div>

                  <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail modal */}
        {selected && (() => {
          const theme = GRADE_THEME[selected.final_grade] || defaultTheme;
          const st = statusStyle(selected.status);
          return (
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6"
              onClick={() => setSelected(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-[800px] max-w-full max-h-[80vh] flex flex-col overflow-hidden animate-fade-in border border-white"
              >
                {/* Modal Header */}
                <div className={`relative bg-gradient-to-br ${theme.gradient} px-8 py-8 shrink-0 overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <svg
                    className="absolute -right-12 -bottom-12 opacity-20 rotate-12"
                    width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.5"
                  >
                    <path d="M4 19c4-1 4-9 8-9s4 8 8 9" />
                    <path d="M2 14c3-0.5 3-6 6-6s3 5.5 6 6" />
                  </svg>

                  <button
                    onClick={() => setSelected(null)}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all backdrop-blur-md shadow-sm hover:scale-110"
                    aria-label="Close"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="relative z-10">
                    <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-white/90 uppercase mb-3">
                      Detection Overview
                    </p>
                    <div className="flex items-end gap-6 flex-wrap">
                      <h2 className="font-serif text-6xl text-white tracking-tight drop-shadow-md">
                        {selected.final_grade}
                      </h2>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/20 backdrop-blur-md shadow-sm mb-2`}>
                        <span className={`text-[11px] font-mono uppercase tracking-widest font-semibold text-white`}>{selected.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-10 overflow-y-auto flex-1 bg-gradient-to-b from-white to-[#faf9f6]">
                  <div className="flex items-center gap-4 font-mono text-xs tracking-[0.2em] uppercase text-amber-800/50 mb-8">
                    Detection Details
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-200/50 to-transparent" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-inner">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 3" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-1">
                          Timestamp
                        </h3>
                        <p className="text-slate-800 text-sm font-medium">
                          {new Date(selected.createdAt).toLocaleString(undefined, {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-inner">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-1">
                          Total Identified
                        </h3>
                        <p className="text-slate-800 text-lg font-serif">
                          {selected.details ? Object.values(selected.details).reduce((a,b) => a+b, 0) : 0} Quills
                        </p>
                      </div>
                    </div>
                  </div>

                  {selected.details && (
                    <>
                      <div className="flex items-center gap-4 font-mono text-xs tracking-[0.2em] uppercase text-amber-800/50 mb-6">
                        Composition Breakdown
                        <div className="flex-1 h-px bg-gradient-to-r from-amber-200/50 to-transparent" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        {Object.entries(selected.details).map(([key, value]) => {
                          const detTheme = GRADE_THEME[key] || defaultTheme;
                          return (
                            <div
                              key={key}
                              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden"
                            >
                              <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-20 -translate-y-1/2 translate-x-1/2 ${detTheme.chipBg.replace('bg-', 'bg-')}`} />
                              <p className="font-serif text-2xl text-slate-800 mb-1">{key}</p>
                              <p className="font-mono text-[10px] tracking-widest text-gray-400 uppercase">{String(value)} Unit{value > 1 ? 's' : ''}</p>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {selected.market_price_forecast && (
                    <>
                      <div className="flex items-center gap-4 font-mono text-xs tracking-[0.2em] uppercase text-amber-800/50 mb-6">
                        Market Price Forecast
                        <div className="flex-1 h-px bg-gradient-to-r from-amber-200/50 to-transparent" />
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">

                        {/* This Week */}
                        <div className="rounded-3xl border border-amber-200 bg-gradient-to-b from-white to-amber-50/40 p-6 shadow-md shadow-amber-900/5">
                          <h4 className="font-mono text-[10px] tracking-widest uppercase text-amber-600 mb-4 font-semibold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            This Week
                          </h4>
                          <p className="font-serif text-2xl text-slate-800 mb-6">
                            LKR {selected.market_price_forecast.this_week.best_market.predicted_price.toFixed(2)} <span className="font-sans text-xs text-gray-500 font-normal">/kg</span>
                          </p>
                          <div className="bg-white rounded-2xl p-4 border border-amber-50 shadow-sm text-sm text-gray-600">
                            <p className="mb-2"><strong className="text-slate-800">Optimal:</strong> {selected.market_price_forecast.this_week.best_market.district}</p>
                            <p className="leading-relaxed text-[13px]">{selected.market_price_forecast.this_week.recommendation}</p>
                          </div>
                        </div>

                        {/* Next Week */}
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                          <h4 className="font-mono text-[10px] tracking-widest uppercase text-gray-500 mb-4 font-semibold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            Next Week
                          </h4>
                          <p className="font-serif text-2xl text-slate-800 mb-6">
                            LKR {selected.market_price_forecast.next_week.best_market.predicted_price.toFixed(2)} <span className="font-sans text-xs text-gray-500 font-normal">/kg</span>
                          </p>
                          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-sm text-gray-600">
                            <p className="mb-2"><strong className="text-slate-800">Optimal:</strong> {selected.market_price_forecast.next_week.best_market.district}</p>
                            <p className="leading-relaxed text-[13px]">{selected.market_price_forecast.next_week.recommendation}</p>
                          </div>
                        </div>

                        {/* Next Month */}
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                          <h4 className="font-mono text-[10px] tracking-widest uppercase text-gray-500 mb-4 font-semibold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            Next Month
                          </h4>
                          <p className="font-serif text-2xl text-slate-800 mb-6">
                            LKR {selected.market_price_forecast.next_month.best_market.predicted_price.toFixed(2)} <span className="font-sans text-xs text-gray-500 font-normal">/kg</span>
                          </p>
                          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-sm text-gray-600">
                            <p className="mb-2"><strong className="text-slate-800">Optimal:</strong> {selected.market_price_forecast.next_month.best_market.district}</p>
                            <p className="leading-relaxed text-[13px]">{selected.market_price_forecast.next_month.recommendation}</p>
                          </div>
                        </div>

                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── FOOTER ── */}
      <footer className="py-8 border-t border-amber-900/5 flex flex-col md:flex-row items-center justify-between font-mono text-[10px] tracking-widest uppercase text-gray-400 px-8 gap-4 relative z-10 mt-auto">
        <span>Cinnamon Grade ID System</span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          All Systems Operational
        </div>
        <span>© 2025 Ceylon Spice</span>
      </footer>
    </div>
  );
}