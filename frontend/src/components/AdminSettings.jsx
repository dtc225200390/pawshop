import { useState, useEffect } from "react";
import { settingsAPI } from "../api";

const DEFAULT = {
  shop_name: "HABANA SPORT",
  shop_slogan: "Thiết bị thể thao tại nhà",
  shop_email: "support@habana.vn",
  shop_phone: "1800 1234",
  shop_address: "TP. Hồ Chí Minh, Việt Nam",
  shop_facebook: "",
  shop_instagram: "",
  shop_youtube: "",
  free_ship_min: "500000",
  order_note: "",
  maintenance_mode: 0,
};

export default function AdminSettings({ showToast }) {
  const [settings, setSettings] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("general");

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsAPI.get();
      setSettings(s => ({ ...s, ...data }));
    } catch (e) {
      // If no settings API yet, use defaults silently
    }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      showToast("✅ Đã lưu cài đặt!", "success");
    } catch (e) {
      // Graceful fallback — save locally
      localStorage.setItem("habana_settings", JSON.stringify(settings));
      showToast("✅ Đã lưu cài đặt (local)!", "success");
    }
    setSaving(false);
  };

  const Field = ({ label, name, type="text", placeholder="" }) => (
    <div>
      <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>{label}</p>
      <input className="inp" type={type} placeholder={placeholder}
        value={settings[name] || ""}
        onChange={e => setSettings(s => ({ ...s, [name]: e.target.value }))}
      />
    </div>
  );

  const sections = [
    { id:"general",  icon:"🏪", label:"Thông Tin Shop" },
    { id:"contact",  icon:"📞", label:"Liên Hệ & MXH" },
    { id:"shipping", icon:"🚚", label:"Vận Chuyển" },
    { id:"advanced", icon:"⚙️", label:"Nâng Cao" },
  ];

  return (
    <div className="fu">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, textTransform:"uppercase" }}>CÀI ĐẶT</h1>
          <p style={{ fontSize:13, color:"var(--ink3)", marginTop:2 }}>Quản lý thông tin và cấu hình hệ thống</p>
        </div>
        <button className="btn bP sm" onClick={save} disabled={saving}>
          {saving ? "Đang lưu..." : "💾 Lưu Cài Đặt"}
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:20, alignItems:"start" }}>
        {/* Section nav */}
        <div className="card-p" style={{ padding:8 }}>
          {sections.map(s => (
            <div key={s.id} onClick={() => setSection(s.id)}
              className={`aI ${section===s.id?"on":""}`}>
              <span style={{ fontSize:18 }}>{s.icon}</span>
              <span style={{ fontSize:13 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="card-p" style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {loading
            ? [1,2,3,4].map(i=><div key={i} className="sk" style={{ height:52, borderRadius:8 }}/>)
            : <>
              {section === "general" && (
                <>
                  <h3 style={{ fontWeight:800, fontSize:15, paddingBottom:12, borderBottom:"1px solid var(--b)" }}>🏪 Thông Tin Shop</h3>
                  <Field label="Tên Shop" name="shop_name" placeholder="HABANA SPORT"/>
                  <Field label="Slogan" name="shop_slogan" placeholder="Thiết bị thể thao tại nhà"/>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Logo (URL)</p>
                    <input className="inp" placeholder="https://..." value={settings.shop_logo||""} onChange={e=>setSettings(s=>({...s,shop_logo:e.target.value}))}/>
                    {settings.shop_logo && (
                      <img src={settings.shop_logo} alt="Logo" style={{ marginTop:8, height:48, borderRadius:8, border:"1px solid var(--b)" }}/>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Mô Tả Shop</p>
                    <textarea className="inp" placeholder="Giới thiệu ngắn về shop..." value={settings.shop_desc||""} onChange={e=>setSettings(s=>({...s,shop_desc:e.target.value}))} style={{ minHeight:80, resize:"vertical" }}/>
                  </div>
                </>
              )}

              {section === "contact" && (
                <>
                  <h3 style={{ fontWeight:800, fontSize:15, paddingBottom:12, borderBottom:"1px solid var(--b)" }}>📞 Liên Hệ & Mạng Xã Hội</h3>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <Field label="Email" name="shop_email" type="email" placeholder="support@habana.vn"/>
                    <Field label="Điện Thoại" name="shop_phone" placeholder="1800 1234"/>
                  </div>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Địa Chỉ</p>
                    <textarea className="inp" value={settings.shop_address||""} onChange={e=>setSettings(s=>({...s,shop_address:e.target.value}))} style={{ minHeight:64, resize:"vertical" }}/>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <Field label="🔵 Facebook URL" name="shop_facebook" placeholder="https://facebook.com/..."/>
                    <Field label="📸 Instagram URL" name="shop_instagram" placeholder="https://instagram.com/..."/>
                    <Field label="▶️ YouTube URL" name="shop_youtube" placeholder="https://youtube.com/..."/>
                    <Field label="🐦 TikTok URL" name="shop_tiktok" placeholder="https://tiktok.com/..."/>
                  </div>
                </>
              )}

              {section === "shipping" && (
                <>
                  <h3 style={{ fontWeight:800, fontSize:15, paddingBottom:12, borderBottom:"1px solid var(--b)" }}>🚚 Cài Đặt Vận Chuyển</h3>
                  <Field label="Miễn Phí Ship Từ (₫)" name="free_ship_min" type="number" placeholder="500000"/>
                  <p style={{ fontSize:12, color:"var(--ink4)" }}>
                    Đơn hàng từ <strong>{Number(settings.free_ship_min||500000).toLocaleString("vi-VN")}₫</strong> trở lên sẽ được miễn phí vận chuyển.
                  </p>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Ghi Chú Đơn Hàng Mặc Định</p>
                    <textarea className="inp" placeholder="VD: Vui lòng giao giờ hành chính..." value={settings.order_note||""} onChange={e=>setSettings(s=>({...s,order_note:e.target.value}))} style={{ minHeight:64, resize:"vertical" }}/>
                  </div>
                </>
              )}

              {section === "advanced" && (
                <>
                  <h3 style={{ fontWeight:800, fontSize:15, paddingBottom:12, borderBottom:"1px solid var(--b)" }}>⚙️ Nâng Cao</h3>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"var(--s2)", borderRadius:10, border:"1px solid var(--b)" }}>
                    <div>
                      <p style={{ fontWeight:700, fontSize:14 }}>Chế Độ Bảo Trì</p>
                      <p style={{ fontSize:12, color:"var(--ink3)", marginTop:2 }}>Tạm thời ẩn website với khách hàng</p>
                    </div>
                    <div onClick={() => setSettings(s=>({...s, maintenance_mode:s.maintenance_mode?0:1}))}
                      style={{ width:48, height:26, borderRadius:13, background:settings.maintenance_mode?"var(--brand)":"var(--b)", cursor:"pointer", position:"relative", transition:"background .2s" }}>
                      <div style={{ width:20, height:20, background:"#fff", borderRadius:"50%", position:"absolute", top:3, left:settings.maintenance_mode?24:3, transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,.2)" }}/>
                    </div>
                  </div>
                  <div style={{ padding:"14px 16px", background:"#FFF7ED", borderRadius:10, border:"1px solid #FED7AA" }}>
                    <p style={{ fontWeight:700, fontSize:13, color:"#EA580C", marginBottom:6 }}>⚠️ Lưu ý</p>
                    <p style={{ fontSize:12, color:"#92400E" }}>Một số tính năng (API settings, bảo trì) cần backend hỗ trợ route <code style={{background:"rgba(0,0,0,.07)",padding:"1px 5px",borderRadius:3}}>/api/settings</code>. Xem README để cấu hình.</p>
                  </div>
                </>
              )}
            </>
          }
        </div>
      </div>
    </div>
  );
}
