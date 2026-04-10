import { useState, useEffect } from "react";
import { reviewAPI, productAPI } from "../api";

function StarDisplay({ value }) {
  return (
    <span style={{ color: "#F59E0B", fontSize: 13, letterSpacing: 1 }}>
      {"★".repeat(value)}{"☆".repeat(5 - value)}
    </span>
  );
}

export default function AdminReviews({ showToast }) {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProd, setFilterProd] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE = 10;

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Gọi đúng: /api/admin/reviews trả về tất cả reviews kèm product_name
      const [pr, revs] = await Promise.all([
        productAPI.getAll({ limit: 200 }),
        reviewAPI.getAll(),
      ]);
      setProducts(pr.products || []);
      setReviews(Array.isArray(revs) ? revs : []);
    } catch (e) { showToast("Lỗi tải reviews: " + e.message, "error"); }
    setLoading(false);
  };

  const deleteReview = async (r) => {
    if (!confirm(`Xóa đánh giá của "${r.user_name}"?`)) return;
    try {
      await reviewAPI.delete(r.id);
      setReviews(rs => rs.filter(x => x.id !== r.id));
      showToast("✅ Đã xóa đánh giá!", "success");
    } catch (e) { showToast("❌ " + e.message, "error"); }
  };

  const filtered = reviews.filter(r => {
    const matchProd = filterProd === "all" || String(r.product_id) === filterProd;
    const matchRating = filterRating === "all" || r.rating === +filterRating;
    return matchProd && matchRating;
  });
  const paginated = filtered.slice((page - 1) * PAGE, page * PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";
  const dist = [5, 4, 3, 2, 1].map(s => ({ s, n: reviews.filter(r => r.rating === s).length }));

  return (
    <div className="fu">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, textTransform: "uppercase" }}>ĐÁNH GIÁ</h1>
          <p style={{ fontSize: 13, color: "var(--ink3)", marginTop: 2 }}>{reviews.length} đánh giá từ khách hàng</p>
        </div>
        <button className="btn bS sm" onClick={loadAll}>↻ Tải lại</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
        <div className="card-p" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "var(--brand)", fontFamily: "'Barlow Condensed',sans-serif" }}>{avgRating}</div>
          <div style={{ color: "#F59E0B", fontSize: 18, margin: "4px 0" }}>★★★★★</div>
          <p style={{ fontSize: 12, color: "var(--ink4)" }}>Trung bình</p>
        </div>
        {dist.map(({ s, n }) => (
          <div key={s} className="card-p" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#F59E0B" }}>{"★".repeat(s)}</span>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{n}</span>
            </div>
            <div style={{ height: 6, background: "var(--s3)", borderRadius: 3 }}>
              <div style={{ height: "100%", width: reviews.length ? (n / reviews.length * 100) + "%" : "0%", background: "#F59E0B", borderRadius: 3, transition: "width .5s" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <select className="inp" style={{ maxWidth: 220 }} value={filterProd} onChange={e => { setFilterProd(e.target.value); setPage(1); }}>
          <option value="all">Tất cả sản phẩm</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="inp" style={{ maxWidth: 160 }} value={filterRating} onChange={e => { setFilterRating(e.target.value); setPage(1); }}>
          <option value="all">Tất cả sao</option>
          {[5, 4, 3, 2, 1].map(s => <option key={s} value={s}>{s} sao</option>)}
        </select>
        <span style={{ fontSize: 13, color: "var(--ink4)", marginLeft: "auto" }}>{filtered.length} kết quả</span>
      </div>

      {/* Table */}
      {loading
        ? <div className="sk" style={{ height: 300, borderRadius: 12 }} />
        : <div className="card-x">
          <table className="tbl">
            <thead>
              <tr>{["Khách Hàng", "Sản Phẩm", "Đánh Giá", "Nội Dung", "Ngày", "Xóa"].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {paginated.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--ink4)" }}>Không có đánh giá nào</td></tr>
                : paginated.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, background: "var(--brand)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                          {r.user_name?.[0] || "U"}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{r.user_name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--ink3)", maxWidth: 160 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{r.product_name}</span>
                    </td>
                    <td><StarDisplay value={r.rating} /></td>
                    <td style={{ fontSize: 12, color: "var(--ink2)", maxWidth: 240 }}>
                      {r.title && <p style={{ fontWeight: 700, marginBottom: 2 }}>{r.title}</p>}
                      <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.comment || "—"}</p>
                    </td>
                    <td style={{ fontSize: 11, color: "var(--ink4)", whiteSpace: "nowrap" }}>
                      {new Date(r.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <button className="bD xs" onClick={() => deleteReview(r)}>🗑️</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      }

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--b)" }}>
          <span style={{ fontSize: 13, color: "var(--ink3)" }}>
            {(page - 1) * PAGE + 1}–{Math.min(page * PAGE, filtered.length)} / {filtered.length}
          </span>
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "6px 12px", border: "1.5px solid var(--b)", borderRadius: 7, background: "var(--s)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? .4 : 1, fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => Math.abs(n - page) <= 1 || n === 1 || n === totalPages).map((n, i, arr) => (
              <span key={n} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {i > 0 && arr[i - 1] !== n - 1 && <span style={{ color: "var(--ink4)" }}>…</span>}
                <button onClick={() => setPage(n)} style={{ width: 34, height: 34, border: `1.5px solid ${n === page ? "var(--brand)" : "var(--b)"}`, borderRadius: 7, background: n === page ? "var(--brand)" : "var(--s)", color: n === page ? "#fff" : "var(--ink2)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{n}</button>
              </span>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: "6px 12px", border: "1.5px solid var(--b)", borderRadius: 7, background: "var(--s)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? .4 : 1, fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>→</button>
          </div>
        </div>
      )}
    </div>
  );
}