// database/seed.js — chạy: node database/seed.js
require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'pawshop',
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
     ssl:      { rejectUnauthorized: true },
  });

  console.log('🌱 Seeding dữ liệu PawShop...\n');

  // ── 1. CLEAR ──────────────────────────────────────────────
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of ['reviews','order_items','orders','products','categories','oauth_accounts','users','vouchers','messages','settings'])
    await conn.query(`TRUNCATE TABLE \`${t}\``);
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');

  // ── 2. USERS (1 admin + 20 users) ─────────────────────────
  console.log('👥 Tạo users...');
  const adminHash = await bcrypt.hash('admin123', 10);
  const userHash  = await bcrypt.hash('user123',  10);
  const userNames = [
    'Nguyễn Văn An','Trần Thị Bình','Lê Văn Cường','Phạm Thị Dung',
    'Hoàng Văn Em','Vũ Thị Phương','Đặng Văn Giang','Bùi Thị Hà',
    'Đỗ Văn Hùng','Ngô Thị Khanh','Đinh Văn Long','Lý Thị Mai',
    'Cao Văn Nam','Dương Thị Oanh','Trịnh Văn Phong','Hồ Thị Quỳnh',
    'Tô Văn Sang','Lưu Thị Thanh','Phan Văn Tuấn','Võ Thị Uyên',
  ];
  await conn.query('INSERT INTO users (name,email,password,role,phone,is_active,created_at) VALUES ?', [[
    ['Admin PawShop','admin@pawshop.vn',adminHash,'admin','0901000001',1,new Date()],
    ['Test User','user@pawshop.vn',userHash,'user','0901000002',1,new Date()],
    ...userNames.map((name,i)=>[
      name, `user${i+1}@gmail.com`, userHash, 'user',
      `090${String(1000003+i).padStart(7,'0')}`,
      Math.random()>0.1?1:0,
      new Date(Date.now()-Math.random()*90*86400000),
    ])
  ]]);
  const [users] = await conn.query("SELECT id,name FROM users WHERE role='user'");
  console.log(`   ✓ ${users.length+1} users`);

  // ── 3. CATEGORIES (5 danh mục thú cưng) ──────────────────
  console.log('📂 Tạo categories...');
  await conn.query(`INSERT INTO categories (name,slug,description) VALUES
    ('Thức Ăn',      'thuc-an',  'Thức ăn hạt, pate, wet food cho chó và mèo'),
    ('Phụ Kiện',     'phu-kien', 'Vòng cổ, dây xích, bát ăn, lồng vận chuyển'),
    ('Đồ Chơi',      'do-choi',  'Đồ chơi cắn, bóng, đồ chơi tương tác cho thú cưng'),
    ('Sức Khỏe',     'suc-khoe', 'Vitamin, thuốc bổ, sản phẩm chăm sóc sức khỏe'),
    ('Chuồng & Nhà', 'chuong',   'Chuồng, nhà, đệm ngủ, nơi trú ẩn cho thú cưng')`);
  const [cats] = await conn.query("SELECT id FROM categories");
  console.log(`   ✓ ${cats.length} categories`);

  // ── 4. PRODUCTS (20 sản phẩm thú cưng) ───────────────────
  console.log('📦 Tạo products...');
  // [category_slug, name, slug, description, price, original_price, stock, sold, badge]
  const prData = [
    // Thức ăn
    ['thuc-an','Royal Canin Adult 2kg','royal-canin-adult-2kg','Thức ăn hạt cao cấp cho chó trưởng thành, giàu protein và vitamin thiết yếu, hỗ trợ tiêu hóa và lông khỏe mạnh.',320000,380000,50,128,'HOT'],
    ['thuc-an','Pate Whiskas cá thu 400g','pate-whiskas-ca-thu-400g','Pate thơm ngon với cá thu tươi, kích thích vị giác cho mèo kén ăn, dạng hộp tiện lợi.',45000,null,100,245,'NEW'],
    ['thuc-an','Hạt Catsrang túi 1kg','hat-catsrang-1kg','Thức ăn hạt kinh tế cho mèo mọi lứa tuổi, đủ dinh dưỡng, mùi thơm hấp dẫn.',85000,95000,80,189,''],
    ['thuc-an','Pedigree Adult gà & rau 1.5kg','pedigree-adult-ga-rau-1-5kg','Thức ăn hạt Pedigree vị gà và rau củ cho chó trưởng thành, cân bằng dinh dưỡng.',155000,180000,60,97,''],
    // Phụ kiện
    ['phu-kien','Vòng cổ da bò có khắc tên','vong-co-da-bo-khac-ten','Vòng cổ da bò thật, bền đẹp, có thể khắc tên thú cưng và số điện thoại theo yêu cầu.',120000,150000,30,78,'NEW'],
    ['phu-kien','Dây dắt chó tự rút 5m','day-dat-cho-tu-rut-5m','Dây dắt tự rút 5m, khóa an toàn, tay cầm chống trơn trượt, phù hợp chó dưới 25kg.',95000,null,60,134,''],
    ['phu-kien','Bát ăn inox 2 ngăn','bat-an-inox-2-ngan','Bát inox 304 cao cấp, 2 ngăn ăn và uống tích hợp, đế cao su chống trượt, dễ vệ sinh.',75000,90000,45,201,''],
    ['phu-kien','Lồng vận chuyển mèo có bánh xe','long-van-chuyen-meo-co-banh','Lồng nhựa ABS cứng, có bánh xe kéo, cửa lưới thoáng khí, size M phù hợp mèo 3-6kg.',420000,520000,18,42,'HOT'],
    // Đồ chơi
    ['do-choi','Bóng cao su đặc siêu bền','bong-cao-su-dac-sieu-ben','Bóng cao su tự nhiên 100%, an toàn cho thú cưng, chịu lực cắn mạnh, nổi trên nước.',65000,null,80,312,'HOT'],
    ['do-choi','Cần câu lông vũ cho mèo','can-cau-long-vu-meo','Cần câu lông vũ màu sắc bắt mắt, kích thích bản năng săn mồi, giúp mèo vận động.',35000,null,120,489,'NEW'],
    ['do-choi','Đồ chơi chuột kêu cho mèo','do-choi-chuot-keu-meo','Đồ chơi hình chuột có tiếng kêu khi cắn, chất liệu vải bông an toàn, nhiều màu sắc.',28000,null,90,267,''],
    ['do-choi','Vòng tròn đuổi bóng tương tác','vong-tron-duoi-bong-tuong-tac','Đường đua tròn 2 tầng kèm bóng, kích thích mèo vận động, lắp ráp dễ dàng.',180000,220000,35,88,''],
    // Sức khỏe
    ['suc-khoe','Vitamin tổng hợp cho mèo 60 viên','vitamin-tong-hop-meo-60-vien','Bổ sung vitamin A, D, E và khoáng chất thiết yếu, tăng đề kháng, làm đẹp lông cho mèo.',180000,220000,40,156,'HOT'],
    ['suc-khoe','Men tiêu hóa cho chó mèo','men-tieu-hoa-cho-meo','Hỗ trợ tiêu hóa, giảm tiêu chảy, tăng hấp thụ dinh dưỡng, dạng bột dễ trộn vào thức ăn.',95000,110000,55,98,''],
    ['suc-khoe','Dầu gội thú cưng hương lavender','dau-goi-thu-cung-lavender','Dầu gội nhẹ nhàng pH 7.0, an toàn cho da nhạy cảm, kháng khuẩn, hương thơm dịu nhẹ.',120000,null,35,67,'NEW'],
    ['suc-khoe','Thuốc nhỏ gáy trị ve rận cho mèo','thuoc-nho-gay-tri-ve-ran-meo','Dung dịch nhỏ gáy diệt ve, rận, bọ chét hiệu quả trong 30 ngày, an toàn tuyệt đối.',85000,95000,70,234,''],
    // Chuồng & Nhà
    ['chuong','Nhà gỗ thông cho mèo 2 tầng','nha-go-thong-meo-2-tang','Nhà gỗ thông tự nhiên không sơn, 2 tầng, đệm mềm tháo giặt được, thiết kế cute dễ thương.',850000,1000000,15,45,'HOT'],
    ['chuong','Chuồng inox gấp gọn size M','chuong-inox-gap-gon-size-m','Chuồng inox 304 chắc chắn, gấp gọn tiện lợi, kích thước 60x42x48cm, phù hợp chó nhỏ và vừa.',650000,750000,20,38,''],
    ['chuong','Đệm ngủ tròn lông cừu giả 50cm','dem-ngu-tron-long-cuu-50cm','Đệm ngủ tròn ấm áp, lông cừu giả mềm mại, đường kính 50cm, có thể giặt máy.',220000,280000,40,123,'SALE'],
    ['chuong','Ổ nằm hình kén cho mèo','o-nam-hinh-ken-meo','Ổ nằm hình kén đặc biệt tạo cảm giác an toàn cho mèo, chất liệu cotton mềm, có thể treo.',195000,240000,25,67,'NEW'],
  ];

  // Insert từng sản phẩm với category_id lookup
  for (const [catSlug, name, slug, description, price, original_price, stock, sold, badge] of prData) {
    const [[cat]] = await conn.query('SELECT id FROM categories WHERE slug=?', [catSlug]);
    await conn.query(
      'INSERT INTO products (category_id,name,slug,description,price,original_price,stock,sold,badge,is_active) VALUES (?,?,?,?,?,?,?,?,?,1)',
      [cat.id, name, slug, description, price, original_price || null, stock, sold, badge || null]
    );
  }
  const [prods] = await conn.query("SELECT id,name,price FROM products");
  console.log(`   ✓ ${prods.length} products`);

  // ── 5. ORDERS (20) ────────────────────────────────────────
  console.log('🛒 Tạo orders...');
  const statuses = ['delivered','delivered','delivered','delivered','delivered','delivered','delivered','delivered',
                    'shipping','shipping','shipping','confirmed','confirmed','confirmed',
                    'pending','pending','pending','cancelled','cancelled','delivered'];
  const addresses = [
    '12 Nguyễn Huệ, Q.1, TP.HCM',       '45 Lê Lợi, Q.3, TP.HCM',
    '78 Trần Hưng Đạo, Hoàn Kiếm, HN',  '23 Đinh Tiên Hoàng, Q.1, TP.HCM',
    '56 Hai Bà Trưng, Q.1, TP.HCM',      '90 Cầu Giấy, HN',
    '34 Lê Duẩn, Q.1, TP.HCM',           '67 Nguyễn Trãi, Q.5, TP.HCM',
    '89 Phan Xích Long, Phú Nhuận',       '11 Hoàng Diệu, Đà Nẵng',
    '33 Hùng Vương, Hải Phòng',           '55 Lý Thường Kiệt, Đà Nẵng',
    '77 Trần Phú, Nha Trang',             '99 Điện Biên Phủ, Bình Thạnh',
    '21 Võ Văn Tần, Q.3, TP.HCM',        '43 Nguyễn Đình Chiểu, Q.3',
    '65 Pasteur, Q.1, TP.HCM',            '87 Nam Kỳ Khởi Nghĩa, Q.1',
    '19 Tôn Đức Thắng, Q.1, TP.HCM',    '31 Bến Chương Dương, Q.1',
  ];

  for (let i = 0; i < 20; i++) {
    const u    = users[i % users.length];
    const st   = statuses[i];
    const paid = st==='delivered'?'paid':st==='cancelled'?'unpaid':(Math.random()>0.5?'paid':'unpaid');
    const daysAgo = Math.max(0, 30 - i * 1.4 | 0);
    const code = `PS${Date.now().toString().slice(-5)}${String(i).padStart(2,'0')}`;
    const method = i%2===0?'cod':'vnpay';

    const orderProds = [...prods].sort(()=>Math.random()-0.5).slice(0, Math.floor(Math.random()*3)+1);
    const items = orderProds.map(p=>({ p, qty: Math.floor(Math.random()*2)+1 }));
    const total = items.reduce((s,{p,qty})=>s+p.price*qty,0);

    const [res] = await conn.query(
      `INSERT INTO orders (order_code,user_id,receiver_name,receiver_phone,address,subtotal,total,status,payment_method,payment_status,note,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [code,u.id,u.name,`090${String(1234560+i).padStart(7,'0')}`,addresses[i],
       total,total,st,method,paid,i%4===0?'Giao giờ hành chính':null,daysAgo]
    );
    for (const {p,qty} of items) {
      await conn.query(
        'INSERT INTO order_items (order_id,product_id,name,price,quantity,subtotal) VALUES (?,?,?,?,?,?)',
        [res.insertId,p.id,p.name,p.price,qty,p.price*qty]
      );
      if(st==='delivered') await conn.query('UPDATE products SET sold=sold+? WHERE id=?',[qty,p.id]);
    }
  }
  const [[{c: oCount}]] = await conn.query('SELECT COUNT(*) AS c FROM orders');
  console.log(`   ✓ ${oCount} orders`);

  // ── 6. REVIEWS (20) ───────────────────────────────────────
  console.log('⭐ Tạo reviews...');
  const rvData = [
    [5,'Thú cưng của tôi rất thích!','Mua về bé nhà tôi mê lắm, ăn ngon miệng hơn hẳn. Giao hàng nhanh, đóng gói cẩn thận.'],
    [5,'Chất lượng tốt lắm','Sản phẩm đúng mô tả, chất liệu an toàn cho thú cưng. Sẽ mua lại!'],
    [4,'Bé nhà mình thích','Mua về bé chơi cả ngày. Đáng đồng tiền, giao hàng ổn.'],
    [5,'Tin tưởng shop lâu năm','Mua nhiều lần rồi, lần nào cũng hài lòng. Shop uy tín!'],
    [4,'Khá ổn cho giá tiền','Sản phẩm dùng tốt, không có gì phải phàn nàn. Shipper nhiệt tình.'],
    [5,'Mèo nhà mình ghiền luôn','Đã mua lần đầu thấy tốt nên mua thêm. Giá cạnh tranh, chất lượng đảm bảo.'],
    [3,'Tạm được','Sản phẩm ổn nhưng size hơi nhỏ hơn hình. Chất liệu chấp nhận được.'],
    [5,'Giao nhanh, chất lượng','Đặt tối, sáng hôm sau nhận được. Sản phẩm y như mô tả!'],
    [4,'Đẹp và an toàn','Thiết kế đáng yêu, màu sắc bắt mắt. Bé nhà mình thích chơi mỗi ngày.'],
    [5,'5 sao không đắn đo','Hàng chính hãng, tem nhãn rõ ràng. Dịch vụ hỗ trợ nhiệt tình.'],
    [4,'Chất lượng tốt','Chất liệu tốt hơn mình nghĩ. Hướng dẫn sử dụng rõ ràng.'],
    [5,'Hoàn hảo cho mèo nhà tôi','Mua thêm cái thứ 3 rồi, lần nào cũng tốt!'],
    [3,'Bình thường','Không tệ nhưng cũng không xuất sắc. Có thể cải thiện phần đóng gói.'],
    [5,'Mua cho cả đàn mèo','Mua 3 cái cho 3 bé, bé nào cũng thích. Giá tốt khi mua số lượng.'],
    [4,'Đáng mua','So với cùng giá thì cái này chất lượng hơn hẳn. Recommend!'],
    [5,'Bé ăn ngon miệng hơn','Trước hay biếng ăn, dùng sản phẩm này bé ăn rất tốt.'],
    [4,'Ổn định, không lo hỏng','Dùng 2 tháng rồi vẫn tốt. Chất liệu bền.'],
    [5,'Hài lòng 100%','Từ sản phẩm đến dịch vụ đều rất tốt. Cảm ơn shop!'],
    [4,'Chất lượng tốt','Màu sắc đẹp như hình. Bé nhà mình ngủ ngon trong này.'],
    [5,'Xuất sắc!','Không có gì để chê. Sẽ giới thiệu bạn bè có nuôi thú cưng mua ở đây.'],
  ];
  let rCount = 0;
  for (let i = 0; i < 20; i++) {
    const prod = prods[i % prods.length];
    const u    = users[i % users.length];
    const [rating, title, comment] = rvData[i];
    try {
      await conn.query(
        'INSERT IGNORE INTO reviews (product_id,user_id,rating,title,comment,created_at) VALUES (?,?,?,?,?,DATE_SUB(NOW(),INTERVAL ? DAY))',
        [prod.id, u.id, rating, title, comment, Math.floor(Math.random()*30)]
      );
      rCount++;
    } catch(e) {}
  }
  console.log(`   ✓ ${rCount} reviews`);

  // ── 7. VOUCHERS (10 mã) ───────────────────────────────────
  console.log('🎟️  Tạo vouchers...');
  const voucherData = [
    ['WELCOME10',  'percent', 10,       0,        100, null,                               1],
    ['SALE20',     'percent', 20,  200000,         50, '2026-12-31 23:59:59',              1],
    ['FREESHIP',   'fixed',   30000,    0,        200, '2026-06-30 23:59:59',              1],
    ['VIP30',      'percent', 30,  500000,         20, '2026-09-30 23:59:59',              1],
    ['FLASH50K',   'fixed',   50000, 300000,       30, '2026-04-30 23:59:59',              1],
    ['SUMMER15',   'percent', 15,  150000,         80, '2026-08-31 23:59:59',              1],
    ['NEWPET',     'fixed',   20000,    0,        999, null,                               1],
    ['BLACKFRI',   'percent', 40, 1000000,         10, '2025-11-30 23:59:59',              0],
    ['TETHOLIDAY', 'percent', 25,  300000,         15, '2026-02-10 23:59:59',              0],
    ['PETLOVER',   'fixed',  100000, 800000,         5, '2026-12-31 23:59:59',             1],
  ];
  const usedCounts = [45, 12, 88, 7, 22, 33, 0, 10, 15, 2];
  for (let i = 0; i < voucherData.length; i++) {
    const [code, type, value, min_order, max_uses, expires_at, is_active] = voucherData[i];
    await conn.query(
      'INSERT INTO vouchers (code,type,value,min_order,max_uses,used_count,expires_at,is_active) VALUES (?,?,?,?,?,?,?,?)',
      [code, type, value, min_order, max_uses, usedCounts[i], expires_at, is_active]
    );
  }
  console.log(`   ✓ ${voucherData.length} vouchers`);

  // ── 8. MESSAGES (12 tin nhắn về thú cưng) ────────────────
  console.log('💬 Tạo messages...');
  const msgData = [
    ['Nguyễn Văn An',  'an.nguyen@gmail.com',  '0901234567', 'Hỏi về bảo hành',       'Mua nhà gỗ cho mèo 2 tháng trước bị bong keo, shop hỗ trợ bảo hành như thế nào ạ?',                null,                                                                           1, 5],
    ['Trần Thị Bình',  'binh.tran@gmail.com',  '0912345678', 'Đổi trả sản phẩm',      'Tôi mua vòng cổ size S nhưng muốn đổi sang M, shop có hỗ trợ đổi không ạ?',                         'Dạ shop hỗ trợ đổi trong 7 ngày ạ, chị liên hệ hotline 1800-5678 để được hỗ trợ nhanh nhé!', 1, 12],
    ['Lê Văn Cường',   'cuong.le@gmail.com',   '0923456789', 'Giao hàng chậm',         'Đơn hàng PS-20240315 đặt 5 ngày rồi chưa thấy ship, cho hỏi bao giờ giao vậy ạ?',                  'Dạ anh ơi, đơn của anh đang trên đường giao, dự kiến 1-2 ngày tới sẽ nhận được ạ!',          1, 8],
    ['Phạm Thị Dung',  'dung.pham@gmail.com',  '0934567890', 'Tư vấn thức ăn',         'Mèo nhà tôi 2 tuổi hay biếng ăn, shop tư vấn giúp loại thức ăn nào kích thích ăn ngon nhé?',       null,                                                                           0, 2],
    ['Hoàng Văn Em',   'em.hoang@gmail.com',   '0945678901', 'Lỗi thanh toán VNPay',   'Tôi thanh toán qua VNPay bị trừ tiền rồi nhưng đơn hàng vẫn hiện chưa thanh toán, xử lý giúp!',    'Anh cho em xin mã đơn hàng, em kiểm tra và hoàn tiền ngay trong ngày ạ.',                    1, 1],
    ['Vũ Thị Phương',  'phuong.vu@gmail.com',  '0956789012', 'Hỏi mã giảm giá',        'Shop có mã giảm giá cho lần đầu mua hàng không ạ? Em muốn mua thức ăn cho mèo.',                    'Dạ chị dùng mã WELCOME10 để giảm 10% cho đơn đầu tiên nha! Hoặc NEWPET giảm 20k ạ.',         1, 4],
    ['Đặng Văn Giang', 'giang.dang@gmail.com', '0967890123', 'Sản phẩm bị lỗi',        'Mua đồ chơi về bị bong phần nhựa sau 1 tuần dùng, shop gửi đổi cái khác giúp mình không?',         null,                                                                           0, 1],
    ['Bùi Thị Hà',     'ha.bui@gmail.com',     '0978901234', 'Hợp tác bán hàng',       'Tôi muốn hợp tác làm đại lý bán sản phẩm thú cưng của shop tại Hà Nội, liên hệ ai ạ?',             'Dạ chị gửi thông tin qua email business@pawshop.vn để bộ phận kinh doanh liên hệ lại ạ.',    1, 15],
    ['Đỗ Văn Hùng',    'hung.do@gmail.com',    '0989012345', 'Không nhận được hàng',   'Ứng dụng báo đã giao hàng nhưng tôi không nhận được, địa chỉ của tôi đúng rồi.',                   null,                                                                           0, 3],
    ['Ngô Thị Khanh',  'khanh.ngo@gmail.com',  '0990123456', 'Khen sản phẩm',          'Muốn nhắn shop là sản phẩm rất tốt, bé nhà mình rất thích. Giao nhanh, đóng gói cẩn thận!',        'Dạ cảm ơn chị rất nhiều! Chúng em sẽ cố gắng phục vụ tốt hơn nữa ạ 🐾',                    1, 20],
    ['Đinh Văn Long',  'long.dinh@gmail.com',  '0901234000', 'Hỏi kích thước chuồng',  'Chuồng inox size M kích thước bao nhiêu cm vậy shop? Muốn biết có vừa ban công nhà tôi không.',     null,                                                                           0, 6],
    ['Lý Thị Mai',     'mai.ly@gmail.com',     '0912340001', 'Chế độ dinh dưỡng',      'Shop có tư vấn chế độ dinh dưỡng cho chó con 3 tháng tuổi không ạ? Không biết cho ăn gì.',         'Dạ chó con 3 tháng nên dùng thức ăn dành riêng cho puppy chị ơi! Shop có Royal Canin Puppy ạ.',1, 9],
  ];
  for (const [name, email, phone, subject, message, reply, is_read, daysAgo] of msgData) {
    await conn.query(
      `INSERT INTO messages (name,email,phone,subject,message,reply,replied_at,is_read,created_at) VALUES (?,?,?,?,?,?,${reply ? 'DATE_SUB(NOW(),INTERVAL ? DAY)' : 'NULL'},?,DATE_SUB(NOW(),INTERVAL ? DAY))`,
      reply
        ? [name, email, phone, subject, message, reply, daysAgo - 0.5, 1, daysAgo]
        : [name, email, phone, subject, message, null, is_read, daysAgo]
    );
  }
  console.log(`   ✓ ${msgData.length} messages`);

  // ── 9. SETTINGS ───────────────────────────────────────────
  console.log('⚙️  Tạo settings...');
  const settingsData = [
    ['shop_name',        'PawShop'],
    ['shop_slogan',      'Yêu thương thú cưng mỗi ngày — Sản phẩm chất lượng, giá tốt nhất'],
    ['shop_email',       'support@pawshop.vn'],
    ['shop_phone',       '1800 5678'],
    ['shop_address',     '123 Nguyễn Đình Chiểu, Quận 3, TP. Hồ Chí Minh'],
    ['shop_facebook',    'https://facebook.com/pawshop.vn'],
    ['shop_instagram',   'https://instagram.com/pawshop.vn'],
    ['shop_youtube',     'https://youtube.com/@pawshop'],
    ['shop_tiktok',      'https://tiktok.com/@pawshop.vn'],
    ['free_ship_min',    '300000'],
    ['default_note',     'Vui lòng kiểm tra hàng trước khi nhận. Cảm ơn bạn đã mua hàng tại PawShop! 🐾'],
    ['maintenance_mode', '0'],
  ];
  for (const [key, value] of settingsData) {
    await conn.query(
      'INSERT INTO settings (`key`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=?',
      [key, value, value]
    );
  }
  console.log(`   ✓ ${settingsData.length} settings`);

  console.log('\n✅ Seed PawShop hoàn tất!');
  console.log('─────────────────────────────────────');
  console.log('  🔑 Admin : admin@pawshop.vn / admin123');
  console.log('  👤 User  : user@pawshop.vn  / user123');
  console.log('  📦 20 sản phẩm thú cưng');
  console.log('  🐾 5 danh mục: Thức Ăn, Phụ Kiện, Đồ Chơi, Sức Khỏe, Chuồng & Nhà');
  console.log('─────────────────────────────────────');
  await conn.end();
}
seed().catch(err => { console.error('❌', err.message); process.exit(1); });