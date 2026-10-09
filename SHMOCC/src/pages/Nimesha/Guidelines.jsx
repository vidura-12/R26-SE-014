import { useNavigate } from "react-router-dom";
import {
  Sun, Scan, Ban, UploadCloud, Camera, Ruler, CheckCircle2,
  Layers, ScanLine, Sparkles, AlertTriangle, ImageOff,
} from "lucide-react";

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
            onClick={() => navigate("/cinnamon/guidelines")}
            className="whitespace-nowrap px-5 py-2 rounded-full bg-[#3E1B12] text-[#FBF6EF] text-sm font-medium shadow-sm transition-all duration-300"
          >
            Guideline to get images
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
              className="whitespace-nowrap px-5 py-2 rounded-full bg-[#3E1B12]/5 border border-[#3E1B12]/10 text-[#3E1B12] text-sm font-medium hover:bg-[#3E1B12]/10 transition-all duration-300"
            >
              Admin dashboard
            </button>
          )}
          <button
            onClick={handleLogout}
            className="whitespace-nowrap px-5 py-2 rounded-full bg-[#7A2E1E]/8 border border-[#7A2E1E]/20 text-[#7A2E1E] text-sm font-semibold hover:bg-[#7A2E1E] hover:text-white transition-all duration-300 ml-1"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Small illustrative diagrams — no external images needed.          */
/* ------------------------------------------------------------------ */

function QuillIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="quillBark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B57F49" />
          <stop offset="100%" stopColor="#7A4A25" />
        </linearGradient>
      </defs>
      <rect x="16" y="14" width="48" height="52" rx="24" fill="url(#quillBark)" />
      <ellipse cx="40" cy="16" rx="18" ry="7" fill="#E7C79B" />
      <ellipse cx="40" cy="16" rx="11" ry="4.2" fill="#7A4A25" />
      {[24, 32, 40, 48, 56].map(y => (
        <path key={y} d={`M18 ${y} Q40 ${y - 6} 62 ${y}`} stroke="rgba(0,0,0,0.14)" strokeWidth="1.4" fill="none" />
      ))}
    </svg>
  );
}

function BundleIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bundleBark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B57F49" />
          <stop offset="100%" stopColor="#7A4A25" />
        </linearGradient>
      </defs>
      {[-16, -6, 4, 14].map((dx, i) => (
        <g key={i} transform={`translate(${dx} 0) rotate(${(i - 1.5) * 6} 40 40)`}>
          <rect x="30" y="10" width="20" height="58" rx="10" fill="url(#bundleBark)" opacity={0.96} />
          <ellipse cx="40" cy="12" rx="8" ry="3.4" fill="#E7C79B" />
        </g>
      ))}
      <path d="M18 44 Q40 52 62 44" stroke="#D9AE79" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* A top-down distance gauge: camera -> gap -> subject */
function DistanceGauge({ label, sub, fill }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center text-[#8C5A32]">
        <Camera className="w-6 h-6" strokeWidth={1.8} />
      </div>
      <div className="flex-1 relative h-[3px] bg-[#3E1B12]/12 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#D9AE79] to-[#8C5A32]" style={{ width: `${fill}%` }} />
        <div className="absolute inset-0 flex items-center justify-between px-[2px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="w-[1px] h-2 bg-[#3E1B12]/15 -translate-y-[2px]" />
          ))}
        </div>
      </div>
      <div className="text-right">
        <div className="font-serif font-bold text-[#3E1B12] leading-none">{label}</div>
        <div className="text-[11px] text-[#8C5A32]">{sub}</div>
      </div>
    </div>
  );
}

