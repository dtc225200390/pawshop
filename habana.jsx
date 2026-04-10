import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id: 1, name: "Máy Tập Bụng 4 Bánh PRO", price: 599000, originalPrice: 1300000, category: "Thiết Bị", image: "🏋️", desc: "Máy tập bụng 4 bánh chuyên nghiệp, kèm đệm xốp và dây kháng lực 6 ống.", badge: "54% OFF", stock: 24, sold: 128 },
  { id: 2, name: "Bàn Xoay Eo Cánh Bướm", price: 699000, originalPrice: 2000000, category: "Thiết Bị", image: "🔄", desc: "Bàn xoay eo cánh bướm kèm bộ phụ kiện chuyên dụng và đai chống gù.", badge: "65% OFF", stock: 15, sold: 89 },
  { id: 3, name: "Ghế Chỉnh Dáng EGO", price: 499000, originalPrice: 890000, category: "Phụ Kiện", image: "🪑", desc: "Ghế chỉnh dáng thông minh, ngồi lâu không đau mỏi lưng.", badge: "44% OFF", stock: 31, sold: 204 },
  { id: 4, name: "Con Lăn Tập Bụng 2 Bánh", price: 250000, originalPrice: null, category: "Thiết Bị", image: "⚙️", desc: "Con lăn tập bụng 2 bánh chắc chắn, phù hợp mọi lứa tuổi.", badge: "HOT", stock: 50, sold: 311 },
  { id: 5, name: "Máy Massage 6 Bi Turbo", price: 529000, originalPrice: null, category: "Phụ Kiện", image: "💆", desc: "Máy massage 6 bi turbo giảm đau nhức cơ bắp hiệu quả.", badge: "NEW", stock: 18, sold: 42 },
  { id: 6, name: "Con Lăn Tập Bụng 3 Bánh", price: 529000, originalPrice: null, category: "Thiết Bị", image: "🎯", desc: "Con lăn 3 bánh ổn định hơn, dành cho người tập trung cấp.", badge: "BÁN CHẠY", stock: 27, sold: 176 },
];

const MOCK_USERS = [
  { id: 1, name: "Admin", email: "admin@habana.vn", password: "admin123", role: "admin", avatar: "👑", joined: "2024-01-01" },
  { id: 2, name: "Nguyễn Văn A", email: "user@habana.vn", password: "user123", role: "user", avatar: "👤", joined: "2025-03-15" },
];

const MOCK_ORDERS = [
  { id: "HS001", user: "Nguyễn Văn A", total: 1298000, status: "Đã giao", date: "2025-02-28", items: 2 },
  { id: "HS002", user: "Trần Thị B", total: 699000, status: "Đang giao", date: "2025-03-01", items: 1 },
  { id: "HS003", user: "Lê Văn C", total: 1778000, status: "Chờ xác nhận", date: "2025-03-03", items: 3 },
  { id: "HS004", user: "Phạm Thị D", total: 499000, status: "Đã hủy", date: "2025-03-02", items: 1 },
];

