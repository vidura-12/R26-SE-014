import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../hooks/useScrollReveal.jsx";
import { useTheme } from "../../context/ThemeProvider";
import img1 from "../../assets/7.jpg";
import img3 from "../../assets/05.png";
import slide1 from "../../assets/01.png";
import slide2 from "../../assets/02.png";
import slide3 from "../../assets/03.png";
import slide4 from "../../assets/04.png";
import slide5 from "../../assets/06.png";
import slide6 from "../../assets/07.png";
import slide7 from "../../assets/08.jpg";
import slide8 from "../../assets/09.png";

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

// Colour tokens per grade tier — mirrors the quill cross-section palette
// used on the History page (pale/thin bark for fine grades, darkening and
// thickening toward the lower grades).
const GRADE_COLORS = {
  Alba: { bg: "bg-[#FBF1E1]", border: "border-[#E3D2C0]", text: "text-[#B8863B]", badge: "bg-[#F3E5C8] text-[#8A651F] border-[#E3D2C0]", bar: "bg-[#B8863B]" },
  C5: { bg: "bg-[#FBF1E1]", border: "border-[#E3D2C0]", text: "text-[#A9642F]", badge: "bg-[#F3E5C8] text-[#8A651F] border-[#E3D2C0]", bar: "bg-[#A9642F]" },
  C4: { bg: "bg-[#F6EDE2]", border: "border-[#D9AE79]", text: "text-[#8C5A32]", badge: "bg-[#EFD9B8] text-[#6E3E20] border-[#D9AE79]", bar: "bg-[#8C5A32]" },
  H1: { bg: "bg-[#F3E7D6]", border: "border-[#C89A63]", text: "text-[#B8863B]", badge: "bg-[#EFD5AC] text-[#8A651F] border-[#C89A63]", bar: "bg-[#B8863B]" },
  H2: { bg: "bg-[#F1E1D2]", border: "border-[#B98452]", text: "text-[#7A2E1E]", badge: "bg-[#E7C4A8] text-[#7A2E1E] border-[#B98452]", bar: "bg-[#7A2E1E]" },
  M5: { bg: "bg-[#F5E3DC]", border: "border-[#D9B9A8]", text: "text-[#5C1F13]", badge: "bg-[#E7C4A8] text-[#5C1F13] border-[#D9B9A8]", bar: "bg-[#5C1F13]" },
};

function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

// ── UI-only helpers ─────────────────────────────────────────────

const money = (n) =>
  Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Auto-advancing index for the rotating hero / showcase
function useCycle(length, ms) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % length), ms);
    return () => clearInterval(t);
  }, [length, ms, paused]);
  const go = (n) => setIdx((((n % length) + length) % length));
  return { idx, go, setPaused };
}

