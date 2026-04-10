

require('dotenv').config();
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('NODE_ENV:', process.env.NODE_ENV);
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// ── Static files (uploaded images) ───────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

// ── Multer (image upload) ─────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR); // lưu tạm vào uploads/
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file ảnh'));
  },
});


// ── DB Pool ───────────────────────────────────────────────────
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pawshop',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
};

if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = { rejectUnauthorized: true };
}

const db = mysql.createPool(dbConfig);

db.getConnection()
  .then(c => { console.log('✅ MySQL connected'); c.release(); })
  .catch(e => console.error('❌ MySQL error:', e.message));

// ── Helpers ───────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'habana_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Chưa đăng nhập' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
  next();
}

function genOrderCode() {
  return 'HS' + Date.now().toString().slice(-8);
}

// ── VNPay helpers ─────────────────────────────────────────────

// Tạo chữ ký HMAC-SHA512 — dùng chung cho cả create và verify
function vnpaySign(params, hashSecret) {
  const sortedKeys = Object.keys(params).sort();
  const signData = sortedKeys
    .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map(k => `${k}=${params[k]}`)
    .join('&');
  const hash = crypto
    .createHmac('sha512', hashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');
  return { hash, signData };
}

// Verify chữ ký từ VNPay (query string hoặc body)
function vnpayVerify(query, hashSecret) {
  const params = { ...query };
  const receivedHash = params['vnp_SecureHash'];
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];
  const { hash } = vnpaySign(params, hashSecret);
  return { isValid: hash === receivedHash, params };
}

// Lấy IP client sạch (xử lý proxy, IPv6)
function getClientIp(req) {
  const raw = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1')
    .split(',')[0].trim().replace('::ffff:', '');
  if (!raw || raw === '::1' || raw === '') return '127.0.0.1';
  return raw;
}

// Format ngày giờ UTC+7 theo định dạng VNPay: yyyyMMddHHmmss
function getVnpayCreateDate() {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  return now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
}

// ── OAuth helper: tìm hoặc tạo user từ OAuth ─────────────────
async function findOrCreateOAuthUser({ provider, providerId, name, email, avatar }) {
  // 1. Tìm oauth_account đã tồn tại
  const [rows] = await db.query(
    'SELECT u.* FROM oauth_accounts oa JOIN users u ON u.id = oa.user_id WHERE oa.provider=? AND oa.provider_id=?',
    [provider, providerId]
  );
  if (rows.length) return rows[0];

  // 2. Tìm user theo email (nếu có)
  let user = null;
  if (email) {
    const [byEmail] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    if (byEmail.length) user = byEmail[0];
  }

  // 3. Tạo user mới nếu chưa có
  if (!user) {
    const [result] = await db.query(
      'INSERT INTO users (name, email, avatar, role) VALUES (?,?,?,?)',
      [name, email || null, avatar || null, 'user']
    );
    const [newUser] = await db.query('SELECT * FROM users WHERE id=?', [result.insertId]);
    user = newUser[0];
  }

  // 4. Liên kết oauth_account
  await db.query(
    'INSERT IGNORE INTO oauth_accounts (user_id, provider, provider_id) VALUES (?,?,?)',
    [user.id, provider, providerId]
  );

  return user;
}

//  MỚI — chỉ khởi tạo khi có key
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser({
        provider: 'google',
        providerId: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        avatar: profile.photos?.[0]?.value,
      });
      done(null, user);
    } catch (err) { done(err); }
  }));
}

if (process.env.FACEBOOK_APP_ID) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'displayName', 'emails', 'photos'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser({
        provider: 'facebook',
        providerId: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        avatar: profile.photos?.[0]?.value,
      });
      done(null, user);
    } catch (err) { done(err); }
  }));
}

if (process.env.GITHUB_CLIENT_ID) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser({
        provider: 'github',
        providerId: profile.id,
        name: profile.displayName || profile.username,
        email: profile.emails?.[0]?.value,
        avatar: profile.photos?.[0]?.value,
      });
      done(null, user);
    } catch (err) { done(err); }
  }));
}

