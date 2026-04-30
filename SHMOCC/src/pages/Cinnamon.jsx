import { useState, useRef, useEffect } from "react";
import img1 from "../assets/7.jpg";
import img2 from "../assets/2.jpg";
import img3 from "../assets/5.jpg";
import img4 from "../assets/6.jpg";

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

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid JPG or PNG image.");
      return;
    }
    setError("");
    setResult(null);
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

        const res = await fetch("http://localhost:9000/upload", {
        method: "POST",
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
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="w-full min-h-screen bg-white text-gray-800 font-sans overflow-x-hidden px-8">

      {/* ── HERO ── */}
      <header className="pt-20 pb-3 grid grid-cols-1 md:grid-cols-[1fr_auto] items-end gap-8 px-4">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase text-amber-600 border border-amber-200 bg-amber-50 px-3 py-1 rounded-sm mb-5">
            <span>●</span> Ceylon Spice Intelligence
          </div>
          <h1 className="font-serif text-[clamp(38px,5vw,62px)] font-medium text-green-900 tracking-tight leading-[1.05] mb-4 text-center w-full">
            Cinnamon <em className="italic text-amber-600">Grade</em> Identification
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2 font-mono text-[11px] text-gray-500 tracking-wide">
          <span>System v2.4</span>
          <span>ISO 2392 Compliant</span>
          <span>SL/SLSI 135</span>
        </div>
      </header>

      {/* ── UPLOAD ── */}
      <section className="py-14 px-4">
        <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-xl">
          Upload a cinnamon image to instantly detect and classify its grade, quality tier, and origin using visual analysis.
        </p>

        <div
          className={`border-2 border-dashed rounded border-gray-200 p-14 text-center cursor-pointer transition-all duration-200 relative outline-none
            ${drag ? "border-amber-500 bg-amber-50" : "hover:border-amber-500 hover:bg-amber-50"}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
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

          {/* Upload icon */}
          <div className="w-11 h-11 border border-gray-200 rounded flex items-center justify-center mx-auto mb-4 text-amber-600">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="font-serif text-xl font-medium text-green-900 mb-1">Upload Cinnamon Image</p>
          <p className="text-sm text-gray-500 leading-relaxed">Drag & drop, click to browse, or take a photo</p>
          <div className="inline-flex gap-1.5 mt-4">
            {["JPG", "PNG"].map((fmt) => (
              <span key={fmt} className="font-mono text-[10px] tracking-widest px-2 py-0.5 border border-gray-200 rounded-sm text-gray-500 uppercase">{fmt}</span>
            ))}
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white text-sm font-medium rounded cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleCameraClick}
            >
              <span role="img" aria-label="camera">📸</span> Take Photo
            </button>
          </div>
        </div>

        {/* Camera modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/65 z-[1000] flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 relative max-w-md w-[90vw] shadow-2xl">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-md bg-gray-800" />
              <div className="flex gap-3 mt-4">
                <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-amber-600 text-white text-sm font-medium rounded hover:opacity-90 transition-opacity" onClick={handleCapturePhoto}>
                  <span>📸</span> Capture
                </button>
                <button className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors" onClick={() => setShowCamera(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview strip */}
        {image && (
          <div className="mt-5 flex items-center gap-4 px-4 py-3.5 border border-amber-200 rounded bg-amber-50">
            <img src={image.url} className="w-14 h-14 rounded object-cover border border-amber-200" alt="preview" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-green-900 truncate max-w-[280px]">{image.name}</p>
              <p className="font-mono text-[11px] text-gray-400 mt-0.5">{image.size}</p>
            </div>
            <button
              className="text-gray-400 hover:text-gray-700 text-lg leading-none p-1 bg-transparent border-none cursor-pointer transition-colors"
              onClick={(e) => { e.stopPropagation(); reset(); }}
            >×</button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-3 flex items-center gap-2 px-4 py-3 border border-red-200 bg-red-50 rounded text-sm text-red-600">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Analyze button */}
        <button
          className="mt-6 inline-flex items-center gap-2.5 px-8 py-3.5 bg-amber-600 text-white text-sm font-medium rounded cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
          onClick={analyze}
          disabled={!image || loading}
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analysing…
            </>
          ) : (
            <>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Analyze Grade
            </>
          )}
        </button>

        {/* Result image */}
        {result && image && (
          <div className="mt-7 border border-amber-200 rounded overflow-hidden">
            <img src={image.url} alt="Analysed cinnamon" className="w-3/5 h-[480px] max-w-full object-contain block mx-auto bg-gray-50 rounded-md" />
            <div className="px-3.5 py-2.5 flex items-center gap-2 border-t border-amber-200 bg-amber-50 font-mono text-[11px] text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
              Analysis complete — {image.name}
            </div>
          </div>
        )}
      </section>

      {/* ── RESULT SECTION ── */}
      {result && (() => {
        const isMixed = result.status === "Mixed Grades Detected";
        const finalGrade = result.final_grade;
        const gradeInfo = GRADE_DATA[finalGrade] || {};
        const colors = GRADE_COLORS[finalGrade] || GRADE_COLORS["H2"];
        const detailEntries = Object.entries(result.details);
        const totalQuills = detailEntries.reduce((s, [, v]) => s + v, 0);
        const isSingleQuill = totalQuills === 1;

        return (
          <>
            {/* ── SUMMARY ── */}
            <section className="py-14 px-4">
              <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-6">
                00 — Analysis Result
                <span className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Status banner */}
              <div className={`flex items-center justify-between px-5 py-4 rounded border mb-6 ${isMixed ? "bg-orange-50 border-orange-200" : "bg-emerald-50 border-emerald-200"}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isMixed ? "bg-orange-400" : "bg-emerald-500"}`} />
                  <p className={`font-mono text-[11px] tracking-widest uppercase font-medium ${isMixed ? "text-orange-700" : "text-emerald-700"}`}>
                    {isSingleQuill ? `${finalGrade} Single Quill` : result.status}
                  </p>
                </div>
                <span className={`font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-sm border ${isMixed ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}`}>
                  {
                        isSingleQuill
                        ? "Single Quill"
                        : isMixed
                        ? "Mixed Bundle"
                        : "Pure Bundle"
                    }
                </span>
              </div>

              {/* Top stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border border-gray-200 rounded overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                {/* Final Grade */}
                <div className="p-7 bg-white">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2.5">Final Grade</p>
                  <p className={`font-serif text-4xl font-medium tracking-tight leading-none mb-1.5 ${colors.text}`}>{finalGrade}</p>
                  <p className="text-xs text-gray-500 leading-snug">{gradeInfo.quality} quality tier</p>
                </div>
                {/* Total Quills */}
                <div className="p-7 bg-white">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2.5">Total Quills Detected</p>
                  <p className="font-serif text-4xl font-medium text-green-900 tracking-tight leading-none mb-1.5">{totalQuills}</p>
                  <p className="text-xs text-gray-500">{isMixed ? `${detailEntries.length} grade types found` : "All same grade"}</p>
                </div>
                {/* Motivation Caption */}
                <div className="p-7 bg-white">
                <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2.5">
                    Insight
                </p>

                <p className="font-serif text-lg font-medium text-green-900 leading-snug">
                    {finalGrade === "Alba" && "Top-tier cinnamon — highest value, rare quality, and premium market price."}
                    {finalGrade === "C5" && "High-value grade — excellent quality with strong export demand."}
                    {finalGrade === "C4" && "Mid-range grade — balanced quality suitable for commercial use."}
                    {finalGrade === "H2" && "Lower grade — mainly used for bulk and industrial purposes."}
                </p>

                <p className="text-xs text-gray-500 leading-snug mt-1">
                    Based on grade value hierarchy
                </p>
                </div>
              </div>
            </section>

            {/* ── GRADE BREAKDOWN ── */}
            <section className="py-14 px-4">
              <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-6">
                01 — Grade Breakdown
                <span className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Distribution bar */}
              {isMixed && (
                <div className="mb-6 border border-gray-200 rounded p-5 bg-white">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-3">Bundle Composition</p>
                  <div className="flex h-3 rounded overflow-hidden gap-px">
                    {detailEntries.map(([grade, count]) => {
                      const col = GRADE_COLORS[grade] || GRADE_COLORS["H2"];
                      return (
                        <div
                          key={grade}
                          className={`${col.bar} transition-all duration-700`}
                          style={{ width: `${(count / totalQuills) * 100}%` }}
                          title={`${grade}: ${count}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3">
                    {detailEntries.map(([grade, count]) => {
                      const col = GRADE_COLORS[grade] || GRADE_COLORS["H2"];
                      return (
                        <div key={grade} className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-sm ${col.bar}`} />
                          <span className="font-mono text-[11px] text-gray-600">{grade} — {count} quill{count > 1 ? "s" : ""} ({Math.round((count / totalQuills) * 100)}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Per-grade detail rows */}
              <div className="flex flex-col gap-3">
                {detailEntries.map(([grade, count]) => {
                  const info = GRADE_DATA[grade] || {};
                  const col = GRADE_COLORS[grade] || GRADE_COLORS["H2"];
                  const isPrimary = grade === finalGrade;
                  return (
                    <div key={grade} className={`border rounded p-5 ${isPrimary ? `${col.bg} ${col.border}` : "bg-white border-gray-200"}`}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <span className={`font-serif text-2xl font-medium tracking-tight ${col.text}`}>{grade}</span>
                          {isPrimary && (
                            <span className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm border ${col.badge}`}>
                              Final Grade
                            </span>
                          )}
                          <span className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-sm border border-gray-200 bg-gray-50 text-gray-500">
                            {info.quality}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={`font-serif text-3xl font-medium leading-none ${col.text}`}>{count}</p>
                          <p className="font-mono text-[10px] text-gray-400 mt-0.5">quill{count > 1 ? "s" : ""} detected</p>
                        </div>
                      </div>
                      <p className="text-[13px] leading-relaxed text-gray-600 mt-3">{info.description}</p>
                      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
                        <span className="text-[11px] text-gray-500"><span className="font-medium text-gray-700">Thickness:</span> {info.thickness}</span>
                        <span className="text-[11px] text-gray-500"><span className="font-medium text-gray-700">Origin:</span> {info.origin}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── ORIGIN CARD ── */}
            <section className="py-14 px-4">
              <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-6">
                02 — Classification Details
                <span className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 border border-gray-200 rounded overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                <div className="p-7 bg-white">
                  <h3 className="font-serif text-xl font-medium text-green-900 tracking-tight mb-2.5">Grade Description</h3>
                  <p className="text-[13.5px] leading-relaxed text-gray-700">{gradeInfo.description}</p>
                  <span className={`inline-flex mt-3 font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-sm border ${colors.badge}`}>
                    {gradeInfo.quality}
                  </span>
                </div>
                <div className="p-7 bg-white">
                  <h3 className="font-serif text-xl font-medium text-green-900 tracking-tight mb-2.5">Origin & Species</h3>
                  <p className="text-[13.5px] leading-relaxed text-gray-700">
                    Classified as <strong className="text-green-900">Grade {finalGrade}</strong> under the Sri Lanka Standards Institution grading system (SLSI 135).
                    Originating from <em>{gradeInfo.origin}</em>, this grade reflects well-defined botanical and post-harvest handling characteristics.
                  </p>
                  <span className="inline-flex mt-3 font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-sm border border-amber-200 bg-amber-50 text-amber-600">
                    Ceylon Verified
                  </span>
                </div>
              </div>
            </section>
          </>
        );
      })()}

      {/* ── CINNAMON IMAGES ── */}
      <section className="py-14 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { src: img2, label: "Ceylon Quills" },
            { src: img3, label: "Ground Spice" },
            { src: img4, label: "Sticks" },
          ].map(({ src, label }) => (
            <div key={label} className="relative overflow-hidden rounded-sm group">
              <img
                src={src}
                alt={label}
                className="w-full object-cover min-h-[200px] max-h-[360px] block transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute bottom-0 left-0 right-0 px-3.5 py-3 bg-gradient-to-t from-white/80 to-transparent font-mono text-[10px] tracking-widest uppercase text-green-900">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── INFO CARDS ── */}
      <section className="py-14 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 border border-gray-200 rounded overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-gray-200 bg-stone-50">
          {[
            {
              num: "01 / How It Works",
              title: "Visual Grade Detection",
              body: "Our system analyses uploaded cinnamon images using trained classification models to identify surface texture, quill diameter, colour profile, and coiling uniformity — the four primary visual markers of commercial grade.",
            },
            {
              num: "02 / Grading Standard",
              title: "SLSI 135 Compliance",
              body: "Classification follows the Sri Lanka Standards Institution specification SLSI 135, which defines grades C5, C4, C3, M5, and H1. This internationally recognised standard governs the export of Ceylon true cinnamon.",
            },
            {
              num: "03 / Data & Privacy",
              title: "Secure Processing",
              body: "Images are processed in-session only and are not stored or transmitted to third parties. All analysis runs within a sandboxed inference environment, ensuring full confidentiality of your supply-chain samples.",
            },
          ].map(({ num, title, body }) => (
            <div key={num} className="p-8">
              <p className="font-serif text-[13px] text-amber-600 font-medium mb-3 tracking-wide">{num}</p>
              <h3 className="font-serif text-xl font-medium text-green-900 tracking-tight mb-2.5">{title}</h3>
              <p className="text-[13px] leading-relaxed text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FULL-WIDTH IMAGE & BOXES ── */}
      <section className="px-4 pb-14">
        <div className="relative overflow-hidden rounded-sm">
          <img
            src={img1}
            alt="Cinnamon Sticks"
            className="w-full object-cover min-h-[320px] max-h-[480px] block"
          />
          <div className="absolute bottom-0 left-0 right-0 px-3.5 py-3 bg-gradient-to-t from-white/80 to-transparent font-mono text-[10px] tracking-widest uppercase text-green-900">
            Ceylon Quills
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-7">
          <div className="bg-stone-50 border border-gray-200 rounded p-7 text-sm text-gray-700 leading-relaxed shadow-sm">
            <h3 className="font-serif text-lg font-medium text-green-900 mb-2.5">About Ceylon Cinnamon</h3>
            <p>Ceylon cinnamon, also known as "true cinnamon," is prized for its delicate flavor and aroma. It is native to Sri Lanka and is considered superior to cassia varieties due to its low coumarin content and subtle sweetness.</p>
          </div>
          <div className="bg-stone-50 border border-gray-200 rounded p-7 text-sm text-gray-700 leading-relaxed shadow-sm">
            <h3 className="font-serif text-lg font-medium text-green-900 mb-2.5">Uses & Benefits</h3>
            <p>Used in both sweet and savory dishes, Ceylon cinnamon is valued for its health benefits, including antioxidant and anti-inflammatory properties. It is a staple in traditional medicine and gourmet cuisine worldwide.</p>
          </div>
        </div>

        {/* Cultural significance */}
        <div className="mt-8 text-center">
          <h3 className="font-serif text-xl font-medium text-green-900 mb-4">Symbolism & Cultural Significance</h3>
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Beyond its culinary uses, cinnamon has played a vital role in ancient rituals, trade, and folklore. Revered as a symbol of prosperity and healing, it was once considered more precious than gold and used as a sacred offering in temples. Today, cinnamon continues to inspire art, tradition, and wellness practices around the globe.
          </p>
        </div>

        <div className="mt-6 p-5 border border-amber-200 bg-amber-50 rounded text-sm text-gray-700 leading-relaxed">
          <strong className="text-green-900">Did you know?</strong> The harvesting of Ceylon cinnamon is a skilled craft passed down through generations, requiring precision to peel the delicate inner bark without damaging the tree—ensuring both quality and sustainability.
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-7 flex flex-col sm:flex-row items-center justify-between font-mono text-[11px] text-gray-400 px-4 gap-2">
        <span>Cinnamon Grade Identification System</span>
        <span>© 2025 Ceylon Spice Intelligence</span>
      </footer>
    </div>
  );
}