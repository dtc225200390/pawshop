import { useState, useEffect } from "react";
import { voucherAPI } from "../api";

const fmt = (n) => Number(n).toLocaleString("vi-VN") + "₫";

function genCode() {
  return "HABANA" + Math.random().toString(36).slice(2,7).toUpperCase();
}

const emptyV = { code:"", type:"percent", value:"", min_order:"", max_uses:"", expires_at:"", is_active:1 };

export default function AdminVouchers({ showToast }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyV);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await voucherAPI.getAll();
      setVouchers(Array.isArray(data) ? data : []);
    } catch (e) { showToast("Lỗi: " + e.message, "error"); }
    setLoading(false);
  };

  const openEdit = (v) => {
    setEditId(v.id);
    setForm({ ...v, expires_at: v.expires_at ? v.expires_at.slice(0,10) : "" });
    setShowForm(true);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyV, code: genCode() });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.code || !form.value) { showToast("Vui lòng điền mã và giá trị!", "error"); return; }
    setSaving(true);
    try {
      const payload = { ...form, value:+form.value, min_order:+form.min_order||0, max_uses:+form.max_uses||null };
      let saved;
      if (editId) {
        saved = await voucherAPI.update(editId, payload);
        setVouchers(vs => vs.map(x => x.id === editId ? saved : x));
        showToast("✅ Đã cập nhật voucher!", "success");
      } else {
        saved = await voucherAPI.create(payload);
        setVouchers(vs => [saved, ...vs]);
        showToast("✅ Đã tạo voucher!", "success");
      }
      setShowForm(false); setForm(emptyV); setEditId(null);
    } catch (e) { showToast("❌ " + e.message, "error"); }
    setSaving(false);
  };

  const toggle = async (v) => {
    try {
      const saved = await voucherAPI.update(v.id, { ...v, is_active: v.is_active ? 0 : 1 });
      setVouchers(vs => vs.map(x => x.id === v.id ? saved : x));
    } catch (e) { showToast("❌ " + e.message, "error"); }
  };

  const remove = async (v) => {
    if (!confirm(`Xóa voucher "${v.code}"?`)) return;
    try {
      await voucherAPI.delete(v.id);
      setVouchers(vs => vs.filter(x => x.id !== v.id));
      showToast("✅ Đã xóa!", "success");
    } catch (e) { showToast("❌ " + e.message, "error"); }
  };

  const now = new Date();
  const filtVouchers = vouchers.filter(v => !search || v.code.toLowerCase().includes(search.toLowerCase()));
  const active = vouchers.filter(v => v.is_active && (!v.expires_at || new Date(v.expires_at) > now));
  const expired = vouchers.filter(v => v.expires_at && new Date(v.expires_at) <= now);

  return (
    <div className="fu">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, textTransform:"uppercase" }}>MÃ GIẢM GIÁ</h1>
          <p style={{ fontSize:13, color:"var(--ink3)", marginTop:2 }}>{active.length} đang hoạt động · {expired.length} đã hết hạn</p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"var(--ink4)" }}>🔍</span>
            <input className="inp" style={{ paddingLeft:32, width:200, fontSize:13 }}
              placeholder="Tìm mã voucher..."
              value={search} onChange={e=>setSearch(e.target.value)}/>
            {search&&<button onClick={()=>setSearch("")} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:13, color:"var(--ink4)" }}>✕</button>}
          </div>
          <button className="btn bP sm" onClick={openAdd}>+ Tạo Voucher</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12, marginBottom:24 }}>
        {[
          ["🎟️", vouchers.length, "Tổng voucher", "var(--brand)", "#FEF0EC"],
          ["✅", active.length, "Đang hoạt động", "#16A34A", "#F0FDF4"],
          ["⏰", expired.length, "Hết hạn", "#EA580C", "#FFF7ED"],
          ["📊", vouchers.reduce((s,v)=>s+(v.used_count||0),0), "Lượt sử dụng", "#7C3AED", "#F5F3FF"],
        ].map(([icon, val, label, color, bg]) => (
          <div key={label} className="card-p" style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, background:bg, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
            <div>
              <p style={{ fontSize:22, fontWeight:900, color, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>{val}</p>
              <p style={{ fontSize:11, color:"var(--ink4)", marginTop:2 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card-form fu" style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h3 style={{ fontWeight:800, fontSize:15 }}>{editId ? "✏️ Sửa Voucher" : "➕ Tạo Voucher Mới"}</h3>
            <button onClick={()=>setShowForm(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"var(--ink4)" }}>✕</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--ink3)", marginBottom:5, textTransform:"uppercase" }}>Mã Voucher *</p>
              <div style={{ display:"flex", gap:6 }}>
                <input className="inp" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} style={{ fontFamily:"monospace", fontWeight:700, letterSpacing:1 }}/>
                <button className="btn bS sm" style={{ flexShrink:0 }} onClick={()=>setForm(f=>({...f,code:genCode()}))}>↻</button>
              </div>
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--ink3)", marginBottom:5, textTransform:"uppercase" }}>Loại</p>
              <select className="inp" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (₫)</option>
              </select>
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--ink3)", marginBottom:5, textTransform:"uppercase" }}>
                Giá Trị * {form.type==="percent"?"(%)":"(₫)"}
              </p>
              <input className="inp" type="number" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))}
                placeholder={form.type==="percent"?"VD: 20":"VD: 50000"}
                max={form.type==="percent"?100:undefined}/>
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--ink3)", marginBottom:5, textTransform:"uppercase" }}>Đơn Tối Thiểu</p>
              <input className="inp" type="number" value={form.min_order||""} onChange={e=>setForm(f=>({...f,min_order:e.target.value}))} placeholder="0 = không giới hạn"/>
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--ink3)", marginBottom:5, textTransform:"uppercase" }}>Số Lần Dùng Tối Đa</p>
              <input className="inp" type="number" value={form.max_uses||""} onChange={e=>setForm(f=>({...f,max_uses:e.target.value}))} placeholder="Để trống = không giới hạn"/>
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--ink3)", marginBottom:5, textTransform:"uppercase" }}>Hết Hạn</p>
              <input className="inp" type="date" value={form.expires_at||""} onChange={e=>setForm(f=>({...f,expires_at:e.target.value}))}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <button className="btn bP sm" onClick={save} disabled={saving}>{saving?"Đang lưu...":editId?"Lưu Thay Đổi":"Tạo Voucher"}</button>
            <button className="btn bS sm" onClick={()=>{setShowForm(false);setForm(emptyV);setEditId(null);}}>Hủy</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading
        ? <div className="sk" style={{ height:300, borderRadius:12 }}/>
        : <div className="card-x">
            <table className="tbl">
              <thead>
                <tr>{["Mã Voucher","Loại","Giá Trị","Đ.Tối Thiểu","Sử Dụng","Hết Hạn","Trạng Thái","Thao Tác"].map(h=><th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {vouchers.length === 0
                  ? <tr><td colSpan={8} style={{ textAlign:"center", padding:40, color:"var(--ink4)" }}>{search ? "Không tìm thấy voucher phù hợp" : "Chưa có voucher nào."} {!search&&<span style={{color:"var(--brand)",cursor:"pointer",fontWeight:700}} onClick={openAdd}>Tạo ngay!</span>}</td></tr>
                  : filtVouchers.map(v => {
                      const isExp = v.expires_at && new Date(v.expires_at) <= now;
                      const usedPct = v.max_uses ? Math.round((v.used_count||0)/v.max_uses*100) : null;
                      return (
                        <tr key={v.id}>
                          <td>
                            <code style={{ background:"var(--s3)", padding:"3px 10px", borderRadius:6, fontWeight:800, fontSize:13, letterSpacing:1, color:"var(--brand)" }}>{v.code}</code>
                          </td>
                          <td style={{ fontSize:12 }}>{v.type==="percent"?"%":"₫"} Giảm</td>
                          <td style={{ fontWeight:800, color:"var(--brand)" }}>
                            {v.type==="percent" ? `${v.value}%` : fmt(v.value)}
                          </td>
                          <td style={{ fontSize:12, color:"var(--ink3)" }}>
                            {v.min_order > 0 ? fmt(v.min_order) : "—"}
                          </td>
                          <td>
                            <div style={{ minWidth:80 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                                <span style={{ color:"var(--ink3)" }}>{v.used_count||0}{v.max_uses?`/${v.max_uses}`:""}</span>
                                {usedPct!==null && <span style={{ color:usedPct>80?"#DC2626":"var(--ink4)" }}>{usedPct}%</span>}
                              </div>
                              {v.max_uses && (
                                <div style={{ height:4, background:"var(--s3)", borderRadius:2 }}>
                                  <div style={{ height:"100%", width:usedPct+"%", background:usedPct>80?"#DC2626":"var(--brand)", borderRadius:2 }}/>
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ fontSize:12, color:isExp?"#DC2626":"var(--ink3)" }}>
                            {v.expires_at ? new Date(v.expires_at).toLocaleDateString("vi-VN") : "—"}
                            {isExp && <span style={{ display:"block", fontSize:10, fontWeight:700 }}>Đã hết hạn</span>}
                          </td>
                          <td>
                            <span className="st" style={{
                              background: isExp?"#FEF2F2":v.is_active?"#F0FDF4":"#F9FAFB",
                              color: isExp?"#DC2626":v.is_active?"#16A34A":"#6B7280"
                            }}>{isExp?"Hết hạn":v.is_active?"Hoạt động":"Tắt"}</span>
                          </td>
                          <td>
                            <div style={{ display:"flex", gap:6 }}>
                              <button className="btn bS xs" onClick={()=>openEdit(v)}>✏️</button>
                              <button className="btn bS xs" onClick={()=>toggle(v)} style={{ color:v.is_active?"#EA580C":"#16A34A" }}>{v.is_active?"Tắt":"Bật"}</button>
                              <button className="bD xs" onClick={()=>remove(v)}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>
      }
    </div>
  );
}
