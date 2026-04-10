// database/migrate.js - Chạy: node database/migrate.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
    // ssl:      { rejectUnauthorized: true },
  });

  console.log('🚀 Bắt đầu migrate database...');

  await conn.query(`CREATE DATABASE IF NOT EXISTS pawshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await conn.query(`USE pawshop;`);

  // USERS
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(150) UNIQUE,
      password    VARCHAR(255),
      role        ENUM('user','admin') DEFAULT 'user',
      avatar      VARCHAR(500),
      phone       VARCHAR(20),
      address     TEXT,
      is_active   BOOLEAN DEFAULT TRUE,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // OAUTH ACCOUNTS
  await conn.query(`
    CREATE TABLE IF NOT EXISTS oauth_accounts (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id     INT UNSIGNED NOT NULL,
      provider    ENUM('google','facebook','github') NOT NULL,
      provider_id VARCHAR(200) NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_provider (provider, provider_id)
    );
  `);

  // CATEGORIES
  await conn.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      slug        VARCHAR(120) UNIQUE NOT NULL,
      description TEXT,
      image       LONGTEXT,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // PRODUCTS
  await conn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      category_id    INT UNSIGNED,
      name           VARCHAR(200) NOT NULL,
      slug           VARCHAR(220) UNIQUE NOT NULL,
      description    TEXT,
      price          DECIMAL(12,0) NOT NULL,
      original_price DECIMAL(12,0),
      stock          INT DEFAULT 0,
      sold           INT DEFAULT 0,
      image          LONGTEXT,
      badge          VARCHAR(50),
      is_active      BOOLEAN DEFAULT TRUE,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  // ORDERS
  await conn.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_code      VARCHAR(20) UNIQUE NOT NULL,
      user_id         INT UNSIGNED,
      receiver_name   VARCHAR(100) NOT NULL,
      receiver_phone  VARCHAR(20) NOT NULL,
      address         TEXT NOT NULL,
      subtotal        DECIMAL(12,0) NOT NULL,
      shipping_fee    DECIMAL(12,0) DEFAULT 0,
      total           DECIMAL(12,0) NOT NULL,
      status          ENUM('pending','confirmed','shipping','delivered','cancelled') DEFAULT 'pending',
      payment_method  ENUM('vnpay','cod') DEFAULT 'cod',
      payment_status  ENUM('unpaid','paid','refunded') DEFAULT 'unpaid',
      note            TEXT,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // ORDER ITEMS
  await conn.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id    INT UNSIGNED NOT NULL,
      product_id  INT UNSIGNED,
      name        VARCHAR(200) NOT NULL,
      price       DECIMAL(12,0) NOT NULL,
      quantity    INT NOT NULL,
      subtotal    DECIMAL(12,0) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
  `);

  // VNPAY TRANSACTIONS
  await conn.query(`
    CREATE TABLE IF NOT EXISTS vnpay_transactions (
      id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id            INT UNSIGNED NOT NULL,
      vnp_txn_ref         VARCHAR(100) UNIQUE NOT NULL,
      vnp_amount          BIGINT NOT NULL,
      vnp_response_code   VARCHAR(10),
      vnp_transaction_no  VARCHAR(100),
      vnp_bank_code       VARCHAR(20),
      status              ENUM('pending','success','failed') DEFAULT 'pending',
      raw_response        JSON,
      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // REVIEWS
  await conn.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      product_id  INT UNSIGNED NOT NULL,
      user_id     INT UNSIGNED NOT NULL,
      rating      TINYINT NOT NULL,
      title       VARCHAR(200) DEFAULT NULL,
      comment     TEXT,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY one_review (product_id, user_id)
    );
  `);

  // VOUCHERS
  await conn.query(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code        VARCHAR(50) UNIQUE NOT NULL,
      type        ENUM('percent','fixed') DEFAULT 'percent',
      value       DECIMAL(12,0) NOT NULL,
      min_order   DECIMAL(12,0) DEFAULT 0,
      max_uses    INT UNSIGNED DEFAULT NULL,
      used_count  INT UNSIGNED DEFAULT 0,
      expires_at  DATETIME DEFAULT NULL,
      is_active   TINYINT(1) DEFAULT 1,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // MESSAGES
  await conn.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(150) NOT NULL,
      phone       VARCHAR(20) DEFAULT NULL,
      subject     VARCHAR(200) DEFAULT 'Liên hệ',
      message     TEXT NOT NULL,
      reply       TEXT DEFAULT NULL,
      replied_at  DATETIME DEFAULT NULL,
      is_read     TINYINT(1) DEFAULT 0,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // SETTINGS
  await conn.query(`
    CREATE TABLE IF NOT EXISTS settings (
      \`key\`      VARCHAR(100) PRIMARY KEY,
      \`value\`    TEXT NOT NULL,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // ── Default settings cho PawShop ─────────────────────────
  await conn.query(`
    INSERT IGNORE INTO settings (\`key\`, \`value\`) VALUES
    ('shop_name',       'PawShop'),
    ('shop_slogan',     'Yêu thương thú cưng mỗi ngày'),
    ('shop_email',      'support@pawshop.vn'),
    ('shop_phone',      '1800 5678'),
    ('shop_address',    'TP. Hồ Chí Minh, Việt Nam'),
    ('free_ship_min',   '300000'),
    ('maintenance_mode','0');
  `);

  // ── Categories thú cưng ───────────────────────────────────
  await conn.query(`
    INSERT IGNORE INTO categories (name, slug, description) VALUES
    ('Thức Ăn',     'thuc-an',  'Thức ăn hạt, pate, wet food cho chó và mèo'),
    ('Phụ Kiện',    'phu-kien', 'Vòng cổ, dây xích, bát ăn, lồng vận chuyển'),
    ('Đồ Chơi',     'do-choi',  'Đồ chơi cắn, bóng, đồ chơi tương tác cho thú cưng'),
    ('Sức Khỏe',    'suc-khoe', 'Vitamin, thuốc bổ, sản phẩm chăm sóc sức khỏe'),
    ('Chuồng & Nhà','chuong',   'Chuồng, nhà, đệm ngủ, nơi trú ẩn cho thú cưng');
  `);

  // ── Admin account mặc định ────────────────────────────────
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('admin123', 10);
  await conn.query(`
    INSERT IGNORE INTO users (name, email, password, role) VALUES
    ('Admin', 'admin@pawshop.vn', '${hash}', 'admin');
  `);

  // ── Sản phẩm mẫu ─────────────────────────────────────────
  await conn.query(`
    INSERT IGNORE INTO products (name, slug, category_id, description, price, original_price, stock, badge) VALUES
    ('Royal Canin Adult 2kg',       'royal-canin-adult-2kg',     (SELECT id FROM categories WHERE slug='thuc-an'),  'Thức ăn hạt cao cấp cho chó trưởng thành, giàu protein và vitamin thiết yếu', 320000, 380000, 50, 'HOT'),
    ('Pate Whiskas cho mèo 400g',   'pate-whiskas-meo-400g',     (SELECT id FROM categories WHERE slug='thuc-an'),  'Pate thơm ngon với cá thu, kích thích vị giác cho mèo', 45000, NULL, 100, 'NEW'),
    ('Hạt Catsrang túi 1kg',        'hat-catsrang-1kg',          (SELECT id FROM categories WHERE slug='thuc-an'),  'Thức ăn hạt kinh tế cho mèo, đầy đủ dinh dưỡng, mùi thơm hấp dẫn', 85000, 95000, 80, NULL),
    ('Vòng cổ da bò có khắc tên',   'vong-co-da-bo-khac-ten',    (SELECT id FROM categories WHERE slug='phu-kien'), 'Vòng cổ da bò thật, bền đẹp, có thể khắc tên thú cưng theo yêu cầu', 120000, 150000, 30, 'NEW'),
    ('Dây dắt chó tự rút 5m',       'day-dat-cho-tu-rut-5m',     (SELECT id FROM categories WHERE slug='phu-kien'), 'Dây dắt tự rút 5m, khóa an toàn, tay cầm chống trơn trượt', 95000, NULL, 60, NULL),
    ('Bát ăn inox 2 ngăn cho chó',  'bat-an-inox-2-ngan',        (SELECT id FROM categories WHERE slug='phu-kien'), 'Bát inox 304 cao cấp, 2 ngăn ăn và uống, chống trượt', 75000, 90000, 45, NULL),
    ('Bóng cao su đặc siêu bền',    'bong-cao-su-dac-sieu-ben',  (SELECT id FROM categories WHERE slug='do-choi'),  'Bóng cao su tự nhiên, an toàn cho thú cưng, chịu lực cắn mạnh', 65000, NULL, 80, 'HOT'),
    ('Cần câu lông vũ cho mèo',     'can-cau-long-vu-meo',       (SELECT id FROM categories WHERE slug='do-choi'),  'Cần câu lông vũ màu sắc, kích thích bản năng săn mồi của mèo', 35000, NULL, 120, 'NEW'),
    ('Đồ chơi chuột kêu cho mèo',   'do-choi-chuot-keu-meo',     (SELECT id FROM categories WHERE slug='do-choi'),  'Đồ chơi hình chuột có tiếng kêu, chất liệu an toàn, giúp mèo vận động', 28000, NULL, 90, NULL),
    ('Vitamin tổng hợp cho mèo',    'vitamin-tong-hop-meo',      (SELECT id FROM categories WHERE slug='suc-khoe'), 'Bổ sung vitamin A, D, E và khoáng chất thiết yếu, tăng đề kháng cho mèo', 180000, 220000, 40, 'HOT'),
    ('Men tiêu hóa cho chó mèo',    'men-tieu-hoa-cho-meo',      (SELECT id FROM categories WHERE slug='suc-khoe'), 'Hỗ trợ tiêu hóa, giảm tiêu chảy, tăng hấp thụ dinh dưỡng', 95000, 110000, 55, NULL),
    ('Dầu gội thú cưng hương lavender', 'dau-goi-thu-cung-lavender', (SELECT id FROM categories WHERE slug='suc-khoe'), 'Dầu gội nhẹ nhàng, an toàn cho da nhạy cảm, hương thơm dịu nhẹ', 120000, NULL, 35, 'NEW'),
    ('Nhà gỗ thông cho mèo 2 tầng', 'nha-go-thong-meo-2-tang',   (SELECT id FROM categories WHERE slug='chuong'),   'Nhà gỗ thông tự nhiên, 2 tầng, đệm mềm tháo giặt được, thiết kế cute', 850000, 1000000, 15, 'HOT'),
    ('Chuồng inox gấp gọn cho chó', 'chuong-inox-gap-gon-cho',   (SELECT id FROM categories WHERE slug='chuong'),   'Chuồng inox chắc chắn, gấp gọn tiện lợi, kích thước M phù hợp chó nhỏ và vừa', 650000, 750000, 20, NULL),
    ('Đệm ngủ tròn lông cừu giả',   'dem-ngu-tron-long-cuu-gia', (SELECT id FROM categories WHERE slug='chuong'),   'Đệm ngủ tròn ấm áp, chất liệu lông cừu giả mềm mại, giặt máy được', 220000, 280000, 40, 'SALE');
  `);

  console.log('✅ Migrate PawShop thành công!');
  console.log('📧 Admin: admin@pawshop.vn / admin123');
  console.log('🐾 Categories: 5 danh mục thú cưng');
  console.log('📦 Products: 15 sản phẩm mẫu');
  await conn.end();
}

migrate().catch(err => { console.error('❌ Lỗi migrate:', err); process.exit(1); });