// Fan of tilted photo cards (centre card raised, neighbours rotated)
function Fan({ items, idx }) {
  const n = items.length;
  return (
    <div className="cx-fan">
      {items.map((it, i) => {
        const o = (i - idx + n) % n;
        const pos = o === 0 ? "0" : o === 1 ? "1" : o === n - 1 ? "3" : "2";
        return (
          <figure key={it.label} className="cx-fancard" data-o={pos}>
            <img src={it.src} alt={it.label} />
            <figcaption>
              <strong>{it.label}</strong>
              <span>{it.desc}</span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

// Edit the labels here if a photo shows something different
const SLIDES = [
  { src: slide1, label: "Ground cinnamon", desc: "Fine powder for baking and cooking", note: "Quills are dried, then milled into a soft, sweet powder." },
  { src: slide2, label: "Ceylon quills", desc: "Hand-rolled premium bark", note: "Thin layers of inner bark rolled by hand into tight quills." },
  { src: slide3, label: "Rolled quills", desc: "Layered, tightly curled bark", note: "Look at the layers: finer grades have thinner, more even curls." },
  { src: slide4, label: "Quills and powder", desc: "From bundle to spice jar", note: "Graded quills are bundled for export; the offcuts become powder." },
];

const HERO_SLIDES = [
  { src: slide8, label: "Ground cinnamon", desc: "Fine powder for baking and cooking" },
  { src: slide2, label: "Ceylon quills", desc: "Hand-rolled premium bark" },
  { src: slide7, label: "Rolled quills", desc: "Layered, tightly curled bark" },
  { src: slide5, label: "Quills and powder", desc: "From bundle to spice jar" },
];

export default function Cinnamon() {
  const { isDark } = useTheme();
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

  // UI-only state
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [marketPeriod, setMarketPeriod] = useState(0);
  const hero = useCycle(SLIDES.length, 5000);
  const show = useCycle(SLIDES.length, 5000);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    setMarketPeriod(0);
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
    setMarketPeriod(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  const isAdmin = localStorage.getItem("cinnamonRole") === "admin";
  const go = (path) => { setMenuOpen(false); navigate(path); };
  const scrollToUpload = () => document.getElementById("cx-upload")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700&display=swap');

        .cx-root {
          --bg: #FBF6EF; --surface: #FFFFFF; --surface-2: #F6EDE2; --ink: #2A1810; --muted: #6F5E50;
          --line: rgba(62,36,21,.12); --amber: #E3A24B; --amber-deep: #B9701F; --bark: #3E2415; --night: #1A0E08;
          font-family: 'Manrope', system-ui, sans-serif;
          background: var(--bg); color: var(--ink); min-height: 100vh; overflow-x: hidden;
          transition: background .3s, color .3s;
        }
        .cx-root.cx-dark {
          --bg: #170D07; --surface: #24150D; --surface-2: #2E1B11; --ink: #F8EEDD; --muted: #BFAA92;
          --line: rgba(248,238,221,.12);
        }
        .cx-root h1, .cx-root h2, .cx-root h3, .cx-display { font-family: 'Fraunces', Georgia, serif; letter-spacing: -.01em; }
        .cx-root button { font-family: inherit; }
        .cx-root :focus-visible { outline: 2px solid var(--amber); outline-offset: 3px; }
        .cx-wrap { max-width: 1240px; margin: 0 auto; padding: 0 28px; }

        /* ── Header (full width) ── */
        .cx-header { position: fixed; inset: 0 0 auto 0; z-index: 60; padding: 18px 0; transition: all .35s; }
        .cx-header.on { background: rgba(42,24,16,.45); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); padding: 10px 0; box-shadow: 0 4px 24px rgba(0,0,0,.2); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .cx-hwrap { width: 100%; padding: 0 36px; display: flex; align-items: center; justify-content: space-between; }
        .cx-brand { display: flex; align-items: center; gap: 12px; color: #fff; cursor: pointer; background: none; border: 0; text-align: left; }
        .cx-logo { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; font-size: 22px;
          background: linear-gradient(135deg, #A86B32, #5C3210); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 4px 12px rgba(0,0,0,.3); }
        .cx-brand b { display: block; font-family: 'Fraunces', serif; font-size: 19px; font-weight: 600; }
        .cx-brand small { display: block; font-size: 11px; color: rgba(255,255,255,.7); }
        .cx-nav { display: flex; align-items: center; gap: 6px; }
        .cx-nav button.link { color: rgba(255,255,255,.9); background: none; border: 0; padding: 9px 16px; border-radius: 99px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background .2s; }
        .cx-nav button.link:hover { background: rgba(255,255,255,.14); color: #fff; }
        .cx-nav button.link.active { background: rgba(255,255,255,.18); color: #fff; }
        .cx-logout { margin-left: 8px; color: #2A1810; background: var(--amber); border: 0; padding: 10px 24px; border-radius: 99px; font-weight: 700; font-size: 14px; cursor: pointer; transition: transform .2s, box-shadow .2s; }
        .cx-logout:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(227,162,75,.45); }
        .cx-burger { display: none; width: 44px; height: 44px; border-radius: 12px; border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.1); color: #fff; font-size: 20px; cursor: pointer; }
        @media (max-width: 900px) {
          .cx-hwrap { padding: 0 16px; }
          .cx-burger { display: block; }
          .cx-nav { position: absolute; top: 100%; left: 12px; right: 12px; flex-direction: column; align-items: stretch; padding: 12px; border-radius: 20px;
            background: rgba(26,14,8,.96); backdrop-filter: blur(18px); display: none; }
          .cx-nav.open { display: flex; }
          .cx-nav button.link { text-align: left; }
          .cx-logout { margin: 6px 0 0; }
        }

        /* ── Scene: hero + upload share ONE photo background (no two-tone seam) ── */
        .cx-scene { position: relative; isolation: isolate; overflow: hidden; color: #fff; border-radius: 0 0 56px 56px; }
        .cx-slide { position: absolute; inset: 0; background-size: cover; background-position: center 35%; opacity: 0; transition: opacity 1.6s ease; z-index: -2; }
        .cx-slide.on { opacity: 1; animation: cxZoom 10s ease-out both; }
        @keyframes cxZoom { from { transform: scale(1); } to { transform: scale(1.08); } }
        .cx-shade { position: absolute; inset: 0; z-index: -1;
          background:
            linear-gradient(95deg, rgba(20,10,5,.88) 0%, rgba(20,10,5,.5) 50%, rgba(20,10,5,.3) 100%),
            linear-gradient(180deg, rgba(20,10,5,.05) 0%, rgba(20,10,5,.5) 50%, rgba(20,10,5,.9) 100%); }

        .cx-hero { min-height: 85vh; display: flex; flex-direction: column; justify-content: center; padding: 120px 0 50px; }
        .cx-hero .cx-wrap { width: 100%; }
        .cx-hero-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 40px; align-items: center; }
        .cx-hero h1 { font-size: clamp(40px, 6vw, 78px); line-height: 1.04; font-weight: 600; color: #fff; text-shadow: 0 4px 30px rgba(0,0,0,.4); }
        .cx-hero p.lead { margin-top: 22px; max-width: 480px; font-size: 17px; line-height: 1.7; color: rgba(255,255,255,.9); }
        .cx-cta-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 34px; align-items: center; }
        .cx-btn { display: inline-flex; align-items: center; gap: 10px; padding: 15px 28px; border-radius: 99px; font-weight: 700; font-size: 15px; cursor: pointer; border: 0; transition: transform .2s, box-shadow .2s, background .2s; }
        .cx-btn:hover { transform: translateY(-2px); }
        .cx-btn.primary { background: var(--amber); color: #2A1810; box-shadow: 0 10px 30px rgba(227,162,75,.35); }
        .cx-btn.ghost { background: rgba(255,255,255,.12); color: #fff; border: 1px solid rgba(255,255,255,.4); backdrop-filter: blur(10px); }
        .cx-btn.ghost:hover { background: rgba(255,255,255,.22); }
        .cx-progress { display: flex; align-items: center; gap: 18px; margin-top: 56px; color: rgba(255,255,255,.9); font-size: 13px; font-weight: 700; }
        .cx-bar { flex: 1; height: 3px; border-radius: 3px; background: rgba(255,255,255,.25); overflow: hidden; max-width: 420px; }
        .cx-bar i { display: block; height: 100%; background: var(--amber); transition: width .6s ease; }
        .cx-arrows { display: flex; gap: 10px; }
        .cx-arrow { width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(255,255,255,.45); background: rgba(255,255,255,.1); color: #fff; font-size: 18px; cursor: pointer; backdrop-filter: blur(8px); transition: background .2s, color .2s; }
        .cx-arrow:hover { background: #fff; color: var(--bark); }
        @media (max-width: 900px) { .cx-hero-grid { grid-template-columns: 1fr; } .cx-hero .cx-fan { display: none; } .cx-hero { min-height: 88vh; } }

        /* Fan of cards */
        .cx-fan { position: relative; height: 440px; width: 100%; }
        .cx-fancard { position: absolute; top: 50%; left: 50%; width: 240px; height: 350px; margin: 0; border-radius: 26px; overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,.45); border: 1px solid rgba(255,255,255,.28);
          transition: transform 1s cubic-bezier(.2,.7,.2,1), opacity 1s, filter 1s; }
        .cx-fancard img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cx-fancard::after { content: ""; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(20,10,5,.9), transparent 55%); }
        .cx-fancard figcaption { position: absolute; left: 18px; right: 18px; bottom: 16px; z-index: 2; color: #fff; display: flex; flex-direction: column; gap: 3px; }
        .cx-fancard figcaption strong { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; line-height: 1.15; }
        .cx-fancard figcaption span { font-size: 13px; color: rgba(255,255,255,.88); }
        .cx-fancard[data-o="0"] { transform: translate(-50%, -52%) scale(1.1) rotate(0deg); z-index: 4; }
        .cx-fancard[data-o="1"] { transform: translate(calc(-50% + 150px), -46%) scale(.9) rotate(6deg); z-index: 3; filter: brightness(.85); }
        .cx-fancard[data-o="2"] { transform: translate(calc(-50% + 280px), -38%) scale(.75) rotate(14deg); z-index: 2; filter: brightness(.6); opacity: 1; }
        .cx-fancard[data-o="3"] { transform: translate(calc(-50% - 150px), -46%) scale(.9) rotate(-6deg); z-index: 3; filter: brightness(.85); }

        /* ── Upload (sits fully on the same photo) ── */
        .cx-upload { padding: 30px 0 110px; scroll-margin-top: 70px; }
        .cx-upload-head { max-width: 620px; margin-bottom: 28px; }
        .cx-upload-head h2 { font-size: clamp(30px, 4vw, 46px); font-weight: 600; color: #fff; line-height: 1.1; }
        .cx-upload-head p { margin-top: 10px; color: rgba(255,255,255,.88); font-size: 16px; line-height: 1.7; }
        .cx-panel { display: grid; grid-template-columns: 1fr 340px; gap: 22px; padding: 22px; border-radius: 34px;
          background: rgba(255,255,255,.1); backdrop-filter: blur(24px) saturate(150%); border: 1px solid rgba(255,255,255,.28);
          box-shadow: 0 30px 80px rgba(0,0,0,.35); }
        @media (max-width: 900px) { .cx-panel { grid-template-columns: 1fr; padding: 14px; border-radius: 26px; } }
        .cx-drop { position: relative; border: 2px dashed rgba(255,255,255,.5); border-radius: 26px; padding: 52px 28px; text-align: center; cursor: pointer; transition: all .3s; background: rgba(255,255,255,.06); }
        .cx-drop:hover, .cx-drop.drag { border-color: var(--amber); background: rgba(227,162,75,.14); }
        .cx-drop.drag { transform: scale(1.01); }
        .cx-drop-ico { width: 68px; height: 68px; margin: 0 auto 18px; border-radius: 22px; display: grid; place-items: center; color: #FFD79A;
          background: rgba(227,162,75,.2); border: 1px solid rgba(227,162,75,.55); }
        .cx-drop h2 { font-size: 28px; font-weight: 600; color: #fff; }
        .cx-drop p { margin-top: 8px; font-size: 14px; color: rgba(255,255,255,.88); }
        .cx-fmt { display: inline-flex; gap: 8px; margin-top: 18px; }
        .cx-fmt span { padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; border: 1px solid rgba(255,255,255,.4); color: #fff; }
        .cx-photo-btn { margin-top: 22px; }
        .cx-preview { border-radius: 26px; padding: 16px; display: flex; flex-direction: column; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.22); min-height: 300px; }
        .cx-preview-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px; font-weight: 700; color: #fff; }
        .cx-preview-head em { font-style: normal; font-size: 12px; padding: 3px 10px; border-radius: 99px; background: rgba(255,255,255,.2); }
        .cx-preview-img { position: relative; flex: 1; min-height: 240px; border-radius: 18px; overflow: hidden; background: #000; }
        .cx-preview-img img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
        .cx-x { position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; border-radius: 50%; border: 0; background: rgba(255,255,255,.92); color: var(--bark); font-size: 20px; line-height: 1; cursor: pointer; }
        .cx-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 10px; color: rgba(255,255,255,.85); padding: 24px; }
        .cx-empty b { color: #fff; font-size: 15px; }
        .cx-empty span { font-size: 13px; max-width: 200px; line-height: 1.5; }
        .cx-panel-foot { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: center; gap: 16px; padding: 2px 6px; }
        .cx-analyze { padding: 16px 38px; font-size: 16px; }
        .cx-analyze:disabled { cursor: not-allowed; transform: none; box-shadow: none; background: rgba(255,255,255,.2); color: rgba(255,255,255,.7); }
        .cx-analyze.loading:disabled { background: var(--amber); color: #2A1810; cursor: progress; }
        .cx-error { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: 14px; background: rgba(120,30,20,.55); border: 1px solid rgba(255,140,120,.6); color: #FFE4DD; font-size: 14px; font-weight: 600; }
        .cx-spin { animation: cxSpin 1s linear infinite; }
        @keyframes cxSpin { to { transform: rotate(360deg); } }

        /* ── Generic sections ── */
        .cx-section { padding: 90px 0; }
        .cx-sec-head { max-width: 640px; margin-bottom: 40px; }
        .cx-sec-head h2 { font-size: clamp(30px, 4vw, 48px); font-weight: 600; line-height: 1.1; color: var(--ink); }
        .cx-sec-head p { margin-top: 12px; color: var(--muted); font-size: 16px; line-height: 1.7; }
        .cx-surface { background: var(--surface); border: 1px solid var(--line); border-radius: 26px; box-shadow: 0 14px 40px rgba(62,36,21,.07); }
        .cx-dark .cx-surface { box-shadow: 0 14px 40px rgba(0,0,0,.35); }
        .cx-fade { animation: cxFade .6s ease both; }
        @keyframes cxFade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

        /* Result */
        .cx-status { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between; padding: 20px 26px; border-radius: 22px; margin-bottom: 26px; border: 1px solid; }
        .cx-status.mixed { background: rgba(227,162,75,.14); border-color: rgba(227,162,75,.55); }
        .cx-status.pure { background: rgba(98,140,90,.14); border-color: rgba(98,140,90,.5); }
        .cx-status small { display: block; font-size: 12px; color: var(--muted); font-weight: 600; }
        .cx-status strong { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; color: var(--ink); }
        .cx-pill { display: inline-flex; align-items: center; gap: 8px; padding: 7px 16px; border-radius: 99px; font-size: 13px; font-weight: 700; background: var(--surface); border: 1px solid var(--line); color: var(--ink); }
        .cx-tabs { display: inline-flex; flex-wrap: wrap; gap: 6px; padding: 6px; border-radius: 99px; background: var(--surface); border: 1px solid var(--line); margin-bottom: 28px; }
        .cx-tab { display: inline-flex; align-items: center; gap: 8px; padding: 11px 22px; border-radius: 99px; border: 0; background: none; color: var(--muted); font-weight: 700; font-size: 14px; cursor: pointer; transition: all .25s; }
        .cx-tab:hover { color: var(--ink); }
        .cx-tab.on { background: var(--bark); color: #fff; box-shadow: 0 8px 20px rgba(62,36,21,.3); }
        .cx-dark .cx-tab.on { background: var(--amber); color: #2A1810; }
        .cx-stats { display: grid; grid-template-columns: 1.2fr 1fr 1.2fr; gap: 20px; margin-bottom: 24px; }
        @media (max-width: 900px) { .cx-stats { grid-template-columns: 1fr; } }
        .cx-stat { padding: 30px; position: relative; overflow: hidden; }
        .cx-stat .lbl { font-size: 13px; font-weight: 700; color: var(--muted); margin-bottom: 14px; }
        .cx-stat .big { font-family: 'Fraunces', serif; font-size: clamp(48px, 6vw, 72px); font-weight: 600; line-height: 1; }
        .cx-stat .sub { margin-top: 14px; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--muted); }
        .cx-stat.hero-stat { background: linear-gradient(145deg, #4A2A18, #1F110A); border-color: transparent; }
        .cx-stat.hero-stat .lbl, .cx-stat.hero-stat .sub { color: rgba(255,255,255,.8); }
        .cx-stat.hero-stat .big { color: #F6C47A !important; }
        .cx-insight { font-family: 'Fraunces', serif; font-size: 20px; line-height: 1.4; color: var(--ink); }
        .cx-compo { padding: 28px; margin-bottom: 24px; }
        .cx-compo-bar { display: flex; height: 16px; border-radius: 99px; overflow: hidden; gap: 3px; background: var(--surface-2); }
        .cx-chip { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 16px; background: var(--surface-2); border: 1px solid var(--line); }
        .cx-chip b { font-family: 'Fraunces', serif; display: block; font-size: 15px; color: var(--ink); }
        .cx-chip span.t { font-size: 12px; color: var(--muted); font-weight: 600; }
        .cx-grade-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        @media (max-width: 800px) { .cx-grade-grid { grid-template-columns: 1fr; } }
        .cx-gcard { padding: 28px; position: relative; overflow: hidden; transition: transform .3s; }
        .cx-gcard:hover { transform: translateY(-3px); }
        .cx-gcard.primary { border-width: 2px; border-color: var(--amber); background: linear-gradient(160deg, var(--surface), var(--surface-2)); }
        .cx-gtop { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
        .cx-gname { font-family: 'Fraunces', serif; font-size: 40px; font-weight: 600; line-height: 1; }
        .cx-count { text-align: center; padding: 10px 18px; border-radius: 18px; background: var(--surface-2); border: 1px solid var(--line); }
        .cx-count b { font-family: 'Fraunces', serif; font-size: 34px; line-height: 1; display: block; }
        .cx-count small { font-size: 11px; font-weight: 700; color: var(--muted); }
        .cx-rows { padding: 14px 16px; border-radius: 18px; background: var(--surface-2); display: flex; flex-direction: column; gap: 10px; font-size: 14px; }
        .cx-rows div { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .cx-rows span:first-child { color: var(--muted); font-weight: 600; }
        .cx-rows span:last-child { font-weight: 700; color: var(--ink); text-align: right; }
        .cx-two { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        @media (max-width: 800px) { .cx-two { grid-template-columns: 1fr; } }
        .cx-info { padding: 32px; }
        .cx-info .ico { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; margin-bottom: 20px; background: rgba(227,162,75,.18); color: var(--amber-deep); }
        .cx-info h3 { font-size: 24px; font-weight: 600; margin-bottom: 12px; }
        .cx-info p { color: var(--muted); line-height: 1.75; font-size: 15px; }
        .cx-info strong { color: var(--ink); }
        .cx-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #6FAE63; margin-right: 8px; box-shadow: 0 0 0 4px rgba(111,174,99,.2); }

        /* ── Market price (selector + best market + ranked bars) ── */
        .cx-ptiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
        @media (max-width: 800px) { .cx-ptiles { grid-template-columns: 1fr; } }
        .cx-ptile { text-align: left; padding: 18px 22px; border-radius: 22px; cursor: pointer; background: var(--surface); border: 1px solid var(--line); color: var(--ink); display: flex; flex-direction: column; gap: 4px; transition: all .25s; }
        .cx-ptile:hover { transform: translateY(-2px); border-color: var(--amber); }
        .cx-ptile small { font-size: 13px; font-weight: 700; color: var(--amber-deep); }
        .cx-ptile .d { font-size: 13px; color: var(--muted); font-weight: 600; }
        .cx-ptile b { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 600; margin-top: 6px; }
        .cx-ptile em { font-style: normal; font-size: 12px; font-weight: 700; }
        .cx-ptile em.up { color: #3F7D3A; } .cx-ptile em.down { color: #B3412B; } .cx-ptile em.flat { color: var(--muted); }
        .cx-ptile.on { background: linear-gradient(145deg, #4A2A18, #1F110A); border-color: var(--amber); box-shadow: 0 16px 36px rgba(62,36,21,.35); color: #fff; }
        .cx-ptile.on small { color: #F6C47A; } .cx-ptile.on .d { color: rgba(255,255,255,.8); }
        .cx-ptile.on em.up { color: #9BDB92; } .cx-ptile.on em.down { color: #FFA08A; } .cx-ptile.on em.flat { color: rgba(255,255,255,.75); }
        .cx-mgrid { display: grid; grid-template-columns: 380px 1fr; gap: 20px; align-items: stretch; }
        @media (max-width: 900px) { .cx-mgrid { grid-template-columns: 1fr; } }
        .cx-best { padding: 32px; border-radius: 28px; color: #fff; position: relative; overflow: hidden;
          background: radial-gradient(circle at 85% 0%, rgba(227,162,75,.4), transparent 55%), linear-gradient(160deg, #5A3320, #1F110A); }
        .cx-best small { font-size: 13px; font-weight: 700; color: #F6C47A; }
        .cx-best h3 { font-size: clamp(40px, 5vw, 56px); font-weight: 600; margin: 8px 0 4px; color: #fff; line-height: 1.05; }
        .cx-best .price { font-size: 26px; font-weight: 700; color: #fff; }
        .cx-best .price span { font-size: 14px; font-weight: 500; color: rgba(255,255,255,.75); }
        .cx-best .tip { margin-top: 20px; padding: 14px 16px; border-radius: 16px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.22); font-size: 14px; line-height: 1.6; color: rgba(255,255,255,.95); }
        .cx-best-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 24px; }
        .cx-best-meta div { padding: 12px; border-radius: 14px; background: rgba(0,0,0,.25); }
        .cx-best-meta span { display: block; font-size: 11px; font-weight: 700; color: rgba(255,255,255,.7); }
        .cx-best-meta b { display: block; margin-top: 4px; font-size: 14px; color: #fff; }
        .cx-ranks { padding: 28px 30px; }
        .cx-ranks h4 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; }
        .cx-ranks .cap { font-size: 12px; color: var(--muted); margin: 4px 0 18px; }
        .cx-rank { display: grid; grid-template-columns: 26px 110px 1fr 120px; gap: 12px; align-items: center; padding: 7px 0; font-size: 14px; }
        @media (max-width: 640px) { .cx-rank { grid-template-columns: 22px 80px 1fr 92px; gap: 8px; font-size: 13px; } }
        .cx-rank .rk { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 700; background: var(--surface-2); color: var(--muted); }
        .cx-rank:first-of-type .rk { background: var(--amber); color: #2A1810; }
        .cx-rank .nm { font-weight: 700; color: var(--ink); }
        .cx-rank .track { height: 12px; border-radius: 99px; background: var(--surface-2); overflow: hidden; }
        .cx-rank .track i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #8C5A32, #C98A3E); transition: width .8s cubic-bezier(.2,.7,.2,1); }
        .cx-rank:first-of-type .track i { background: linear-gradient(90deg, #E3A24B, #F6C47A); }
        .cx-rank .pr { text-align: right; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; }
        .cx-unavail { text-align: center; padding: 50px 30px; background: rgba(227,162,75,.12); border: 1px solid rgba(227,162,75,.5); border-radius: 26px; }
        .cx-unavail h3 { font-size: 30px; margin: 14px 0 10px; }
        .cx-unavail p { color: var(--muted); max-width: 440px; margin: 0 auto; font-size: 16px; }

        /* ── Showcase: one big image + clickable list ── */
        .cx-show { display: grid; grid-template-columns: 1.25fr 1fr; gap: 28px; align-items: stretch; }
        @media (max-width: 900px) { .cx-show { grid-template-columns: 1fr; } }
        .cx-show-img { position: relative; border-radius: 32px; overflow: hidden; min-height: 480px; background: #1A0E08; box-shadow: 0 30px 70px rgba(62,36,21,.28); }
        .cx-show-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transform: scale(1.04); transition: opacity 1s ease, transform 6s ease-out; }
        .cx-show-img img.on { opacity: 1; transform: scale(1.1); }
        .cx-show-cap { position: absolute; left: 20px; bottom: 20px; right: 20px; max-width: 420px; padding: 18px 22px; border-radius: 22px; color: #fff;
          background: rgba(20,10,5,.62); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,.28); }
        .cx-show-cap h3 { font-size: 26px; font-weight: 600; color: #fff; }
        .cx-show-cap p { margin-top: 6px; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,.92); }
        .cx-show-list { display: flex; flex-direction: column; gap: 12px; justify-content: center; }
        .cx-show-row { position: relative; display: flex; gap: 16px; align-items: center; text-align: left; padding: 14px; border-radius: 22px; background: var(--surface); border: 1px solid var(--line); color: var(--ink); cursor: pointer; overflow: hidden; transition: border-color .25s, box-shadow .25s, transform .25s; }
        .cx-show-row:hover { transform: translateX(4px); }
        .cx-show-row.on { border-color: var(--amber); box-shadow: 0 14px 34px rgba(227,162,75,.28); }
        .cx-show-row img { width: 82px; height: 82px; border-radius: 16px; object-fit: cover; flex: none; }
        .cx-show-row b { display: block; font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; }
        .cx-show-row span { display: block; margin-top: 3px; font-size: 14px; color: var(--muted); line-height: 1.5; }
        .cx-show-row i { position: absolute; left: 0; bottom: 0; height: 3px; width: 0; background: var(--amber); }
        .cx-show-row.on i { animation: cxFill 5s linear forwards; }
        @keyframes cxFill { from { width: 0; } to { width: 100%; } }

        /* ── Features: dark band, crisp photo, floating chips ── */
        .cx-feat { background: linear-gradient(160deg, #2A1810, #160B06); color: #fff; padding: 100px 0; }
        .cx-feat-grid { display: grid; grid-template-columns: 1fr 1.05fr; gap: 64px; align-items: center; }
        @media (max-width: 900px) { .cx-feat-grid { grid-template-columns: 1fr; gap: 36px; } }
        .cx-feat-img { position: relative; border-radius: 36px; overflow: hidden; aspect-ratio: 4 / 4.6; box-shadow: 0 40px 80px rgba(0,0,0,.5); }
        .cx-feat-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cx-float { position: absolute; display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-radius: 99px; font-size: 14px; font-weight: 700; color: #fff;
          background: rgba(20,10,5,.62); backdrop-filter: blur(14px); border: 1px solid rgba(255,255,255,.3); }
        .cx-float .ck { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--amber); color: #2A1810; font-size: 13px; }
        .cx-float.f1 { top: 24px; left: 24px; } .cx-float.f2 { bottom: 24px; right: 24px; }
        .cx-feat h2 { font-size: clamp(32px, 4vw, 50px); font-weight: 600; line-height: 1.1; color: #fff; }
        .cx-feat .lead { margin: 14px 0 28px; font-size: 17px; line-height: 1.7; color: rgba(255,255,255,.88); max-width: 520px; }
        .cx-frow { display: flex; gap: 20px; padding: 24px 0; border-top: 1px solid rgba(255,255,255,.16); }
        .cx-frow .ico { width: 54px; height: 54px; flex: none; border-radius: 18px; display: grid; place-items: center; background: var(--amber); color: #2A1810; }
        .cx-frow h3 { font-size: 23px; font-weight: 600; color: #fff; margin-bottom: 6px; }
        .cx-frow p { font-size: 16px; line-height: 1.7; color: rgba(255,255,255,.85); }

        /* ── Banner ── */
        .cx-banner { position: relative; overflow: hidden; border-radius: 34px; min-height: 400px; display: flex; align-items: center; margin-bottom: 20px; }
        .cx-banner img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s; }
        .cx-banner:hover img { transform: scale(1.04); }
        .cx-banner::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(20,10,5,.92) 0%, rgba(20,10,5,.7) 42%, rgba(20,10,5,.1) 85%); }
        .cx-banner-text { position: relative; z-index: 2; padding: 48px; color: #fff; max-width: 560px; }
        .cx-banner-text h2 { font-size: clamp(30px, 4vw, 46px); font-weight: 600; color: #fff; line-height: 1.1; }
        .cx-banner-text p { margin-top: 14px; color: rgba(255,255,255,.92); line-height: 1.7; font-size: 17px; }
        .cx-did { display: flex; gap: 24px; align-items: center; padding: 34px; margin-top: 20px; background: linear-gradient(120deg, rgba(227,162,75,.2), rgba(227,162,75,.06)); border: 1px solid rgba(227,162,75,.45); border-radius: 28px; }
        .cx-did .ico { width: 70px; height: 70px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--amber); color: #2A1810; }
        .cx-did h3 { font-size: 24px; margin-bottom: 6px; }
        .cx-did p { color: var(--muted); line-height: 1.75; font-size: 15px; }
        @media (max-width: 640px) { .cx-did { flex-direction: column; text-align: center; } .cx-banner-text { padding: 28px; } }

        /* Camera modal */
        .cx-modal { position: fixed; inset: 0; z-index: 1000; background: rgba(15,8,4,.82); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; padding: 16px; }
        .cx-modal-box { width: 100%; max-width: 560px; padding: 18px; border-radius: 30px; background: rgba(40,22,12,.92); border: 1px solid rgba(255,255,255,.18); box-shadow: 0 40px 90px rgba(0,0,0,.6); }
        .cx-modal-box video { width: 100%; border-radius: 20px; background: #000; display: block; margin-bottom: 16px; object-fit: cover; }
        .cx-modal-box .row { display: flex; gap: 12px; }
        .cx-modal-box .row .cx-btn { flex: 1; justify-content: center; }

        @media (max-width: 640px) {
          .cx-fancard[data-o="1"] { transform: translate(calc(-50% + 90px), -46%) scale(.85) rotate(6deg); }
          .cx-fancard[data-o="2"] { transform: translate(calc(-50% + 160px), -38%) scale(.65) rotate(12deg); }
          .cx-fancard[data-o="3"] { transform: translate(calc(-50% - 90px), -46%) scale(.85) rotate(-6deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cx-slide.on, .cx-show-row.on i { animation: none; }
          .cx-fancard, .cx-slide, .cx-fade, .cx-show-img img { transition: none; animation: none; }
        }

/* ===== Logout: red ===== */
.cx-logout { background: linear-gradient(135deg,#E5484D,#C62B33); color:#fff; box-shadow:0 6px 18px rgba(198,43,51,.35); }
.cx-logout:hover { box-shadow:0 10px 26px rgba(198,43,51,.55); filter:brightness(1.05); }

/* ===== Upload panel: light card, clearly separate from the photo ===== */
.cx-panel { background:#FFFBF5; backdrop-filter:none; border:1px solid rgba(255,255,255,.7); box-shadow:0 40px 90px rgba(0,0,0,.5); }
.cx-drop { background:#fff; border:2px dashed #E3A24B; }
.cx-drop:hover, .cx-drop.drag { background:#FFF4E2; border-color:#B9701F; }
.cx-drop-ico { color:#B9701F; background:#FCEBCB; border-color:#EBC784; }
.cx-drop h2 { color:#2A1810; }
.cx-drop p { color:#6F5E50; }
.cx-fmt span { color:#6F5E50; border-color:#E3D2C0; background:#FBF1E1; }
.cx-btn.ghost.cx-photo-btn { background:#2A1810; color:#fff; border-color:#2A1810; backdrop-filter:none; }
.cx-btn.ghost.cx-photo-btn:hover { background:#3E2415; }
.cx-preview { background:#F6EDE2; border-color:#E3D2C0; }
.cx-preview-head { color:#2A1810; }
.cx-preview-head em { background:#fff; color:#6F5E50; }
.cx-empty { color:#6F5E50; }
.cx-empty b { color:#2A1810; }
.cx-analyze:disabled { background:#E7DACB; color:#9A8876; }
.cx-error { background:#FDE8E3; border-color:#F2B3A6; color:#8A2A18; }

/* ===== Grade tab ===== */
.cx-gd { display:flex; flex-direction:column; gap:20px; position:relative; z-index:1; }
.cx-gd::before { content:""; position:absolute; top:10%; left:30%; width:50vw; height:50vh; border-radius:50%; background:radial-gradient(circle, rgba(227,162,75,0.15) 0%, transparent 60%); filter:blur(40px); z-index:-1; animation:cxAmbient 12s ease-in-out infinite alternate; pointer-events:none; }
@keyframes cxAmbient { 0% { transform:scale(1) translate(0,0); } 100% { transform:scale(1.2) translate(50px, -30px); } }
.cx-gd-main { display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; align-items: stretch; }
@media (max-width:1100px){ .cx-gd-main { grid-template-columns:1.2fr 1fr; } .cx-gd-break { grid-column:1 / -1; } }
@media (max-width:800px){ .cx-gd-main { grid-template-columns:1fr; } }
@keyframes cxCardFloatMove { 0% { transform:translateY(0px); } 50% { transform:translateY(-6px); } 100% { transform:translateY(0px); } }
.cx-gd-left { padding:32px 36px; border-radius:24px; background:rgba(255,255,255,0.5); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.6); box-shadow:0 16px 40px rgba(62,36,21,.04); color:var(--ink); position:relative; overflow:hidden; display:flex; flex-direction:column; animation:cxCardFloatMove 6s ease-in-out infinite; }
.cx-gd-left::before { content:""; position:absolute; top:-40px; right:-40px; width:220px; height:220px; border-radius:50%; background:radial-gradient(circle, rgba(227,162,75,0.12) 0%, transparent 70%); animation:cxFloatPulse 6s ease-in-out infinite alternate; pointer-events:none; }
@keyframes cxFloatPulse { 0% { transform:scale(1) translate(0, 0); opacity:0.6; } 100% { transform:scale(1.3) translate(-20px, 20px); opacity:1; } }
.cx-gd-tier { display:inline-flex; width:fit-content; padding:4px 10px; border-radius:6px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; font-weight:700; background:rgba(227,162,75,.15); color:var(--amber-deep); border:none; position:relative; z-index:1; }
.cx-gd-name { font-family:'Fraunces',serif; font-size:clamp(46px,6vw,72px); font-weight:600; letter-spacing:-2px; line-height:1; margin:10px 0 6px; background:linear-gradient(135deg, var(--ink), var(--amber-deep)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; position:relative; z-index:1; }
.cx-gd-ins { font-size:15px; line-height:1.5; max-width:460px; color:var(--muted); margin-bottom:24px; position:relative; z-index:1; }
.cx-gd-scale { margin-top:auto; position:relative; z-index:1; }
.cx-gd-track { position:relative; height:6px; border-radius:99px; background:rgba(62,36,21,.06); }
.cx-gd-track i { position:absolute; top:50%; width:18px; height:18px; border-radius:50%; background:var(--amber); border:3px solid #fff; transform:translate(-50%,-50%); transition:left 1s cubic-bezier(.2,.7,.2,1); animation:cxSleekPing 2s cubic-bezier(0,0,0.2,1) infinite; }
@keyframes cxSleekPing { 0% { box-shadow:0 0 0 0 rgba(227,162,75,0.4); } 70% { box-shadow:0 0 0 10px rgba(227,162,75,0); } 100% { box-shadow:0 0 0 0 rgba(227,162,75,0); } }
.cx-gd-ticks { display:grid; grid-template-columns:repeat(4,1fr); margin-top:10px; text-align:center; font-size:12px; font-weight:700; color:rgba(42,24,16,.4); }
.cx-gd-ticks span.on { color:var(--amber-deep); font-weight:700; }
.cx-gd-scale small { display:flex; justify-content:space-between; margin-top:6px; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:rgba(42,24,16,.4); font-weight:600; }
.cx-gd-facts { margin:0; padding:10px 24px; border-radius:24px; background:rgba(255,255,255,0.5); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.6); display:flex; flex-direction:column; justify-content:center; box-shadow:0 16px 40px rgba(62,36,21,.04); animation:cxCardFloatMove 7s ease-in-out infinite 0.5s; }
.cx-gd-facts div { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:14px 0; border-bottom:1px solid rgba(62,36,21,.06); }
.cx-gd-facts div:last-child { border-bottom:0; }
.cx-gd-facts dt { font-size:13px; font-weight:600; color:var(--muted); }
.cx-gd-facts dd { margin:0; font-family:'Manrope',sans-serif; font-size:18px; font-weight:700; color:var(--ink); text-align:right; }
.cx-gd-facts dd.sm { font-size:12px; font-weight:700; max-width:190px; line-height:1.4; }
.cx-gd-break { padding:22px 28px; border-radius:24px; background:rgba(255,255,255,0.5); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.6); box-shadow:0 16px 40px rgba(62,36,21,.04); animation:cxCardFloatMove 8s ease-in-out infinite 1s; display:flex; flex-direction:column; }
.cx-gd-break h3 { font-size:18px; font-weight:700; margin-bottom:4px; }
.cx-gd-break > p { font-size:13px; color:var(--muted); margin-bottom:16px; }
.cx-gd-row { display:grid; grid-template-columns:40px 1fr auto; gap:10px; align-items:center; padding:6px 0; }
.cx-gd-row b { font-family:'Manrope',sans-serif; font-weight:700; font-size:16px; color:var(--ink); }
.cx-gd-row .tr { height:6px; border-radius:99px; background:rgba(62,36,21,.06); overflow:hidden; }
.cx-gd-row .tr i { display:block; height:100%; border-radius:99px; transform-origin:left; animation:cxGrow 1s cubic-bezier(.2,.7,.2,1) both; }
@keyframes cxGrow { from { transform:scaleX(0); } }
.cx-gd-row span { text-align:right; font-size:13px; font-weight:700; color:var(--ink); }
.cx-gd-row span small { color:var(--muted); font-weight:600; }

/* ===== Description tab ===== */
.cx-ds { display:grid; grid-template-columns:1.4fr 1fr; border-radius:30px; overflow:hidden; background:var(--surface); border:1px solid var(--line); box-shadow:0 14px 40px rgba(62,36,21,.07); }
@media (max-width:900px){ .cx-ds { grid-template-columns:1fr; } }
.cx-ds-lead { padding:40px; background:linear-gradient(160deg,var(--surface-2),var(--surface)); }
.cx-ds-top { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:26px; }
.cx-ds-top h3 { font-size:30px; font-weight:600; }
.cx-ds-quote { font-family:'Fraunces',serif; font-size:clamp(20px,2.2vw,26px); line-height:1.5; color:var(--ink); padding-left:22px; border-left:4px solid var(--amber); }
.cx-ds-seal { display:flex; gap:14px; align-items:flex-start; margin-top:30px; padding:18px 20px; border-radius:20px; background:rgba(98,140,90,.12); border:1px solid rgba(98,140,90,.35); color:var(--muted); font-size:14px; line-height:1.65; }
.cx-ds-seal svg { flex:none; color:#4F7A47; }
.cx-ds-seal strong { color:var(--ink); }
.cx-ds-spec { margin:0; padding:30px 34px; display:flex; flex-direction:column; justify-content:center; }
.cx-ds-spec div { padding:16px 0; border-bottom:1px solid var(--line); }
.cx-ds-spec div:last-child { border-bottom:0; }
.cx-ds-spec dt { font-size:13px; font-weight:600; color:var(--muted); margin-bottom:4px; }
.cx-ds-spec dd { margin:0; font-size:16px; font-weight:700; color:var(--ink); }
.cx-ds-spec dd em { font-weight:600; }

/* ===== Features: light, animated ===== */
.cx-feat { background:linear-gradient(160deg,#FFF6E8,#F6E3C4); color:#2A1810; position:relative; overflow:hidden; }
.cx-dark .cx-feat { background:linear-gradient(160deg,#4A2E1D,#33200F); color:#fff; }
.cx-feat h2 { color:#2A1810; }
.cx-feat .lead { color:#5A4636; }
.cx-frow { border-top:1px solid rgba(62,36,21,.14); transition:transform .3s; }
.cx-frow:hover { transform:translateX(6px); }
.cx-frow h3 { color:#2A1810; }
.cx-frow p { color:#5A4636; }
.cx-frow .ico { background:linear-gradient(135deg,#F0B25A,#D98E2E); color:#2A1810; box-shadow:0 10px 22px rgba(217,142,46,.35); animation:cxBob 4s ease-in-out infinite; }
.cx-frow:nth-of-type(3) .ico { animation-delay:.6s; } .cx-frow:nth-of-type(4) .ico { animation-delay:1.2s; }
.cx-tags { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
.cx-tags span { padding:4px 12px; border-radius:99px; font-size:12px; font-weight:700; background:rgba(62,36,21,.08); color:#5A3A22; }
.cx-dark .cx-feat h2, .cx-dark .cx-frow h3 { color:#fff; }
.cx-dark .cx-feat .lead, .cx-dark .cx-frow p { color:rgba(255,255,255,.85); }
.cx-dark .cx-tags span { background:rgba(255,255,255,.14); color:#fff; }
@keyframes cxBob { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
.cx-feat-stage { position:relative; }
.cx-ring { position:absolute; border-radius:50%; border:2px dashed rgba(217,142,46,.5); pointer-events:none; }
.cx-ring.r1 { inset:-26px; animation:cxRot 40s linear infinite; }
.cx-ring.r2 { inset:-56px; border-color:rgba(217,142,46,.25); animation:cxRot 60s linear infinite reverse; }
@keyframes cxRot { to { transform:rotate(360deg); } }
.cx-feat-img { box-shadow:0 30px 60px rgba(62,36,21,.3); }
.cx-feat-img img { animation:cxKen 14s ease-in-out infinite alternate; }
@keyframes cxKen { from { transform:scale(1); } to { transform:scale(1.1); } }
.cx-scan { position:absolute; left:0; right:0; height:70px; top:0; background:linear-gradient(180deg,transparent,rgba(255,215,140,.45),transparent); border-bottom:2px solid rgba(255,215,140,.9); animation:cxScan 4.5s ease-in-out infinite; }
@keyframes cxScan { 0% { transform:translateY(-70px); } 100% { transform:translateY(calc(100% * 6.5)); } }
.cx-corner { position:absolute; width:26px; height:26px; border:3px solid #FFD79A; }
.cx-corner.tl { top:70px; left:20px; border-right:0; border-bottom:0; border-radius:8px 0 0 0; }
.cx-corner.tr { top:70px; right:20px; border-left:0; border-bottom:0; border-radius:0 8px 0 0; }
.cx-corner.bl { bottom:70px; left:20px; border-right:0; border-top:0; border-radius:0 0 0 8px; }
.cx-corner.br { bottom:70px; right:20px; border-left:0; border-top:0; border-radius:0 0 8px 0; }
.cx-tag { position:absolute; padding:6px 12px; border-radius:10px; font-size:12px; font-weight:700; color:#2A1810; background:#FFD79A; box-shadow:0 8px 18px rgba(0,0,0,.3); opacity:0; animation:cxTag 6s ease-in-out infinite; }
.cx-tag.t1 { top:34%; left:12%; animation-delay:.5s; }
.cx-tag.t2 { top:52%; right:10%; animation-delay:2s; }
.cx-tag.t3 { bottom:26%; left:18%; animation-delay:3.5s; }
@keyframes cxTag { 0%,8% { opacity:0; transform:translateY(8px) scale(.9); } 18%,60% { opacity:1; transform:none; } 75%,100% { opacity:0; } }
.cx-float { animation:cxBob 5s ease-in-out infinite; }
.cx-float.f2 { animation-delay:1.2s; }

/* ===== Story section ===== */
.cx-story-top { display:grid; grid-template-columns:1fr 1fr; gap:40px; align-items:center; margin-bottom:56px; }
@media (max-width:900px){ .cx-story-top { grid-template-columns:1fr; } }
.cx-story-top h2 { font-size:clamp(34px,4.6vw,58px); font-weight:600; line-height:1.05; }
.cx-story-top p { margin-top:18px; font-size:17px; line-height:1.75; color:var(--muted); max-width:480px; }
.cx-story-img { position:relative; border-radius:200px 200px 32px 32px; overflow:hidden; aspect-ratio:5/4.4; box-shadow:0 30px 70px rgba(62,36,21,.25); }
.cx-story-img img { width:100%; height:100%; object-fit:cover; transition:transform 1.4s; }
.cx-story-img:hover img { transform:scale(1.07); }
.cx-story-img span { position:absolute; left:50%; bottom:20px; transform:translateX(-50%); padding:8px 18px; border-radius:99px; font-size:13px; font-weight:700; color:#fff; background:rgba(20,10,5,.6); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.3); white-space:nowrap; }
.cx-steps { list-style:none; margin:0 0 48px; padding:0; display:grid; grid-template-columns:repeat(4,1fr); gap:0; position:relative; }
@media (max-width:900px){ .cx-steps { grid-template-columns:1fr 1fr; gap:28px 16px; } }
.cx-steps::before { content:""; position:absolute; top:27px; left:6%; right:6%; height:2px; background:repeating-linear-gradient(90deg,var(--amber) 0 8px,transparent 8px 16px); }
@media (max-width:900px){ .cx-steps::before { display:none; } }
.cx-steps li { position:relative; padding:0 18px; text-align:center; }
.cx-steps .n { width:54px; height:54px; margin:0 auto 18px; border-radius:50%; display:grid; place-items:center; font-family:'Fraunces',serif; font-size:22px; font-weight:600; background:var(--amber); color:#2A1810; position:relative; box-shadow:0 0 0 8px var(--bg); }
.cx-steps h3 { font-size:21px; font-weight:600; margin-bottom:6px; }
.cx-steps p { font-size:14px; line-height:1.65; color:var(--muted); }
.cx-facts { display:grid; grid-template-columns:repeat(3,1fr); border-radius:30px; background:var(--surface-2); border:1px solid var(--line); overflow:hidden; }
@media (max-width:800px){ .cx-facts { grid-template-columns:1fr; } }
.cx-facts div { padding:30px 32px; border-right:1px solid var(--line); }
.cx-facts div:last-child { border-right:0; }
@media (max-width:800px){ .cx-facts div { border-right:0; border-bottom:1px solid var(--line); } }
.cx-facts b { display:block; font-family:'Fraunces',serif; font-size:24px; font-weight:600; margin-bottom:8px; }
.cx-facts span { font-size:14px; line-height:1.7; color:var(--muted); }

/* ===== Footer: light ===== */
.cx-footer { background:var(--surface); padding:28px 0; border-top:1px solid rgba(62,36,21,.05); }
.cx-footer .cx-wrap { display:block; max-width:none; padding:0 36px; }
.cx-foot-grid { display:flex; justify-content:space-between; align-items:center; }
.cx-foot-brand b { font-family:'Fraunces',serif; font-size:22px; color:#4A2A18; letter-spacing:-0.5px; }
.cx-foot-copy { font-size:11px; color:rgba(42,24,16,.5); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
.cx-foot-links { display:flex; gap:36px; align-items:center; }
.cx-foot-links button { background:none; border:0; font-size:11px; font-weight:700; color:var(--ink); cursor:pointer; padding:0; text-transform:uppercase; letter-spacing:1.5px; transition:color .2s; }
.cx-foot-links button:hover { color:var(--amber-deep); }
@media (max-width: 800px) {
  .cx-foot-grid { flex-direction:column; gap:20px; text-align:center; }
  .cx-foot-links { gap:16px; flex-wrap:wrap; justify-content:center; }
}

@media (prefers-reduced-motion: reduce) {
  .cx-scan, .cx-tag, .cx-ring, .cx-float, .cx-frow .ico, .cx-feat-img img, .cx-gd-track i { animation:none; }
  .cx-tag { opacity:1; }
}
      `}</style>

      <div className={`cx-root ${isDark ? "cx-dark" : ""}`}>

        {/* ── TOP NAVIGATION (full width) ── */}
        <header className={`cx-header ${scrolled ? "on" : ""}`}>
          <div className="cx-hwrap">
            <button className="cx-brand" onClick={() => go("/cinnamon")} aria-label="Ceylon Cinnamon home">
              <span className="cx-logo" style={{ background: "linear-gradient(135deg,#8C5A32,#3E2415)" }}>🪵</span>
              <span>
                <b>Ceylon Cinnamon</b>
                <small>Grade Detection</small>
              </span>
            </button>

            <button className="cx-burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">{menuOpen ? "×" : "☰"}</button>

            <nav className={`cx-nav ${menuOpen ? "open" : ""}`}>
              <button className="link active" onClick={() => go("/cinnamon")}>Detection</button>
              <button className="link" onClick={() => go("/cinnamon/guidelines")}>Guideline to get images</button>
              <button className="link" onClick={() => go("/cinnamon/history")}>History</button>
              {isAdmin && (
                <button className="link" onClick={() => go("/cinnamon/admin")}>Admin</button>
              )}
              <button className="cx-logout" onClick={handleLogout}>Logout</button>
            </nav>
          </div>
        </header>

        {/* ── SCENE: hero + upload on one continuous photo ── */}
        <div className="cx-scene">
          {HERO_SLIDES.map((s, i) => (
            <div key={s.label} className={`cx-slide ${i === hero.idx ? "on" : ""}`} style={{ backgroundImage: `url(${s.src})` }} />
          ))}
          <div className="cx-shade" />

          {/* Hero */}
          <section
            className="cx-hero"
            onMouseEnter={() => hero.setPaused(true)}
            onMouseLeave={() => hero.setPaused(false)}
          >
            <div className="cx-wrap cx-hero-grid">
              <div>
                <h1>Grade your Ceylon cinnamon from one photo</h1>
                <p className="lead">
                  Upload a picture of your quills and get the grade, quality tier, origin and a market price outlook in seconds.
                </p>
                <div className="cx-cta-row">
                  <button className="cx-btn primary" onClick={scrollToUpload}>Upload a photo</button>
                  <button className="cx-btn ghost" onClick={() => navigate("/cinnamon/guidelines")}>How to take the photo</button>
                  <div className="cx-arrows" style={{ marginLeft: "8px" }}>
                    <button className="cx-arrow" onClick={() => hero.go(hero.idx - 1)} aria-label="Previous image">←</button>
                    <button className="cx-arrow" onClick={() => hero.go(hero.idx + 1)} aria-label="Next image">→</button>
                  </div>
                </div>
              </div>

              <Fan items={HERO_SLIDES} idx={hero.idx} />
            </div>
          </section>
        </div> {/* End cx-scene */}

        {/* Upload */}
        <section id="cx-upload" className="cx-upload" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
          <div className="cx-wrap">
            <div className="cx-upload-head" style={{ color: 'var(--ink)' }}>
              <h2 style={{ color: 'var(--ink)' }}>Upload your sample</h2>
              <p style={{ color: 'var(--muted)' }}>One clear photo of your quills on a plain surface works best.</p>
            </div>

            <div className="cx-panel">
              <div
                className={`cx-drop ${drag ? "drag" : ""}`}
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
                  style={{ display: "none" }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  style={{ display: "none" }}
                  onChange={handleCameraChange}
                />

                <div className="cx-drop-ico">
                  <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                    <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2>Upload cinnamon image</h2>
                <p>Drag and drop, click to browse, or take a photo</p>
                <div className="cx-fmt"><span>JPG</span><span>PNG</span></div>
                <div>
                  <button type="button" className="cx-btn ghost cx-photo-btn" onClick={handleCameraClick}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                    Take photo
                  </button>
                </div>
              </div>

              <div className="cx-preview">
                {image ? (
                  <>
                    <div className="cx-preview-head">
                      <span>Sample preview</span>
                      <em>{image.size}</em>
                    </div>
                    <div className="cx-preview-img">
                      <img src={image.url} alt="preview" />
                      <button className="cx-x" onClick={(e) => { e.stopPropagation(); reset(); }} aria-label="Remove image">×</button>
                    </div>
                  </>
                ) : (
                  <div className="cx-empty">
                    <svg width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="4" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="8.5" cy="8.5" r="2" />
                      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <b>No sample yet</b>
                    <span>Your image will preview here once uploaded</span>
                  </div>
                )}
              </div>

              <div className="cx-panel-foot">
                <button className={`cx-btn primary cx-analyze ${loading ? "loading" : ""}`} onClick={analyze} disabled={!image || loading}>
                  {loading ? (
                    <>
                      <svg className="cx-spin" width="20" height="20" fill="none" viewBox="0 0 24 24">
                        <circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path opacity=".8" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analysing details…
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      Identify grade
                    </>
                  )}
                </button>
                {error && (
                  <div className="cx-error cx-fade">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Camera modal */}
        {showCamera && (
          <div className="cx-modal">
            <div className="cx-modal-box cx-fade">
              <video ref={videoRef} autoPlay playsInline />
              <div className="row">
                <button className="cx-btn primary" onClick={handleCapturePhoto}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><circle cx="12" cy="13" r="3" /></svg>
                  Capture
                </button>
                <button className="cx-btn ghost" onClick={() => setShowCamera(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

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
            { id: "grade", label: "Cinnamon Grade", icon: "🪵" },
            { id: "description", label: "Description", icon: "📋" },
            ...(forecast ? [{ id: "market", label: "Market Price", icon: "📈" }] : []),
          ];

          // Market view model (display only)
          const periods = forecast && forecast.available !== false
            ? [
                { title: "This week", data: forecast.this_week },
                { title: "Next week", data: forecast.next_week },
                { title: "Next month", data: forecast.next_month },
              ]
            : [];
          const cur = periods[marketPeriod] || periods[0];
          let ranked = [], pMin = 0, pMax = 0;
          if (cur) {
            ranked = [...cur.data.market_predictions].sort((a, b) => b.predicted_price - a.predicted_price);
            pMax = ranked[0]?.predicted_price ?? 0;
            pMin = ranked[ranked.length - 1]?.predicted_price ?? 0;
          }

          return (
            <section className="cx-section cx-fade" style={{ paddingTop: 80 }}>
              <div className="cx-wrap">
                <div className="cx-sec-head">
                  <h2>Your analysis results</h2>
                  <p>Grade, composition and pricing for the sample you uploaded.</p>
                </div>

                <div className="cx-status-row" style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                  {/* Tabs */}
                  <div className="cx-tabs" style={{ margin: 0, flex: '0 0 auto' }}>
                    {TABS.map((t) => (
                      <button key={t.id} onClick={() => setResultTab(t.id)} className={`cx-tab ${resultTab === t.id ? "on" : ""}`}>
                        <span>{t.icon}</span>{t.label}
                      </button>
                    ))}
                  </div>

                  {/* Status banner */}
                  <div className={`cx-status ${isMixed ? "mixed" : "pure"}`} style={{ margin: 0, flex: '1 1 auto', minWidth: '300px' }}>
                    <div>
                      <small>Status</small>
                      <strong>{isSingleQuill ? `${finalGrade} Single Quill Detected` : result.status}</strong>
                    </div>
                    <span className="cx-pill">{isSingleQuill ? "Single Quill" : isMixed ? "Mixed Bundle" : "Pure Bundle"}</span>
                  </div>
                </div>

                {/* ── TAB: CINNAMON GRADE ── */}
{resultTab === "grade" && (() => {
  const ORDER = ["Alba", "C5", "C4", "H2"];
  const pos = Math.max(0, ORDER.indexOf(finalGrade));
  const INSIGHTS = {
    Alba: "Top-tier harvest. Commands the highest market premium due to delicate crafting.",
    C5: "Premium export grade. Exceptional balance of flavour and appearance.",
    C4: "High-demand commercial grade. Ideal for premium retail packaging.",
    H2: "Standard grade. Cost-effective for culinary, bulk and industrial use.",
  };
  return (
    <div className="cx-fade cx-gd">
      <div className="cx-gd-main">
        <div className="cx-gd-left">
          <span className="cx-gd-tier">{gradeInfo.quality} tier</span>
          <div className="cx-gd-name">{finalGrade}</div>
          <p className="cx-gd-ins">{INSIGHTS[finalGrade]}</p>
          <div className="cx-gd-scale">
            <div className="cx-gd-track"><i style={{ left: `${((pos + 0.5) / ORDER.length) * 100}%` }} /></div>
            <div className="cx-gd-ticks">
              {ORDER.map((g) => <span key={g} className={g === finalGrade ? "on" : ""}>{g}</span>)}
            </div>
            <small><span>Finest</span><span>Coarser</span></small>
          </div>
        </div>

        <dl className="cx-gd-facts">
          <div><dt>Total quills</dt><dd>{totalQuills}</dd></div>
          <div><dt>Diameter</dt><dd>{gradeInfo.thickness}</dd></div>
          <div><dt>Sample type</dt><dd>{isMixed ? `${detailEntries.length} grades mixed` : "Single grade"}</dd></div>
          <div><dt>Botanical origin</dt><dd className="sm">{gradeInfo.origin}</dd></div>
        </dl>

        <div className="cx-gd-break" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          {image?.url && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', marginBottom: '28px', flexShrink: 0 }}>
              <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                {/* Glowing drop shadow using the image itself */}
                <div style={{ position: 'absolute', inset: '-10px', background: `url(${image.url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(16px)', opacity: 0.6, borderRadius: '50%' }}></div>
                
                {/* The actual image in a clean circular lens */}
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 24px rgba(62,36,21,0.15)', position: 'relative', zIndex: 1 }}>
                  <img src={image.url} alt="Analyzed Sample" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)' }} />
                </div>
                
                {/* Creative floating badge */}
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'var(--surface)', borderRadius: '50%', padding: '4px', zIndex: 2, boxShadow: '0 4px 12px rgba(62,36,21,0.1)' }}>
                   <div style={{ background: 'var(--amber)', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px' }}>✨</div>
                </div>
              </div>
            </div>
          )}
          
          <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <h3>Grade breakdown</h3>
            <p style={{ marginBottom: '16px' }}>Share of each grade found in your sample.</p>
          
            <div className="cx-gd-break-list">
              {detailEntries.map(([grade, count]) => {
                const col = GRADE_COLORS[grade] || GRADE_COLORS["H2"];
                const pct = Math.round((count / totalQuills) * 100);
                return (
                  <div key={grade} className="cx-gd-row">
                    <b>{grade}</b>
                    <div className="tr"><i className={col.bar} style={{ width: `${pct}%` }} /></div>
                    <span>{count} quill{count > 1 ? "s" : ""} <small>({pct}%)</small></span>
                  </div>
                );
              })}
            </div>

            {isSingleQuill && (
              <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <div style={{ padding: '14px', background: 'rgba(227,162,75,0.1)', borderRadius: '14px', border: '1px dashed rgba(227,162,75,0.3)', textAlign: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--amber-deep)', fontWeight: '700' }}>✨ Consistent single-quill sample</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
})()}

{/* ── TAB: GRADE DESCRIPTION ── */}
{resultTab === "description" && (
  <div className="cx-fade cx-ds">
    <div className="cx-ds-lead">
      <div className="cx-ds-top">
        <h3>Grade {finalGrade}</h3>
        <span className={`px-4 py-1.5 rounded-full border text-xs font-bold ${colors.badge}`}>{gradeInfo.quality}</span>
      </div>
      <p className="cx-ds-quote">{gradeInfo.description}</p>
      <div className="cx-ds-seal">
        <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
        <span>Classified under the <strong>SLSI 135</strong> framework and derived from <em>{gradeInfo.origin}</em>, confirming botanical integrity and traditional harvesting methods.</span>
      </div>
    </div>

    <dl className="cx-ds-spec">
      <div><dt>Quality tier</dt><dd>{gradeInfo.quality}</dd></div>
      <div><dt>Quill diameter</dt><dd>{gradeInfo.thickness}</dd></div>
      <div><dt>Botanical origin</dt><dd><em>{gradeInfo.origin}</em></dd></div>
      <div><dt>Standard</dt><dd>SLSI 135</dd></div>
      <div><dt>Status</dt><dd><span className="cx-dot" />Ceylon verified</dd></div>
    </dl>
  </div>
)}

                {/* ── TAB: MARKET PRICE ── */}
                {resultTab === "market" && forecast && (
                  <div className="cx-fade">
                    {forecast.available === false ? (
                      <div className="cx-unavail">
                        <svg width="34" height="34" fill="none" stroke="var(--amber-deep)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <h3>Forecast unavailable</h3>
                        <p>{forecast.message}</p>
                      </div>
                    ) : (
                      <>
                        {/* Period selector: best price per period at a glance */}
                        <div className="cx-ptiles">
                          {periods.map((p, i) => {
                            const diff = p.data.best_market.predicted_price - periods[0].data.best_market.predicted_price;
                            const flat = Math.abs(diff) < 0.005;
                            return (
                              <button key={p.title} className={`cx-ptile ${i === marketPeriod ? "on" : ""}`} onClick={() => setMarketPeriod(i)}>
                                <small>{p.title}</small>
                                <span className="d">{p.data.forecast_period}</span>
                                <b>LKR {money(p.data.best_market.predicted_price)}</b>
                                {i > 0 && (
                                  <em className={flat ? "flat" : diff > 0 ? "up" : "down"}>
                                    {flat ? "Same as this week" : `${diff > 0 ? "▲" : "▼"} ${money(Math.abs(diff))} vs this week`}
                                  </em>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <div className="cx-mgrid" key={marketPeriod}>
                          {/* Best market */}
                          <div className="cx-best cx-fade">
                            <small>Best market · {cur.title.toLowerCase()}</small>
                            <h3>{cur.data.best_market.district}</h3>
                            <div className="price">LKR {money(cur.data.best_market.predicted_price)}<span> /kg</span></div>
                            {cur.data.recommendation && <div className="tip">💡 {cur.data.recommendation}</div>}
                            <div className="cx-best-meta">
                              <div><span>Highest</span><b>{money(pMax)}</b></div>
                              <div><span>Lowest</span><b>{money(pMin)}</b></div>
                              <div><span>Gap</span><b>{money(pMax - pMin)}</b></div>
                            </div>
                          </div>

                          {/* Ranked bars */}
                          <div className="cx-surface cx-ranks cx-fade">
                            <h4>All markets, highest price first</h4>
                            <p className="cap">Bars show where each market sits between the lowest and highest price (LKR per kg).</p>
                            {ranked.map((m, i) => {
                              const w = 28 + 72 * ((m.predicted_price - pMin) / ((pMax - pMin) || 1));
                              return (
                                <div key={m.district} className="cx-rank">
                                  <span className="rk">{i + 1}</span>
                                  <span className="nm">{m.district}</span>
                                  <div className="track"><i style={{ width: `${w}%` }} /></div>
                                  <span className="pr">LKR {money(m.predicted_price)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {/* ── SHOWCASE: one big image that changes + clickable list ── */}
        <section className="cx-section">
          <div className="cx-wrap">
            <ScrollReveal direction="up">
              <div className="cx-sec-head">
                <h2>Know what you are grading</h2>
                <p>The forms of Ceylon cinnamon you will see in a sample. Pick one, or let the photos change on their own.</p>
              </div>
            </ScrollReveal>

            <div className="cx-show">
              <div className="cx-show-img">
                {SLIDES.map((s, i) => (
                  <img key={s.label} src={s.src} alt={s.label} className={i === show.idx ? "on" : ""} />
                ))}
                <div className="cx-show-cap" key={show.idx}>
                  <h3>{SLIDES[show.idx].label}</h3>
                  <p>{SLIDES[show.idx].note}</p>
                </div>
              </div>

              <div className="cx-show-list">
                {SLIDES.map((s, i) => (
                  <button key={s.label} className={`cx-show-row ${i === show.idx ? "on" : ""}`} onClick={() => show.go(i)}>
                    <img src={s.src} alt="" />
                    <div>
                      <b>{s.label}</b>
                      <span>{s.desc}</span>
                    </div>
                    <i key={i === show.idx ? `a${show.idx}` : `b${i}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
<section className="cx-feat">
  <div className="cx-wrap cx-feat-grid">
    <ScrollReveal direction="left">
      <div className="cx-feat-stage">
        <span className="cx-ring r1" /><span className="cx-ring r2" />
        <div className="cx-feat-img">
          <img src={img3} alt="Rolled Ceylon cinnamon quills" />
          <span className="cx-scan" />
          <i className="cx-corner tl" /><i className="cx-corner tr" /><i className="cx-corner bl" /><i className="cx-corner br" />
          <div className="cx-tag t1">Diameter checked</div>
          <div className="cx-tag t2">Colour matched</div>
          <div className="cx-tag t3">Coil uniform</div>
          <div className="cx-float f1"><span className="ck">✓</span>SLSI 135 aligned</div>
          <div className="cx-float f2"><span className="ck">🔒</span>Images are not stored</div>
        </div>
      </div>
    </ScrollReveal>

    <div>
      <ScrollReveal direction="up">
        <h2>Built for cinnamon traders</h2>
        <p className="lead">Accurate grading you can rely on, from the field to the export container.</p>
      </ScrollReveal>
      {[
        {
          title: "Visual analysis",
          body: "Trained models read surface texture, quill diameter and coiling uniformity from your photo.",
          tags: ["Texture", "Diameter", "Coiling"],
          icon: <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
        },
        {
          title: "SLSI 135 compliance",
          body: "Grades follow the Sri Lanka Standards Institution specification, so results match export quality standards.",
          tags: ["Alba", "C5", "C4", "H2"],
          icon: <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
        },
        {
          title: "Secure processing",
          body: "Images are processed in-session and never permanently stored, so your supply-chain samples stay confidential.",
          tags: ["In-session only", "Not stored"],
          icon: <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
        },
      ].map(({ title, body, tags, icon }, index) => (
        <ScrollReveal key={title} direction="up" delay={index * 0.08}>
          <div className="cx-frow">
            <div className="ico">{icon}</div>
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
              <div className="cx-tags">{tags.map((t) => <span key={t}>{t}</span>)}</div>
            </div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  </div>
</section>

        {/* ── STORY ── */}
<section className="cx-section">
  <div className="cx-wrap">
    <ScrollReveal direction="up">
      <div className="cx-story-top">
        <div>
          <h2>The gold standard of spice</h2>
          <p>True Ceylon cinnamon is prized for its delicate flavour, very low coumarin and gentle sweetness. Every quill you grade here started as a hand-peeled strip of inner bark.</p>
        </div>
        <div className="cx-story-img">
          <img src={img1} alt="Cinnamon powder and quills" />
          <span>Native to Sri Lanka</span>
        </div>
      </div>
    </ScrollReveal>

    <ScrollReveal direction="up">
      <ol className="cx-steps">
        {[
          ["Harvest", "Shoots are cut from mature trees after the rains."],
          ["Peel", "The outer bark is scraped away and the thin inner bark is lifted by hand."],
          ["Roll and dry", "Strips are rolled into quills and dried in the shade."],
          ["Grade", "Quills are sorted by thickness and colour. This app does it from a photo."],
        ].map(([t, d], i) => (
          <li key={t}>
            <div className="n">{i + 1}</div>
            <h3>{t}</h3>
            <p>{d}</p>
          </li>
        ))}
      </ol>
    </ScrollReveal>

    <ScrollReveal direction="up">
      <div className="cx-facts">
        <div><b>Ultra-low coumarin</b><span>Gentler than cassia, which is why it is preferred for daily use.</span></div>
        <div><b>Rich in antioxidants</b><span>Valued in traditional medicine and modern kitchens alike.</span></div>
        <div><b>Hand-crafted</b><span>Peeling the inner bark without harming the tree keeps harvests sustainable.</span></div>
      </div>
    </ScrollReveal>
  </div>
</section>

{/* ── FOOTER ── */}
<footer className="cx-footer">
  <div className="cx-wrap">
    <div className="cx-foot-grid">
      <div className="cx-foot-brand">
        <b>Ceylon Cinnamon</b>
      </div>
      <div className="cx-foot-links">
        <button onClick={() => navigate("/cinnamon")}>Detection</button>
        <button onClick={() => navigate("/cinnamon/guidelines")}>Guidelines</button>
        <button onClick={() => navigate("/cinnamon/history")}>History</button>
      </div>
      <div className="cx-foot-copy">
        <span>© 2025 Ceylon Cinnamon</span>
      </div>
    </div>
  </div>
</footer>
      </div>
    </>
  );
}