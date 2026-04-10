// database/seed-orders.js
// Chạy: node database/seed-orders.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedOrders() {
  const conn = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'habana_sport',
      ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
       ssl:      { rejectUnauthorized: true },
    });

  console.log('🌱 Seeding orders & reviews...');

  // Lấy user_id và product ids
  const [[user]] = await conn.query("SELECT id FROM users WHERE role='user' LIMIT 1");
  const [prods] = await conn.query("SELECT id, name, price FROM products LIMIT 6");

  if (!user || !prods.length) {
    console.log('❌ Chạy seed.js trước!');
    process.exit(1);
  }

  // Tạo 10 đơn hàng mẫu
  const statuses = ['pending','confirmed','shipping','delivered','delivered','delivered','cancelled','delivered','shipping','confirmed'];
  const payments = ['cod','vnpay','cod','vnpay','cod','vnpay','cod','vnpay','cod','vnpay'];

  for (let i = 0; i < 10; i++) {
    const prod = prods[i % prods.length];
    const qty = Math.floor(Math.random() * 3) + 1;
    const subtotal = prod.price * qty;
    const code = 'HS' + Date.now().toString().slice(-6) + i;

    const names = ['Nguyễn Văn A','Trần Thị B','Lê Văn C','Phạm Thị D','Hoàng Văn E','Vũ Thị F','Đặng Văn G','Bùi Thị H','Đỗ Văn I','Ngô Thị K'];
    const phones = ['0901234567','0912345678','0923456789','0934567890','0945678901','0956789012','0967890123','0978901234','0989012345','0990123456'];
    const addresses = [
      'Số 1 Nguyễn Huệ, Q1, TP.HCM',
      'Số 2 Lê Lợi, Q3, TP.HCM',
      'Số 3 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
      'Số 4 Đinh Tiên Hoàng, Q1, TP.HCM',
      'Số 5 Hai Bà Trưng, Q1, TP.HCM',
      'Số 6 Cầu Giấy, Hà Nội',
      'Số 7 Lê Duẩn, Q1, TP.HCM',
      'Số 8 Nguyễn Trãi, Q5, TP.HCM',
      'Số 9 Phan Xích Long, Q. Phú Nhuận, TP.HCM',
      'Số 10 Hoàng Diệu, Đà Nẵng',
    ];

    const [orderResult] = await conn.query(
      `INSERT INTO orders 
        (order_code, user_id, receiver_name, receiver_phone, address, subtotal, total, status, payment_method, payment_status, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [code, user.id, names[i], phones[i], addresses[i], subtotal, subtotal, statuses[i], payments[i],
       statuses[i]==='delivered'?'paid':'unpaid', i * 2]
    );

    await conn.query(
      'INSERT INTO order_items (order_id, product_id, name, price, quantity, subtotal) VALUES (?,?,?,?,?,?)',
      [orderResult.insertId, prod.id, prod.name, prod.price, qty, subtotal]
    );

    // Cập nhật sold count
    await conn.query('UPDATE products SET sold=sold+? WHERE id=?', [qty, prod.id]);
  }

  // Tạo reviews mẫu
  const comments = [
    'Sản phẩm rất tốt, dùng được 1 tháng vẫn ổn!',
    'Giao hàng nhanh, đóng gói cẩn thận.',
    'Chất lượng tốt so với giá tiền.',
    'Tập được 2 tuần thấy hiệu quả rõ rệt!',
    'Sẽ mua lại lần sau.',
  ];

  for (let i = 0; i < prods.length; i++) {
    try {
      await conn.query(
        'INSERT IGNORE INTO reviews (product_id, user_id, rating, comment) VALUES (?,?,?,?)',
        [prods[i].id, user.id, Math.floor(Math.random()*2)+4, comments[i % comments.length]]
      );
    } catch(e) { /* bỏ qua nếu đã có */ }
  }

  console.log('✅ Seed orders & reviews thành công!');
  console.log(`   ✓ 10 đơn hàng mẫu`);
  console.log(`   ✓ ${prods.length} đánh giá mẫu`);
  await conn.end();
}

seedOrders().catch(err => { console.error('❌ Lỗi:', err.message); process.exit(1); });