export function Map() {
    return (
      <div>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1.1rem",color:"#1a4028",marginBottom:16}}>Satellite Map View</div>
        <div style={{background:"white",border:"1px solid rgba(58,148,96,0.14)",borderRadius:18,overflow:"hidden",position:"relative",height:480}}>
          <img
            src="https://images.unsplash.com/photo-1446941611757-91d2c3bd3d45?w=1200&q=80"
            alt="Satellite farmland map"
            style={{width:"100%",height:"100%",objectFit:"cover",filter:"saturate(0.8)"}}
          />
          {/* Zone overlays */}
          {[
            { label:"Zone A", top:"22%", left:"18%", health:"good" },
            { label:"Zone B", top:"38%", left:"52%", health:"moderate" },
            { label:"Zone C", top:"60%", left:"28%", health:"low" },
            { label:"Zone D", top:"30%", left:"72%", health:"good" },
          ].map(z => (
            <div key={z.label} style={{
              position:"absolute", top:z.top, left:z.left,
              background:"rgba(255,255,255,0.9)", backdropFilter:"blur(8px)",
              borderRadius:8, padding:"5px 11px", fontSize:"0.74rem", fontWeight:700,
              color:"#1a4028", border:"1px solid rgba(58,148,96,0.2)",
              cursor:"pointer", transition:"transform .2s",
            }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
            >
              {z.label} · {z.health==="good"?"🟢":z.health==="moderate"?"🟡":"🔴"}
            </div>
          ))}
          <div style={{position:"absolute",bottom:16,right:16,background:"rgba(255,255,255,0.93)",backdropFilter:"blur(10px)",borderRadius:12,padding:"10px 14px",fontSize:"0.75rem",color:"#1a4028",border:"1px solid rgba(58,148,96,0.14)"}}>
            🛰️ Sentinel-2 · Last updated 2d ago
          </div>
        </div>
        <div style={{marginTop:14,display:"flex",gap:10,flexWrap:"wrap"}}>
          {["NDVI","EVI","Moisture","RGB"].map(l => (
            <button key={l} style={{padding:"7px 16px",borderRadius:100,background:l==="NDVI"?"#1a4028":"white",color:l==="NDVI"?"white":"#3d5c47",border:"1px solid rgba(58,148,96,0.18)",fontSize:"0.8rem",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              {l}
            </button>
          ))}
        </div>
      </div>
    );
  }
  export default  Map ;