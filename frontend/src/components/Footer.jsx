export default function Footer({ onNavigate }) {
  return (
    <footer style={{ background: "#1A1A1A", color: "#fff", marginTop: 60 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "52px 32px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, background: "var(--brand)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🐾</div>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, fontSize: 18, color: "#fff" }}>PAWSHOP</span>
            </div>
            <p style={{ fontSize: 14, color: "#A0A0A0", lineHeight: 1.7, marginBottom: 20, maxWidth: 260 }}>
              Cửa hàng thú cưng online uy tín — thức ăn, phụ kiện, đồ chơi và sản phẩm chăm sóc sức khỏe cho bé yêu của bạn.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {[["📘", "Facebook"], ["📸", "Instagram"], ["▶️", "YouTube"], ["🎵", "TikTok"]].map(([icon, name]) => (
                <div key={name} title={name} style={{
                  width: 36, height: 36, background: "#2A2A2A", border: "1px solid #333",
                  borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 16, transition: "all .2s"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.background = "rgba(232,57,14,.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.background = "#2A2A2A"; }}
                >{icon}</div>
              ))}
            </div>
          </div>

          {[
            {
              title: "Sản Phẩm",
              links: [
                ["shop", "Thức Ăn Thú Cưng"],
                ["shop", "Phụ Kiện"],
                ["shop", "Đồ Chơi"],
                ["shop", "Chăm Sóc Sức Khỏe"],
                ["shop", "Chuồng & Nhà"],
              ]
            },
            {
              title: "Hỗ Trợ",
              links: [
                ["", "Hướng Dẫn Mua Hàng"],
                ["", "Chính Sách Đổi Trả"],
                ["", "Chính Sách Bảo Hành"],
                ["", "Câu Hỏi Thường Gặp"],
                ["", "Theo Dõi Đơn Hàng"],
              ]
            },
            {
              title: "Về PawShop",
              links: [
                ["", "Về Chúng Tôi"],
                ["", "Tuyển Dụng"],
                ["", "Blog Thú Cưng"],
                ["", "Liên Hệ"],
                ["", "Chương Trình CTV"],
              ]
            },
          ].map(col => (
            <div key={col.title}>
              <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: 13, color: "#fff", marginBottom: 16 }}>{col.title}</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(([page, label]) => (
                  <li key={label}>
                    <span
                      onClick={() => page && onNavigate?.(page)}
                      style={{ fontSize: 13, color: "#888", cursor: page ? "pointer" : "default", transition: "color .2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                      onMouseLeave={e => e.currentTarget.style.color = "#888"}
                    >{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact bar */}
        <div style={{ background: "#232323", borderRadius: 12, padding: "16px 24px", marginBottom: 28, display: "flex", gap: 32, flexWrap: "wrap" }}>
          {[
            ["📞", "1800 5678", "Hotline miễn phí"],
            ["✉️", "support@pawshop.vn", "Email hỗ trợ"],
            ["🕐", "8:00 - 22:00", "Thứ 2 — Chủ Nhật"],
            ["📍", "TP. Hồ Chí Minh", "Toàn quốc"],
          ].map(([icon, val, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: "rgba(232,57,14,.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{val}</p>
                <p style={{ fontSize: 11, color: "#888" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            ["🛡️", "Thanh toán bảo mật"],
            ["🚚", "Giao hàng toàn quốc"],
            ["↩️", "Đổi trả trong 7 ngày"],
            ["⭐", "50.000+ khách hài lòng"],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, background: "#232323", borderRadius: 8, padding: "7px 14px", border: "1px solid #2A2A2A" }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, paddingTop: 20, borderTop: "1px solid #2A2A2A" }}>
          <p style={{ fontSize: 12, color: "#555" }}>© 2026 PawShop. Bảo lưu mọi quyền. 🐾 Yêu thương thú cưng mỗi ngày.</p>
          <div style={{ display: "flex", gap: 20 }}>
            {["Điều Khoản", "Bảo Mật", "Cookie"].map(l => (
              <span key={l} style={{ fontSize: 12, color: "#555", cursor: "pointer", transition: "color .2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#aaa"}
                onMouseLeave={e => e.currentTarget.style.color = "#555"}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}