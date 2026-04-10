// src/api.js - Tất cả API calls tới backend
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('ps_token');

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const request = async (url, options = {}) => {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: headers(options.headers),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Lỗi server');
  return data;
};

// ── AUTH ─────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (name, email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  me: () => request('/auth/me'),

  loginGoogle: () => { window.location.href = `${BASE}/auth/google`; },
  loginFacebook: () => { window.location.href = `${BASE}/auth/facebook`; },
  loginGithub: () => { window.location.href = `${BASE}/auth/github`; },
};

// ── PRODUCTS ─────────────────────────────────────────────────
export const productAPI = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/products${q ? '?' + q : ''}`);
  },
  getById: (id) => request(`/products/${id}`),
  getBySlug: (slug) => request(`/products/${slug}`),
  create: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
};

// ── CATEGORIES ───────────────────────────────────────────────
export const categoryAPI = {
  getAll: () => request('/categories'),
  create: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};

// ── ORDERS ───────────────────────────────────────────────────
export const orderAPI = {
  create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/orders${q ? '?' + q : ''}`);
  },
  getById: (id) => request(`/orders/${id}`),
  updateStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ── PAYMENT ──────────────────────────────────────────────────
export const paymentAPI = {
  createVNPay: (order_id) =>
    request('/payment/vnpay-create', { method: 'POST', body: JSON.stringify({ order_id }) }),
};

// ── ADMIN ────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => request('/admin/stats'),
  getUsers: () => request('/admin/users'),
  toggleUser: (id, is_active) =>
    request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active }) }),
};

// ── REVIEWS ──────────────────────────────────────────────────
export const reviewAPI = {
  getAll: () => request('/admin/reviews'),
  getByProduct: (product_id) => request(`/reviews?product_id=${product_id}`),
  create: (product_id, data) => request('/reviews', { method: 'POST', body: JSON.stringify({ product_id, ...data }) }),
  delete: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),
};

// ── VOUCHERS ─────────────────────────────────────────────────
export const voucherAPI = {
  getAll: () => request('/admin/vouchers'),
  getPublic: () => request('/vouchers/public'),
  create: (data) => request('/admin/vouchers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/admin/vouchers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/admin/vouchers/${id}`, { method: 'DELETE' }),
  validate: (code, order_total) => request('/vouchers/validate', { method: 'POST', body: JSON.stringify({ code, order_total }) }),
};

// ── SETTINGS ─────────────────────────────────────────────────
export const settingsAPI = {
  get: () => request('/admin/settings'),
  update: (data) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// ── MESSAGES ─────────────────────────────────────────────────
export const messageAPI = {
  getAll: () => request('/admin/messages'),
  reply: (id, text) => request(`/admin/messages/${id}/reply`, { method: 'POST', body: JSON.stringify({ reply: text }) }),
  delete: (id) => request(`/admin/messages/${id}`, { method: 'DELETE' }),
  markRead: (id) => request(`/admin/messages/${id}/read`, { method: 'PATCH' }),
};

// ── TOKEN HELPERS ────────────────────────────────────────────
export const saveToken = (token) => localStorage.setItem('ps_token', token);
export const clearToken = () => localStorage.removeItem('ps_token');
export const hasToken = () => !!getToken();

// ── IMAGE UPLOAD (Supabase Storage) ──────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = 'products';

// Resize ảnh trước khi upload (client-side, tiết kiệm bandwidth)
function resizeImage(file, maxSize = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('File không phải ảnh'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
          else { width = Math.round(width * maxSize / height); height = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── IMAGE UPLOAD LOCAL (lưu vào backend/uploads/) ────────────
export const uploadAPI = {
  image: async (file, options = {}) => {
    const blob = await resizeImage(file);
    const ext = 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const folder = options?.folder || 'uncategorized';

    // Tạo FormData để gửi lên backend
    const formData = new FormData();
    formData.append('image', new File([blob], fileName, { type: 'image/jpeg' }));
    formData.append('folder', folder);

    const res = await fetch(`${BASE}/upload/image`, {
      method: 'POST',
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        // KHÔNG set Content-Type — để browser tự set boundary cho FormData
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload ảnh thất bại');
    return { url: data.url };
  },
};

export const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  if (img.startsWith('data:')) return img;
  // Ảnh local — trỏ về backend static
  if (img.startsWith('/uploads/')) return `${BASE.replace('/api', '')}${img}`;
  return img;
};

