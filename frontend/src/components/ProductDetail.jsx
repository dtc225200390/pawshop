import { useState, useEffect } from "react";
import { getImageUrl, productAPI, reviewAPI } from "../api";

const fmt = (n) => Number(n).toLocaleString("vi-VN") + "₫";

function StarRating({ value, onChange, size = 20 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => onChange && onChange(s)}
          onMouseEnter={() => onChange && setHovered(s)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{
            fontSize: size,
            cursor: onChange ? "pointer" : "default",
            color: s <= (hovered || value) ? "#F59E0B" : "#E5E4E0",
            transition: "color .15s",
            lineHeight: 1,
          }}
        >★</span>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div style={{ padding: "18px 0", borderBottom: "1px solid var(--b)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "var(--brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0
          }}>{review.user_name?.[0] || "U"}</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14 }}>{review.user_name || "Khách hàng"}</p>
            <p style={{ fontSize: 11, color: "var(--ink4)" }}>
              {new Date(review.created_at).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>
        <StarRating value={review.rating} size={14} />
      </div>
      {review.title && (
        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{review.title}</p>
      )}
      <p style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.65 }}>{review.comment}</p>
      {review.verified && (
        <span style={{
          display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 600,
          color: "#16A34A", background: "#F0FDF4", padding: "2px 8px", borderRadius: 4
        }}>✓ Đã mua hàng</span>
      )}
    </div>
  );
}

