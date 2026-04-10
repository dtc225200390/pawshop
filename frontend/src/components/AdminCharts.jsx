import { useState, useEffect } from "react";
import { orderAPI, productAPI, adminAPI } from "../api";

const fmt = (n) => Number(n).toLocaleString("vi-VN") + "₫";

// Simple SVG line/bar chart — no external lib needed
function BarChart({ data, color = "var(--brand)", height = 160 }) {
  if (!data?.length) return <div className="sk" style={{ height }} />;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, paddingTop: 8 }}>
      {data.map((d, i) => {
        const pct = d.value / max;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
            <span style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600, opacity: d.value > 0 ? 1 : 0 }}>
              {d.value > 1000000 ? (d.value / 1000000).toFixed(1) + "M" : d.value > 1000 ? (d.value / 1000).toFixed(0) + "K" : d.value}
            </span>
            <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
              <div style={{
                width: "100%",
                height: Math.max(pct * 100, 2) + "%",
                background: color,
                borderRadius: "4px 4px 0 0",
                transition: "height .6s cubic-bezier(.34,1.56,.64,1)",
                opacity: 0.7 + pct * 0.3,
                minHeight: 3,
              }} />
            </div>
            <span style={{ fontSize: 10, color: "var(--ink4)", whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%", textAlign: "center" }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data, size = 140 }) {
  if (!data?.length) return <div className="sk" style={{ width: size, height: size, borderRadius: "50%" }} />;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, background: "var(--s3)", borderRadius: "50%" }} />;
  const r = 50, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const segments = data.map(d => {
    const pct = d.value / total;
    const seg = { ...d, pct, dash: pct * circumference, offset, rotate: offset / circumference * 360 };
    offset += pct * circumference;
    return seg;
  });

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {segments.map((seg, i) => (
        <circle key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={22}
          strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
          strokeDashoffset={-seg.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "all .5s" }}
        />
      ))}
      <circle cx={cx} cy={cy} r={38} fill="var(--s)" />
    </svg>
  );
}

function StatCard({ label, value, sub, icon, color, bg, trend }) {
  return (
    <div className="card-p" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 11, color: "var(--ink4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 26, fontWeight: 800, color, fontFamily: "'Barlow Condensed',sans-serif", lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: "var(--ink3)", marginTop: 6 }}>{sub}</p>}
        </div>
        <div style={{ width: 48, height: 48, background: bg, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: trend >= 0 ? "#16A34A" : "#DC2626" }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span style={{ fontSize: 12, color: "var(--ink4)" }}>so với tháng trước</span>
        </div>
      )}
      {/* Background decoration */}
      <div style={{ position: "absolute", right: -16, bottom: -16, width: 80, height: 80, background: bg, borderRadius: "50%", opacity: .4 }} />
    </div>
  );
}