const fmt = (n) => n.toLocaleString("vi-VN") + "₫";

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────
const KB = `Bạn là trợ lý AI của HABANA SPORT - cửa hàng thiết bị thể thao tại nhà.
Sản phẩm: ${PRODUCTS.map(p => `${p.name} giá ${fmt(p.price)}`).join(", ")}.
Tư vấn ngắn gọn, nhiệt tình bằng tiếng Việt. Gợi ý sản phẩm phù hợp nhu cầu khách.`;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#09090f}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#111}::-webkit-scrollbar-thumb{background:#ff4d00;border-radius:2px}
.title{font-family:'Bebas Neue',sans-serif;letter-spacing:2px}
.btn{border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;transition:all .2s;border-radius:8px}
.btn-orange{background:#ff4d00;color:#fff;padding:11px 22px;font-size:14px}
.btn-orange:hover{background:#ff6520;transform:translateY(-1px);box-shadow:0 4px 16px rgba(255,77,0,.35)}
.btn-outline{background:transparent;color:#f0f0f0;border:1px solid #2a2a3e;padding:10px 18px;font-size:14px}
.btn-outline:hover{border-color:#ff4d00;color:#ff4d00}
.btn-sm{padding:7px 14px;font-size:13px}
.btn-danger{background:#c0392b;color:#fff;padding:7px 14px;font-size:13px;border-radius:6px}
.card{background:#12121a;border:1px solid #1e1e2e;border-radius:12px}
.card-hover{transition:all .3s}
.card-hover:hover{border-color:#ff4d00;transform:translateY(-4px);box-shadow:0 8px 32px rgba(255,77,0,.12)}
.inp{background:#1a1a26;border:1px solid #2a2a3e;color:#f0f0f0;padding:10px 14px;border-radius:8px;font-size:14px;outline:none;width:100%;font-family:'DM Sans',sans-serif}
.inp:focus{border-color:#ff4d00}
.inp::placeholder{color:#444}
.badge{background:#ff4d00;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;display:inline-block}
.tag{background:#1e1e2e;border:1px solid #2a2a3e;color:#888;padding:6px 16px;border-radius:20px;font-size:13px;cursor:pointer;transition:all .2s}
.tag.on,.tag:hover{background:#ff4d00;border-color:#ff4d00;color:#fff}
.slide{animation:slide .3s ease}
@keyframes slide{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.pulse{animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.chat-u{background:#ff4d00;color:#fff;padding:9px 14px;border-radius:14px 14px 4px 14px;max-width:78%;font-size:13px;line-height:1.55}
.chat-a{background:#1e1e2e;color:#e8e8f0;padding:9px 14px;border-radius:14px 14px 14px 4px;max-width:78%;font-size:13px;line-height:1.55}
.nav-a{cursor:pointer;color:#aaa;font-size:14px;font-weight:500;padding:7px 12px;border-radius:6px;transition:color .2s}
.nav-a:hover,.nav-a.on{color:#ff4d00}
.social-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:11px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;border:1px solid #2a2a3e;background:#1a1a26;color:#f0f0f0;font-family:'DM Sans',sans-serif}
.social-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.4)}
.stat-card{background:#12121a;border:1px solid #1e1e2e;border-radius:12px;padding:20px}
.status-badge{padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}
.admin-nav{cursor:pointer;padding:10px 14px;border-radius:8px;font-size:14px;color:#888;transition:all .2s;display:flex;align-items:center;gap:8px}
.admin-nav:hover,.admin-nav.on{background:#1e1e2e;color:#ff4d00}
`;

// ─── STATUS COLOR ─────────────────────────────────────────────────────────────
const statusColor = (s) => ({
  "Đã giao": { bg: "rgba(76,175,80,.15)", color: "#4caf50" },
  "Đang giao": { bg: "rgba(255,152,0,.15)", color: "#ff9800" },
  "Chờ xác nhận": { bg: "rgba(33,150,243,.15)", color: "#2196f3" },
  "Đã hủy": { bg: "rgba(244,67,54,.15)", color: "#f44336" },
}[s] || { bg: "#1e1e2e", color: "#aaa" });

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="slide" style={{ position: "fixed", top: 70, right: 20, background: "#1e1e2e", border: "1px solid #ff4d00", borderRadius: 10, padding: "12px 20px", zIndex: 9999, fontSize: 14, color: "#f0f0f0", maxWidth: 300 }}>
      {msg}
    </div>
  );
}

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onLogin, showToast }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");

  const handleLogin = () => {
    const u = MOCK_USERS.find(u => u.email === form.email && u.password === form.password);
    if (!u) { setErr("Email hoặc mật khẩu không đúng!"); return; }
    onLogin(u);
    onClose();
    showToast(`✅ Chào mừng ${u.name}!`);
  };

  const handleRegister = () => {
    if (!form.name || !form.email || !form.password) { setErr("Vui lòng điền đầy đủ!"); return; }
    if (form.password.length < 6) { setErr("Mật khẩu ít nhất 6 ký tự!"); return; }
    const newUser = { id: Date.now(), name: form.name, email: form.email, password: form.password, role: "user", avatar: "👤", joined: new Date().toISOString().split("T")[0] };
    onLogin(newUser);
    onClose();
    showToast(`🎉 Đăng ký thành công! Chào ${form.name}!`);
  };

  const handleSocial = (provider) => {
    const mockUser = { id: Date.now(), name: `User (${provider})`, email: `user@${provider.toLowerCase()}.com`, role: "user", avatar: provider === "Google" ? "🔵" : provider === "Facebook" ? "🔷" : "⬛", joined: new Date().toISOString().split("T")[0] };
    onLogin(mockUser);
    onClose();
    showToast(`✅ Đăng nhập qua ${provider} thành công!`);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div className="card slide" style={{ width: "100%", maxWidth: 420, padding: 32, position: "relative" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20 }}>✕</button>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ fontSize: 32 }}>💪</span>
          <h2 className="title" style={{ fontSize: 24, color: "#ff4d00", marginTop: 4 }}>HABANA SPORT</h2>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#1a1a26", borderRadius: 8, padding: 4, marginBottom: 24 }}>
          {["login", "register"].map(t => (
            <button key={t} onClick={() => { setTab(t); setErr(""); }} className="btn" style={{ flex: 1, padding: "8px", fontSize: 14, borderRadius: 6, background: tab === t ? "#ff4d00" : "transparent", color: tab === t ? "#fff" : "#888" }}>
              {t === "login" ? "Đăng Nhập" : "Đăng Ký"}
            </button>
          ))}
        </div>

        {/* Social Login */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {[
            { name: "Google", icon: "🔵", color: "#4285f4" },
            { name: "Facebook", icon: "🔷", color: "#1877f2" },
            { name: "GitHub", icon: "⬛", color: "#333" },
          ].map(s => (
            <button key={s.name} className="social-btn" onClick={() => handleSocial(s.name)} style={{ borderColor: s.color + "44" }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <span>{tab === "login" ? "Đăng nhập" : "Đăng ký"} với {s.name}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#2a2a3e" }} />
          <span style={{ color: "#555", fontSize: 12 }}>hoặc dùng email</span>
          <div style={{ flex: 1, height: 1, background: "#2a2a3e" }} />
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tab === "register" && (
            <input className="inp" placeholder="Họ và tên" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          )}
          <input className="inp" type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <input className="inp" type="password" placeholder="Mật khẩu" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && (tab === "login" ? handleLogin() : handleRegister())} />
          {err && <p style={{ color: "#f44336", fontSize: 13 }}>{err}</p>}
          <button className="btn btn-orange" style={{ marginTop: 4 }} onClick={tab === "login" ? handleLogin : handleRegister}>
            {tab === "login" ? "Đăng Nhập →" : "Tạo Tài Khoản →"}
          </button>
        </div>

        {tab === "login" && (
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#555" }}>
            Demo: <span style={{ color: "#ff4d00" }}>admin@habana.vn / admin123</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("overview");
  const [products, setProducts] = useState(PRODUCTS);
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [editProd, setEditProd] = useState(null);
  const [newProd, setNewProd] = useState({ name: "", price: "", category: "Thiết Bị", stock: "", image: "🏋️", desc: "", badge: "NEW" });
  const [showAddProd, setShowAddProd] = useState(false);

  const revenue = orders.filter(o => o.status === "Đã giao").reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const totalUsers = MOCK_USERS.length;
  const totalProducts = products.length;

  const navItems = [
    { id: "overview", icon: "📊", label: "Tổng Quan" },
    { id: "products", icon: "📦", label: "Sản Phẩm" },
    { id: "orders", icon: "🛒", label: "Đơn Hàng" },
    { id: "users", icon: "👥", label: "Người Dùng" },
  ];

  const deleteProd = (id) => setProducts(p => p.filter(x => x.id !== id));
  const addProd = () => {
    if (!newProd.name || !newProd.price) return;
    setProducts(p => [...p, { ...newProd, id: Date.now(), price: +newProd.price, stock: +newProd.stock || 0, sold: 0, originalPrice: null }]);
    setNewProd({ name: "", price: "", category: "Thiết Bị", stock: "", image: "🏋️", desc: "", badge: "NEW" });
    setShowAddProd(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#09090f", fontFamily: "'DM Sans', sans-serif", color: "#f0f0f0" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#0d0d14", borderRight: "1px solid #1e1e2e", display: "flex", flexDirection: "column", padding: "20px 12px", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", marginBottom: 28 }}>
          <span style={{ fontSize: 22 }}>💪</span>
          <span className="title" style={{ fontSize: 18, color: "#ff4d00" }}>HABANA ADMIN</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {navItems.map(n => (
            <div key={n.id} className={`admin-nav ${tab === n.id ? "on" : ""}`} onClick={() => setTab(n.id)}>
              <span>{n.icon}</span><span>{n.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid #1e1e2e", paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "0 4px" }}>
            <span style={{ fontSize: 24 }}>{user.avatar}</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</p>
              <p style={{ fontSize: 11, color: "#ff4d00" }}>Administrator</p>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" style={{ width: "100%" }} onClick={onLogout}>Đăng Xuất</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginLeft: 220, flex: 1, padding: "28px 28px" }}>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="slide">
            <h1 className="title" style={{ fontSize: 28, marginBottom: 24 }}>TỔNG QUAN</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Doanh Thu", val: fmt(revenue), icon: "💰", color: "#4caf50" },
                { label: "Đơn Hàng", val: totalOrders, icon: "🛒", color: "#2196f3" },
                { label: "Sản Phẩm", val: totalProducts, icon: "📦", color: "#ff9800" },
                { label: "Người Dùng", val: totalUsers, icon: "👥", color: "#9c27b0" },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>{s.label}</p>
                      <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</p>
                    </div>
                    <span style={{ fontSize: 28 }}>{s.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Đơn Hàng Gần Đây</h2>
            <div className="card" style={{ overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
                    {["Mã Đơn", "Khách Hàng", "Tổng Tiền", "Trạng Thái", "Ngày"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#666", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => {
                    const sc = statusColor(o.status);
                    return (
                      <tr key={o.id} style={{ borderBottom: "1px solid #1a1a24" }}>
                        <td style={{ padding: "12px 16px", color: "#ff4d00", fontWeight: 600 }}>#{o.id}</td>
                        <td style={{ padding: "12px 16px" }}>{o.user}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{fmt(o.total)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="status-badge" style={{ background: sc.bg, color: sc.color }}>{o.status}</span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#666" }}>{o.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <div className="slide">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h1 className="title" style={{ fontSize: 28 }}>QUẢN LÝ SẢN PHẨM</h1>
              <button className="btn btn-orange btn-sm" onClick={() => setShowAddProd(true)}>+ Thêm Sản Phẩm</button>
            </div>

            {showAddProd && (
              <div className="card slide" style={{ padding: 20, marginBottom: 20 }}>
                <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 600 }}>➕ Thêm Sản Phẩm Mới</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input className="inp" placeholder="Tên sản phẩm *" value={newProd.name} onChange={e => setNewProd(p => ({ ...p, name: e.target.value }))} />
                  <input className="inp" placeholder="Giá (₫) *" type="number" value={newProd.price} onChange={e => setNewProd(p => ({ ...p, price: e.target.value }))} />
                  <input className="inp" placeholder="Tồn kho" type="number" value={newProd.stock} onChange={e => setNewProd(p => ({ ...p, stock: e.target.value }))} />
                  <select className="inp" value={newProd.category} onChange={e => setNewProd(p => ({ ...p, category: e.target.value }))}>
                    <option>Thiết Bị</option><option>Phụ Kiện</option><option>Thời Trang</option>
                  </select>
                  <input className="inp" placeholder="Mô tả" value={newProd.desc} onChange={e => setNewProd(p => ({ ...p, desc: e.target.value }))} style={{ gridColumn: "span 2" }} />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button className="btn btn-orange btn-sm" onClick={addProd}>Lưu Sản Phẩm</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowAddProd(false)}>Hủy</button>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 16 }}>
              {products.map(p => (
                <div key={p.id} className="card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 44, textAlign: "center", background: "#1a1a24", borderRadius: 8, padding: 14, marginBottom: 12 }}>{p.image}</div>
                  <span className="badge" style={{ marginBottom: 8 }}>{p.badge}</span>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.name}</p>
                  <p style={{ color: "#ff4d00", fontWeight: 700, marginBottom: 4 }}>{fmt(p.price)}</p>
                  <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>Tồn kho: {p.stock} | Đã bán: {p.sold}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => setEditProd(p)}>✏️ Sửa</button>
                    <button className="btn btn-danger" onClick={() => deleteProd(p.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Modal */}
            {editProd && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <div className="card slide" style={{ width: "100%", maxWidth: 420, padding: 24 }}>
                  <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>✏️ Chỉnh Sửa Sản Phẩm</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input className="inp" value={editProd.name} onChange={e => setEditProd(p => ({ ...p, name: e.target.value }))} placeholder="Tên" />
                    <input className="inp" type="number" value={editProd.price} onChange={e => setEditProd(p => ({ ...p, price: +e.target.value }))} placeholder="Giá" />
                    <input className="inp" type="number" value={editProd.stock} onChange={e => setEditProd(p => ({ ...p, stock: +e.target.value }))} placeholder="Tồn kho" />
                    <input className="inp" value={editProd.desc} onChange={e => setEditProd(p => ({ ...p, desc: e.target.value }))} placeholder="Mô tả" />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button className="btn btn-orange btn-sm" style={{ flex: 1 }} onClick={() => { setProducts(ps => ps.map(p => p.id === editProd.id ? editProd : p)); setEditProd(null); }}>Lưu</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditProd(null)}>Hủy</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div className="slide">
            <h1 className="title" style={{ fontSize: 28, marginBottom: 24 }}>QUẢN LÝ ĐƠN HÀNG</h1>
            <div className="card" style={{ overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
                    {["Mã Đơn", "Khách Hàng", "SP", "Tổng Tiền", "Trạng Thái", "Ngày", "Hành Động"].map(h => (
                      <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "#666", fontWeight: 500, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => {
                    const sc = statusColor(o.status);
                    return (
                      <tr key={o.id} style={{ borderBottom: "1px solid #1a1a24" }}>
                        <td style={{ padding: "12px 16px", color: "#ff4d00", fontWeight: 600 }}>#{o.id}</td>
                        <td style={{ padding: "12px 16px" }}>{o.user}</td>
                        <td style={{ padding: "12px 16px", color: "#888" }}>{o.items} sản phẩm</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{fmt(o.total)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="status-badge" style={{ background: sc.bg, color: sc.color }}>{o.status}</span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#666" }}>{o.date}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <select className="inp" style={{ padding: "4px 8px", fontSize: 12, width: "auto" }}
                            value={o.status}
                            onChange={e => setOrders(os => os.map(x => x.id === o.id ? { ...x, status: e.target.value } : x))}>
                            {["Chờ xác nhận", "Đang giao", "Đã giao", "Đã hủy"].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div className="slide">
            <h1 className="title" style={{ fontSize: 28, marginBottom: 24 }}>QUẢN LÝ NGƯỜI DÙNG</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MOCK_USERS.map(u => (
                <div key={u.id} className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 36 }}>{u.avatar}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600 }}>{u.name}</p>
                    <p style={{ fontSize: 13, color: "#666" }}>{u.email}</p>
                  </div>
                  <span className="status-badge" style={{ background: u.role === "admin" ? "rgba(255,77,0,.15)" : "rgba(33,150,243,.15)", color: u.role === "admin" ? "#ff4d00" : "#2196f3" }}>
                    {u.role === "admin" ? "Admin" : "User"}
                  </span>
                  <span style={{ fontSize: 12, color: "#555" }}>Từ {u.joined}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chatbot ───────────────────────────────────────────────────────────────────
function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "Xin chào! 👋 Mình là trợ lý HABANA SPORT. Cần tư vấn gì không?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMsgs(m => [...m, userMsg]);
    setInput(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: KB, messages: [...msgs, userMsg].map(m => ({ role: m.role, content: m.content })) })
      });
      const data = await res.json();
      setMsgs(m => [...m, { role: "assistant", content: data.content?.[0]?.text || "Xin lỗi, thử lại nhé!" }]);
    } catch { setMsgs(m => [...m, { role: "assistant", content: "⚠️ Lỗi kết nối!" }]); }
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setOpen(o => !o)} style={{ position: "fixed", bottom: 24, right: 24, width: 54, height: 54, borderRadius: "50%", background: "#ff4d00", border: "none", cursor: "pointer", fontSize: 22, zIndex: 200, boxShadow: "0 4px 20px rgba(255,77,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {open ? "✕" : "💬"}
      </button>
      {open && (
        <div className="slide" style={{ position: "fixed", bottom: 90, right: 24, width: 330, height: 460, background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 16, display: "flex", flexDirection: "column", zIndex: 200, boxShadow: "0 8px 40px rgba(0,0,0,.6)", overflow: "hidden" }}>
          <div style={{ background: "#ff4d00", padding: "13px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>💪</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Trợ Lý HABANA SPORT</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,.75)" }}>● AI Online</p>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div className={m.role === "user" ? "chat-u" : "chat-a"}>{m.content}</div>
              </div>
            ))}
            {loading && <div style={{ display: "flex" }}><div className="chat-a pulse">Đang trả lời...</div></div>}
            <div ref={endRef} />
          </div>
          <div style={{ padding: "8px 10px", borderTop: "1px solid #1e1e2e", display: "flex", gap: 8 }}>
            <input className="inp" style={{ flex: 1, padding: "8px 11px", fontSize: 13 }} placeholder="Hỏi về sản phẩm..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
            <button className="btn btn-orange btn-sm" onClick={send} disabled={loading}>→</button>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [showAuth, setShowAuth] = useState(false);
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState("Tất Cả");
  const [payStep, setPayStep] = useState(1);
  const [orderInfo, setOrderInfo] = useState({ name: "", phone: "", address: "" });
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };
  const addCart = (p) => {
    if (!user) { setShowAuth(true); showToast("⚠️ Vui lòng đăng nhập để mua hàng!"); return; }
    setCart(c => { const ex = c.find(x => x.id === p.id); return ex ? c.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x) : [...c, { ...p, qty: 1 }]; });
    showToast(`✅ Đã thêm "${p.name}"!`);
  };
  const removeCart = (id) => setCart(c => c.filter(x => x.id !== id));
  const updateQty = (id, d) => setCart(c => c.map(x => x.id === id ? { ...x, qty: Math.max(1, x.qty + d) } : x));
  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const cartCount = cart.reduce((s, x) => s + x.qty, 0);
  const filtered = filter === "Tất Cả" ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);

  const handleLogout = () => { setUser(null); setPage("home"); setCart([]); showToast("👋 Đã đăng xuất!"); };
  const handleOrder = () => {
    if (!orderInfo.name || !orderInfo.phone || !orderInfo.address) { showToast("⚠️ Điền đầy đủ thông tin!"); return; }
    setPayStep(2);
  };
  const handleVNPay = () => { setCart([]); setPayStep(1); setOrderInfo({ name: "", phone: "", address: "" }); setPage("home"); showToast("🎉 Đặt hàng thành công! Cảm ơn bạn!"); };

  // Admin sees dashboard
  if (user?.role === "admin") return (
    <>
      <style>{CSS}</style>
      <AdminDashboard user={user} onLogout={handleLogout} />
    </>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#09090f", color: "#f0f0f0" }}>
      <style>{CSS}</style>
      <Toast msg={toast} />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={setUser} showToast={showToast} />}

      {/* NAVBAR */}
      <nav style={{ background: "#0d0d14", borderBottom: "1px solid #1e1e2e", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div onClick={() => setPage("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>💪</span>
          <span className="title" style={{ fontSize: 19, color: "#ff4d00" }}>HABANA SPORT</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {["home", "shop"].map(p => (
            <span key={p} className={`nav-a ${page === p ? "on" : ""}`} onClick={() => setPage(p)}>
              {p === "home" ? "Trang Chủ" : "Sản Phẩm"}
            </span>
          ))}
          <span className={`nav-a ${page === "cart" ? "on" : ""}`} onClick={() => setPage("cart")}>
            Giỏ Hàng{cartCount > 0 ? ` (${cartCount})` : ""}
          </span>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
              <span style={{ fontSize: 11, color: "#888" }}>Xin chào, <span style={{ color: "#ff4d00", fontWeight: 600 }}>{user.name}</span></span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Đăng Xuất</button>
            </div>
          ) : (
            <button className="btn btn-orange btn-sm" style={{ marginLeft: 8 }} onClick={() => setShowAuth(true)}>Đăng Nhập</button>
          )}
        </div>
      </nav>

      {/* HOME */}
      {page === "home" && (
        <div>
          <div style={{ background: "linear-gradient(135deg,#0d0d14 0%,#1a0800 50%,#0d0d14 100%)", padding: "80px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 60%,rgba(255,77,0,.08) 0%,transparent 70%)", pointerEvents: "none" }} />
            <p style={{ color: "#ff4d00", fontSize: 12, fontWeight: 600, letterSpacing: 4, marginBottom: 14, textTransform: "uppercase" }}>Nâng Tầm Vóc Dáng Người Việt</p>
            <h1 className="title" style={{ fontSize: "clamp(48px,8vw,90px)", lineHeight: 1, marginBottom: 18, color: "#fff" }}>
              THIẾT BỊ<br /><span style={{ color: "#ff4d00" }}>THỂ THAO</span><br />TẠI NHÀ
            </h1>
            <p style={{ color: "#888", maxWidth: 460, margin: "0 auto 32px", fontSize: 15, lineHeight: 1.6 }}>Tập luyện mọi lúc, mọi nơi với thiết bị chất lượng cao.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-orange" style={{ padding: "13px 32px" }} onClick={() => setPage("shop")}>Khám Phá →</button>
              {!user && <button className="btn btn-outline" style={{ padding: "13px 24px" }} onClick={() => setShowAuth(true)}>Đăng Nhập</button>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "#1e1e2e" }}>
            {[["60.000+", "Khách hàng"], ["100+", "Sản phẩm"], ["5★", "Đánh giá"]].map(([n, l]) => (
              <div key={l} style={{ background: "#09090f", padding: "24px 16px", textAlign: "center" }}>
                <div className="title" style={{ fontSize: 34, color: "#ff4d00" }}>{n}</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: "48px 24px" }}>
            <h2 className="title" style={{ fontSize: 30, marginBottom: 24, textAlign: "center" }}>SẢN PHẨM <span style={{ color: "#ff4d00" }}>NỔI BẬT</span></h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 18, maxWidth: 1100, margin: "0 auto" }}>
              {PRODUCTS.slice(0, 3).map(p => (
                <div key={p.id} className="card card-hover" style={{ padding: 18 }}>
                  <div style={{ fontSize: 52, textAlign: "center", background: "#1a1a24", borderRadius: 8, padding: 18, marginBottom: 10 }}>{p.image}</div>
                  <span className="badge" style={{ marginBottom: 8 }}>{p.badge}</span>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{p.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ color: "#ff4d00", fontWeight: 700 }}>{fmt(p.price)}</span>
                    {p.originalPrice && <span style={{ color: "#444", fontSize: 12, textDecoration: "line-through" }}>{fmt(p.originalPrice)}</span>}
                  </div>
                  <button className="btn btn-orange" style={{ width: "100%" }} onClick={() => addCart(p)}>+ Thêm Giỏ</button>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button className="btn btn-outline" onClick={() => setPage("shop")}>Xem tất cả →</button>
            </div>
          </div>
        </div>
      )}

      {/* SHOP */}
      {page === "shop" && (
        <div style={{ padding: "32px 24px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <h1 className="title" style={{ fontSize: 30 }}>CỬA HÀNG</h1>
            <div style={{ display: "flex", gap: 8 }}>
              {["Tất Cả", "Thiết Bị", "Phụ Kiện"].map(c => <span key={c} className={`tag ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>{c}</span>)}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 18 }}>
            {filtered.map(p => (
              <div key={p.id} className="card card-hover slide" style={{ padding: 18 }}>
                <div style={{ fontSize: 52, textAlign: "center", background: "#1a1a24", borderRadius: 8, padding: 18, marginBottom: 10, position: "relative" }}>
                  {p.image}
                  <span className="badge" style={{ position: "absolute", top: 8, right: 8 }}>{p.badge}</span>
                </div>
                <p style={{ fontSize: 10, color: "#ff4d00", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>{p.category}</p>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{p.name}</h3>
                <p style={{ fontSize: 12, color: "#555", marginBottom: 10, lineHeight: 1.5 }}>{p.desc}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ color: "#ff4d00", fontWeight: 700 }}>{fmt(p.price)}</span>
                  {p.originalPrice && <span style={{ color: "#444", fontSize: 12, textDecoration: "line-through" }}>{fmt(p.originalPrice)}</span>}
                </div>
                <button className="btn btn-orange" style={{ width: "100%" }} onClick={() => addCart(p)}>+ Thêm Vào Giỏ</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CART */}
      {page === "cart" && (
        <div style={{ padding: "32px 24px", maxWidth: 780, margin: "0 auto" }}>
          <h1 className="title" style={{ fontSize: 30, marginBottom: 24 }}>GIỎ HÀNG</h1>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>🛒</div>
              <p style={{ marginBottom: 20 }}>Giỏ hàng trống!</p>
              <button className="btn btn-orange" onClick={() => setPage("shop")}>Mua sắm ngay</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {cart.map(item => (
                  <div key={item.id} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 32 }}>{item.image}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</p>
                      <p style={{ color: "#ff4d00", fontWeight: 700, marginTop: 3, fontSize: 13 }}>{fmt(item.price)}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button className="btn btn-outline btn-sm" style={{ padding: "3px 10px" }} onClick={() => updateQty(item.id, -1)}>−</button>
                      <span style={{ minWidth: 20, textAlign: "center", fontSize: 14 }}>{item.qty}</span>
                      <button className="btn btn-outline btn-sm" style={{ padding: "3px 10px" }} onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                    <span style={{ fontWeight: 700, minWidth: 86, textAlign: "right", fontSize: 13 }}>{fmt(item.price * item.qty)}</span>
                    <button onClick={() => removeCart(item.id)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: 18, marginBottom: 20 }}>
                {[["Tạm tính", fmt(total), "#888"], ["Vận chuyển", "Miễn phí", "#4caf50"]].map(([l, v, c]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#888" }}>
                    <span>{l}</span><span style={{ color: c }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #1e1e2e", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 17 }}>
                  <span>Tổng cộng</span><span style={{ color: "#ff4d00" }}>{fmt(total)}</span>
                </div>
              </div>

              {payStep === 1 && (
                <div className="card" style={{ padding: 22 }}>
                  <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 600 }}>📋 Thông tin giao hàng</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {user && <div style={{ background: "#1a1a26", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#888" }}>Đặt hàng với tài khoản: <span style={{ color: "#ff4d00" }}>{user.name}</span></div>}
                    <input className="inp" placeholder="Họ và tên *" value={orderInfo.name} onChange={e => setOrderInfo(o => ({ ...o, name: e.target.value }))} />
                    <input className="inp" placeholder="Số điện thoại *" value={orderInfo.phone} onChange={e => setOrderInfo(o => ({ ...o, phone: e.target.value }))} />
                    <input className="inp" placeholder="Địa chỉ giao hàng *" value={orderInfo.address} onChange={e => setOrderInfo(o => ({ ...o, address: e.target.value }))} />
                    <button className="btn btn-orange" style={{ marginTop: 6, padding: "12px" }} onClick={handleOrder}>Tiến hành thanh toán →</button>
                  </div>
                </div>
              )}

              {payStep === 2 && (
                <div className="card slide" style={{ padding: 24, textAlign: "center" }}>
                  <div style={{ fontSize: 44, marginBottom: 14 }}>💳</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Thanh Toán VNPay</h3>
                  <p style={{ color: "#666", fontSize: 12, marginBottom: 18 }}>Cổng thanh toán VNPay bảo mật SSL</p>
                  <div style={{ background: "#1a1a26", borderRadius: 10, padding: 14, marginBottom: 18, textAlign: "left" }}>
                    {[["Người nhận", orderInfo.name], ["SĐT", orderInfo.phone], ["Địa chỉ", orderInfo.address]].map(([l, v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                        <span style={{ color: "#666" }}>{l}</span><span style={{ maxWidth: "60%", textAlign: "right" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "linear-gradient(135deg,#003087,#0055b3)", borderRadius: 10, padding: 18, marginBottom: 18 }}>
                    <p style={{ color: "rgba(255,255,255,.7)", fontSize: 12, marginBottom: 4 }}>Tổng thanh toán</p>
                    <p style={{ color: "#fff", fontSize: 26, fontWeight: 700 }}>{fmt(total)}</p>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setPayStep(1)}>← Quay lại</button>
                    <button className="btn btn-orange" style={{ flex: 2 }} onClick={handleVNPay}>Thanh Toán 🔒</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Chatbot />
    </div>
  );
}
