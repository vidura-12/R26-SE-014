import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function TopNav({ navigate }) {
  function handleLogout() {
    localStorage.removeItem("cinnamonToken");
    localStorage.removeItem("cinnamonRole");
    localStorage.removeItem("cinnamonUserId");
    localStorage.removeItem("cinnamonUserName");
    window.location.href = "/cinnamon/login";
  }

  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-amber-900/10 shadow-sm px-4 sm:px-8">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between py-4">
        <div className="flex items-center gap-2 font-serif text-lg tracking-wide text-amber-950 font-medium">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
          Cinnamon <span className="text-amber-700">· Grading</span>
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

  const statusColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("complete") || s.includes("pass") || s.includes("done")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (s.includes("fail") || s.includes("reject") || s.includes("error")) return "bg-rose-100 text-rose-700 border-rose-200";
    if (s.includes("pending") || s.includes("process")) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const gradeColor = (grade) => {
    const g = String(grade || "");
    if (g.startsWith("Alba")) return "bg-violet-100 text-violet-700 border-violet-200";
    if (g.startsWith("C5")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (g.startsWith("C4")) return "bg-sky-100 text-sky-700 border-sky-200";
    if (g.startsWith("H2")) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-rose-100 text-rose-700 border-rose-200";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] font-sans selection:bg-amber-200 selection:text-amber-900 relative overflow-hidden">
      <TopNav navigate={navigate} />
      {/* Decorative Background */}
      <div className="fixed top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-amber-300/10 blur-[120px] pointer-events-none" />
      <div className="fixed top-[20%] left-[-10%] w-[30vw] h-[30vw] rounded-full bg-orange-300/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-24 relative z-10 flex-1 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 bg-white/50 p-6 rounded-3xl backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div>
            <div className="inline-flex items-center gap-3 font-mono text-[10px] tracking-[0.25em] uppercase text-amber-700 bg-amber-100/50 px-4 py-1.5 rounded-full mb-3 border border-amber-200/50">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Control Center
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-slate-800 tracking-tight leading-tight">
              Admin Dashboard
            </h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 mb-10 p-2 bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-sm inline-flex">
          {["dashboard", "users", "detections"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-300 ${
                tab === t
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-500 hover:bg-white/80 hover:text-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="transition-all duration-500">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin" />
              <p className="text-amber-800/60 text-sm font-mono tracking-widest uppercase animate-pulse">Loading data...</p>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {tab === "dashboard" && dashboard && (
                <div className="space-y-12 animate-fade-in">
                  {/* Stats Cards */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                      <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-100 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 opacity-50" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="font-mono text-xs tracking-widest uppercase text-emerald-600 font-semibold mb-2">Total Users</p>
                          <p className="font-serif text-5xl text-slate-800">{dashboard.totalUsers}</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shadow-inner">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                      <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-100 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 opacity-50" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="font-mono text-xs tracking-widest uppercase text-amber-600 font-semibold mb-2">Total Detections</p>
                          <p className="font-serif text-5xl text-slate-800">{dashboard.totalDetections}</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shadow-inner">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12h4l2-9 5 18 2-9h5"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Detections Grid */}
                  <div>
                    <h2 className="font-serif text-2xl font-medium text-slate-800 mb-6 flex items-center gap-4">
                      Recent Activity
                      <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dashboard.recentDetections.map((item) => (
                        <div key={item._id} className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold font-serif text-lg">
                                {item.userId?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{item.userId?.name}</p>
                                <p className="text-[10px] font-mono text-slate-400">{item.userId?.email}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 mb-6">
                            <div className={`px-3 py-1 rounded-full border text-xs font-bold ${gradeColor(item.final_grade)}`}>
                              {item.final_grade}
                            </div>
                            <div className={`px-3 py-1 rounded-full border text-[10px] font-mono uppercase tracking-wider font-semibold ${statusColor(item.status)}`}>
                              {item.status}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-100">
                            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
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
                <div className="animate-fade-in">
                  <h2 className="font-serif text-2xl font-medium text-slate-800 mb-6 flex items-center gap-4">
                    User Management
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {users.map((user) => (
                      <div key={user._id} className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group">
                        <div>
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-slate-600 font-bold font-serif text-2xl mb-4 border border-white shadow-inner">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <h3 className="font-bold text-slate-800 text-lg">{user.name}</h3>
                          <p className="text-xs text-slate-500 font-mono mt-1 mb-4">{user.email}</p>
                          
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono uppercase tracking-widest font-semibold text-slate-600 mb-6">
                            Role: {user.role}
                          </div>
                        </div>

                        <button
                          onClick={() => deleteUser(user._id)}
                          className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-sm font-semibold hover:bg-rose-600 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          Delete User
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detections Tab */}
              {tab === "detections" && (
                <div className="animate-fade-in">
                  <h2 className="font-serif text-2xl font-medium text-slate-800 mb-6 flex items-center gap-4">
                    All Detections
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {detections.map((item) => (
                      <div key={item._id} className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{item.userId?.name}</p>
                              <p className="text-[10px] font-mono text-slate-400">{item.userId?.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-6">
                            <div className={`px-3 py-1 rounded-full border text-xs font-bold ${gradeColor(item.final_grade)}`}>
                              {item.final_grade}
                            </div>
                            <div className={`px-3 py-1 rounded-full border text-[10px] font-mono uppercase tracking-wider font-semibold ${statusColor(item.status)}`}>
                              {item.status}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="pt-4 border-t border-gray-100 mb-4">
                            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteDetection(item._id)}
                            className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-sm font-semibold hover:bg-rose-600 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
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
      
      {/* ── FOOTER ── */}
      <footer className="py-4.5 border-t border-amber-900/5 flex flex-row items-center justify-between font-mono text-[10px] tracking-widest uppercase text-gray-400 px-8 gap-2 relative z-10">
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