export default function AdminCharts({ showToast }) {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

  useEffect(() => { loadAll(); }, [period]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, orders, prods] = await Promise.all([
        adminAPI.getStats(),
        orderAPI.getAll({ limit: 200 }),
        productAPI.getAll({ limit: 50 }),
      ]);
      setStats(s);

      const orderArr = Array.isArray(orders) ? orders : [];
      setRecentOrders(orderArr.slice(0, 8));

      // Revenue by day (last 7 or 30 days)
      const days = period === "7d" ? 7 : 30;
      const now = new Date();
      const revMap = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        revMap[key] = 0;
      }
      orderArr.filter(o => o.payment_status === "paid").forEach(o => {
        const d = new Date(o.created_at);
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        if (key in revMap) revMap[key] += Number(o.total || 0);
      });
      setRevenueData(Object.entries(revMap).map(([label, value]) => ({ label, value })));

      // Order status distribution
      const statusCount = { pending: 0, confirmed: 0, shipping: 0, delivered: 0, cancelled: 0 };
      orderArr.forEach(o => { if (o.status in statusCount) statusCount[o.status]++; });
      setOrderStatusData([
        { label: "Chờ xác nhận", value: statusCount.pending, color: "#3B82F6" },
        { label: "Đã xác nhận", value: statusCount.confirmed, color: "#F59E0B" },
        { label: "Đang giao", value: statusCount.shipping, color: "#8B5CF6" },
        { label: "Đã giao", value: statusCount.delivered, color: "#10B981" },
        { label: "Đã hủy", value: statusCount.cancelled, color: "#EF4444" },
      ]);

      // Top products by sold
      const prodArr = (prods.products || []).sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5);
      setTopProducts(prodArr);

    } catch (e) {
      showToast("Lỗi tải dữ liệu: " + e.message, "error");
    }
    setLoading(false);
  };

  const statusMeta = (s) => ({
    pending:   { bg:"#EFF6FF", color:"#2563EB", label:"Chờ xác nhận" },
    confirmed: { bg:"#FFF7ED", color:"#EA580C", label:"Đã xác nhận" },
    shipping:  { bg:"#F5F3FF", color:"#7C3AED", label:"Đang giao" },
    delivered: { bg:"#F0FDF4", color:"#16A34A", label:"Đã giao" },
    cancelled: { bg:"#FEF2F2", color:"#DC2626", label:"Đã hủy" },
  }[s] || { bg:"#F9FAFB", color:"#6B7280", label: s });

  return (
    <div className="fu">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, textTransform: "uppercase" }}>TỔNG QUAN</h1>
          <p style={{ fontSize: 14, color: "var(--ink3)", marginTop: 2 }}>
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {/* Period selector */}
        <div style={{ display: "flex", background: "var(--s2)", borderRadius: 10, padding: 4, border: "1px solid var(--b)", gap: 2 }}>
          {[["7d", "7 ngày"], ["30d", "30 ngày"]].map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)} style={{
              padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer",
              background: period === val ? "var(--brand)" : "transparent",
              color: period === val ? "#fff" : "var(--ink3)",
              fontWeight: 700, fontSize: 13, fontFamily: "inherit", transition: "all .2s"
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      {loading
        ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="sk" style={{ height: 110, borderRadius: 12 }} />)}
          </div>
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
            <StatCard label="Doanh Thu" value={stats?.revenue ? fmt(stats.revenue) : "—"} icon="💰" color="#16A34A" bg="#F0FDF4" trend={12} sub="Tổng doanh thu" />
            <StatCard label="Đơn Hàng" value={stats?.orders ?? "—"} icon="🛒" color="#2563EB" bg="#EFF6FF" trend={8} sub="Tổng đơn hàng" />
            <StatCard label="Sản Phẩm" value={stats?.products ?? "—"} icon="📦" color="#EA580C" bg="#FFF7ED" sub="Đang kinh doanh" />
            <StatCard label="Khách Hàng" value={stats?.users ?? "—"} icon="👥" color="#7C3AED" bg="#F5F3FF" trend={5} sub="Đã đăng ký" />
          </div>
      }

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, marginBottom: 20 }}>

        {/* Revenue bar chart */}
        <div className="card-p">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>Doanh Thu</p>
              <p style={{ fontSize: 12, color: "var(--ink4)" }}>
                Tổng: {fmt(revenueData.reduce((s, d) => s + d.value, 0))}
              </p>
            </div>
          </div>
          <BarChart data={revenueData} color="var(--brand)" height={180} />
        </div>

        {/* Order status donut */}
        <div className="card-p">
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Trạng Thái Đơn Hàng</p>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <DonutChart data={orderStatusData} size={140} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {orderStatusData.map(d => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--ink3)" }}>{d.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Top products */}
        <div className="card-p">
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Top Sản Phẩm Bán Chạy</p>
          {loading
            ? [1,2,3,4,5].map(i => <div key={i} className="sk" style={{ height: 36, marginBottom: 8, borderRadius: 6 }} />)
            : topProducts.length === 0
              ? <p style={{ fontSize: 13, color: "var(--ink4)", textAlign: "center", padding: "20px 0" }}>Chưa có dữ liệu</p>
              : topProducts.map((p, i) => {
                  const maxSold = topProducts[0]?.sold || 1;
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#CD7F32" : "var(--s3)",
                        color: i < 3 ? "#fff" : "var(--ink3)", fontSize: 11, fontWeight: 800, flexShrink: 0
                      }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                        <div style={{ height: 4, background: "var(--s3)", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: ((p.sold || 0) / maxSold * 100) + "%", background: "var(--brand)", borderRadius: 2, transition: "width .6s" }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink3)", flexShrink: 0 }}>{p.sold || 0} bán</span>
                    </div>
                  );
                })
          }
        </div>

        {/* Recent orders */}
        <div className="card-p">
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Đơn Hàng Gần Đây</p>
          {loading
            ? [1,2,3,4,5].map(i => <div key={i} className="sk" style={{ height: 40, marginBottom: 8, borderRadius: 6 }} />)
            : recentOrders.length === 0
              ? <p style={{ fontSize: 13, color: "var(--ink4)", textAlign: "center", padding: "20px 0" }}>Chưa có đơn hàng</p>
              : recentOrders.map(o => {
                  const sm = statusMeta(o.status);
                  return (
                    <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--b)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: "var(--brand)" }}>#{o.order_code}</span>
                          <span className="st" style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2 }}>{o.receiver_name}</p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{fmt(o.total)}</p>
                        <p style={{ fontSize: 11, color: "var(--ink4)" }}>{new Date(o.created_at).toLocaleDateString("vi-VN")}</p>
                      </div>
                    </div>
                  );
                })
          }
        </div>
      </div>
    </div>
  );
}
