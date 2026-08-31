import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import img1 from "../../assets/12.png";
import img2 from "../../assets/7.jpg";
import img3 from "../../assets/2.jpg";
import img4 from "../../assets/5.jpg";
import img5 from "../../assets/6.jpg";

const images = [img1, img2, img3, img4, img5];

export default function Login({ onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((p) => (p + 1) % images.length), 4500);
    return () => clearInterval(id);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "https://cinnamon-backend.agreeableisland-ddd74309.southeastasia.azurecontainerapps.io/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Save login details
      localStorage.setItem("cinnamonToken", data.token);
      localStorage.setItem("cinnamonRole", data.role);
      localStorage.setItem("cinnamonUserId", data.userId);
      localStorage.setItem("cinnamonUserName", data.userName);

      navigate("/cinnamon", { replace: true });

    } catch (error) {
      setMessage("Server connection failed.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4 sm:p-8 selection:bg-amber-200 selection:text-amber-900 font-sans">
      <div className="flex w-full max-w-[1020px] h-[min(640px,calc(100vh-48px))] rounded-[20px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.1)] bg-white">
        
        {/* Left side: Image / Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-amber-900 overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/90 via-amber-900/40 to-transparent z-10" />
        {images.map((src, i) => (
          <img 
            key={src}
            src={src} 
            alt="Premium Cinnamon Sticks" 
            className={`absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-1000 ease-in-out ${
              i !== index ? "opacity-0" : "opacity-100"
            }`}
          />
        ))}
        <div className="relative z-20 flex flex-col justify-end p-16 h-full text-white w-full">
          <div className="inline-flex items-center gap-3 font-mono text-[10px] tracking-[0.25em] uppercase text-amber-200 bg-amber-900/40 px-4 py-1.5 rounded-full mb-6 border border-amber-500/30 backdrop-blur-md w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Ceylon Spice Intelligence
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-medium tracking-tight leading-tight mb-4">
            Grade & Market<br/>
            <span className="text-amber-300 italic">Insights</span>
          </h1>
          <p className="text-amber-100/80 font-light max-w-md leading-relaxed mb-6">
            Access advanced visual analysis and real-time market predictions for premium Ceylon cinnamon grading.
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-[7px] rounded-full border-none p-0 cursor-pointer transition-all duration-300 ${
                  i === index
                    ? "w-[22px] bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                    : "w-[7px] bg-white/35"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#faf9f6] relative overflow-y-auto">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-amber-300/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30vw] h-[30vw] rounded-full bg-orange-300/10 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md px-8 py-12 relative z-10">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="font-serif text-4xl text-slate-800 tracking-tight mb-3">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Please sign in to access your dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Email</label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-sm"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Password</label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {message && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-600 text-sm animate-fade-in">
                <svg className="shrink-0 w-5 h-5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <p>{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium shadow-[0_8px_30px_rgb(15,23,42,0.2)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
            </button>

            <p className="text-center text-sm text-slate-500 mt-8 pt-6 border-t border-slate-200/60">
              Don't have an account?{" "}
              <button
                type="button"
                className="text-amber-600 font-semibold hover:text-amber-700 hover:underline transition-colors focus:outline-none"
                onClick={onRegister}
              >
                Create one now
              </button>
            </p>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}