import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────
// Same palette + grade theme as the History page, reused here so both
// screens read as one product.
// ─────────────────────────────────────────────────────────────────────────
const GRADE_THEME = {
  Alba: { rings: ["#FBF1E1", "#EFD5AC", "#C89A63"], accent: "#B8863B" },
  C5: { rings: ["#EFD9B8", "#CB9A61", "#8C5A32"], accent: "#A9642F" },
  C4: { rings: ["#D9AE79", "#A9642F", "#6E3E20"], accent: "#8C5A32" },
  H2: { rings: ["#B98452", "#7A4A26", "#43281A"], accent: "#7A2E1E" },
};
const defaultTheme = { rings: ["#E3D2C0", "#B08968", "#6E4A32"], accent: "#6B5B4E" };

const STATUS_STYLE = {
  success: { dot: "#4F6B4A", text: "#3E5239", bg: "#EEF3EC", border: "#D7E3D3" },
  fail: { dot: "#7A2E1E", text: "#7A2E1E", bg: "#FBEEEA", border: "#F1D4C9" },
  pending: { dot: "#B8863B", text: "#8A651F", bg: "#FBF1E1", border: "#EFD9AE" },
  neutral: { dot: "#8A7A6B", text: "#6B5B4E", bg: "#F3EEE6", border: "#E3D8C8" },
};

function statusStyle(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("complete") || s.includes("done") || s.includes("pass")) return STATUS_STYLE.success;
  if (s.includes("fail") || s.includes("reject") || s.includes("error")) return STATUS_STYLE.fail;
  if (s.includes("pending") || s.includes("process")) return STATUS_STYLE.pending;
  return STATUS_STYLE.neutral;
}

function gradeTheme(grade) {
  return GRADE_THEME[grade] || defaultTheme;
}

// Small quill-ring badge — mirrors the one on the History page, sized down
// for use in list rows here.
function QuillBadge({ grade, size = 44 }) {
  const theme = gradeTheme(grade);
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
        style={{ fontSize: size * 0.26, color: "#2C1B12", textShadow: "0 1px 2px rgba(255,255,255,0.35)" }}
      >
        {grade}
      </span>
    </div>
  );
}

