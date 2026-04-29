export function Reports() {
    const reports = [
      { title:"Monthly Health Summary — May 2025", zones:"All Zones", date:"Jun 1, 2025",  size:"2.4 MB", type:"PDF" },
      { title:"Zone C Stress Analysis Report",     zones:"Zone C",    date:"May 28, 2025", size:"1.1 MB", type:"PDF" },
      { title:"NDVI Time-Series Export",            zones:"All Zones", date:"May 20, 2025", size:"4.8 MB", type:"CSV" },
      { title:"Quarterly Overview Q1 2025",         zones:"All Zones", date:"Apr 1, 2025",  size:"3.2 MB", type:"PDF" },
    ];
   
    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1.1rem",color:"#1a4028"}}>Reports & Exports</div>
            <div style={{fontSize:"0.8rem",color:"#7a9882",marginTop:2}}>Download health summaries and raw data exports</div>
          </div>
          <button style={{padding:"10px 20px",borderRadius:100,background:"#1a4028",color:"white",border:"none",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"0.84rem",cursor:"pointer"}}>
            + Generate Report
          </button>
        </div>
   
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {reports.map(r => (
            <div key={r.title} style={{background:"white",border:"1px solid rgba(58,148,96,0.14)",borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:16,transition:"box-shadow .2s",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.07)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
            >
              <div style={{width:40,height:40,borderRadius:10,background:r.type==="PDF"?"#fef2f0":"#e8f5ec",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0,border:`1px solid ${r.type==="PDF"?"rgba(224,90,74,0.2)":"#d4edd9"}`}}>
                {r.type==="PDF"?"📄":"📊"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"0.88rem",color:"#1a4028"}}>{r.title}</div>
                <div style={{fontSize:"0.74rem",color:"#7a9882",marginTop:2}}>{r.zones} · {r.date} · {r.size}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <span style={{background:"#f0f5f1",border:"1px solid rgba(58,148,96,0.14)",borderRadius:6,padding:"3px 9px",fontSize:"0.7rem",fontWeight:700,color:"#7a9882"}}>{r.type}</span>
                <button style={{padding:"7px 14px",borderRadius:100,background:"#1a4028",color:"white",border:"none",fontSize:"0.77rem",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  export default Reports;