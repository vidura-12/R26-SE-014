import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import img1 from "../../assets/7.jpg";
import img2 from "../../assets/2.jpg";
import img3 from "../../assets/5.jpg";
import img4 from "../../assets/6.jpg";

const GRADE_DATA = {
  Alba: {
    description: "Alba — highest grade of Ceylon cinnamon, made from the thinnest and most delicate inner bark. Very light colour, smooth texture, and premium aroma.",
    quality: "Ultra Premium",
    thickness: "< 0.5 mm",
    origin: "True Ceylon Cinnamon (Cinnamomum verum)",
    tier: "premium",
        },
  C5: {
    description: "Extra Special — finest grade, thin uniform quills, soft texture, pale tan colour with a delicate aroma. Sourced from innermost bark layers.",
    quality: "Premium",
    thickness: "< 1 mm",
    origin: "True Ceylon Cinnamon (Cinnamomum verum)",
    tier: "premium",
  },
  C4: {
    description: "Special — high quality quills, slightly thicker than C5 but retaining excellent flavour compounds and aroma profile.",
    quality: "Premium",
    thickness: "1 – 1.5 mm",
    origin: "True Ceylon Cinnamon (Cinnamomum verum)",
    tier: "premium",
  },
  H2: {
    description: "Hamburg Grade 2 — thicker quills with more visible imperfections. Good flavour retention suitable for industrial and bulk use.",
    quality: "Standard",
    thickness: "2 – 3 mm",
    origin: "True Ceylon Cinnamon (Cinnamomum verum)",
    tier: "standard",
  },

};

