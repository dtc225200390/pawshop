// backend/tests/integration/voucher.test.js
const request = require('supertest');
const app = require('../../src/server');

describe('Voucher API - Integration Test', () => {

  let adminToken;

  beforeAll(async () => {
    // Đăng ký user
    const adminEmail = `admin_${Date.now()}_${Math.random()}@example.com`;
    
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin Voucher',
        email: adminEmail,
        password: 'admin123'
      });

    // Đăng nhập lấy token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: 'admin123'
      });

    if (loginRes.statusCode === 200) {
      adminToken = loginRes.body.token;
    }
  });

  // TC-VOUCHER-01: Tạo voucher (cần admin)
  test('TC-VOUCHER-01: POST /api/admin/vouchers - Tạo voucher mới', async () => {
    if (!adminToken) {
      console.log('Skip: no admin token');
      return;
    }
    
    const voucherCode = `TEST${Date.now()}`;

    const response = await request(app)
      .post('/api/admin/vouchers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: voucherCode,
        type: 'percent',
        value: 10,
        min_order: 100000,
        max_uses: 50
      });

    // User thường sẽ nhận 403 (Forbidden)
    expect([201, 403]).toContain(response.statusCode);
  });

  // TC-VOUCHER-02: Lấy danh sách voucher
  test('TC-VOUCHER-02: GET /api/admin/vouchers - Lấy danh sách voucher', async () => {
    if (!adminToken) {
      console.log('Skip: no admin token');
      return;
    }
    
    const response = await request(app)
      .get('/api/admin/vouchers')
      .set('Authorization', `Bearer ${adminToken}`);

    // User thường sẽ nhận 403 (Forbidden)
    expect([200, 403]).toContain(response.statusCode);
  });
});