function RuleItem({ icon: Icon, children, tone = "do" }) {
  const good = tone === "do";
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-0.5 flex-none w-6 h-6 rounded-full flex items-center justify-center ${good ? "bg-[#4F6B4A]/12 text-[#4F6B4A]" : "bg-[#7A2E1E]/10 text-[#7A2E1E]"}`}>
        <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
      </span>
      <span className="text-[14.5px] leading-relaxed text-[#4A3225]">{children}</span>
    </li>
  );
}

const MISTAKES = [
  { icon: ImageOff, text: "Blurry or dark photos" },
  { icon: Ruler, text: "Shot too far away or too close" },
  { icon: Sun, text: "Strong shadows or uneven lighting" },
  { icon: Layers, text: "Quills hidden behind other quills" },
  { icon: ScanLine, text: "Only part of a quill or bundle in frame" },
  { icon: Sparkles, text: "Filters or edits applied before upload" },
];

const CHECKLIST = [
  "Image is sharp and well-lit",
  "Cinnamon is clearly visible",
  "Recommended camera distance kept consistent",
  "Retaken if the cinnamon was hard to see",
];

export default function Guidelines() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FBF6EF] font-sans selection:bg-[#E3D2C0] selection:text-[#3E1B12] relative overflow-hidden flex flex-col">
      <TopNav navigate={navigate} />

      {/* Decorative background */}
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#E3D2C0]/20 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#D9AE79]/10 blur-[150px] pointer-events-none" />
      <div className="fixed top-[30%] left-[50%] -translate-x-1/2 w-[70vw] h-[40vw] rounded-full bg-[#6484AF]/5 blur-[160px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-32 pb-20 relative z-10 w-full flex-1">

        {/* Hero */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-[#3E1B12]/10 text-[11px] font-semibold tracking-wide uppercase text-[#8C5A32] mb-6">
            <Scan className="w-3.5 h-3.5" /> Image capture guide
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#3E1B12] tracking-tight leading-[1.05] mb-4">
            Capture cinnamon the<br className="hidden sm:block" /> way the model sees it
          </h1>
          <p className="text-[15.5px] sm:text-base text-[#8C5A32] italic max-w-xl mx-auto">
            A few careful choices in how you shoot each photo make grade detection
            noticeably more reliable. Here's exactly what to do.
          </p>
        </div>

        {/* Step 1 + 4 mistakes bento row */}
        <div className="grid md:grid-cols-5 gap-5 mb-6">
          <section className="md:col-span-3 bg-white/60 backdrop-blur-xl border border-white/80 rounded-[28px] p-7 sm:p-9 shadow-[0_8px_30px_rgba(62,27,18,0.04)]">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-9 h-9 rounded-full bg-[#6484AF]/12 text-[#6484AF] flex items-center justify-center font-serif font-bold">1</span>
              <h2 className="text-xl font-bold text-[#3E1B12]">Before taking the photo</h2>
            </div>
            <ul className="space-y-3.5">
              <RuleItem icon={CheckCircle2}>Place the cinnamon on a flat, plain background.</RuleItem>
              <RuleItem icon={CheckCircle2}>Use good, natural lighting.</RuleItem>
              <RuleItem icon={CheckCircle2}>Avoid shadows, reflections, and blurry images.</RuleItem>
              <RuleItem icon={CheckCircle2}>Clean the camera lens before taking the photo.</RuleItem>
            </ul>
          </section>

          <section className="md:col-span-2 bg-[#3E1B12] text-[#FBF6EF] rounded-[28px] p-7 sm:p-8 shadow-[0_8px_30px_rgba(62,27,18,0.18)] flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <Ban className="w-4 h-4" strokeWidth={2.2} />
              </span>
              <h2 className="text-lg font-bold">Avoid these mistakes</h2>
            </div>
            <ul className="space-y-3 flex-1">
              {MISTAKES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[13.5px] text-[#F3E4CE]">
                  <Icon className="w-4 h-4 flex-none text-[#D9AE79]" strokeWidth={1.8} />
                  {text}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Step 2 + 3: quill vs bundle */}
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          <section className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[28px] p-7 sm:p-8 shadow-[0_8px_30px_rgba(62,27,18,0.04)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-9 h-9 rounded-full bg-[#6484AF]/12 text-[#6484AF] flex items-center justify-center font-serif font-bold">2</span>
              <h2 className="text-lg font-bold text-[#3E1B12]">Capturing a single quill</h2>
            </div>

            <div className="rounded-2xl bg-[#FBF1E1]/70 border border-[#EFD5AC] p-5 mb-6 flex items-center gap-5">
              <QuillIcon className="w-14 h-14 flex-none drop-shadow-sm" />
              <div className="flex-1">
                <DistanceGauge label="4 in" sub="≈ 10 cm camera distance" fill={32} />
              </div>
            </div>

            <ul className="space-y-3">
              <RuleItem icon={CheckCircle2}>Keep the entire quill inside the camera frame.</RuleItem>
              <RuleItem icon={CheckCircle2}>Make sure the quill is clearly visible and in focus.</RuleItem>
              <RuleItem icon={CheckCircle2}>Avoid overlapping quills.</RuleItem>
              <RuleItem icon={CheckCircle2}>Hold the camera steady while taking the photo.</RuleItem>
            </ul>
          </section>

          <section className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[28px] p-7 sm:p-8 shadow-[0_8px_30px_rgba(62,27,18,0.04)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-9 h-9 rounded-full bg-[#6484AF]/12 text-[#6484AF] flex items-center justify-center font-serif font-bold">3</span>
              <h2 className="text-lg font-bold text-[#3E1B12]">Capturing a bundle</h2>
            </div>

            <div className="rounded-2xl bg-[#FBF1E1]/70 border border-[#EFD5AC] p-5 mb-6 flex items-center gap-5">
              <BundleIcon className="w-14 h-14 flex-none drop-shadow-sm" />
              <div className="flex-1">
                <DistanceGauge label="12 in" sub="≈ 30 cm camera distance" fill={78} />
              </div>
            </div>

            <ul className="space-y-3">
              <RuleItem icon={CheckCircle2}>Capture the entire bundle in one photo.</RuleItem>
              <RuleItem icon={CheckCircle2}>Arrange the quills so they are clearly visible.</RuleItem>
              <RuleItem icon={CheckCircle2}>Avoid excessive overlapping where possible.</RuleItem>
              <RuleItem icon={CheckCircle2}>Do not crop the edges of the bundle.</RuleItem>
            </ul>
          </section>
        </div>

        {/* Distance matters callout */}
        <div className="mb-6 rounded-[28px] bg-gradient-to-r from-[#FBF1E1] to-[#F3E4CE] border border-[#EFD5AC] p-6 sm:p-7 flex items-start gap-4">
          <span className="flex-none w-10 h-10 rounded-full bg-[#B8863B]/15 text-[#B8863B] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" strokeWidth={2} />
          </span>
          <p className="text-[14.5px] leading-relaxed text-[#5C4328]">
            <strong className="text-[#B8863B]">Important:</strong> camera distance changes how large or small a quill
            appears in the frame. Keeping the recommended distances consistent — 4 in for a single quill,
            12 in for a bundle — helps the model compare images fairly and gives more reliable results.
          </p>
        </div>

        {/* Pre-upload checklist */}
        <section className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[28px] p-7 sm:p-9 shadow-[0_8px_30px_rgba(62,27,18,0.04)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-9 h-9 rounded-full bg-[#4F6B4A]/12 text-[#4F6B4A] flex items-center justify-center">
              <UploadCloud className="w-4.5 h-4.5" strokeWidth={2} />
            </span>
            <h2 className="text-xl font-bold text-[#3E1B12]">Before uploading — quick checklist</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {CHECKLIST.map(item => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#FBF6EF] border border-[#3E1B12]/8 px-4 py-3.5">
                <CheckCircle2 className="w-4.5 h-4.5 flex-none text-[#4F6B4A]" strokeWidth={2.2} />
                <span className="text-[14px] text-[#4A3225] font-medium">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── FOOTER ── */}
      <footer className="py-6 border-t border-[#3E1B12]/5 flex flex-col md:flex-row items-center justify-between font-mono text-[10px] tracking-widest uppercase text-[#8C5A32]/60 px-8 gap-4 relative z-10 mt-auto">
        <span>Cinnamon Grade ID System</span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4F6B4A]"></span>
          All Systems Operational
        </div>
        <span>© 2025 Ceylon Spice</span>
      </footer>
    </div>
  );
}