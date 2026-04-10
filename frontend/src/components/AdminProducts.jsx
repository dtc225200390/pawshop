import { useState, useEffect } from "react";
import { productAPI, categoryAPI, uploadAPI, getImageUrl } from "../api";

const fmt = (n) => Number(n).toLocaleString("vi-VN") + "₫";
const emptyP = { name:"", price:"", original_price:"", category_id:"", stock:"", image:"", description:"", badge:"NEW" };
const emptyC = { name:"", slug:"", description:"" };
const PAGE = 12;

function slugify(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/đ/g,"d").replace(/[^a-z0-9\s-]/g,"")
    .trim().replace(/\s+/g,"-");
}

// ── Image Upload Box ──────────────────────────────────────────
// folder: slug của danh mục — ảnh lưu vào products/{folder}/filename.jpg
function ImageUploader({ value, onChange, showToast, folder = "uncategorized" }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");

  useEffect(() => { setPreview(value || ""); }, [value]);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadAPI.image(file, { folder }); // ← truyền folder
      setPreview(url);
      onChange(url);
      showToast(`✅ Upload ảnh thành công! (${folder})`, "success");
    } catch(e) {
      showToast("❌ " + e.message, "error");
    } finally { setUploading(false); }
  };

  return (
    <div>
      {/* Preview box */}
      <div style={{
        width:"100%", aspectRatio:"4/3", borderRadius:10, overflow:"hidden",
        border:"2px dashed var(--b)", background:"var(--s3)", marginBottom:10,
        cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative",
      }} onClick={() => document.getElementById("img-upload-" + (value||"new")).click()}>
        {preview
          ? <img src={preview} alt="Preview"
              style={{ width:"100%", height:"100%", objectFit:"contain", padding:12, display:"block" }}
              onError={e => { e.target.style.display="none"; }}
            />
          : <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, color:"var(--ink4)" }}>
              <span style={{ fontSize:32 }}>🖼️</span>
              <span style={{ fontSize:12, fontWeight:600 }}>Click để chọn ảnh</span>
              <span style={{ fontSize:11, color:"var(--ink4)", background:"var(--s2)", padding:"2px 8px", borderRadius:4 }}>
                📁 {folder}/
              </span>
            </div>
        }
        {uploading && (
          <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,.85)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:6 }}>
            <span style={{ fontSize:13, fontWeight:700, color:"var(--brand)" }}>⏳ Đang upload...</span>
            <span style={{ fontSize:11, color:"var(--ink3)" }}>📁 {folder}/</span>
          </div>
        )}
      </div>
      {/* Hidden file input */}
      <input id={"img-upload-" + (value||"new")} type="file" accept="image/*"
        style={{ display:"none" }}
        onChange={e => handleFile(e.target.files?.[0])}
      />
      {/* Folder indicator */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
        <span style={{ fontSize:11, color:"var(--ink4)" }}>📁 Thư mục:</span>
        <code style={{ fontSize:11, background:"var(--s3)", padding:"2px 8px", borderRadius:4, color:"var(--brand)", fontWeight:700 }}>
          products/{folder}/
        </code>
      </div>
      {/* URL input */}
      <input className="inp"
        placeholder="Hoặc dán URL ảnh..."
        value={preview.startsWith("data:") ? "" : preview}
        onChange={e => { setPreview(e.target.value); onChange(e.target.value); }}
        style={{ fontSize:12, marginTop:0 }}
      />
      {preview && (
        <button onClick={() => { setPreview(""); onChange(""); }}
          style={{ marginTop:6, fontSize:11, color:"#DC2626", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>
          ✕ Xóa ảnh
        </button>
      )}
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────
function ProdCard({ p, cats, onEdit, onDelete }) {
  const badgeClass = p.badge==="HOT"?"bHot":p.badge==="NEW"?"bNew":"bSale";
  const cat = cats.find(c => c.id === p.category_id);
  const discount = p.original_price && p.original_price > p.price
    ? Math.round((1 - p.price/p.original_price)*100) : 0;

  return (
    <div className="card-x" style={{ display:"flex", flexDirection:"column" }}>
      <div style={{ width:"100%", aspectRatio:"1/1", background:"var(--s3)", flexShrink:0, position:"relative", overflow:"hidden" }}>
        {p.image
          ? <img src={getImageUrl(p.image)} alt={p.name}
              onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
            />
          : null
        }
        <div style={{ position:"absolute", inset:0, display:p.image?"none":"flex", alignItems:"center", justifyContent:"center", fontSize:44, color:"var(--ink4)" }}>📦</div>
        {p.badge && <span className={`badge ${badgeClass}`} style={{ position:"absolute", top:8, left:8 }}>{p.badge}</span>}
        {discount > 0 && (
          <span style={{ position:"absolute", top:8, right:8, background:"var(--brand)", color:"#fff", fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:5 }}>
            -{discount}%
          </span>
        )}
      </div>
      <div style={{ padding:"12px 14px 14px", flex:1, display:"flex", flexDirection:"column" }}>
        {cat && <p style={{ fontSize:10, color:"var(--brand)", fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>{cat.name}</p>}
        <p style={{ fontWeight:700, fontSize:13, marginBottom:4, lineHeight:1.35, flex:1 }}>{p.name}</p>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <span style={{ color:"var(--brand)", fontWeight:800, fontSize:15 }}>{fmt(p.price)}</span>
          {p.original_price && <span style={{ color:"var(--ink4)", fontSize:11, textDecoration:"line-through" }}>{fmt(p.original_price)}</span>}
        </div>
        <p style={{ fontSize:11, color:"var(--ink4)", marginBottom:12 }}>Kho: {p.stock} · Bán: {p.sold||0}</p>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn bS xs" style={{ flex:1 }} onClick={() => onEdit(p)}>✏️ Sửa</button>
          <button className="bD xs" onClick={() => onDelete(p)}>🗑️</button>
        </div>
      </div>
    </div>
  );
}

// ── Product Form Modal ────────────────────────────────────────
function ProductModal({ prod, cats, onClose, onSave, showToast }) {
  const [form, setForm] = useState(prod || emptyP);
  const [saving, setSaving] = useState(false);
  const isEdit = !!prod?.id;

  // Lấy slug của category đang chọn để truyền vào ImageUploader
  const currentCatSlug = cats.find(c => c.id === +form.category_id)?.slug || "uncategorized";

  const save = async () => {
    if (!form.name || !form.price) { showToast("Vui lòng điền tên và giá!", "error"); return; }
    setSaving(true);
    try {
      const data = { ...form, price:+form.price, original_price:+form.original_price||null, stock:+form.stock||0, category_id:+form.category_id||1 };
      const saved = isEdit ? await productAPI.update(form.id, data) : await productAPI.create(data);
      onSave(saved, isEdit);
      showToast(isEdit ? "✅ Đã cập nhật!" : "✅ Thêm thành công!", "success");
      onClose();
    } catch(e) { showToast("❌ " + e.message, "error"); }
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(10,10,10,.55)", backdropFilter:"blur(4px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"var(--s)", borderRadius:16, width:"100%", maxWidth:560, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.22)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px 0" }}>
          <h3 style={{ fontSize:16, fontWeight:800 }}>{isEdit ? "✏️ Sửa Sản Phẩm" : "➕ Thêm Sản Phẩm"}</h3>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", background:"var(--s3)", border:"none", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:"16px 24px 24px", display:"flex", flexDirection:"column", gap:14 }}>

          {/* Category — chọn TRƯỚC để folder upload đúng */}
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Danh Mục * <span style={{ fontSize:11, color:"var(--ink4)", fontWeight:400, textTransform:"none" }}>(chọn trước khi upload ảnh)</span></p>
            <select className="inp" value={form.category_id||""} onChange={e=>setForm(f=>({...f,category_id:e.target.value}))}>
              <option value="">-- Chọn danh mục</option>
              {cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Image uploader — folder tự động theo category */}
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>Hình Ảnh</p>
            <ImageUploader
              value={form.image}
              onChange={url => setForm(f=>({...f,image:url}))}
              showToast={showToast}
              folder={currentCatSlug}
            />
          </div>

          {/* Name */}
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Tên Sản Phẩm *</p>
            <input className="inp" placeholder="Nhập tên sản phẩm..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          </div>

          {/* Price row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Giá Bán *</p>
              <input className="inp" type="number" placeholder="0" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/>
            </div>
            <div>
              <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Giá Gốc</p>
              <input className="inp" type="number" placeholder="để trống nếu không có" value={form.original_price||""} onChange={e=>setForm(f=>({...f,original_price:e.target.value}))}/>
            </div>
          </div>

          {/* Stock */}
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Tồn Kho</p>
            <input className="inp" type="number" placeholder="0" value={form.stock||""} onChange={e=>setForm(f=>({...f,stock:e.target.value}))}/>
          </div>

          {/* Badge */}
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>Badge</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["NEW","HOT","SALE",""].map(b=>(
                <button key={b} type="button" onClick={()=>setForm(f=>({...f,badge:b}))}
                  style={{ padding:"6px 16px", fontSize:12, fontWeight:700, borderRadius:7, cursor:"pointer", fontFamily:"inherit", transition:"all .15s",
                    border:`1.5px solid ${form.badge===b?"var(--brand)":"var(--b)"}`,
                    background:form.badge===b?"var(--brand)":"var(--s)",
                    color:form.badge===b?"#fff":"var(--ink3)"
                  }}>{b||"Không có"}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Mô Tả</p>
            <textarea className="inp" placeholder="Mô tả ngắn về sản phẩm..." value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{ minHeight:80, resize:"vertical" }}/>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:10, paddingTop:4 }}>
            <button className="btn bP sm" style={{ flex:1, justifyContent:"center" }} onClick={save} disabled={saving}>
              {saving ? "Đang lưu..." : isEdit ? "Lưu Thay Đổi" : "Thêm Sản Phẩm"}
            </button>
            <button className="btn bS sm" onClick={onClose}>Hủy</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Category Modal ────────────────────────────────────────────
function CategoryModal({ cat, onClose, onSave, showToast }) {
  const [form, setForm] = useState(cat || emptyC);
  const [saving, setSaving] = useState(false);
  const isEdit = !!cat?.id;

  const save = async () => {
    if (!form.name) { showToast("Vui lòng nhập tên danh mục!", "error"); return; }
    const slug = form.slug || slugify(form.name);
    setSaving(true);
    try {
      const saved = isEdit
        ? await categoryAPI.update(cat.id, { ...form, slug })
        : await categoryAPI.create({ ...form, slug });
      onSave(saved, isEdit);
      showToast(isEdit ? "✅ Đã cập nhật!" : "✅ Thêm danh mục!", "success");
      onClose();
    } catch(e) { showToast("❌ " + e.message, "error"); }
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(10,10,10,.55)", backdropFilter:"blur(4px)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"var(--s)", borderRadius:16, width:"100%", maxWidth:420, boxShadow:"0 24px 64px rgba(0,0,0,.22)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px 0" }}>
          <h3 style={{ fontSize:16, fontWeight:800 }}>{isEdit ? "✏️ Sửa Danh Mục" : "➕ Thêm Danh Mục"}</h3>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", background:"var(--s3)", border:"none", cursor:"pointer", fontSize:16 }}>✕</button>
        </div>
        <div style={{ padding:"16px 24px 24px", display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6 }}>Tên Danh Mục *</p>
            <input className="inp" placeholder="VD: Thức Ăn" value={form.name}
              onChange={e => { setForm(f=>({...f, name:e.target.value, slug:slugify(e.target.value)})); }}/>
          </div>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6 }}>Slug (URL)</p>
            <input className="inp" placeholder="thuc-an" value={form.slug||""}
              onChange={e => setForm(f=>({...f,slug:e.target.value}))}
              style={{ fontFamily:"monospace", fontSize:12 }}/>
            <p style={{ fontSize:11, color:"var(--ink4)", marginTop:4 }}>Slug cũng là tên thư mục lưu ảnh trên Supabase</p>
          </div>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:"var(--ink3)", marginBottom:6 }}>Mô Tả</p>
            <textarea className="inp" placeholder="Mô tả ngắn về danh mục..." value={form.description||""}
              onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{ minHeight:64, resize:"vertical" }}/>
          </div>
          <div style={{ display:"flex", gap:10, paddingTop:4 }}>
            <button className="btn bP sm" style={{ flex:1, justifyContent:"center" }} onClick={save} disabled={saving}>
              {saving ? "Đang lưu..." : isEdit ? "Lưu" : "Thêm"}
            </button>
            <button className="btn bS sm" onClick={onClose}>Hủy</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function AdminProducts({ showToast }) {
  const [products, setProducts]   = useState([]);
  const [cats, setCats]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState("products");
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [editProd, setEditProd]   = useState(null);
  const [editCat, setEditCat]     = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pr, ca] = await Promise.all([
        productAPI.getAll({ limit:200 }),
        categoryAPI.getAll(),
      ]);
      setProducts(pr.products || []);
      setCats(Array.isArray(ca) ? ca : []);
    } catch(e) { showToast("Lỗi tải dữ liệu: " + e.message, "error"); }
    setLoading(false);
  };

  const filtered = products.filter(p => {
    const matchCat = filterCat === "all" || p.category_id === +filterCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  const paginated = filtered.slice((page-1)*PAGE, page*PAGE);

  const handleDeleteProd = async (p) => {
    if (!confirm(`Xóa "${p.name}"?`)) return;
    try {
      await productAPI.delete(p.id);
      setProducts(ps => ps.filter(x => x.id !== p.id));
      showToast("✅ Đã xóa sản phẩm!", "success");
    } catch(e) { showToast("❌ " + e.message, "error"); }
  };

  const handleDeleteCat = async (c) => {
    if (!confirm(`Xóa danh mục "${c.name}"?`)) return;
    try {
      await categoryAPI.delete(c.id);
      setCats(cs => cs.filter(x => x.id !== c.id));
      showToast("✅ Đã xóa danh mục!", "success");
    } catch(e) { showToast("❌ " + e.message, "error"); }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const PagerBar = () => {
    const from = filtered.length === 0 ? 0 : (page-1)*PAGE+1;
    const to = Math.min(page*PAGE, filtered.length);
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:20, paddingTop:16, borderTop:"1px solid var(--b)", flexWrap:"wrap", gap:12 }}>
        <span style={{ fontSize:13, color:"var(--ink3)" }}>Hiển thị <strong>{from}–{to}</strong> / <strong>{filtered.length}</strong></span>
        {totalPages > 1 && (
          <div style={{ display:"flex", gap:5 }}>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
              style={{ padding:"6px 12px", border:"1.5px solid var(--b)", borderRadius:7, background:"var(--s)", cursor:page===1?"not-allowed":"pointer", opacity:page===1?.4:1, fontFamily:"inherit", fontWeight:600, fontSize:13 }}>←</button>
            {Array.from({length:totalPages},(_, i)=>i+1).filter(n=>Math.abs(n-page)<=2||n===1||n===totalPages).map((n,i,arr)=>(
              <span key={n}>
                {i>0&&arr[i-1]!==n-1&&<span style={{color:"var(--ink4)",padding:"0 4px"}}>…</span>}
                <button onClick={()=>setPage(n)}
                  style={{ width:34, height:34, border:`1.5px solid ${n===page?"var(--brand)":"var(--b)"}`, borderRadius:7,
                    background:n===page?"var(--brand)":"var(--s)", color:n===page?"#fff":"var(--ink2)",
                    fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>{n}</button>
              </span>
            ))}
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              style={{ padding:"6px 12px", border:"1.5px solid var(--b)", borderRadius:7, background:"var(--s)", cursor:page===totalPages?"not-allowed":"pointer", opacity:page===totalPages?.4:1, fontFamily:"inherit", fontWeight:600, fontSize:13 }}>→</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fu">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, textTransform:"uppercase" }}>
            {view === "products" ? "SẢN PHẨM" : "DANH MỤC"}
          </h1>
          <p style={{ fontSize:13, color:"var(--ink3)", marginTop:2 }}>
            {view === "products" ? `${products.length} sản phẩm · ${cats.length} danh mục` : `${cats.length} danh mục`}
          </p>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", background:"var(--s2)", borderRadius:10, padding:3, border:"1px solid var(--b)" }}>
            {[["products","📦 Sản Phẩm"],["categories","📂 Danh Mục"]].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)} style={{
                padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit",
                background:view===v?"var(--brand)":"transparent",
                color:view===v?"#fff":"var(--ink3)", fontWeight:700, fontSize:13, transition:"all .2s"
              }}>{l}</button>
            ))}
          </div>
          <button className="btn bP sm" onClick={()=>view==="products"?setEditProd("new"):setEditCat("new")}>
            + {view==="products"?"Thêm Sản Phẩm":"Thêm Danh Mục"}
          </button>
        </div>
      </div>

      {/* ── PRODUCTS VIEW ─────────────────────────────────── */}
      {view === "products" && (
        <>
          <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <span className={`tag ${filterCat==="all"?"on":""}`} onClick={()=>{setFilterCat("all");setPage(1);}}>Tất Cả ({products.length})</span>
              {cats.map(c=>(
                <span key={c.id} className={`tag ${filterCat===String(c.id)?"on":""}`}
                  onClick={()=>{setFilterCat(String(c.id));setPage(1);}}>
                  {c.name} ({products.filter(p=>p.category_id===c.id).length})
                </span>
              ))}
            </div>
            <input className="inp" style={{ maxWidth:220, marginLeft:"auto" }} placeholder="🔍 Tìm sản phẩm..."
              value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
          </div>

          {loading
            ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
                {[1,2,3,4,5,6].map(i=>(
                  <div key={i} className="card-x">
                    <div className="sk" style={{ paddingTop:"100%" }}/>
                    <div style={{ padding:14 }}>
                      <div className="sk" style={{ height:14, width:"70%", marginBottom:8 }}/>
                      <div className="sk" style={{ height:18, width:"45%", marginBottom:8 }}/>
                      <div className="sk" style={{ height:32 }}/>
                    </div>
                  </div>
                ))}
              </div>
            : paginated.length === 0
              ? <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--ink3)" }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
                  <p style={{ fontWeight:600 }}>Không tìm thấy sản phẩm</p>
                  <button className="btn bS sm" style={{ marginTop:12 }} onClick={()=>{setSearch("");setFilterCat("all");}}>Xóa bộ lọc</button>
                </div>
              : <>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
                    {paginated.map(p=>(
                      <ProdCard key={p.id} p={p} cats={cats}
                        onEdit={p=>setEditProd(p)}
                        onDelete={handleDeleteProd}
                      />
                    ))}
                  </div>
                  <PagerBar/>
                </>
          }
        </>
      )}

      {/* ── CATEGORIES VIEW ───────────────────────────────── */}
      {view === "categories" && (
        <>
          {loading
            ? <div className="sk" style={{ height:300, borderRadius:12 }}/>
            : <div className="card-x">
                <table className="tbl">
                  <thead>
                    <tr>{["#","Danh Mục","Slug / Thư mục ảnh","Mô Tả","Số SP","Thao Tác"].map(h=><th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {cats.map((c, i) => {
                      const count = products.filter(p=>p.category_id===c.id).length;
                      return (
                        <tr key={c.id}>
                          <td style={{ color:"var(--ink4)", fontSize:12, width:40 }}>{i+1}</td>
                          <td>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ width:34, height:34, background:"var(--s3)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>📂</div>
                              <span style={{ fontWeight:700, fontSize:14 }}>{c.name}</span>
                            </div>
                          </td>
                          <td>
                            <code style={{ fontSize:11, background:"var(--s3)", padding:"2px 8px", borderRadius:4, color:"var(--ink3)" }}>{c.slug}</code>
                            <div style={{ fontSize:10, color:"var(--ink4)", marginTop:3 }}>📁 products/{c.slug}/</div>
                          </td>
                          <td style={{ color:"var(--ink3)", fontSize:13, maxWidth:200 }}>{c.description || "—"}</td>
                          <td>
                            <span style={{ fontWeight:700, color:count>0?"var(--brand)":"var(--ink4)" }}>{count}</span>
                            <span style={{ fontSize:11, color:"var(--ink4)", marginLeft:4 }}>sản phẩm</span>
                          </td>
                          <td>
                            <div style={{ display:"flex", gap:8 }}>
                              <button className="btn bS xs" onClick={()=>setEditCat(c)}>✏️ Sửa</button>
                              <button className="bD xs" onClick={()=>handleDeleteCat(c)} disabled={count>0} title={count>0?"Không thể xóa danh mục có sản phẩm":""}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          }
        </>
      )}

      {/* ── Modals ────────────────────────────────────────── */}
      {(editProd === "new" || (editProd && editProd.id)) && (
        <ProductModal
          prod={editProd === "new" ? null : editProd}
          cats={cats}
          onClose={() => setEditProd(null)}
          onSave={(saved, isEdit) => {
            setProducts(ps => isEdit ? ps.map(x=>x.id===saved.id?saved:x) : [...ps, saved]);
          }}
          showToast={showToast}
        />
      )}
      {(editCat === "new" || (editCat && editCat.id)) && (
        <CategoryModal
          cat={editCat === "new" ? null : editCat}
          onClose={() => setEditCat(null)}
          onSave={(saved, isEdit) => {
            setCats(cs => isEdit ? cs.map(x=>x.id===saved.id?saved:x) : [...cs, saved]);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}