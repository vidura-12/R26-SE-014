import { useRef, useState, useEffect } from "react";
 
export function Predict() {
  const chartRef = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.2 });
    io.observe(el); return () => io.disconnect();
  }, []);
 
  const ZONES = ["Zone A","Zone B","Zone C","Zone D"];
  const [selected, setSelected] = useState("Zone A");
 
  const DATA = {
    "Zone A": [68,72,80,77,84,87,82,79],
    "Zone B": [55,58,62,60,65,68,64,61],
    "Zone C": [38,35,44,42,40,45,48,43],
    "Zone D": [78,80,82,85,82,86,84,81],
  };
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"];
 
  const bars = DATA[selected];
 
  return (
    <div>
      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1.1rem",color:"#1a4028",marginBottom:6}}>AI Health Predictions</div>
      <div style={{fontSize:"0.82rem",color:"#7a9882",marginBottom:20}}>ML forecast based on historical NDVI · Dashed = predicted</div>
 
      {/* Zone selector */}
      <div style={{display:"flex",gap:8,marginBottom:22,flexWrap:"wrap"}}>
        {ZONES.map(z => (
          <button key={z} onClick={() => setSelected(z)} style={{padding:"7px 16px",borderRadius:100,background:z===selected?"#1a4028":"white",color:z===selected?"white":"#3d5c47",border:"1px solid rgba(58,148,96,0.18)",fontSize:"0.8rem",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
            {z}
          </button>
        ))}
      </div>
 
      <div ref={chartRef} style={{background:"white",border:"1px solid rgba(58,148,96,0.14)",borderRadius:18,padding:"24px 24px 18px"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"0.9rem",color:"#1a4028",marginBottom:4}}>{selected} — NDVI Health Index</div>
        <div style={{fontSize:"0.73rem",color:"#7a9882",marginBottom:20}}>Jan–May recorded · Jun–Aug AI predicted</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:8,height:160}}>
          {bars.map((h, i) => (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <div style={{
                width:"100%", borderRadius:"5px 5px 0 0",
                background: i >= 5 ? "linear-gradient(180deg,rgba(200,119,58,0.4),rgba(200,119,58,0.14))" : "linear-gradient(180deg,#5bb87e,#3a9460)",
                border: i >= 5 ? "1.5px dashed rgba(200,119,58,0.55)" : "none",
                borderBottom: i >= 5 ? "none" : undefined,
                height: vis ? `${h}%` : "0%",
                transition: "height 1.2s cubic-bezier(.22,1,.36,1)",
                transitionDelay: `${i*0.07}s`,
              }} />
              <span style={{fontSize:"0.62rem",color:"#7a9882"}}>{MONTHS[i]}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:16,marginTop:14,paddingTop:12,borderTop:"1px solid rgba(58,148,96,0.1)"}}>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:"0.72rem",color:"#7a9882"}}>
            <div style={{width:9,height:9,borderRadius:3,background:"#3a9460"}} />Recorded
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:"0.72rem",color:"#7a9882"}}>
            <div style={{width:9,height:9,borderRadius:3,background:"rgba(200,119,58,0.35)",border:"1.5px dashed rgba(200,119,58,0.55)"}} />Predicted
          </div>
        </div>
      </div>
 
      {/* Insights */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,marginTop:18}}>
        {[
          { icon:"📈", title:"Peak Expected", desc:"Zone A expected to peak at NDVI 0.88 in June based on seasonal trend.", color:"#e8f5ec", border:"#d4edd9", tc:"#1a4028" },
          { icon:"⚠️", title:"Zone C Risk",   desc:"Zone C showing stress trajectory. Recommend irrigation in next 7 days.", color:"#fef2f0", border:"rgba(224,90,74,0.22)", tc:"#c0392b" },
          { icon:"🌧️", title:"Rain Impact",   desc:"Forecast rainfall next week may improve Zone B from moderate to healthy.", color:"#fffbea", border:"rgba(220,168,52,0.3)", tc:"#7a5c00" },
        ].map(i => (
          <div key={i.title} style={{background:i.color,border:`1px solid ${i.border}`,borderRadius:14,padding:"16px 18px"}}>
            <div style={{fontSize:"1.1rem",marginBottom:8}}>{i.icon}</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"0.86rem",color:i.tc,marginBottom:4}}>{i.title}</div>
            <div style={{fontSize:"0.79rem",color:"#3d5c47",lineHeight:1.6}}>{i.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Predict;