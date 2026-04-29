import { useState as useStateP } from "react";
import { useNavigate as useNavP } from "react-router-dom";
 
export function Profile() {
  const navigate = useNavP();
  const [name, setName]   = useStateP(localStorage.getItem("userName") || "");
  const [email, setEmail] = useStateP(localStorage.getItem("userEmail") || "");
  const [saved, setSaved] = useStateP(false);
 
  function handleSave(e) {
    e.preventDefault();
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }
 
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/login");
  }
 
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";
 
  const inputStyle = {
    width:"100%", padding:"10px 14px", borderRadius:10, fontFamily:"'DM Sans',sans-serif",
    border:"1px solid rgba(58,148,96,0.18)", fontSize:"0.88rem", color:"#1a2e20",
    background:"white", outline:"none", transition:"border-color .2s",
  };
  const labelStyle = { fontSize:"0.78rem", fontWeight:600, color:"#3d5c47", marginBottom:6, display:"block" };
 
  return (
    <div style={{maxWidth:560}}>
      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1.1rem",color:"#1a4028",marginBottom:22}}>Account Profile</div>
 
      {/* Avatar block */}
      <div style={{background:"white",border:"1px solid rgba(58,148,96,0.14)",borderRadius:18,padding:"24px 26px",marginBottom:16,display:"flex",alignItems:"center",gap:18}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#c8773a,#e8956a)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1.3rem",color:"white",flexShrink:0}}>
          {initials}
        </div>
        <div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"1rem",color:"#1a4028"}}>{name || "Your Name"}</div>
          <div style={{fontSize:"0.8rem",color:"#7a9882",marginTop:2}}>{email || "your@email.com"}</div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:6,background:"#e8f5ec",borderRadius:100,padding:"2px 10px",width:"fit-content",border:"1px solid #d4edd9"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"#5bb87e"}} />
            <span style={{fontSize:"0.68rem",fontWeight:700,color:"#5bb87e"}}>Active Plan</span>
          </div>
        </div>
      </div>
 
      {/* Form */}
      <form onSubmit={handleSave} style={{background:"white",border:"1px solid rgba(58,148,96,0.14)",borderRadius:18,padding:"24px 26px",display:"flex",flexDirection:"column",gap:16}}>
        <div>
          <label style={labelStyle}>Full Name</label>
          <input style={inputStyle} value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"
            onFocus={e=>e.target.style.borderColor="#3a9460"} onBlur={e=>e.target.style.borderColor="rgba(58,148,96,0.18)"} />
        </div>
        <div>
          <label style={labelStyle}>Email Address</label>
          <input style={inputStyle} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"
            onFocus={e=>e.target.style.borderColor="#3a9460"} onBlur={e=>e.target.style.borderColor="rgba(58,148,96,0.18)"} />
        </div>
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <button type="submit" style={{padding:"10px 24px",borderRadius:100,background:"#1a4028",color:"white",border:"none",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"0.86rem",cursor:"pointer",transition:"background .2s"}}>
            {saved ? "✓ Saved!" : "Save Changes"}
          </button>
          <button type="button" onClick={handleLogout}
            style={{padding:"10px 20px",borderRadius:100,background:"#fef2f0",color:"#e05a4a",border:"1px solid rgba(224,90,74,0.22)",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"0.86rem",cursor:"pointer"}}>
            Sign Out
          </button>
        </div>
      </form>
    </div>
  );
}
export default Profile;