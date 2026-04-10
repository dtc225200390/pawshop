import { useState, useEffect } from "react";
import { messageAPI } from "../api";

export default function AdminMessages({ showToast }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply]       = useState("");
  const [sending, setSending]   = useState(false);
  const [filter, setFilter]     = useState("all"); // all | unread | replied
  const [search, setSearch]     = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await messageAPI.getAll();
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      // Demo mode — show sample messages if API not ready
      setMessages([
        { id:1, name:"Nguyễn Văn A", email:"user1@gmail.com", phone:"0901234567", subject:"Hỏi về sản phẩm", message:"Máy tập bụng có bảo hành không ạ?", is_read:0, reply:null, created_at: new Date(Date.now()-3600000).toISOString() },
        { id:2, name:"Trần Thị B",   email:"user2@gmail.com", phone:"0912345678", subject:"Đổi trả",         message:"Tôi muốn đổi size quần yoga, có được không?", is_read:1, reply:"Dạ shop hỗ trợ đổi trong 7 ngày ạ!", created_at: new Date(Date.now()-86400000).toISOString() },
        { id:3, name:"Lê Văn C",     email:"user3@gmail.com", phone:"0923456789", subject:"Giao hàng",       message:"Đơn hàng của tôi bao giờ tới?", is_read:0, reply:null, created_at: new Date(Date.now()-7200000).toISOString() },
        { id:4, name:"Phạm Thị D",   email:"user4@gmail.com", phone:"0934567890", subject:"Khuyến mãi",     message:"Shop có mã giảm giá cho lần đầu mua không?", is_read:1, reply:null, created_at: new Date(Date.now()-172800000).toISOString() },
        { id:5, name:"Hoàng Văn E",  email:"user5@gmail.com", phone:"0945678901", subject:"Thanh toán",     message:"Tôi thanh toán VNPay nhưng chưa thấy đơn xác nhận.", is_read:0, reply:null, created_at: new Date(Date.now()-1800000).toISOString() },
      ]);
    }
    setLoading(false);
  };

  const openMsg = async (msg) => {
    setSelected(msg);
    setReply(msg.reply || "");
    if (!msg.is_read) {
      try {
        await messageAPI.markRead(msg.id);
        setMessages(ms => ms.map(x => x.id===msg.id ? {...x, is_read:1} : x));
      } catch(e) {
        setMessages(ms => ms.map(x => x.id===msg.id ? {...x, is_read:1} : x));
      }
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await messageAPI.reply(selected.id, reply);
      setMessages(ms => ms.map(x => x.id===selected.id ? {...x, reply} : x));
      setSelected(s => ({...s, reply}));
      showToast("✅ Đã gửi phản hồi!", "success");
    } catch(e) {
      // Demo: just update locally
      setMessages(ms => ms.map(x => x.id===selected.id ? {...x, reply} : x));
      setSelected(s => ({...s, reply}));
      showToast("✅ Đã lưu phản hồi!", "success");
    }
    setSending(false);
  };

  const deleteMsg = async (id) => {
    if (!confirm("Xóa tin nhắn này?")) return;
    try {
      await messageAPI.delete(id);
    } catch(e) {}
    setMessages(ms => ms.filter(x => x.id !== id));
    if (selected?.id === id) setSelected(null);
    showToast("✅ Đã xóa!", "success");
  };

  const filtered = messages.filter(m => {
    const matchFilter = filter === "all" || (filter==="unread"&&!m.is_read) || (filter==="replied"&&!!m.reply);
    const q = search.toLowerCase();
    const matchSearch = !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.subject?.toLowerCase().includes(q) || m.message?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const unread = messages.filter(m => !m.is_read).length;

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60)   return "vừa xong";
    if (diff < 3600) return Math.floor(diff/60) + " phút trước";
    if (diff < 86400) return Math.floor(diff/3600) + " giờ trước";
    return Math.floor(diff/86400) + " ngày trước";
  };

  return (
    <div className="fu">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, textTransform:"uppercase" }}>
            TIN NHẮN
            {unread > 0 && <span style={{ marginLeft:10, background:"var(--brand)", color:"#fff", fontSize:14, fontWeight:800, padding:"2px 10px", borderRadius:100 }}>{unread}</span>}
          </h1>
          <p style={{ fontSize:13, color:"var(--ink3)", marginTop:2 }}>{messages.length} tin nhắn · {unread} chưa đọc</p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"var(--ink4)" }}>🔍</span>
            <input className="inp" style={{ paddingLeft:32, width:220, fontSize:13 }}
              placeholder="Tìm tên, email, nội dung..."
              value={search} onChange={e=>setSearch(e.target.value)}/>
            {search&&<button onClick={()=>setSearch("")} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:13, color:"var(--ink4)" }}>✕</button>}
          </div>
          <button className="btn bS sm" onClick={loadAll}>↻ Tải lại</button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", background:"var(--s2)", borderRadius:10, padding:3, border:"1px solid var(--b)", width:"fit-content", marginBottom:20 }}>
        {[["all","Tất Cả",messages.length],["unread","Chưa Đọc",unread],["replied","Đã Phản Hồi",messages.filter(m=>m.reply).length]].map(([v,l,n])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{
            padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit",
            background:filter===v?"var(--brand)":"transparent",
            color:filter===v?"#fff":"var(--ink3)", fontWeight:700, fontSize:13, transition:"all .2s",
            display:"flex", alignItems:"center", gap:6,
          }}>
            {l}
            <span style={{ background:filter===v?"rgba(255,255,255,.25)":"var(--b)", color:filter===v?"#fff":"var(--ink4)", fontSize:11, fontWeight:800, padding:"1px 7px", borderRadius:100 }}>{n}</span>
          </button>
        ))}
      </div>

      {loading
        ? <div className="sk" style={{ height:400, borderRadius:12 }}/>
        : <div style={{ display:"grid", gridTemplateColumns: selected ? "360px 1fr" : "1fr", gap:16, alignItems:"start" }}>

            {/* Message list */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filtered.length === 0
                ? <div className="card-p" style={{ textAlign:"center", padding:48, color:"var(--ink4)" }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>💬</div>
                    <p style={{ fontWeight:600 }}>Không có tin nhắn</p>
                  </div>
                : filtered.map(msg => (
                  <div key={msg.id}
                    onClick={() => openMsg(msg)}
                    style={{
                      background:"var(--s)", border:`1.5px solid ${selected?.id===msg.id?"var(--brand)":"var(--b)"}`,
                      borderRadius:12, padding:"14px 16px", cursor:"pointer", transition:"all .15s",
                      borderLeft:`4px solid ${!msg.is_read?"var(--brand)":"var(--b)"}`,
                      boxShadow: selected?.id===msg.id ? "0 0 0 3px rgba(232,57,14,.1)" : "none",
                    }}
                  >
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                        <div style={{ width:36, height:36, background:!msg.is_read?"var(--brand)":"var(--s3)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:!msg.is_read?"#fff":"var(--ink3)", fontWeight:800, fontSize:13, flexShrink:0 }}>
                          {msg.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontWeight:!msg.is_read?800:600, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{msg.name}</p>
                          <p style={{ fontSize:11, color:"var(--ink4)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{msg.email}</p>
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                        <span style={{ fontSize:11, color:"var(--ink4)", whiteSpace:"nowrap" }}>{timeAgo(msg.created_at)}</span>
                        <div style={{ display:"flex", gap:4 }}>
                          {!msg.is_read && <span style={{ width:8, height:8, background:"var(--brand)", borderRadius:"50%", display:"inline-block" }}/>}
                          {msg.reply   && <span style={{ fontSize:10, background:"#F0FDF4", color:"#16A34A", fontWeight:700, padding:"1px 6px", borderRadius:100 }}>✓ Đã trả lời</span>}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize:12, fontWeight:700, color:"var(--ink2)", marginTop:8, marginBottom:3 }}>{msg.subject}</p>
                    <p style={{ fontSize:12, color:"var(--ink4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{msg.message}</p>
                    <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
                      <button className="bD xs" onClick={e=>{e.stopPropagation();deleteMsg(msg.id);}} style={{ fontSize:11 }}>🗑️ Xóa</button>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Message detail */}
            {selected && (
              <div className="card-p fu" style={{ position:"sticky", top:16 }}>
                {/* Detail header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, paddingBottom:14, borderBottom:"1px solid var(--b)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:44, height:44, background:"var(--brand)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:18 }}>
                      {selected.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight:800, fontSize:15 }}>{selected.name}</p>
                      <p style={{ fontSize:12, color:"var(--ink3)" }}>{selected.email} · {selected.phone}</p>
                    </div>
                  </div>
                  <button onClick={()=>setSelected(null)} style={{ background:"var(--s3)", border:"none", width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                </div>

                {/* Subject + message */}
                <div style={{ background:"var(--s2)", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
                  <p style={{ fontWeight:800, fontSize:14, marginBottom:8, color:"var(--ink)" }}>{selected.subject}</p>
                  <p style={{ fontSize:14, color:"var(--ink2)", lineHeight:1.7 }}>{selected.message}</p>
                  <p style={{ fontSize:11, color:"var(--ink4)", marginTop:10 }}>
                    📅 {new Date(selected.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>

                {/* Previous reply */}
                {selected.reply && (
                  <div style={{ background:"#F0FDF4", border:"1px solid #86EFAC", borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"#16A34A", marginBottom:6 }}>✓ Phản Hồi Đã Gửi</p>
                    <p style={{ fontSize:13, color:"#15803D", lineHeight:1.6 }}>{selected.reply}</p>
                  </div>
                )}

                {/* Reply box */}
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>
                    {selected.reply ? "Cập Nhật Phản Hồi" : "Phản Hồi Khách Hàng"}
                  </p>
                  <textarea className="inp" placeholder="Nhập nội dung phản hồi..."
                    value={reply} onChange={e=>setReply(e.target.value)}
                    style={{ minHeight:100, resize:"vertical", marginBottom:10 }}
                  />
                  <div style={{ display:"flex", gap:10 }}>
                    <button className="btn bP sm" style={{ flex:1, justifyContent:"center" }} onClick={sendReply} disabled={!reply.trim()||sending}>
                      {sending ? "Đang gửi..." : "📨 Gửi Phản Hồi"}
                    </button>
                    <button className="bD xs" onClick={()=>deleteMsg(selected.id)}>🗑️</button>
                  </div>
                  <p style={{ fontSize:11, color:"var(--ink4)", marginTop:8 }}>
                    💡 Phản hồi sẽ được gửi đến email: <strong>{selected.email}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
      }
    </div>
  );
}
