import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const ZONES = [
  { name: "Zone A — North Field", sub: "42 ha · Last scan 2d ago", health: "good", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=120&q=70" },
  { name: "Zone B — East Slope", sub: "31 ha · Last scan 2d ago", health: "moderate", img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=120&q=70" },
  { name: "Zone C — South Block", sub: "28 ha · Last scan 2d ago", health: "low", img: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=120&q=70" },
  { name: "Zone D — West Terrace", sub: "36 ha · Last scan 2d ago", health: "good", img: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=120&q=70" },
];

const BARS = [
  { l: "Jan", h: 68, p: false }, { l: "Feb", h: 63, p: false }, { l: "Mar", h: 77, p: false },
  { l: "Apr", h: 72, p: false }, { l: "May", h: 84, p: false },
  { l: "Jun", h: 87, p: true }, { l: "Jul", h: 80, p: true }, { l: "Aug", h: 76, p: true },
];

const ALERTS = [
  { type: "crit", icon: "⚠️", title: "Zone C NDVI Critical", desc: "South Block dropped to 0.44 — below stress threshold. Consider irrigation.", time: "2h ago" },
  { type: "warn", icon: "🌡️", title: "Temperature Anomaly", desc: "Zone B shows unusual heat stress pattern over past 10 days.", time: "1d ago" },
  { type: "info", icon: "🛰️", title: "New Sentinel-2 Pass", desc: "Fresh imagery acquired. All zones updated with latest spectral data.", time: "2d ago" },
];

const KPIS = [
  { icon: "🌾", color: "green", value: "4", label: "Active Zones", badge: "↑ 0", trend: "neu" },
  { icon: "📡", color: "cinn", value: "0.72", label: "Avg NDVI", badge: "↑ +0.04", trend: "up" },
  { icon: "⚠️", color: "warn", value: "1", label: "Alerts", badge: "New", trend: "down" },
  { icon: "📅", color: "green", value: "2d", label: "Next Satellite Pass", badge: "On schedule", trend: "neu" },
];

const ICON_BG = {
  green: "bg-[#e8f5ec] border border-[#d4edd9]",
  cinn: "bg-[#fdf3ec] border border-[rgba(200,119,58,0.22)]",
  warn: "bg-[#fffbea] border border-[rgba(220,168,52,0.25)]",
  danger: "bg-[#fef2f0] border border-[rgba(224,90,74,0.22)]",
};

const BADGE_STYLE = {
  up: "bg-[#e8f5ec] text-[#3a9460] border border-[#d4edd9]",
  down: "bg-[#fef2f0] text-[#e05a4a] border border-[rgba(224,90,74,0.2)]",
  neu: "bg-[#f8faf7] text-[#7a9882] border border-[rgba(58,148,96,0.14)]",
};

const PILL_STYLE = {
  good: "bg-[#e8f5ec] text-[#5bb87e] border border-[#d4edd9]",
  moderate: "bg-[#fffbea] text-[#dca834] border border-[rgba(220,168,52,0.3)]",
  low: "bg-[#fef2f0] text-[#e05a4a] border border-[rgba(224,90,74,0.22)]",
};

const ALERT_STYLE = {
  warn: "bg-[#fffbea] border-l-[3px] border-[#dca834]",
  info: "bg-[#e8f5ec] border-l-[3px] border-[#5bb87e]",
  crit: "bg-[#fef2f0] border-l-[3px] border-[#e05a4a]",
};

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
    <div className="font-['DM_Sans']">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden flex items-center justify-between rounded-[18px] mb-6 px-8 py-7 bg-[linear-gradient(135deg,#1a4028_0%,#11301e_100%)]">
        <div className="absolute -right-16 -top-20 w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(91,184,126,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10">
          <div className="text-sm text-white/50 mb-1">Good day,</div>
          <div className="font-['Syne'] font-extrabold text-2xl text-white">{userName} 👋</div>
          <div className="text-sm text-white/45 mt-1.5">Here's your farm health overview for today.</div>
        </div>
        <div className="relative z-10 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-2.5">
          <div>
            <div className="font-['Syne'] font-extrabold text-2xl text-[#5bb87e] leading-none">0.72</div>
            <div className="text-[0.65rem] text-white/40 uppercase tracking-wider">Avg. NDVI</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="flex flex-col gap-2.5 rounded-[18px] border border-[rgba(58,148,96,0.14)] bg-white px-[22px] pt-[22px] pb-[18px] transition-shadow hover:shadow-[0_6px_28px_rgba(0,0,0,0.07)] hover:border-[#d4edd9]"
          >
            <div className="flex justify-between items-start">
              <div className={`w-10 h-10 rounded-[11px] flex items-center justify-center text-[1.1rem] ${ICON_BG[k.color]}`}>
                {k.icon}
              </div>
              <span className={`text-[0.69rem] font-bold rounded-full px-2.5 py-[3px] tracking-wide ${BADGE_STYLE[k.trend]}`}>
                {k.badge}
              </span>
            </div>
            <div className="font-['Syne'] font-extrabold text-[2rem] text-[#1a4028] leading-none">{k.value}</div>
            <div className="text-[0.8rem] text-[#7a9882] font-medium">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Lower two-col */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4.5">

        {/* NDVI Chart + Zones */}
        <div ref={chartRef} className="rounded-[18px] border border-[rgba(58,148,96,0.14)] bg-white p-[22px]">
          <div className="flex justify-between items-center mb-4.5">
            <div className="font-['Syne'] font-bold text-[0.92rem] text-[#1a4028]">Zone A — NDVI Trend</div>
            <button
              onClick={() => navigate("predict")}
              className="text-[0.77rem] font-semibold text-[#3a9460] hover:text-[#1a4028] transition-colors bg-none border-none cursor-pointer p-0"
            >
              View Predictions →
            </button>
          </div>

          <div className="flex items-end gap-1.5 h-[130px]">
            {BARS.map((b) => (
              <div key={b.l} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-full rounded-t-[5px] transition-[height] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    b.p
                      ? "bg-[linear-gradient(180deg,rgba(200,119,58,0.35),rgba(200,119,58,0.12))] border-[1.5px] border-dashed border-[rgba(200,119,58,0.5)] border-b-0"
                      : "bg-[linear-gradient(180deg,#5bb87e,#3a9460)]"
                  }`}
                  style={{ height: chartVis ? `${b.h}%` : "0%" }}
                />
                <span className="text-[0.6rem] text-[#7a9882] font-medium">{b.l}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-3.5 pt-3 border-t border-[rgba(58,148,96,0.14)]">
            <div className="flex items-center gap-1.5 text-[0.71rem] text-[#7a9882]">
              <div className="w-[9px] h-[9px] rounded-[3px] bg-[#3a9460]" /> Recorded
            </div>
            <div className="flex items-center gap-1.5 text-[0.71rem] text-[#7a9882]">
              <div className="w-[9px] h-[9px] rounded-[3px] bg-[rgba(200,119,58,0.35)] border-[1.5px] border-dashed border-[rgba(200,119,58,0.55)]" /> Predicted
            </div>
          </div>

          {/* Zone list */}
          <div className="mt-5">
            <div className="flex justify-between items-center mb-3">
              <div className="font-['Syne'] font-bold text-[0.92rem] text-[#1a4028]">All Zones</div>
              <button
                onClick={() => navigate("fields")}
                className="text-[0.77rem] font-semibold text-[#3a9460] hover:text-[#1a4028] transition-colors bg-none border-none cursor-pointer p-0"
              >
                Manage Fields →
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {ZONES.map((z) => (
                <div
                  key={z.name}
                  onClick={() => navigate("fields")}
                  className="flex items-center gap-3.5 rounded-xl border border-[rgba(58,148,96,0.14)] bg-[#f8faf7] px-3.5 py-3 cursor-pointer transition-colors hover:border-[#d4edd9] hover:bg-white"
                >
                  <img src={z.img} alt={z.name} className="w-11 h-11 rounded-[9px] object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-['Syne'] font-bold text-[0.84rem] text-[#1a4028]">{z.name}</div>
                    <div className="text-[0.72rem] text-[#7a9882] mt-0.5">{z.sub}</div>
                  </div>
                  <div className={`text-[0.68rem] font-bold rounded-full px-2.5 py-[3px] shrink-0 tracking-wide uppercase ${PILL_STYLE[z.health]}`}>
                    {z.health === "good" ? "Healthy" : z.health === "moderate" ? "Moderate" : "Low"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts + Quick Actions */}
        <div className="self-start rounded-[18px] border border-[rgba(58,148,96,0.14)] bg-white p-[22px]">
          <div className="flex justify-between items-center mb-4.5">
            <div className="font-['Syne'] font-bold text-[0.92rem] text-[#1a4028]">Recent Alerts</div>
            <button className="text-[0.77rem] font-semibold text-[#3a9460] hover:text-[#1a4028] transition-colors bg-none border-none cursor-pointer p-0">
              View All
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {ALERTS.map((a) => (
              <div key={a.title} className={`flex items-start gap-3 rounded-xl px-3.5 py-[13px] ${ALERT_STYLE[a.type]}`}>
                <div className="text-base mt-px shrink-0">{a.icon}</div>
                <div>
                  <div className="font-['Syne'] font-bold text-[0.82rem] text-[#1a4028] mb-0.5">{a.title}</div>
                  <div className="text-[0.76rem] text-[#3d5c47] leading-relaxed">{a.desc}</div>
                  <div className="text-[0.69rem] text-[#7a9882] mt-1">{a.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <div className="font-['Syne'] font-bold text-[0.88rem] text-[#1a4028] mb-1">Quick Actions</div>
            {[
              { label: "📡  View Satellite Map", path: "map" },
              { label: "📈  Run Prediction", path: "predict" },
              { label: "📋  Download Report", path: "reports" },
            ].map((q) => (
              <button
                key={q.path}
                onClick={() => navigate(q.path)}
                className="w-full rounded-[10px] border border-[rgba(58,148,96,0.14)] bg-[#f8faf7] px-3.5 py-2.5 text-[0.82rem] font-medium text-[#3d5c47] cursor-pointer text-left transition-colors hover:bg-[#e8f5ec] hover:border-[#d4edd9]"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}