// Colour tokens per grade tier
const GRADE_COLORS = {
  C5: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", bar: "bg-emerald-500" },
  C4: { bg: "bg-teal-50",    border: "border-teal-200",    text: "text-teal-700",    badge: "bg-teal-100 text-teal-800 border-teal-200",    bar: "bg-teal-500"    },
  H1: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-800 border-amber-200",   bar: "bg-amber-500"   },
  H2: { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700",  badge: "bg-orange-100 text-orange-800 border-orange-200",  bar: "bg-orange-500"  },
  M5: { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700",    badge: "bg-rose-100 text-rose-800 border-rose-200",    bar: "bg-rose-500"    },
};

function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export default function Cinnamon() {
  const [image, setImage] = useState(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef();
  const cameraInputRef = useRef();
  const videoRef = useRef();
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const navigate = useNavigate();

  function handleLogout() {
  localStorage.removeItem("cinnamonToken");
  localStorage.removeItem("cinnamonRole");
  localStorage.removeItem("cinnamonUserId");
  localStorage.removeItem("cinnamonUserName");

  window.location.href = "/cinnamon/login";
}

  const [resultTab, setResultTab] = useState("grade");

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid JPG or PNG image.");
      return;
    }
    setError("");
    setResult(null);
    setResultTab("grade");
    const url = URL.createObjectURL(file);
    setImage({ url, name: file.name, size: fmtBytes(file.size) });
  }

  function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  }

  function handleCameraClick(e) {
    e?.stopPropagation();
    if (isMobile()) {
      cameraInputRef.current?.click();
    } else {
      setShowCamera(true);
    }
  }

  function handleCameraChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  useEffect(() => {
    if (showCamera) {
      (async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(mediaStream);
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch {
          setError("Unable to access camera.");
          setShowCamera(false);
        }
      })();
    } else {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [showCamera]);

  function handleCapturePhoto() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        handleFile(new File([blob], "captured-photo.jpg", { type: "image/jpeg" }));
        setShowCamera(false);
      }
    }, "image/jpeg");
  }

  function handleDrop(e) {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function analyze() {
    if (!image) {
        setError("Please upload an image first.");
        return;
    }

    setError("");
    setLoading(true);

    try {
        const fileInput = inputRef.current.files[0];

        const formData = new FormData();
        formData.append("image", fileInput);

        const token = localStorage.getItem("cinnamonToken");

        const res = await fetch("https://cinnamon-backend.agreeableisland-ddd74309.southeastasia.azurecontainerapps.io/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await res.json();

        setResult(data.data); 
    } catch (err) {
        setError("Failed to connect to backend");
    }

    setLoading(false);
    }

  function reset() {
    setImage(null);
    setResult(null);
    setError("");
    setResultTab("grade");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#faf9f6] via-[#fffdfa] to-[#f5f0e6] text-gray-800 font-sans overflow-x-hidden px-4 sm:px-8 relative selection:bg-amber-200 selection:text-amber-900">
      
      {/* Decorative Background Elements */}
      <div className="fixed top-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-300/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-orange-300/10 blur-[150px] pointer-events-none" />

      {/* ── HERO ── */}
      <header className="pt-20 pb-10 flex flex-col items-start px-4 relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col items-center lg:items-start w-full">
          <div className="flex w-full justify-between items-center mb-10">
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/cinnamon/history")}
                className="px-6 py-2.5 rounded-full bg-white/70 backdrop-blur-md border border-amber-900/10 text-amber-900 font-medium hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300"
              >
                History
              </button>
              {localStorage.getItem("cinnamonRole") === "admin" && (
                <button
                  onClick={() => navigate("/cinnamon/admin")}
                  className="px-6 py-2.5 rounded-full bg-amber-900/5 backdrop-blur-md border border-amber-900/10 text-amber-900 font-medium hover:bg-amber-900/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  Admin Dashboard
                </button>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="fixed top-8 right-8 z-50 px-6 py-2.5 rounded-full bg-red-50/80 text-red-600 font-semibold border border-red-200 hover:bg-red-500 hover:text-white hover:shadow-[0_8px_30px_rgba(239,68,68,0.3)] hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md"
            >
              Logout
            </button>
          </div>
          
          
          <h1 className="font-serif text-[clamp(40px,7vw,80px)] font-medium text-slate-800 tracking-tight leading-[1.1] mb-6 text-center lg:text-left w-full drop-shadow-sm">
            Cinnamon <em className="italic bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 pr-2">Grade</em><br/>Identification
          </h1>
        </div>
      </header>

      {/* ── UPLOAD ── */}
      <section className="py-10 px-4 relative z-10 max-w-7xl mx-auto">
        <p className="text-base text-gray-600/90 leading-relaxed mb-10 max-w-2xl text-center lg:text-left mx-auto lg:mx-0 font-light">
          Upload a cinnamon image to instantly detect and classify its grade, quality tier, and origin using advanced visual analysis models.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-stretch">
          <div
            className={`group relative rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 outline-none overflow-hidden
              ${drag ? "border-amber-400 bg-amber-50/80 scale-[1.02] shadow-xl" : "border-amber-200/60 bg-white/60 hover:bg-white/90 hover:border-amber-300 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1"}
              border-2 border-dashed backdrop-blur-xl`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => handleFile(e.target.files[0])}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCameraChange}
            />

            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mx-auto mb-6 text-amber-600 shadow-inner border border-amber-100 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="relative font-serif text-2xl font-medium text-slate-800 mb-2">Upload Cinnamon Image</p>
            <p className="relative text-sm text-gray-500/90 leading-relaxed mb-6 font-light">Drag & drop, click to browse, or take a photo</p>
            
            <div className="relative inline-flex gap-2">
              {["JPG", "PNG"].map((fmt) => (
                <span key={fmt} className="font-mono text-[10px] tracking-widest px-3 py-1 bg-white border border-gray-200/80 rounded-md text-gray-500 uppercase shadow-sm">{fmt}</span>
              ))}
            </div>
            
            <div className="relative mt-8">
              <button
                type="button"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-slate-900 text-white text-sm font-medium rounded-full cursor-pointer hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all duration-300"
                onClick={handleCameraClick}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                Take Photo
              </button>
            </div>
          </div>

          <div className={`relative rounded-3xl p-6 flex flex-col transition-all duration-500 shadow-sm backdrop-blur-xl border ${image ? "border-amber-300/60 bg-gradient-to-b from-white/90 to-amber-50/50 shadow-[0_20px_40px_rgb(217,119,6,0.08)]" : "border-gray-200/60 bg-white/40"}`}>
            {image ? (
              <div className="flex flex-col h-full animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-amber-700 font-semibold">Sample Preview</p>
                  <p className="font-mono text-[10px] bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100 text-gray-500">{image.size}</p>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-amber-200/50 bg-white aspect-square shadow-inner flex-1 group">
                  <img src={image.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="preview" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  <button
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-gray-600 hover:text-red-600 text-lg leading-none flex items-center justify-center border border-white shadow-lg backdrop-blur-md cursor-pointer hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                  >×</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-10 opacity-60">
                <div className="w-14 h-14 rounded-2xl bg-gray-100/80 border border-gray-200/80 flex items-center justify-center text-gray-400 shadow-inner">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="8.5" cy="8.5" r="2"/>
                    <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-1 font-semibold">No Sample Yet</p>
                  <p className="text-xs text-gray-400 max-w-[180px] mx-auto leading-relaxed">Your image will preview here once uploaded</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Camera modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 relative max-w-lg w-full shadow-2xl animate-fade-in border border-white/20">
              <div className="overflow-hidden rounded-2xl bg-black shadow-inner mb-6">
                <video ref={videoRef} autoPlay playsInline className="w-full object-cover" />
              </div>
              <div className="flex gap-4">
                <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-base font-medium rounded-xl hover:shadow-[0_10px_20px_rgba(217,119,6,0.3)] hover:-translate-y-0.5 transition-all duration-300" onClick={handleCapturePhoto}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><circle cx="12" cy="13" r="3" /></svg>
                  Capture
                </button>
                <button className="px-8 py-4 bg-gray-100 text-gray-700 text-base font-medium rounded-xl hover:bg-gray-200 hover:text-gray-900 transition-colors" onClick={() => setShowCamera(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-center gap-3 px-5 py-4 border border-red-200 bg-red-50/80 backdrop-blur-sm rounded-xl text-sm text-red-700 shadow-sm animate-fade-in max-w-lg">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-500">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Analyze button */}
        <div className="mt-10 flex justify-center lg:justify-start">
          <button
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-base font-medium rounded-full cursor-pointer transition-all duration-300 hover:shadow-[0_12px_30px_rgba(245,158,11,0.3)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none overflow-hidden"
            onClick={analyze}
            disabled={!image || loading}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative flex items-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analysing Details…
                </>
              ) : (
                <>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  Identify Grade
                </>
              )}
            </span>
          </button>
        </div>
      </section>

      {/* ── RESULT SECTION ── */}
      {result && (() => {
        const isMixed = result.status === "Mixed Grades Detected";
        const finalGrade = result.final_grade;
        const forecast = result.market_price_forecast;
        const gradeInfo = GRADE_DATA[finalGrade] || {};
        const colors = GRADE_COLORS[finalGrade] || GRADE_COLORS["H2"];
        const detailEntries = Object.entries(result.details);
        const totalQuills = detailEntries.reduce((s, [, v]) => s + v, 0);
        const isSingleQuill = totalQuills === 1;

        const TABS = [
          { id: "grade", label: "Cinnamon Grade", icon: "🌿" },
          { id: "description", label: "Description", icon: "📋" },
          ...(forecast ? [{ id: "market", label: "Market Price", icon: "📈" }] : []),
        ];

        return (
          <section className="py-14 px-4 relative z-10 max-w-7xl mx-auto animate-fade-in">
            <div className="flex items-center gap-4 font-mono text-xs tracking-[0.2em] uppercase text-amber-800/50 mb-10">
              Analysis Results
              <div className="flex-1 h-px bg-gradient-to-r from-amber-200/50 to-transparent" />
            </div>

            {/* Status banner */}
            <div className={`relative overflow-hidden flex items-center justify-between p-6 rounded-2xl mb-10 shadow-sm border backdrop-blur-md ${isMixed ? "bg-orange-50/80 border-orange-200/60" : "bg-emerald-50/80 border-emerald-200/60"}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
              <div className="relative flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner ${isMixed ? "bg-orange-100 text-orange-500" : "bg-emerald-100 text-emerald-500"}`}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Status</p>
                  <p className={`font-serif text-lg md:text-xl font-medium tracking-tight ${isMixed ? "text-orange-800" : "text-emerald-800"}`}>
                    {isSingleQuill ? `${finalGrade} Single Quill Detected` : result.status}
                  </p>
                </div>
              </div>
              <span className={`relative font-mono text-xs tracking-[0.15em] uppercase px-4 py-1.5 rounded-full border shadow-sm font-semibold ${isMixed ? "bg-white text-orange-600 border-orange-200" : "bg-white text-emerald-600 border-emerald-200"}`}>
                {isSingleQuill ? "Single Quill" : isMixed ? "Mixed Bundle" : "Pure Bundle"}
              </span>
            </div>

            {/* Segmented tab control */}
            <div className="inline-flex flex-wrap gap-2 p-1.5 rounded-2xl border border-gray-200/60 bg-white/50 backdrop-blur-md shadow-sm mb-10">
              {TABS.map((t) => {
                const active = resultTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setResultTab(t.id)}
                    className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300
                      ${active
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                        : "text-gray-600 hover:text-amber-700 hover:bg-white/80"}`}
                  >
                    <span className={`text-lg leading-none ${active ? "opacity-100" : "opacity-70"}`}>{t.icon}</span>
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* ── TAB: CINNAMON GRADE ── */}
            {resultTab === "grade" && (
              <div className="animate-fade-in">
                {/* Top stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="p-8 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 -translate-y-1/2 translate-x-1/2 transition-opacity duration-500 group-hover:opacity-40 ${colors.bg.replace('bg-', 'bg-')}`} />
                    <p className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-4 font-semibold">Final Grade</p>
                    <p className={`font-serif text-5xl md:text-6xl font-medium tracking-tight mb-2 ${colors.text}`}>{finalGrade}</p>
                    <div className="inline-flex items-center gap-2 mt-2">
                      <span className={`w-2 h-2 rounded-full ${colors.bar}`} />
                      <p className="text-sm font-medium text-gray-600">{gradeInfo.quality} Tier</p>
                    </div>
                  </div>
                  
                  <div className="p-8 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <p className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-4 font-semibold">Total Quills</p>
                    <p className="font-serif text-5xl md:text-6xl font-medium text-slate-800 tracking-tight mb-2">{totalQuills}</p>
                    <div className="inline-flex items-center gap-2 mt-2">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                      <p className="text-sm font-medium text-gray-600">{isMixed ? `${detailEntries.length} varieties identified` : "Pure homogeneous sample"}</p>
                    </div>
                  </div>
                  
                  <div className="p-8 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <p className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-4 font-semibold">Value Insight</p>
                    <p className="font-serif text-lg font-medium text-slate-800 leading-snug">
                      {finalGrade === "Alba" && "Top-tier harvest. Commands highest market premium due to delicate crafting."}
                      {finalGrade === "C5" && "Premium export grade. Exceptional balance of flavor and aesthetic quality."}
                      {finalGrade === "C4" && "High-demand commercial grade. Ideal for premium retail packaging."}
                      {finalGrade === "H2" && "Standard grade. Cost-effective for culinary, bulk, and industrial processing."}
                    </p>
                  </div>
                </div>

                {/* Distribution bar */}
                {isMixed && (
                  <div className="mb-10 border border-white/80 rounded-3xl p-8 bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex justify-between items-end mb-5">
                      <p className="font-mono text-xs tracking-widest uppercase text-gray-400 font-semibold">Bundle Composition</p>
                      <p className="text-sm font-medium text-gray-500">{totalQuills} Total</p>
                    </div>
                    <div className="flex h-4 rounded-full overflow-hidden gap-1 bg-gray-100 shadow-inner">
                      {detailEntries.map(([grade, count]) => {
                        const col = GRADE_COLORS[grade] || GRADE_COLORS["H2"];
                        return (
                          <div
                            key={grade}
                            className={`${col.bar} transition-all duration-1000 ease-out`}
                            style={{ width: `${(count / totalQuills) * 100}%` }}
                            title={`${grade}: ${count}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-6 mt-6">
                      {detailEntries.map(([grade, count]) => {
                        const col = GRADE_COLORS[grade] || GRADE_COLORS["H2"];
                        const percentage = Math.round((count / totalQuills) * 100);
                        return (
                          <div key={grade} className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                            <span className={`w-3 h-3 rounded-full shadow-inner ${col.bar}`} />
                            <div className="flex flex-col">
                              <span className="font-serif font-medium text-slate-800 text-sm">{grade}</span>
                              <span className="font-mono text-[10px] text-gray-500">{count} quill{count > 1 ? "s" : ""} ({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Per-grade detail rows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {detailEntries.map(([grade, count]) => {
                    const info = GRADE_DATA[grade] || {};
                    const col = GRADE_COLORS[grade] || GRADE_COLORS["H2"];
                    const isPrimary = grade === finalGrade;
                    return (
                      <div key={grade} className={`relative overflow-hidden border rounded-3xl p-8 transition-all duration-300 hover:shadow-lg ${isPrimary ? `${col.bg} ${col.border} shadow-md` : "bg-white/60 backdrop-blur-xl border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:-translate-y-1"}`}>
                        {isPrimary && <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/40 rounded-full blur-2xl" />}
                        
                        <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`font-serif text-3xl font-medium tracking-tight ${col.text}`}>{grade}</span>
                              {isPrimary && (
                                <span className={`font-mono text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border font-semibold shadow-sm ${col.badge}`}>
                                  Dominant
                               </span>
                              )}
                            </div>
                            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-gray-200/80 bg-white/80 text-gray-600 shadow-sm">
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                              {info.quality}
                            </span>
                          </div>
                          <div className="text-right bg-white/80 px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                            <p className={`font-serif text-4xl font-medium ${col.text}`}>{count}</p>
                            <p className="font-mono text-[10px] text-gray-500 font-semibold mt-1 uppercase tracking-wider">Count</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 relative z-10 bg-white/40 p-4 rounded-2xl border border-white/60">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Diameter</span>
                            <span className="font-mono font-medium text-slate-800 bg-white px-2 py-0.5 rounded shadow-sm">{info.thickness}</span>
                          </div>
                          <div className="h-px w-full bg-gray-200/50" />
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Botanical Origin</span>
                            <span className="text-slate-800 text-xs font-medium text-right max-w-[150px] truncate">{info.origin}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TAB: GRADE DESCRIPTION ── */}
            {resultTab === "description" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="p-8 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-slate-800 tracking-tight mb-4">Grade Specifications</h3>
                  <p className="text-[15px] leading-relaxed text-gray-600 mb-6">{gradeInfo.description}</p>
                  <div className="inline-flex items-center gap-2">
                    <span className={`font-mono text-[10px] tracking-widest uppercase px-4 py-1.5 rounded-full border shadow-sm font-semibold ${colors.badge}`}>
                      {gradeInfo.quality}
                    </span>
                  </div>
                </div>
                
                <div className="p-8 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-slate-800 tracking-tight mb-4">Origin & Certification</h3>
                  <p className="text-[15px] leading-relaxed text-gray-600 mb-6">
                    Authentic <strong className="text-slate-800 font-medium">Grade {finalGrade}</strong> classified under the Sri Lanka Standards Institution (SLSI 135) framework. 
                    Derived from <em className="text-slate-800">{gradeInfo.origin}</em>, confirming premium botanical integrity and traditional harvesting methods.
                  </p>
                  <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-1.5 rounded-full border border-amber-200/80 bg-amber-50 text-amber-700 shadow-sm font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    Ceylon Verified
                  </span>
                </div>
              </div>
            )}

            {/* ── TAB: MARKET PRICE ── */}
            {resultTab === "market" && forecast && (
              <div className="animate-fade-in">
                {forecast.available === false ? (
                  <div className="border border-orange-200/80 bg-orange-50/80 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="font-serif text-3xl font-medium text-orange-800 mb-4">
                      Forecast Unavailable
                    </h3>
                    <p className="text-orange-900/70 text-lg max-w-md">
                      {forecast.message}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[
                      { title: "This Week", data: forecast.this_week, highlight: true },
                      { title: "Next Week", data: forecast.next_week, highlight: false },
                      { title: "Next Month", data: forecast.next_month, highlight: false },
                    ].map((item, idx) => (
                      <div
                        key={item.title}
                        className={`border rounded-3xl overflow-hidden transition-transform duration-300 hover:-translate-y-1 ${item.highlight ? 'border-amber-200 bg-gradient-to-b from-white/90 to-amber-50/40 shadow-lg shadow-amber-900/5' : 'border-white/80 bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}
                      >
                        <div className={`px-8 py-6 border-b ${item.highlight ? 'border-amber-100 bg-amber-50/50' : 'border-gray-100 bg-white/50'}`}>
                          <p className={`font-mono text-[10px] tracking-[0.2em] uppercase mb-2 font-semibold ${item.highlight ? 'text-amber-600' : 'text-gray-400'}`}>{item.title}</p>
                          <h3 className="font-serif text-2xl text-slate-800">{item.data.forecast_period}</h3>
                        </div>

                        <div className="p-8">
                          <div className="mb-8">
                            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-3 font-semibold">Optimal Market</p>
                            <h3 className={`font-serif text-3xl mb-1 ${item.highlight ? 'text-amber-600' : 'text-slate-700'}`}>{item.data.best_market.district}</h3>
                            <p className="text-xl text-slate-800 font-medium flex items-baseline gap-1">
                              LKR {item.data.best_market.predicted_price.toLocaleString()}
                              <span className="text-sm text-gray-400 font-normal">/kg</span>
                            </p>
                            {item.highlight && <div className="mt-4 inline-flex px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-lg border border-green-100 shadow-sm"><span className="mr-1.5">💡</span> {item.data.recommendation}</div>}
                          </div>

                          <div className={`p-5 rounded-2xl ${item.highlight ? 'bg-white shadow-sm border border-amber-50' : 'bg-gray-50/50'}`}>
                            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-4 font-semibold">Regional Prices</p>
                            <div className="space-y-3">
                              {item.data.market_predictions.map((market) => (
                                <div key={market.district} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">{market.district}</span>
                                  <span className="font-medium text-slate-800 bg-white/80 px-2 py-1 rounded shadow-sm border border-gray-100">LKR {market.predicted_price.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })()}
      
      {/* ── CINNAMON IMAGES GALLERY ── */}
      <section className="py-16 px-4 relative z-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 font-mono text-xs tracking-[0.2em] uppercase text-amber-800/50 mb-10">
          Visual Reference
          <div className="flex-1 h-px bg-gradient-to-r from-amber-200/50 to-transparent" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { src: img2, label: "Ceylon Quills", desc: "Hand-rolled premium barks" },
            { src: img3, label: "Ground Spice", desc: "Fine culinary powder" },
            { src: img4, label: "Raw Sticks", desc: "Unprocessed harvest" },
          ].map(({ src, label, desc }) => (
            <div key={label} className="group relative overflow-hidden rounded-3xl shadow-md cursor-pointer">
              <img
                src={src}
                alt={label}
                className="w-full h-[300px] object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <p className="font-serif text-2xl text-white mb-1">{label}</p>
                <p className="font-mono text-[10px] tracking-widest uppercase text-amber-300/90">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── INFO CARDS ── */}
      <section className="py-16 px-4 relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              num: "01",
              title: "Visual Analysis",
              body: "Our system analyses uploaded cinnamon images using trained classification models to identify surface texture, quill diameter, and coiling uniformity.",
              icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
            },
            {
              num: "02",
              title: "SLSI 135 Compliance",
              body: "Classification strictly follows the Sri Lanka Standards Institution specification, ensuring your results align with international export quality standards.",
              icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            },
            {
              num: "03",
              title: "Secure Processing",
              body: "Images are processed in-session securely and are never permanently stored. We guarantee complete confidentiality for all your supply-chain samples.",
              icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            },
          ].map(({ num, title, body, icon }) => (
            <div key={num} className="bg-white/60 backdrop-blur-xl border border-white/80 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-200/50 transition-colors duration-500" />
              <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-50 text-amber-700 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-amber-200/50">
                {icon}
              </div>
              <p className="font-mono text-xs tracking-widest text-amber-600/80 mb-3 font-semibold">{num}</p>
              <h3 className="font-serif text-2xl font-medium text-slate-800 tracking-tight mb-4">{title}</h3>
              <p className="text-[15px] leading-relaxed text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FULL-WIDTH IMAGE & KNOWLEDGE ── */}
      <section className="px-4 pb-20 relative z-10 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-[2rem] shadow-xl mb-8 group">
          <img
            src={img1}
            alt="Cinnamon Sticks"
            className="w-full object-cover min-h-[400px] max-h-[500px] block transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white border border-white/30 mb-4">
              Premium Export
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-4 drop-shadow-md">The Gold Standard</h2>
            <p className="text-white/80 max-w-2xl text-lg font-light leading-relaxed">Discover why True Ceylon Cinnamon remains the world's most sought-after spice for culinary and medicinal perfection.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.315 48.315 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>
              </div>
              <h3 className="font-serif text-2xl font-medium text-slate-800">True Ceylon Heritage</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-[15px]">Ceylon cinnamon is prized for its delicate flavor, ultra-low coumarin content, and subtle sweetness. Native to Sri Lanka, it represents the absolute pinnacle of global spice cultivation.</p>
          </div>
          
          <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
              </div>
              <h3 className="font-serif text-2xl font-medium text-slate-800">Wellness & Culinary</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-[15px]">Beyond gourmet cuisine, it is rich in antioxidants with profound anti-inflammatory properties. An essential superfood embraced by both traditional medicine and modern gastronomy.</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-10 border border-amber-100/50 shadow-inner relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center flex-shrink-0 text-amber-600">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.82 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.496 1.508 1.333 1.508 2.316V18" /></svg>
            </div>
            <div>
              <h3 className="font-serif text-2xl font-medium text-amber-900 mb-2">Did You Know?</h3>
              <p className="text-amber-900/80 leading-relaxed text-[15px]">
                The harvesting of Ceylon cinnamon is a master craft passed down through generations. It requires immense precision to peel the delicate inner bark without damaging the tree—ensuring both world-class quality and long-term environmental sustainability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 border-t border-amber-900/5 flex flex-col md:flex-row items-center justify-between font-mono text-[10px] tracking-widest uppercase text-gray-400 px-8 gap-4 relative z-10">
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