export default function ProductDetail({ productId, onBack, onAddCart, user, showToast }) {
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("desc");
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "" });
  const [submitting, setSubmitting] = useState(false);

  // imgs computed from loaded product — only non-null values
  const imgs = product?.image ? [product.image] : [];

  useEffect(() => {
    setLoading(true);
    setQty(1);
    setActiveImg(0);
    Promise.all([
      productAPI.getById(productId),
      productAPI.getAll({ limit: 4, category: "all" }).catch(() => ({ products: [] })),
      reviewAPI ? reviewAPI.getByProduct(productId).catch(() => []) : Promise.resolve([]),
    ]).then(([p, rel, revs]) => {
      setProduct(p);
      setRelated((rel.products || []).filter(x => x.id !== productId).slice(0, 4));
      setReviews(Array.isArray(revs) ? revs : []);
    }).catch(() => showToast("Không tải được sản phẩm", "error"))
      .finally(() => setLoading(false));
  }, [productId]);

  const submitReview = async () => {
    if (!user) { showToast("Vui lòng đăng nhập để đánh giá!", "error"); return; }
    if (!reviewForm.comment.trim()) { showToast("Vui lòng nhập nội dung!", "error"); return; }
    setSubmitting(true);
    try {
      const rev = reviewAPI
        ? await reviewAPI.create(productId, reviewForm)
        : { ...reviewForm, user_name: user.name, created_at: new Date().toISOString(), verified: true, id: Date.now() };
      setReviews(r => [rev, ...r]);
      setReviewForm({ rating: 5, title: "", comment: "" });
      showToast("✅ Đã gửi đánh giá!", "success");
    } catch (e) {
      showToast("❌ " + e.message, "error");
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.rating === star).length / reviews.length * 100) : 0
  }));

  if (loading) return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
        <div className="sk" style={{ paddingTop: "100%", borderRadius: 16 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[80, 60, 40, 100, 50].map((w, i) => (
            <div key={i} className="sk" style={{ height: i === 0 ? 28 : i === 3 ? 48 : 18, width: w + "%" }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <p style={{ fontSize: 16, color: "var(--ink3)" }}>Không tìm thấy sản phẩm</p>
      <button className="btn bS" style={{ marginTop: 16 }} onClick={onBack}>← Quay lại</button>
    </div>
  );

  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, fontSize: 13, color: "var(--ink3)" }}>
        <span style={{ cursor: "pointer", color: "var(--brand)", fontWeight: 600 }} onClick={onBack}>← Cửa hàng</span>
        <span>/</span>
        {product.category_name && <><span style={{ cursor: "pointer" }} onClick={onBack}>{product.category_name}</span><span>/</span></>}
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>{product.name}</span>
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, marginBottom: 64, alignItems: "start" }}>

        {/* Left — Images */}
        <div>
          <div style={{
            width: "100%", aspectRatio: "1/1", background: "var(--s3)",
            borderRadius: 16, overflow: "hidden", border: "1px solid var(--b)", marginBottom: 12,
            position: "relative", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {imgs[activeImg]
              ? <img
                  src={getImageUrl(imgs[activeImg])}
                  alt={product.name}
                  onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: 24, display: "block" }}
                />
              : null}
            <div style={{ position: "absolute", inset: 0, display: imgs[activeImg] ? "none" : "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>📦</div>
            {discount > 0 && (
              <div style={{
                position: "absolute", top: 16, left: 16, background: "var(--brand)",
                color: "#fff", fontWeight: 800, fontSize: 13, padding: "5px 12px", borderRadius: 8
              }}>-{discount}%</div>
            )}
          </div>
          {/* Thumbnails */}
          {imgs.length > 1 && ( // show thumbnails only when multiple angles exist
            <div style={{ display: "flex", gap: 8 }}>
              {imgs.map((img, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{
                  width: 72, height: 72, borderRadius: 10, overflow: "hidden",
                  border: `2px solid ${activeImg === i ? "var(--brand)" : "var(--b)"}`,
                  cursor: "pointer", background: "var(--s3)", flexShrink: 0
                }}>
                  {img && <img src={getImageUrl(img)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Badges */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {product.badge && (
              <span className={`badge ${product.badge === "HOT" ? "bHot" : product.badge === "NEW" ? "bNew" : "bSale"}`}>
                {product.badge}
              </span>
            )}
            {product.category_name && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: 1.2 }}>
                {product.category_name}
              </span>
            )}
          </div>

          {/* Name */}
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, lineHeight: 1.1, textTransform: "uppercase" }}>
            {product.name}
          </h1>

          {/* Rating summary */}
          {reviews.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <StarRating value={Math.round(avgRating)} size={16} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{avgRating}</span>
              <span style={{ fontSize: 13, color: "var(--ink4)" }}>({reviews.length} đánh giá)</span>
            </div>
          )}

          {/* Price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 42, fontWeight: 900, color: "var(--brand)", lineHeight: 1 }}>
              {fmt(product.price)}
            </span>
            {product.original_price && (
              <span style={{ fontSize: 18, color: "var(--ink4)", textDecoration: "line-through" }}>
                {fmt(product.original_price)}
              </span>
            )}
            {discount > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, color: "#16A34A", background: "#F0FDF4", padding: "3px 8px", borderRadius: 6 }}>
                Tiết kiệm {fmt(product.original_price - product.price)}
              </span>
            )}
          </div>

          {/* Stock */}
          <div style={{ display: "flex", align: "center", gap: 8 }}>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
              background: product.stock > 0 ? "#F0FDF4" : "#FEF2F2",
              color: product.stock > 0 ? "#16A34A" : "#DC2626"
            }}>
              {product.stock > 0 ? `✓ Còn ${product.stock} sản phẩm` : "✗ Hết hàng"}
            </span>
            {product.sold > 0 && (
              <span style={{ fontSize: 12, color: "var(--ink4)", padding: "4px 10px", background: "var(--s3)", borderRadius: 6 }}>
                🔥 {product.sold} đã bán
              </span>
            )}
          </div>

          {/* Short description */}
          {product.description && (
            <p style={{ fontSize: 14, color: "var(--ink2)", lineHeight: 1.7, borderLeft: "3px solid var(--brand)", paddingLeft: 14 }}>
              {product.description}
            </p>
          )}

          {/* Qty + Add to cart */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--b)", borderRadius: 10, overflow: "hidden" }}>
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                style={{ width: 44, height: 50, background: "var(--s2)", border: "none", fontSize: 20, cursor: "pointer", fontWeight: 700, color: "var(--ink)" }}
              >−</button>
              <span style={{ width: 50, textAlign: "center", fontWeight: 800, fontSize: 16 }}>{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                style={{ width: 44, height: 50, background: "var(--s2)", border: "none", fontSize: 20, cursor: "pointer", fontWeight: 700, color: "var(--ink)" }}
              >+</button>
            </div>
            <button
              className="btn bP"
              disabled={product.stock === 0}
              onClick={() => { for (let i = 0; i < qty; i++) onAddCart(product); }}
              style={{ flex: 1, justifyContent: "center", padding: "14px 24px", fontSize: 15, minWidth: 180 }}
            >
              🛒 Thêm vào giỏ hàng
            </button>
            <button
              className="btn bS"
              style={{ padding: "13px 16px" }}
              title="Yêu thích"
            >♡</button>
          </div>

          {/* Trust badges */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
            {[
              ["🚚", "Miễn phí vận chuyển", "Đơn từ 500.000₫"],
              ["🔄", "Đổi trả 30 ngày", "Miễn phí đổi trả"],
              ["🛡️", "Bảo hành chính hãng", "12 tháng bảo hành"],
              ["💳", "Thanh toán an toàn", "VNPay, COD"],
            ].map(([icon, title, sub]) => (
              <div key={title} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                background: "var(--s2)", borderRadius: 10, border: "1px solid var(--b)"
              }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{title}</p>
                  <p style={{ fontSize: 11, color: "var(--ink4)" }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: Description / Specs / Reviews */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--b)", marginBottom: 28 }}>
          {[
            ["desc", "Mô tả sản phẩm"],
            ["specs", "Thông số"],
            ["reviews", `Đánh giá (${reviews.length})`],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "12px 24px", background: "none", border: "none",
              borderBottom: `2px solid ${tab === id ? "var(--brand)" : "transparent"}`,
              marginBottom: -2, color: tab === id ? "var(--brand)" : "var(--ink3)",
              fontWeight: tab === id ? 700 : 500, fontSize: 14, cursor: "pointer",
              fontFamily: "inherit", transition: "all .2s"
            }}>{label}</button>
          ))}
        </div>

        {tab === "desc" && (
          <div style={{ maxWidth: 720 }}>
            <p style={{ fontSize: 14, color: "var(--ink2)", lineHeight: 1.8, marginBottom: 20 }}>
              {product.description || "Chưa có mô tả chi tiết cho sản phẩm này."}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {["Chất lượng cao cấp", "Dễ sử dụng", "Bền bỉ theo thời gian", "Phù hợp mọi cấp độ"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--s2)", borderRadius: 8 }}>
                  <span style={{ color: "var(--brand)", fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "specs" && (
          <div style={{ maxWidth: 560 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                {[
                  ["Danh mục", product.category_name || "—"],
                  ["Mã sản phẩm", `HS-${String(product.id).padStart(4, "0")}`],
                  ["Tình trạng", product.stock > 0 ? "Còn hàng" : "Hết hàng"],
                  ["Đã bán", `${product.sold || 0} sản phẩm`],
                  ["Bảo hành", "12 tháng"],
                  ["Xuất xứ", "Việt Nam"],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: "1px solid var(--b)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink3)", background: "var(--s2)", width: "40%" }}>{k}</td>
                    <td style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 500 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "reviews" && (
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 40, alignItems: "start" }}>
            {/* Rating summary */}
            <div style={{ background: "var(--s2)", borderRadius: 16, padding: 24, border: "1px solid var(--b)" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 64, fontWeight: 900, color: "var(--brand)", lineHeight: 1 }}>
                  {avgRating || "—"}
                </div>
                <StarRating value={Math.round(avgRating || 0)} size={20} />
                <p style={{ fontSize: 13, color: "var(--ink3)", marginTop: 8 }}>{reviews.length} đánh giá</p>
              </div>
              {ratingDist.map(({ star, count, pct }) => (
                <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--ink3)", width: 16, textAlign: "right" }}>{star}</span>
                  <span style={{ color: "#F59E0B", fontSize: 12 }}>★</span>
                  <div style={{ flex: 1, height: 6, background: "var(--b)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: pct + "%", background: "#F59E0B", borderRadius: 3, transition: "width .5s" }} />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--ink4)", width: 24 }}>{count}</span>
                </div>
              ))}

              {/* Write review form */}
              <div style={{ borderTop: "1px solid var(--b)", marginTop: 20, paddingTop: 20 }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Viết đánh giá</p>
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 6 }}>Đánh giá của bạn</p>
                  <StarRating value={reviewForm.rating} onChange={r => setReviewForm(f => ({ ...f, rating: r }))} size={24} />
                </div>
                <input
                  className="inp" placeholder="Tiêu đề (tuỳ chọn)"
                  value={reviewForm.title}
                  onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                  style={{ marginBottom: 8, fontSize: 13 }}
                />
                <textarea
                  className="inp" placeholder="Chia sẻ trải nghiệm của bạn..."
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  style={{ minHeight: 80, resize: "vertical", fontSize: 13, marginBottom: 10 }}
                />
                <button
                  className="btn bP sm" style={{ width: "100%", justifyContent: "center" }}
                  onClick={submitReview} disabled={submitting}
                >{submitting ? "Đang gửi..." : "Gửi đánh giá"}</button>
              </div>
            </div>

            {/* Review list */}
            <div>
              {reviews.length === 0
                ? <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--ink3)" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                    <p style={{ fontWeight: 600 }}>Chưa có đánh giá nào</p>
                    <p style={{ fontSize: 13, marginTop: 6 }}>Hãy là người đầu tiên đánh giá sản phẩm này!</p>
                  </div>
                : reviews.map(r => <ReviewCard key={r.id} review={r} />)
              }
            </div>
          </div>
        )}
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div>
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>
              Gợi ý
            </p>
            <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 30, textTransform: "uppercase" }}>
              Sản phẩm liên quan
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
            {related.map(p => (
              <div key={p.id} style={{ cursor: "pointer" }}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                <div style={{ width: "100%", aspectRatio: "1/1", background: "var(--s3)", borderRadius: 12, overflow: "hidden", marginBottom: 10, border: "1px solid var(--b)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {p.image
                    ? <img src={getImageUrl(p.image)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display:"block" }} />
                    : <span style={{ fontSize: 40 }}>📦</span>
                  }
                </div>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{p.name}</p>
                <p style={{ color: "var(--brand)", fontWeight: 800, fontSize: 15 }}>{fmt(p.price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
