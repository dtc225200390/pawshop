// App.jsx - PAWSHOP — Light Theme, Sport Editorial Design
import { useState, useEffect, useRef, useCallback } from "react";
import { authAPI, uploadAPI, getImageUrl, productAPI, categoryAPI, reviewAPI, orderAPI, adminAPI, paymentAPI, voucherAPI, saveToken, clearToken, hasToken } from "./api";
import AdminCharts from "./components/AdminCharts";
import AdminProducts from "./components/AdminProducts";
import AdminReviews from "./components/AdminReviews";
import AdminVouchers from "./components/AdminVouchers";
import AdminSettings from "./components/AdminSettings";
import AdminMessages from "./components/AdminMessages";
import ProductDetail from "./components/ProductDetail";
import Footer from "./components/Footer";

const fmt = (n) => Number(n).toLocaleString("vi-VN") + "₫";
const statusMeta = (s) => ({
  pending: { bg: "#EFF6FF", color: "#2563EB", label: "Chờ xác nhận" },
  confirmed: { bg: "#FFF7ED", color: "#EA580C", label: "Đã xác nhận" },
  shipping: { bg: "#F5F3FF", color: "#7C3AED", label: "Đang giao" },
  delivered: { bg: "#F0FDF4", color: "#16A34A", label: "Đã giao" },
  cancelled: { bg: "#FEF2F2", color: "#DC2626", label: "Đã hủy" },
}[s] || { bg: "#F9FAFB", color: "#6B7280", label: s });

const PAGE_SIZE_SHOP = 12;
const PAGE_SIZE_ADMIN = 10;
const PAGE_SIZE_HOME = 6;
const PAGE_SIZE_CART = 8;

function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = [];
  const show = new Set([1, totalPages, page, page - 1, page + 1].filter(p => p >= 1 && p <= totalPages));
  const sorted = [...show].sort((a, b) => a - b);
  let prev = 0;
  sorted.forEach(p => { if (p - prev > 1) pages.push("…"); pages.push(p); prev = p; });

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 24, flexWrap: "wrap", padding: "14px 0", borderTop: "1px solid var(--b)" }}>
      <span style={{ fontSize: 13, color: "var(--ink3)", fontWeight: 500 }}>
        Hiển thị <strong style={{ color: "var(--ink)" }}>{from}–{to}</strong> / <strong style={{ color: "var(--ink)" }}>{total}</strong> mục
      </span>
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <button
            onClick={() => onChange(page - 1)} disabled={page === 1}
            style={{ padding: "6px 12px", border: "1.5px solid var(--b)", borderRadius: 7, background: "var(--s)", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "var(--ink4)" : "var(--ink)", fontWeight: 600, fontSize: 13, fontFamily: "inherit", transition: "all .15s", opacity: page === 1 ? 0.45 : 1 }}
          >←</button>
          {pages.map((p, i) =>
            p === "…"
              ? <span key={`d${i}`} style={{ color: "var(--ink4)", fontSize: 13, padding: "0 2px" }}>…</span>
              : <button key={p} onClick={() => onChange(p)}
                style={{ width: 34, height: 34, border: `1.5px solid ${p === page ? 'var(--brand)' : 'var(--b)'}`, borderRadius: 7, background: p === page ? "var(--brand)" : "var(--s)", color: p === page ? "#fff" : "var(--ink2)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
              >{p}</button>
          )}
          <button
            onClick={() => onChange(page + 1)} disabled={page === totalPages}
            style={{ padding: "6px 12px", border: "1.5px solid var(--b)", borderRadius: 7, background: "var(--s)", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "var(--ink4)" : "var(--ink)", fontWeight: 600, fontSize: 13, fontFamily: "inherit", transition: "all .15s", opacity: page === totalPages ? 0.45 : 1 }}
          >→</button>
        </div>
      )}
    </div>
  );
}