// ================================================================
// ROUTES - AUTH
// ================================================================

// POST /api/auth/register
app.post('/api/auth/register',
  [
    body('name').notEmpty().withMessage('Tên không được để trống'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      const [exist] = await db.query('SELECT id FROM users WHERE email=?', [email]);
      if (exist.length) return res.status(409).json({ message: 'Email đã tồn tại' });

      const hash = await bcrypt.hash(password, 10);
      const [result] = await db.query(
        'INSERT INTO users (name, email, password) VALUES (?,?,?)',
        [name, email, hash]
      );
      const [rows] = await db.query('SELECT id, name, email, role, avatar FROM users WHERE id=?', [result.insertId]);
      const user = rows[0];
      res.status(201).json({ token: signToken(user), user });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  }
);

// POST /api/auth/login
app.post('/api/auth/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email=? AND is_active=1', [email]);
      if (!rows.length) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

      const user = rows[0];
      if (!user.password) return res.status(401).json({ message: 'Tài khoản này đăng nhập qua mạng xã hội' });

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

      const { password: _, ...safeUser } = user;
      res.json({ token: signToken(safeUser), user: safeUser });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  }
);

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, name, email, role, avatar, phone, address, created_at FROM users WHERE id=?',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy user' });
  res.json(rows[0]);
});

// ── OAuth Routes ──────────────────────────────────────────────
const oauthCallback = (provider) => (req, res) => {
  const token = signToken(req.user);
  res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}`);
};

app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
app.get('/api/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
  oauthCallback('google')
);

app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));
app.get('/api/auth/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
  oauthCallback('facebook')
);

app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
app.get('/api/auth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
  oauthCallback('github')
);

// ================================================================
// ROUTES - PRODUCTS
// ================================================================

// GET /api/products?category=&search=&page=&limit=
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    let where = ['p.is_active = 1'];
    const params = [];

    if (category) { where.push('c.slug = ?'); params.push(category); }
    if (search) { where.push('p.name LIKE ?'); params.push(`%${search}%`); }

    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [products] = await db.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p LEFT JOIN categories c ON c.id = p.category_id
      ${whereStr} ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `, [...params, +limit, +offset]);

    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) AS total FROM products p
      LEFT JOIN categories c ON c.id = p.category_id ${whereStr}
    `, params);

    res.json({ products, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// GET /api/products/:id (by numeric id)
app.get('/api/products/:id(\\d+)', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name,
        ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(r.id) AS review_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN reviews r ON r.product_id = p.id
      WHERE p.id = ? AND p.is_active = 1
      GROUP BY p.id, p.name, p.slug, p.description, p.price, p.original_price,
               p.stock, p.sold, p.image, p.badge, p.category_id, p.is_active,
               p.created_at, p.updated_at, c.name
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// GET /api/products/:slug
app.get('/api/products/:slug', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name,
        ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(r.id) AS review_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN reviews r ON r.product_id = p.id
      WHERE p.slug = ?
      GROUP BY p.id, p.name, p.slug, p.description, p.price, p.original_price,
               p.stock, p.sold, p.image, p.badge, p.category_id, p.is_active,
               p.created_at, p.updated_at, c.name
    `, [req.params.slug]);

    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    const [reviews] = await db.query(`
      SELECT r.*, u.name AS user_name, u.avatar AS user_avatar
      FROM reviews r JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ? ORDER BY r.created_at DESC LIMIT 10
    `, [rows[0].id]);

    res.json({ ...rows[0], reviews });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// POST /api/products (admin)
