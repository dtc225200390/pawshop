// backend/tests/setup/test-db.js
const mysql = require('mysql2/promise');

const TEST_DB_NAME = 'pawshop_test';

async function setupTestDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  // Tạo database test
  await connection.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
  await connection.query(`CREATE DATABASE ${TEST_DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE ${TEST_DB_NAME}`);

  // Tạo các bảng cần thiết cho test
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE,
      password VARCHAR(255),
      role ENUM('user','admin') DEFAULT 'user',
      avatar VARCHAR(500),
      phone VARCHAR(20),
      address TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(120) UNIQUE NOT NULL,
      description TEXT,
      image LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      category_id INT UNSIGNED,
      name VARCHAR(200) NOT NULL,
      slug VARCHAR(220) UNIQUE NOT NULL,
      description TEXT,
      price DECIMAL(12,0) NOT NULL,
      original_price DECIMAL(12,0),
      stock INT DEFAULT 0,
      sold INT DEFAULT 0,
      image LONGTEXT,
      badge VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_code VARCHAR(20) UNIQUE NOT NULL,
      user_id INT UNSIGNED,
      receiver_name VARCHAR(100) NOT NULL,
      receiver_phone VARCHAR(20) NOT NULL,
      address TEXT NOT NULL,
      subtotal DECIMAL(12,0) NOT NULL,
      shipping_fee DECIMAL(12,0) DEFAULT 0,
      total DECIMAL(12,0) NOT NULL,
      status ENUM('pending','confirmed','shipping','delivered','cancelled') DEFAULT 'pending',
      payment_method ENUM('vnpay','cod') DEFAULT 'cod',
      payment_status ENUM('unpaid','paid','refunded') DEFAULT 'unpaid',
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id INT UNSIGNED NOT NULL,
      product_id INT UNSIGNED,
      name VARCHAR(200) NOT NULL,
      price DECIMAL(12,0) NOT NULL,
      quantity INT NOT NULL,
      subtotal DECIMAL(12,0) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      product_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED NOT NULL,
      rating TINYINT NOT NULL,
      title VARCHAR(200) DEFAULT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY one_review (product_id, user_id)
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      type ENUM('percent','fixed') DEFAULT 'percent',
      value DECIMAL(12,0) NOT NULL,
      min_order DECIMAL(12,0) DEFAULT 0,
      max_uses INT UNSIGNED DEFAULT NULL,
      used_count INT UNSIGNED DEFAULT 0,
      expires_at DATETIME DEFAULT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(20) DEFAULT NULL,
      subject VARCHAR(200) DEFAULT 'Liên hệ',
      message TEXT NOT NULL,
      reply TEXT DEFAULT NULL,
      replied_at DATETIME DEFAULT NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(100) PRIMARY KEY,
      \`value\` TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await connection.query(`
    INSERT IGNORE INTO settings (\`key\`, \`value\`) VALUES
    ('shop_name', 'PawShop Test'),
    ('maintenance_mode', '0');
  `);

  await connection.end();
  console.log(`✅ Test database ${TEST_DB_NAME} created`);
}

module.exports = { setupTestDB, TEST_DB_NAME };