function ProductCard({ p, onAdd, animDelay = 0, showDesc = false }) {
  const [hovered, setHovered] = useState(false);
  const badgeClass = p.badge === "HOT" ? "bHot" : p.badge === "NEW" ? "bNew" : "bSale";
  return (
    <div
      className="card lift fu"
      style={{ overflow: "hidden", animationDelay: `${animDelay}s`, display: "flex", flexDirection: "column" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ width: "100%", aspectRatio: "1/1", background: "var(--s3)", overflow: "hidden", flexShrink: 0, position: "relative" }}>
        {p.image
          ? <img
            src={getImageUrl(p.image)}
            alt={p.name}
            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s ease", ...(hovered ? { transform: "scale(1.06)" } : {}) }}
          />
          : null
        }
        <div style={{ position: "absolute", inset: 0, display: p.image ? "none" : "flex", alignItems: "center", justifyContent: "center", fontSize: 52, background: "var(--s3)" }}>📦</div>
        <div style={{ position: "absolute", inset: 0, background: "rgba(15,15,15,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 14, opacity: hovered ? 1 : 0, transition: "opacity .25s", pointerEvents: hovered ? "auto" : "none" }}>
          <button
            className="btn"
            onClick={e => { e.stopPropagation(); onAdd(p); }}
            style={{ background: "#fff", color: "var(--ink)", width: "100%", justifyContent: "center", padding: "10px", fontSize: 13, fontWeight: 800, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,.2)" }}
          >+ Thêm Vào Giỏ</button>
        </div>
        {p.badge && <span className={`badge ${badgeClass}`} style={{ position: "absolute", top: 10, left: 10 }}>{p.badge}</span>}
        {p.original_price && p.original_price > p.price && (
          <span style={{ position: "absolute", top: 10, right: 10, background: "var(--brand)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6 }}>
            -{Math.round((1 - p.price / p.original_price) * 100)}%
          </span>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        <p style={{ fontSize: 10, color: "var(--brand)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 }}>{p.category_name}</p>
        <h3 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35, marginBottom: 6, color: "var(--ink)", flex: 1 }}>{p.name}</h3>
        {showDesc && p.description && <p style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 10, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</p>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--b)" }}>
          <div>
            <span style={{ color: "var(--brand)", fontWeight: 800, fontSize: 17 }}>{fmt(p.price)}</span>
            {p.original_price && <div style={{ color: "var(--ink4)", fontSize: 11, textDecoration: "line-through", marginTop: 1 }}>{fmt(p.original_price)}</div>}
          </div>
          <button
            className="btn bP"
            style={{ padding: "8px 14px", fontSize: 12, borderRadius: 8 }}
            onClick={() => onAdd(p)}
          >+</button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card-x">
      <div className="sk" style={{ paddingTop: "100%", position: "relative" }} />
      <div style={{ padding: "14px 16px 16px" }}>
        <div className="sk" style={{ height: 10, width: "35%", marginBottom: 10 }} />
        <div className="sk" style={{ height: 15, width: "85%", marginBottom: 6 }} />
        <div className="sk" style={{ height: 15, width: "60%", marginBottom: 16 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--b)" }}>
          <div className="sk" style={{ height: 20, width: "45%" }} />
          <div className="sk" style={{ height: 34, width: "20%", borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const s = { success: { bg: "#F0FDF4", border: "#86EFAC", color: "#15803D", icon: "✓" }, error: { bg: "#FEF2F2", border: "#FCA5A5", color: "#DC2626", icon: "✕" }, info: { bg: "#FFF7ED", border: "#FED7AA", color: "#EA580C", icon: "!" } }[type] || { bg: "#FFF7ED", border: "#FED7AA", color: "#EA580C", icon: "!" };
  return (
    <div className="fu" style={{ position: "fixed", top: 76, right: 20, background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 10, padding: "12px 18px", zIndex: 9999, fontSize: 14, color: s.color, fontWeight: 600, maxWidth: 320, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,.1)" }}>
      <span style={{ width: 20, height: 20, background: s.color, color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{s.icon}</span>
      {msg}
    </div>
  );
}

function AuthModal({ onClose, onLogin, showToast }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      let data;
      if (tab === "login") data = await authAPI.login(form.email, form.password);
      else { if (!form.name) { setErr("Vui lòng điền tên!"); setLoading(false); return; } data = await authAPI.register(form.name, form.email, form.password); }
      saveToken(data.token); onLogin(data.user); onClose(); showToast(`Chào mừng, ${data.user.name}!`, "success");
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div className="fi" style={{ position: "fixed", inset: 0, background: "rgba(15,15,15,.5)", backdropFilter: "blur(4px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div className="card fu" style={{ width: "100%", maxWidth: 420, padding: 36, position: "relative", boxShadow: "0 24px 64px rgba(0,0,0,.18)" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "var(--s3)", border: "none", color: "var(--ink3)", cursor: "pointer", width: 32, height: 32, borderRadius: "50%", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: "var(--brand)", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 12 }}>🐾</div>
          <h2 className="D" style={{ fontSize: 26, color: "var(--ink)" }}>PAWSHOP</h2>
          <p style={{ fontSize: 13, color: "var(--ink3)", marginTop: 4 }}>Cửa hàng thú cưng online</p>
        </div>
        <div style={{ display: "flex", background: "var(--s2)", borderRadius: 10, padding: 4, marginBottom: 24, border: "1px solid var(--b)" }}>
          {["login", "register"].map(t => <button key={t} onClick={() => { setTab(t); setErr(""); }} className="btn" style={{ flex: 1, padding: "9px", fontSize: 14, borderRadius: 7, background: tab === t ? "var(--s)" : "transparent", color: tab === t ? "var(--ink)" : "var(--ink3)", fontWeight: tab === t ? 700 : 500, boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,.07)" : "none" }}>{t === "login" ? "Đăng Nhập" : "Đăng Ký"}</button>)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {[{ name: "Google", icon: "🔵", fn: authAPI.loginGoogle }, { name: "Facebook", icon: "🔷", fn: authAPI.loginFacebook }].map(s => (
            <button key={s.name} className="sBt" onClick={s.fn}><span style={{ fontSize: 18 }}>{s.icon}</span><span>{tab === "login" ? "Đăng nhập" : "Đăng ký"} với {s.name}</span></button>
          ))}
        </div>
        <div className="dv" style={{ marginBottom: 20 }}><span style={{ fontSize: 12, color: "var(--ink4)", fontWeight: 500 }}>hoặc dùng email</span></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tab === "register" && <input className="inp" placeholder="Họ và tên *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />}
          <input className="inp" type="email" placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <input className="inp" type="password" placeholder="Mật khẩu *" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && submit()} />
          {err && <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#DC2626" }}>{err}</div>}
          <button className="btn bP" style={{ marginTop: 4, justifyContent: "center", padding: "13px" }} onClick={submit} disabled={loading}>{loading ? "Đang xử lý..." : tab === "login" ? "Đăng Nhập →" : "Tạo Tài Khoản →"}</button>
        </div>
        {tab === "login" && <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--ink4)" }}>Demo: <span style={{ color: "var(--brand)", fontWeight: 600 }}>admin@pawshop.vn / admin123</span></p>}
      </div>
    </div>
  );
}

function AdminDashboard({ user, onLogout, showToast }) {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProd, setEditProd] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [categories, setCategories] = useState([]);
  const emptyP = { name: "", price: "", original_price: "", category_id: "", stock: "", image: "", description: "", badge: "NEW" };
  const [newP, setNewP] = useState(emptyP);
  const [imagePreview, setImagePreview] = useState("");
  const [editImagePreview, setEditImagePreview] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editUploadingFile, setEditUploadingFile] = useState(false);
  const [prodPage, setProdPage] = useState(1);
  const [ordPage, setOrdPage] = useState(1);
  const [usrPage, setUsrPage] = useState(1);
  const [ordSearch, setOrdSearch] = useState("");
  const [ordStatus, setOrdStatus] = useState("all");
  const [usrSearch, setUsrSearch] = useState("");

  useEffect(() => {
    setProdPage(1); setOrdPage(1); setUsrPage(1); setOrdSearch(""); setOrdStatus("all"); setUsrSearch("");
    if (["products", "reviews", "vouchers", "messages", "settings"].includes(tab)) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        if (tab === "overview") {
          const [s, o] = await Promise.all([adminAPI.getStats(), orderAPI.getAll({ limit: 200 })]);
          setStats(s);
          setOrders(Array.isArray(o) ? o : []);
        }
        else if (tab === "orders") {
          const o = await orderAPI.getAll({ limit: 500 });
          setOrders(Array.isArray(o) ? o : []);
        }
        else if (tab === "users") {
          const u = await adminAPI.getUsers();
          setUsers(Array.isArray(u) ? u : []);
        }
      } catch (e) { showToast("Lỗi tải dữ liệu: " + e.message, "error"); }
      finally { setLoading(false); }
    })();
  }, [tab]);

  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const navs = [
    { id: "overview", icon: "📊", label: "Tổng Quan" },
    { id: "products", icon: "📦", label: "Sản Phẩm" },
    { id: "orders", icon: "🛒", label: "Đơn Hàng", badge: pendingOrders || null },
    { id: "users", icon: "👥", label: "Người Dùng" },
    { id: "reviews", icon: "⭐", label: "Đánh Giá" },
    { id: "vouchers", icon: "🎟️", label: "Mã Giảm Giá" },
    { id: "messages", icon: "💬", label: "Tin Nhắn", badge: null },
    { id: "settings", icon: "⚙️", label: "Cài Đặt" },
  ];

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--s2)" }}>
      <div style={{ display: "none" }} className="admin-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "var(--brand)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🐾</div>
          <span className="DM" style={{ fontSize: 14 }}>PAWSHOP ADMIN</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--ink3)" }}>{navs.find(n => n.id === tab)?.icon} {navs.find(n => n.id === tab)?.label}</span>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: "var(--s2)", border: "1px solid var(--b)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>{sidebarOpen ? "✕" : "☰"}</button>
        </div>
      </div>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 49 }} />}

      <div style={{ width: 240, background: "var(--s)", borderRight: "1px solid var(--b)", display: "flex", flexDirection: "column", padding: "24px 16px", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50, boxShadow: "2px 0 8px rgba(0,0,0,.04)" }} className={`admin-sidebar-panel${sidebarOpen ? ' open' : ''}`}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: "var(--brand)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🐾</div>
          <div><div className="DM" style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1 }}>PAWSHOP</div><div style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600, letterSpacing: 1 }}>ADMIN PANEL</div></div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, overflowY: "auto" }}>
          {navs.map(n => (
            <div key={n.id} className={`aI ${tab === n.id ? 'on' : ''}`} onClick={() => { setTab(n.id); setSidebarOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>{n.icon}</span>
                <span>{n.label}</span>
              </span>
              {n.badge > 0 && <span style={{ background: "var(--brand)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 100, minWidth: 20, textAlign: "center" }}>{n.badge}</span>}
            </div>
          ))}
          <div style={{ height: 1, background: "var(--b)", margin: "8px 0" }} />
          <div className="aI" onClick={() => { onLogout(); }} style={{ color: "var(--ink3)" }}>
            <span style={{ fontSize: 16 }}>🏪</span><span style={{ fontSize: 13 }}>Xem Cửa Hàng</span>
          </div>
        </nav>
        <div style={{ borderTop: "1px solid var(--b)", paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "8px 10px", background: "var(--s2)", borderRadius: 10 }}>
            <div style={{ width: 36, height: 36, background: "var(--brand)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>{user.name[0]}</div>
            <div><p style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</p><p style={{ fontSize: 11, color: "var(--brand)", fontWeight: 600 }}>Administrator</p></div>
          </div>
          <button className="btn bS sm" style={{ width: "100%", justifyContent: "center" }} onClick={onLogout}>Đăng Xuất</button>
        </div>
      </div>

      <div style={{ marginLeft: 240, flex: 1, padding: "32px 28px", minWidth: 0 }} className="admin-main-content">
        {tab === "overview" && <AdminCharts showToast={showToast} />}
        {tab === "products" && <AdminProducts showToast={showToast} />}
        {tab === "orders" && (
          <div className="fu">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h1 className="D" style={{ fontSize: 32 }}>ĐƠN HÀNG</h1>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[["all", "Tất Cả"], ["pending", "Chờ XN"], ["confirmed", "Đã XN"], ["shipping", "Đang Giao"], ["delivered", "Đã Giao"], ["cancelled", "Hủy"]].map(([v, l]) => (
                    <span key={v} className={`tag ${ordStatus === v ? 'on' : ''}`}
                      style={{ padding: "5px 12px", fontSize: 12 }}
                      onClick={() => { setOrdStatus(v); setOrdPage(1); }}>
                      {l}
                      <strong style={{ marginLeft: 5, opacity: .7 }}>
                        ({v === "all" ? orders.length : orders.filter(o => o.status === v).length})
                      </strong>
                    </span>
                  ))}
                </div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink4)" }}>🔍</span>
                  <input className="inp" style={{ paddingLeft: 32, width: 220, fontSize: 13 }}
                    placeholder="Mã đơn, tên khách..."
                    value={ordSearch} onChange={e => { setOrdSearch(e.target.value); setOrdPage(1); }} />
                  {ordSearch && <button onClick={() => setOrdSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--ink4)" }}>✕</button>}
                </div>
              </div>
            </div>
            {loading ? <div className="sk" style={{ height: 300 }} /> : (() => {
              const filtOrders = orders.filter(o => {
                const matchStatus = ordStatus === "all" || o.status === ordStatus;
                const q = ordSearch.toLowerCase();
                const matchSearch = !q || o.order_code?.toLowerCase().includes(q) || o.receiver_name?.toLowerCase().includes(q) || o.receiver_phone?.includes(q);
                return matchStatus && matchSearch;
              });
              return (<>
                {filtOrders.length === 0
                  ? <div style={{ textAlign: "center", padding: 60, color: "var(--ink4)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                    <p style={{ fontWeight: 600 }}>Không tìm thấy đơn hàng</p>
                    <button className="btn bS sm" style={{ marginTop: 12 }} onClick={() => { setOrdSearch(""); setOrdStatus("all"); }}>Xóa bộ lọc</button>
                  </div>
                  : <><div className="card-xx">
                    <table className="tbl"><thead><tr>{["Mã Đơn", "Khách", "Tổng", "Thanh Toán", "Trạng Thái", "Ngày", "Cập Nhật"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>{filtOrders.slice((ordPage - 1) * PAGE_SIZE_ADMIN, ordPage * PAGE_SIZE_ADMIN).map(o => { const sm = statusMeta(o.status); return (<tr key={o.id}><td><span style={{ fontWeight: 700, color: "var(--brand)" }}>#{o.order_code}</span></td><td style={{ fontWeight: 600 }}>{o.receiver_name}<div style={{ fontSize: 11, color: "var(--ink4)" }}>{o.receiver_phone}</div></td><td><span style={{ fontWeight: 700 }}>{fmt(o.total)}</span></td><td><span style={{ fontSize: 11, fontWeight: 600, color: o.payment_status === "paid" ? "#16A34A" : "#EA580C" }}>{o.payment_status === "paid" ? "✓ Đã TT" : "⏳ Chưa"}</span></td><td><span className="st" style={{ background: sm.bg, color: sm.color }}>{sm.label}</span></td><td style={{ color: "var(--ink4)" }}>{new Date(o.created_at).toLocaleDateString("vi-VN")}</td><td><select className="inp" style={{ padding: "5px 8px", fontSize: 12, width: "auto" }} value={o.status} onChange={async e => { await orderAPI.updateStatus(o.id, e.target.value); setOrders(os => os.map(x => x.id === o.id ? { ...x, status: e.target.value } : x)); showToast("✅ Đã cập nhật", "success"); }}>{["pending", "confirmed", "shipping", "delivered", "cancelled"].map(s => <option key={s} value={s}>{statusMeta(s).label}</option>)}</select></td></tr>); })}</tbody></table>
                  </div>
                    <Pagination page={ordPage} total={filtOrders.length} pageSize={PAGE_SIZE_ADMIN} onChange={p => { setOrdPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} /></>
                }
              </>);
            })()}
          </div>
        )}

        {tab === "users" && (
          <div className="fu">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h1 className="D" style={{ fontSize: 32 }}>NGƯỜI DÙNG</h1>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink4)" }}>🔍</span>
                <input className="inp" style={{ paddingLeft: 32, width: 260, fontSize: 13 }}
                  placeholder="Tên, email, số điện thoại..."
                  value={usrSearch} onChange={e => { setUsrSearch(e.target.value); setUsrPage(1); }} />
                {usrSearch && <button onClick={() => setUsrSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--ink4)" }}>✕</button>}
              </div>
            </div>
            {loading ? <div className="sk" style={{ height: 300 }} /> : (() => {
              const filtUsers = users.filter(u => {
                const q = usrSearch.toLowerCase();
                return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
              });
              return (<>
                {filtUsers.length === 0
                  ? <div style={{ textAlign: "center", padding: 60, color: "var(--ink4)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                    <p style={{ fontWeight: 600 }}>Không tìm thấy người dùng</p>
                    <button className="btn bS sm" style={{ marginTop: 12 }} onClick={() => setUsrSearch("")}>Xóa bộ lọc</button>
                  </div>
                  : <><div className="card-x">
                    <table className="tbl"><thead><tr>{["Người Dùng", "Email", "Vai Trò", "Trạng Thái", "Ngày", "Thao Tác"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>{filtUsers.slice((usrPage - 1) * PAGE_SIZE_ADMIN, usrPage * PAGE_SIZE_ADMIN).map(u => (
                        <tr key={u.id}><td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 34, height: 34, background: u.role === "admin" ? "var(--brand)" : "var(--s3)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: u.role === "admin" ? "#fff" : "var(--ink3)" }}>{u.name[0]}</div><div><p style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</p>{u.phone && <p style={{ fontSize: 11, color: "var(--ink4)" }}>{u.phone}</p>}</div></div></td><td style={{ color: "var(--ink3)" }}>{u.email}</td><td><span className="st" style={{ background: u.role === "admin" ? "#FFF7ED" : "#EFF6FF", color: u.role === "admin" ? "var(--brand)" : "#2563EB" }}>{u.role === "admin" ? "Admin" : "User"}</span></td><td><span className="st" style={{ background: u.is_active ? "#F0FDF4" : "#FEF2F2", color: u.is_active ? "#16A34A" : "#DC2626" }}>{u.is_active ? "Hoạt Động" : "Bị Khóa"}</span></td><td style={{ color: "var(--ink4)" }}>{new Date(u.created_at).toLocaleDateString("vi-VN")}</td><td>{u.role !== "admin" && <button className="btn bS xs" onClick={async () => { await adminAPI.toggleUser(u.id, !u.is_active); setUsers(us => us.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x)); }}>{u.is_active ? "Khóa" : "Mở"}</button>}</td></tr>
                      ))}</tbody></table>
                  </div>
                    <Pagination page={usrPage} total={filtUsers.length} pageSize={PAGE_SIZE_ADMIN} onChange={p => { setUsrPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} /></>
                }
              </>);
            })()}
          </div>
        )}
        {tab === "reviews" && <AdminReviews showToast={showToast} />}
        {tab === "messages" && <AdminMessages showToast={showToast} />}
        {tab === "vouchers" && <AdminVouchers showToast={showToast} />}
        {tab === "settings" && <AdminSettings showToast={showToast} />}
      </div>
    </div>
  );
}

// ── CHATBOT ───────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function buildSystemPrompt(products) {
  const pList = products.map(p =>
    `ID:${p.id}|Tên:${p.name}|Giá:${p.price}|Gốc:${p.original_price || ""}|Tồn:${p.stock}|Danh mục:${p.category_name || ""}|Mô tả:${(p.description || "").slice(0, 80)}`
  ).join("\n");

  return `Bạn là trợ lý bán hàng PAWSHOP — chuyên thiết bị thú cưng tại nhà. Nhiệm vụ: tư vấn, giới thiệu, thuyết phục khách mua hàng và chốt đơn.

DANH SÁCH SẢN PHẨM:
${pList}

QUY TẮC BẮT BUỘC — Luôn trả về JSON hợp lệ, KHÔNG markdown, KHÔNG backtick:
{
  "text": "Nội dung trả lời tiếng Việt, thân thiện, có emoji, thúc đẩy mua hàng",
  "products": []
}

Mỗi item trong products (chỉ khi cần gợi ý): { "id": number, "name": string, "price": number, "original_price": number|null, "stock": number, "category_name": string, "description": string }
- Chỉ gợi ý sản phẩm CÓ TRONG DANH SÁCH, stock > 0, tối đa 3 sản phẩm
- Khi khách hỏi chung ("tập bụng", "giảm cân", "tập gym"): gợi ý 2-3 sản phẩm phù hợp nhất
- Khi khách hỏi cụ thể 1 sản phẩm: gợi ý đúng sản phẩm đó + 1 sản phẩm liên quan
- Khi khách hỏi giá/so sánh: trả lời chi tiết, không cần gợi ý products
- Luôn kết thúc bằng câu thúc đẩy mua hoặc hỏi thêm nhu cầu
- Nếu không liên quan thú cưng: nhẹ nhàng redirect về tư vấn sản phẩm
- TUYỆT ĐỐI CHỈ trả về JSON object, bắt đầu bằng { và kết thúc bằng }, không có bất kỳ text nào bên ngoài`;
}

function ChatProductCard({ p, onAdd }) {
  const fmtP = (n) => Number(n).toLocaleString("vi-VN") + "₫";
  const discount = p.original_price && p.original_price > p.price
    ? Math.round((1 - p.price / p.original_price) * 100) : 0;
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(p);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div style={{
      background: "var(--s)", border: `1.5px solid ${added ? '#86EFAC' : 'var(--b)'}`,
      borderRadius: 12, overflow: "hidden", width: 155, flexShrink: 0,
      transition: "border-color .3s, box-shadow .2s",
      boxShadow: added ? "0 0 0 3px rgba(22,163,74,.15)" : "none",
    }}>
      {/* Image */}
      <div style={{ width: "100%", aspectRatio: "1/1", background: "var(--s3)", position: "relative", overflow: "hidden" }}>
        {p.image
          ? <img src={getImageUrl(p.image)} alt={p.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={e => { e.target.style.display = "none"; }}
            />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>📦</div>
        }
        {discount > 0 && (
          <span style={{ position: "absolute", top: 5, right: 5, background: "var(--brand)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 5px", borderRadius: 4 }}>
            -{discount}%
          </span>
        )}
        {p.stock <= 5 && (
          <span style={{ position: "absolute", bottom: 4, left: 4, background: "#FFF7ED", color: "#EA580C", fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4 }}>
            Còn {p.stock}
          </span>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: "8px 10px 10px" }}>
        <p style={{ fontSize: 11, color: "var(--brand)", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginBottom: 2 }}>{p.category_name}</p>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)", lineHeight: 1.35, marginBottom: 5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {p.name}
        </p>
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: "var(--brand)", fontWeight: 800, fontSize: 13 }}>{fmtP(p.price)}</span>
          {p.original_price && p.original_price > p.price && (
            <span style={{ color: "var(--ink4)", fontSize: 10, textDecoration: "line-through", marginLeft: 5 }}>{fmtP(p.original_price)}</span>
          )}
        </div>
        <button
          onClick={handleAdd}
          style={{
            width: "100%", padding: "7px 0",
            background: added ? "#16A34A" : "var(--brand)",
            color: "#fff", border: "none", borderRadius: 7,
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", transition: "background .3s",
          }}
        >
          {added ? "✓ Đã thêm!" : "+ Thêm vào giỏ"}
        </button>
      </div>
    </div>
  );
}

function Chatbot({ products, onAddCart }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{
    role: "assistant",
    content: "Xin chào! 👋 Mình là trợ lý PawShop.\nBé nhà bạn là chó hay mèo? Mình sẽ gợi ý sản phẩm phù hợp! 🐾",
    products: [],
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [msgs, open]);

  const quickSuggests = ["Thức ăn chó 🐶", "Đồ chơi mèo 🐱", "Tăng cơ 🐾", "Dưới 200K 💰"];

  const send = async (text) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    const userMsg = { role: "user", content: msg };
    setMsgs(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build messages array theo OpenAI/Groq format
      const systemPrompt = buildSystemPrompt(products);
      const chatMessages = [
        { role: "system", content: systemPrompt },
        // Lịch sử hội thoại (tối đa 6 tin gần nhất)
        ...msgs.slice(-6).map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.rawText || m.content,
        })),
        { role: "user", content: msg },
      ];

      const res = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi server");
      const raw = data.text || "";

      let parsed = { text: "", products: [] };
      try {
        // Tìm và extract JSON từ response (model đôi khi wrap trong text)
        let jsonStr = raw;
        // Xóa markdown code blocks
        jsonStr = jsonStr.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        // Tìm JSON object đầu tiên { ... }
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          // Không tìm thấy JSON — dùng raw text làm text response
          parsed = { text: raw.trim(), products: [] };
        }
        // Validate — đảm bảo text là string, products là array
        if (typeof parsed.text !== "string") parsed.text = String(parsed.text || "");
        if (!Array.isArray(parsed.products)) parsed.products = [];
      } catch {
        // Parse lỗi hoàn toàn — trả raw text, không hiện JSON
        const cleanText = raw
          .replace(/```json|```/g, "")
          .replace(/"text"\s*:/g, "")
          .replace(/"products"\s*:\s*\[[\s\S]*?\]/g, "")
          .replace(/[{}"]/g, "")
          .replace(/,\s*$/gm, "")
          .trim();
        parsed = { text: cleanText || "Xin lỗi, thử lại nhé!", products: [] };
      }

      // Map id sang sản phẩm thực để lấy ảnh
      const suggestedProducts = (parsed.products || [])
        .map(sp => {
          const real = products.find(p => p.id === Number(sp.id));
          return real ? { ...sp, ...real } : null;
        })
        .filter(p => p && p.stock > 0)
        .slice(0, 3);

      setMsgs(prev => [...prev, {
        role: "assistant",
        content: parsed.text || "Xin lỗi, thử lại nhé!",
        products: suggestedProducts,
        rawText: parsed.text || raw,
      }]);
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: "⚠️ Lỗi kết nối. Thử lại nhé!", products: [] }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, width: 56, height: 56,
          borderRadius: "50%", background: "var(--brand)", border: "none",
          cursor: "pointer", fontSize: 22, zIndex: 200,
          boxShadow: "0 4px 24px rgba(232,57,14,.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform .2s",
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
        }}
        aria-label="Chat tư vấn"
      >{open ? "✕" : "💬"}</button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 94, right: 24,
          width: "min(370px, calc(100vw - 32px))",
          height: "min(540px, calc(100vh - 110px))",
          background: "var(--s)", border: "1px solid var(--b)", borderRadius: 20,
          display: "flex", flexDirection: "column", zIndex: 200,
          boxShadow: "0 16px 56px rgba(0,0,0,.18)", overflow: "hidden",
          animation: "fadeInUp .2s ease",
        }}>
          {/* Header */}
          <div style={{ background: "var(--brand)", padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, background: "rgba(255,255,255,.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🐾</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: .3 }}>Trợ Lý PawShop</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,.8)" }}>
                {loading ? "⌛ Đang tư vấn..." : "● Sẵn sàng tư vấn"}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 13px", display: "flex", flexDirection: "column", gap: 10, background: "var(--s2)" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 7, alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                {/* Bubble */}
                {m.content && (
                  <div className={m.role === "user" ? "cU" : "cB"} style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
                    {m.content}
                  </div>
                )}
                {/* Product cards */}
                {m.products && m.products.length > 0 && (
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, maxWidth: "100%", scrollbarWidth: "thin" }}>
                    {m.products.map(p => (
                      <ChatProductCard key={p.id} p={p} onAdd={onAddCart} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: "flex" }}>
                <div className="cB" style={{ display: "flex", gap: 4, alignItems: "center", padding: "10px 14px" }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 7, height: 7, background: "var(--ink4)", borderRadius: "50%", display: "inline-block", animation: `bounce .9s ${i * .2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick suggests — chỉ show ở tin nhắn đầu */}
          {msgs.length <= 1 && !loading && (
            <div style={{ padding: "8px 12px 4px", background: "var(--s2)", display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
              {quickSuggests.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 20,
                    border: "1.5px solid var(--brand)", background: "var(--s)",
                    color: "var(--brand)", cursor: "pointer", fontFamily: "inherit",
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => { e.target.style.background = "var(--brand)"; e.target.style.color = "#fff"; }}
                  onMouseLeave={e => { e.target.style.background = "var(--s)"; e.target.style.color = "var(--brand)"; }}
                >{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid var(--b)", display: "flex", gap: 8, background: "var(--s)", flexShrink: 0 }}>
            <input
              className="inp"
              style={{ flex: 1, padding: "9px 12px", fontSize: 13 }}
              placeholder="Hỏi về sản phẩm, chăm sóc thú cưng..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            />
            <button
              className="btn bP sm"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{ flexShrink: 0, opacity: (loading || !input.trim()) ? 0.5 : 1 }}
            >→</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%,80%,100%{transform:translateY(0)}
          40%{transform:translateY(-6px)}
        }
        @keyframes fadeInUp {
          from{opacity:0;transform:translateY(16px)}
          to{opacity:1;transform:translateY(0)}
        }
      `}</style>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [showAuth, setShowAuth] = useState(false);
  const [cart, setCart] = useState(() => { try { const s = localStorage.getItem("ps_cart_guest"); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [products, setProducts] = useState([]);
  const [prodTotal, setProdTotal] = useState(0);
  const [loadingP, setLoadingP] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [shopPage, setShopPage] = useState(1);
  const [homePage, setHomePage] = useState(1);
  const [cartPage, setCartPage] = useState(1);
  const [payStep, setPayStep] = useState(1);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherData, setVoucherData] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [availVouchers, setAvailVouchers] = useState([]);
  const [showVoucherPicker, setShowVoucherPicker] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderDone, setOrderDone] = useState(null);
  const [vnpayResult, setVnpayResult] = useState(null);
  const [navSearch, setNavSearch] = useState("");
  const [showNavSearch, setShowNavSearch] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [info, setInfo] = useState({ name: "", phone: "", address: "", note: "" });
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState("info");
  const showToast = useCallback((msg, type = "info") => { setToast(msg); setToastType(type); setTimeout(() => setToast(null), 3000); }, []);

  useEffect(() => {
    if (window.location.pathname === "/oauth-callback") {
      const token = new URLSearchParams(window.location.search).get("token");
      if (token) { saveToken(token); authAPI.me().then(u => { setUser(u); window.history.replaceState({}, "", "/"); showToast(`Chào ${u.name}!`, "success"); }); }
      return;
    }

    const sp = new URLSearchParams(window.location.search);
    const payResult = sp.get("payment");
    if (payResult) {
      window.history.replaceState({}, "", "/");
      if (payResult === "success") {
        const orderCode = sp.get("order") || "";
        setPage("vnpay-result");
        setVnpayResult({ success: true, orderCode, ref: sp.get("ref") || "" });
        try {
          const flag = JSON.parse(sessionStorage.getItem("ps_pending_vnpay") || "{}");
          if (flag.clearCart) {
            setCart([]);
            setVoucherCode("");
            setVoucherData(null);
            if (flag.userId) localStorage.removeItem(`ps_cart_${flag.userId}`);
            localStorage.removeItem("ps_cart_guest");
            sessionStorage.removeItem("ps_pending_vnpay");
          }
        } catch {}
      } else {
        const code = sp.get("code") || "";
        setPage("vnpay-result");
        setVnpayResult({
          success: false, orderCode: sp.get("order") || "", code,
          reason: code === "24" ? "Bạn đã hủy giao dịch"
            : code === "51" ? "Tài khoản không đủ số dư"
              : code === "65" ? "Vượt quá hạn mức giao dịch trong ngày"
                : code === "75" ? "Ngân hàng đang bảo trì"
                  : "Thanh toán không thành công (mã: " + code + ")"
        });
      }
    }

    if (hasToken()) authAPI.me().then(u => {
      setUser(u);
      try {
        const guest = JSON.parse(localStorage.getItem("ps_cart_guest") || "[]");
        const saved = JSON.parse(localStorage.getItem(`ps_cart_${u.id}`) || "[]");
        if (guest.length || saved.length) {
          const merged = [...saved];
          guest.forEach(g => {
            const ex = merged.find(x => x.id === g.id);
            if (ex) ex.qty = Math.max(ex.qty, g.qty);
            else merged.push(g);
          });
          setCart(merged);
          localStorage.removeItem("ps_cart_guest");
        }
      } catch { }
    }).catch(() => clearToken());
  }, []);

  useEffect(() => { setShopPage(1); }, [filter, search]);

  useEffect(() => {
    const key = user ? `ps_cart_${user.id}` : "ps_cart_guest";
    try { localStorage.setItem(key, JSON.stringify(cart)); } catch { }
  }, [cart, user]);

  useEffect(() => {
    if (page === "cart") {
      setShowVoucherPicker(false);
      (voucherAPI.getPublic || voucherAPI.getAll)().then(v => setAvailVouchers(Array.isArray(v) ? v : [])).catch(() => setAvailVouchers([]));
    }
  }, [page]);

  useEffect(() => {
    const p = { limit: PAGE_SIZE_SHOP, page: shopPage };
    if (filter !== "all") p.category = filter; if (search) p.search = search;
    setLoadingP(true);
    productAPI.getAll(p).then(d => { setProducts(d.products || []); setProdTotal(d.total || d.products?.length || 0); }).catch(() => showToast("Không tải được sản phẩm", "error")).finally(() => setLoadingP(false));
  }, [filter, search, shopPage]);

  const addCart = p => { setCart(c => { const ex = c.find(x => x.id === p.id); return ex ? c.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x) : [...c, { ...p, qty: 1 }]; }); showToast(`Đã thêm "${p.name}"!`, "success"); setCartPage(1); };
  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const cartCount = cart.reduce((s, x) => s + x.qty, 0);
  const logout = () => {
    try { if (user) localStorage.setItem(`ps_cart_${user.id}`, JSON.stringify(cart)); } catch { }
    clearToken(); setUser(null); setPage("home"); setCart([]); showToast("Đã đăng xuất!");
  };
  const discount = voucherData ? voucherData.discount : 0;
  const finalTotal = Math.max(0, total - discount);
  const freeShip = finalTotal >= 500000;

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    try {
      const res = await voucherAPI.validate(voucherCode.trim(), total);
      setVoucherData(res);
      showToast(`✅ Áp dụng mã thành công! Giảm ${fmt(res.discount)}`, "success");
    } catch (e) {
      setVoucherData(null);
      showToast("❌ " + e.message, "error");
    }
    setVoucherLoading(false);
  };

  const placeOrder = async method => {
    setPlacingOrder(true);
    try {
      const { order } = await orderAPI.create({
        items: cart.map(x => ({ product_id: x.id, quantity: x.qty })),
        receiver_name: info.name,
        receiver_phone: info.phone,
        address: info.address,
        payment_method: method,
        note: info.note,
        voucher_code: voucherData ? voucherCode : undefined,
        discount: discount,
      });
      if (method === "vnpay") {
        const { payUrl } = await paymentAPI.createVNPay(order.id);
        try {
          sessionStorage.setItem("ps_pending_vnpay", JSON.stringify({
            userId: user?.id,
            clearCart: true,
          }));
        } catch {}
        window.location.href = payUrl;
      } else {
        setOrderDone({ ...order, items: cart, total: finalTotal, discount });
        setCart([]);
        setPayStep(1);
        setInfo({ name: "", phone: "", address: "", note: "" });
        setVoucherCode("");
        setVoucherData(null);
        setPage("order-done");
      }
    } catch (e) { showToast("❌ " + e.message, "error"); }
    setPlacingOrder(false);
  };

  if (user?.role === "admin") return (<><AdminDashboard user={user} onLogout={logout} showToast={showToast} /><Toast msg={toast} type={toastType} /></>);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", minHeight: "100vh", background: "var(--s2)", color: "var(--ink)" }}>
      <Toast msg={toast} type={toastType} />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={u => {
        setUser(u);
        try {
          const guest = JSON.parse(localStorage.getItem("ps_cart_guest") || "[]");
          const saved = JSON.parse(localStorage.getItem(`ps_cart_${u.id}`) || "[]");
          if (guest.length || saved.length) {
            const merged = [...saved];
            guest.forEach(g => { const ex = merged.find(x => x.id === g.id); if (ex) ex.qty = Math.max(ex.qty, g.qty); else merged.push(g); });
            setCart(merged);
            localStorage.removeItem("ps_cart_guest");
            if (merged.length) showToast(`🛒 Giỏ hàng đã được khôi phục (${merged.reduce((s, x) => s + x.qty, 0)} sản phẩm)!`, "success");
          }
        } catch { }
      }} showToast={showToast} />}

      <nav style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--b)", padding: "0 20px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, gap: 12 }}>
        <div onClick={() => { setPage("home"); setMobileMenu(false); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, background: "var(--brand)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🐾</div>
          <span className="DM" style={{ fontSize: 17, color: "var(--ink)" }}>PAWSHOP</span>
        </div>
        <div className="nav-search">
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: 12, fontSize: 14, color: "var(--ink4)", pointerEvents: "none" }}>🔍</span>
            <input className="inp" style={{ paddingLeft: 36, paddingRight: navSearch ? 36 : 14, fontSize: 13, height: 38, background: "var(--s2)" }} placeholder="Tìm sản phẩm..." value={navSearch}
              onChange={e => { setNavSearch(e.target.value); if (e.target.value) { setPage("shop"); setSearch(e.target.value); } }}
              onKeyDown={e => { if (e.key === "Enter" && navSearch) { setPage("shop"); setSearch(navSearch); } }}
            />
            {navSearch && <button onClick={() => { setNavSearch(""); setSearch(""); }} style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--ink4)" }}>✕</button>}
          </div>
        </div>
        <div className="nav-links">
          {[["home", "Trang Chủ"], ["shop", "Sản Phẩm"], ["cart", `Giỏ Hàng${cartCount > 0 ? ` (${cartCount})` : ""}`]].map(([p, l]) => (
            <span key={p} className={`nL ${page === p ? 'on' : ''}`} onClick={() => setPage(p)}>{l}</span>
          ))}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 8, paddingLeft: 12, borderLeft: "1px solid var(--b)" }}>
              <div style={{ width: 32, height: 32, background: "var(--brand)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>{user.name[0]}</div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</span>
              <button className="btn bS sm" onClick={logout}>Đăng Xuất</button>
            </div>
          ) : (
            <button className="btn bP sm" style={{ marginLeft: 8 }} onClick={() => setShowAuth(true)}>Đăng Nhập</button>
          )}
        </div>
        <button className="hamburger" onClick={() => setMobileMenu(m => !m)} aria-label="Menu">
          {mobileMenu ? "✕" : "☰"}
        </button>
      </nav>

      {mobileMenu && (
        <div className="mobile-menu">
          <div style={{ position: "relative", marginBottom: 8 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--ink4)" }}>🔍</span>
            <input className="inp" style={{ paddingLeft: 36, width: "100%", boxSizing: "border-box", fontSize: 14, height: 42 }} placeholder="Tìm sản phẩm..."
              value={navSearch}
              onChange={e => { setNavSearch(e.target.value); if (e.target.value) { setPage("shop"); setSearch(e.target.value); } }}
              onKeyDown={e => { if (e.key === "Enter" && navSearch) { setPage("shop"); setSearch(navSearch); setMobileMenu(false); } }}
            />
          </div>
          {[["home", "🏠 Trang Chủ"], ["shop", "👟 Sản Phẩm"], ["cart", `🛒 Giỏ Hàng${cartCount > 0 ? ` (${cartCount})` : ""}`]].map(([p, l]) => (
            <span key={p} className={`nL ${page === p ? 'on' : ''}`} onClick={() => { setPage(p); setMobileMenu(false); }} style={{ display: "block", padding: "10px 12px", borderRadius: 8, fontSize: 15 }}>{l}</span>
          ))}
          <div style={{ borderTop: "1px solid var(--b)", marginTop: 8, paddingTop: 8 }}>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, background: "var(--brand)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>{user.name[0]}</div>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</span>
                </div>
                <button className="btn bS sm" onClick={() => { logout(); setMobileMenu(false); }}>Đăng Xuất</button>
              </div>
            ) : (
              <button className="btn bP" style={{ width: "100%" }} onClick={() => { setShowAuth(true); setMobileMenu(false); }}>Đăng Nhập</button>
            )}
          </div>
        </div>
      )}

      {page === "home" && (
        <div>
          <div style={{ background: "#0F0F0F", padding: "80px 32px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: "linear-gradient(135deg,rgba(232,57,14,.13),rgba(232,57,14,.03))", clipPath: "polygon(20% 0,100% 0,100% 100%,0% 100%)" }} />
            <div style={{ position: "absolute", bottom: -40, right: "10%", width: 300, height: 300, background: "radial-gradient(circle,rgba(232,57,14,.15),transparent 70%)", pointerEvents: "none" }} />
            <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
              <div className="fu">
                <span style={{ background: "var(--brand)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 100, letterSpacing: 2, textTransform: "uppercase" }}>Cửa Hàng Thú Cưng #1 Việt Nam</span>
                <h1 className="D" style={{ fontSize: "clamp(52px,8vw,100px)", lineHeight: .95, marginTop: 16, marginBottom: 16, color: "#fff" }}>
                  YÊU THƯƠNG<br /><span style={{ WebkitTextStroke: "2px #E8390E", WebkitTextFillColor: "transparent" }}>THÚ CƯNG</span><br />MỖI NGÀY
                </h1>
                <p style={{ color: "#9CA3AF", maxWidth: 480, fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>Chăm sóc người bạn bốn chân với sản phẩm chất lượng, an toàn cho thú cưng.</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button className="btn bP" style={{ padding: "14px 32px", fontSize: 15 }} onClick={() => setPage("shop")}>Mua Ngay →</button>
                  {!user && <button onClick={() => setShowAuth(true)} className="btn bS" style={{ padding: "14px 24px", fontSize: 15, background: "transparent", color: "#fff", borderColor: "#555" }}>Đăng Nhập</button>}
                </div>
              </div>
            </div>
          </div>
          <div style={{ background: "var(--brand)", padding: "20px 32px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1 }}>
              {[["50.000+", "Khách hàng tin dùng"], ["200+", "Sản phẩm thú cưng"], ["5★", "Đánh giá trung bình"]].map(([n, l]) => (
                <div key={l} style={{ textAlign: "center" }}><div className="D" style={{ fontSize: 32, color: "#fff" }}>{n}</div><div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 500, marginTop: 2 }}>{l}</div></div>
              ))}
            </div>
          </div>
          <div style={{ padding: "56px 32px", maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
              <div><p style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Nổi Bật</p><h2 className="D" style={{ fontSize: 38 }}>SẢN PHẨM NỔI BẬT</h2></div>
              <button className="btn bS" onClick={() => setPage("shop")}>Xem tất cả →</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 }}>
              {loadingP ? [1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />) : products.slice((homePage - 1) * PAGE_SIZE_HOME, homePage * PAGE_SIZE_HOME).map((p, i) => (
                <div key={p.id} onClick={() => { setSelectedProduct(p.id); setPage("product"); window.scrollTo({ top: 0 }); }}><ProductCard p={p} onAdd={addCart} animDelay={(i % 6) * .06} /></div>
              ))}
            </div>
            <Pagination page={homePage} total={products.length} pageSize={PAGE_SIZE_HOME} onChange={p => { setHomePage(p); window.scrollTo({ top: 400, behavior: "smooth" }); }} />
          </div>
          <div style={{ background: "var(--s3)", borderTop: "1px solid var(--b)", borderBottom: "1px solid var(--b)", padding: "52px 32px", textAlign: "center" }}>
            <h2 className="D" style={{ fontSize: 40, marginBottom: 10 }}>YÊU THƯƠNG BẮT ĐẦU <span style={{ color: "var(--brand)" }}>TỪ ĐÂY</span></h2>
            <p style={{ color: "var(--ink3)", marginBottom: 24, fontSize: 15 }}>Đăng ký nhận ưu đãi đặc biệt và tips chăm sóc thú cưng.</p>
            <button className="btn bP" style={{ padding: "14px 36px", fontSize: 15 }} onClick={() => setShowAuth(true)}>Đăng Ký Miễn Phí</button>
          </div>
        </div>
      )}

      {page === "shop" && (
        <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}><h1 className="D" style={{ fontSize: 40, marginBottom: 4 }}>CỬA HÀNG THÚ CƯNG</h1><p style={{ color: "var(--ink3)", fontSize: 14 }}>Khám phá sản phẩm dành cho thú cưng của bạn</p></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["all", "Tất Cả"], ["thuc-an", "Thức Ăn"], ["phu-kien", "Phụ Kiện"], ["do-choi", "Đồ Chơi"], ["suc-khoe", "Sức Khỏe"], ["chuong", "Chuồng"]].map(([v, l]) => <span key={v} className={`tag ${filter === v ? 'on' : ''}`} onClick={() => setFilter(v)}>{l}</span>)}
            </div>
            <input className="inp" style={{ maxWidth: 240 }} placeholder="🔍 Tìm sản phẩm..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loadingP ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 20 }}>{[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}</div> :
            products.length === 0 ? <div style={{ textAlign: "center", padding: "80px 20px" }}><div style={{ fontSize: 52, marginBottom: 12 }}>🔍</div><p style={{ color: "var(--ink3)", fontSize: 16, fontWeight: 600 }}>Không tìm thấy sản phẩm</p><button className="btn bS" style={{ marginTop: 16 }} onClick={() => { setFilter("all"); setSearch(""); }}>Xóa bộ lọc</button></div> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
                {products.map((p, i) => (
                  <div key={p.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedProduct(p.id); setPage("product"); window.scrollTo({ top: 0 }); }}><ProductCard p={p} onAdd={addCart} animDelay={(i % 6) * .06} showDesc /></div>
                ))}
              </div>
            )}
          <Pagination page={shopPage} total={prodTotal} pageSize={PAGE_SIZE_SHOP} onChange={p => { setShopPage(p); window.scrollTo({ top: 80, behavior: "smooth" }); }} />
        </div>
      )}

      {page === "product" && selectedProduct && (
        <ProductDetail
          productId={selectedProduct}
          onBack={() => { setPage("shop"); setSelectedProduct(null); }}
          onAddCart={addCart}
          user={user}
          showToast={showToast}
        />
      )}

      {page === "cart" && (
        <div style={{ padding: "32px 24px", maxWidth: 960, margin: "0 auto" }}>
          <div style={{ marginBottom: 28 }}>
            <h1 className="D" style={{ fontSize: 38, marginBottom: 16 }}>
              {payStep === 1 ? "GIỎ HÀNG" : payStep === 2 ? "THÔNG TIN GIAO HÀNG" : "THANH TOÁN"}
            </h1>
            {cart.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 0, maxWidth: 400 }}>
                {[["1", "Giỏ hàng"], ["2", "Thông tin"], ["3", "Thanh toán"]].map(([s, l], i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800,
                        background: payStep >= +s ? "var(--brand)" : "var(--s3)",
                        color: payStep >= +s ? "#fff" : "var(--ink4)",
                        border: `2px solid ${payStep >= +s ? 'var(--brand)' : 'var(--b)'}`
                      }}>
                        {payStep > +s ? "✓" : s}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: payStep >= +s ? "var(--ink)" : "var(--ink4)", whiteSpace: "nowrap" }}>{l}</span>
                    </div>
                    {i < 2 && <div style={{ flex: 1, height: 2, background: payStep > +s ? "var(--brand)" : "var(--b)", margin: "0 8px" }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "72px 20px" }}>
              <div style={{ width: 80, height: 80, background: "var(--s3)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 18px" }}>🛒</div>
              <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Giỏ hàng của bạn trống</p>
              <p style={{ color: "var(--ink3)", fontSize: 14, marginBottom: 24 }}>Hãy thêm sản phẩm để tiến hành mua sắm</p>
              <button className="btn bP" onClick={() => setPage("shop")}>Khám Phá Sản Phẩm →</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {payStep === 1 && <>
                  {cart.map(item => (
                    <div key={item.id} className="card-item">
                      <div style={{ width: 72, height: 72, background: "var(--s3)", borderRadius: 12, flexShrink: 0, overflow: "hidden", border: "1px solid var(--b)", aspectRatio: "1/1" }}>
                        {item.image
                          ? <img src={getImageUrl(item.image)} alt={item.name} onError={e => { e.target.style.display = "none"; }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📦</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{item.name}</p>
                        <p style={{ color: "var(--brand)", fontWeight: 800, fontSize: 15 }}>{fmt(item.price)}</p>
                        {item.original_price > item.price && <p style={{ fontSize: 11, color: "var(--ink4)", textDecoration: "line-through" }}>{fmt(item.original_price)}</p>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--b)", borderRadius: 8, padding: "4px 8px", background: "var(--s2)" }}>
                        <button onClick={() => setCart(c => c.map(x => x.id === item.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1, color: "var(--ink3)", padding: "0 2px" }}>−</button>
                        <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700, fontSize: 14 }}>{item.qty}</span>
                        <button onClick={() => setCart(c => c.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1, color: "var(--ink3)", padding: "0 2px" }}>+</button>
                      </div>
                      <span style={{ fontWeight: 800, minWidth: 100, textAlign: "right", fontSize: 14 }}>{fmt(item.price * item.qty)}</span>
                      <button onClick={() => setCart(c => c.filter(x => x.id !== item.id))} style={{ background: "var(--s3)", border: "none", color: "var(--ink4)", cursor: "pointer", width: 28, height: 28, borderRadius: "50%", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }} onMouseEnter={e => e.target.style.background = "#FEE2E2"} onMouseLeave={e => e.target.style.background = "var(--s3)"}>✕</button>
                    </div>
                  ))}
                  <button className="btn bS sm" style={{ alignSelf: "flex-start" }} onClick={() => setPage("shop")}>← Tiếp Tục Mua Sắm</button>
                </>}

                {payStep === 2 && (
                  <div className="card-p">
                    <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>📦 Thông Tin Giao Hàng</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink3)", marginBottom: 4, display: "block" }}>Họ và tên *</label>
                          <input className="inp" placeholder="Nguyễn Văn A" value={info.name} onChange={e => setInfo(o => ({ ...o, name: e.target.value }))} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink3)", marginBottom: 4, display: "block" }}>Số điện thoại *</label>
                          <input className="inp" placeholder="0901234567" value={info.phone} onChange={e => setInfo(o => ({ ...o, phone: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink3)", marginBottom: 4, display: "block" }}>Địa chỉ giao hàng *</label>
                        <input className="inp" placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP" value={info.address} onChange={e => setInfo(o => ({ ...o, address: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink3)", marginBottom: 4, display: "block" }}>Ghi chú cho shipper</label>
                        <textarea className="inp" placeholder="Giao giờ hành chính, gọi trước khi giao, để trước cửa..." value={info.note} onChange={e => setInfo(o => ({ ...o, note: e.target.value }))} style={{ minHeight: 72, resize: "vertical" }} />
                      </div>
                    </div>
                    <button className="btn bG sm" style={{ marginTop: 16 }} onClick={() => setPayStep(1)}>← Quay lại giỏ hàng</button>
                  </div>
                )}

                {payStep === 3 && (
                  <div className="card-p">
                    <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 18 }}>💳 Chọn Phương Thức Thanh Toán</h3>
                    <div style={{ border: "2px solid var(--brand)", borderRadius: 14, padding: "18px 20px", marginBottom: 12, cursor: "pointer", background: "#FFF7F5" }}
                      onClick={() => !placingOrder && placeOrder("cod")}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 48, height: 48, background: "var(--brand)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>💵</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 800, fontSize: 15 }}>Thanh Toán Khi Nhận Hàng (COD)</p>
                          <p style={{ fontSize: 12, color: "var(--ink3)", marginTop: 3 }}>Kiểm tra hàng trước khi thanh toán. Miễn phí đổi trả trong 7 ngày.</p>
                        </div>
                        <div style={{ fontSize: 22 }}>→</div>
                      </div>
                    </div>
                    <div style={{ border: "2px solid var(--b)", borderRadius: 14, padding: "18px 20px", cursor: "pointer", background: "var(--s2)", transition: "border-color .2s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--brand)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--b)"}
                      onClick={() => !placingOrder && placeOrder("vnpay")}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 48, height: 48, background: "#0F70B7", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏦</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 800, fontSize: 15 }}>Thanh Toán Online qua VNPay</p>
                          <p style={{ fontSize: 12, color: "var(--ink3)", marginTop: 3 }}>ATM, Visa/Mastercard, QR Code, Ví điện tử. Xử lý tức thì.</p>
                        </div>
                        <div style={{ fontSize: 22 }}>→</div>
                      </div>
                    </div>
                    {placingOrder && <div style={{ textAlign: "center", padding: "16px 0", color: "var(--ink3)", fontSize: 14 }}>⏳ Đang xử lý đơn hàng...</div>}
                    <button className="btn bG sm" style={{ marginTop: 16 }} onClick={() => setPayStep(2)}>← Quay lại</button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 80 }}>
                <div className="card-22">
                  <h3 style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--b)" }}>
                    🛒 Đơn Hàng ({cart.reduce((s, x) => s + x.qty, 0)} sản phẩm)
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 220, overflowY: "auto" }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 40, height: 40, background: "var(--s3)", borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid var(--b)" }}>
                          {item.image ? <img src={getImageUrl(item.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                          <p style={{ fontSize: 11, color: "var(--ink4)" }}>x{item.qty}</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{fmt(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-22">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 800 }}>🎟️ Mã Giảm Giá</p>
                    {voucherData && (
                      <button onClick={() => { setVoucherData(null); setVoucherCode(""); }}
                        style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", background: "#FEF2F2", border: "none", cursor: "pointer", padding: "3px 10px", borderRadius: 8 }}>
                        Bỏ mã
                      </button>
                    )}
                  </div>
                  {voucherData ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F0FDF4", border: "2px solid #86EFAC", borderRadius: 12, padding: "12px 14px" }}>
                      <span style={{ fontSize: 24 }}>🎉</span>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 14, color: "#16A34A", letterSpacing: 1 }}>{voucherCode}</p>
                        <p style={{ fontSize: 12, color: "#15803D", marginTop: 2 }}>Tiết kiệm <strong>{fmt(voucherData.discount)}</strong></p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        <input className="inp" style={{ flex: 1, fontSize: 13, letterSpacing: 1, fontWeight: 600, textTransform: "uppercase" }}
                          placeholder="Nhập mã voucher..."
                          value={voucherCode}
                          onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === "Enter" && applyVoucher()}
                        />
                        <button className="btn bP sm" onClick={applyVoucher}
                          disabled={voucherLoading || !voucherCode.trim()} style={{ flexShrink: 0 }}>
                          {voucherLoading ? "⏳" : "Áp dụng"}
                        </button>
                      </div>
                      {availVouchers.length > 0 && (
                        <>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink4)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>
                            Mã khả dụng ({availVouchers.length})
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                            {availVouchers.map(v => {
                              const canUse = total >= (v.min_order || 0);
                              const discAmt = v.type === "percent"
                                ? Math.round(total * v.value / 100)
                                : Math.min(+v.value, total);
                              const expiresIn = v.expires_at
                                ? Math.ceil((new Date(v.expires_at) - new Date()) / 86400000)
                                : null;
                              return (
                                <div key={v.id}
                                  onClick={() => {
                                    if (!canUse) return;
                                    setVoucherCode(v.code);
                                    setVoucherLoading(true);
                                    voucherAPI.validate(v.code, total)
                                      .then(res => { setVoucherData(res); showToast(`✅ ${v.code} — giảm ${fmt(res.discount)}`, "success"); })
                                      .catch(e => showToast("❌ " + e.message, "error"))
                                      .finally(() => setVoucherLoading(false));
                                  }}
                                  style={{
                                    display: "flex", gap: 10, padding: "10px 12px",
                                    border: `2px ${canUse ? 'dashed' : 'solid'} ${canUse ? 'var(--brand)' : 'var(--b)'}`,
                                    borderRadius: 12, background: canUse ? "#FFF7F5" : "var(--s2)",
                                    cursor: canUse ? "pointer" : "default",
                                    opacity: canUse ? 1 : .5, transition: "box-shadow .15s",
                                  }}
                                  onMouseEnter={e => { if (canUse) e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,57,14,.15)"; }}
                                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
                                >
                                  <div style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                    background: canUse ? "var(--brand)" : "var(--s3)",
                                    color: canUse ? "#fff" : "var(--ink4)",
                                    borderRadius: 8, padding: "6px 10px", flexShrink: 0, minWidth: 52, textAlign: "center"
                                  }}>
                                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: .5, opacity: .85 }}>GIẢM</span>
                                    <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.1 }}>
                                      {v.type === "percent" ? `${v.value}%` : fmt(v.value).replace("₫", "").trim()}
                                    </span>
                                    {v.type === "fixed" && <span style={{ fontSize: 9, fontWeight: 700 }}>₫</span>}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                      <span style={{ fontWeight: 800, fontSize: 13, color: canUse ? "var(--brand)" : "var(--ink3)", letterSpacing: .5 }}>{v.code}</span>
                                      {voucherCode === v.code && <span style={{ fontSize: 10, background: "var(--brand)", color: "#fff", padding: "1px 6px", borderRadius: 100, fontWeight: 700 }}>Đang chọn</span>}
                                    </div>
                                    <p style={{ fontSize: 11, color: canUse ? "var(--ink2)" : "var(--ink4)", fontWeight: canUse ? 600 : 400 }}>
                                      {canUse ? <>Tiết kiệm <strong style={{ color: "var(--brand)" }}>{fmt(discAmt)}</strong></> : `Đơn tối thiểu ${fmt(v.min_order)}`}
                                    </p>
                                    {expiresIn !== null && (
                                      <p style={{ fontSize: 10, color: expiresIn <= 3 ? "#DC2626" : "var(--ink4)", marginTop: 2, fontWeight: expiresIn <= 3 ? 700 : 400 }}>
                                        {expiresIn <= 0 ? "Hết hạn hôm nay" : expiresIn <= 3 ? `⚠️ Còn ${expiresIn} ngày` : `HSD: ${new Date(v.expires_at).toLocaleDateString("vi-VN")}`}
                                      </p>
                                    )}
                                    {v.max_uses && <p style={{ fontSize: 10, color: "var(--ink4)", marginTop: 1 }}>Còn {v.max_uses - v.used_count} lượt</p>}
                                  </div>
                                  {canUse && (
                                    <div style={{ alignSelf: "center", flexShrink: 0 }}>
                                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--brand)", background: "#FFF7F5", border: "1px solid var(--brand)", padding: "4px 10px", borderRadius: 8 }}>Chọn</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="card-22">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      ["Tạm tính", fmt(total), "var(--ink2)"],
                      ["Vận chuyển", freeShip ? "Miễn phí" : "30.000₫", freeShip ? "#16A34A" : "var(--ink2)"],
                      ...(discount > 0 ? [["Giảm giá", `-${fmt(discount)}`, "#16A34A"]] : []),
                    ].map(([l, v, c]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                        <span style={{ color: "var(--ink3)" }}>{l}</span>
                        <span style={{ fontWeight: 600, color: c }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1.5px solid var(--b)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>Tổng cộng</span>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 900, fontSize: 22, color: "var(--brand)" }}>{fmt(finalTotal + (freeShip ? 0 : 30000))}</span>
                        {discount > 0 && <p style={{ fontSize: 11, color: "#16A34A", fontWeight: 600 }}>Tiết kiệm {fmt(discount)}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {payStep === 1 && (
                  <>
                    <button className="btn bP" style={{ justifyContent: "center", padding: "14px", fontSize: 15, fontWeight: 800 }}
                      onClick={() => { if (!user) { setShowAuth(true); showToast("Vui lòng đăng nhập để đặt hàng!", "error"); return; } setPayStep(2); }}>
                      {user ? "Tiếp Tục →" : "🔐 Đăng nhập để đặt hàng"}
                    </button>
                    {!user && <p style={{ fontSize: 12, color: "var(--ink4)", textAlign: "center", marginTop: -4 }}>Giỏ hàng sẽ được lưu lại sau khi đăng nhập</p>}
                  </>
                )}
                {payStep === 2 && (
                  <button className="btn bP" style={{ justifyContent: "center", padding: "14px", fontSize: 15, fontWeight: 800 }}
                    onClick={() => { if (!info.name || !info.phone || !info.address) { showToast("Vui lòng điền đầy đủ thông tin!", "error"); return; } setPayStep(3); }}>
                    Chọn Thanh Toán →
                  </button>
                )}
                <p style={{ fontSize: 11, color: "var(--ink4)", textAlign: "center" }}>🔒 Thông tin được bảo mật SSL 256-bit</p>
              </div>
            </div>
          )}
        </div>
      )}

      {page === "order-done" && orderDone && (
        <div style={{ padding: "60px 24px", maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: 80, height: 80, background: "#F0FDF4", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 20px", border: "3px solid #86EFAC" }}>✅</div>
          <h1 className="D" style={{ fontSize: 36, color: "#16A34A", marginBottom: 8 }}>ĐẶT HÀNG THÀNH CÔNG!</h1>
          <p style={{ color: "var(--ink3)", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>Cảm ơn bạn đã mua sắm tại <strong>PawShop</strong>.<br />Chúng tôi sẽ xử lý đơn hàng trong vòng 24 giờ.</p>
          <div className="card-p" style={{ textAlign: "left", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--b)" }}>
              <div>
                <p style={{ fontSize: 12, color: "var(--ink4)", fontWeight: 600 }}>Mã đơn hàng</p>
                <p style={{ fontWeight: 800, fontSize: 16, color: "var(--brand)" }}>#{orderDone.order_code || orderDone.id}</p>
              </div>
              <span className="st" style={{ background: "#FFF7ED", color: "var(--brand)", fontWeight: 700 }}>⏳ Chờ xác nhận</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {orderDone.items?.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <span style={{ color: "var(--ink2)" }}>{item.name} <span style={{ color: "var(--ink4)" }}>x{item.qty}</span></span>
                  <span style={{ fontWeight: 700 }}>{fmt(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            {orderDone.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16A34A", fontWeight: 600, marginBottom: 6 }}><span>Giảm giá</span><span>-{fmt(orderDone.discount)}</span></div>}
            <div style={{ borderTop: "1px solid var(--b)", paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16 }}>
              <span>Tổng thanh toán</span>
              <span style={{ color: "var(--brand)" }}>{fmt(orderDone.total)}</span>
            </div>
          </div>
          <div style={{ background: "var(--s2)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, fontSize: 13, textAlign: "left", border: "1px solid var(--b)" }}>
            <p style={{ fontWeight: 700, marginBottom: 6 }}>📦 Địa chỉ giao hàng</p>
            <p style={{ color: "var(--ink3)" }}>{info.address}</p>
            <p style={{ color: "var(--ink3)", marginTop: 4 }}>📞 {info.phone} · 👤 {info.name}</p>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn bP" onClick={() => setPage("shop")}>Tiếp Tục Mua Sắm →</button>
            <button className="btn bS" onClick={() => setPage("home")}>Về Trang Chủ</button>
          </div>
        </div>
      )}

      {page === "vnpay-result" && vnpayResult && (
        <div style={{ padding: "60px 24px", maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          {vnpayResult.success ? (
            <>
              <div style={{ width: 80, height: 80, background: "#F0FDF4", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 20px", border: "3px solid #86EFAC" }}>✅</div>
              <h1 className="D" style={{ fontSize: 36, color: "#16A34A", marginBottom: 8 }}>THANH TOÁN THÀNH CÔNG!</h1>
              <p style={{ color: "var(--ink3)", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
                Đơn hàng <strong style={{ color: "var(--brand)" }}>#{vnpayResult.orderCode}</strong> đã được xác nhận.<br />
                Chúng tôi sẽ giao hàng sớm nhất có thể.
              </p>
              <div className="card-p" style={{ textAlign: "left", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: "var(--ink3)" }}>Mã đơn hàng</span>
                  <span style={{ fontWeight: 800, color: "var(--brand)" }}>#{vnpayResult.orderCode}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: "var(--ink3)" }}>Mã giao dịch VNPay</span>
                  <span style={{ fontWeight: 600, fontSize: 12, color: "var(--ink4)" }}>{vnpayResult.ref}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--ink3)" }}>Trạng thái thanh toán</span>
                  <span style={{ fontWeight: 700, color: "#16A34A" }}>✓ Đã thanh toán</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn bP" onClick={() => setPage("shop")}>Tiếp Tục Mua Sắm →</button>
                <button className="btn bS" onClick={() => setPage("home")}>Về Trang Chủ</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ width: 80, height: 80, background: "#FEF2F2", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 20px", border: "3px solid #FCA5A5" }}>❌</div>
              <h1 className="D" style={{ fontSize: 36, color: "#DC2626", marginBottom: 8 }}>THANH TOÁN THẤT BẠI</h1>
              <p style={{ color: "var(--ink3)", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
                {vnpayResult.reason}
                {vnpayResult.orderCode && <><br />Đơn hàng <strong>#{vnpayResult.orderCode}</strong> chưa được thanh toán.</>}
              </p>
              <div className="card-p" style={{ textAlign: "left", marginBottom: 24, background: "#FFF5F5", border: "1px solid #FCA5A5" }}>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 4 }}>Bạn có thể:</p>
                <p style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 6 }}>• Thử thanh toán lại với phương thức khác</p>
                <p style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 6 }}>• Chọn <strong>Thanh toán khi nhận hàng (COD)</strong></p>
                <p style={{ fontSize: 13, color: "var(--ink2)" }}>• Liên hệ hotline <strong style={{ color: "var(--brand)" }}>1800 5678</strong> nếu bị trừ tiền</p>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn bP" onClick={() => { setPage("cart"); setPayStep(3); }}>Thử Lại →</button>
                <button className="btn bS" onClick={() => setPage("home")}>Về Trang Chủ</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Chatbot — truyền onAddCart để thêm thẳng vào giỏ từ chat */}
      <Chatbot products={products} onAddCart={addCart} />

      <Footer onNavigate={p => { setPage(p); window.scrollTo({ top: 0 }); }} />
    </div>
  );
}