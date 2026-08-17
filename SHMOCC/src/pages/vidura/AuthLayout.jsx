import { useEffect, useState } from "react";

const images = [
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200",
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200",
  "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200",
];

// Make sure Syne + DM Sans are loaded once globally, e.g. in index.html:
// <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap" rel="stylesheet">

export default function AuthLayout({ children }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((p) => (p + 1) % images.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-screen h-screen bg-[#e6ebe7] flex items-center justify-center overflow-hidden font-['DM_Sans']">
      <div className="flex w-[min(1020px,calc(100vw-48px))] h-[min(640px,calc(100vh-48px))] rounded-[20px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.15),0_4px_16px_rgba(0,0,0,0.06)] bg-white">

        {/* LEFT — image carousel, hidden below 600px */}
        <div className="hidden sm:block relative flex-[0_0_42%] min-w-0 overflow-hidden">
          {images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt="farm"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                i !== index ? "opacity-0" : "opacity-100"
              }`}
            />
          ))}

          <div className="absolute inset-0 flex flex-col justify-between p-9 bg-[linear-gradient(165deg,rgba(8,22,14,0.35)_0%,rgba(8,22,14,0.82)_100%)]">
            <div className="flex items-center gap-2">
              {/* brand slot */}
            </div>

            <div>
              <p className="font-['Syne'] font-bold text-[clamp(1.2rem,2.2vw,1.6rem)] text-white leading-tight tracking-tight mb-1.5">
                Smart Cinnamon
                <br />
                Health Monitoring
              </p>
              <p className="text-sm font-light text-white/55 mb-5">
                Powered by AI &amp; Satellite
              </p>

              <div className="flex items-center gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
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
        </div>

        {/* RIGHT — form slot */}
        <div className="flex-1 min-w-0 flex items-center justify-center px-7 sm:px-12 py-10 bg-white overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      </div>
    </div>
  );
}