app.post('/api/products', authMiddleware, adminOnly,
  [body('name').notEmpty(), body('price').isNumeric()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, category_id, description, price, original_price, stock, image, badge } = req.body;
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    try {
      const [result] = await db.query(
        'INSERT INTO products (category_id, name, slug, description, price, original_price, stock, image, badge) VALUES (?,?,?,?,?,?,?,?,?)',
        [category_id, name, slug, description, price, original_price || null, stock || 0, image, badge]
      );
      const [rows] = await db.query('SELECT * FROM products WHERE id=?', [result.insertId]);
      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  }
);

// PUT /api/products/:id (admin)
app.put('/api/products/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, category_id, description, price, original_price, stock, image, badge, is_active } = req.body;
  try {
    await db.query(
      'UPDATE products SET name=?, category_id=?, description=?, price=?, original_price=?, stock=?, image=?, badge=?, is_active=?, updated_at=NOW() WHERE id=?',
      [name, category_id, description, price, original_price || null, stock, image, badge, is_active ?? 1, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM products WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// DELETE /api/products/:id (admin)
app.delete('/api/products/:id', authMiddleware, adminOnly, async (req, res) => {
  await db.query('UPDATE products SET is_active=0 WHERE id=?', [req.params.id]);
  res.json({ message: 'Đã xóa sản phẩm' });
});

// ================================================================
// ROUTES - CATEGORIES
// ================================================================

app.get('/api/categories', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
  res.json(rows);
});

// POST /api/categories (admin)
app.post('/api/categories', authMiddleware, adminOnly, async (req, res) => {
  const { name, slug, description } = req.body;
  if (!name || !slug) return res.status(400).json({ message: 'Thiếu tên hoặc slug' });
  try {
    const [result] = await db.query(
      'INSERT INTO categories (name, slug, description) VALUES (?,?,?)',
      [name, slug, description || null]
    );
    const [[row]] = await db.query('SELECT * FROM categories WHERE id=?', [result.insertId]);
    res.status(201).json(row);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Slug đã tồn tại' });
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/categories/:id (admin)
app.put('/api/categories/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, slug, description } = req.body;
  try {
    await db.query(
      'UPDATE categories SET name=?, slug=?, description=? WHERE id=?',
      [name, slug, description || null, req.params.id]
    );
    const [[row]] = await db.query('SELECT * FROM categories WHERE id=?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(row);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Slug đã tồn tại' });
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/categories/:id (admin)
app.delete('/api/categories/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) AS cnt FROM products WHERE category_id=? AND is_active=1', [req.params.id]);
    if (cnt > 0) return res.status(400).json({ message: `Danh mục có ${cnt} sản phẩm, không thể xóa` });
    await db.query('DELETE FROM categories WHERE id=?', [req.params.id]);
    res.json({ message: 'Đã xóa' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ================================================================
// ROUTES - ORDERS
// ================================================================

// POST /api/orders - Tạo đơn hàng
app.post('/api/orders', authMiddleware, async (req, res) => {
  const { items, receiver_name, receiver_phone, address, payment_method, note } = req.body;
  if (!items || !items.length) return res.status(400).json({ message: 'Giỏ hàng trống' });

  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    // Kiểm tra tồn kho
    for (const item of items) {
      const [[prod]] = await conn.query('SELECT stock, name FROM products WHERE id=? AND is_active=1', [item.product_id]);
      if (!prod) throw new Error(`Sản phẩm ID ${item.product_id} không tồn tại`);
      if (prod.stock < item.quantity) throw new Error(`"${prod.name}" không đủ hàng (còn ${prod.stock})`);
    }

    // Lấy giá thực từ DB (không tin client)
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const [[prod]] = await conn.query('SELECT id, name, price FROM products WHERE id=?', [item.product_id]);
      const lineTotal = prod.price * item.quantity;
      subtotal += lineTotal;
      orderItems.push({ product_id: prod.id, name: prod.name, price: prod.price, quantity: item.quantity, subtotal: lineTotal });
    }

    const total = subtotal;
    const order_code = genOrderCode();

    // Tạo order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (order_code, user_id, receiver_name, receiver_phone, address, subtotal, total, payment_method, note) VALUES (?,?,?,?,?,?,?,?,?)',
      [order_code, req.user.id, receiver_name, receiver_phone, address, subtotal, total, payment_method || 'cod', note || null]
    );
    const orderId = orderResult.insertId;

    // Tạo order_items & giảm stock
    for (const oi of orderItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, name, price, quantity, subtotal) VALUES (?,?,?,?,?,?)',
        [orderId, oi.product_id, oi.name, oi.price, oi.quantity, oi.subtotal]
      );
      await conn.query('UPDATE products SET stock=stock-?, sold=sold+? WHERE id=?', [oi.quantity, oi.quantity, oi.product_id]);
    }

    if (req.body.voucher_code) {
      await conn.query(
        'UPDATE vouchers SET used_count = used_count + 1 WHERE code = ? AND is_active = 1',
        [req.body.voucher_code.toUpperCase()]
      );
    }

    await conn.commit();
    const [[order]] = await conn.query('SELECT * FROM orders WHERE id=?', [orderId]);
    res.status(201).json({ order, items: orderItems });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/orders (user: đơn của mình | admin: tất cả)
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = req.user.role === 'admin' ? [] : ['o.user_id = ?'];
    const params = req.user.role === 'admin' ? [] : [req.user.id];

    if (status) { where.push('o.status = ?'); params.push(status); }
    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [orders] = await db.query(`
      SELECT o.*, u.name AS user_name, u.email AS user_email
      FROM orders o LEFT JOIN users u ON u.id = o.user_id
      ${whereStr} ORDER BY o.created_at DESC LIMIT ? OFFSET ?
    `, [...params, +limit, +offset]);

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// GET /api/orders/:id
app.get('/api/orders/:id', authMiddleware, async (req, res) => {
  try {
    const [[order]] = await db.query('SELECT o.*, u.name AS user_name FROM orders o LEFT JOIN users u ON u.id=o.user_id WHERE o.id=?', [req.params.id]);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });

    const [items] = await db.query('SELECT * FROM order_items WHERE order_id=?', [req.params.id]);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// PATCH /api/orders/:id/status (admin)
app.patch('/api/orders/:id/status', authMiddleware, adminOnly, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });

  await db.query('UPDATE orders SET status=?, updated_at=NOW() WHERE id=?', [status, req.params.id]);
  res.json({ message: 'Cập nhật thành công', status });
});
// ================================================================
// ROUTES - VNPAY PAYMENT (dùng thư viện vnpay)
// npm install vnpay
// ================================================================
const { VNPay, ignoreLogger, ProductCode, VnpLocale } = require('vnpay');

const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE,
  secureSecret: process.env.VNPAY_HASH_SECRET,
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,
  hashAlgorithm: 'SHA512',
  enableLog: false,
  loggerFn: ignoreLogger,
});

// POST /api/payment/vnpay-create
app.post('/api/payment/vnpay-create', authMiddleware, async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ message: 'Thiếu order_id' });

    const [[order]] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [order_id, req.user.id]
    );
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.payment_status === 'paid') return res.status(400).json({ message: 'Đơn hàng đã được thanh toán' });

    const txnRef = `${order.order_code}_${Date.now()}`;
    
    // ✅ SỬA 1: Xử lý IP rõ ràng hơn
    let ipAddr = getClientIp(req);
    if (!ipAddr || ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
    }
    console.log('🔍 IP gửi sang VNPay:', ipAddr); // Log để kiểm tra
    
    const amountRaw = Math.round(order.total);     // VD: 100000
    const amountVnpay = amountRaw * 100;           // VD: 10000000 (lưu DB)

    console.log('🔍 Amount raw:', amountRaw);
    console.log('🔍 Amount VNPay (x100):', amountVnpay);

    const payUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amountRaw,       // thư viện tự nhân 100
      vnp_IpAddr: ipAddr,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `ThanhToan_${order.order_code}`,
      vnp_OrderType: ProductCode.Other,
      vnp_Locale: VnpLocale.VN,
    });

    // ✅ SỬA 2: Lưu amountVnpay (đã x100) để so sánh với VNPay callback
    await db.query(
      `INSERT INTO vnpay_transactions (order_id, vnp_txn_ref, vnp_amount, status)
       VALUES (?, ?, ?, 'pending')
       ON DUPLICATE KEY UPDATE vnp_txn_ref = VALUES(vnp_txn_ref), 
                               vnp_amount = VALUES(vnp_amount),
                               status = 'pending'`,
      [order_id, txnRef, amountVnpay]  // ✅ Đúng: lưu amountRaw * 100
    );

    console.log(`✅ VNPay URL created | order=${order.order_code} | txnRef=${txnRef} | amount=${amountRaw}`);
    res.json({ payUrl });

  } catch (err) {
    console.error('❌ vnpay-create error:', err);
    res.status(500).json({ message: 'Lỗi tạo thanh toán', error: err.message });
  }
});