function StatusChip({ status }) {
  const st = statusStyle(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border"
      style={{ background: st.bg, color: st.text, borderColor: st.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
      {status}
    </span>
  );
}

function GradeChip({ grade }) {
  const theme = gradeTheme(grade);
  return (
    <span
      className="px-3 py-1 rounded-full border text-xs font-bold"
      style={{ background: `${theme.accent}1A`, borderColor: `${theme.accent}55`, color: theme.accent }}
    >
      {grade}
    </span>
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
            className="whitespace-nowrap px-5 py-2 rounded-full bg-white/60 border border-[#3E1B12]/10 text-[#3E1B12] text-sm font-medium hover:bg-white hover:shadow-sm transition-all duration-300"
          >
            History
          </button>
          {localStorage.getItem("cinnamonRole") === "admin" && (
            <button
              onClick={() => navigate("/cinnamon/admin")}
              className="whitespace-nowrap px-5 py-2 rounded-full bg-[#3E1B12] text-[#FBF6EF] text-sm font-medium shadow-sm transition-all duration-300"
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

export default function Admin() {
  const [tab, setTab] = useState("dashboard");
  const [detections, setDetections] = useState([]);

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (tab === "dashboard") {
      fetchDashboard();
    }

    if (tab === "users") {
      fetchUsers();
    }

    if (tab === "detections") {
      fetchDetections();
    }
  }, [tab]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("cinnamonToken");

      const response = await fetch(
        "https://cinnamon-backend.agreeableisland-ddd74309.southeastasia.azurecontainerapps.io/api/admin/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      setDashboard(data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("cinnamonToken");

      const response = await fetch(
        "https://cinnamon-backend.agreeableisland-ddd74309.southeastasia.azurecontainerapps.io/api/admin/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      setUsers(data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      const token = localStorage.getItem("cinnamonToken");

      await fetch(`https://cinnamon-backend.agreeableisland-ddd74309.southeastasia.azurecontainerapps.io/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchUsers();
      fetchDashboard();
    } catch (err) {
      console.log(err);
    }
  };

  const deleteDetection = async (id) => {
    if (!window.confirm("Delete this detection?")) return;

    try {
      const token = localStorage.getItem("cinnamonToken");

      await fetch(`https://cinnamon-backend.agreeableisland-ddd74309.southeastasia.azurecontainerapps.io/api/admin/detections/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchDetections();
      fetchDashboard();
    } catch (err) {
      console.log(err);
    }
  };

  const fetchDetections = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("cinnamonToken");

      const response = await fetch(
        "https://cinnamon-backend.agreeableisland-ddd74309.southeastasia.azurecontainerapps.io/api/admin/detections",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      setDetections(data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-[#E3C89A] selection:text-[#3E1B12] relative overflow-hidden"
      style={{ background: "linear-gradient(180deg,#FBF6EF 0%,#F6EDE2 100%)" }}
    >
      <TopNav navigate={navigate} />

      {/* Decorative background, same treatment as History */}
      <div className="fixed top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-[#C89A63]/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#7A2E1E]/5 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-28 pb-20 relative z-10 flex-1 w-full">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-[0_8px_30px_rgba(62,27,18,0.06)]">
          <div>
            <div className="inline-flex items-center gap-2.5 font-mono text-[10px] tracking-[0.25em] uppercase text-[#8A651F] bg-[#FBF1E1] px-4 py-1.5 rounded-full mb-3 border border-[#EFD9AE]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8863B] animate-pulse" />
              Control center
            </div>
            <h1
              className="text-3xl md:text-4xl font-medium text-[#2C1B12] tracking-tight leading-tight"
              style={{ fontFamily: "Georgia, 'Iowan Old Style', serif" }}
            >
              Admin dashboard
            </h1>
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <div className="flex flex-wrap gap-2 mb-10 p-2 bg-white/70 backdrop-blur-md rounded-2xl border border-white shadow-sm w-fit">
          {["dashboard", "users", "detections"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-300"
              style={
                tab === t
                  ? { background: "linear-gradient(to right, #A9642F, #8C5A32)", color: "#FBF6EF", boxShadow: "0 6px 16px rgba(140,90,50,0.25)" }
                  : { color: "#8A7A6B" }
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Content area ── */}
        <div className="transition-all duration-500">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-[#E3D2C0] border-t-[#A9642F] animate-spin" />
              <p className="text-[#8C5A32] text-sm font-mono tracking-widest uppercase animate-pulse">Loading data…</p>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {tab === "dashboard" && dashboard && (
                <div className="space-y-12">
                  {/* Stats Cards */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgba(62,27,18,0.06)] relative overflow-hidden group">
                      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-700" style={{ background: "#EEF3EC" }} />
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="font-mono text-xs tracking-widest uppercase text-[#4F6B4A] font-semibold mb-2">Total users</p>
                          <p className="text-5xl text-[#2C1B12]" style={{ fontFamily: "Georgia, serif" }}>{dashboard.totalUsers}</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner" style={{ background: "#EEF3EC", borderColor: "#D7E3D3", color: "#4F6B4A" }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgba(62,27,18,0.06)] relative overflow-hidden group">
                      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-700" style={{ background: "#FBF1E1" }} />
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="font-mono text-xs tracking-widest uppercase text-[#B8863B] font-semibold mb-2">Total detections</p>
                          <p className="text-5xl text-[#2C1B12]" style={{ fontFamily: "Georgia, serif" }}>{dashboard.totalDetections}</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner" style={{ background: "#FBF1E1", borderColor: "#EFD9AE", color: "#B8863B" }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12h4l2-9 5 18 2-9h5"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Detections Grid */}
                  <div>
                    <h2 className="text-2xl font-medium text-[#2C1B12] mb-6 flex items-center gap-4" style={{ fontFamily: "Georgia, serif" }}>
                      Recent activity
                      <div className="h-px flex-1 bg-gradient-to-r from-[#E3D2C0] to-transparent" />
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dashboard.recentDetections.map((item) => (
                        <div key={item._id} className="bg-white/70 backdrop-blur-xl border border-white rounded-[1.75rem] p-6 shadow-[0_4px_16px_rgba(62,27,18,0.04)] hover:shadow-[0_10px_28px_rgba(62,27,18,0.09)] hover:-translate-y-1 transition-all duration-300">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#F3EEE6] flex items-center justify-center text-[#6B5B4E] font-bold text-lg" style={{ fontFamily: "Georgia, serif" }}>
                                {item.userId?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#2C1B12]">{item.userId?.name}</p>
                                <p className="text-[10px] font-mono text-[#B8A791]">{item.userId?.email}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-6 flex-wrap">
                            <GradeChip grade={item.final_grade} />
                            <StatusChip status={item.status} />
                          </div>

                          <div className="pt-4 border-t border-[#EFE4D6]">
                            <p className="text-[10px] font-mono text-[#B8A791] uppercase tracking-widest">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {tab === "users" && (
                <div>
                  <h2 className="text-2xl font-medium text-[#2C1B12] mb-6 flex items-center gap-4" style={{ fontFamily: "Georgia, serif" }}>
                    User management
                    <div className="h-px flex-1 bg-gradient-to-r from-[#E3D2C0] to-transparent" />
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {users.map((user) => (
                      <div key={user._id} className="bg-white/70 backdrop-blur-xl border border-white rounded-[1.75rem] p-6 shadow-[0_4px_16px_rgba(62,27,18,0.04)] flex flex-col justify-between hover:shadow-[0_10px_28px_rgba(62,27,18,0.09)] hover:-translate-y-1 transition-all duration-300">
                        <div>
                          <div className="w-14 h-14 rounded-2xl bg-[#F3EEE6] flex items-center justify-center text-[#6B5B4E] font-bold text-2xl mb-4 border border-white shadow-inner" style={{ fontFamily: "Georgia, serif" }}>
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <h3 className="font-bold text-[#2C1B12] text-lg">{user.name}</h3>
                          <p className="text-xs text-[#8A7A6B] font-mono mt-1 mb-4">{user.email}</p>

                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#F3EEE6] border border-[#E3D8C8] text-[10px] font-mono uppercase tracking-widest font-semibold text-[#6B5B4E] mb-6">
                            Role: {user.role}
                          </div>
                        </div>

                        <button
                          onClick={() => deleteUser(user._id)}
                          className="w-full py-2.5 rounded-xl border text-sm font-semibold transition-colors duration-300 flex items-center justify-center gap-2"
                          style={{ borderColor: "#F1D4C9", background: "#FBEEEA", color: "#7A2E1E" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#7A2E1E"; e.currentTarget.style.color = "#FBF6EF"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "#FBEEEA"; e.currentTarget.style.color = "#7A2E1E"; }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          Delete user
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detections Tab */}
              {tab === "detections" && (
                <div>
                  <h2 className="text-2xl font-medium text-[#2C1B12] mb-6 flex items-center gap-4" style={{ fontFamily: "Georgia, serif" }}>
                    All detections
                    <div className="h-px flex-1 bg-gradient-to-r from-[#E3D2C0] to-transparent" />
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {detections.map((item) => (
                      <div key={item._id} className="bg-white/70 backdrop-blur-xl border border-white rounded-[1.75rem] p-6 shadow-[0_4px_16px_rgba(62,27,18,0.04)] hover:shadow-[0_10px_28px_rgba(62,27,18,0.09)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <QuillBadge grade={item.final_grade} size={38} />
                              <div>
                                <p className="text-sm font-bold text-[#2C1B12]">{item.userId?.name}</p>
                                <p className="text-[10px] font-mono text-[#B8A791]">{item.userId?.email}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-6">
                            <GradeChip grade={item.final_grade} />
                            <StatusChip status={item.status} />
                          </div>
                        </div>

                        <div>
                          <div className="pt-4 border-t border-[#EFE4D6] mb-4">
                            <p className="text-[10px] font-mono text-[#B8A791] uppercase tracking-widest">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteDetection(item._id)}
                            className="w-full py-2.5 rounded-xl border text-sm font-semibold transition-colors duration-300 flex items-center justify-center gap-2"
                            style={{ borderColor: "#F1D4C9", background: "#FBEEEA", color: "#7A2E1E" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#7A2E1E"; e.currentTarget.style.color = "#FBF6EF"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#FBEEEA"; e.currentTarget.style.color = "#7A2E1E"; }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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