// GET /api/payment/vnpay-return
app.get('/api/payment/vnpay-return', async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    // ✅ THÊM: Log toàn bộ query VNPay trả về
    console.log('🔍 VNPay return query:', JSON.stringify(req.query, null, 2));
    
    const verify = vnpay.verifyReturnUrl(req.query);
    
    // ✅ THÊM: Log kết quả verify
    console.log('🔍 Verify result:', JSON.stringify(verify, null, 2));
    
    const txnRef = req.query.vnp_TxnRef;
    const respCode = req.query.vnp_ResponseCode;

    if (!verify.isVerified) {
      console.warn('⚠️  VNPay return: invalid signature');
      return res.redirect(`${clientUrl}/?payment=fail&reason=invalid_signature`);
    }

    const isPaid = verify.isSuccess;
    const status = isPaid ? 'success' : 'failed';

    await db.query(
      `UPDATE vnpay_transactions
       SET status = ?, vnp_response_code = ?, vnp_transaction_no = ?,
           vnp_bank_code = ?, raw_response = ?
       WHERE vnp_txn_ref = ?`,
      [status, respCode, req.query.vnp_TransactionNo || '', req.query.vnp_BankCode || '', JSON.stringify(req.query), txnRef]
    );

    const [[txn]] = await db.query(
      `SELECT t.order_id, o.order_code FROM vnpay_transactions t
       JOIN orders o ON o.id = t.order_id WHERE t.vnp_txn_ref = ?`,
      [txnRef]
    );

    if (!txn) return res.redirect(`${clientUrl}/?payment=fail&reason=not_found`);

    if (isPaid) {
      await db.query(
        `UPDATE orders SET payment_status = 'paid', status = 'confirmed', updated_at = NOW()
         WHERE id = ? AND payment_status != 'paid'`,
        [txn.order_id]
      );
      console.log(`✅ Payment success | order=${txn.order_code} | txnRef=${txnRef}`);
      return res.redirect(`${clientUrl}/?payment=success&ref=${txnRef}&order=${txn.order_code}`);
    }

    console.log(`❌ Payment failed | order=${txn.order_code} | code=${respCode}`);
    return res.redirect(`${clientUrl}/?payment=fail&ref=${txnRef}&order=${txn.order_code}&code=${respCode}`);
  } catch (err) {
    console.error('❌ vnpay-return error:', err);
    return res.redirect(`${clientUrl}/payment/result?status=fail&reason=server_error`);
  }
});

// POST /api/payment/vnpay-ipn
app.post('/api/payment/vnpay-ipn', async (req, res) => {
  try {
    const verify = vnpay.verifyIpnCall(req.query);
    const txnRef = req.query.vnp_TxnRef;
    const respCode = req.query.vnp_ResponseCode;

    if (!verify.isVerified) {
      console.warn('⚠️  VNPay IPN: invalid signature');
      return res.json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const [[txn]] = await db.query(
      'SELECT * FROM vnpay_transactions WHERE vnp_txn_ref = ?', [txnRef]
    );

    if (!txn) return res.json({ RspCode: '01', Message: 'Order not found' });
    if (txn.status === 'success') return res.json({ RspCode: '02', Message: 'Already confirmed' });

    // ✅ SỬA 3: So sánh đúng — cả 2 đều là format x100
    const dbAmount = String(txn.vnp_amount);
    const vnpAmount = String(req.query.vnp_Amount);
    console.log('🔍 IPN amount check | DB:', dbAmount, '| VNPay:', vnpAmount);
    
    if (dbAmount !== vnpAmount) {
      console.warn('⚠️  VNPay IPN: amount mismatch', { dbAmount, vnpAmount });
      return res.json({ RspCode: '04', Message: 'Invalid amount' });
    }

    const isPaid = verify.isSuccess;
    const status = isPaid ? 'success' : 'failed';

    await db.query(
      `UPDATE vnpay_transactions SET status = ?, vnp_response_code = ?,
       vnp_transaction_no = ?, vnp_bank_code = ?, raw_response = ?
       WHERE vnp_txn_ref = ?`,
      [status, respCode, req.query.vnp_TransactionNo || '', req.query.vnp_BankCode || '', JSON.stringify(req.query), txnRef]
    );

    if (isPaid) {
      await db.query(
        `UPDATE orders SET payment_status = 'paid', status = 'confirmed', updated_at = NOW()
         WHERE id = ? AND payment_status != 'paid'`,
        [txn.order_id]
      );
      console.log(`✅ IPN confirmed | order_id=${txn.order_id}`);
    }

    return res.json({ RspCode: '00', Message: 'Confirm Success' });

  } catch (err) {
    console.error('❌ vnpay-ipn error:', err);
    return res.json({ RspCode: '99', Message: 'Unknown error' });
  }
});


// ================================================================
// ROUTES - REVIEWS
// ================================================================

// GET /api/reviews?product_id=
app.get('/api/reviews', async (req, res) => {
  const { product_id } = req.query;
  if (!product_id) return res.status(400).json({ message: 'Thiếu product_id' });
  try {
    const [reviews] = await db.query(`
      SELECT r.id, r.rating, r.comment, r.title, r.created_at,
        u.name AS user_name, u.avatar AS user_avatar,
        1 AS verified
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [product_id]);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// POST /api/reviews
app.post('/api/reviews', authMiddleware,
  [body('product_id').isInt(), body('rating').isInt({ min: 1, max: 5 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { product_id, rating, comment, title } = req.body;
    try {
      await db.query(
        'INSERT INTO reviews (product_id, user_id, rating, title, comment) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE rating=VALUES(rating), title=VALUES(title), comment=VALUES(comment)',
        [product_id, req.user.id, rating, title || null, comment || null]
      );
      const [[rev]] = await db.query(
        'SELECT r.*, u.name AS user_name, 1 AS verified FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.product_id=? AND r.user_id=? ORDER BY r.created_at DESC LIMIT 1',
        [product_id, req.user.id]
      );
      res.status(201).json(rev);
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  }
);

// ================================================================
// ROUTES - ADMIN STATS
// ================================================================

app.get('/api/admin/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [[revenue]] = await db.query("SELECT COALESCE(SUM(total),0) AS total FROM orders WHERE status='delivered' AND payment_status='paid'");
    const [[orders]] = await db.query('SELECT COUNT(*) AS total FROM orders');
    const [[products]] = await db.query('SELECT COUNT(*) AS total FROM products WHERE is_active=1');
    const [[users]] = await db.query("SELECT COUNT(*) AS total FROM users WHERE role='user'");
    const [byStatus] = await db.query("SELECT status, COUNT(*) AS count FROM orders GROUP BY status");
    const [topProducts] = await db.query("SELECT name, sold, price FROM products WHERE is_active=1 ORDER BY sold DESC LIMIT 5");

    res.json({
      revenue: revenue.total,
      orders: orders.total,
      products: products.total,
      users: users.total,
      ordersByStatus: byStatus,
      topProducts,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// GET /api/admin/users (admin)
app.get('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  const [users] = await db.query('SELECT id, name, email, role, avatar, phone, is_active, created_at FROM users ORDER BY created_at DESC');
  res.json(users);
});

// PATCH /api/admin/users/:id (admin - toggle active)
app.patch('/api/admin/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const { is_active } = req.body;
  await db.query('UPDATE users SET is_active=? WHERE id=?', [is_active, req.params.id]);
  res.json({ message: 'Cập nhật thành công' });
});

// ================================================================
// ROUTES - ADMIN REVIEWS
// ================================================================

// GET /api/admin/reviews
app.get('/api/admin/reviews', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, u.name AS user_name, u.email AS user_email,
             p.name AS product_name
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN products p ON p.id = r.product_id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/admin/reviews/:id
app.delete('/api/admin/reviews/:id', authMiddleware, adminOnly, async (req, res) => {
  await db.query('DELETE FROM reviews WHERE id=?', [req.params.id]);
  res.json({ message: 'Đã xóa' });
});

// ================================================================
// ROUTES - VOUCHERS
// ================================================================

// GET /api/admin/vouchers
app.get('/api/admin/vouchers', authMiddleware, adminOnly, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM vouchers ORDER BY created_at DESC');
  res.json(rows);
});

// POST /api/admin/vouchers
app.post('/api/admin/vouchers', authMiddleware, adminOnly, async (req, res) => {
  const { code, type, value, min_order = 0, max_uses = null, expires_at = null, is_active = 1 } = req.body;
  if (!code || !value) return res.status(400).json({ message: 'Thiếu mã hoặc giá trị' });
  try {
    const [result] = await db.query(
      'INSERT INTO vouchers (code,type,value,min_order,max_uses,expires_at,is_active) VALUES (?,?,?,?,?,?,?)',
      [code.toUpperCase(), type || 'percent', +value, +min_order, max_uses || null, expires_at || null, is_active]
    );
    const [[row]] = await db.query('SELECT * FROM vouchers WHERE id=?', [result.insertId]);
    res.status(201).json(row);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Mã voucher đã tồn tại' });
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/admin/vouchers/:id
app.put('/api/admin/vouchers/:id', authMiddleware, adminOnly, async (req, res) => {
  const { code, type, value, min_order, max_uses, expires_at, is_active } = req.body;
  try {
    await db.query(
      'UPDATE vouchers SET code=?,type=?,value=?,min_order=?,max_uses=?,expires_at=?,is_active=? WHERE id=?',
      [code?.toUpperCase(), type, +value, +min_order || 0, max_uses || null, expires_at || null, is_active, req.params.id]
    );
    const [[row]] = await db.query('SELECT * FROM vouchers WHERE id=?', [req.params.id]);
    res.json(row);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/admin/vouchers/:id
app.delete('/api/admin/vouchers/:id', authMiddleware, adminOnly, async (req, res) => {
  await db.query('DELETE FROM vouchers WHERE id=?', [req.params.id]);
  res.json({ message: 'Đã xóa' });
});

// GET /api/vouchers/public
app.get('/api/vouchers/public', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, code, type, value, min_order, max_uses, used_count, expires_at
      FROM vouchers
      WHERE is_active = 1
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR used_count < max_uses)
      ORDER BY value DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/vouchers/validate
app.post('/api/vouchers/validate', async (req, res) => {
  const { code, order_total } = req.body;
  if (!code) return res.status(400).json({ message: 'Vui lòng nhập mã' });
  try {
    const [[v]] = await db.query(
      'SELECT * FROM vouchers WHERE code=? AND is_active=1 AND (expires_at IS NULL OR expires_at > NOW()) AND (max_uses IS NULL OR used_count < max_uses)',
      [code.toUpperCase()]
    );
    if (!v) return res.status(404).json({ message: 'Mã không hợp lệ hoặc đã hết hạn' });
    if (v.min_order > 0 && order_total < v.min_order)
      return res.status(400).json({ message: `Đơn tối thiểu ${v.min_order.toLocaleString()}₫` });
    const discount = v.type === 'percent'
      ? Math.round(order_total * v.value / 100)
      : Math.min(v.value, order_total);
    res.json({ valid: true, voucher: v, discount });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ================================================================
// ROUTES - MESSAGES
// ================================================================

// GET /api/admin/messages
app.get('/api/admin/messages', authMiddleware, adminOnly, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
  res.json(rows);
});

// POST /api/messages (public)
app.post('/api/messages', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ message: 'Thiếu thông tin' });
  try {
    const [r] = await db.query(
      'INSERT INTO messages (name,email,phone,subject,message) VALUES (?,?,?,?,?)',
      [name, email, phone || null, subject || 'Liên hệ', message]
    );
    res.status(201).json({ id: r.insertId, message: 'Đã gửi thành công!' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/admin/messages/:id/reply
app.post('/api/admin/messages/:id/reply', authMiddleware, adminOnly, async (req, res) => {
  const { reply } = req.body;
  await db.query('UPDATE messages SET reply=?, replied_at=NOW() WHERE id=?', [reply, req.params.id]);
  res.json({ message: 'Đã lưu phản hồi' });
});

// PATCH /api/admin/messages/:id/read
app.patch('/api/admin/messages/:id/read', authMiddleware, adminOnly, async (req, res) => {
  await db.query('UPDATE messages SET is_read=1 WHERE id=?', [req.params.id]);
  res.json({ message: 'OK' });
});

// DELETE /api/admin/messages/:id
app.delete('/api/admin/messages/:id', authMiddleware, adminOnly, async (req, res) => {
  await db.query('DELETE FROM messages WHERE id=?', [req.params.id]);
  res.json({ message: 'Đã xóa' });
});

// ================================================================
// ROUTES - SETTINGS
// ================================================================

// GET /api/admin/settings
app.get('/api/admin/settings', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT `key`, `value` FROM settings');
    const obj = {};
    rows.forEach(r => { obj[r.key] = r.value; });
    res.json(obj);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/admin/settings
app.put('/api/admin/settings', authMiddleware, adminOnly, async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await db.query(
        'INSERT INTO settings (`key`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=?',
        [key, String(value), String(value)]
      );
    }
    res.json({ message: 'Đã lưu cài đặt' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/upload/image (admin)
app.post('/api/upload/image', authMiddleware, adminOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Không có file' });

    const folder = req.body.folder || 'uncategorized';
    const targetDir = path.join(UPLOAD_DIR, folder);

    // Tạo thư mục theo danh mục nếu chưa có
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // Di chuyển file vào đúng thư mục
    const newPath = path.join(targetDir, req.file.filename);
    fs.renameSync(req.file.path, newPath);

    // Trả về đường dẫn tương đối
    const url = `/uploads/${folder}/${req.file.filename}`;
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================================================================
// HEALTH CHECK
// ================================================================ ================================================================

const Groq = require('groq-sdk');

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !messages.length) return res.status(400).json({ message: 'Thiếu messages' });

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) return res.status(500).json({ message: 'Chưa cấu hình GROQ_API_KEY' });

    const groq = new Groq({ apiKey: GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.75,
      max_tokens: 700,
      response_format: { type: "json_object" }, // ép model trả JSON thuần túy, không có text thừa
    });

    const text = completion.choices[0]?.message?.content || '';
    res.json({ text });

  } catch (err) {
    console.error('Chat route error:', err);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Lỗi server' });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// ================================================================
// START SERVER
// ================================================================
const PORT = process.env.PORT || 5000;

// Chỉ listen khi không phải môi trường test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;
